import { useState, useEffect, useRef } from "react";
import { Search, Star, MapPin, Briefcase, LayoutGrid, Map, Loader2, AlertCircle, CheckCircle2, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MentorMap, { type MentorLocation } from "@/components/dashboard/MentorMap";
import { auth } from "@/lib/auth";
import { useNavigate } from "react-router";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Button config per match status
const MATCH_STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string; disabled: boolean }> = {
  accepted: {
    label:     "Matched ✓",
    icon:      CheckCircle2,
    className: "w-full bg-green-600 text-white cursor-default opacity-90",
    disabled:  true,
  },
  pending: {
    label:     "Request Sent",
    icon:      Clock,
    className: "w-full bg-muted text-muted-foreground border border-border cursor-default",
    disabled:  true,
  },
  declined: {
    label:     "Request Match",
    icon:      Users,
    className: "w-full gradient-primary text-primary-foreground hover:opacity-90 transition-opacity",
    disabled:  false,
  },
  cancelled: {
    label:     "Request Match",
    icon:      Users,
    className: "w-full gradient-primary text-primary-foreground hover:opacity-90 transition-opacity",
    disabled:  false,
  },
  none: {
    label:     "Request Match",
    icon:      Users,
    className: "w-full gradient-primary text-primary-foreground hover:opacity-90 transition-opacity",
    disabled:  false,
  },
};

