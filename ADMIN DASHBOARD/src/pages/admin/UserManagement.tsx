import { useEffect, useState, useCallback } from "react";
import { Search, UserCheck, UserX, Loader2, AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

interface User {
  id: string; username: string; email: string; role: string;
  status: string; county: string; sessions: number; joined: string;
  isVerified?: boolean; mentorId?: string;
}
interface Stats { total: number; active: number; pending: number; inactive: number; }

const statusColors: Record<string, string> = {
  active:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pending:  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  inactive: "bg-muted text-muted-foreground",
};

export default function UserManagement() {
  const [users,       setUsers]       = useState<User[]>([]);
  const [stats,       setStats]       = useState<Stats>({ total: 0, active: 0, pending: 0, inactive: 0 });
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [toast,       setToast]       = useState<string | null>(null);
  const [search,      setSearch]      = useState("");
  const [roleFilter,  setRoleFilter]  = useState("all");
  const [statusFilter,setStatusFilter]= useState("all");
  const [acting,      setActing]      = useState<string | null>(null);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (search)                  params.set("search", search);
      if (roleFilter   !== "all")  params.set("role",   roleFilter);
      if (statusFilter !== "all")  params.set("status", statusFilter);
      const json = await apiFetch(`/api/admin/users?${params}`);
      setUsers(json.users || []);
      setStats(json.stats || { total: 0, active: 0, pending: 0, inactive: 0 });
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  async function handleToggleStatus(u: User) {
    const newActive = u.status === "inactive";
    setActing(u.id);
    try {
      await apiFetch(`/api/admin/users/${u.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: newActive, role: u.role.toLowerCase(), mentorId: u.mentorId }),
      });
      showToast(`${u.username} ${newActive ? "activated" : "suspended"}`);
      fetchUsers();
    } catch (e: any) { setError(e.message); }
    finally { setActing(null); }
  }

  async function handleVerify(u: User) {
    setActing(u.id);
    try {
      await apiFetch(`/api/admin/users/${u.id}/verify`, {
        method: "PATCH",
        body: JSON.stringify({ mentorId: u.mentorId }),
      });
      showToast(`${u.username} verified as mentor`);
      fetchUsers();
    } catch (e: any) { setError(e.message); }
    finally { setActing(null); }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
          <UserCheck className="h-4 w-4 shrink-0" />{toast}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage mentees and mentors across the platform</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats.total,    icon: "👥", color: "text-foreground" },
          { label: "Active",      value: stats.active,   icon: "✅", color: "text-green-500" },
          { label: "Pending",     value: stats.pending,  icon: "⏳", color: "text-yellow-500" },
          { label: "Inactive",    value: stats.inactive, icon: "🚫", color: "text-muted-foreground" },
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
          <Loader2 className="h-5 w-5 animate-spin" /><span>Loading users...</span>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-10 bg-muted/50"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[130px] bg-muted/50"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="mentee">Mentees</SelectItem>
                <SelectItem value="mentor">Mentors</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[130px] bg-muted/50"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card className="glass-card">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">County</TableHead>
                    <TableHead className="hidden md:table-cell">Sessions</TableHead>
                    <TableHead className="hidden md:table-cell">Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
                  ) : users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="gradient-primary text-primary-foreground text-xs">
                              {u.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{u.username}</p>
                            <p className="text-[10px] text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{u.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs border-0 ${statusColors[u.status] || ""}`}>{u.status}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{u.county}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{u.sessions}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{u.joined}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {/* Verify mentor */}
                          {u.role === "Mentor" && u.status === "pending" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary"
                              disabled={acting === u.id} onClick={() => handleVerify(u)}
                              title="Verify mentor">
                              {acting === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                            </Button>
                          )}
                          {/* Suspend / Activate */}
                          {u.status === "active" ? (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                              disabled={acting === u.id} onClick={() => handleToggleStatus(u)}
                              title="Suspend user">
                              {acting === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                            </Button>
                          ) : u.status === "inactive" ? (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500"
                              disabled={acting === u.id} onClick={() => handleToggleStatus(u)}
                              title="Activate user">
                              {acting === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
