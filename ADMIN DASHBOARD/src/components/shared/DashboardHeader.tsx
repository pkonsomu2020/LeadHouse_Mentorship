import { Bell, Search, Settings, LogOut, Menu, LayoutDashboard, Users, Target, BookOpen, FileText, Calendar, Trophy, UsersRound, Link2, AlertTriangle, X, User, Briefcase, Flag, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("lh_admin_token") || "";

interface SearchResult { type: string; id: string; label: string; sub: string; url: string; badge?: string; }

const TYPE_ICONS: Record<string, React.ElementType> = {
  user: User, mentor: Briefcase, challenge: Trophy,
  session: Calendar, report: Flag, post: UsersRound, resource: FileText,
};
const TYPE_COLORS: Record<string, string> = {
  user: "bg-blue-100 text-blue-700", mentor: "bg-purple-100 text-purple-700",
  challenge: "bg-yellow-100 text-yellow-700", session: "bg-green-100 text-green-700",
  report: "bg-red-100 text-red-700", post: "bg-pink-100 text-pink-700",
  resource: "bg-orange-100 text-orange-700",
};

interface DashboardHeaderProps {
  username?: string;
  role?: "user" | "admin";
  onLogout?: () => void;
}

export function DashboardHeader({ username = "Admin", role = "admin", onLogout }: DashboardHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<SearchResult[]>([]);
  const [open,     setOpen]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/admin/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const json = await res.json();
      setResults(json.results || []);
      setOpen(true);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 350);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  function handleSelect(url: string) {
    navigate(url);
    setQuery(""); setResults([]); setOpen(false);
  }

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      navigate("/");
    }
    setMobileMenuOpen(false);
  };

  const mainMenuItems = [
    { title: "Overview",             url: "/",            icon: LayoutDashboard },
    { title: "User Management",      url: "/users",       icon: Users },
    { title: "Mentor Matching",      url: "/matching",    icon: Link2 },
    { title: "Sessions",             url: "/sessions",    icon: Calendar },
    { title: "Goals & Progress",     url: "/goals",       icon: Target },
    { title: "Content & Resources",  url: "/content",     icon: FileText },
    { title: "Journal Moderation",   url: "/journal",     icon: BookOpen },
    { title: "Challenges",           url: "/challenges",  icon: Trophy },
    { title: "Community",            url: "/community",   icon: UsersRound },
    { title: "Reports & Moderation", url: "/reports",     icon: AlertTriangle },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/50 bg-background/80 backdrop-blur-xl px-3 md:px-6 min-w-0 overflow-hidden">
      {/* Desktop Sidebar Trigger */}
      <SidebarTrigger className="hidden md:flex text-muted-foreground hover:text-foreground shrink-0" />
      
      {/* Mobile Hamburger Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="p-6 pb-4 border-b">
              <SheetTitle className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary/30">
                  <AvatarFallback className="gradient-primary text-primary-foreground text-lg font-semibold">
                    {username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-base font-semibold">{username}</p>
                  <p className="text-xs text-muted-foreground">Administrator</p>
                </div>
              </SheetTitle>
            </SheetHeader>
            
            {/* Main Menu Items */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
                  Admin Menu
                </p>
                {mainMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.url || 
                    (item.url === "/" && location.pathname === "/");
                  
                  return (
                    <button
                      key={item.title}
                      onClick={() => handleNavigation(item.url)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                        isActive
                          ? "bg-[#E8F5E9] text-[#006B3C] font-semibold"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="text-sm">{item.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer - Settings, Logout */}
            <div className="border-t p-4 space-y-1">
              <button
                onClick={() => handleNavigation("/settings")}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  location.pathname === "/settings"
                    ? "bg-[#E8F5E9] text-[#006B3C] font-semibold"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <Settings className="h-5 w-5 shrink-0" />
                <span className="text-sm">Settings</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Search Bar */}
      <div ref={searchRef} className="hidden md:flex flex-1 max-w-md relative min-w-0">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search users, mentors, challenges..."
            className="w-full pl-10 pr-8 py-2 text-sm bg-muted/50 border border-border/50 rounded-lg outline-none focus:bg-background focus:border-primary/50 transition-colors"
          />
          {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
          {query && !loading && (
            <button onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown results */}
        {open && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-background border border-border rounded-xl shadow-xl z-50 max-h-[420px] overflow-y-auto">
            {Object.entries(grouped).map(([type, items]) => {
              const Icon = TYPE_ICONS[type] || Search;
              const colorCls = TYPE_COLORS[type] || "bg-muted text-muted-foreground";
              return (
                <div key={type}>
                  <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider capitalize">{type}s</p>
                  {items.map(r => (
                    <button key={r.id} onClick={() => handleSelect(r.url)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors text-left">
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${colorCls}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.sub}</p>
                      </div>
                      {r.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize shrink-0">{r.badge}</span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })}
            <div className="px-3 py-2 border-t border-border/50">
              <p className="text-[10px] text-muted-foreground">{results.length} result{results.length !== 1 ? "s" : ""} for "{query}"</p>
            </div>
          </div>
        )}

        {open && query.length >= 2 && results.length === 0 && !loading && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-background border border-border rounded-xl shadow-xl z-50 px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">No results for "{query}"</p>
          </div>
        )}
      </div>

      {/* Spacer - desktop only */}
      <div className="hidden md:flex flex-1" />

      {/* Right Side Icons - Always visible */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* Notifications Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative rounded-full"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full gradient-primary border-2 border-background" />
        </Button>

        {/* User Dropdown Menu - Desktop */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative h-9 w-9 rounded-full p-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              <Avatar className="h-9 w-9 border-2 border-primary/30 cursor-pointer hover:border-primary/50 transition-colors">
                <AvatarFallback className="gradient-primary text-primary-foreground text-sm font-semibold">
                  {username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{username}</p>
                <p className="text-xs leading-none text-muted-foreground">Administrator</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleNavigation("/settings")}
              className={location.pathname === "/settings" ? "bg-accent" : ""}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
