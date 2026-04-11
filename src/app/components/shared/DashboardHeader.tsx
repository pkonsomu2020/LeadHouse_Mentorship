import { Bell, Search, Settings, LogOut, Menu, LayoutDashboard, Users, Target, MessageSquare, BookOpen, Library, Calendar, Trophy, UsersRound, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useNavigate, useLocation } from "react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { auth } from "@/lib/auth";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

const TYPE_ICONS: Record<string, string> = {
  mentor:    "👤",
  goal:      "🎯",
  resource:  "📚",
  session:   "📅",
  challenge: "🏆",
  post:      "💬",
};

interface SearchResult {
  type: string; id: string; label: string; sub: string; url: string; avatar?: string;
}

interface DashboardHeaderProps {
  username?: string;
  role?: "user" | "admin";
}

export function DashboardHeader({ username = "Anonymous", role = "user" }: DashboardHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [searchResults,  setSearchResults]  = useState<SearchResult[]>([]);
  const [searchLoading,  setSearchLoading]  = useState(false);
  const [searchOpen,     setSearchOpen]     = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSearchResults([]); setSearchOpen(false); return; }
    setSearchLoading(true);
    try {
      const res  = await fetch(`${API}/api/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${auth.getToken()}` },
      });
      const json = await res.json();
      setSearchResults(json.results || []);
      setSearchOpen(true);
    } catch {}
    finally { setSearchLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery, doSearch]);

  function handleResultClick(url: string) {
    navigate(url);
    setSearchQuery("");
    setSearchResults([]);
    setSearchOpen(false);
  }

  const mainMenuItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Find Mentors", url: "/dashboard/mentors", icon: Users },
    { title: "Sessions", url: "/dashboard/sessions", icon: Calendar },
    { title: "Goals & Progress", url: "/dashboard/goals", icon: Target },
    { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
    { title: "Journal", url: "/dashboard/journal", icon: BookOpen },
    { title: "Resources", url: "/dashboard/resources", icon: Library },
    { title: "Challenges", url: "/dashboard/challenges", icon: Trophy },
    { title: "Community", url: "/dashboard/community", icon: UsersRound },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    auth.logout();
    navigate("/login");
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/50 bg-background/80 backdrop-blur-xl px-3 md:px-6 min-w-0 overflow-hidden">
      {/* Desktop Sidebar Trigger */}
      <SidebarTrigger className="hidden md:flex text-muted-foreground hover:text-foreground shrink-0" />
      
      {/* Mobile Hamburger Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <button
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
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
                  <p className="text-xs text-muted-foreground">
                    {role === "admin" ? "Administrator" : "Mentee"}
                  </p>
                </div>
              </SheetTitle>
            </SheetHeader>
            
            {/* Main Menu Items */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
                  Main Menu
                </p>
                {mainMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.url || 
                    (item.url === "/dashboard" && location.pathname === "/dashboard");
                  
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
          </div>
        </SheetContent>
      </Sheet>

      {/* Search Bar - Hidden on Mobile */}
      <div className="hidden md:flex flex-1 max-w-md min-w-0" ref={searchRef}>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            placeholder="Search mentors, goals, resources..."
            className="pl-10 pr-8 bg-muted/50 border-border/50 focus:bg-background"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
          />
          {searchLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
          {searchQuery && !searchLoading && (
            <button onClick={() => { setSearchQuery(""); setSearchResults([]); setSearchOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Results dropdown */}
          {searchOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border/50 rounded-xl shadow-xl z-50 overflow-hidden max-h-[400px] overflow-y-auto">
              {/* Group by type */}
              {(["mentor","goal","resource","session","challenge","post"] as const).map(type => {
                const group = searchResults.filter(r => r.type === type);
                if (group.length === 0) return null;
                const labels: Record<string, string> = { mentor:"Mentors", goal:"Goals", resource:"Resources", session:"Sessions", challenge:"Challenges", post:"Community" };
                return (
                  <div key={type}>
                    <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30">
                      {TYPE_ICONS[type]} {labels[type]}
                    </p>
                    {group.map(r => (
                      <button key={r.id} onClick={() => handleResultClick(r.url)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left">
                        {r.avatar ? (
                          <div className="h-7 w-7 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold shrink-0">
                            {r.avatar}
                          </div>
                        ) : (
                          <span className="text-base shrink-0">{TYPE_ICONS[r.type]}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{r.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{r.sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
              <div className="px-3 py-2 border-t border-border/30 bg-muted/20">
                <p className="text-[10px] text-muted-foreground">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"</p>
              </div>
            </div>
          )}

          {/* No results */}
          {searchOpen && searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border/50 rounded-xl shadow-xl z-50 px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">No results for "{searchQuery}"</p>
            </div>
          )}
        </div>
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
          onClick={() => handleNavigation("/dashboard/notifications")}
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
                <p className="text-xs leading-none text-muted-foreground">
                  {role === "admin" ? "Administrator" : "Mentee"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleNavigation("/dashboard/notifications")}
              className={location.pathname === "/dashboard/notifications" ? "bg-accent" : ""}
            >
              <Bell className="mr-2 h-4 w-4" />
              <span>Notifications</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleNavigation("/dashboard/settings")}
              className={location.pathname === "/dashboard/settings" ? "bg-accent" : ""}
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
