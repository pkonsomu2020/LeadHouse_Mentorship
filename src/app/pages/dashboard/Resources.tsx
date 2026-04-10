import { useState, useEffect, useCallback } from "react";
import {
  BookOpen, Video, FileText, Download, Search,
  Star, Loader2, AlertCircle, RefreshCw, ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { auth } from "@/lib/auth";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface Resource {
  id: string; title: string; type: string; category: string;
  description: string; url: string | null; duration: string | null;
  rating: number; view_count: number; author: string; created_at: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  article: BookOpen,
  video:   Video,
  pdf:     FileText,
  guide:   BookOpen,
};

const TYPE_LABELS: Record<string, string> = {
  article: "Article", video: "Video", pdf: "PDF", guide: "Guide",
};

const CATEGORIES = [
  "All", "Career", "Personal Development", "Financial Literacy",
  "Mental Health", "Relationships", "Digital Discipline", "Self-Discipline", "Others",
];

function ResourceCard({ r, onAccess }: { r: Resource; onAccess: (r: Resource) => void }) {
  const Icon = TYPE_ICONS[r.type] || BookOpen;
  const actionLabel = r.type === "video" ? "Watch" : r.type === "pdf" ? "Download" : "Read";

  return (
    <Card className="glass-card hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col">
      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-accent p-2 shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <Badge variant="secondary" className="text-[10px]">{TYPE_LABELS[r.type] || r.type}</Badge>
          </div>
          <Badge variant="outline" className="text-[10px]">{r.category}</Badge>
        </div>

        <h3 className="font-semibold text-sm mb-2 line-clamp-2 flex-1">{r.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{r.description}</p>

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span>{r.duration || "—"}</span>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{r.rating > 0 ? r.rating : "New"}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <span className="text-[10px] text-muted-foreground">{r.view_count.toLocaleString()} views</span>
          <Button size="sm" className="gradient-primary text-primary-foreground text-xs" onClick={() => onAccess(r)}>
            {r.type === "pdf" ? <Download className="h-3 w-3 mr-1" /> : <ExternalLink className="h-3 w-3 mr-1" />}
            {actionLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [search,    setSearch]    = useState("");
  const [category,  setCategory]  = useState("All");
  const [tab,       setTab]       = useState("all");

  const fetchResources = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (search)           params.set("search",   search);
      if (category !== "All") params.set("category", category);

      const res  = await fetch(`${API}/api/resources?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load resources");
      setResources(json.resources || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [search, category]);

  useEffect(() => {
    const t = setTimeout(fetchResources, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchResources]);

  async function handleAccess(r: Resource) {
    // Track view
    if (auth.isLoggedIn()) {
      fetch(`${API}/api/resources/${r.id}/view`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.getToken()}` },
      }).catch(() => {});
    }
    // Open URL or show placeholder
    if (r.url) {
      window.open(r.url, "_blank", "noopener,noreferrer");
    } else {
      alert(`"${r.title}" — content link coming soon. Check back later!`);
    }
  }

  const byType = (type: string) =>
    resources.filter(r => type === "all" || r.type === type);

  const tabTypes = [
    { value: "all",     label: "All" },
    { value: "article", label: "Articles" },
    { value: "video",   label: "Videos" },
    { value: "pdf",     label: "PDFs" },
    { value: "guide",   label: "Guides" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Resource Library</h1>
          <p className="text-muted-foreground text-sm mt-1">Curated content to support your personal growth journey</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchResources} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Search + Category filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search resources..." className="pl-10 bg-muted/50"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[200px] bg-muted/50">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
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
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/50">
            {tabTypes.map(t => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
                <Badge variant="secondary" className="ml-1.5 text-[10px]">
                  {byType(t.value).length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {tabTypes.map(t => (
            <TabsContent key={t.value} value={t.value} className="mt-6">
              {byType(t.value).length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No resources found</p>
                  <p className="text-sm mt-1">Try adjusting your search or category filter</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {byType(t.value).map(r => (
                    <ResourceCard key={r.id} r={r} onAccess={handleAccess} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
