import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { hasPermission, isAuthenticated } from "./lib/auth";
import DashboardPage from "./pages/DashboardPage";
import IngresoDatosPage from "./pages/IngresoDatosPage";
import LoginPage from "./pages/LoginPage";
import MaestrosPage from "./pages/MaestrosPage";
import NinosPage from "./pages/NinosPage";
import AsistenciaPage from "./pages/AsistenciaPage";
import ReportesPage from "./pages/ReportesPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";
import UsuariosPage from "./pages/UsuariosPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={isAuthenticated() ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/" element={isAuthenticated() ? <DashboardPage /> : <Navigate to="/login" replace />} />
          <Route path="/ingreso-datos" element={isAuthenticated() ? <IngresoDatosPage /> : <Navigate to="/login" replace />} />
          <Route path="/maestros" element={isAuthenticated() ? <MaestrosPage /> : <Navigate to="/login" replace />} />
          <Route path="/ninos" element={isAuthenticated() ? <NinosPage /> : <Navigate to="/login" replace />} />
          <Route path="/asistencia" element={isAuthenticated() ? <AsistenciaPage /> : <Navigate to="/login" replace />} />
          <Route path="/reportes" element={isAuthenticated() ? <ReportesPage /> : <Navigate to="/login" replace />} />
          <Route path="/usuarios" element={isAuthenticated() && hasPermission("users.manage") ? <UsuariosPage /> : <Navigate to="/" replace />} />
          <Route path="/parametrizacion" element={isAuthenticated() ? <ConfiguracionPage /> : <Navigate to="/login" replace />} />
          <Route path="/configuracion" element={isAuthenticated() ? <ConfiguracionPage /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
