import { useEffect, useState, useCallback } from "react";
import {
  BookOpen, Flag, CheckCircle2, Search, TrendingUp,
  AlertCircle, Loader2, RefreshCw, MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const getToken = () => localStorage.getItem("lh_admin_token") || "";

interface Entry {
  id: string; title: string; mood: number | null; moodLabel: string;
  tags: string[]; isFlagged: boolean; createdAt: string; userId: string; username: string;
}
interface Stats { total: number; flagged: number; struggling: number; avgMood: number; }
interface MoodDist { mood: string; count: number; }
interface WeeklyTrend { week: string; avg: number | null; }

const moodColors: Record<string, string> = {
  "Great":     "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "Good":      "bg-primary/10 text-primary",
  "Okay":      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Low":       "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "Struggling":"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function JournalModeration() {
  const navigate = useNavigate();
  const [entries,     setEntries]     = useState<Entry[]>([]);
  const [stats,       setStats]       = useState<Stats>({ total: 0, flagged: 0, struggling: 0, avgMood: 0 });
  const [moodDist,    setMoodDist]    = useState<MoodDist[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrend[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [toast,       setToast]       = useState<string | null>(null);
  const [search,      setSearch]      = useState("");
  const [moodFilter,  setMoodFilter]  = useState("all");
  const [flagFilter,  setFlagFilter]  = useState("all");
  const [toggling,    setToggling]    = useState<string | null>(null);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  const fetchEntries = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (search)              params.set("search", search);
      if (moodFilter !== "all") params.set("mood", moodFilter);
      if (flagFilter === "flagged") params.set("flagged", "true");

      const res  = await fetch(`${API}/api/admin/journal?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setEntries(json.entries || []);
      setStats(json.stats || { total: 0, flagged: 0, struggling: 0, avgMood: 0 });
      setMoodDist(json.moodDist || []);
      setWeeklyTrend(json.weeklyTrend || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [search, moodFilter, flagFilter]);

  useEffect(() => {
    const t = setTimeout(fetchEntries, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchEntries]);

  async function handleToggleFlag(id: string, currentlyFlagged: boolean) {
    setToggling(id);
    try {
      const res  = await fetch(`${API}/api/admin/journal/${id}/flag`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ flagged: !currentlyFlagged }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showToast(json.message);
      setEntries(prev => prev.map(e => e.id === id ? { ...e, isFlagged: !currentlyFlagged } : e));
    } catch (e: any) { setError(e.message); }
    finally { setToggling(null); }
  }

  const displayedEntries = entries.filter(e => {
    if (flagFilter === "flagged" && !e.isFlagged) return false;
    if (flagFilter === "normal"  &&  e.isFlagged) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />{toast}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Journal Moderation</h1>
          <p className="text-muted-foreground text-sm mt-1">Monitor wellbeing signals — content stays private</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchEntries} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Entries",   value: stats.total,      icon: "📓", color: "text-foreground" },
          { label: "Flagged",         value: stats.flagged,    icon: "🚩", color: "text-destructive" },
          { label: "Struggling Mood", value: stats.struggling, icon: "💙", color: "text-blue-500" },
          { label: "Avg Mood",        value: stats.avgMood ? `${stats.avgMood}/5` : "—", icon: "📈", color: "text-green-500" },
        ].map((s, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-4 flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
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
          <Loader2 className="h-5 w-5 animate-spin" /><span>Loading entries...</span>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Entries table */}
          <div className="lg:col-span-2 space-y-4">
            {/* Flagged alert */}
            {stats.flagged > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                <Flag className="h-5 w-5 text-destructive shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-destructive">{stats.flagged} entries flagged for attention</p>
                  <p className="text-xs text-muted-foreground">Consider reaching out to these users via Messages</p>
                </div>
                <Button size="sm" variant="outline" className="text-xs shrink-0"
                  onClick={() => navigate("/messages")}>
                  <MessageSquare className="h-3 w-3 mr-1" /> Go to Messages
                </Button>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by title or user..." className="pl-10 bg-muted/50"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={moodFilter} onValueChange={setMoodFilter}>
                <SelectTrigger className="w-full sm:w-[130px] bg-muted/50"><SelectValue placeholder="Mood" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Moods</SelectItem>
                  <SelectItem value="5">Great (5)</SelectItem>
                  <SelectItem value="4">Good (4)</SelectItem>
                  <SelectItem value="3">Okay (3)</SelectItem>
                  <SelectItem value="2">Low (2)</SelectItem>
                  <SelectItem value="1">Struggling (1)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={flagFilter} onValueChange={setFlagFilter}>
                <SelectTrigger className="w-full sm:w-[130px] bg-muted/50"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entries</SelectItem>
                  <SelectItem value="flagged">Flagged Only</SelectItem>
                  <SelectItem value="normal">Normal Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="glass-card">
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Mood</TableHead>
                      <TableHead className="hidden md:table-cell">Tags</TableHead>
                      <TableHead className="hidden md:table-cell">Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No entries found</TableCell>
                      </TableRow>
                    ) : displayedEntries.map(e => (
                      <TableRow key={e.id} className={e.isFlagged ? "bg-destructive/5" : ""}>
                        <TableCell className="text-sm font-medium">
                          <div className="flex items-center gap-1.5">
                            {e.isFlagged && <Flag className="h-3 w-3 text-destructive shrink-0" />}
                            {e.username}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-[160px] truncate">{e.title}</TableCell>
                        <TableCell>
                          {e.moodLabel !== "Unknown" ? (
                            <Badge className={`text-xs border-0 ${moodColors[e.moodLabel] || ""}`}>{e.moodLabel}</Badge>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex gap-1 flex-wrap">
                            {(e.tags || []).map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {new Date(e.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {/* Flag / unflag */}
                            <Button variant="ghost" size="icon" className={`h-8 w-8 ${e.isFlagged ? "text-destructive" : "text-muted-foreground"}`}
                              disabled={toggling === e.id}
                              onClick={() => handleToggleFlag(e.id, e.isFlagged)}
                              title={e.isFlagged ? "Clear flag" : "Flag for follow-up"}>
                              {toggling === e.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : e.isFlagged ? <CheckCircle2 className="h-4 w-4" /> : <Flag className="h-4 w-4" />}
                            </Button>
                            {/* Message user */}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary"
                              title="Message this user"
                              onClick={() => navigate("/messages")}>
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Mood trend + distribution */}
          <div className="space-y-4">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Platform Mood Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={weeklyTrend.filter(w => w.avg !== null)}>
                    <XAxis dataKey="week" axisLine={false} tickLine={false} className="text-xs" />
                    <YAxis axisLine={false} tickLine={false} domain={[0, 5]} className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", color: "hsl(var(--foreground))" }} />
                    <defs>
                      <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(152,100%,33%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(152,100%,33%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="avg" stroke="hsl(152,100%,33%)" fill="url(#moodGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Mood Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {moodDist.filter(m => m.count > 0).map((m, i) => {
                  const total = moodDist.reduce((a, x) => a + x.count, 0);
                  const pct   = total ? Math.round((m.count / total) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-20 text-muted-foreground shrink-0">{m.mood}</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full gradient-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-medium w-8 text-right">{m.count}</span>
                    </div>
                  );
                })}
                {moodDist.every(m => m.count === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No mood data yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
