import { Baby, Users, ClipboardCheck, Cake, TrendingUp, Calendar } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/shared/StatCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { mockNinos, mockMaestros } from '@/data/mock';

const ninosActivos = mockNinos.filter(n => n.estado === 'activo').length;
const maestrosActivos = mockMaestros.filter(m => m.estado === 'activo').length;

// Simulated birthday check for current month
const currentMonth = new Date().getMonth() + 1;
const cumplesMes = mockNinos.filter(n => {
  const month = parseInt(n.fechaNacimiento.split('-')[1]);
  return month === currentMonth;
});

const recentAttendance = [
  { fecha: '2026-03-02', turno: 'Mañana', presentes: 5, total: 6 },
  { fecha: '2026-03-02', turno: 'Tarde', presentes: 3, total: 4 },
  { fecha: '2026-03-01', turno: 'Mañana', presentes: 6, total: 6 },
];

export default function DashboardPage() {
  return (
    <AppLayout>
      <PageHeader title="Dashboard" description="Resumen general del ministerio" />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Niños Activos" value={ninosActivos} subtitle="Inscritos este período" icon={Baby} variant="primary" />
        <StatCard title="Maestros Activos" value={maestrosActivos} subtitle="Sirviendo actualmente" icon={Users} variant="success" />
        <StatCard title="Asistencia Hoy" value="8/10" subtitle="80% de asistencia" icon={ClipboardCheck} variant="warning" />
        <StatCard title="Cumpleaños del Mes" value={cumplesMes.length} subtitle={`En ${new Date().toLocaleDateString('es', { month: 'long' })}`} icon={Cake} />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent attendance */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border/50 shadow-sm p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Asistencia Reciente</h3>
          </div>
          <div className="space-y-3">
            {recentAttendance.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.fecha}</p>
                    <p className="text-xs text-muted-foreground">Turno: {r.turno}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{r.presentes}/{r.total}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((r.presentes / r.total) * 100)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Birthdays */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Cake className="w-4 h-4 text-secondary" />
            <h3 className="font-semibold text-foreground">Cumpleaños del Mes</h3>
          </div>
          {cumplesMes.length > 0 ? (
            <div className="space-y-3">
              {cumplesMes.map((n) => (
                <div key={n.id} className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-secondary">{n.nombre.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{n.nombre}</p>
                    <p className="text-xs text-muted-foreground">{n.fechaNacimiento}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No hay cumpleaños este mes</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
