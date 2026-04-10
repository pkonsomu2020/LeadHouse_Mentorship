import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, RefreshCw, Search, Paperclip, X, FileText, Download, MessageSquare, Users, Shield } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("lh_admin_token") || "";

// ── Types ──────────────────────────────────────────────────────────────────
interface Convo {
  key: string;
  senderId: string; senderName: string; senderRole: string;
  receiverId: string; receiverName: string; receiverRole: string;
  lastMsg: string; lastTime: string; unread: number;
}
interface Msg {
  id: string; content: string; isMe: boolean;
  isRead: boolean; createdAt: string;
  fileUrl: string | null; fileName: string | null; fileType: string | null;
}
interface ChatUser { id: string; username: string; role: string; is_active: boolean; }
// The person admin is chatting with
interface ActiveChat { userId: string; name: string; role: string; }

// ── Helpers ────────────────────────────────────────────────────────────────
const ini = (s: string) => (s || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
const fmt = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const ago = (iso: string) => {
  const m = Math.floor((Date.now() - +new Date(iso)) / 60000);
  if (m < 1) return "now"; if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};
const avatarCls = (role: string) =>
  role === "admin"  ? "bg-red-500 text-white" :
  role === "mentor" ? "bg-blue-500 text-white" :
                      "bg-emerald-500 text-white";
const pillCls = (role: string) =>
  role === "admin"  ? "bg-red-100 text-red-700" :
  role === "mentor" ? "bg-blue-100 text-blue-700" :
                      "bg-emerald-100 text-emerald-700";

async function api(path: string, opts: RequestInit = {}) {
  const r = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok()}`, ...(opts.headers || {}) },
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}

// ── Sub-components ─────────────────────────────────────────────────────────
function Pill({ role }: { role: string }) {
  return <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${pillCls(role)}`}>{role}</span>;
}

