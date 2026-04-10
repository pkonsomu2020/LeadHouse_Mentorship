import {
  LayoutDashboard, Users, Target, MessageSquare, BookOpen, LogOut, Flame,
  Library, Calendar, Trophy, UsersRound, Flag,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Find Mentors", url: "/dashboard/mentors", icon: Users },
  { title: "Sessions", url: "/dashboard/sessions", icon: Calendar },
  { title: "Goals & Progress", url: "/dashboard/goals", icon: Target },
  { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
  { title: "Journal", url: "/dashboard/journal", icon: BookOpen },
  { title: "Resources", url: "/dashboard/resources", icon: Library },
  { title: "Challenges", url: "/dashboard/challenges", icon: Trophy },
  { title: "Community", url: "/dashboard/community", icon: UsersRound },
  { title: "Reports",   url: "/dashboard/reports",   icon: Flag },
];

const bottomItems = [
  { title: "Logout", url: "/", icon: LogOut },
];

export function UserSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-primary">
            <Flame className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">LeadHouse</h2>
              <p className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/60">Mentorship</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-4 w-4" />
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
          {bottomItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  className="text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive"
                  activeClassName=""
                >
                  <item.icon className="h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
