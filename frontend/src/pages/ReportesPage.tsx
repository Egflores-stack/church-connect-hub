import { useCallback, useEffect, useState } from "react";
import { Download, FileBarChart, TriangleAlert, Users } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAdvancedReport } from "@/lib/api";
import { hasPermission } from "@/lib/auth";
import type { AdvancedReportResponse } from "@/types";

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const csv = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function ReportesPage() {
  const [mes, setMes] = useState(new Date().toISOString().slice(5, 7));
  const [report, setReport] = useState<AdvancedReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentYear = String(new Date().getFullYear());

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setReport(await getAdvancedReport(`${currentYear}-${mes}`));
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo cargar el reporte avanzado.";
      setReport(null);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [currentYear, mes]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  function exportTeacherCsv() {
    if (!report) {
      return;
    }

    downloadCsv(
      `reporte-maestros-${currentYear}-${mes}.csv`,
      ["Nombre", "Aula", "Turno", "Registros", "Dias presente", "Porcentaje"],
      report.teachers.map((row) => [row.nombre, row.grupo || "Sin aula", row.turno, row.total_registros, row.dias_presente, row.porcentaje]),
    );
  }

  function exportChildrenAlertsCsv() {
    if (!report) {
      return;
    }

    downloadCsv(
      `alertas-ninos-${currentYear}-${mes}.csv`,
      ["Nombre", "Aula", "Turno", "Registros", "Presentes", "Ausencias", "Porcentaje"],
      report.childrenAlerts.map((row) => [row.nombre, row.grupo, row.turno, row.total_registros, row.total_presentes, row.total_ausencias, row.porcentaje]),
    );
  }

  if (!hasPermission("reports.view")) {
    return (
      <AppLayout>
        <PageHeader title="Reportes" description="Acceso restringido" />
        <div className="rounded-xl border border-border/50 bg-card p-8 text-sm text-muted-foreground shadow-sm">
          Tu rol actual no tiene permiso para ver reportes.
        </div>
      </AppLayout>
    );
  }

  return (
      <AppLayout>
      <PageHeader title="Reportes Avanzados" description="Consolidado mensual por turno, aula, maestros y alertas de inasistencia" />

      <div className="space-y-6">
        {error && (
          <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">No se pudieron cargar los reportes</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
            <Button variant="outline" onClick={() => void loadReport()} className="self-start">
              Reintentar
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
          <div className="space-y-4 rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">Filtros y exportacion</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Mes</label>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="01">Enero</SelectItem>
                  <SelectItem value="02">Febrero</SelectItem>
                  <SelectItem value="03">Marzo</SelectItem>
                  <SelectItem value="04">Abril</SelectItem>
                  <SelectItem value="05">Mayo</SelectItem>
                  <SelectItem value="06">Junio</SelectItem>
                  <SelectItem value="07">Julio</SelectItem>
                  <SelectItem value="08">Agosto</SelectItem>
                  <SelectItem value="09">Septiembre</SelectItem>
                  <SelectItem value="10">Octubre</SelectItem>
                  <SelectItem value="11">Noviembre</SelectItem>
                  <SelectItem value="12">Diciembre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button className="gap-2" onClick={exportTeacherCsv} disabled={!report || !hasPermission("reports.export")}>
                <Download className="h-4 w-4" /> Exportar maestros CSV
              </Button>
              <Button variant="outline" className="gap-2" onClick={exportChildrenAlertsCsv} disabled={!report || !hasPermission("reports.export")}>
                <Download className="h-4 w-4" /> Exportar alertas CSV
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Registros del mes</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{report?.summary.totalRegistros ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Presentes</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{report?.summary.totalPresentes ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Asistencia general</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{report?.summary.porcentajeGeneral ?? 0}%</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Maestros presentes</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{report?.summary.totalMaestrosPresentes ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FileBarChart className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">Asistencia por turno</h3>
            </div>
            <div className="space-y-3">
              {(report?.byTurn || []).map((row) => (
                <div key={row.turno} className="rounded-lg border border-border/50 px-4 py-3">
                  <p className="text-sm font-medium text-foreground capitalize">{row.turno}</p>
                  <p className="text-xs text-muted-foreground">
                    Presentes {row.total_presentes}/{row.total_registros} - {row.porcentaje}%
                  </p>
                </div>
              ))}
              {!loading && (report?.byTurn.length || 0) === 0 && (
                <p className="text-sm text-muted-foreground">Sin registros por turno en este mes.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">Asistencia por aula</h3>
            </div>
            <div className="space-y-3">
              {(report?.byGroup || []).map((row) => (
                <div key={row.grupo} className="rounded-lg border border-border/50 px-4 py-3">
                  <p className="text-sm font-medium text-foreground">Aula {row.grupo}</p>
                  <p className="text-xs text-muted-foreground">
                    Presentes {row.total_presentes}/{row.total_registros} - {row.porcentaje}%
                  </p>
                </div>
              ))}
              {!loading && (report?.byGroup.length || 0) === 0 && (
                <p className="text-sm text-muted-foreground">Sin registros por aula en este mes.</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">Resumen de maestros</h3>
            </div>
              {report && report.teachers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-3">Nombre</th>
                      <th className="px-3 py-3">Aula</th>
                      <th className="px-3 py-3">Turno</th>
                      <th className="px-3 py-3">Presentes</th>
                      <th className="px-3 py-3">% </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.teachers.map((row) => (
                      <tr key={row.id} className="border-b border-border/30">
                        <td className="px-3 py-3 text-sm">{row.nombre}</td>
                        <td className="px-3 py-3 text-sm">{row.grupo || "Sin aula"}</td>
                        <td className="px-3 py-3 text-sm capitalize">{row.turno}</td>
                        <td className="px-3 py-3 text-sm">{row.dias_presente}/{row.total_registros}</td>
                        <td className="px-3 py-3 text-sm">{row.porcentaje}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : error ? (
              <p className="text-sm text-muted-foreground">Corrige el problema de carga para ver el resumen de maestros.</p>
            ) : (
              <p className="text-sm text-muted-foreground">Sin datos de maestros para este mes.</p>
            )}
          </div>

          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-amber-600" />
              <h3 className="font-semibold text-foreground">Ninos con mas ausencias</h3>
            </div>
            <div className="space-y-3">
              {(report?.childrenAlerts || []).map((row) => (
                <div key={row.id} className="rounded-lg border border-border/50 px-4 py-3">
                  <p className="text-sm font-medium text-foreground">{row.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    Aula {row.grupo} - Turno {row.turno}
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    Ausencias: {row.total_ausencias} de {row.total_registros} registros
                  </p>
                </div>
              ))}
              {!loading && !error && (report?.childrenAlerts.length || 0) === 0 && (
                <p className="text-sm text-muted-foreground">No hay alertas de inasistencia para este mes.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
