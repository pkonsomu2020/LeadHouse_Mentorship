import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import AdminLayout from "./layouts/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import UserManagement from "./pages/admin/UserManagement";
import MentorMatchingAdmin from "./pages/admin/MentorMatchingAdmin";
import SessionsManagement from "./pages/admin/SessionsManagement";
import GoalsOversight from "./pages/admin/GoalsOversight";
import ContentResources from "./pages/admin/ContentResources";
import JournalModeration from "./pages/admin/JournalModeration";
import ChallengesManagement from "./pages/admin/ChallengesManagement";
import CommunityManagement from "./pages/admin/CommunityManagement";
import ReportsModeration from "./pages/admin/ReportsModeration";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminMessages from "./pages/admin/AdminMessages";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="matching" element={<MentorMatchingAdmin />} />
              <Route path="sessions" element={<SessionsManagement />} />
              <Route path="goals" element={<GoalsOversight />} />
              <Route path="content" element={<ContentResources />} />
              <Route path="journal" element={<JournalModeration />} />
              <Route path="challenges" element={<ChallengesManagement />} />
              <Route path="community" element={<CommunityManagement />} />
              <Route path="reports"    element={<ReportsModeration />} />
              <Route path="settings"   element={<AdminSettings />} />
              <Route path="messages"   element={<AdminMessages />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
