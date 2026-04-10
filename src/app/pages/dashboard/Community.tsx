import { useState, useEffect, useCallback } from "react";
import {
  Users, MessageSquare, Heart, Calendar, MapPin, Plus,
  Loader2, AlertCircle, RefreshCw, Send, CheckCircle2, Video,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/auth";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface Group  { id: string; name: string; description: string; category: string; members: number; isJoined: boolean; }
interface Post   { id: string; title: string; content: string; category: string; postType: string; likes: number; comments: number; isLiked: boolean; createdAt: string; author: string; }
interface Event  { id: string; title: string; description: string; event_date: string; event_time: string; location: string; event_type: string; meeting_link: string | null; status: string; attendees: number; isRegistered: boolean; }

const CATEGORIES = ["Career","Personal Development","Financial Literacy","Mental Health","Relationships","Digital Discipline","Fitness","General"];

function initials(name: string) { return name.slice(0, 2).toUpperCase(); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Community() {
  const [groups,   setGroups]   = useState<Group[]>([]);
  const [posts,    setPosts]    = useState<Post[]>([]);
  const [events,   setEvents]   = useState<Event[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [toast,    setToast]    = useState<{ type: "success"|"error"; msg: string } | null>(null);
  const [postType, setPostType] = useState<"discussion"|"story">("discussion");

  // New post dialog
  const [postOpen, setPostOpen] = useState(false);
  const [postForm, setPostForm] = useState({ title: "", content: "", category: "", postType: "discussion" });
  const [posting,  setPosting]  = useState(false);

  function showToast(type: "success"|"error", msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 4000);
  }

  const headers = { Authorization: `Bearer ${auth.getToken()}` };

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [gRes, pRes, eRes] = await Promise.all([
        fetch(`${API}/api/community/groups`,  { headers }),
        fetch(`${API}/api/community/posts`,   { headers }),
        fetch(`${API}/api/community/events`,  { headers }),
      ]);
      const [gJson, pJson, eJson] = await Promise.all([gRes.json(), pRes.json(), eRes.json()]);
      if (!gRes.ok) throw new Error(gJson.error);
      setGroups(gJson.groups || []);
      setPosts(pJson.posts   || []);
      setEvents(eJson.events || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleJoinGroup(id: string, isJoined: boolean) {
    try {
      const res  = await fetch(`${API}/api/community/groups/${id}/${isJoined ? "leave" : "join"}`, { method: "POST", headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showToast("success", json.message);
      setGroups(prev => prev.map(g => g.id === id ? { ...g, isJoined: !isJoined, members: g.members + (isJoined ? -1 : 1) } : g));
    } catch (e: any) { showToast("error", e.message); }
  }

  async function handleLike(id: string, isLiked: boolean) {
    try {
      await fetch(`${API}/api/community/posts/${id}/like`, { method: "POST", headers });
      setPosts(prev => prev.map(p => p.id === id ? { ...p, isLiked: !isLiked, likes: p.likes + (isLiked ? -1 : 1) } : p));
    } catch {}
  }

  async function handleRsvp(id: string, isRegistered: boolean) {
    try {
      const res  = await fetch(`${API}/api/community/events/${id}/rsvp`, { method: "POST", headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showToast("success", json.message);
      setEvents(prev => prev.map(e => e.id === id ? { ...e, isRegistered: !isRegistered, attendees: e.attendees + (isRegistered ? -1 : 1) } : e));
    } catch (e: any) { showToast("error", e.message); }
  }

  async function handlePost() {
    if (!postForm.title.trim() || !postForm.content.trim()) { showToast("error", "Title and content required"); return; }
    setPosting(true);
    try {
      const res  = await fetch(`${API}/api/community/posts`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ title: postForm.title, content: postForm.content, category: postForm.category || null, postType: postForm.postType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.errors?.[0]?.msg);
      showToast("success", "Post published!");
      setPostOpen(false);
      setPostForm({ title: "", content: "", category: "", postType: "discussion" });
      fetchAll();
    } catch (e: any) { showToast("error", e.message); }
    finally { setPosting(false); }
  }

  const discussions = posts.filter(p => p.postType === "discussion");
  const stories     = posts.filter(p => p.postType === "story");
  const myGroups    = groups.filter(g => g.isJoined).length;
  const upcomingEvt = events.filter(e => e.status === "upcoming").length;

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

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Community</h1>
          <p className="text-muted-foreground text-sm mt-1">Connect with peers, share experiences, and grow together</p>
        </div>
        <div className="flex gap-2">
          <Button className="gradient-primary text-primary-foreground" size="sm" onClick={() => setPostOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Post
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Members",  value: groups.reduce((a, g) => a + g.members, 0), icon: Users,         color: "text-primary" },
          { label: "Your Groups",    value: myGroups,                                   icon: Users,         color: "text-primary" },
          { label: "Discussions",    value: discussions.length,                         icon: MessageSquare, color: "text-primary" },
          { label: "Upcoming Events",value: upcomingEvt,                                icon: Calendar,      color: "text-primary" },
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
          <Loader2 className="h-5 w-5 animate-spin" /><span>Loading community...</span>
        </div>
      )}

      {!loading && !error && (
        <Tabs defaultValue="groups">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="groups">Peer Groups <Badge variant="secondary" className="ml-1.5 text-[10px]">{groups.length}</Badge></TabsTrigger>
            <TabsTrigger value="stories">Stories <Badge variant="secondary" className="ml-1.5 text-[10px]">{stories.length}</Badge></TabsTrigger>
            <TabsTrigger value="discussions">Discussions <Badge variant="secondary" className="ml-1.5 text-[10px]">{discussions.length}</Badge></TabsTrigger>
            <TabsTrigger value="events">Events <Badge variant="secondary" className="ml-1.5 text-[10px]">{events.length}</Badge></TabsTrigger>
          </TabsList>

          {/* Groups */}
          <TabsContent value="groups" className="mt-4">
            {groups.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground"><Users className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No groups yet</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map(g => (
                  <Card key={g.id} className="glass-card hover:shadow-lg transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{g.name}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">{g.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-[10px]">{g.category}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />{g.members}</span>
                        </div>
                        <Button size="sm" variant={g.isJoined ? "outline" : "default"}
                          className={g.isJoined ? "text-xs" : "gradient-primary text-primary-foreground text-xs"}
                          onClick={() => handleJoinGroup(g.id, g.isJoined)}>
                          {g.isJoined ? "Leave" : "Join Group"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Stories */}
          <TabsContent value="stories" className="mt-4 space-y-4">
            {stories.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Heart className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No stories yet</p>
                <Button className="gradient-primary text-primary-foreground mt-4" size="sm" onClick={() => { setPostForm(f => ({ ...f, postType: "story" })); setPostOpen(true); }}>
                  <Plus className="h-4 w-4 mr-1" /> Share Your Story
                </Button>
              </div>
            ) : stories.map(p => (
              <Card key={p.id} className="glass-card hover:shadow-lg transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="gradient-primary text-primary-foreground text-xs font-bold">{initials(p.author)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm">{p.author}</span>
                        {p.category && <Badge variant="secondary" className="text-[10px]">{p.category}</Badge>}
                        <span className="text-xs text-muted-foreground">{timeAgo(p.createdAt)}</span>
                      </div>
                      <h3 className="font-semibold mb-2">{p.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{p.content}</p>
                      <div className="flex items-center gap-4">
                        <button onClick={() => handleLike(p.id, p.isLiked)}
                          className={`flex items-center gap-1.5 text-sm transition-colors ${p.isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}>
                          <Heart className={`h-4 w-4 ${p.isLiked ? "fill-red-500" : ""}`} />{p.likes}
                        </button>
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MessageSquare className="h-4 w-4" />{p.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Discussions */}
          <TabsContent value="discussions" className="mt-4 space-y-3">
            <Button className="gradient-primary text-primary-foreground w-full" size="sm"
              onClick={() => { setPostForm(f => ({ ...f, postType: "discussion" })); setPostOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Start New Discussion
            </Button>
            {discussions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No discussions yet — start one!</p></div>
            ) : discussions.map(p => (
              <Card key={p.id} className="glass-card hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="gradient-primary text-primary-foreground text-xs font-bold">{initials(p.author)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm">{p.author}</span>
                        {p.category && <Badge variant="secondary" className="text-[10px]">{p.category}</Badge>}
                      </div>
                      <h3 className="font-semibold text-sm mb-2">{p.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <button onClick={() => handleLike(p.id, p.isLiked)}
                          className={`flex items-center gap-1 transition-colors ${p.isLiked ? "text-red-500" : "hover:text-red-500"}`}>
                          <Heart className={`h-3.5 w-3.5 ${p.isLiked ? "fill-red-500" : ""}`} />{p.likes}
                        </button>
                        <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{p.comments} replies</span>
                        <span>{timeAgo(p.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Events */}
          <TabsContent value="events" className="mt-4 space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground"><Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No events yet</p></div>
            ) : events.map(e => (
              <Card key={e.id} className="glass-card hover:shadow-lg transition-all">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold">{e.title}</h3>
                        <Badge variant={e.event_type === "virtual" ? "secondary" : "default"}
                          className={e.event_type === "in-person" ? "gradient-primary text-primary-foreground border-0 text-[10px]" : "text-[10px]"}>
                          {e.event_type === "virtual" ? "Virtual" : "In-Person"}
                        </Badge>
                        <Badge className={`text-[10px] border-0 ${e.status === "upcoming" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-muted text-muted-foreground"}`}>
                          {e.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />{fmtDate(e.event_date)}{e.event_time ? ` at ${e.event_time}` : ""}</p>
                        <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{e.location || "TBD"}</p>
                        <p className="flex items-center gap-2"><Users className="h-3.5 w-3.5" />{e.attendees} attending</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {e.status === "upcoming" && (
                        <Button size="sm"
                          className={e.isRegistered ? "text-xs" : "gradient-primary text-primary-foreground text-xs"}
                          variant={e.isRegistered ? "outline" : "default"}
                          onClick={() => handleRsvp(e.id, e.isRegistered)}>
                          {e.isRegistered ? "Cancel RSVP" : "Register"}
                        </Button>
                      )}
                      {e.isRegistered && e.meeting_link && (
                        <a href={e.meeting_link} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline" className="text-xs w-full">
                            <Video className="h-3 w-3 mr-1" /> Join
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}

      {/* New Post Dialog */}
      <Dialog open={postOpen} onOpenChange={setPostOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              {(["discussion", "story"] as const).map(t => (
                <button key={t} onClick={() => setPostForm(f => ({ ...f, postType: t }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all capitalize ${
                    postForm.postType === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                  }`}>{t}</button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input placeholder={postForm.postType === "story" ? "My success story title..." : "What's your question or topic?"} className="bg-muted/50"
                value={postForm.title} onChange={e => setPostForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Content <span className="text-destructive">*</span></Label>
              <Textarea placeholder="Share your thoughts..." rows={4} className="bg-muted/50 resize-none"
                value={postForm.content} onChange={e => setPostForm(f => ({ ...f, content: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={postForm.category} onValueChange={v => setPostForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Select category..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPostOpen(false)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handlePost} disabled={posting}>
              {posting ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Posting...</> : <><Send className="h-4 w-4 mr-1" />Post</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
