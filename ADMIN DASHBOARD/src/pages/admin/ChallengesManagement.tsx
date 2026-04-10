import { useEffect, useState, useCallback } from "react";
import { Trophy, Plus, Users, Flame, CheckCircle2, Edit, Trash2, Search, AlertCircle, Loader2, RefreshCw, X, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("lh_admin_token") || "";

async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(API + path, { ...opts, headers: { "Content-Type": "application/json", Authorization: "Bearer " + tok(), ...(opts.headers || {}) } });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || json.errors?.[0]?.msg || "HTTP " + res.status);
  return json;
}

interface MCQTask { question: string; option_a: string; option_b: string; option_c: string; option_d: string; correct_option: "a"|"b"|"c"|"d"|""; explanation: string; points: number; }
interface Challenge { id: string; title: string; description: string; category: string; status: string; startDate: string|null; endDate: string|null; rewardBadge: string; pointsReward: number; tasks: { id: string; title: string; order_index: number }[]; participants: number; completions: number; completionRate: number; }
interface Stats { total: number; active: number; completed: number; totalParticipants: number; }
interface LeaderEntry { rank: number; username: string; points: number; badges: number; }

const CATEGORIES = ["Personal Development","Career","Financial Literacy","Mental Health","Relationships","Digital Discipline","Fitness","Leadership","Others"];
const STATUS_CLS: Record<string,string> = { active:"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", completed:"bg-primary/10 text-primary", draft:"bg-muted text-muted-foreground" };
const emptyTask = (): MCQTask => ({ question:"", option_a:"", option_b:"", option_c:"", option_d:"", correct_option:"", explanation:"", points:50 });
const emptyForm = () => ({ title:"", description:"", category:"", status:"draft", start_date:"", end_date:"", reward_badge:"", tasks:[emptyTask()] });
function QuestionCard({ q, idx, total, onChange, onRemove, onMove }: { q: MCQTask; idx: number; total: number; onChange:(i:number,f:keyof MCQTask,v:string|number)=>void; onRemove:(i:number)=>void; onMove:(i:number,dir:"up"|"down")=>void; }) {
  const [open, setOpen] = useState(true);
  const opts = [{ key:"option_a" as const, label:"A" },{ key:"option_b" as const, label:"B" },{ key:"option_c" as const, label:"C" },{ key:"option_d" as const, label:"D" }];
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 cursor-pointer select-none" onClick={()=>setOpen(o=>!o)}>
        <span className="h-6 w-6 rounded-full gradient-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">{idx+1}</span>
        <p className="flex-1 text-sm font-medium truncate">{q.question || ("Question "+(idx+1))}</p>
        <div className="flex items-center gap-0.5 shrink-0">
          {idx > 0 && <button onClick={e=>{e.stopPropagation();onMove(idx,"up");}} className="p-1 hover:text-primary"><ChevronUp className="h-3.5 w-3.5"/></button>}
          {idx < total-1 && <button onClick={e=>{e.stopPropagation();onMove(idx,"down");}} className="p-1 hover:text-primary"><ChevronDown className="h-3.5 w-3.5"/></button>}
          {total > 1 && <button onClick={e=>{e.stopPropagation();onRemove(idx);}} className="p-1 text-destructive"><X className="h-3.5 w-3.5"/></button>}
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground ml-1"/> : <ChevronDown className="h-4 w-4 text-muted-foreground ml-1"/>}
        </div>
      </div>
      {open && (
        <div className="p-4 space-y-3 bg-background">
          <div>
            <Label className="text-xs mb-1 block">Question <span className="text-destructive">*</span></Label>
            <Textarea rows={2} placeholder="Type your question here..." className="bg-muted/50 resize-none text-sm" value={q.question} onChange={e=>onChange(idx,"question",e.target.value)}/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {opts.map(o => {
              const letter = o.label.toLowerCase() as "a"|"b"|"c"|"d";
              const isCorrect = q.correct_option === letter;
              return (
                <div key={o.key} className={"flex items-center gap-2 p-2 rounded-lg border transition-colors " + (isCorrect ? "border-green-400 bg-green-50 dark:bg-green-900/20" : "border-border bg-muted/30")}>
                  <button type="button" title="Mark as correct" onClick={()=>onChange(idx,"correct_option",letter)}
                    className={"h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-all " + (isCorrect ? "border-green-500 bg-green-500 text-white" : "border-muted-foreground text-muted-foreground hover:border-primary")}>
                    {o.label}
                  </button>
                  <input className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder={"Option "+o.label+"..."} value={q[o.key] as string} onChange={e=>onChange(idx,o.key,e.target.value)}/>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground">Click a letter circle to mark the correct answer</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Label className="text-xs mb-1 block">Explanation (shown after answering)</Label>
              <Input placeholder="Why is this correct?" className="bg-muted/50 text-sm" value={q.explanation} onChange={e=>onChange(idx,"explanation",e.target.value)}/>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Points</Label>
              <Input type="number" min={10} max={500} className="bg-muted/50 text-sm" value={q.points} onChange={e=>onChange(idx,"points",parseInt(e.target.value)||50)}/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default function ChallengesManagement() {
  const [challenges,   setChallenges]   = useState<Challenge[]>([]);
  const [stats,        setStats]        = useState<Stats>({ total:0, active:0, completed:0, totalParticipants:0 });
  const [leaderboard,  setLeaderboard]  = useState<LeaderEntry[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string|null>(null);
  const [toast,        setToast]        = useState<{type:"success"|"error";msg:string}|null>(null);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view,         setView]         = useState<"list"|"form">("list");
  const [editing,      setEditing]      = useState<Challenge|null>(null);
  const [form,         setForm]         = useState(emptyForm());
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState<string|null>(null);

  const showToast = (type:"success"|"error", msg:string) => { setToast({type,msg}); setTimeout(()=>setToast(null),4000); };

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      if (statusFilter !== "all") p.set("status", statusFilter);
      const [cj, lj] = await Promise.all([apiFetch("/api/admin/challenges?" + p), apiFetch("/api/admin/challenges/leaderboard")]);
      setChallenges(cj.challenges || []); setStats(cj.stats || { total:0, active:0, completed:0, totalParticipants:0 }); setLeaderboard(lj.leaderboard || []);
    } catch (e:any) { setError(e.message); } finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { const t = setTimeout(fetchAll, search ? 400 : 0); return () => clearTimeout(t); }, [fetchAll]);

  function openAdd() { setEditing(null); setForm(emptyForm()); setView("form"); }
  function openEdit(c: Challenge) {
    setEditing(c);
    setForm({ title:c.title, description:c.description||"", category:c.category, status:c.status, start_date:c.startDate||"", end_date:c.endDate||"", reward_badge:c.rewardBadge||"", tasks:[emptyTask()] });
    setView("form");
  }
  function updateTask(i:number, field:keyof MCQTask, val:string|number) { setForm(f=>({...f, tasks:f.tasks.map((t,idx)=>idx===i?{...t,[field]:val}:t)})); }
  function addTask() { setForm(f=>({...f, tasks:[...f.tasks, emptyTask()]})); }
  function removeTask(i:number) { setForm(f=>({...f, tasks:f.tasks.filter((_,idx)=>idx!==i)})); }
  function moveTask(i:number, dir:"up"|"down") {
    setForm(f=>{ const tasks=[...f.tasks]; const j=dir==="up"?i-1:i+1; [tasks[i],tasks[j]]=[tasks[j],tasks[i]]; return {...f,tasks}; });
  }

  async function handleSave() {
    if (!form.title.trim()) { showToast("error","Title is required"); return; }
    if (!form.category)     { showToast("error","Category is required"); return; }
    for (let i=0; i<form.tasks.length; i++) {
      const t = form.tasks[i];
      if (!t.question.trim()) { showToast("error","Q"+(i+1)+": question text required"); return; }
      if (!t.option_a.trim()||!t.option_b.trim()||!t.option_c.trim()||!t.option_d.trim()) { showToast("error","Q"+(i+1)+": all 4 options required"); return; }
      if (!t.correct_option) { showToast("error","Q"+(i+1)+": mark the correct answer"); return; }
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(), description: form.description.trim()||null, category: form.category,
        status: form.status, start_date: form.start_date||null, end_date: form.end_date||null,
        reward_badge: form.reward_badge.trim()||null,
        points_reward: form.tasks.reduce((s,t)=>s+(t.points||50),0),
        tasks: form.tasks.map((t,i)=>({ title:t.question.slice(0,80)||("Q"+(i+1)), question:t.question, option_a:t.option_a, option_b:t.option_b, option_c:t.option_c, option_d:t.option_d, correct_option:t.correct_option, explanation:t.explanation, points:t.points })),
      };
      if (editing) { await apiFetch("/api/admin/challenges/"+editing.id,{method:"PATCH",body:JSON.stringify(payload)}); showToast("success","Challenge updated"); }
      else         { await apiFetch("/api/admin/challenges",{method:"POST",body:JSON.stringify(payload)}); showToast("success","Challenge created!"); }
      setView("list"); fetchAll();
    } catch (e:any) { showToast("error",e.message); } finally { setSaving(false); }
  }

  async function handleDelete(id:string, title:string) {
    if (!confirm("Delete \""+title+"\"? This cannot be undone.")) return;
    setDeleting(id);
    try { await apiFetch("/api/admin/challenges/"+id,{method:"DELETE"}); showToast("success","Deleted"); fetchAll(); }
    catch (e:any) { showToast("error",e.message); } finally { setDeleting(null); }
  }

  async function toggleStatus(c:Challenge) {
    const next = c.status==="draft"?"active":c.status==="active"?"completed":"active";
    try { await apiFetch("/api/admin/challenges/"+c.id,{method:"PATCH",body:JSON.stringify({status:next})}); fetchAll(); }
    catch (e:any) { showToast("error",e.message); }
  }

  const totalMaxPts = form.tasks.reduce((s,t)=>s+(t.points||50),0);
  if (view === "form") return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {toast && <div className={"fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium " + (toast.type==="success" ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300" : "bg-red-50 text-red-800 border-red-200")}>{toast.msg}</div>}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{editing ? "Edit Challenge" : "New Challenge"}</h1>
          <p className="text-sm text-muted-foreground mt-1">Build a quiz with multiple choice questions</p>
        </div>
        <Button variant="outline" onClick={()=>setView("list")}>Back</Button>
      </div>
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Challenge Info</p>
          <div className="space-y-1.5">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input placeholder="e.g. Financial Literacy Quiz" className="bg-muted/50" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={2} placeholder="What will users learn?" className="bg-muted/50 resize-none" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category <span className="text-destructive">*</span></Label>
              <Select value={form.category} onValueChange={v=>setForm(f=>({...f,category:v}))}>
                <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Select..."/></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reward Badge</Label>
              <Input placeholder="e.g. Finance Pro" className="bg-muted/50" value={form.reward_badge} onChange={e=>setForm(f=>({...f,reward_badge:e.target.value}))}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" className="bg-muted/50" value={form.start_date} onChange={e=>setForm(f=>({...f,start_date:e.target.value}))}/></div>
            <div className="space-y-1.5"><Label>End Date</Label><Input type="date" className="bg-muted/50" value={form.end_date} onChange={e=>setForm(f=>({...f,end_date:e.target.value}))}/></div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div><p className="text-sm font-medium">Publish immediately</p><p className="text-xs text-muted-foreground">Users can see and join right away</p></div>
            <Switch checked={form.status==="active"} onCheckedChange={v=>setForm(f=>({...f,status:v?"active":"draft"}))}/>
          </div>
        </CardContent>
      </Card>
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Questions</p>
              <p className="text-xs text-muted-foreground mt-0.5">{form.tasks.length} question{form.tasks.length!==1?"s":""} &middot; {totalMaxPts} pts max</p>
            </div>
            <Button variant="outline" size="sm" onClick={addTask}><Plus className="h-3.5 w-3.5 mr-1"/>Add Question</Button>
          </div>
          <div className="space-y-3">
            {form.tasks.map((q,i)=>(<QuestionCard key={i} q={q} idx={i} total={form.tasks.length} onChange={updateTask} onRemove={removeTask} onMove={moveTask}/>))}
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between pb-6">
        <Button variant="outline" onClick={()=>setView("list")}>Cancel</Button>
        <Button className="gradient-primary text-primary-foreground px-8" onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2"/>Saving...</> : editing ? "Save Changes" : "Create Challenge"}
        </Button>
      </div>
    </div>
  );
  return (
    <div className="space-y-6">
      {toast && <div className={"fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium " + (toast.type==="success" ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300" : "bg-red-50 text-red-800 border-red-200")}>{toast.msg}</div>}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Challenges</h1>
          <p className="text-muted-foreground text-sm mt-1">Create and manage quiz challenges for mentees</p>
        </div>
        <div className="flex gap-2">
          <Button className="gradient-primary text-primary-foreground" size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1"/>New Challenge</Button>
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}><RefreshCw className={"h-4 w-4 " + (loading?"animate-spin":"")}/></Button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {([{label:"Active",value:stats.active,icon:Flame,color:"text-orange-500"},{label:"Completed",value:stats.completed,icon:CheckCircle2,color:"text-green-500"},{label:"Participants",value:stats.totalParticipants,icon:Users,color:"text-primary"},{label:"Total",value:stats.total,icon:Trophy,color:"text-yellow-500"}] as const).map((s,i)=>(
          <Card key={i} className="glass-card"><CardContent className="p-4 flex items-center gap-3"><s.icon className={"h-5 w-5 "+s.color}/><div><p className="text-xl font-bold">{s.value}</p><p className="text-[10px] text-muted-foreground">{s.label}</p></div></CardContent></Card>
        ))}
      </div>
      {error && <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20"><AlertCircle className="h-5 w-5 shrink-0"/><p className="text-sm">{error}</p></div>}
      {loading && !error && <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin"/><span>Loading...</span></div>}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input placeholder="Search challenges..." className="pl-10 bg-muted/50" value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[130px] bg-muted/50"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {challenges.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30"/>
                <p className="font-medium">No challenges yet</p>
                <Button className="gradient-primary text-primary-foreground mt-4" size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1"/>Create First Challenge</Button>
              </div>
            ) : challenges.map(c=>(
              <Card key={c.id} className="glass-card hover:shadow-lg transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-sm">{c.title}</h3>
                        <Badge className={"text-[10px] border-0 " + (STATUS_CLS[c.status]||"")}>{c.status}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{c.category}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3"/>{c.participants} joined</span>
                        <span>{c.tasks.length} questions</span>
                        {c.rewardBadge && <span>{"🏆 "+c.rewardBadge}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=>openEdit(c)}><Edit className="h-4 w-4"/></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={deleting===c.id} onClick={()=>handleDelete(c.id,c.title)}>
                        {deleting===c.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                      </Button>
                    </div>
                  </div>
                  {c.participants > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Completion rate</span><span className="font-medium">{c.completionRate}%</span></div>
                      <Progress value={c.completionRate} className="h-1.5"/>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">{c.pointsReward} pts reward</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground capitalize">{c.status}</span>
                      <Switch checked={c.status==="active"} onCheckedChange={()=>toggleStatus(c)} className="scale-75"/>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="glass-card h-fit">
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500"/>Leaderboard</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {leaderboard.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No scores yet</p>
              : leaderboard.map(u=>(
                <div key={u.rank} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className={"h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 " + (u.rank===1?"bg-yellow-400 text-white":u.rank===2?"bg-gray-300 text-gray-700":u.rank===3?"bg-orange-400 text-white":"bg-muted text-muted-foreground")}>
                    {u.rank<=3 ? ["🥇","🥈","🥉"][u.rank-1] : u.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{u.username}</p>
                    <p className="text-xs text-muted-foreground">{u.points} pts &middot; {u.badges} badges</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
