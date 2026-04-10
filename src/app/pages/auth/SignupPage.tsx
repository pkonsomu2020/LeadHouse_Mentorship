import { useState } from "react";
import { useNavigate, Link } from "react-router";
import {
  Eye, EyeOff, Loader2, AlertCircle, Flame,
  Mail, Lock, User, MapPin, ChevronRight, ChevronLeft, CheckCircle2,
  Phone, Shield, UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

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

// Step definitions
const STEPS = [
  { title: "Account",  desc: "Create your login credentials" },
  { title: "Identity", desc: "Choose your anonymous identity" },
  { title: "Profile",  desc: "Tell us about yourself" },
  { title: "Interests",desc: "What do you want to grow in?" },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const [form, setForm] = useState({
    email:           "",
    password:        "",
    confirm:         "",
    username:        "",
    county:          "",
    age_group:       "",
    interests:       [] as string[],
    // Parental consent fields (required when age_group === "15-17")
    parent_name:     "",
    parent_email:    "",
    parent_phone:    "",
    parent_consent:  false,
  });

  const isMinor = form.age_group === "15-17";

  function set(key: string, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }));
    setError("");
  }

  function toggleInterest(interest: string) {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter(i => i !== interest)
        : [...f.interests, interest],
    }));
  }

  function validateStep(): string {
    if (step === 0) {
      if (!form.email)    return "Email is required";
      if (!/\S+@\S+\.\S+/.test(form.email)) return "Enter a valid email";
      if (!form.password) return "Password is required";
      if (form.password.length < 6) return "Password must be at least 6 characters";
      if (form.password !== form.confirm) return "Passwords do not match";
    }
    if (step === 1) {
      if (!form.username.trim()) return "Username is required";
      if (form.username.length < 3) return "Username must be at least 3 characters";
    }
    if (step === 2) {
      if (!form.county)    return "Please select your county";
      if (!form.age_group) return "Please select your age group";
      // Parental consent required for minors
      if (form.age_group === "15-17") {
        if (!form.parent_name.trim())  return "Parent/guardian name is required";
        if (!form.parent_email.trim() && !form.parent_phone.trim())
          return "Parent/guardian email or phone number is required";
        if (form.parent_email && !/\S+@\S+\.\S+/.test(form.parent_email))
          return "Enter a valid parent/guardian email";
        if (!form.parent_consent)
          return "Parent/guardian must consent before you can register";
      }
    }
    return "";
  }

  function handleNext() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setStep(s => s + 1);
  }

  async function handleSubmit() {
    setError(""); setLoading(true);
    try {
      const res  = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:          form.email,
          password:       form.password,
          username:       form.username.trim(),
          county:         form.county,
          age_group:      form.age_group,
          interests:      form.interests,
          // Parental consent (only sent for minors)
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

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl gradient-primary mb-4">
            <Flame className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Join LeadHouse</h1>
          <p className="text-muted-foreground text-sm mt-1">Discipline. Direction. Leadership.</p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Step {step + 1} of {STEPS.length} — {STEPS[step].title}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
          <div className="flex justify-between">
            {STEPS.map((s, i) => (
              <div key={i} className={`flex items-center gap-1 text-xs ${i <= step ? "text-primary font-medium" : "text-muted-foreground"}`}>
                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i < step ? "gradient-primary text-white" : i === step ? "border-2 border-primary text-primary" : "border-2 border-muted text-muted-foreground"
                }`}>
                  {i < step ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                </div>
                <span className="hidden sm:inline">{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        <Card className="glass-card">
          <CardContent className="pt-6">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 mb-4">
                <AlertCircle className="h-4 w-4 shrink-0" />{error}
              </div>
            )}

            {/* ── STEP 0: Account ── */}
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">{STEPS[0].title}</h2>
                  <p className="text-sm text-muted-foreground">{STEPS[0].desc}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
                  <span className="font-semibold">Under 18?</span> Use your parent or guardian's email address below. You'll set up their contact details in the next steps.
                </div>
                <div className="space-y-1.5">
                  <Label>Email address <span className="text-muted-foreground font-normal">(yours or parent's)</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="email" placeholder="you@email.com or parent@email.com" className="pl-10 bg-muted/50"
                      value={form.email} onChange={e => set("email", e.target.value)} autoFocus />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type={showPw ? "text" : "password"} placeholder="Min. 6 characters" className="pl-10 pr-10 bg-muted/50"
                      value={form.password} onChange={e => set("password", e.target.value)} />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type={showPw ? "text" : "password"} placeholder="Repeat your password" className="pl-10 bg-muted/50"
                      value={form.confirm} onChange={e => set("confirm", e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 1: Identity ── */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">{STEPS[1].title}</h2>
                  <p className="text-sm text-muted-foreground">{STEPS[1].desc}</p>
                </div>
                <div className="p-4 rounded-xl bg-accent/50 border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-1">🔒 Why anonymous?</p>
                  <p className="text-xs text-muted-foreground">
                    LeadHouse protects your privacy. Your username is how mentors and peers know you — no real name needed. Choose something that represents your journey.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Anonymous Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="e.g. ShadowEagle, PhoenixRider..." className="pl-10 bg-muted/50"
                      value={form.username} onChange={e => set("username", e.target.value)} autoFocus />
                  </div>
                  <p className="text-xs text-muted-foreground">3–30 characters. No real name required.</p>
                </div>
                {/* Username suggestions */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Need inspiration?</p>
                  <div className="flex flex-wrap gap-2">
                    {["ShadowEagle","PhoenixRider","LionHeart","BraveHawk","TigerStrength","WolfPack","IronWill","StormBreaker"].map(s => (
                      <button key={s} onClick={() => set("username", s)}
                        className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary hover:text-primary transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Profile ── */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">{STEPS[2].title}</h2>
                  <p className="text-sm text-muted-foreground">{STEPS[2].desc}</p>
                </div>
                <div className="space-y-1.5">
                  <Label>County <span className="text-destructive">*</span></Label>
                  <Select value={form.county} onValueChange={v => set("county", v)}>
                    <SelectTrigger className="bg-muted/50">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Select your county..." />
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
                    <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Select your age group..." /></SelectTrigger>
                    <SelectContent>
                      {AGE_GROUPS.map(a => <SelectItem key={a} value={a}>{a} years</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* ── Parental consent — shown only for 15-17 ── */}
                {isMinor && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Parental Consent Required</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                          Since you are under 18, a parent or guardian must provide their contact details and consent before you can join.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 p-4 rounded-xl bg-muted/40 border border-border">
                      <div className="flex items-center gap-2 mb-1">
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

                      <div className="space-y-1.5">
                        <Label>Email Address <span className="text-muted-foreground font-normal text-xs">(if available)</span></Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="email" placeholder="parent@email.com" className="pl-10 bg-background"
                            value={form.parent_email} onChange={e => set("parent_email", e.target.value)} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Phone Number <span className="text-muted-foreground font-normal text-xs">(if no email)</span></Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="tel" placeholder="+254 7XX XXX XXX" className="pl-10 bg-background"
                            value={form.parent_phone} onChange={e => set("parent_phone", e.target.value)} />
                        </div>
                        <p className="text-xs text-muted-foreground">At least one of email or phone is required.</p>
                      </div>

                      {/* Consent checkbox */}
                      <label className="flex items-start gap-3 cursor-pointer group mt-2">
                        <div className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          form.parent_consent
                            ? "bg-primary border-primary"
                            : "border-muted-foreground group-hover:border-primary"
                        }`}
                          onClick={() => set("parent_consent", !form.parent_consent)}>
                          {form.parent_consent && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                        </div>
                        <span className="text-xs text-muted-foreground leading-relaxed">
                          <span className="font-semibold text-foreground">I am the parent/guardian</span> of this user and I consent to their participation in the LeadHouse mentorship platform. I understand that all mentors are vetted and sessions are monitored for safety.
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                  This information helps us match you with the right mentor and community. It is kept private.
                </div>
              </div>
            )}

            {/* ── STEP 3: Interests ── */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">{STEPS[3].title}</h2>
                  <p className="text-sm text-muted-foreground">{STEPS[3].desc} — select all that apply</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(interest => (
                    <button key={interest} onClick={() => toggleInterest(interest)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                        form.interests.includes(interest)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}>
                      {interest}
                    </button>
                  ))}
                </div>
                {form.interests.length > 0 && (
                  <p className="text-xs text-primary font-medium">{form.interests.length} selected</p>
                )}
                <p className="text-xs text-muted-foreground">You can update these anytime in Settings.</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <Button variant="outline" className="flex-1" onClick={() => { setStep(s => s - 1); setError(""); }}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button className="flex-1 gradient-primary text-primary-foreground" onClick={handleNext}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button className="flex-1 gradient-primary text-primary-foreground" onClick={handleSubmit} disabled={loading}>
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating account...</>
                    : <><CheckCircle2 className="h-4 w-4 mr-2" />Create Account</>
                  }
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
