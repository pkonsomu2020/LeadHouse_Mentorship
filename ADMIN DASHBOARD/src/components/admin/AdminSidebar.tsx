import {
  LayoutDashboard, Users, Link2, Calendar, Target, FileText,
  BookOpen, Trophy, UsersRound, AlertTriangle, LogOut, Shield, MessageSquare,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
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
  { title: "Messages",             url: "/messages",    icon: MessageSquare },
];

export function AdminSidebar({ onLogout }: { onLogout: () => void }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/90">
            <Shield className="h-5 w-5 text-destructive-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">LeadHouse</h2>
              <p className="text-[10px] uppercase tracking-[0.2em] text-destructive/80">Admin Panel</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors rounded-lg"
                      activeClassName="bg-destructive/15 text-destructive font-semibold border-l-2 border-destructive"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onLogout}
              className="text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive cursor-pointer w-full"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
