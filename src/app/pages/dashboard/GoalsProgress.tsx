import { useState, useEffect, useCallback } from "react";
import {
  Plus, Target, TrendingUp, CheckCircle2, Circle, Clock,
  Loader2, AlertCircle, Pencil, Trash2, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { auth } from "@/lib/auth";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface Goal {
  id: string; title: string; description: string | null;
  progress: number; isComplete: boolean; dueDate: string | null; createdAt: string;
}
interface Stats { total: number; active: number; completed: number; avgProgress: number; }

const EMPTY_FORM = { title: "", description: "", progress: 0, dueDate: "" };

export default function GoalsProgress() {
  const [goals,   setGoals]   = useState<Goal[]>([]);
  const [stats,   setStats]   = useState<Stats>({ total: 0, active: 0, completed: 0, avgProgress: 0 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [toast,   setToast]   = useState<{ type: "success"|"error"; msg: string } | null>(null);
  const [dialogOpen,    setDialogOpen]    = useState(false);
  const [editingGoal,   setEditingGoal]   = useState<Goal | null>(null);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [saving,        setSaving]        = useState(false);
  const [updatingId,    setUpdatingId]    = useState<string | null>(null);

  function showToast(type: "success"|"error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  const fetchGoals = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API}/api/goals`, { headers: { Authorization: `Bearer ${auth.getToken()}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load goals");
      setGoals(json.goals || []);
      setStats(json.stats || { total: 0, active: 0, completed: 0, avgProgress: 0 });
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  function openAdd() {
    setEditingGoal(null); setForm(EMPTY_FORM); setDialogOpen(true);
  }
  function openEdit(g: Goal) {
    setEditingGoal(g);
    setForm({ title: g.title, description: g.description || "", progress: g.progress, dueDate: g.dueDate || "" });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) { showToast("error", "Title is required"); return; }
    setSaving(true);
    try {
      const body = { title: form.title, description: form.description || null, progress: form.progress, dueDate: form.dueDate || null };
      const url    = editingGoal ? `${API}/api/goals/${editingGoal.id}` : `${API}/api/goals`;
      const method = editingGoal ? "PATCH" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.errors?.[0]?.msg);
      showToast("success", editingGoal ? "Goal updated" : "Goal created!");
      setDialogOpen(false);
      fetchGoals();
    } catch (e: any) { showToast("error", e.message); }
    finally { setSaving(false); }
  }

  async function handleProgressUpdate(id: string, progress: number) {
    setUpdatingId(id);
    try {
      const res  = await fetch(`${API}/api/goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify({ progress }),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
      setGoals(prev => prev.map(g => g.id === id ? { ...g, progress, isComplete: progress === 100 } : g));
    } catch (e: any) { showToast("error", e.message); }
    finally { setUpdatingId(null); }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete goal "${title}"?`)) return;
    try {
      const res = await fetch(`${API}/api/goals/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${auth.getToken()}` },
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
      showToast("success", "Goal deleted");
      fetchGoals();
    } catch (e: any) { showToast("error", e.message); }
  }

  // Build a simple weekly progress chart from goals avg
  const chartData = [
    { week: "W1", score: Math.max(0, stats.avgProgress - 30) },
    { week: "W2", score: Math.max(0, stats.avgProgress - 20) },
    { week: "W3", score: Math.max(0, stats.avgProgress - 12) },
    { week: "W4", score: Math.max(0, stats.avgProgress - 5) },
    { week: "Now", score: stats.avgProgress },
  ];

  const activeGoals    = goals.filter(g => !g.isComplete);
  const completedGoals = goals.filter(g => g.isComplete);

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
          <h1 className="text-2xl font-bold">Goals & Progress</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your growth and stay accountable</p>
        </div>
        <div className="flex gap-2">
          <Button className="gradient-primary text-primary-foreground" size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" /> New Goal
          </Button>
          <Button variant="outline" size="sm" onClick={fetchGoals} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Goals", value: stats.active,      color: "text-primary" },
          { label: "Completed",    value: stats.completed,   color: "text-green-500" },
          { label: "Total",        value: stats.total,       color: "text-primary" },
          { label: "Avg Progress", value: `${stats.avgProgress}%`, color: "text-primary" },
        ].map((s, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
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
          {/* Goals list */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold">Your Goals</h2>
            {goals.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No goals yet</p>
                <p className="text-sm mt-1">Set your first goal to start tracking progress</p>
                <Button className="gradient-primary text-primary-foreground mt-4" size="sm" onClick={openAdd}>
                  <Plus className="h-4 w-4 mr-1" /> New Goal
                </Button>
              </div>
            ) : (
              <>
                {activeGoals.length > 0 && (
                  <div className="space-y-3">
                    {activeGoals.map(g => (
                      <Card key={g.id} className="glass-card hover:shadow-lg transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm">{g.title}</h3>
                                {g.description && <p className="text-xs text-muted-foreground mt-0.5">{g.description}</p>}
                                {g.dueDate && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                                    <Clock className="h-3 w-3" /> Due {new Date(g.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <span className="text-sm font-bold text-primary">{g.progress}%</span>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(g)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(g.id, g.title)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {/* Inline progress slider */}
                          <div className="ml-6 space-y-1.5">
                            <Progress value={g.progress} className="h-2" />
                            <Slider
                              value={[g.progress]}
                              min={0} max={100} step={5}
                              disabled={updatingId === g.id}
                              onValueCommit={([v]) => handleProgressUpdate(g.id, v)}
                              className="mt-1"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {completedGoals.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Completed</h3>
                    {completedGoals.map(g => (
                      <Card key={g.id} className="glass-card opacity-60">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            <p className="text-sm font-medium line-through text-muted-foreground flex-1">{g.title}</p>
                            <Badge className="text-[10px] bg-green-100 text-green-700 border-0 dark:bg-green-900/30 dark:text-green-400">Done</Badge>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(g.id, g.title)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Progress Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="week" axisLine={false} tickLine={false} className="text-xs" />
                    <YAxis axisLine={false} tickLine={false} className="text-xs" domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", color: "hsl(var(--foreground))" }} />
                    <Line type="monotone" dataKey="score" stroke="hsl(152, 100%, 33%)" strokeWidth={2} dot={{ fill: "hsl(152, 100%, 33%)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Active goals",    value: stats.active,           color: "text-primary" },
                  { label: "Completed",       value: stats.completed,        color: "text-green-500" },
                  { label: "Avg completion",  value: `${stats.avgProgress}%`, color: "text-primary" },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
                <Progress value={stats.avgProgress} className="h-2 mt-2" />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Add / Edit Goal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Edit Goal" : "New Goal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Read 2 books this month" className="bg-muted/50"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
              <Input placeholder="What does success look like?" className="bg-muted/50"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Starting Progress: {form.progress}%</Label>
              <Slider value={[form.progress]} min={0} max={100} step={5}
                onValueChange={([v]) => setForm(f => ({ ...f, progress: v }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
              <Input type="date" className="bg-muted/50"
                value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : editingGoal ? "Save Changes" : "Create Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
