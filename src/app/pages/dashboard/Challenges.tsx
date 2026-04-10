import { useState, useEffect, useCallback } from "react";
import { Trophy, Flame, CheckCircle2, Award, Loader2, AlertCircle, RefreshCw, Zap, X, ChevronRight, Target, BookOpen, Star, Calendar, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const hdrs = () => ({ Authorization: `Bearer ${auth.getToken()}` });

interface Task {
  id: string; title: string; order_index: number; points: number;
  question?: string; option_a?: string; option_b?: string; option_c?: string; option_d?: string;
  correct_option?: string; explanation?: string;
  completed: boolean; chosenOption?: string; isCorrect?: boolean; pointsEarned?: number;
}
interface Challenge {
  id: string; title: string; description: string; category: string; status: string;
  startDate?: string; endDate?: string; daysLeft: number | null;
  rewardBadge: string; pointsReward: number; participants: number;
  tasks: Task[]; isJoined: boolean; isCompleted: boolean; progress: number; score: number;
}
interface Stats { active: number; completed: number; totalPoints: number; badges: number; }
interface LeaderEntry { rank: number; userId: string; username: string; points: number; badges: number; }

const RANK_COLORS: Record<number, string> = { 1: "bg-yellow-400 text-white", 2: "bg-gray-300 text-gray-700", 3: "bg-orange-400 text-white" };
const OPT_LABELS = ["A", "B", "C", "D"] as const;
const OPT_KEYS   = ["a", "b", "c", "d"] as const;

// ── Quiz Modal ────────────────────────────────────────────────────────────
function QuizModal({ challenge, onClose, onAnswer }: {
  challenge: Challenge;
  onClose: () => void;
  onAnswer: (challengeId: string, taskId: string, option: string) => Promise<{ isCorrect: boolean; correctOption: string; explanation: string; pointsEarned: number; }>;
}) {
  const tasks = challenge.tasks;
  // Find first unanswered question
  const firstUnanswered = tasks.findIndex(t => !t.completed);
  const [current, setCurrent] = useState(firstUnanswered >= 0 ? firstUnanswered : 0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result,   setResult]   = useState<{ isCorrect: boolean; correctOption: string; explanation: string; pointsEarned: number } | null>(null);
  const [loading,  setLoading]  = useState(false);

  const task = tasks[current];
  const isMCQ = !!task?.question;
  const answered = task?.completed;

  async function submitAnswer() {
    if (!selected || !task || loading) return;
    setLoading(true);
    try {
      const res = await onAnswer(challenge.id, task.id, selected);
      setResult(res);
    } finally { setLoading(false); }
  }

  function next() {
    setSelected(null); setResult(null);
    const nextIdx = tasks.findIndex((t, i) => i > current && !t.completed);
    if (nextIdx >= 0) setCurrent(nextIdx);
    else setCurrent(current); // stay on last if all done
  }

  const answered_count = tasks.filter(t => t.completed).length;
  const correct_count  = tasks.filter(t => t.isCorrect).length;
  const totalScore     = tasks.reduce((s, t) => s + (t.pointsEarned || 0), 0);
  const allDone        = answered_count === tasks.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-bold text-lg">{challenge.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {answered_count}/{tasks.length} answered · {correct_count} correct · {totalScore} pts earned
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 pt-4">
          <Progress value={challenge.progress} className="h-2" />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Progress</span><span>{challenge.progress}%</span>
          </div>
        </div>

        {/* All done state */}
        {allDone ? (
          <div className="px-6 py-10 text-center space-y-4">
            <div className="h-16 w-16 rounded-full gradient-primary flex items-center justify-center mx-auto">
              <Trophy className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold">Quiz Complete!</h3>
            <p className="text-muted-foreground">You answered {correct_count} out of {tasks.length} questions correctly.</p>
            <div className="flex items-center justify-center gap-6 py-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{totalScore}</p>
                <p className="text-xs text-muted-foreground">Points Earned</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-500">{correct_count}</p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-400">{tasks.length - correct_count}</p>
                <p className="text-xs text-muted-foreground">Wrong</p>
              </div>
            </div>
            {challenge.rewardBadge && (
              <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Award className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-primary">{challenge.rewardBadge}</span>
              </div>
            )}
            <Button className="gradient-primary text-primary-foreground w-full mt-2" onClick={onClose}>
              Close & View Leaderboard
            </Button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            {/* Question nav pills */}
            <div className="flex flex-wrap gap-1.5">
              {tasks.map((t, i) => (
                <button key={t.id} onClick={() => { if (!loading) { setSelected(null); setResult(null); setCurrent(i); } }}
                  className={`h-7 w-7 rounded-full text-xs font-bold transition-all ${
                    i === current ? "gradient-primary text-primary-foreground scale-110" :
                    t.completed ? (t.isCorrect ? "bg-green-100 text-green-700 dark:bg-green-900/30" : "bg-red-100 text-red-600 dark:bg-red-900/30") :
                    "bg-muted text-muted-foreground hover:bg-accent"
                  }`}>
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Question */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">Question {current + 1} of {tasks.length} · {task.points} pts</p>
              <p className="text-base font-semibold leading-snug">{task.question || task.title}</p>
            </div>

            {/* Options */}
            {isMCQ && (
              <div className="space-y-2.5">
                {OPT_KEYS.map((key, i) => {
                  const optText = task[`option_${key}` as keyof Task] as string;
                  if (!optText) return null;

                  // After answering — show correct/wrong state
                  const isChosen  = answered ? task.chosenOption === key : selected === key;
                  const isCorrect = key === (result?.correctOption || task.correct_option);
                  const showResult = answered || !!result;

                  let cls = "border border-border bg-muted/30 hover:bg-accent/50 text-foreground";
                  if (showResult) {
                    if (isCorrect)      cls = "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300";
                    else if (isChosen)  cls = "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
                    else                cls = "border-border bg-muted/20 text-muted-foreground opacity-60";
                  } else if (isChosen) {
                    cls = "border-primary bg-primary/10 text-primary";
                  }

                  return (
                    <button key={key} disabled={answered || !!result || loading}
                      onClick={() => setSelected(key)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all text-sm ${cls} ${!answered && !result ? "cursor-pointer" : "cursor-default"}`}>
                      <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        showResult && isCorrect ? "bg-green-500 text-white" :
                        showResult && isChosen  ? "bg-red-400 text-white" :
                        isChosen ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>{OPT_LABELS[i]}</span>
                      <span className="flex-1">{optText}</span>
                      {showResult && isCorrect && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Result feedback */}
            {(result || (answered && task.explanation)) && (
              <div className={`p-4 rounded-xl border text-sm ${
                (result?.isCorrect ?? task.isCorrect) ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
              }`}>
                <p className={`font-semibold mb-1 ${(result?.isCorrect ?? task.isCorrect) ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {(result?.isCorrect ?? task.isCorrect) ? `✅ Correct! +${result?.pointsEarned ?? task.pointsEarned} pts` : "❌ Wrong answer"}
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">{result?.explanation || task.explanation}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                {tasks.filter(t => !t.completed).length} questions remaining
              </span>
              {answered ? (
                <Button size="sm" className="gradient-primary text-primary-foreground" onClick={next}>
                  Next Question <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : result ? (
                <Button size="sm" className="gradient-primary text-primary-foreground" onClick={next}>
                  Next Question <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button size="sm" className="gradient-primary text-primary-foreground"
                  disabled={!selected || loading} onClick={submitAnswer}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Submit Answer
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── View Details Modal ────────────────────────────────────────────────────
function DetailModal({ challenge, onClose, onStart, joining }: {
  challenge: Challenge; onClose: () => void;
  onStart: (id: string, title: string) => void; joining: string | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-xl max-h-[88vh] overflow-y-auto">
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">{challenge.title}</h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant="secondary">{challenge.category}</Badge>
              {challenge.startDate && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Ends {new Date(challenge.endDate!).toLocaleDateString("en-GB")}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">{challenge.description}</p>
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><Zap className="h-4 w-4 text-primary" /> Why participate?</h3>
            <div className="space-y-2">
              {[
                { icon: Target, title: "Test Your Knowledge", desc: "10 multiple-choice questions on mental health and emotional wellbeing." },
                { icon: Trophy, title: "Earn Points",         desc: `Each correct answer earns you ${challenge.tasks[0]?.points || 50} pts. Max ${challenge.tasks.reduce((s,t) => s+(t.points||50),0)} pts.` },
                { icon: Star,   title: "Climb the Leaderboard", desc: "Your score is tracked by your nickname — compete with other mentees." },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                  <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                    <item.icon className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-2"><BookOpen className="h-4 w-4 text-primary" /> How it works</h3>
            <ul className="space-y-1.5">
              {["Read each question carefully and select one of the four options.", "You get instant feedback and an explanation after each answer.", "You cannot change your answer once submitted.", "Your final score is based on the number of correct answers."].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />{item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-4 pt-2 border-t border-border/50 flex-wrap text-sm text-muted-foreground">
            {challenge.daysLeft !== null && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" />{challenge.daysLeft}d left</span>}
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" />{challenge.participants} participants</span>
            <span className="flex items-center gap-1.5"><Trophy className="h-4 w-4 text-yellow-500" />{challenge.tasks.reduce((s,t)=>s+(t.points||50),0)} pts max</span>
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {!challenge.isJoined ? (
            <Button className="gradient-primary text-primary-foreground px-6" disabled={joining === challenge.id}
              onClick={() => { onStart(challenge.id, challenge.title); onClose(); }}>
              {joining === challenge.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
              Start Quiz
            </Button>
          ) : challenge.isCompleted ? (
            <Badge className="bg-green-100 text-green-700 border-0 px-4 py-2 text-sm"><CheckCircle2 className="h-4 w-4 mr-1.5" /> Completed</Badge>
          ) : (
            <Badge variant="secondary" className="px-4 py-2 text-sm">In Progress</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function Challenges() {
  const [challenges,  setChallenges]  = useState<Challenge[]>([]);
  const [stats,       setStats]       = useState<Stats>({ active: 0, completed: 0, totalPoints: 0, badges: 0 });
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [toast,       setToast]       = useState<{ type: "success"|"error"; msg: string } | null>(null);
  const [joining,     setJoining]     = useState<string | null>(null);
  const [detailC,     setDetailC]     = useState<Challenge | null>(null);
  const [quizC,       setQuizC]       = useState<Challenge | null>(null);
  const username = auth.getUsername();

  function showToast(type: "success"|"error", msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 4000);
  }

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [cr, lr] = await Promise.all([
        fetch(`${API}/api/challenges`,            { headers: hdrs() }),
        fetch(`${API}/api/challenges/leaderboard`,{ headers: hdrs() }),
      ]);
      const cj = await cr.json(); const lj = await lr.json();
      if (!cr.ok) throw new Error(cj.error || "Failed to load");
      setChallenges(cj.challenges || []);
      setStats(cj.stats || { active: 0, completed: 0, totalPoints: 0, badges: 0 });
      setLeaderboard(lj.leaderboard || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleJoin(id: string, title: string) {
    setJoining(id);
    try {
      const res  = await fetch(`${API}/api/challenges/${id}/join`, { method: "POST", headers: hdrs() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showToast("success", `Joined "${title}" — good luck!`);
      setChallenges(prev => prev.map(c => c.id === id ? { ...c, isJoined: true } : c));
      // Open quiz immediately
      const joined = challenges.find(c => c.id === id);
      if (joined) setQuizC({ ...joined, isJoined: true });
    } catch (e: any) { showToast("error", e.message); }
    finally { setJoining(null); }
  }

  async function handleAnswer(challengeId: string, taskId: string, chosenOption: string) {
    const res  = await fetch(`${API}/api/challenges/${challengeId}/tasks/${taskId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...hdrs() },
      body: JSON.stringify({ chosenOption }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    // Update local state
    setChallenges(prev => prev.map(c => {
      if (c.id !== challengeId) return c;
      const tasks = c.tasks.map(t => t.id === taskId
        ? { ...t, completed: true, chosenOption, isCorrect: json.isCorrect, pointsEarned: json.pointsEarned }
        : t);
      return { ...c, tasks, progress: json.progress, isCompleted: json.isCompleted, score: json.totalScore };
    }));
    // Refresh leaderboard after answer
    fetch(`${API}/api/challenges/leaderboard`, { headers: hdrs() })
      .then(r => r.json()).then(j => setLeaderboard(j.leaderboard || [])).catch(() => {});
    if (json.isCompleted) {
      showToast("success", `🏆 Challenge complete! You earned ${json.totalScore} pts`);
      fetchAll();
    }
    return { isCorrect: json.isCorrect, correctOption: json.correctOption, explanation: json.explanation, pointsEarned: json.pointsEarned };
  }

  // Keep quizC in sync with challenges state
  useEffect(() => {
    if (quizC) {
      const updated = challenges.find(c => c.id === quizC.id);
      if (updated) setQuizC(updated);
    }
  }, [challenges]);

  const active    = challenges.filter(c => c.status === "active");
  const completed = challenges.filter(c => c.isCompleted);

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
          toast.type === "success" ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300" : "bg-red-50 text-red-800 border-red-200"
        }`}>
          {toast.type === "success" ? <Trophy className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {detailC && <DetailModal challenge={detailC} onClose={() => setDetailC(null)} onStart={handleJoin} joining={joining} />}
      {quizC   && <QuizModal   challenge={quizC}   onClose={() => { setQuizC(null); fetchAll(); }} onAnswer={handleAnswer} />}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Challenges</h1>
          <p className="text-muted-foreground text-sm mt-1">Answer questions, earn points, climb the leaderboard</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active",       value: stats.active,      icon: Flame,        color: "text-orange-500" },
          { label: "Completed",    value: stats.completed,   icon: CheckCircle2, color: "text-green-500"  },
          { label: "Total Points", value: stats.totalPoints, icon: Trophy,       color: "text-yellow-500" },
          { label: "Badges",       value: stats.badges,      icon: Award,        color: "text-primary"    },
        ].map((s, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground">{s.label}</p><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p></div>
              <s.icon className={`h-7 w-7 opacity-60 ${s.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {error && <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20"><AlertCircle className="h-5 w-5 shrink-0" /><p className="text-sm">{error}</p></div>}
      {loading && !error && <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /><span>Loading challenges...</span></div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="active">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="active">Active <Badge variant="secondary" className="ml-1.5 text-[10px]">{active.length}</Badge></TabsTrigger>
                <TabsTrigger value="completed">Completed <Badge variant="secondary" className="ml-1.5 text-[10px]">{completed.length}</Badge></TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-4 mt-4">
                {active.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No active challenges</p>
                    <p className="text-sm mt-1">Check back soon — your mentor will post new challenges</p>
                  </div>
                ) : active.map(c => {
                  const isMCQ = c.tasks.some(t => !!t.question);
                  const maxPts = c.tasks.reduce((s, t) => s + (t.points || 50), 0);
                  return (
                    <Card key={c.id} className="glass-card hover:shadow-lg transition-all">
                      <CardContent className="p-5 space-y-4">
                        {/* Top row */}
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">{c.category}</Badge>
                            {isMCQ && <Badge className="bg-primary/10 text-primary border-0 text-xs">Quiz</Badge>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="text-xs h-8 px-3" onClick={() => setDetailC(c)}>View Details</Button>
                            {!c.isJoined ? (
                              <Button size="sm" className="gradient-primary text-primary-foreground text-xs h-8 px-3"
                                disabled={joining === c.id} onClick={() => handleJoin(c.id, c.title)}>
                                {joining === c.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Zap className="h-3 w-3 mr-1" />}
                                Start Quiz
                              </Button>
                            ) : c.isCompleted ? (
                              <Badge className="bg-green-100 text-green-700 border-0 h-8 px-3 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" /> Done</Badge>
                            ) : (
                              <Button size="sm" className="gradient-primary text-primary-foreground text-xs h-8 px-3" onClick={() => setQuizC(c)}>
                                Continue Quiz
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Title + desc */}
                        <div>
                          <h3 className="font-bold text-base mb-1">{c.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                        </div>

                        {/* Progress (if joined) */}
                        {c.isJoined && (
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">{c.tasks.filter(t=>t.completed).length}/{c.tasks.length} answered · {c.score} pts</span>
                              <span className="font-medium">{c.progress}%</span>
                            </div>
                            <Progress value={c.progress} className="h-2" />
                          </div>
                        )}

                        {/* Footer meta */}
                        <div className="flex items-center gap-4 pt-2 border-t border-border/50 text-xs text-muted-foreground flex-wrap">
                          {c.daysLeft !== null && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{c.daysLeft}d left</span>}
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.participants} joined</span>
                          <span className="flex items-center gap-1 text-primary font-medium"><Trophy className="h-3 w-3" />{maxPts} pts max</span>
                          {c.rewardBadge && <span className="flex items-center gap-1 text-primary font-medium"><Award className="h-3 w-3" />{c.rewardBadge}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4 mt-4">
                {completed.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No completed challenges yet</p>
                    <p className="text-sm mt-1">Join an active quiz to get started</p>
                  </div>
                ) : completed.map(c => (
                  <Card key={c.id} className="glass-card opacity-80">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">{c.title}</h3>
                            <Badge className="bg-green-100 text-green-700 border-0 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" /> Done</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{c.tasks.filter(t=>t.isCorrect).length}/{c.tasks.length} correct</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-bold text-primary">{c.score}</p>
                          <p className="text-[10px] text-muted-foreground">pts</p>
                        </div>
                      </div>
                      {c.rewardBadge && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-accent/50 border border-primary/20">
                          <Award className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-xs font-medium text-primary">Earned: {c.rewardBadge}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Leaderboard */}
          <Card className="glass-card h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" /> Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {leaderboard.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No scores yet — be the first!</p>
              ) : leaderboard.map(u => (
                <div key={u.rank} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  u.username === username ? "bg-accent border border-primary/30" : "bg-muted/50"
                }`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${RANK_COLORS[u.rank] || "bg-muted text-muted-foreground"}`}>
                    {u.rank <= 3 ? ["🥇","🥈","🥉"][u.rank-1] : u.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{u.username}</p>
                    <p className="text-xs text-muted-foreground">{u.points} pts · {u.badges} {u.badges === 1 ? "badge" : "badges"}</p>
                  </div>
                  {u.username === username && <Badge className="gradient-primary text-primary-foreground border-0 text-[10px]">You</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