function Attachment({ url, name, type, mine }: { url: string; name: string; type: string; mine: boolean }) {
  if (type === "image") return (
    <a href={url} target="_blank" rel="noreferrer">
      <img src={url} alt={name} className="max-w-[200px] max-h-[180px] rounded-xl mt-1 object-cover" />
    </a>
  );
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className={`flex items-center gap-2 mt-1 px-3 py-2 rounded-lg text-xs ${mine ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"}`}>
      <FileText className="h-4 w-4 shrink-0" />
      <span className="truncate max-w-[150px]">{name}</span>
      <Download className="h-3 w-3 ml-auto shrink-0" />
    </a>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function AdminMessages() {
  const [tab,      setTab]      = useState<"chats"|"users">("chats");
  const [convos,   setConvos]   = useState<Convo[]>([]);
  const [users,    setUsers]    = useState<ChatUser[]>([]);
  const [msgs,     setMsgs]     = useState<Msg[]>([]);
  const [chat,     setChat]     = useState<ActiveChat | null>(null);
  const [text,     setText]     = useState("");
  const [loading,  setLoading]  = useState(true);
  const [mLoading, setMLoading] = useState(false);
  const [sending,  setSending]  = useState(false);
  const [err,      setErr]      = useState("");
  const [search,   setSearch]   = useState("");
  const [uSearch,  setUSearch]  = useState("");
  const [file,     setFile]     = useState<File | null>(null);
  const [preview,  setPreview]  = useState<string | null>(null);
  const [uploading,setUploading]= useState(false);
  const endRef  = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadConvos = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const j = await api("/api/messages/admin/all-conversations");
      setConvos(j.conversations || []);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  const loadUsers = useCallback(async () => {
    try { const j = await api("/api/messages/admin/users"); setUsers(j.users || []); } catch {}
  }, []);

  useEffect(() => { loadConvos(); loadUsers(); }, [loadConvos, loadUsers]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function openChat(c: ActiveChat) {
    setChat(c); setMsgs([]); setMLoading(true); setErr("");
    try {
      const j = await api(`/api/messages/${c.userId}`);
      setMsgs(j.messages || []);
    } catch (e: any) { setErr(e.message); }
    finally { setMLoading(false); }
  }

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      const r = new FileReader();
      r.onload = ev => setPreview(ev.target?.result as string);
      r.readAsDataURL(f);
    } else { setPreview(null); }
    e.target.value = "";
  }

  async function send() {
    if ((!text.trim() && !file) || !chat || sending) return;
    setSending(true);
    const body = text.trim(); setText("");
    try {
      let fileUrl = null, fileName = null, fileType = null;
      if (file) {
        setUploading(true);
        const fd = new FormData(); fd.append("file", file);
        const r = await fetch(`${API}/api/messages/upload`, { method: "POST", headers: { Authorization: `Bearer ${tok()}` }, body: fd });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Upload failed");
        fileUrl = j.url; fileName = j.name; fileType = j.type;
        setFile(null); setPreview(null); setUploading(false);
      }
      const j = await api("/api/messages", {
        method: "POST",
        body: JSON.stringify({ receiverId: chat.userId, content: body, fileUrl, fileName, fileType }),
      });
      setMsgs(p => [...p, j.data]);
    } catch (e: any) { setText(body); setErr(e.message); setUploading(false); }
    finally { setSending(false); }
  }

  const seen = new Set<string>();
  const filteredConvos = convos.filter(c => {
    const pairKey = [c.senderId, c.receiverId].sort().join("|");
    const matchesSearch =
      c.senderName.toLowerCase().includes(search.toLowerCase()) ||
      c.receiverName.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch || seen.has(pairKey)) return false;
    seen.add(pairKey);
    return true;
  });
  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(uSearch.toLowerCase()));

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-sm text-muted-foreground">All platform conversations</p>
        </div>
        <button onClick={loadConvos} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {err && <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm shrink-0">{err}</div>}

      <div className="flex flex-1 overflow-hidden rounded-2xl border border-border shadow-sm">

        {/* ═══════════════════════════════════════
            LEFT PANEL — conversation / user list
            ═══════════════════════════════════════ */}
        <div className="w-[300px] shrink-0 flex flex-col border-r border-border bg-white dark:bg-card">

          {/* Tabs */}
          <div className="flex border-b border-border shrink-0">
            {(["chats", "users"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-3 text-xs font-semibold capitalize flex items-center justify-center gap-1.5 transition-colors ${
                  tab === t ? "border-b-2 border-emerald-500 text-emerald-600" : "text-gray-400 hover:text-gray-600"
                }`}>
                {t === "chats" ? <MessageSquare className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                {t}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-border shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-muted rounded-lg border border-border outline-none focus:border-emerald-400"
                placeholder={tab === "chats" ? "Search chats…" : "Search users…"}
                value={tab === "chats" ? search : uSearch}
                onChange={e => tab === "chats" ? setSearch(e.target.value) : setUSearch(e.target.value)}
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {tab === "chats" ? (
              loading ? (
                <div className="flex justify-center items-center py-10 gap-2 text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" /><span className="text-xs">Loading…</span>
                </div>
              ) : filteredConvos.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No conversations</p>
                </div>
              ) : filteredConvos.map(c => {
                // Figure out who to chat with: prefer the non-admin participant
                const chatTarget = c.senderRole !== "admin"
                  ? { userId: c.senderId, name: c.senderName, role: c.senderRole }
                  : { userId: c.receiverId, name: c.receiverName, role: c.receiverRole };
                const isActive = chat?.userId === chatTarget.userId;
                return (
                  <div key={c.key}
                    onClick={() => openChat(chatTarget)}
                    className={`px-3 py-3 border-b border-border cursor-pointer transition-colors ${isActive ? "bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-l-emerald-500" : "hover:bg-gray-50 dark:hover:bg-muted/40"}`}>
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-12 h-9 shrink-0">
                        <Avatar className="h-8 w-8 absolute left-0 top-0 border-2 border-white dark:border-card">
                          <AvatarFallback className={`text-[10px] font-bold ${avatarCls(c.senderRole)}`}>{ini(c.senderName)}</AvatarFallback>
                        </Avatar>
                        <Avatar className="h-7 w-7 absolute left-4 top-1 border-2 border-white dark:border-card">
                          <AvatarFallback className={`text-[9px] font-bold ${avatarCls(c.receiverRole)}`}>{ini(c.receiverName)}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-sm font-semibold truncate">{c.senderName}</span>
                            <Pill role={c.senderRole} />
                          </div>
                          <span className="text-[10px] text-gray-400 shrink-0 ml-1">{ago(c.lastTime)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <span>↔</span>
                          <span className="font-medium text-gray-500">{c.receiverName}</span>
                          <Pill role={c.receiverRole} />
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-1">{c.lastMsg}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              filteredUsers.map(u => (
                <div key={u.id}
                  onClick={() => { openChat({ userId: u.id, name: u.username, role: u.role }); setTab("chats"); }}
                  className={`flex items-center gap-3 px-3 py-3 border-b border-border cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-muted/40 ${chat?.userId === u.id ? "bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-l-emerald-500" : ""}`}>
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className={`text-xs font-bold ${avatarCls(u.role)}`}>
                      {u.role === "admin" ? <Shield className="h-4 w-4" /> : ini(u.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.username}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Pill role={u.role} />
                      <span className={`text-[9px] ${u.is_active ? "text-emerald-500" : "text-gray-400"}`}>
                        {u.is_active ? "● active" : "○ inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════
            RIGHT PANEL — chat window
            ═══════════════════════════════════════ */}
        {!chat ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-muted/10 gap-3">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-muted flex items-center justify-center">
              <MessageSquare className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">Select a conversation</p>
            <p className="text-sm text-gray-400">or pick a user from the Users tab</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-w-0">

            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-white dark:bg-card shrink-0">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className={`text-sm font-bold ${avatarCls(chat.role)}`}>
                  {chat.role === "admin" ? <Shield className="h-4 w-4" /> : ini(chat.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{chat.name}</p>
                <Pill role={chat.role} />
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 bg-[#f0f2f5] dark:bg-muted/20">
              <div className="px-6 py-4 space-y-1 max-w-3xl mx-auto">
                {mLoading ? (
                  <div className="flex justify-center items-center py-16 gap-2 text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin" /><span>Loading messages…</span>
                  </div>
                ) : msgs.length === 0 ? (
                  <div className="flex justify-center py-16">
                    <span className="bg-white dark:bg-card text-gray-400 text-sm px-4 py-2 rounded-full shadow-sm">No messages yet</span>
                  </div>
                ) : msgs.map((m, i) => {
                  const prevDate = i > 0 ? new Date(msgs[i - 1].createdAt).toDateString() : null;
                  const thisDate = new Date(m.createdAt).toDateString();
                  const showDate = thisDate !== prevDate;
                  return (
                    <div key={m.id}>
                      {showDate && (
                        <div className="flex justify-center my-3">
                          <span className="bg-white dark:bg-card text-gray-400 text-[11px] px-3 py-1 rounded-full shadow-sm">
                            {new Date(m.createdAt).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${m.isMe ? "justify-end" : "justify-start"} mb-0.5`}>
                        <div className={`max-w-[60%] px-4 py-2 rounded-2xl shadow-sm ${
                          m.isMe
                            ? "bg-emerald-500 text-white rounded-br-sm"
                            : "bg-white dark:bg-card text-gray-800 dark:text-foreground rounded-bl-sm"
                        }`}>
                          {m.fileUrl && <Attachment url={m.fileUrl} name={m.fileName || "file"} type={m.fileType || "file"} mine={m.isMe} />}
                          {m.content && <p className="text-sm leading-relaxed">{m.content}</p>}
                          <p className={`text-[10px] mt-1 text-right ${m.isMe ? "text-emerald-100" : "text-gray-400"}`}>
                            {fmt(m.createdAt)}{m.isMe && <span className="ml-1">{m.isRead ? " ✓✓" : " ✓"}</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
            </ScrollArea>

            {/* File preview */}
            {file && (
              <div className="flex items-center gap-3 px-4 py-2 border-t border-border bg-white dark:bg-card shrink-0">
                {preview
                  ? <img src={preview} className="h-10 w-10 rounded-lg object-cover" alt="preview" />
                  : <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center"><FileText className="h-5 w-5 text-gray-400" /></div>
                }
                <p className="flex-1 text-xs truncate">{file.name}</p>
                <button onClick={() => { setFile(null); setPreview(null); }} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-border bg-white dark:bg-card shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => fileRef.current?.click()}
                  className="h-10 w-10 rounded-full flex items-center justify-center text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors shrink-0">
                  <Paperclip className="h-5 w-5" />
                </button>
                <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.mp4,.mp3" onChange={pickFile} />
                <input
                  className="flex-1 bg-gray-100 dark:bg-muted rounded-full px-4 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-400/30"
                  placeholder={`Message ${chat.name}…`}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  disabled={sending || uploading}
                />
                <button onClick={send}
                  disabled={(!text.trim() && !file) || sending || uploading}
                  className="h-10 w-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-all">
                  {sending || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
