import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/alunos" element={<AppLayout><StudentsPage /></AppLayout>} />
          <Route path="/alunos/novo" element={<AppLayout><StudentForm /></AppLayout>} />
          <Route path="/alunos/importar" element={<AppLayout><ImportStudentsPage /></AppLayout>} />
          <Route path="/qrcodes" element={<AppLayout><QRCodesPage /></AppLayout>} />
          <Route path="/portaria" element={<AppLayout><GatePage /></AppLayout>} />
          <Route path="/movimentacoes" element={<AppLayout><MovementsPage /></AppLayout>} />
          <Route path="/alertas" element={<AppLayout><AlertsPage /></AppLayout>} />
          <Route path="/horarios" element={<AppLayout><SchedulesPage /></AppLayout>} />
          <Route path="/ocorrencias" element={<AppLayout><OccurrencesPage /></AppLayout>} />
          <Route path="/relatorios" element={<AppLayout><ReportsPage /></AppLayout>} />
          <Route path="/configuracoes" element={<AppLayout><SettingsPage /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
