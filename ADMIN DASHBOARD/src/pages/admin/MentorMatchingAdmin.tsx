import { useEffect, useState, useCallback } from "react";
import {
  Link2, Unlink, Clock, CheckCircle2, XCircle, Loader2,
  AlertCircle, RefreshCw, UserPlus, Pencil, Trash2, Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ── Types ──────────────────────────────────────────────────────────
interface Stats { activeMatches: number; pendingRequests: number; endedMatches: number; avgSessionsPerMatch: number; }

interface MatchRequest {
  id: string; status: string; message: string; mentee_username: string;
  requested_field: string; preferences: string; created_at: string;
  mentor?: { id: string; display_name: string; field: string; county: string; avatar_initials: string };
}

interface Match {
  id: string; mentee: string; mentor: string; mentorId: string;
  field: string; status: string; since: string; sessions: number;
}

interface Mentor {
  id: string; display_name: string; field: string; county: string;
  bio: string; tags: string[]; lat: number | null; lng: number | null;
  avatar_initials: string; rating: number; total_sessions: number;
  is_available: boolean; is_verified: boolean;
}

interface MentorForm {
  display_name: string; field: string; county: string; bio: string;
  tags: string; lat: string; lng: string; avatar_initials: string; is_available: boolean;
}

const EMPTY_FORM: MentorForm = {
  display_name: "", field: "", county: "", bio: "", tags: "",
  lat: "", lng: "", avatar_initials: "", is_available: true,
};

const FIELDS = ["Career Development","Mental Health","Engineering & Tech","Relationships & Faith",
  "Fitness & Discipline","Education & Academics","Business & Finance","Financial Literacy"];

// All 47 Kenya counties with approximate coordinates
const KENYA_COUNTIES: Record<string, { lat: number; lng: number }> = {
  "Baringo":        { lat:  0.4730, lng: 35.9737 },
  "Bomet":          { lat: -0.7820, lng: 35.3412 },
  "Bungoma":        { lat:  0.5635, lng: 34.5606 },
  "Busia":          { lat:  0.4608, lng: 34.1116 },
  "Elgeyo-Marakwet":{ lat:  0.9000, lng: 35.5000 },
  "Embu":           { lat: -0.5300, lng: 37.4500 },
  "Garissa":        { lat: -0.4532, lng: 39.6461 },
  "Homa Bay":       { lat: -0.5273, lng: 34.4571 },
  "Isiolo":         { lat:  0.3540, lng: 37.5820 },
  "Kajiado":        { lat: -1.8520, lng: 36.7760 },
  "Kakamega":       { lat:  0.2827, lng: 34.7519 },
  "Kericho":        { lat: -0.3690, lng: 35.2863 },
  "Kiambu":         { lat: -1.0310, lng: 36.8300 },
  "Kilifi":         { lat: -3.5107, lng: 39.9093 },
  "Kirinyaga":      { lat: -0.5590, lng: 37.2830 },
  "Kisii":          { lat: -0.6817, lng: 34.7667 },
  "Kisumu":         { lat: -0.0917, lng: 34.7679 },
  "Kitui":          { lat: -1.3667, lng: 38.0167 },
  "Kwale":          { lat: -4.1740, lng: 39.4520 },
  "Laikipia":       { lat:  0.3600, lng: 36.7800 },
  "Lamu":           { lat: -2.2694, lng: 40.9020 },
  "Machakos":       { lat: -1.5177, lng: 37.2634 },
  "Makueni":        { lat: -1.8036, lng: 37.6236 },
  "Mandera":        { lat:  3.9366, lng: 41.8670 },
  "Marsabit":       { lat:  2.3284, lng: 37.9899 },
  "Meru":           { lat:  0.0467, lng: 37.6490 },
  "Migori":         { lat: -1.0634, lng: 34.4731 },
  "Mombasa":        { lat: -4.0435, lng: 39.6682 },
  "Murang'a":       { lat: -0.7833, lng: 37.0333 },
  "Nairobi":        { lat: -1.2921, lng: 36.8219 },
  "Nakuru":         { lat: -0.3031, lng: 36.0800 },
  "Nandi":          { lat:  0.1833, lng: 35.1167 },
  "Narok":          { lat: -1.0833, lng: 35.8667 },
  "Nyamira":        { lat: -0.5667, lng: 34.9333 },
  "Nyandarua":      { lat: -0.1833, lng: 36.3667 },
  "Nyeri":          { lat: -0.4167, lng: 36.9500 },
  "Samburu":        { lat:  1.2167, lng: 36.9833 },
  "Siaya":          { lat: -0.0612, lng: 34.2422 },
  "Taita-Taveta":   { lat: -3.3167, lng: 38.3500 },
  "Tana River":     { lat: -1.0000, lng: 40.1167 },
  "Tharaka-Nithi":  { lat: -0.3000, lng: 37.8833 },
  "Trans Nzoia":    { lat:  1.0167, lng: 35.0000 },
  "Turkana":        { lat:  3.1167, lng: 35.5833 },
  "Uasin Gishu":    { lat:  0.5143, lng: 35.2698 },
  "Vihiga":         { lat:  0.0833, lng: 34.7167 },
  "Wajir":          { lat:  1.7471, lng: 40.0573 },
  "West Pokot":     { lat:  1.2500, lng: 35.1167 },
};

const statusColors: Record<string, string> = {
  accepted: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pending:  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  declined: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  cancelled:"bg-muted text-muted-foreground",
};

const getToken = () => localStorage.getItem("lh_admin_token") || "";

async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...opts.headers },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

