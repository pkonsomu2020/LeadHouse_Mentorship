import { useEffect, useState, useCallback } from "react";
import {
  Calendar, Clock, CheckCircle2, AlertCircle, Loader2,
  RefreshCw, Video, Plus, Link, Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const getToken = () => localStorage.getItem("lh_admin_token") || "";

async function apiFetch(path: string, opts: RequestInit = {}) {
  const res  = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...opts.headers },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || json.errors?.[0]?.msg || `HTTP ${res.status}`);
  return json;
}

interface Session {
  id: string; topic: string; scheduledAt: string; durationMin: number;
  status: string; notes: string | null; meetingLink: string | null;
  mentor: string; mentorAvatar: string; mentorField: string; menteeId: string;
}
interface Stats { total: number; upcoming: number; completed: number; thisMonth: number; }
interface Match {
  id: string; mentee_id: string; mentee_username: string;
  mentor: { id: string; display_name: string; field: string; avatar_initials: string };
}

const statusCfg: Record<string, { label: string; cls: string }> = {
  scheduled: { label: "Upcoming",  cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  completed: { label: "Completed", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  cancelled: { label: "Cancelled", cls: "bg-muted text-muted-foreground" },
  no_show:   { label: "No Show",   cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

function fmt(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
}

const EMPTY_FORM = { matchId: "", topic: "", date: "", time: "", duration: "60", meetingLink: "", notes: "" };

export default function SessionsManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats,    setStats]    = useState<Stats>({ total: 0, upcoming: 0, completed: 0, thisMonth: 0 });
  const [matches,  setMatches]  = useState<Match[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [toast,    setToast]    = useState<{ type: "success"|"error"; msg: string } | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [bookOpen, setBookOpen] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);

  function showToast(type: "success"|"error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  const fetchSessions = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const json = await apiFetch("/api/admin/sessions");
      setSessions(json.sessions || []);
      setStats(json.stats || { total: 0, upcoming: 0, completed: 0, thisMonth: 0 });
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const fetchMatches = useCallback(async () => {
    try {
      const json = await apiFetch("/api/admin/sessions/matches");
      setMatches(json.matches || []);
    } catch {}
  }, []);

  useEffect(() => { fetchSessions(); fetchMatches(); }, [fetchSessions, fetchMatches]);

  async function handleBook() {
    if (!form.matchId || !form.topic || !form.date || !form.time) {
      showToast("error", "Please fill in all required fields"); return;
    }
    setSaving(true);
    try {
      const match = matches.find(m => m.id === form.matchId);
      if (!match) throw new Error("Match not found");
      const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString();
      await apiFetch("/api/admin/sessions", {
        method: "POST",
        body: JSON.stringify({
          mentorId:    match.mentor.id,
          menteeId:    match.mentee_id,
          topic:       form.topic,
          scheduledAt,
          durationMin: parseInt(form.duration),
          meetingLink: form.meetingLink || undefined,
          notes:       form.notes || undefined,
        }),
      });
      showToast("success", `Session "${form.topic}" booked successfully`);
      setBookOpen(false);
      setForm(EMPTY_FORM);
      fetchSessions();
    } catch (e: any) { showToast("error", e.message); }
    finally { setSaving(false); }
  }

  async function handleStatusChange(id: string, status: string) {
    setUpdating(id);
    try {
      await apiFetch(`/api/admin/sessions/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      showToast("success", `Session marked as ${status}`);
      fetchSessions();
    } catch (e: any) { showToast("error", e.message); }
    finally { setUpdating(null); }
  }

  const upcoming = sessions.filter(s => s.status === "scheduled");
  const past     = sessions.filter(s => s.status !== "scheduled");

  // Derive mentee label for selected match
  const selectedMatch = matches.find(m => m.id === form.matchId);

  return (
    <div className="space-y-6">
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
          <h1 className="text-2xl font-bold">Sessions</h1>
          <p className="text-muted-foreground text-sm mt-1">Book and manage mentorship sessions</p>
        </div>
        <div className="flex gap-2">
          <Button className="gradient-primary text-primary-foreground" size="sm" onClick={() => setBookOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Book Session
          </Button>
          <Button variant="outline" size="sm" onClick={fetchSessions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total",      value: stats.total,     icon: Calendar,     color: "text-primary" },
          { label: "This Month", value: stats.thisMonth, icon: Clock,        color: "text-primary" },
          { label: "Upcoming",   value: stats.upcoming,  icon: Video,        color: "text-blue-500" },
          { label: "Completed",  value: stats.completed, icon: CheckCircle2, color: "text-green-500" },
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
              Upcoming <Badge variant="secondary" className="ml-1.5 text-[10px]">{upcoming.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="all">
              All <Badge variant="secondary" className="ml-1.5 text-[10px]">{sessions.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Upcoming cards */}
          <TabsContent value="upcoming" className="space-y-3 mt-4">
            {upcoming.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No upcoming sessions</p>
                <Button className="gradient-primary text-primary-foreground mt-4" size="sm" onClick={() => setBookOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Book First Session
                </Button>
              </div>
            ) : upcoming.map(s => {
              const { date, time } = fmt(s.scheduledAt);
              return (
                <Card key={s.id} className="glass-card">
                  <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="gradient-primary text-primary-foreground text-xs font-bold">
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
                        {s.meetingLink && (
                          <a href={s.meetingLink} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline">
                            <Link className="h-3 w-3" /> Meeting link
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-xs border-0 ${statusCfg[s.status]?.cls}`}>
                        {statusCfg[s.status]?.label}
                      </Badge>
                      <Select value={s.status} onValueChange={v => handleStatusChange(s.id, v)} disabled={updating === s.id}>
                        <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">Upcoming</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="no_show">No Show</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* All sessions table */}
          <TabsContent value="all" className="mt-4">
            <Card className="glass-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic</TableHead>
                      <TableHead>Mentor</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Link</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Update</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No sessions found</TableCell></TableRow>
                    ) : sessions.map(s => {
                      const { date, time } = fmt(s.scheduledAt);
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium text-sm">{s.topic}</TableCell>
                          <TableCell className="text-sm">{s.mentor}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{date} {time}</TableCell>
                          <TableCell className="text-sm">{s.durationMin}m</TableCell>
                          <TableCell>
                            {s.meetingLink
                              ? <a href={s.meetingLink} target="_blank" rel="noreferrer" className="text-primary text-xs hover:underline flex items-center gap-1"><Link className="h-3 w-3" />Join</a>
                              : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-xs border-0 ${statusCfg[s.status]?.cls}`}>{statusCfg[s.status]?.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <Select value={s.status} onValueChange={v => handleStatusChange(s.id, v)} disabled={updating === s.id}>
                              <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="scheduled">Upcoming</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                <SelectItem value="no_show">No Show</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Book Session Dialog */}
      <Dialog open={bookOpen} onOpenChange={setBookOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Book a Session
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Match selector — picks mentee+mentor pair */}
            <div className="space-y-1.5">
              <Label>Mentee ↔ Mentor Pair <span className="text-destructive">*</span></Label>
              <Select value={form.matchId} onValueChange={v => setForm(f => ({ ...f, matchId: v }))}>
                <SelectTrigger className="bg-muted/50">
                  <SelectValue placeholder={matches.length === 0 ? "No active matches yet" : "Select a matched pair..."} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {matches.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="font-medium">{m.mentee_username || `User-${m.mentee_id.slice(0,6)}`}</span>
                      <span className="text-muted-foreground"> ↔ {m.mentor.display_name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMatch && (
                <p className="text-xs text-muted-foreground">
                  {selectedMatch.mentor.field} · {selectedMatch.mentor.display_name}
                </p>
              )}
              {matches.length === 0 && (
                <p className="text-xs text-muted-foreground">Accept a match request first before booking sessions.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Topic <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Career Planning, Goal Review, Mental Wellness..."
                className="bg-muted/50" value={form.topic}
                onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date <span className="text-destructive">*</span></Label>
                <Input type="date" className="bg-muted/50"
                  min={new Date().toISOString().split("T")[0]}
                  value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Time <span className="text-destructive">*</span></Label>
                <Input type="time" className="bg-muted/50"
                  value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Select value={form.duration} onValueChange={v => setForm(f => ({ ...f, duration: v }))}>
                <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Link className="h-3.5 w-3.5" /> Meeting Link
                <span className="text-xs text-muted-foreground font-normal">(Google Meet, Zoom, etc.)</span>
              </Label>
              <Input placeholder="https://meet.google.com/..." className="bg-muted/50"
                value={form.meetingLink} onChange={e => setForm(f => ({ ...f, meetingLink: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label>Notes <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea placeholder="Any preparation notes for the mentee..." rows={2}
                className="bg-muted/50 resize-none" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookOpen(false)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handleBook}
              disabled={saving || matches.length === 0}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Booking...</> : "Book Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
