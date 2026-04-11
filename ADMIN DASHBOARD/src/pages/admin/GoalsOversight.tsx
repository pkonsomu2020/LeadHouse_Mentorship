import { useEffect, useState, useCallback } from "react";
import { Target, TrendingUp, CheckCircle2, Clock, Search, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const getToken = () => localStorage.getItem("lh_admin_token") || "";

interface Goal {
  id: string; title: string; description: string | null; progress: number;
  isComplete: boolean; dueDate: string | null; userId: string; username: string; createdAt: string;
}
interface Stats { total: number; active: number; completed: number; avgProgress: number; }
interface CategoryData { category: string; count: number; }

const statusColors: Record<string, string> = {
  active:    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export default function GoalsOversight() {
  const [goals,        setGoals]        = useState<Goal[]>([]);
  const [stats,        setStats]        = useState<Stats>({ total: 0, active: 0, completed: 0, avgProgress: 0 });
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchGoals = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (search)                    params.set("search", search);
      if (statusFilter !== "all")    params.set("status", statusFilter);

      const res  = await fetch(`${API}/api/admin/goals?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setGoals(json.goals || []);
      setStats(json.stats || { total: 0, active: 0, completed: 0, avgProgress: 0 });
      setCategoryData(json.categoryData || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchGoals, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchGoals]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Goals & Progress Oversight</h1>
          <p className="text-muted-foreground text-sm mt-1">Monitor user goals and growth across the platform</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchGoals} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Goals",  value: stats.total,       icon: Target,       color: "text-primary" },
          { label: "Active",       value: stats.active,      icon: Clock,        color: "text-yellow-500" },
          { label: "Completed",    value: stats.completed,   icon: CheckCircle2, color: "text-green-500" },
          { label: "Avg Progress", value: `${stats.avgProgress}%`, icon: TrendingUp, color: "text-primary" },
        ].map((s, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className="text-xl font-bold">{s.value}</p>
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
          <Loader2 className="h-5 w-5 animate-spin" /><span>Loading goals...</span>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Goals table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search goals or users..." className="pl-10 bg-muted/50"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px] bg-muted/50"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="glass-card">
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Goal</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {goals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No goals found</TableCell>
                      </TableRow>
                    ) : goals.map(g => (
                      <TableRow key={g.id}>
                        <TableCell className="text-sm font-medium">{g.username}</TableCell>
                        <TableCell className="text-sm max-w-[180px]">
                          <p className="truncate">{g.title}</p>
                          {g.description && <p className="text-xs text-muted-foreground truncate">{g.description}</p>}
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <Progress value={g.progress} className="h-1.5 flex-1" />
                            <span className="text-xs font-medium w-8">{g.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs border-0 ${g.isComplete ? statusColors.completed : statusColors.active}`}>
                            {g.isComplete ? "Completed" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {g.dueDate ? new Date(g.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Category chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Goals by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={categoryData} layout="vertical">
                    <XAxis type="number" axisLine={false} tickLine={false} className="text-xs" />
                    <YAxis type="category" dataKey="category" axisLine={false} tickLine={false} className="text-xs" width={90} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", color: "hsl(var(--foreground))" }} />
                    <Bar dataKey="count" fill="hsl(152, 100%, 33%)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
