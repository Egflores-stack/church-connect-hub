import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Baby,
  Church,
  ClipboardCheck,
  FileBarChart,
  FolderPlus,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/lib/auth";

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

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-sidebar-border bg-primary lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Church className="h-5 w-5 text-primary-foreground" />
          <span className="text-sm font-bold text-primary-foreground">Gestion Ministerial</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-primary-foreground">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav className="space-y-1 px-3 pb-3">
          {navItems.filter((item) => !item.permission || hasPermission(item.permission)).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "text-primary-foreground/70 hover:text-primary-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
