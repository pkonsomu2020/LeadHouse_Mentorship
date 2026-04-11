import { useEffect, useState, useCallback } from "react";
import {
  Users, MessageSquare, Calendar, Flag, CheckCircle2, Plus,
  Search, Trash2, AlertCircle, Loader2, RefreshCw, MapPin, Video,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const getToken = () => localStorage.getItem("lh_admin_token") || "";

async function apiFetch(path: string, opts: RequestInit = {}) {
  const res  = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...opts.headers },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || json.errors?.[0]?.msg || `HTTP ${res.status}`);
  return json;
}

interface Stats  { groups: number; posts: number; events: number; members: number; flagged: number; }
interface Group  { id: string; name: string; description: string; category: string; is_active: boolean; members: number; posts: number; created_at: string; }
interface Post   { id: string; title: string; category: string; post_type: string; is_flagged: boolean; like_count: number; comments: number; created_at: string; author: string; }
interface Event  { id: string; title: string; event_date: string; event_time: string; location: string; event_type: string; meeting_link: string | null; status: string; attendees: number; }

const CATEGORIES = ["Career","Personal Development","Financial Literacy","Mental Health","Relationships","Digital Discipline","Fitness","General"];
const EMPTY_GROUP = { name: "", description: "", category: "" };
const EMPTY_EVENT = { title: "", description: "", event_date: "", event_time: "", location: "", event_type: "virtual", meeting_link: "", status: "upcoming" };

function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); }

