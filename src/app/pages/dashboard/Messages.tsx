import { useState, useEffect, useCallback, useRef } from "react";
import { Send, Loader2, AlertCircle, RefreshCw, Shield, UserPlus, Paperclip, X, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router";
import { auth } from "@/lib/auth";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface Conversation { userId: string; username: string; role: string; lastMsg: string; lastTime: string; unread: number; }
interface Message { id: string; content: string; senderId: string; isMe: boolean; isRead: boolean; createdAt: string; fileUrl?: string; fileName?: string; fileType?: string; }
interface MatchedMentor { userId: string; username: string; role: string; field?: string; avatar?: string; county?: string; }

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function FileAttachment({ url, name, type, isMe }: { url: string; name: string; type: string; isMe: boolean }) {
  if (type === "image") {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block mt-1">
        <img src={url} alt={name} className="max-w-[220px] max-h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity" />
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className={`flex items-center gap-2 mt-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
        isMe ? "bg-white/20 hover:bg-white/30 text-white" : "bg-muted hover:bg-muted/80 text-foreground"
      }`}>
      <FileText className="h-4 w-4 shrink-0" />
      <span className="truncate max-w-[160px]">{name}</span>
      <Download className="h-3 w-3 shrink-0 ml-auto" />
    </a>
  );
}

export default function Messages() {
  const navigate = useNavigate();
  const [conversations,  setConversations]  = useState<Conversation[]>([]);
  const [messages,       setMessages]       = useState<Message[]>([]);
  const [activeConvo,    setActiveConvo]    = useState<Conversation | null>(null);
  const [matchedMentors, setMatchedMentors] = useState<MatchedMentor[]>([]);
  const [text,           setText]           = useState("");
  const [loading,        setLoading]        = useState(true);
  const [msgLoading,     setMsgLoading]     = useState(false);
  const [sending,        setSending]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [attachFile,     setAttachFile]     = useState<File | null>(null);
  const [attachPreview,  setAttachPreview]  = useState<string | null>(null);
  const [uploading,      setUploading]      = useState(false);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const headers = { Authorization: `Bearer ${auth.getToken()}` };

  const fetchConversations = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API}/api/messages/conversations`, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setConversations(json.conversations || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const fetchMatchedMentors = useCallback(async () => {
    const role = auth.getRole();
    try {
      if (role === "mentee") {
        const res = await fetch(`${API}/api/messages/my-mentor`, { headers });
        if (res.ok) { const j = await res.json(); setMatchedMentors(j.mentors || []); }
      } else if (role === "mentor") {
        const res = await fetch(`${API}/api/messages/my-mentees`, { headers });
        if (res.ok) { const j = await res.json(); setMatchedMentors(j.mentees || []); }
      }
    } catch {}
  }, []);

  useEffect(() => { fetchConversations(); fetchMatchedMentors(); }, [fetchConversations, fetchMatchedMentors]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function openChat(convo: Conversation) {
    setActiveConvo(convo);
    setMsgLoading(true);
    try {
      const res  = await fetch(`${API}/api/messages/${convo.userId}`, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMessages(json.messages || []);
      setConversations(prev => prev.map(c => c.userId === convo.userId ? { ...c, unread: 0 } : c));
    } catch {}
    finally { setMsgLoading(false); }
  }

  function startMentorChat(mentor: MatchedMentor) {
    const existing = conversations.find(c => c.userId === mentor.userId);
    const convo = existing || { userId: mentor.userId, username: mentor.username, role: "mentor", lastMsg: "", lastTime: new Date().toISOString(), unread: 0 };
    if (!existing) setConversations(prev => [convo, ...prev]);
    openChat(convo);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = ev => setAttachPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setAttachPreview(null);
    }
    e.target.value = "";
  }

  async function handleSend() {
    if ((!text.trim() && !attachFile) || !activeConvo) return;
    setSending(true);
    const content = text.trim();
    setText("");
    try {
      let fileUrl: string | null = null;
      let fileName: string | null = null;
      let fileType: string | null = null;

      if (attachFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append("file", attachFile);
        const upRes  = await fetch(`${API}/api/messages/upload`, { method: "POST", headers, body: fd });
        const upJson = await upRes.json();
        if (!upRes.ok) throw new Error(upJson.error || "Upload failed");
        fileUrl = upJson.url; fileName = upJson.name; fileType = upJson.type;
        setAttachFile(null); setAttachPreview(null); setUploading(false);
      }

      const res  = await fetch(`${API}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ receiverId: activeConvo.userId, content, fileUrl, fileName, fileType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setMessages(prev => [...prev, json.data]);
      setConversations(prev => prev.map(c =>
        c.userId === activeConvo.userId
          ? { ...c, lastMsg: content || (fileType === "image" ? "📷 Image" : "📎 File"), lastTime: new Date().toISOString() }
          : c
      ));
    } catch (e: any) {
      setText(content);
      setUploading(false);
    } finally { setSending(false); }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] min-h-[500px]">
      <div className="flex items-center justify-between pb-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground text-sm">Chat with your mentor and the LeadHouse team</p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchConversations} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-3">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden rounded-2xl border border-border/50 shadow-sm bg-background">
        {/* ── Sidebar ── */}
        <div className="w-[280px] shrink-0 flex flex-col border-r border-border/50 bg-muted/20">
          <div className="p-4 border-b border-border/50">
            <p className="font-semibold text-sm">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /><span className="text-xs">Loading...</span>
              </div>
            ) : (
              <>
                {matchedMentors.filter(m => !conversations.find(c => c.userId === m.userId)).map(m => (
                  <button key={m.userId} onClick={() => startMentorChat(m)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors border-b border-border/30">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="gradient-primary text-primary-foreground text-xs font-bold">
                        {m.avatar || initials(m.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold truncate">{m.username}</p>
                      <p className="text-xs text-muted-foreground">{m.field ? `${m.field} · ` : ""}{auth.getRole() === "mentor" ? "Your Mentee" : "Your Mentor"}</p>
                    </div>
                    <Badge className="gradient-primary text-primary-foreground border-0 text-[9px] shrink-0">New</Badge>
                  </button>
                ))}

                {conversations.length === 0 && matchedMentors.length === 0 && (
                  <div className="text-center py-10 px-4 text-muted-foreground">
                    <p className="text-sm font-medium">No conversations yet</p>
                    <p className="text-xs mt-1 mb-3">
                      {auth.getRole() === "mentor" ? "No mentees matched yet" : "Get matched with a mentor first"}
                    </p>
                    {auth.getRole() !== "mentor" && (
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate("/dashboard/mentors")}>
                        <UserPlus className="h-3 w-3 mr-1" /> Find a Mentor
                      </Button>
                    )}
                  </div>
                )}

                {conversations.map(c => (
                  <button key={c.userId} onClick={() => openChat(c)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors border-b border-border/20 ${
                      activeConvo?.userId === c.userId ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-accent/40"
                    }`}>
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className={`text-xs font-bold ${c.role === "admin" ? "bg-red-100 text-red-700" : "gradient-primary text-primary-foreground"}`}>
                        {c.role === "admin" ? <Shield className="h-4 w-4" /> : initials(c.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex justify-between items-baseline">
                        <p className={`text-sm truncate ${c.unread > 0 ? "font-bold" : "font-medium"}`}>{c.username}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-1">{timeAgo(c.lastTime)}</span>
                      </div>
                      <p className={`text-xs truncate ${c.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {c.lastMsg || "Start a conversation"}
                      </p>
                    </div>
                    {c.unread > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full gradient-primary text-[10px] font-bold text-primary-foreground shrink-0">
                        {c.unread}
                      </span>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ── Chat area ── */}
        {!activeConvo ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/10">
            <div className="text-center space-y-2">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Send className="h-7 w-7 opacity-30" />
              </div>
              <p className="font-medium">Select a conversation</p>
              {matchedMentors.length > 0 && (
                <div className="space-y-2 mt-3">
                  <p className="text-sm">{auth.getRole() === "mentor" ? "or message your mentee" : "or message your mentor"}</p>
                  {matchedMentors.map(m => (
                    <Button key={m.userId} size="sm" className="gradient-primary text-primary-foreground block mx-auto"
                      onClick={() => startMentorChat(m)}>
                      Message {m.username}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-card shrink-0 z-10">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className={`text-sm font-bold ${activeConvo.role === "admin" ? "bg-red-100 text-red-700" : "bg-emerald-500 text-white"}`}>
                  {activeConvo.role === "admin" ? <Shield className="h-4 w-4" /> : initials(activeConvo.username)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{activeConvo.username}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{activeConvo.role}</p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-3 bg-[#f0f2f5] dark:bg-muted/20">
              {msgLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Loading...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="bg-background/80 rounded-xl px-4 py-2 text-xs text-muted-foreground shadow-sm">
                    No messages yet — say hello! 👋
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {messages.map((m, i) => {
                    const showDate = i === 0 || new Date(m.createdAt).toDateString() !== new Date(messages[i - 1].createdAt).toDateString();
                    return (
                      <div key={m.id}>
                        {showDate && (
                          <div className="flex justify-center my-3">
                            <span className="bg-background/80 text-muted-foreground text-[10px] px-3 py-1 rounded-full shadow-sm">
                              {new Date(m.createdAt).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${m.isMe ? "justify-end" : "justify-start"} mb-0.5`}>
                          <div className={`max-w-[65%] px-4 py-2 rounded-2xl shadow-sm ${
                            m.isMe
                              ? "bg-emerald-500 text-white rounded-br-sm"
                              : "bg-white dark:bg-card text-gray-800 dark:text-foreground rounded-bl-sm border border-border/20"
                          }`}>
                            {m.fileUrl && <FileAttachment url={m.fileUrl} name={m.fileName || "file"} type={m.fileType || "file"} isMe={m.isMe} />}
                            {m.content && <p className="text-sm leading-relaxed">{m.content}</p>}
                            <p className={`text-[10px] mt-1 text-right ${m.isMe ? "text-emerald-100" : "text-gray-400"}`}>
                              {fmtTime(m.createdAt)}
                              {m.isMe && <span className="ml-1">{m.isRead ? "✓✓" : "✓"}</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </ScrollArea>

            {/* Attachment preview */}
            {attachFile && (
              <div className="px-4 py-2 border-t border-border/50 bg-muted/20 flex items-center gap-3">
                {attachPreview
                  ? <img src={attachPreview} alt="preview" className="h-12 w-12 rounded-lg object-cover" />
                  : <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center"><FileText className="h-5 w-5 text-muted-foreground" /></div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{attachFile.name}</p>
                  <p className="text-[10px] text-muted-foreground">{(attachFile.size / 1024).toFixed(0)} KB</p>
                </div>
                <button onClick={() => { setAttachFile(null); setAttachPreview(null); }}
                  className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Input bar */}
            <div className="px-3 py-3 border-t border-border/50 bg-card shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => fileInputRef.current?.click()}
                  className="h-10 w-10 rounded-full flex items-center justify-center text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors shrink-0">
                  <Paperclip className="h-5 w-5" />
                </button>
                <input ref={fileInputRef} type="file" className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.mp4,.mp3" onChange={handleFileSelect} />
                <input
                  className="flex-1 bg-gray-100 dark:bg-muted rounded-full px-4 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-400/30"
                  placeholder="Type a message..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                  disabled={sending || uploading}
                />
                <button onClick={handleSend}
                  disabled={(!text.trim() && !attachFile) || sending || uploading}
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
