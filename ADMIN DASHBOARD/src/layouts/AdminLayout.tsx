import { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { AdminLoginGate } from "@/components/admin/AdminLoginGate";

export default function AdminLayout() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking,      setChecking]      = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("lh_admin_token");
    setAuthenticated(!!token);
    setChecking(false);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("lh_admin_token");
    setAuthenticated(false);
  }, []);

  if (checking) return null;

  if (!authenticated) {
    return <AdminLoginGate onAuthenticated={() => setAuthenticated(true)} />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden">
        <AdminSidebar onLogout={handleLogout} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <DashboardHeader username="Admin" role="admin" onLogout={handleLogout} />
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