export default function CommunityManagement() {
  const [stats,       setStats]       = useState<Stats>({ groups: 0, posts: 0, events: 0, members: 0, flagged: 0 });
  const [groups,      setGroups]      = useState<Group[]>([]);
  const [posts,       setPosts]       = useState<Post[]>([]);
  const [events,      setEvents]      = useState<Event[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [toast,       setToast]       = useState<{ type: "success"|"error"; msg: string } | null>(null);
  const [groupOpen,   setGroupOpen]   = useState(false);
  const [eventOpen,   setEventOpen]   = useState(false);
  const [editEvent,   setEditEvent]   = useState<Event | null>(null);
  const [groupForm,   setGroupForm]   = useState(EMPTY_GROUP);
  const [eventForm,   setEventForm]   = useState(EMPTY_EVENT);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState<string | null>(null);
  const [toggling,    setToggling]    = useState<string | null>(null);

  function showToast(type: "success"|"error", msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 4000);
  }

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [s, g, p, e] = await Promise.all([
        apiFetch("/api/admin/community/stats"),
        apiFetch("/api/admin/community/groups"),
        apiFetch("/api/admin/community/posts"),
        apiFetch("/api/admin/community/events"),
      ]);
      setStats(s); setGroups(g.groups || []); setPosts(p.posts || []); setEvents(e.events || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleCreateGroup() {
    if (!groupForm.name.trim() || !groupForm.category) { showToast("error", "Name and category required"); return; }
    setSaving(true);
    try {
      await apiFetch("/api/admin/community/groups", { method: "POST", body: JSON.stringify(groupForm) });
      showToast("success", "Group created"); setGroupOpen(false); setGroupForm(EMPTY_GROUP); fetchAll();
    } catch (e: any) { showToast("error", e.message); }
    finally { setSaving(false); }
  }

  async function handleDeleteGroup(id: string) {
    if (!confirm("Delete this group and all its posts?")) return;
    setDeleting(id);
    try { await apiFetch(`/api/admin/community/groups/${id}`, { method: "DELETE" }); showToast("success", "Group deleted"); fetchAll(); }
    catch (e: any) { showToast("error", e.message); }
    finally { setDeleting(null); }
  }

  async function handleToggleFlag(id: string, flagged: boolean) {
    setToggling(id);
    try {
      await apiFetch(`/api/admin/community/posts/${id}/flag`, { method: "PATCH", body: JSON.stringify({ flagged: !flagged }) });
      showToast("success", flagged ? "Flag cleared" : "Post flagged");
      setPosts(prev => prev.map(p => p.id === id ? { ...p, is_flagged: !flagged } : p));
    } catch (e: any) { showToast("error", e.message); }
    finally { setToggling(null); }
  }

  async function handleDeletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    setDeleting(id);
    try { await apiFetch(`/api/admin/community/posts/${id}`, { method: "DELETE" }); showToast("success", "Post deleted"); fetchAll(); }
    catch (e: any) { showToast("error", e.message); }
    finally { setDeleting(null); }
  }

  async function handleSaveEvent() {
    if (!eventForm.title.trim() || !eventForm.event_date || !eventForm.event_type) { showToast("error", "Title, date, and type required"); return; }
    setSaving(true);
    try {
      const payload = { ...eventForm, meeting_link: eventForm.meeting_link || null, event_time: eventForm.event_time || null };
      if (editEvent) {
        await apiFetch(`/api/admin/community/events/${editEvent.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        showToast("success", "Event updated");
      } else {
        await apiFetch("/api/admin/community/events", { method: "POST", body: JSON.stringify(payload) });
        showToast("success", "Event created");
      }
      setEventOpen(false); setEditEvent(null); setEventForm(EMPTY_EVENT); fetchAll();
    } catch (e: any) { showToast("error", e.message); }
    finally { setSaving(false); }
  }

  async function handleDeleteEvent(id: string) {
    if (!confirm("Delete this event?")) return;
    setDeleting(id);
    try { await apiFetch(`/api/admin/community/events/${id}`, { method: "DELETE" }); showToast("success", "Event deleted"); fetchAll(); }
    catch (e: any) { showToast("error", e.message); }
    finally { setDeleting(null); }
  }

  function openEditEvent(e: Event) {
    setEditEvent(e);
    setEventForm({ title: e.title, description: "", event_date: e.event_date, event_time: e.event_time || "", location: e.location || "", event_type: e.event_type, meeting_link: e.meeting_link || "", status: e.status });
    setEventOpen(true);
  }

  const flaggedPosts = posts.filter(p => p.is_flagged);

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
          <h1 className="text-2xl font-bold">Community Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage peer groups, discussions, and events</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button className="gradient-primary text-primary-foreground" size="sm" onClick={() => { setEditEvent(null); setEventForm(EMPTY_EVENT); setEventOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> New Event
          </Button>
          <Button variant="outline" size="sm" onClick={() => setGroupOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Group
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Members",   value: stats.members, icon: "👥", color: "text-foreground" },
          { label: "Groups",    value: stats.groups,  icon: "🤝", color: "text-primary" },
          { label: "Posts",     value: stats.posts,   icon: "💬", color: "text-foreground" },
          { label: "Events",    value: stats.events,  icon: "📅", color: "text-primary" },
          { label: "Flagged",   value: stats.flagged, icon: "🚩", color: "text-destructive" },
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
          <Loader2 className="h-5 w-5 animate-spin" /><span>Loading...</span>
        </div>
      )}

      {!loading && !error && (
        <Tabs defaultValue="groups">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="groups">Groups <Badge variant="secondary" className="ml-1.5 text-[10px]">{groups.length}</Badge></TabsTrigger>
            <TabsTrigger value="posts">
              Posts
              {flaggedPosts.length > 0 && <Badge className="ml-1.5 gradient-primary text-primary-foreground border-0 text-[10px]">{flaggedPosts.length} flagged</Badge>}
            </TabsTrigger>
            <TabsTrigger value="events">Events <Badge variant="secondary" className="ml-1.5 text-[10px]">{events.length}</Badge></TabsTrigger>
          </TabsList>

          {/* Groups */}
          <TabsContent value="groups" className="mt-4">
            {groups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No groups yet</p>
                <Button className="gradient-primary text-primary-foreground mt-4" size="sm" onClick={() => setGroupOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Create First Group
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {groups.map(g => (
                  <Card key={g.id} className="glass-card hover:shadow-lg transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-sm">{g.name}</h3>
                          <Badge variant="secondary" className="text-[10px] mt-1">{g.category}</Badge>
                        </div>
                        <Badge className="text-[10px] border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">active</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{g.members}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{g.posts} posts</span>
                      </div>
                      <Button variant="outline" size="sm" className="text-xs text-destructive hover:text-destructive w-full"
                        disabled={deleting === g.id} onClick={() => handleDeleteGroup(g.id)}>
                        {deleting === g.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />} Delete Group
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Posts */}
          <TabsContent value="posts" className="mt-4">
            {flaggedPosts.length > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 mb-4">
                <Flag className="h-5 w-5 text-destructive shrink-0" />
                <p className="text-sm font-semibold text-destructive">{flaggedPosts.length} flagged posts need review</p>
              </div>
            )}
            <Card className="glass-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Author</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden md:table-cell">Type</TableHead>
                      <TableHead className="hidden md:table-cell">Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No posts yet</TableCell></TableRow>
                    ) : posts.map(p => (
                      <TableRow key={p.id} className={p.is_flagged ? "bg-destructive/5" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {p.is_flagged && <Flag className="h-3 w-3 text-destructive shrink-0" />}
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="gradient-primary text-primary-foreground text-[10px]">
                                {p.author.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{p.author}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{p.title}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="text-[10px] capitalize">{p.post_type}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{fmtDate(p.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className={`h-8 w-8 ${p.is_flagged ? "text-destructive" : "text-muted-foreground"}`}
                              disabled={toggling === p.id} onClick={() => handleToggleFlag(p.id, p.is_flagged)}
                              title={p.is_flagged ? "Clear flag" : "Flag post"}>
                              {toggling === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : p.is_flagged ? <CheckCircle2 className="h-4 w-4" /> : <Flag className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                              disabled={deleting === p.id} onClick={() => handleDeletePost(p.id)}>
                              {deleting === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events */}
          <TabsContent value="events" className="mt-4 space-y-3">
            {events.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No events yet</p>
              </div>
            ) : events.map(e => (
              <Card key={e.id} className="glass-card">
                <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-sm">{e.title}</h3>
                      <Badge variant="outline" className="text-[10px] capitalize">{e.event_type}</Badge>
                      <Badge className={`text-[10px] border-0 ${e.status === "upcoming" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-muted text-muted-foreground"}`}>{e.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(e.event_date)}{e.event_time ? ` · ${e.event_time}` : ""}</span>
                      {e.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</span>}
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{e.attendees} RSVPs</span>
                      {e.meeting_link && <a href={e.meeting_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline"><Video className="h-3 w-3" />Link</a>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => openEditEvent(e)}>Edit</Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                      disabled={deleting === e.id} onClick={() => handleDeleteEvent(e.id)}>
                      {deleting === e.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}

      {/* Create Group Dialog */}
      <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create Peer Group</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Career Builders" className="bg-muted/50"
                value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Category <span className="text-destructive">*</span></Label>
              <Select value={groupForm.category} onValueChange={v => setGroupForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="What is this group about?" rows={2} className="bg-muted/50 resize-none"
                value={groupForm.description} onChange={e => setGroupForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupOpen(false)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handleCreateGroup} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Creating...</> : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Event Dialog */}
      <Dialog open={eventOpen} onOpenChange={setEventOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editEvent ? "Edit Event" : "Create Event"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Career Fair & Networking" className="bg-muted/50"
                value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date <span className="text-destructive">*</span></Label>
                <Input type="date" className="bg-muted/50"
                  value={eventForm.event_date} onChange={e => setEventForm(f => ({ ...f, event_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Time</Label>
                <Input type="time" className="bg-muted/50"
                  value={eventForm.event_time} onChange={e => setEventForm(f => ({ ...f, event_time: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type <span className="text-destructive">*</span></Label>
                <Select value={eventForm.event_type} onValueChange={v => setEventForm(f => ({ ...f, event_type: v }))}>
                  <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="virtual">Virtual</SelectItem>
                    <SelectItem value="in-person">In-Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={eventForm.status} onValueChange={v => setEventForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input placeholder="e.g. Kisumu Innovation Hub or Online" className="bg-muted/50"
                value={eventForm.location} onChange={e => setEventForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Meeting Link <span className="text-xs text-muted-foreground font-normal">(for virtual events)</span></Label>
              <Input placeholder="https://meet.google.com/..." className="bg-muted/50"
                value={eventForm.meeting_link} onChange={e => setEventForm(f => ({ ...f, meeting_link: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Event details..." rows={2} className="bg-muted/50 resize-none"
                value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventOpen(false)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handleSaveEvent} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : editEvent ? "Save Changes" : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
