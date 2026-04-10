import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserSidebar } from "@/components/dashboard/UserSidebar";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { auth } from "@/lib/auth";

export default function DashboardLayout() {
  const navigate  = useNavigate();
  const [username, setUsername] = useState("Anonymous");
  const [ready,    setReady]    = useState(false);

  useEffect(() => {
    if (!auth.isLoggedIn()) {
      navigate("/login", { replace: true });
      return;
    }
    setUsername(auth.getUsername());
    setReady(true);
  }, [navigate]);

  if (!ready) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <UserSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader username={username} role="user" />
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
