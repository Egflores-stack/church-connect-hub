import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { clearAuthSession, getAuthUser } from "./lib/auth";
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

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = getAuthUser();

  if (!user) {
    clearAuthSession();
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const user = getAuthUser();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<RequireGuest><LoginPage /></RequireGuest>} />
            <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
            <Route path="/ingreso-datos" element={<RequireAuth><IngresoDatosPage /></RequireAuth>} />
            <Route path="/maestros" element={<RequireAuth><MaestrosPage /></RequireAuth>} />
            <Route path="/ninos" element={<RequireAuth><NinosPage /></RequireAuth>} />
            <Route path="/asistencia" element={<RequireAuth><AsistenciaPage /></RequireAuth>} />
            <Route path="/reportes" element={<RequireAuth><ReportesPage /></RequireAuth>} />
            <Route path="/usuarios" element={<RequireAuth><UsuariosPage /></RequireAuth>} />
            <Route path="/parametrizacion" element={<RequireAuth><ConfiguracionPage /></RequireAuth>} />
            <Route path="/configuracion" element={<RequireAuth><ConfiguracionPage /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
