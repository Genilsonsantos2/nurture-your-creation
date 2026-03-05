import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import StudentsPage from "./pages/StudentsPage";
import StudentForm from "./pages/StudentForm";
import ImportStudentsPage from "./pages/ImportStudentsPage";
import QRCodesPage from "./pages/QRCodesPage";
import GatePage from "./pages/GatePage";
import MovementsPage from "./pages/MovementsPage";
import AlertsPage from "./pages/AlertsPage";
import SchedulesPage from "./pages/SchedulesPage";
import OccurrencesPage from "./pages/OccurrencesPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import CalendarPage from "./pages/CalendarPage";
import LoginPage from "./pages/LoginPage";
import UserManagement from "./pages/UserManagement";
import ClassesPage from "./pages/ClassesPage";
import ParentPortal from "./pages/ParentPortal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/filho/:token" element={<ParentPortal />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/alunos" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
            <Route path="/alunos/novo" element={<ProtectedRoute><AdminRoute><StudentForm /></AdminRoute></ProtectedRoute>} />
            <Route path="/alunos/editar/:id" element={<ProtectedRoute><AdminRoute><StudentForm /></AdminRoute></ProtectedRoute>} />
            <Route path="/alunos/importar" element={<ProtectedRoute><AdminRoute><ImportStudentsPage /></AdminRoute></ProtectedRoute>} />
            <Route path="/qrcodes" element={<ProtectedRoute><QRCodesPage /></ProtectedRoute>} />
            <Route path="/portaria" element={<ProtectedRoute><GatePage /></ProtectedRoute>} />
            <Route path="/movimentacoes" element={<ProtectedRoute><MovementsPage /></ProtectedRoute>} />
            <Route path="/alertas" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
            <Route path="/horarios" element={<ProtectedRoute><AdminRoute><SchedulesPage /></AdminRoute></ProtectedRoute>} />
            <Route path="/ocorrencias" element={<ProtectedRoute><OccurrencesPage /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute><AdminRoute><UserManagement /></AdminRoute></ProtectedRoute>} />
            <Route path="/turmas" element={<ProtectedRoute><AdminRoute><ClassesPage /></AdminRoute></ProtectedRoute>} />
            <Route path="/calendario" element={<ProtectedRoute><AdminRoute><CalendarPage /></AdminRoute></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><AdminRoute><SettingsPage /></AdminRoute></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
