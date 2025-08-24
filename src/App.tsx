import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { useNotificationHandler } from "@/hooks/useNotificationHandler";
import Header from "@/components/Header";
import NavigationMenu from "@/components/NavigationMenu";
import IndexLanding from "./pages/IndexLanding";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import Tickets from "./pages/Tickets";
import Clients from "./pages/Clients";
import Categories from "./pages/Categories";
import Reports from "./pages/Reports";
import Plans from "./pages/Plans";
import Settings from "./pages/Settings";
import CustomFields from "./pages/CustomFields";
import TechnicalNotes from "./pages/TechnicalNotes";
import PlanSelection from "./pages/PlanSelection";
import SuperAdmin from "./pages/SuperAdmin";
import CreateSuperAdmin from "./pages/CreateSuperAdmin";

import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";

const queryClient = new QueryClient();

const AppContent = () => {
  useCompanyTheme();
  useNotificationHandler();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <NavigationMenu />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<IndexLanding />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/plan-selection" element={<PlanSelection />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-canceled" element={<PaymentCanceled />} />
            <Route path="/create-super-admin" element={<CreateSuperAdmin />} />
            <Route path="/dashboard" element={<Dashboard />} />
           <Route path="/users" element={<UserManagement />} />
           <Route path="/tickets" element={<Tickets />} />
           <Route path="/clients" element={<Clients />} />
           <Route path="/categories" element={<Categories />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/custom-fields" element={<CustomFields />} />
          <Route path="/technical-notes" element={<TechnicalNotes />} />
          <Route path="/super-admin" element={<SuperAdmin />} />
          
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
