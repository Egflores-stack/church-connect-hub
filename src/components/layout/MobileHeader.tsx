import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Church, LayoutDashboard, Users, Baby, ClipboardCheck, FileBarChart, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/maestros', label: 'Maestros', icon: Users },
  { path: '/ninos', label: 'Niños', icon: Baby },
  { path: '/asistencia', label: 'Asistencia', icon: ClipboardCheck },
  { path: '/reportes', label: 'Reportes', icon: FileBarChart },
  { path: '/configuracion', label: 'Configuración', icon: Settings },
];

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="lg:hidden sticky top-0 z-50 bg-primary border-b border-sidebar-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Church className="w-5 h-5 text-primary-foreground" />
          <span className="font-bold text-sm text-primary-foreground">Gestión Ministerial</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-primary-foreground">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <nav className="px-3 pb-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'text-primary-foreground/70 hover:text-primary-foreground'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