export default function MentorMatching() {
  const navigate = useNavigate();
  const [view, setView]               = useState<"grid" | "map">("grid");
  const [mapMounted, setMapMounted]   = useState(false);
  const [mentors, setMentors]         = useState<MentorLocation[]>([]);
  const [matchStatuses, setMatchStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [field, setField]             = useState('all');
  const [county, setCounty]           = useState('all');
  const [toast, setToast]             = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const mapWrapperRef                 = useRef<HTMLDivElement>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  // Fetch match statuses for the logged-in user
  async function fetchMatchStatuses() {
    if (!auth.isLoggedIn()) return;
    try {
      const res = await fetch(`${API_BASE}/api/mentors/my-requests`, {
        headers: { Authorization: `Bearer ${auth.getToken()}` },
      });
      if (res.ok) {
        const json = await res.json();
        setMatchStatuses(json.requests || {});
      }
    } catch { /* non-critical */ }
  }

  // Fetch mentors from backend
  useEffect(() => {
    const controller = new AbortController();

    async function fetchMentors() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (search)              params.set('search', search);
        if (field  !== 'all')   params.set('field',  field);
        if (county !== 'all')   params.set('county', county);

        const res = await fetch(`${API_BASE}/api/mentors?${params}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const json = await res.json();
        setMentors(json.mentors || []);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError('Could not load mentors. Please try again.');
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    }

    // Debounce search input
    const timer = setTimeout(fetchMentors, search ? 400 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, field, county]);

  // Fetch match statuses on mount
  useEffect(() => { fetchMatchStatuses(); }, []);

  const handleViewChange = (v: "grid" | "map") => {
    setView(v);
    if (v === "map") setMapMounted(true);
  };

  useEffect(() => {
    if (view === "map") {
      const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 50);
      return () => clearTimeout(t);
    }
  }, [view]);

  async function handleCancelMatch(mentorId: string, mentorName: string) {
    if (!confirm(`Cancel your match with ${mentorName}? You can request a new mentor after.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/mentors/${mentorId}/cancel-match`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${auth.getToken()}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showToast("success", `Match with ${mentorName} cancelled. You can now request a new mentor.`);
      fetchMatchStatuses();
    } catch (err: any) {
      showToast("error", err.message);
    }
  }

  async function handleRequestMatch(mentorId: string, mentorName: string) {
    if (!auth.isLoggedIn()) {
      navigate("/login");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/mentors/${mentorId}/request-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify({ message: `I'd like to connect with ${mentorName} as my mentor.` }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showToast("success", json.message);
      // Refresh statuses so button updates immediately
      fetchMatchStatuses();
    } catch (err: any) {
      showToast("error", err.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all animate-in slide-in-from-bottom-4 ${
          toast.type === "success"
            ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
            : "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
        }`}>
          {toast.type === "success"
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <AlertCircle className="h-4 w-4 shrink-0" />}
          {toast.msg}
        </div>
      )}
      {/* Header + view toggle */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Find Your Mentor</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Connect with experienced mentors who align with your goals
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border/50">
          <button
            onClick={() => handleViewChange("grid")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              view === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-4 w-4" /> List
          </button>
          <button
            onClick={() => handleViewChange("map")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              view === "map" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Map className="h-4 w-4" /> Map
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, expertise..."
            className="pl-10 bg-muted/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={field} onValueChange={setField}>
          <SelectTrigger className="w-full sm:w-[180px] bg-muted/50">
            <SelectValue placeholder="Career Field" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fields</SelectItem>
            <SelectItem value="career">Career Development</SelectItem>
            <SelectItem value="mental">Mental Health</SelectItem>
            <SelectItem value="tech">Engineering & Tech</SelectItem>
            <SelectItem value="faith">Relationships & Faith</SelectItem>
            <SelectItem value="fitness">Fitness & Discipline</SelectItem>
            <SelectItem value="education">Education</SelectItem>
            <SelectItem value="finance">Business & Finance</SelectItem>
          </SelectContent>
        </Select>
        <Select value={county} onValueChange={setCounty}>
          <SelectTrigger className="w-full sm:w-[160px] bg-muted/50">
            <SelectValue placeholder="County" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Counties</SelectItem>
            <SelectItem value="kisumu">Kisumu</SelectItem>
            <SelectItem value="nairobi">Nairobi</SelectItem>
            <SelectItem value="eldoret">Eldoret</SelectItem>
            <SelectItem value="mombasa">Mombasa</SelectItem>
            <SelectItem value="nakuru">Nakuru</SelectItem>
            <SelectItem value="nyeri">Nyeri</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading mentors...</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* MAP VIEW */}
      {!loading && !error && view === "map" && mapMounted && (
        <div ref={mapWrapperRef} className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span>Showing {mentors.length} mentors across Kenya — click a pin to view details</span>
          </div>
          <div className="w-full rounded-xl overflow-hidden border border-border/50 shadow-lg" style={{ height: 500 }}>
            <MentorMap
              mentors={mentors}
              matchStatuses={matchStatuses}
              onSelectMentor={(m) => handleRequestMatch((m as any).id, m.name)}
              onCancelMatch={(m)  => handleCancelMatch((m as any).id, m.name)}
            />
          </div>
        </div>
      )}

      {/* GRID VIEW */}
      {!loading && !error && view === "grid" && (
        <>
          {mentors.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg font-medium">No mentors found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {mentors.map((m, i) => (
                <Card key={(m as any).id || i} className="glass-card hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="h-14 w-14 border-2 border-primary/30">
                        <AvatarFallback className="gradient-primary text-primary-foreground font-bold">
                          {m.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{m.name}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Briefcase className="h-3 w-3" /> {m.field}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {m.county}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{m.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{m.bio}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {m.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                      <Badge variant="outline" className="text-xs">{m.sessions} sessions</Badge>
                    </div>
                    {(() => {
                      const mentorId = (m as any).id;
                      const status   = matchStatuses[mentorId] || "none";
                      const cfg      = MATCH_STATUS_CONFIG[status] || MATCH_STATUS_CONFIG.none;
                      const Icon     = cfg.icon;

                      // Accepted or pending — show action button + cancel/unmatch
                      if (status === "accepted" || status === "pending") {
                        return (
                          <div className="flex gap-2">
                            <div className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium ${cfg.className}`}>
                              <Icon className="h-4 w-4 shrink-0" />
                              {cfg.label}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 shrink-0"
                              onClick={() => handleCancelMatch(mentorId, m.name)}
                            >
                              {status === "accepted" ? "Unmatch" : "Cancel"}
                            </Button>
                          </div>
                        );
                      }

                      return (
                        <Button
                          className={cfg.className}
                          disabled={cfg.disabled}
                          onClick={() => !cfg.disabled && handleRequestMatch(mentorId, m.name)}
                        >
                          <Icon className="h-4 w-4 mr-2 shrink-0" />
                          {cfg.label}
                        </Button>
                      );
                    })()}                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