// ── Component ──────────────────────────────────────────────────────
export default function MentorMatchingAdmin() {
  const [stats,    setStats]    = useState<Stats | null>(null);
  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [matches,  setMatches]  = useState<Match[]>([]);
  const [mentors,  setMentors]  = useState<Mentor[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  // Assign dialog
  const [assignOpen,   setAssignOpen]   = useState(false);
  const [assignReqId,  setAssignReqId]  = useState("");
  const [assignMentor, setAssignMentor] = useState("");
  const [assigning,    setAssigning]    = useState(false);

  // Add / Edit mentor dialog
  const [mentorDialogOpen, setMentorDialogOpen] = useState(false);
  const [editingMentor,    setEditingMentor]    = useState<Mentor | null>(null);
  const [form,             setForm]             = useState<MentorForm>(EMPTY_FORM);
  const [saving,           setSaving]           = useState(false);
  const [formError,        setFormError]        = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [s, r, m, men] = await Promise.all([
        apiFetch("/api/admin/matching/stats"),
        apiFetch("/api/admin/matching/requests"),
        apiFetch("/api/admin/matching/matches"),
        apiFetch("/api/admin/matching/mentors"),
      ]);
      setStats(s); setRequests(r.requests || []); setMatches(m.matches || []); setMentors(men.mentors || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Assign ────────────────────────────────────────────────────────
  async function handleAssign() {
    if (!assignMentor) return;
    setAssigning(true);
    try {
      await apiFetch(`/api/admin/matching/requests/${assignReqId}/assign`, {
        method: "PATCH", body: JSON.stringify({ mentorId: assignMentor }),
      });
      setAssignOpen(false); setAssignMentor(""); fetchAll();
    } catch (e: any) { alert(e.message); }
    finally { setAssigning(false); }
  }

  async function handleDecline(id: string) {
    if (!confirm("Decline this request?")) return;
    try {
      await apiFetch(`/api/admin/matching/requests/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: "declined" }) });
      fetchAll();
    } catch (e: any) { alert(e.message); }
  }

  async function handleUnmatch(id: string) {
    if (!confirm("End this match? This cannot be undone.")) return;
    try {
      await apiFetch(`/api/admin/matching/matches/${id}/unmatch`, { method: "DELETE" });
      fetchAll();
    } catch (e: any) { alert(e.message); }
  }

  // ── Mentor CRUD ───────────────────────────────────────────────────
  function openAddMentor() {
    setEditingMentor(null); setForm(EMPTY_FORM); setFormError(""); setMentorDialogOpen(true);
  }

  function openEditMentor(m: Mentor) {
    setEditingMentor(m);
    setForm({
      display_name: m.display_name, field: m.field, county: m.county,
      bio: m.bio || "", tags: (m.tags || []).join(", "),
      lat: m.lat?.toString() || "", lng: m.lng?.toString() || "",
      avatar_initials: m.avatar_initials || "", is_available: m.is_available,
    });
    setFormError(""); setMentorDialogOpen(true);
  }

  async function handleSaveMentor() {
    setFormError("");
    if (!form.display_name.trim() || !form.field || !form.county) {
      setFormError("Name, field, and county are required."); return;
    }
    setSaving(true);
    try {
      const payload = {
        display_name:    form.display_name.trim(),
        field:           form.field,
        county:          form.county,
        bio:             form.bio.trim() || null,
        tags:            form.tags.split(",").map(t => t.trim()).filter(Boolean),
        lat:             form.lat ? parseFloat(form.lat) : null,
        lng:             form.lng ? parseFloat(form.lng) : null,
        avatar_initials: form.avatar_initials.trim() || null,
        is_available:    form.is_available,
      };
      if (editingMentor) {
        await apiFetch(`/api/admin/matching/mentors/${editingMentor.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/api/admin/matching/mentors", { method: "POST", body: JSON.stringify(payload) });
      }
      setMentorDialogOpen(false); fetchAll();
    } catch (e: any) { setFormError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDeleteMentor(id: string, name: string) {
    if (!confirm(`Remove mentor "${name}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/admin/matching/mentors/${id}`, { method: "DELETE" });
      fetchAll();
    } catch (e: any) { alert(e.message); }
  }

  const pendingRequests = requests.filter(r => r.status === "pending");

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mentor Matching</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage mentors and mentor-mentee pairings</p>
        </div>
        <div className="flex gap-2">
          <Button className="gradient-primary text-primary-foreground" size="sm" onClick={openAddMentor}>
            <UserPlus className="h-4 w-4 mr-1" /> Add Mentor
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="h-5 w-5 shrink-0" /><p className="text-sm">{error}</p>
        </div>
      )}

      {loading && !error && (
        <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /><span>Loading...</span>
        </div>
      )}

      {!loading && !error && (
        <Tabs defaultValue="matching" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="matching">Matching</TabsTrigger>
            <TabsTrigger value="mentors">
              Mentors
              <Badge variant="secondary" className="ml-1.5 text-[10px]">{mentors.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* ── TAB: MATCHING ── */}
          <TabsContent value="matching" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Active Matches",     value: stats?.activeMatches ?? 0,       color: "text-primary" },
                { label: "Pending Requests",   value: stats?.pendingRequests ?? 0,     color: "text-yellow-500" },
                { label: "Ended",              value: stats?.endedMatches ?? 0,        color: "text-muted-foreground" },
                { label: "Avg Sessions/Match", value: stats?.avgSessionsPerMatch ?? 0, color: "text-primary" },
              ].map((s, i) => (
                <Card key={i} className="glass-card">
                  <CardContent className="p-4 text-center">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pending Requests */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" /> Pending Requests
                  {pendingRequests.length > 0 && (
                    <Badge className="ml-1 bg-yellow-100 text-yellow-700 border-0 text-xs">{pendingRequests.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No pending requests</p>
                ) : pendingRequests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="gradient-primary text-primary-foreground text-xs font-bold">
                          {(r.mentee_username || "??").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{r.mentee_username || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{r.requested_field}{r.preferences ? ` · ${r.preferences}` : ""}</p>
                        {r.message && <p className="text-xs text-muted-foreground italic mt-0.5">"{r.message}"</p>}
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" className="gradient-primary text-primary-foreground text-xs"
                        onClick={() => { setAssignReqId(r.id); setAssignMentor(""); setAssignOpen(true); }}>
                        <Link2 className="h-3 w-3 mr-1" /> Assign Mentor
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs text-destructive hover:text-destructive"
                        onClick={() => handleDecline(r.id)}>
                        <XCircle className="h-3 w-3 mr-1" /> Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* All Matches */}
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">All Matches</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mentee</TableHead><TableHead>Mentor</TableHead>
                      <TableHead>Field</TableHead><TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Since</TableHead>
                      <TableHead className="hidden md:table-cell">Sessions</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No matches found</TableCell></TableRow>
                    ) : matches.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium text-sm">{m.mentee}</TableCell>
                        <TableCell className="text-sm">{m.mentor}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{m.field}</Badge></TableCell>
                        <TableCell><Badge className={`text-xs border-0 ${statusColors[m.status] || ""}`}>{m.status}</Badge></TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{m.since}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{m.sessions}</TableCell>
                        <TableCell>
                          {m.status === "accepted" && (
                            <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive"
                              onClick={() => handleUnmatch(m.id)}>
                              <Unlink className="h-3 w-3 mr-1" /> Unmatch
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TAB: MENTORS ── */}
          <TabsContent value="mentors" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{mentors.length} mentor{mentors.length !== 1 ? "s" : ""} in database</p>
              <Button className="gradient-primary text-primary-foreground" size="sm" onClick={openAddMentor}>
                <UserPlus className="h-4 w-4 mr-1" /> Add Mentor
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {mentors.length === 0 ? (
                <div className="col-span-3 text-center py-16 text-muted-foreground">
                  <UserPlus className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No mentors yet</p>
                  <p className="text-sm mt-1">Click "Add Mentor" to get started</p>
                </div>
              ) : mentors.map((m) => (
                <Card key={m.id} className="glass-card hover:border-primary/30 transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-12 w-12 border-2 border-primary/20 shrink-0">
                        <AvatarFallback className="gradient-primary text-primary-foreground font-bold">
                          {m.avatar_initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{m.display_name}</p>
                        <p className="text-xs text-muted-foreground">{m.field}</p>
                        <p className="text-xs text-muted-foreground">📍 {m.county}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1 text-xs font-semibold">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{m.rating}
                        </div>
                        <Badge variant={m.is_available ? "secondary" : "outline"}
                          className={`text-[10px] ${m.is_available ? "text-green-600" : "text-muted-foreground"}`}>
                          {m.is_available ? "Available" : "Unavailable"}
                        </Badge>
                      </div>
                    </div>

                    {m.bio && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{m.bio}</p>}

                    {m.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {m.tags.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                      </div>
                    )}

                    <p className="text-[10px] text-muted-foreground mb-3">{m.total_sessions} sessions completed</p>

                    <Separator className="mb-3" />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openEditMentor(m)}>
                        <Pencil className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs text-destructive hover:text-destructive"
                        onClick={() => handleDeleteMentor(m.id, m.display_name)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* ── Assign Mentor Dialog ── */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Assign a Mentor</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Select an available mentor for this request.</p>
            <Select value={assignMentor} onValueChange={setAssignMentor}>
              <SelectTrigger><SelectValue placeholder="Choose a mentor..." /></SelectTrigger>
              <SelectContent>
                {mentors.filter(m => m.is_available).map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="font-medium">{m.display_name}</span>
                    <span className="text-xs text-muted-foreground ml-2">· {m.field} · {m.county}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handleAssign} disabled={!assignMentor || assigning}>
              {assigning ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add / Edit Mentor Dialog ── */}
      <Dialog open={mentorDialogOpen} onOpenChange={setMentorDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMentor ? "Edit Mentor" : "Add New Mentor"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {formError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0" />{formError}
              </div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Coach Amani" value={form.display_name}
                onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
            </div>

            {/* Field + County */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Field <span className="text-destructive">*</span></Label>
                <Select value={form.field} onValueChange={v => setForm(f => ({ ...f, field: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select field..." /></SelectTrigger>
                  <SelectContent>
                    {FIELDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>County <span className="text-destructive">*</span></Label>
                <Select
                  value={form.county}
                  onValueChange={(v) => {
                    const coords = KENYA_COUNTIES[v];
                    setForm(f => ({
                      ...f,
                      county: v,
                      lat: coords ? coords.lat.toString() : "",
                      lng: coords ? coords.lng.toString() : "",
                    }));
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select county..." /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {Object.keys(KENYA_COUNTIES).sort().map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.county && KENYA_COUNTIES[form.county] && (
                  <p className="text-xs text-muted-foreground">
                    📍 Coordinates auto-filled: {KENYA_COUNTIES[form.county].lat.toFixed(4)}, {KENYA_COUNTIES[form.county].lng.toFixed(4)}
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <Label>Bio</Label>
              <Textarea placeholder="Short description of the mentor's background and expertise..."
                rows={3} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <Label>Tags <span className="text-xs text-muted-foreground">(comma-separated)</span></Label>
              <Input placeholder="e.g. Leadership, Career, Networking" value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
            </div>

            {/* Avatar initials */}
            <div className="space-y-1.5">
              <Label>Avatar Initials <span className="text-xs text-muted-foreground">(auto-generated if blank)</span></Label>
              <Input maxLength={2} placeholder="e.g. CA" value={form.avatar_initials}
                onChange={e => setForm(f => ({ ...f, avatar_initials: e.target.value.toUpperCase() }))} />
            </div>

            {/* Available toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">Available for matching</p>
                <p className="text-xs text-muted-foreground">Mentees can send match requests</p>
              </div>
              <Switch checked={form.is_available} onCheckedChange={v => setForm(f => ({ ...f, is_available: v }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMentorDialogOpen(false)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handleSaveMentor} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              {editingMentor ? "Save Changes" : "Add Mentor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
