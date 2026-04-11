import { useEffect, useState, useCallback } from "react";
import { Flame, Target, MessageSquare, Calendar, TrendingUp, Users, CheckCircle2, Loader2, AlertCircle, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/shared/StatCard";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from "recharts";
import { useNavigate } from "react-router";
import { auth } from "@/lib/auth";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const TT  = { backgroundColor:"hsl(var(--card))", border:"1px solid hsl(var(--border))", borderRadius:"0.75rem", color:"hsl(var(--foreground))" };

interface Session { id:string; topic:string; time:string; mentor:string; avatar:string; }
interface Goal    { id:string; title:string; progress:number; }
interface Stats   { streak:number; completedGoals:number; completedSessions:number; growthScore:string; isMatched:boolean; }
interface Data    { stats:Stats; upcomingSessions:Session[]; activeGoals:Goal[]; weeklyActivity:{day:string;sessions:number;goals:number}[]; moodData:{day:string;mood:number|null}[]; }

export default function UserDashboard() {
  const navigate = useNavigate();
  const [data,    setData]    = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const username = auth.getUsername();

  const fetch$ = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API}/api/dashboard`, { headers: { Authorization: `Bearer ${auth.getToken()}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load dashboard");
      setData(json);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch$(); }, [fetch$]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" /><span>Loading your dashboard...</span>
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 m-6">
      <AlertCircle className="h-5 w-5 shrink-0" />
      <div>
        <p className="font-medium">Could not load dashboard</p>
        <p className="text-sm">{error}</p>
        <Button size="sm" variant="outline" className="mt-2" onClick={fetch$}>Retry</Button>
      </div>
    </div>
  );

  const s  = data?.stats;
  const sessions = data?.upcomingSessions || [];
  const goals    = data?.activeGoals      || [];
  const weekly   = data?.weeklyActivity   || [];
  const mood     = (data?.moodData || []).filter(m => m.mood !== null);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl gradient-primary p-5 md:p-8 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20" />
          <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/10" />
        </div>
        <div className="relative z-10">
          <p className="text-sm opacity-80 mb-1">Welcome back,</p>
          <h1 className="text-xl md:text-3xl font-bold mb-2 break-words">{username} 🦅</h1>
          <p className="text-sm opacity-80 mb-4">
            {s?.streak ? `Keep going! You're on a ${s.streak}-day streak.` : "Start your journey today!"}
          </p>
          <div className="flex gap-3 flex-wrap">
            <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0" onClick={() => navigate("/dashboard/journal")}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Daily Journal
            </Button>
            <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0" onClick={() => navigate("/dashboard/mentors")}>
              <Users className="h-4 w-4 mr-1" /> Find Mentor
            </Button>
            <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0" onClick={() => navigate("/dashboard/goals")}>
              <Target className="h-4 w-4 mr-1" /> Set Goal
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Day Streak"      value={s?.streak           ?? 0}   icon={Flame}         trend={{ value: 0, positive: true }} subtitle="Keep it going!" />
        <StatCard title="Goals Completed" value={s?.completedGoals   ?? 0}   icon={Target}        trend={{ value: 0, positive: true }} subtitle="Total completed" />
        <StatCard title="Sessions Done"   value={s?.completedSessions ?? 0}  icon={MessageSquare} trend={{ value: 0, positive: true }} subtitle="Total sessions" />
        <StatCard title="Growth Score"    value={s?.growthScore      ?? "0%"} icon={TrendingUp}   trend={{ value: 0, positive: true }} subtitle="Overall progress" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Weekly Activity</CardTitle></CardHeader>
          <CardContent>
            {weekly.every(w => w.sessions === 0 && w.goals === 0) ? (
              <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground gap-2">
                <p className="text-sm">No activity this week yet</p>
                <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => navigate("/dashboard/sessions")}>
                  <Plus className="h-3 w-3 mr-1" /> Book a Session
                </Button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weekly}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} className="text-xs" />
                  <YAxis axisLine={false} tickLine={false} className="text-xs" />
                  <Tooltip contentStyle={TT} />
                  <Bar dataKey="sessions" name="Sessions" fill="hsl(152,100%,33%)" radius={[6,6,0,0]} />
                  <Bar dataKey="goals"    name="Goals"    fill="hsl(152,60%,25%)"  radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Mood Tracker */}
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-lg">Mood This Week</CardTitle></CardHeader>
          <CardContent>
            {mood.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground gap-2">
                <p className="text-sm">No journal entries this week</p>
                <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => navigate("/dashboard/journal")}>
                  <Plus className="h-3 w-3 mr-1" /> Write Entry
                </Button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={mood}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} className="text-xs" />
                  <Tooltip contentStyle={TT} />
                  <defs>
                    <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(152,100%,33%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(152,100%,33%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="mood" stroke="hsl(152,100%,33%)" fill="url(#moodGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground gap-1">
                <p className="text-sm">No upcoming sessions</p>
                <p className="text-xs">Your mentor will schedule sessions for you</p>
              </div>
            ) : sessions.map(s => (
              <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors mb-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-primary text-primary-foreground text-sm font-bold">
                  {s.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{s.mentor}</p>
                  <p className="text-xs text-muted-foreground">{s.topic}</p>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">{s.time}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Active Goals */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" /> Active Goals
              </CardTitle>
              <Button size="sm" variant="ghost" className="text-xs text-primary" onClick={() => navigate("/dashboard/goals")}>View all</Button>
            </div>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground gap-2">
                <p className="text-sm">No active goals</p>
                <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => navigate("/dashboard/goals")}>
                  <Plus className="h-3 w-3 mr-1" /> Set a Goal
                </Button>
              </div>
            ) : goals.map(g => (
              <div key={g.id} className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium line-clamp-1">{g.title}</p>
                  <span className="text-xs font-semibold text-primary shrink-0 ml-2">{g.progress}%</span>
                </div>
                <Progress value={g.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Mentor CTA */}
      {!s?.isMatched && (
        <Card className="glass-card border-primary/30 bg-accent/30">
          <CardContent className="p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold">You don't have a mentor yet</p>
              <p className="text-sm text-muted-foreground mt-0.5">Find a mentor to guide your growth journey</p>
            </div>
            <Button className="gradient-primary text-primary-foreground shrink-0" onClick={() => navigate("/dashboard/mentors")}>
              <Users className="h-4 w-4 mr-1" /> Find a Mentor
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
