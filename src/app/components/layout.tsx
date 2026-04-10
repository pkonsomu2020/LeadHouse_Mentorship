import { Outlet } from "react-router";
import { Navigation } from "./navigation";
import { Footer } from "./footer";

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Navigation />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
