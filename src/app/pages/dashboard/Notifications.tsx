import { useState, useEffect, useCallback } from "react";
import { Bell, MessageSquare, Calendar, Trophy, Users, CheckCircle2, AlertCircle, Info, Trash2, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface Notification {
  id: string; type: string; title: string; body: string | null;
  is_read: boolean; link: string | null; created_at: string;
}

const TYPE_CFG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  message:     { icon: MessageSquare, color: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-900/20" },
  session:     { icon: Calendar,      color: "text-primary",    bg: "bg-accent/50" },
  achievement: { icon: Trophy,        color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
  goal:        { icon: CheckCircle2,  color: "text-green-500",  bg: "bg-green-50 dark:bg-green-900/20" },
  community:   { icon: Users,         color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
  challenge:   { icon: AlertCircle,   color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
  system:      { icon: Info,          color: "text-muted-foreground", bg: "bg-muted/50" },
};

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m} minutes ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  return `${Math.floor(h / 24)} day${Math.floor(h / 24) > 1 ? "s" : ""} ago`;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread,        setUnread]        = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [tab,           setTab]           = useState("all");

  const headers = { Authorization: `Bearer ${auth.getToken()}` };

  const fetchNotifications = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API}/api/notifications`, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load notifications");
      setNotifications(json.notifications || []);
      setUnread(json.unread || 0);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  async function markRead(id: string) {
    await fetch(`${API}/api/notifications/${id}/read`, { method: "PATCH", headers });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  }

  async function markAllRead() {
    await fetch(`${API}/api/notifications/read-all`, { method: "PATCH", headers });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  }

  async function deleteNotif(id: string, wasUnread: boolean) {
    await fetch(`${API}/api/notifications/${id}`, { method: "DELETE", headers });
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (wasUnread) setUnread(prev => Math.max(0, prev - 1));
  }

  async function clearAll() {
    if (!confirm("Clear all notifications?")) return;
    await fetch(`${API}/api/notifications/clear-all`, { method: "DELETE", headers });
    setNotifications([]); setUnread(0);
  }

  const filtered = notifications.filter(n => {
    if (tab === "all")    return true;
    if (tab === "unread") return !n.is_read;
    return n.type === tab;
  });

  const TABS = [
    { value:"all",         label:"All" },
    { value:"unread",      label:"Unread" },
    { value:"message",     label:"Messages" },
    { value:"session",     label:"Sessions" },
    { value:"achievement", label:"Achievements" },
    { value:"community",   label:"Community" },
    { value:"system",      label:"System" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Notifications
            {unread > 0 && <Badge className="gradient-primary text-primary-foreground border-0">{unread} new</Badge>}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Stay updated with your mentorship journey</p>
        </div>
        <div className="flex gap-2">
          {unread > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={clearAll}>
              <Trash2 className="h-4 w-4 mr-1" /> Clear all
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchNotifications} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Total",        value: notifications.length,                                    icon: Bell,         color:"text-primary" },
          { label:"Unread",       value: unread,                                                  icon: AlertCircle,  color:"text-destructive" },
          { label:"Messages",     value: notifications.filter(n => n.type === "message").length,  icon: MessageSquare,color:"text-blue-500" },
          { label:"Achievements", value: notifications.filter(n => n.type === "achievement").length, icon: Trophy,    color:"text-yellow-500" },
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
          <Loader2 className="h-5 w-5 animate-spin" /><span>Loading notifications...</span>
        </div>
      )}

      {!loading && !error && (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/50 flex-wrap h-auto gap-1">
            {TABS.map(t => (
              <TabsTrigger key={t.value} value={t.value} className="text-xs">
                {t.label}
                {t.value === "unread" && unread > 0 && (
                  <Badge className="ml-1 gradient-primary text-primary-foreground border-0 text-[9px] px-1 h-4">{unread}</Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={tab} className="space-y-3 mt-4">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No notifications</p>
                <p className="text-sm mt-1">You're all caught up!</p>
              </div>
            ) : filtered.map(n => {
              const cfg = TYPE_CFG[n.type] || TYPE_CFG.system;
              const Icon = cfg.icon;
              return (
                <Card key={n.id}
                  className={`glass-card hover:shadow-lg transition-all cursor-pointer ${!n.is_read ? "border-l-4 border-l-primary" : ""}`}
                  onClick={() => !n.is_read && markRead(n.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`h-11 w-11 rounded-full ${cfg.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`h-5 w-5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className={`font-semibold text-sm ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                              {n.title}
                            </p>
                            {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                            <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                          </div>
                          {!n.is_read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        {!n.is_read && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => markRead(n.id)}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteNotif(n.id, !n.is_read)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
