import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { motion } from "framer-motion";

import LoginPage from "@/pages/LoginPage";
import SetupPage from "@/pages/SetupPage";
import DashboardPage from "@/pages/DashboardPage";
import ContactsPage from "@/pages/ContactsPage";
import LocationsPage from "@/pages/LocationsPage";
import AlertsPage from "@/pages/AlertsPage";
import ProfilePage from "@/pages/ProfilePage";
import TrackingPage from "@/pages/TrackingPage";
import FamilyDashboardPage from "@/pages/FamilyDashboardPage";
import StealthPage from "@/pages/StealthPage";

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function IndexRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  if (!user.profileCompleted) return <Redirect to="/setup" />;
  return <Redirect to="/dashboard" />;
}

function ProtectedDashboard() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  if (!user.profileCompleted) return <Redirect to="/setup" />;
  return <AnimatedPage><DashboardPage /></AnimatedPage>;
}

function ProtectedContacts() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  if (!user.profileCompleted) return <Redirect to="/setup" />;
  return <AnimatedPage><ContactsPage /></AnimatedPage>;
}

function ProtectedLocations() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  if (!user.profileCompleted) return <Redirect to="/setup" />;
  return <AnimatedPage><LocationsPage /></AnimatedPage>;
}

function ProtectedAlerts() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  if (!user.profileCompleted) return <Redirect to="/setup" />;
  return <AnimatedPage><AlertsPage /></AnimatedPage>;
}

function ProtectedProfile() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  if (!user.profileCompleted) return <Redirect to="/setup" />;
  return <AnimatedPage><ProfilePage /></AnimatedPage>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/setup" component={SetupPage} />
      <Route path="/track/:sessionId" component={TrackingPage} />
      <Route path="/family-dashboard" component={FamilyDashboardPage} />
      <Route path="/stealth" component={StealthPage} />
      <Route path="/dashboard" component={ProtectedDashboard} />
      <Route path="/contacts" component={ProtectedContacts} />
      <Route path="/locations" component={ProtectedLocations} />
      <Route path="/alerts" component={ProtectedAlerts} />
      <Route path="/profile" component={ProtectedProfile} />
      <Route path="/" component={IndexRedirect} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
