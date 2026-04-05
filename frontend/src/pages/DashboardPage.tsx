import { useEffect, useState } from "react";
import { Baby, Users, ClipboardCheck, Cake, TrendingUp, Calendar, BellRing } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { getAppNotifications, getDashboard, getNinos } from "@/lib/api";
import type { AppNotification, DashboardSummary, Nino } from "@/types";

function getMonthFromIsoDate(value?: string) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const parts = value.split("-");
  if (parts.length < 2) {
    return null;
  }

  const month = Number(parts[1]);
  return Number.isNaN(month) ? null : month;
}

function formatBirthdayDate(value?: string) {
  if (!value || typeof value !== "string") {
    return "Fecha no disponible";
  }

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return date.toLocaleDateString("es-NI");
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [dashboardData, ninosData, notificationsData] = await Promise.all([
          getDashboard(),
          getNinos({ estado: "activo" }),
          getAppNotifications(4),
        ]);
        if (!mounted) {
          return;
        }

        setDashboard(dashboardData);
        setNinos(ninosData);
        setNotifications(notificationsData);
        setError("");
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "No se pudo cargar el dashboard.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    setLoading(true);
    loadData();
    const intervalId = window.setInterval(loadData, 10000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const currentMonth = new Date().getMonth() + 1;
  const cumplesMes = ninos.filter((nino) => {
    const month = getMonthFromIsoDate(nino.fechaNacimiento);
    return month === currentMonth;
  });

  const birthdayHighlights = notifications.filter((notification) => notification.type === "birthday");

  return (
    <AppLayout>
      <PageHeader title="Dashboard" description="Resumen general del ministerio" />

      {error && <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

      {birthdayHighlights.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-5 shadow-sm animate-fade-in">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <BellRing className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Recordatorios de cumpleanos</p>
                  <p className="text-xs text-amber-700">La app los recalcula automaticamente todos los dias.</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {birthdayHighlights.length === 1
                  ? "Tienes 1 cumpleanos proximo para revisar."
                  : `Tienes ${birthdayHighlights.length} cumpleanos proximos para revisar.`}
              </p>
            </div>
            <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
              {birthdayHighlights.map((notification) => (
                <div key={notification.id} className="rounded-xl border border-amber-200/70 bg-white/80 px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    Fecha: {formatBirthdayDate(notification.birthdayDate)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Ninos Activos" value={dashboard?.totalNinosActivos ?? 0} subtitle={loading ? "Cargando..." : "Inscritos este periodo"} icon={Baby} variant="primary" />
        <StatCard
          title="Maestros Hoy"
          value={`${dashboard?.maestrosPresentesHoy ?? 0}/${dashboard?.totalMaestrosActivos ?? 0}`}
          subtitle={loading ? "Cargando..." : "Presentes en el turno"}
          icon={Users}
          variant="success"
        />
        <StatCard
          title="Asistencia Hoy"
          value={`${dashboard?.presentesHoy ?? 0}/${dashboard?.asistenciasRegistradasHoy ?? 0}`}
          subtitle={loading ? "Cargando..." : "Registros del dia"}
          icon={ClipboardCheck}
          variant="warning"
        />
        <StatCard title="Cumpleanos del Mes" value={cumplesMes.length} subtitle={`En ${new Date().toLocaleDateString("es", { month: "long" })}`} icon={Cake} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border/50 bg-card p-6 shadow-sm animate-fade-in">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Asistencia Reciente</h3>
          </div>
          <div className="space-y-3">
            {(dashboard?.recientes ?? []).map((registro) => (
              <div key={registro.id} className="flex items-center justify-between border-b border-border/50 py-3 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{registro.fecha}</p>
                    <p className="text-xs text-muted-foreground">
                      {registro.ninoNombre} - Turno {registro.turno}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{registro.presente ? "Presente" : "Ausente"}</p>
                  <p className="text-xs text-muted-foreground">{registro.maestroNombre || "Sin maestro asignado"}</p>
                </div>
              </div>
            ))}
            {!loading && (dashboard?.recientes?.length ?? 0) === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">Aun no hay registros recientes.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm animate-fade-in">
          <div className="mb-4 flex items-center gap-2">
            <Cake className="h-4 w-4 text-secondary" />
            <h3 className="font-semibold text-foreground">Cumpleanos del Mes</h3>
          </div>
          {cumplesMes.length > 0 ? (
            <div className="space-y-3">
              {cumplesMes.map((nino) => (
                <div key={nino.id} className="flex items-center gap-3 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10">
                    <span className="text-xs font-bold text-secondary">{nino.nombre.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{nino.nombre}</p>
                    <p className="text-xs text-muted-foreground">{nino.fechaNacimiento}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">No hay cumpleanos este mes.</p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border/50 bg-card p-6 shadow-sm animate-fade-in">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground">Conteo General por Aula</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {(dashboard?.asistenciaPorGrupo ?? []).map((item) => (
            <div key={item.grupo} className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Grupo {item.grupo}</p>
              <p className="text-xs text-muted-foreground">
                Presentes hoy: <strong className="text-foreground">{item.presentes}/{item.total}</strong>
              </p>
            </div>
          ))}
          {!loading && (dashboard?.asistenciaPorGrupo?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">Todavia no hay asistencia registrada hoy por aula.</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

