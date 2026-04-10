import { useEffect, useState, useCallback } from "react";
import {
  Plus, FileText, Video, BookOpen, Edit, Trash2,
  Search, AlertCircle, Loader2, RefreshCw, Eye, CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

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

interface Resource {
  id: string; title: string; type: string; category: string;
  description: string; url: string | null; duration: string | null;
  author: string; status: string; view_count: number; rating: number; created_at: string;
}
interface Stats { total: number; published: number; draft: number; totalViews: number; }

const TYPE_ICONS: Record<string, React.ElementType> = {
  article: FileText, video: Video, pdf: FileText, guide: BookOpen,
};

const CATEGORIES = [
  "Career", "Personal Development", "Financial Literacy", "Mental Health",
  "Relationships", "Digital Discipline", "Self-Discipline", "Fitness", "Others",
];

const EMPTY_FORM = { title: "", type: "article", category: "", description: "", url: "", status: "draft" };

export default function ContentResources() {
  const [resources,  setResources]  = useState<Resource[]>([]);
  const [stats,      setStats]      = useState<Stats>({ total: 0, published: 0, draft: 0, totalViews: 0 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [toast,      setToast]      = useState<{ type: "success"|"error"; msg: string } | null>(null);
  const [search,     setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing,    setEditing]    = useState<Resource | null>(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading,  setUploading]  = useState(false);

  function showToast(type: "success"|"error", msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 4000);
  }

  const fetchResources = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (search)                  params.set("search", search);
      if (typeFilter   !== "all")  params.set("type",   typeFilter);
      if (statusFilter !== "all")  params.set("status", statusFilter);
      const json = await apiFetch(`/api/admin/resources?${params}`);
      setResources(json.resources || []);
      setStats(json.stats || { total: 0, published: 0, draft: 0, totalViews: 0 });
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [search, typeFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchResources, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchResources]);

  function openAdd() {
    setEditing(null); setForm(EMPTY_FORM); setUploadFile(null); setDialogOpen(true);
  }
  function openEdit(r: Resource) {
    setEditing(r);
    setForm({ title: r.title, type: r.type, category: r.category, description: r.description || "",
      url: r.url || "", status: r.status });
    setUploadFile(null);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.category || !form.description.trim()) {
      showToast("error", "Title, category, and description are required"); return;
    }
    setSaving(true);
    try {
      let fileUrl = form.url;

      // If a file was selected, upload it first
      if (uploadFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", uploadFile);
        const uploadRes = await fetch(`${API}/api/admin/resources/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
          body: formData,
        });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadJson.error || "File upload failed");
        fileUrl = uploadJson.url;
        setUploading(false);
      }

      const payload = { ...form, url: fileUrl || null };
      if (editing) {
        await apiFetch(`/api/admin/resources/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        showToast("success", "Resource updated");
      } else {
        await apiFetch("/api/admin/resources", { method: "POST", body: JSON.stringify(payload) });
        showToast("success", "Resource created");
      }
      setDialogOpen(false); fetchResources();
    } catch (e: any) { showToast("error", e.message); setUploading(false); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await apiFetch(`/api/admin/resources/${id}`, { method: "DELETE" });
      showToast("success", "Resource deleted");
      fetchResources();
    } catch (e: any) { showToast("error", e.message); }
    finally { setDeleting(null); }
  }

  async function handleToggleStatus(r: Resource) {
    const newStatus = r.status === "published" ? "draft" : "published";
    try {
      await apiFetch(`/api/admin/resources/${r.id}`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
      showToast("success", `Resource ${newStatus}`);
      fetchResources();
    } catch (e: any) { showToast("error", e.message); }
  }

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

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Content & Resources</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage the resource library</p>
        </div>
        <div className="flex gap-2">
          <Button className="gradient-primary text-primary-foreground" size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" /> Add Resource
          </Button>
          <Button variant="outline" size="sm" onClick={fetchResources} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total",      value: stats.total,      color: "text-primary" },
          { label: "Published",  value: stats.published,  color: "text-green-500" },
          { label: "Drafts",     value: stats.draft,      color: "text-yellow-500" },
          { label: "Total Views",value: stats.totalViews.toLocaleString(), color: "text-primary" },
        ].map((s, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
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
          <Loader2 className="h-5 w-5 animate-spin" /><span>Loading resources...</span>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search resources..." className="pl-10 bg-muted/50"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[130px] bg-muted/50"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="guide">Guide</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[130px] bg-muted/50"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resource cards */}
          {resources.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No resources found</p>
              <Button className="gradient-primary text-primary-foreground mt-4" size="sm" onClick={openAdd}>
                <Plus className="h-4 w-4 mr-1" /> Add First Resource
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {resources.map(r => {
                const TypeIcon = TYPE_ICONS[r.type] || FileText;
                return (
                  <Card key={r.id} className="glass-card hover:shadow-lg transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-accent p-2 shrink-0">
                            <TypeIcon className="h-4 w-4 text-primary" />
                          </div>
                          <Badge variant="secondary" className="text-[10px] capitalize">{r.type}</Badge>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge className={`text-[10px] border-0 ${
                            r.status === "published"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}>{r.status}</Badge>
                        </div>
                      </div>

                      <h3 className="font-semibold text-sm mb-1 line-clamp-2">{r.title}</h3>
                      <p className="text-xs text-muted-foreground mb-1">{r.category}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{r.description}</p>
                      <p className="text-[10px] text-muted-foreground mb-3">
                        By {r.author} · {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {r.view_count} views
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground mr-1">
                            {r.status === "published" ? "Published" : "Draft"}
                          </span>
                          <Switch
                            checked={r.status === "published"}
                            onCheckedChange={() => handleToggleStatus(r)}
                            className="scale-75"
                          />
                        </div>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="text-xs h-7 px-2" onClick={() => openEdit(r)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs h-7 px-2 text-destructive hover:text-destructive"
                            disabled={deleting === r.id} onClick={() => handleDelete(r.id, r.title)}>
                            {deleting === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Resource" : "Add New Resource"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Building Discipline: A 30-Day Guide" className="bg-muted/50"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type <span className="text-destructive">*</span></Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category <span className="text-destructive">*</span></Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-destructive">*</span></Label>
              <Textarea placeholder="Brief description of the resource..." rows={3} className="bg-muted/50 resize-none"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            {/* Content source — URL or file upload */}
            <div className="space-y-3">
              <Label>Content Source</Label>

              {/* URL input */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Option 1 — Link to external content</p>
                <Input placeholder="https://youtube.com/... or https://docs.google.com/..."
                  className="bg-muted/50" value={form.url}
                  onChange={e => { setForm(f => ({ ...f, url: e.target.value })); setUploadFile(null); }} />
              </div>

              {/* Divider */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* File upload */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Option 2 — Upload a file from your computer</p>
                <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  uploadFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}>
                  <input type="file" className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mov,.jpg,.jpeg,.png"
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      setUploadFile(file);
                      if (file) setForm(f => ({ ...f, url: "" }));
                    }} />
                  {uploadFile ? (
                    <div className="text-center px-4">
                      <p className="text-sm font-medium text-primary truncate max-w-[280px]">{uploadFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{(uploadFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Click to upload</p>
                      <p className="text-xs text-muted-foreground mt-0.5">PDF, DOC, PPT, MP4, Images</p>
                    </div>
                  )}
                </label>
                {uploadFile && (
                  <button className="text-xs text-destructive hover:underline"
                    onClick={() => setUploadFile(null)}>
                    Remove file
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">Publish immediately</p>
                <p className="text-xs text-muted-foreground">Users can see this resource</p>
              </div>
              <Switch
                checked={form.status === "published"}
                onCheckedChange={v => setForm(f => ({ ...f, status: v ? "published" : "draft" }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handleSave} disabled={saving || uploading}>
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Uploading...</>
               : saving   ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</>
               : editing  ? "Save Changes" : "Add Resource"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
