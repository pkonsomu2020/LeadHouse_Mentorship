import { createBrowserRouter, Navigate } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { Layout } from "./components/layout";
import DashboardLayout from "./components/dashboard-layout";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import UserDashboard from "./pages/dashboard/UserDashboard";
import MentorMatching from "./pages/dashboard/MentorMatching";
import GoalsProgress from "./pages/dashboard/GoalsProgress";
import Messages from "./pages/dashboard/Messages";
import Journal from "./pages/dashboard/Journal";
import UserSettings from "./pages/dashboard/UserSettings";
import Resources from "./pages/dashboard/Resources";
import Sessions from "./pages/dashboard/Sessions";
import Challenges from "./pages/dashboard/Challenges";
import Community from "./pages/dashboard/Community";
import Notifications from "./pages/dashboard/Notifications";
import Reports from "./pages/dashboard/Reports";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: LandingPage },
      // Redirect old multi-page routes back to landing with hash
      { path: "about",        element: <Navigate to="/#about" replace /> },
      { path: "how-it-works", element: <Navigate to="/#how-it-works" replace /> },
      { path: "for-mentees",  element: <Navigate to="/#for-mentees" replace /> },
      { path: "for-mentors",  element: <Navigate to="/#for-mentors" replace /> },
      { path: "pricing",      element: <Navigate to="/#pricing" replace /> },
    ],
  },
  { path: "/login",  Component: LoginPage },
  { path: "/signup", Component: SignupPage },
  {
    path: "/dashboard",
    Component: DashboardLayout,
    children: [
      { index: true, Component: UserDashboard },
      { path: "mentors",       Component: MentorMatching },
      { path: "goals",         Component: GoalsProgress },
      { path: "messages",      Component: Messages },
      { path: "journal",       Component: Journal },
      { path: "resources",     Component: Resources },
      { path: "sessions",      Component: Sessions },
      { path: "challenges",    Component: Challenges },
      { path: "community",     Component: Community },
      { path: "notifications", Component: Notifications },
      { path: "reports",       Component: Reports },
      { path: "settings",      Component: UserSettings },
    ],
  },
]);
