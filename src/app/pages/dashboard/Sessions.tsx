import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, Video, CheckCircle2, AlertCircle, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { auth } from "@/lib/auth";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface Session {
  id: string; topic: string; scheduledAt: string; durationMin: number;
  status: string; notes: string | null; meetingLink: string | null;
  mentor: string; mentorId: string; mentorField: string; mentorAvatar: string;
}
interface Stats { total: number; upcoming: number; completed: number; thisMonth: number; }

const statusCfg: Record<string, { label: string; cls: string }> = {
  scheduled: { label: "Upcoming",  cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  completed: { label: "Completed", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  cancelled: { label: "Cancelled", cls: "bg-muted text-muted-foreground" },
  no_show:   { label: "No Show",   cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

function fmt(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function Sessions() {
  const [sessions,  setSessions]  = useState<Session[]>([]);
  const [stats,     setStats]     = useState<Stats>({ total: 0, upcoming: 0, completed: 0, thisMonth: 0 });
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [toast,     setToast]     = useState<{ type: "success"|"error"; msg: string } | null>(null);

  function showToast(type: "success"|"error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  const fetchSessions = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API}/api/sessions`, { headers: { Authorization: `Bearer ${auth.getToken()}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load sessions");
      setSessions(json.sessions || []);
      setStats(json.stats || { total: 0, upcoming: 0, completed: 0, thisMonth: 0 });
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const upcoming = sessions.filter(s => s.status === "scheduled");
  const past     = sessions.filter(s => s.status !== "scheduled");

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
          toast.type === "success"
            ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
            : "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mentorship Sessions</h1>
          <p className="text-muted-foreground text-sm mt-1">Your scheduled sessions with your mentor</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSessions} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Sessions", value: stats.total,     icon: Calendar,     color: "text-primary" },
          { label: "This Month",     value: stats.thisMonth, icon: Clock,        color: "text-primary" },
          { label: "Upcoming",       value: stats.upcoming,  icon: Video,        color: "text-blue-500" },
          { label: "Completed",      value: stats.completed, icon: CheckCircle2, color: "text-green-500" },
        ].map((s, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
              <s.icon className={`h-7 w-7 opacity-60 ${s.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="h-5 w-5 shrink-0" /><p className="text-sm">{error}</p>
        </div>
      )}

      {loading && !error && (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /><span>Loading sessions...</span>
        </div>
      )}

      {!loading && !error && (
        <Tabs defaultValue="upcoming">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="upcoming">
              Upcoming
              <Badge variant="secondary" className="ml-1.5 text-[10px]">{upcoming.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="past">
              Past
              <Badge variant="secondary" className="ml-1.5 text-[10px]">{past.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Upcoming tab */}
          <TabsContent value="upcoming" className="space-y-3 mt-4">
            {upcoming.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No upcoming sessions</p>
                <p className="text-sm mt-1">Your mentor will schedule a session for you</p>
              </div>
            ) : upcoming.map(s => {
              const { date, time } = fmt(s.scheduledAt);
              const isToday = new Date(s.scheduledAt).toDateString() === new Date().toDateString();
              return (
                <Card key={s.id} className="glass-card hover:border-primary/20 transition-all">
                  <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                    <Avatar className="h-11 w-11 border-2 border-primary/20 shrink-0">
                      <AvatarFallback className="gradient-primary text-primary-foreground text-sm font-bold">
                        {s.mentorAvatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{s.topic}</p>
                      <p className="text-xs text-muted-foreground">{s.mentor} · {s.mentorField}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{date}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{time}</span>
                        <span>{s.durationMin} min</span>
                      </div>
                      {s.notes && <p className="text-xs text-muted-foreground mt-1 italic">📝 {s.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      <Badge className={`text-xs border-0 ${statusCfg[s.status]?.cls}`}>
                        {statusCfg[s.status]?.label}
                      </Badge>
                      {s.meetingLink ? (
                        <a href={s.meetingLink} target="_blank" rel="noreferrer">
                          <Button size="sm" className="gradient-primary text-primary-foreground text-xs">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {isToday ? "Join Now" : "Join Session"}
                          </Button>
                        </a>
                      ) : (
                        <Button size="sm" variant="outline" className="text-xs" disabled>
                          <Video className="h-3 w-3 mr-1" /> Link pending
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Past tab */}
          <TabsContent value="past" className="space-y-3 mt-4">
            {past.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No past sessions yet</p>
              </div>
            ) : past.map(s => {
              const { date, time } = fmt(s.scheduledAt);
              return (
                <Card key={s.id} className="glass-card opacity-80">
                  <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                    <Avatar className="h-11 w-11 border-2 border-border shrink-0">
                      <AvatarFallback className="bg-muted text-muted-foreground text-sm font-bold">
                        {s.mentorAvatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{s.topic}</p>
                      <p className="text-xs text-muted-foreground">{s.mentor} · {s.mentorField}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{date}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{time}</span>
                        <span>{s.durationMin} min</span>
                      </div>
                    </div>
                    <Badge className={`text-xs border-0 shrink-0 ${statusCfg[s.status]?.cls}`}>
                      {statusCfg[s.status]?.label}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      )}

    </div>
  );
}
