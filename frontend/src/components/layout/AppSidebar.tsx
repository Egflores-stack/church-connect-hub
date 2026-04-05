import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Baby,
  Church,
  ClipboardCheck,
  FileBarChart,
  FolderPlus,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clearAuthSession, getAuthUser, hasPermission } from "@/lib/auth";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/ingreso-datos", label: "Ingreso de Datos", icon: FolderPlus },
  { path: "/usuarios", label: "Usuarios", icon: ShieldCheck, permission: "users.manage" },
  { path: "/maestros", label: "Maestros", icon: Users },
  { path: "/ninos", label: "Ninos", icon: Baby },
  { path: "/asistencia", label: "Asistencia", icon: ClipboardCheck },
  { path: "/reportes", label: "Reportes", icon: FileBarChart },
  { path: "/parametrizacion", label: "Parametrizacion", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const authUser = getAuthUser();

  function handleLogout() {
    clearAuthSession();
    window.location.href = "/login";
  }

  return (
    <aside className="hidden min-h-screen w-64 flex-col border-r border-sidebar-border sidebar-gradient lg:flex">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
          <Church className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wide text-sidebar-foreground">Gestion</h1>
          <p className="text-xs text-sidebar-muted">Ministerial</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.filter((item) => !item.permission || hasPermission(item.permission)).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className={cn("h-4.5 w-4.5", isActive && "text-sidebar-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent">
            <span className="text-xs font-semibold text-sidebar-accent-foreground">AD</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{authUser?.nombre || "Admin"}</p>
            <p className="text-xs text-sidebar-muted">{authUser?.role || "Administrador"}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sidebar-muted transition-colors hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

