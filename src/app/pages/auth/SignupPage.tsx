import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router";
import {
  Eye, EyeOff, Loader2, AlertCircle, Flame, CheckCircle2, Circle,
  Mail, Lock, User, MapPin, Phone, Shield, UserCheck, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const INTERESTS = [
  "Career Development","Technology & Innovation","Financial Literacy",
  "Mental Health & Wellness","Fitness & Discipline","Relationships",
  "Personal Development","Digital Discipline","Education","Entrepreneurship",
];

const AGE_GROUPS = ["15-17","18-21","22-25","26-30","31+"];

const SUGGESTIONS = ["ShadowEagle","PhoenixRider","LionHeart","BraveHawk","TigerStrength","WolfPack","IronWill","StormBreaker"];

function getPasswordReqs(pw: string) {
  return [
    { label: "At least 8 characters",  met: pw.length >= 8 },
    { label: "One uppercase letter",    met: /[A-Z]/.test(pw) },
    { label: "One lowercase letter",    met: /[a-z]/.test(pw) },
    { label: "One number",              met: /[0-9]/.test(pw) },
    { label: "One special character",   met: /[^A-Za-z0-9]/.test(pw) },
  ];
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Username availability
  const [usernameStatus, setUsernameStatus] = useState<"idle"|"checking"|"available"|"taken"|"invalid">("idle");
  const [usernameMsg,    setUsernameMsg]    = useState("");

  const [form, setForm] = useState({
    email:          "",
    username:       "",
    county:         "",
    age_group:      "",
    interests:      [] as string[],
    password:       "",
    confirm:        "",
    parent_name:    "",
    parent_email:   "",
    parent_phone:   "",
    parent_consent: false,
  });

  const isMinor    = form.age_group === "15-17";
  const pwReqs     = getPasswordReqs(form.password);
  const allPwMet   = pwReqs.every(r => r.met);
  const pwMatch    = form.password === form.confirm && form.confirm !== "";

  function set(key: string, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }));
    if (key !== "username") setError("");
  }

  function toggleInterest(interest: string) {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter(i => i !== interest)
        : [...f.interests, interest],
    }));
  }

  // ── Debounced username availability check ──────────────────────
  const checkUsername = useCallback(async (username: string) => {
    const u = username.trim();
    if (u.length < 3) {
      setUsernameStatus("idle"); setUsernameMsg(""); return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(u)) {
      setUsernameStatus("invalid");
      setUsernameMsg("Only letters, numbers, _ and - allowed"); return;
    }
    setUsernameStatus("checking");
    try {
      const res  = await fetch(`${API}/api/auth/check-username?username=${encodeURIComponent(u)}`);
      const json = await res.json();
      setUsernameStatus(json.available ? "available" : "taken");
      setUsernameMsg(json.message);
    } catch {
      setUsernameStatus("idle"); setUsernameMsg("");
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => checkUsername(form.username), 500);
    return () => clearTimeout(t);
  }, [form.username, checkUsername]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) { setError("Enter a valid email address"); return; }
    if (!form.username.trim() || form.username.length < 3) { setError("Username must be at least 3 characters"); return; }
    if (usernameStatus === "taken")   { setError("That username is already taken — choose another"); return; }
    if (usernameStatus === "invalid") { setError("Username can only contain letters, numbers, _ and -"); return; }
    if (!form.county)    { setError("Please select your county"); return; }
    if (!form.age_group) { setError("Please select your age group"); return; }
    if (isMinor) {
      if (!form.parent_name.trim()) { setError("Parent/guardian name is required"); return; }
      if (!form.parent_email.trim() && !form.parent_phone.trim()) { setError("Parent/guardian email or phone is required"); return; }
      if (!form.parent_consent) { setError("Parent/guardian must consent before you can register"); return; }
    }
    if (!allPwMet)  { setError("Password does not meet all requirements"); return; }
    if (!pwMatch)   { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:     form.email,
          password:  form.password,
          username:  form.username.trim(),
          county:    form.county,
          age_group: form.age_group,
          interests: form.interests,
          ...(isMinor && {
            parent_name:    form.parent_name.trim(),
            parent_email:   form.parent_email.trim() || null,
            parent_phone:   form.parent_phone.trim() || null,
            parent_consent: form.parent_consent,
          }),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.errors?.[0]?.msg || "Registration failed");
      localStorage.setItem("lh_token",    json.token);
      localStorage.setItem("lh_username", json.user.username);
      localStorage.setItem("lh_role",     json.user.role);
      navigate("/dashboard");
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  // Username status icon
  const UsernameIcon = () => {
    if (usernameStatus === "checking")  return <Loader2   className="h-4 w-4 animate-spin text-muted-foreground" />;
    if (usernameStatus === "available") return <CheckCircle2 className="h-4 w-4 text-primary" />;
    if (usernameStatus === "taken")     return <XCircle   className="h-4 w-4 text-destructive" />;
    if (usernameStatus === "invalid")   return <AlertCircle className="h-4 w-4 text-destructive" />;
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-10">
      <div className="w-full max-w-lg space-y-6">

        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl gradient-primary mb-4">
            <Flame className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Join LeadHouse</h1>
          <p className="text-muted-foreground text-sm mt-1">Discipline. Direction. Leadership.</p>
        </div>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                  <AlertCircle className="h-4 w-4 shrink-0" />{error}
                </div>
              )}

              {/* ── Section: Account ── */}
              <div>
                <h2 className="text-base font-semibold text-foreground mb-3 pb-2 border-b border-border/50">Account</h2>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
                    <span className="font-semibold">Under 18?</span> Use your parent or guardian's email address.
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email address <span className="text-muted-foreground font-normal text-xs">(yours or parent's)</span></Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="email" placeholder="you@email.com" className="pl-10 bg-muted/50"
                        value={form.email} onChange={e => set("email", e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section: Identity ── */}
              <div>
                <h2 className="text-base font-semibold text-foreground mb-3 pb-2 border-b border-border/50">Anonymous Identity</h2>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g. ShadowEagle, IronWill..."
                        className={`pl-10 pr-10 bg-muted/50 ${
                          usernameStatus === "taken" || usernameStatus === "invalid"
                            ? "border-destructive focus-visible:ring-destructive"
                            : usernameStatus === "available"
                            ? "border-primary focus-visible:ring-primary"
                            : ""
                        }`}
                        value={form.username}
                        onChange={e => set("username", e.target.value)}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <UsernameIcon />
                      </div>
                    </div>
                    {usernameMsg && (
                      <p className={`text-xs flex items-center gap-1 ${
                        usernameStatus === "available" ? "text-primary" : "text-destructive"
                      }`}>
                        {usernameStatus === "available"
                          ? <CheckCircle2 className="h-3 w-3" />
                          : <AlertCircle  className="h-3 w-3" />}
                        {usernameMsg}
                      </p>
                    )}
                    {!usernameMsg && <p className="text-xs text-muted-foreground">3–30 characters. No real name required.</p>}
                  </div>

                  {/* Suggestions */}
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-2">Need inspiration?</p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTIONS.map(s => (
                        <button key={s} type="button" onClick={() => set("username", s)}
                          className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary hover:text-primary transition-colors font-medium">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-accent/50 border border-primary/20">
                    <p className="text-xs font-medium text-primary mb-0.5">🔒 Why anonymous?</p>
                    <p className="text-xs text-muted-foreground">Your username is how mentors and peers know you — no real name needed.</p>
                  </div>
                </div>
              </div>

              {/* ── Section: Profile ── */}
              <div>
                <h2 className="text-base font-semibold text-foreground mb-3 pb-2 border-b border-border/50">Profile</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>County <span className="text-destructive">*</span></Label>
                    <Select value={form.county} onValueChange={v => set("county", v)}>
                      <SelectTrigger className="bg-muted/50">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                          <SelectValue placeholder="Select county..." />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="max-h-[260px]">
                        {COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Age Group <span className="text-destructive">*</span></Label>
                    <Select value={form.age_group} onValueChange={v => set("age_group", v)}>
                      <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Select age..." /></SelectTrigger>
                      <SelectContent>
                        {AGE_GROUPS.map(a => <SelectItem key={a} value={a}>{a} yrs</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* ── Parental consent (minors only) ── */}
              {isMinor && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Parental Consent Required</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Since you are under 18, a parent or guardian must consent.</p>
                    </div>
                  </div>
                  <div className="space-y-3 p-4 rounded-xl bg-muted/40 border border-border">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold">Parent / Guardian Details</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Full Name <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Parent or guardian's full name" className="pl-10 bg-background"
                          value={form.parent_name} onChange={e => set("parent_name", e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Email <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="email" placeholder="parent@email.com" className="pl-10 bg-background"
                            value={form.parent_email} onChange={e => set("parent_email", e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Phone <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="tel" placeholder="+254 7XX XXX XXX" className="pl-10 bg-background"
                            value={form.parent_phone} onChange={e => set("parent_phone", e.target.value)} />
                        </div>
                      </div>
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        form.parent_consent ? "bg-primary border-primary" : "border-muted-foreground group-hover:border-primary"
                      }`} onClick={() => set("parent_consent", !form.parent_consent)}>
                        {form.parent_consent && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                      </div>
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        <span className="font-semibold text-foreground">I am the parent/guardian</span> and I consent to this user joining LeadHouse.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* ── Section: Interests ── */}
              <div>
                <h2 className="text-base font-semibold text-foreground mb-3 pb-2 border-b border-border/50">
                  Interests <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(interest => (
                    <button key={interest} type="button" onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all ${
                        form.interests.includes(interest)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}>
                      {interest}
                    </button>
                  ))}
                </div>
                {form.interests.length > 0 && (
                  <p className="text-xs text-primary font-medium mt-2">{form.interests.length} selected</p>
                )}
              </div>

              {/* ── Section: Password ── */}
              <div>
                <h2 className="text-base font-semibold text-foreground mb-3 pb-2 border-b border-border/50">Password</h2>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Password <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type={showPw ? "text" : "password"} placeholder="Create a strong password"
                        className="pl-10 pr-10 bg-muted/50"
                        value={form.password} onChange={e => set("password", e.target.value)} />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Live requirements */}
                  {form.password && (
                    <div className="space-y-1.5 p-3 rounded-xl bg-muted/50 border border-border/50">
                      <p className="text-xs font-semibold text-foreground mb-1.5">Password Requirements:</p>
                      {pwReqs.map(r => (
                        <div key={r.label} className="flex items-center gap-2 text-xs">
                          {r.met
                            ? <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                            : <Circle       className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                          <span className={r.met ? "text-primary" : "text-muted-foreground"}>{r.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label>Confirm Password <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type={showConfirm ? "text" : "password"} placeholder="Repeat your password"
                        className={`pl-10 pr-10 bg-muted/50 ${
                          form.confirm && !pwMatch ? "border-destructive" :
                          form.confirm && pwMatch  ? "border-primary" : ""
                        }`}
                        value={form.confirm} onChange={e => set("confirm", e.target.value)} />
                      <button type="button" onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {form.confirm && !pwMatch && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Passwords do not match
                      </p>
                    )}
                    {form.confirm && pwMatch && allPwMet && (
                      <p className="text-xs text-primary flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Passwords match
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full gradient-primary text-primary-foreground h-11"
                disabled={loading || usernameStatus === "taken" || usernameStatus === "invalid"}>
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating account...</>
                  : <><CheckCircle2 className="h-4 w-4 mr-2" />Create Account</>
                }
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground pb-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
