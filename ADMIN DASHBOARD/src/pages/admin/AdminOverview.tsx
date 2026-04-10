import { useEffect, useState, useCallback } from "react";
import { Users, UserCheck, Link2, MessageSquare, TrendingUp, Activity, AlertTriangle, Target, Trophy, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/StatCard";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from "recharts";
import { Badge } from "@/components/ui/badge";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const getToken = () => localStorage.getItem("lh_admin_token") || "";
const TT = { backgroundColor:"hsl(var(--card))", border:"1px solid hsl(var(--border))", borderRadius:"0.75rem", color:"hsl(var(--foreground))" };

interface Stats {
  totalUsers:number; totalMentors:number; activeMatches:number; sessionsThisWeek:number;
  pendingReports:number; totalGoals:number; totalChallengeParticipants:number;
}
interface ActivityItem { action:string; user:string; time:string; type:string; }
interface OverviewData {
  stats: Stats;
  weeklyEngagement: { week:string; sessions:number }[];
  userGrowth: { month:string; users:number }[];
  recentActivity: ActivityItem[];
}

export default function AdminOverview() {
  const [data,    setData]    = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch$ = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API}/api/admin/overview`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch$(); }, [fetch$]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" /><span>Loading overview...</span>
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 m-6">
      <AlertCircle className="h-5 w-5 shrink-0" />
      <div>
        <p className="font-medium">Could not load overview</p>
        <p className="text-sm">{error}</p>
        <Button size="sm" variant="outline" className="mt-2" onClick={fetch$}>Retry</Button>
      </div>
    </div>
  );

  const s  = data?.stats;
  const activity = data?.recentActivity || [];
  const growth   = data?.userGrowth     || [];
  const weekly   = data?.weeklyEngagement || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Platform Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">LeadHouse admin dashboard — live metrics</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetch$} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users"        value={s?.totalUsers        ?? 0} icon={Users}       trend={{ value: 0, positive: true }} subtitle="Registered users" />
        <StatCard title="Active Mentors"     value={s?.totalMentors      ?? 0} icon={UserCheck}   trend={{ value: 0, positive: true }} subtitle="Verified mentors" />
        <StatCard title="Active Matches"     value={s?.activeMatches     ?? 0} icon={Link2}       trend={{ value: 0, positive: true }} subtitle="Current pairings" />
        <StatCard title="Sessions This Week" value={s?.sessionsThisWeek  ?? 0} icon={MessageSquare} trend={{ value: 0, positive: true }} subtitle="Scheduled sessions" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Pending Reports",       value: s?.pendingReports           ?? 0, icon: AlertTriangle, color: s?.pendingReports ? "text-destructive" : "text-muted-foreground" },
          { label: "Total Goals Set",       value: s?.totalGoals               ?? 0, icon: Target,        color: "text-primary" },
          { label: "Challenge Participants",value: s?.totalChallengeParticipants ?? 0, icon: Trophy,      color: "text-yellow-500" },
        ].map((s, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-6 w-6 ${s.color}`} />
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth Chart */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">User Growth</CardTitle></CardHeader>
          <CardContent>
            {growth.every(g => g.users === 0) ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                <p className="text-sm">No user data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={growth}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TT} />
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(152,100%,33%)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="hsl(152,100%,33%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Line type="monotone" dataKey="users" stroke="hsl(152,100%,33%)" strokeWidth={3} dot={{ fill:"hsl(152,100%,33%)", r:5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            ) : activity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-1">
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                  a.type === "flag"     ? "bg-destructive" :
                  a.type === "approve"  ? "bg-green-500"   : "bg-primary"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{a.action}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{a.user} · {a.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Engagement */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Weekly Session Engagement</CardTitle></CardHeader>
        <CardContent>
          {weekly.every(w => w.sessions === 0) ? (
            <div className="flex items-center justify-center h-[220px] text-muted-foreground">
              <p className="text-sm">No session data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekly}>
                <XAxis dataKey="week" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TT} />
                <Bar dataKey="sessions" name="Sessions" fill="hsl(152,100%,33%)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
