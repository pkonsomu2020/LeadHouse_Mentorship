import { useState, useEffect, useCallback } from "react";
import { Settings, Globe, CreditCard, Shield, Loader2, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const getToken = () => localStorage.getItem("lh_admin_token") || "";

async function apiFetch(path: string, opts: RequestInit = {}) {
  const res  = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...opts.headers },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

type Settings = Record<string, string>;

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [toast,    setToast]    = useState<{ type:"success"|"error"; msg:string } | null>(null);
  const [saving,   setSaving]   = useState(false);

  function showToast(type:"success"|"error", msg:string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 4000);
  }

  const fetchSettings = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const json = await apiFetch("/api/admin/settings");
      setSettings(json.settings || {});
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  function set(key: string, value: string | boolean) {
    setSettings(prev => ({ ...prev, [key]: String(value) }));
  }

  function bool(key: string, def = false) {
    return settings[key] !== undefined ? settings[key] === "true" : def;
  }

  async function handleSave(keys: string[]) {
    setSaving(true);
    try {
      const subset: Settings = {};
      keys.forEach(k => { if (settings[k] !== undefined) subset[k] = settings[k]; });
      await apiFetch("/api/admin/settings", { method: "PATCH", body: JSON.stringify({ settings: subset }) });
      showToast("success", "Settings saved");
    } catch (e: any) { showToast("error", e.message); }
    finally { setSaving(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" /><span>Loading settings...</span>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
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
          <h1 className="text-2xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Platform configuration and management</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSettings} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="h-5 w-5 shrink-0" /><p className="text-sm">{error}</p>
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="subscription">Subscriptions</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        {/* ── GENERAL ── */}
        <TabsContent value="general">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" /> Platform Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key:"platform_name",  label:"Platform Name" },
                  { key:"tagline",        label:"Tagline" },
                  { key:"support_email",  label:"Support Email" },
                  { key:"pilot_region",   label:"Pilot Region" },
                ].map(f => (
                  <div key={f.key} className="space-y-1.5">
                    <Label>{f.label}</Label>
                    <Input className="bg-muted/50" value={settings[f.key] || ""}
                      onChange={e => set(f.key, e.target.value)} />
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-3">
                {[
                  { key:"allow_registrations",      label:"Allow new registrations",  desc:"Accept new mentee sign-ups",                def:true },
                  { key:"mentor_applications_open", label:"Mentor applications open",  desc:"Accept new mentor applications",            def:true },
                  { key:"maintenance_mode",         label:"Maintenance mode",          desc:"Temporarily disable the platform",          def:false },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={bool(item.key, item.def)}
                      onCheckedChange={v => set(item.key, v)} />
                  </div>
                ))}
              </div>
              <Button className="gradient-primary text-primary-foreground" disabled={saving}
                onClick={() => handleSave(["platform_name","tagline","support_email","pilot_region","allow_registrations","mentor_applications_open","maintenance_mode"])}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SUBSCRIPTION ── */}
        <TabsContent value="subscription">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> Subscription Plans
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name:"Basic Plan",   price:"KES 300/mo", features:["Mentor matching","1 session/week","Basic resources"],                          subscribers:280 },
                { name:"Growth Plan",  price:"KES 500/mo", features:["Unlimited sessions","Goal tracking","Full resource library","Journal"],         subscribers:180 },
                { name:"Premium Plan", price:"KES 1,000/mo",features:["Priority matching","Video sessions","1-on-1 coaching","All features"],         subscribers:50  },
              ].map((plan, i) => (
                <div key={i} className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{plan.name}</h3>
                      <p className="text-sm text-primary font-bold">{plan.price}</p>
                    </div>
                    <Badge variant="secondary">{plan.subscribers} subscribers</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {plan.features.map(f => <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>)}
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">Edit Plan</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SECURITY ── */}
        <TabsContent value="security">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key:"enforce_mentor_vetting",  label:"Enforce mentor vetting",          desc:"Require background checks for all mentors",          def:true },
                { key:"parental_consent_minors", label:"Parental consent for minors",     desc:"Require guardian consent for users under 18",        def:true },
                { key:"anonymous_usernames",     label:"Anonymous identity enforcement",  desc:"Require anonymous usernames for all users",          def:true },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch checked={bool(item.key, item.def)}
                    onCheckedChange={v => set(item.key, v)} />
                </div>
              ))}
              <Button className="gradient-primary text-primary-foreground" disabled={saving}
                onClick={() => handleSave(["enforce_mentor_vetting","parental_consent_minors","anonymous_usernames"])}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : "Save Security Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── APPEARANCE ── */}
        <TabsContent value="appearance">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" /> Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">Theme</p>
                  <p className="text-xs text-muted-foreground">Toggle between light and dark mode</p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
