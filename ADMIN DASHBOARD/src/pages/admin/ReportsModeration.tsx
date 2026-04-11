import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle, Shield, CheckCircle2, Clock, Loader2,
  AlertCircle, RefreshCw, Plus, Trash2, Flag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface Report {
  id: string; reporter: string; targetType: string; targetLabel: string;
  reason: string; details: string | null; severity: string; status: string;
  createdAt: string; updatedAt: string;
}
interface Stats { total: number; pending: number; investigating: number; resolved: number; dismissed: number; }
interface LogEntry { id: string; action: string; target: string; reason: string | null; admin: string; createdAt: string; }

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending:       { label: "Pending",       cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  investigating: { label: "Investigating", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  resolved:      { label: "Resolved",      cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  dismissed:     { label: "Dismissed",     cls: "bg-muted text-muted-foreground" },
};

const SEVERITY_CFG: Record<string, string> = {
  high:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  low:    "bg-muted text-muted-foreground",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function ReportsModeration() {
  const [reports,      setReports]      = useState<Report[]>([]);
  const [stats,        setStats]        = useState<Stats>({ total: 0, pending: 0, investigating: 0, resolved: 0, dismissed: 0 });
  const [modLog,       setModLog]       = useState<LogEntry[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [toast,        setToast]        = useState<{ type: "success"|"error"; msg: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sevFilter,    setSevFilter]    = useState("all");
  const [updating,     setUpdating]     = useState<string | null>(null);
  const [deleting,     setDeleting]     = useState<string | null>(null);

  // Log entry dialog
  const [logOpen,  setLogOpen]  = useState(false);
  const [logForm,  setLogForm]  = useState({ action: "", target: "", reason: "" });
  const [logSaving,setLogSaving]= useState(false);

  // Detail dialog
  const [detailReport, setDetailReport] = useState<Report | null>(null);

  function showToast(type: "success"|"error", msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 4000);
  }

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status",   statusFilter);
      if (sevFilter    !== "all") params.set("severity", sevFilter);

      const [rJson, lJson] = await Promise.all([
        apiFetch(`/api/admin/reports?${params}`),
        apiFetch("/api/admin/reports/modlog"),
      ]);
      setReports(rJson.reports || []);
      setStats(rJson.stats || { total: 0, pending: 0, investigating: 0, resolved: 0, dismissed: 0 });
      setModLog(lJson.log || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [statusFilter, sevFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleStatusChange(id: string, status: string) {
    setUpdating(id);
    try {
      await apiFetch(`/api/admin/reports/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      showToast("success", `Report marked as ${status}`);
      setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      fetchAll(); // refresh log too
    } catch (e: any) { showToast("error", e.message); }
    finally { setUpdating(null); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this report?")) return;
    setDeleting(id);
    try {
      await apiFetch(`/api/admin/reports/${id}`, { method: "DELETE" });
      showToast("success", "Report deleted");
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (e: any) { showToast("error", e.message); }
    finally { setDeleting(null); }
  }

  async function handleAddLog() {
    if (!logForm.action.trim() || !logForm.target.trim()) { showToast("error", "Action and target are required"); return; }
    setLogSaving(true);
    try {
      await apiFetch("/api/admin/reports/modlog", { method: "POST", body: JSON.stringify(logForm) });
      showToast("success", "Log entry added");
      setLogOpen(false); setLogForm({ action: "", target: "", reason: "" });
      fetchAll();
    } catch (e: any) { showToast("error", e.message); }
    finally { setLogSaving(false); }
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

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reports & Moderation</h1>
          <p className="text-muted-foreground text-sm mt-1">Review flagged content and user reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setLogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Log Entry
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {[
          { label: "Total",         value: stats.total,         icon: "🚩", color: "text-foreground" },
          { label: "Pending",       value: stats.pending,       icon: "⏳", color: "text-yellow-500" },
          { label: "Investigating", value: stats.investigating, icon: "🔍", color: "text-blue-500" },
          { label: "Resolved",      value: stats.resolved,      icon: "✅", color: "text-green-500" },
          { label: "Dismissed",     value: stats.dismissed,     icon: "🚫", color: "text-muted-foreground" },
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
        <Tabs defaultValue="reports">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="reports">
              Reports
              {stats.pending > 0 && <Badge className="ml-1.5 gradient-primary text-primary-foreground border-0 text-[10px]">{stats.pending}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="modlog">Moderation Log <Badge variant="secondary" className="ml-1.5 text-[10px]">{modLog.length}</Badge></TabsTrigger>
          </TabsList>

          {/* Reports tab */}
          <TabsContent value="reports" className="mt-4 space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px] bg-muted/50"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sevFilter} onValueChange={setSevFilter}>
                <SelectTrigger className="w-full sm:w-[140px] bg-muted/50"><SelectValue placeholder="Severity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="glass-card">
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No reports found</TableCell></TableRow>
                    ) : reports.map(r => (
                      <TableRow key={r.id} className={r.severity === "high" && r.status === "pending" ? "bg-destructive/5" : ""}>
                        <TableCell className="text-sm font-medium">{r.reporter}</TableCell>
                        <TableCell className="text-sm">
                          <div>
                            <p className="capitalize text-xs text-muted-foreground">{r.targetType}</p>
                            <p className="truncate max-w-[120px]">{r.targetLabel}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">{r.reason}</TableCell>
                        <TableCell><Badge className={`text-xs border-0 ${SEVERITY_CFG[r.severity]}`}>{r.severity}</Badge></TableCell>
                        <TableCell>
                          <Select value={r.status} onValueChange={v => handleStatusChange(r.id, v)} disabled={updating === r.id}>
                            <SelectTrigger className="h-7 w-[130px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="investigating">Investigating</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="dismissed">Dismissed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{fmtDate(r.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailReport(r)} title="View details">
                              <Flag className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                              disabled={deleting === r.id} onClick={() => handleDelete(r.id)}>
                              {deleting === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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

          {/* Moderation Log tab */}
          <TabsContent value="modlog" className="mt-4">
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> Moderation Log
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {modLog.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No moderation actions yet</p>
                ) : modLog.map(m => (
                  <div key={m.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {m.action}: <span className="text-muted-foreground">{m.target}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {m.reason && `${m.reason} · `}{fmtDate(m.createdAt)} · by {m.admin}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Report Detail Dialog */}
      <Dialog open={!!detailReport} onOpenChange={() => setDetailReport(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Report Details
            </DialogTitle>
          </DialogHeader>
          {detailReport && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Reporter</p><p className="font-medium">{detailReport.reporter}</p></div>
                <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{fmtDate(detailReport.createdAt)}</p></div>
                <div><p className="text-xs text-muted-foreground">Target Type</p><p className="font-medium capitalize">{detailReport.targetType}</p></div>
                <div><p className="text-xs text-muted-foreground">Target</p><p className="font-medium">{detailReport.targetLabel}</p></div>
              </div>
              <div><p className="text-xs text-muted-foreground mb-1">Reason</p><p className="text-sm">{detailReport.reason}</p></div>
              {detailReport.details && (
                <div><p className="text-xs text-muted-foreground mb-1">Details</p><p className="text-sm text-muted-foreground">{detailReport.details}</p></div>
              )}
              <div className="flex gap-2">
                <Badge className={`text-xs border-0 ${SEVERITY_CFG[detailReport.severity]}`}>{detailReport.severity}</Badge>
                <Badge className={`text-xs border-0 ${STATUS_CFG[detailReport.status]?.cls}`}>{STATUS_CFG[detailReport.status]?.label}</Badge>
              </div>
              <div className="flex gap-2 pt-2">
                {detailReport.status === "pending" && (
                  <Button size="sm" className="flex-1 text-xs" variant="outline"
                    onClick={() => { handleStatusChange(detailReport.id, "investigating"); setDetailReport(null); }}>
                    Mark Investigating
                  </Button>
                )}
                {detailReport.status !== "resolved" && (
                  <Button size="sm" className="flex-1 gradient-primary text-primary-foreground text-xs"
                    onClick={() => { handleStatusChange(detailReport.id, "resolved"); setDetailReport(null); }}>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Resolve
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Log Entry Dialog */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Moderation Log Entry</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Action <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. User suspended, Warning issued" className="bg-muted/50"
                value={logForm.action} onChange={e => setLogForm(f => ({ ...f, action: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Target <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Username or content title" className="bg-muted/50"
                value={logForm.target} onChange={e => setLogForm(f => ({ ...f, target: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Textarea placeholder="Why was this action taken?" rows={2} className="bg-muted/50 resize-none"
                value={logForm.reason} onChange={e => setLogForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogOpen(false)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handleAddLog} disabled={logSaving}>
              {logSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Adding...</> : "Add Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
