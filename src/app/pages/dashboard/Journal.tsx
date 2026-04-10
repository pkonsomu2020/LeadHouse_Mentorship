import { useState, useEffect, useCallback } from "react";
import {
  Plus, BookOpen, Smile, Meh, Frown, Heart, Zap,
  Loader2, AlertCircle, Pencil, Trash2, RefreshCw, X, Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { auth } from "@/lib/auth";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface Entry {
  id: string; title: string | null; content: string; mood: number | null;
  tags: string[]; is_private: boolean; created_at: string;
}
interface Stats { total: number; thisWeek: number; avgMood: number; streak: number; }

const MOODS = [
  { score: 1, icon: Frown,  label: "Struggling", color: "text-red-500",    bg: "bg-red-50 dark:bg-red-900/20 border-red-200" },
  { score: 2, icon: Meh,    label: "Low",        color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20 border-orange-200" },
  { score: 3, icon: Meh,    label: "Okay",       color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200" },
  { score: 4, icon: Smile,  label: "Good",       color: "text-green-500",  bg: "bg-green-50 dark:bg-green-900/20 border-green-200" },
  { score: 5, icon: Heart,  label: "Great",      color: "text-primary",    bg: "bg-primary/10 border-primary/30" },
];

const PROMPTS = [
  "What's one thing you're grateful for today?",
  "What challenge did you face and how did you handle it?",
  "What habit are you building, and how is it going?",
  "Describe a moment this week where you showed discipline.",
  "What's one thing you'd tell your younger self?",
  "What did you learn about yourself today?",
  "How did your mentor's advice help you this week?",
];

function moodFor(score: number | null) {
  return MOODS.find(m => m.score === score) || null;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function Journal() {
  const [entries,     setEntries]     = useState<Entry[]>([]);
  const [stats,       setStats]       = useState<Stats>({ total: 0, thisWeek: 0, avgMood: 0, streak: 0 });
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [toast,       setToast]       = useState<{ type: "success"|"error"; msg: string } | null>(null);

  // New / edit entry state
  const [editOpen,    setEditOpen]    = useState(false);
  const [editEntry,   setEditEntry]   = useState<Entry | null>(null);
  const [form,        setForm]        = useState({ title: "", content: "", mood: 0, tags: "" });
  const [saving,      setSaving]      = useState(false);

  // View entry state
  const [viewEntry,   setViewEntry]   = useState<Entry | null>(null);

  const [prompt] = useState(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);

  function showToast(type: "success"|"error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  const fetchEntries = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API}/api/journal`, { headers: { Authorization: `Bearer ${auth.getToken()}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load journal");
      setEntries(json.entries || []);
      setStats(json.stats || { total: 0, thisWeek: 0, avgMood: 0, streak: 0 });
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  function openNew() {
    setEditEntry(null);
    setForm({ title: "", content: "", mood: 0, tags: "" });
    setEditOpen(true);
  }

  function openEdit(e: Entry) {
    setEditEntry(e);
    setForm({ title: e.title || "", content: e.content, mood: e.mood || 0, tags: (e.tags || []).join(", ") });
    setEditOpen(true);
  }

  async function handleSave() {
    if (!form.content.trim()) { showToast("error", "Please write something first"); return; }
    setSaving(true);
    try {
      const body = {
        title:   form.title.trim() || null,
        content: form.content.trim(),
        mood:    form.mood || null,
        tags:    form.tags.split(",").map(t => t.trim()).filter(Boolean),
      };
      const url    = editEntry ? `${API}/api/journal/${editEntry.id}` : `${API}/api/journal`;
      const method = editEntry ? "PATCH" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.errors?.[0]?.msg);
      showToast("success", editEntry ? "Entry updated" : "Entry saved!");
      setEditOpen(false);
      fetchEntries();
    } catch (e: any) { showToast("error", e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this journal entry?")) return;
    try {
      const res = await fetch(`${API}/api/journal/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${auth.getToken()}` },
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
      showToast("success", "Entry deleted");
      if (viewEntry?.id === id) setViewEntry(null);
      fetchEntries();
    } catch (e: any) { showToast("error", e.message); }
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
          toast.type === "success"
            ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
            : "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
        }`}>
          {toast.type === "success" ? <Zap className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Journal</h1>
          <p className="text-muted-foreground text-sm mt-1">Reflect, grow, and track your inner journey</p>
        </div>
        <div className="flex gap-2">
          <Button className="gradient-primary text-primary-foreground" size="sm" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" /> New Entry
          </Button>
          <Button variant="outline" size="sm" onClick={fetchEntries} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Entries", value: stats.total,    color: "text-primary" },
          { label: "This Week",     value: stats.thisWeek, color: "text-primary" },
          { label: "Day Streak",    value: stats.streak,   color: "text-primary" },
          { label: "Avg Mood",      value: stats.avgMood ? `${stats.avgMood}/5` : "—", color: "text-primary" },
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
          <Loader2 className="h-5 w-5 animate-spin" /><span>Loading journal...</span>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's prompt + quick write */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="glass-card border-primary/20">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider">Today's Prompt</p>
                    <p className="text-sm text-muted-foreground mt-0.5 italic">"{prompt}"</p>
                  </div>
                </div>
                <Button className="gradient-primary text-primary-foreground w-full" onClick={openNew}>
                  <Plus className="h-4 w-4 mr-1" /> Write Today's Entry
                </Button>
              </CardContent>
            </Card>

            {/* Entries list */}
            {entries.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No entries yet</p>
                <p className="text-sm mt-1">Start your first journal entry today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map(e => {
                  const mood = moodFor(e.mood);
                  const MoodIcon = mood?.icon;
                  return (
                    <Card key={e.id} className="glass-card hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => setViewEntry(e)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {MoodIcon && <MoodIcon className={`h-4 w-4 shrink-0 ${mood.color}`} />}
                              <h3 className="text-sm font-semibold truncate">{e.title || "Untitled"}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{e.content}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] text-muted-foreground">{fmtDate(e.created_at)}</span>
                              {mood && <Badge variant="secondary" className="text-[10px]">{mood.label}</Badge>}
                              {(e.tags || []).map(t => (
                                <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={ev => ev.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(e.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mood summary */}
          <div className="space-y-4">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Mood Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {MOODS.slice().reverse().map(m => {
                  const count = entries.filter(e => e.mood === m.score).length;
                  const pct   = entries.length ? Math.round((count / entries.length) * 100) : 0;
                  const Icon  = m.icon;
                  return (
                    <div key={m.score} className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 shrink-0 ${m.color}`} />
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{m.label}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Write / Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {editEntry ? "Edit Entry" : "New Journal Entry"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Mood picker */}
            <div>
              <p className="text-sm font-medium mb-2">How are you feeling?</p>
              <div className="flex gap-2 flex-wrap">
                {MOODS.map(m => {
                  const Icon = m.icon;
                  return (
                    <button key={m.score} onClick={() => setForm(f => ({ ...f, mood: f.mood === m.score ? 0 : m.score }))}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        form.mood === m.score ? `${m.bg} scale-105` : "border-transparent bg-muted/50 hover:bg-muted"
                      }`}>
                      <Icon className={`h-6 w-6 ${m.color}`} />
                      <span className="text-[10px] font-medium">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prompt reminder */}
            <div className="p-3 rounded-xl bg-accent/50 border border-primary/20">
              <p className="text-xs font-medium text-primary mb-0.5">💡 Prompt</p>
              <p className="text-xs italic text-muted-foreground">{prompt}</p>
            </div>

            <Input placeholder="Title (optional)" className="bg-muted/50"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />

            <Textarea placeholder="Write your thoughts, reflections, or anything on your mind..."
              className="min-h-[200px] bg-muted/30 resize-none"
              value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />

            <Input placeholder="Tags (comma-separated): Career, Fitness, Growth..."
              className="bg-muted/50" value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : editEntry ? "Save Changes" : "Save Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Entry Dialog */}
      <Dialog open={!!viewEntry} onOpenChange={() => setViewEntry(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewEntry && (() => {
            const mood = moodFor(viewEntry.mood);
            const MoodIcon = mood?.icon;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {MoodIcon && <MoodIcon className={`h-5 w-5 ${mood?.color}`} />}
                    {viewEntry.title || "Untitled"}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground">{fmtDate(viewEntry.created_at)}</p>
                </DialogHeader>
                <div className="py-2 space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    {mood && <Badge variant="secondary">{mood.label}</Badge>}
                    {(viewEntry.tags || []).map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{viewEntry.content}</p>
                </div>
                <DialogFooter>
                  <Button variant="outline" size="sm" onClick={() => { setViewEntry(null); openEdit(viewEntry); }}>
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(viewEntry.id)}>
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
