import { useState, useEffect, useCallback } from "react";
import {
  Flag, AlertTriangle, CheckCircle2, Clock, Loader2,
  AlertCircle, RefreshCw, Plus, Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { auth } from "@/lib/auth";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface Report {
  id: string; target_type: string; target_label: string; reason: string;
  severity: string; status: string; created_at: string; updated_at: string;
}

const STATUS_CFG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  pending:       { label: "Pending",       cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  investigating: { label: "Investigating", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",         icon: AlertTriangle },
  resolved:      { label: "Resolved",      cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",     icon: CheckCircle2 },
  dismissed:     { label: "Dismissed",     cls: "bg-muted text-muted-foreground",                                           icon: Shield },
};

const SEVERITY_CFG: Record<string, string> = {
  high:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  low:    "bg-muted text-muted-foreground",
};

const REASONS = [
  "Harassment or bullying",
  "Inappropriate content",
  "Spam or scam",
  "Fake profile",
  "Hate speech",
  "Explicit content",
  "Misinformation",
  "Other",
];

const EMPTY_FORM = { targetType: "user", targetLabel: "", reason: "", details: "", severity: "medium" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function Reports() {
  const [reports,    setReports]    = useState<Report[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [toast,      setToast]      = useState<{ type: "success"|"error"; msg: string } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  function showToast(type: "success"|"error", msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 5000);
  }

  const fetchReports = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API}/api/reports`, { headers: { Authorization: `Bearer ${auth.getToken()}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load reports");
      setReports(json.reports || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  async function handleSubmit() {
    if (!form.reason || !form.targetType) { showToast("error", "Please fill in all required fields"); return; }
    setSubmitting(true);
    try {
      const res  = await fetch(`${API}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify({
          targetType:  form.targetType,
          targetLabel: form.targetLabel.trim() || null,
          reason:      form.reason,
          details:     form.details.trim() || null,
          severity:    form.severity,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.errors?.[0]?.msg);
      showToast("success", json.message);
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      fetchReports();
    } catch (e: any) { showToast("error", e.message); }
    finally { setSubmitting(false); }
  }

  const pending = reports.filter(r => r.status === "pending").length;
  const resolved = reports.filter(r => r.status === "resolved").length;

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
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Report inappropriate behaviour or content to our team</p>
        </div>
        <div className="flex gap-2">
          <Button className="gradient-primary text-primary-foreground" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Submit Report
          </Button>
          <Button variant="outline" size="sm" onClick={fetchReports} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/50 border border-primary/20">
        <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Your safety matters</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            All reports are reviewed by our moderation team. Your identity is kept anonymous. We typically respond within 24–48 hours.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Submitted",  value: reports.length, color: "text-primary" },
          { label: "Pending",    value: pending,         color: "text-yellow-500" },
          { label: "Resolved",   value: resolved,        color: "text-green-500" },
        ].map((s, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
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
          <Loader2 className="h-5 w-5 animate-spin" /><span>Loading reports...</span>
        </div>
      )}

      {!loading && !error && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Flag className="h-4 w-4 text-primary" /> Your Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No reports submitted</p>
                <p className="text-sm mt-1">If you encounter something that violates our community guidelines, please report it.</p>
                <Button className="gradient-primary text-primary-foreground mt-4" size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Submit a Report
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map(r => {
                  const statusCfg = STATUS_CFG[r.status] || STATUS_CFG.pending;
                  const StatusIcon = statusCfg.icon;
                  return (
                    <div key={r.id} className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
                      <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center shrink-0">
                        <Flag className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-sm capitalize">{r.target_type}</p>
                          {r.target_label && <span className="text-xs text-muted-foreground">— {r.target_label}</span>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{r.reason}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`text-[10px] border-0 ${SEVERITY_CFG[r.severity]}`}>{r.severity}</Badge>
                          <Badge className={`text-[10px] border-0 flex items-center gap-1 ${statusCfg.cls}`}>
                            <StatusIcon className="h-3 w-3" />{statusCfg.label}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">Submitted {fmtDate(r.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit Report Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-primary" /> Submit a Report
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-accent/50 border border-primary/20">
              <p className="text-xs text-muted-foreground">Your report is anonymous. Our team will review it within 24–48 hours.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>What are you reporting? <span className="text-destructive">*</span></Label>
                <Select value={form.targetType} onValueChange={v => setForm(f => ({ ...f, targetType: v }))}>
                  <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">A User</SelectItem>
                    <SelectItem value="message">A Message</SelectItem>
                    <SelectItem value="content">Content / Post</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v }))}>
                  <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Who or what? <span className="text-xs text-muted-foreground font-normal">(username, post title, etc.)</span></Label>
              <Input placeholder="e.g. Username or post title" className="bg-muted/50"
                value={form.targetLabel} onChange={e => setForm(f => ({ ...f, targetLabel: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label>Reason <span className="text-destructive">*</span></Label>
              <Select value={form.reason} onValueChange={v => setForm(f => ({ ...f, reason: v }))}>
                <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Select a reason..." /></SelectTrigger>
                <SelectContent>
                  {REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Additional details <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea placeholder="Describe what happened in more detail..." rows={3}
                className="bg-muted/50 resize-none" value={form.details}
                onChange={e => setForm(f => ({ ...f, details: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Submitting...</> : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
