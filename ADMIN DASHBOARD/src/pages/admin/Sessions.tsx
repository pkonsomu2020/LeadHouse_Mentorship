import { useEffect, useState, useCallback } from "react";
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const getToken = () => localStorage.getItem("lh_admin_token") || "";

async function apiFetch(path: string, opts: RequestInit = {}) {
  const res  = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...opts.headers },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

interface Session {
  id: string; topic: string; scheduledAt: string; durationMin: number;
  status: string; notes: string | null; mentor: string; mentorAvatar: string;
  mentorField: string; menteeId: string;
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
    date: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function AdminSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats,    setStats]    = useState<Stats>({ total: 0, upcoming: 0, completed: 0, thisMonth: 0 });
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [toast,    setToast]    = useState<{ type: "success"|"error"; msg: string } | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

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

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  async function handleStatusChange(id: string, status: string) {
    setUpdating(id);
    try {
      await apiFetch(`/api/admin/sessions/${id}/status`, {
        method: "PATCH", body: JSON.stringify({ status }),
      });
      showToast("success", `Session marked as ${status}`);
      fetchSessions();
    } catch (e: any) { showToast("error", e.message); }
    finally { setUpdating(null); }
  }

  const upcoming  = sessions.filter(s => s.status === "scheduled");
  const past      = sessions.filter(s => s.status !== "scheduled");

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
          <h1 className="text-2xl font-bold">Sessions</h1>
          <p className="text-muted-foreground text-sm mt-1">All mentorship sessions across the platform</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSessions} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total",     value: stats.total,     icon: Calendar,     color: "text-primary" },
          { label: "This Month",value: stats.thisMonth, icon: Clock,        color: "text-primary" },
          { label: "Upcoming",  value: stats.upcoming,  icon: Video,        color: "text-blue-500" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-500" },
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
              All Sessions <Badge variant="secondary" className="ml-1.5 text-[10px]">{sessions.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Upcoming */}
          <TabsContent value="upcoming" className="space-y-3 mt-4">
            {upcoming.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No upcoming sessions</p>
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
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{date}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{time}</span>
                        <span>{s.durationMin} min</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-xs border-0 ${statusCfg[s.status]?.cls}`}>
                        {statusCfg[s.status]?.label}
                      </Badge>
                      <Select
                        value={s.status}
                        onValueChange={(v) => handleStatusChange(s.id, v)}
                        disabled={updating === s.id}
                      >
                        <SelectTrigger className="h-8 w-[130px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
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

          {/* All Sessions Table */}
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
                      <TableHead>Status</TableHead>
                      <TableHead>Update</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No sessions found</TableCell>
                      </TableRow>
                    ) : sessions.map(s => {
                      const { date, time } = fmt(s.scheduledAt);
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium text-sm">{s.topic}</TableCell>
                          <TableCell className="text-sm">{s.mentor}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{date} {time}</TableCell>
                          <TableCell className="text-sm">{s.durationMin}m</TableCell>
                          <TableCell>
                            <Badge className={`text-xs border-0 ${statusCfg[s.status]?.cls}`}>
                              {statusCfg[s.status]?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={s.status}
                              onValueChange={(v) => handleStatusChange(s.id, v)}
                              disabled={updating === s.id}
                            >
                              <SelectTrigger className="h-7 w-[120px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
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
    </div>
  );
}
