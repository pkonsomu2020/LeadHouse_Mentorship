import { useState, useEffect, useCallback } from "react";
import { User, Bell, Palette, CreditCard, Shield, Loader2, AlertCircle, Save, CheckCircle2, KeyRound, TrendingUp, Target, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { auth } from "@/lib/auth";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

const COUNTIES = [
  "Baringo","Bomet","Bungoma","Busia","Elgeyo-Marakwet","Embu","Garissa",
  "Homa Bay","Isiolo","Kajiado","Kakamega","Kericho","Kiambu","Kilifi",
  "Kirinyaga","Kisii","Kisumu","Kitui","Kwale","Laikipia","Lamu","Machakos",
  "Makueni","Mandera","Marsabit","Meru","Migori","Mombasa","Murang'a",
  "Nairobi","Nakuru","Nandi","Narok","Nyamira","Nyandarua","Nyeri","Samburu",
  "Siaya","Taita-Taveta","Tana River","Tharaka-Nithi","Trans Nzoia","Turkana",
  "Uasin Gishu","Vihiga","Wajir","West Pokot",
];
const INTERESTS = ["Career","Technology","Financial Literacy","Mental Health","Fitness","Relationships","Personal Development","Digital Discipline"];

const DEFAULT_PREFS = { messages: true, sessions: true, goals: true, community: true, challenges: true, journal: false, platform: false };

interface Profile { id:string; username:string; email:string; bio:string|null; county:string|null; age_group:string|null; interests:string[]|null; notificationPrefs: Record<string,boolean>; }
interface Stats { daysActive:number; goalsCompleted:number; badgesEarned:number; sessionsAttended:number; }

export default function UserSettings() {
  const [profile,  setProfile]  = useState<Profile | null>(null);
  const [stats,    setStats]    = useState<Stats>({ daysActive:0, goalsCompleted:0, badgesEarned:0, sessionsAttended:0 });
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [toast,    setToast]    = useState<{ type:"success"|"error"; msg:string } | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [pwForm,   setPwForm]   = useState({ newPassword:"", confirm:"" });
  const [pwSaving, setPwSaving] = useState(false);

  // Editable form state
  const [form, setForm] = useState({ username:"", bio:"", county:"", age_group:"", interests:[] as string[] });
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);

  function showToast(type:"success"|"error", msg:string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 4000);
  }

  const fetchProfile = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API}/api/settings/profile`, { headers: { Authorization: `Bearer ${auth.getToken()}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load profile");
      setProfile(json.profile);
      setStats(json.stats);
      setForm({ username: json.profile.username || "", bio: json.profile.bio || "", county: json.profile.county || "", age_group: json.profile.age_group || "", interests: json.profile.interests || [] });
      setPrefs({ ...DEFAULT_PREFS, ...(json.profile.notificationPrefs || {}) });
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const res  = await fetch(`${API}/api/settings/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify({ username: form.username, bio: form.bio || null, county: form.county || null, age_group: form.age_group || null, interests: form.interests }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.errors?.[0]?.msg);
      // Update localStorage username
      localStorage.setItem("lh_username", form.username);
      showToast("success", "Profile updated successfully");
      fetchProfile();
    } catch (e: any) { showToast("error", e.message); }
    finally { setSaving(false); }
  }

  async function handleSaveNotifications() {
    setSaving(true);
    try {
      const res  = await fetch(`${API}/api/settings/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify({ prefs }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showToast("success", "Notification preferences saved");
    } catch (e: any) { showToast("error", e.message); }
    finally { setSaving(false); }
  }

  async function handleChangePassword() {
    if (pwForm.newPassword !== pwForm.confirm) { showToast("error", "Passwords do not match"); return; }
    if (pwForm.newPassword.length < 6) { showToast("error", "Password must be at least 6 characters"); return; }
    setPwSaving(true);
    try {
      const res  = await fetch(`${API}/api/settings/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify({ newPassword: pwForm.newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showToast("success", "Password changed successfully");
      setPwForm({ newPassword:"", confirm:"" });
    } catch (e: any) { showToast("error", e.message); }
    finally { setPwSaving(false); }
  }

  function toggleInterest(interest: string) {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter(i => i !== interest)
        : [...f.interests, interest],
    }));
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" /><span>Loading settings...</span>
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 m-6">
      <AlertCircle className="h-5 w-5 shrink-0" /><p className="text-sm">{error}</p>
    </div>
  );

  const NOTIF_ITEMS = [
    { key:"messages",   label:"Mentor Messages",    desc:"Get notified when your mentor sends a message" },
    { key:"sessions",   label:"Session Reminders",  desc:"Reminders for upcoming mentorship sessions" },
    { key:"goals",      label:"Goal Milestones",    desc:"Notifications when you reach goal milestones" },
    { key:"community",  label:"Community Updates",  desc:"Updates from your peer groups and discussions" },
    { key:"challenges", label:"Challenge Reminders",desc:"Reminders about active challenges and deadlines" },
    { key:"journal",    label:"Journal Prompts",    desc:"Daily journal reflection prompts" },
    { key:"platform",   label:"Platform Updates",   desc:"News about new features and improvements" },
  ];

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

      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50 flex-wrap h-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        {/* ── PROFILE ── */}
        <TabsContent value="profile" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label:"Days Active",       value: stats.daysActive,       icon: TrendingUp, color:"text-primary" },
              { label:"Goals Completed",   value: stats.goalsCompleted,   icon: Target,     color:"text-green-500" },
              { label:"Badges Earned",     value: stats.badgesEarned,     icon: Award,      color:"text-yellow-500" },
              { label:"Sessions Attended", value: stats.sessionsAttended, icon: User,       color:"text-primary" },
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

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-4 border-primary/30">
                  <AvatarFallback className="gradient-primary text-primary-foreground text-xl font-bold">
                    {form.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{form.username}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  <Badge variant="secondary" className="mt-1 text-xs">Mentee</Badge>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Anonymous Username</Label>
                  <Input className="bg-muted/50" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>County</Label>
                  <Select value={form.county} onValueChange={v => setForm(f => ({ ...f, county: v }))}>
                    <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Select county..." /></SelectTrigger>
                    <SelectContent className="max-h-[260px]">{COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Age Group</Label>
                  <Select value={form.age_group} onValueChange={v => setForm(f => ({ ...f, age_group: v }))}>
                    <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Select age group..." /></SelectTrigger>
                    <SelectContent>
                      {["15-17","18-21","22-25","26-30","31+"].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Bio</Label>
                <Textarea placeholder="Tell us about yourself..." rows={3} className="bg-muted/50 resize-none"
                  value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Interests</Label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(interest => (
                    <button key={interest} onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                        form.interests.includes(interest)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}>{interest}</button>
                  ))}
                </div>
              </div>
              <Button className="gradient-primary text-primary-foreground" onClick={handleSaveProfile} disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : <><Save className="h-4 w-4 mr-1" />Save Profile</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── NOTIFICATIONS ── */}
        <TabsContent value="notifications">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" /> Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {NOTIF_ITEMS.map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch checked={prefs[item.key as keyof typeof prefs] ?? false}
                    onCheckedChange={v => setPrefs(p => ({ ...p, [item.key]: v }))} />
                </div>
              ))}
              <Button className="gradient-primary text-primary-foreground mt-2" onClick={handleSaveNotifications} disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── APPEARANCE ── */}
        <TabsContent value="appearance">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> Appearance</CardTitle></CardHeader>
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

        {/* ── SUBSCRIPTION ── */}
        <TabsContent value="subscription">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Subscription</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-accent/50 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Growth Plan</p>
                    <p className="text-sm text-muted-foreground">KES 500/month</p>
                  </div>
                  <Badge className="gradient-primary text-primary-foreground border-0">Active</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Next billing date: April 1, 2026</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Change Plan</Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PRIVACY ── */}
        <TabsContent value="privacy">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Privacy & Security</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label:"Show online status",  desc:"Let mentors see when you're online",       def:true },
                { label:"Profile visibility",  desc:"Allow other mentees to find your profile", def:false },
                { label:"Read receipts",        desc:"Show when you've read messages",           def:true },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch defaultChecked={item.def} />
                </div>
              ))}
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2"><KeyRound className="h-4 w-4" /> Change Password</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>New Password</Label>
                    <Input type="password" placeholder="Min. 6 characters" className="bg-muted/50"
                      value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Confirm Password</Label>
                    <Input type="password" placeholder="Repeat new password" className="bg-muted/50"
                      value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleChangePassword} disabled={pwSaving || !pwForm.newPassword}>
                  {pwSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Updating...</> : "Update Password"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
