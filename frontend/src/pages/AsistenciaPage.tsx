import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getAsistencias,
  getAsistenciasMaestros,
  getMaestros,
  getNinos,
  saveAsistencia,
  saveAsistenciaMaestro,
} from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import type { Maestro, Nino, Turno } from "@/types";

const DEFAULT_GROUP = "4-6";

export default function AsistenciaPage() {
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [turno, setTurno] = useState<Turno>("manana");
  const [grupo, setGrupo] = useState(DEFAULT_GROUP);
  const [maestroId, setMaestroId] = useState<string>("");
  const [attendance, setAttendance] = useState<Record<number, boolean>>({});
  const [teacherAttendance, setTeacherAttendance] = useState<Record<number, boolean>>({});
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [maestros, setMaestros] = useState<Maestro[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savingTeacherId, setSavingTeacherId] = useState<number | null>(null);

  useEffect(() => {
    async function loadCatalogs() {
      try {
        setLoading(true);
        const [ninosData, maestrosData] = await Promise.all([getNinos(), getMaestros()]);
        setNinos(ninosData);
        setMaestros(maestrosData);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo cargar la asistencia.");
      } finally {
        setLoading(false);
      }
    }

    loadCatalogs();
  }, []);

  const gruposDisponibles = useMemo(
    () => [...new Set(ninos.filter((nino) => nino.turno === turno).map((nino) => nino.grupo))].sort(),
    [ninos, turno],
  );

  useEffect(() => {
    if (!gruposDisponibles.includes(grupo) && gruposDisponibles.length > 0) {
      setGrupo(gruposDisponibles[0]);
    }
  }, [grupo, gruposDisponibles]);

  const ninosDelAula = useMemo(
    () => ninos.filter((nino) => nino.turno === turno && nino.grupo === grupo && nino.estado === "activo"),
    [ninos, turno, grupo],
  );

  const maestrosActivosTurno = useMemo(
    () => maestros.filter((maestro) => maestro.turno === turno && maestro.estado === "activo"),
    [maestros, turno],
  );

  const maestrosDelAula = useMemo(() => {
    const maestrosDelGrupo = maestrosActivosTurno.filter((maestro) => (maestro.grupo || "") === grupo);
    return maestrosDelGrupo.length > 0 ? maestrosDelGrupo : maestrosActivosTurno;
  }, [maestrosActivosTurno, grupo]);

  useEffect(() => {
    if (maestrosDelAula.length === 1) {
      setMaestroId(String(maestrosDelAula[0].id));
      return;
    }

    if (!maestrosDelAula.some((maestro) => String(maestro.id) === maestroId)) {
      setMaestroId("");
    }
  }, [grupo, maestroId, maestrosDelAula]);

  useEffect(() => {
    async function loadAttendance() {
      try {
        const [childRecords, teacherRecords] = await Promise.all([
          getAsistencias(fecha, turno, grupo),
          getAsistenciasMaestros(fecha, turno),
        ]);

        const nextAttendance: Record<number, boolean> = {};
        const nextTeacherAttendance: Record<number, boolean> = {};

        for (const record of childRecords) {
          nextAttendance[record.ninoId] = record.presente;
          if (record.maestroId) {
            setMaestroId(String(record.maestroId));
          }
        }

        for (const record of teacherRecords) {
          nextTeacherAttendance[record.maestroId] = record.presente;
        }

        setAttendance(nextAttendance);
        setTeacherAttendance(nextTeacherAttendance);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo consultar la asistencia.");
      }
    }

    if (grupo) {
      loadAttendance();
    }
  }, [fecha, turno, grupo]);

  async function marcarAsistenciaNino(ninoId: number, presente: boolean) {
    const authUser = getAuthUser();
    const maestroSeleccionado = maestroId ? Number(maestroId) : null;

    if (!maestroSeleccionado) {
      toast.error("Selecciona primero el maestro del aula.");
      return;
    }

    setAttendance((current) => ({ ...current, [ninoId]: presente }));
    setSavingId(ninoId);

    try {
      await saveAsistencia({
        fecha,
        turno,
        ninoId,
        maestroId: maestroSeleccionado,
        presente,
        maestroPresente: true,
        registradoPor: authUser?.email ?? "admin@iglesia.com",
      });
    } catch (err) {
      setAttendance((current) => ({ ...current, [ninoId]: !presente }));
      toast.error(err instanceof Error ? err.message : "No se pudo registrar la asistencia del nino.");
    } finally {
      setSavingId(null);
    }
  }

  async function marcarAsistenciaMaestro(maestroIdValue: number, presente: boolean) {
    const authUser = getAuthUser();
    setTeacherAttendance((current) => ({ ...current, [maestroIdValue]: presente }));
    setSavingTeacherId(maestroIdValue);

    try {
      await saveAsistenciaMaestro({
        fecha,
        turno,
        maestroId: maestroIdValue,
        presente,
        registradoPor: authUser?.email ?? "admin@iglesia.com",
      });
    } catch (err) {
      setTeacherAttendance((current) => ({ ...current, [maestroIdValue]: !presente }));
      toast.error(err instanceof Error ? err.message : "No se pudo registrar la asistencia del maestro.");
    } finally {
      setSavingTeacherId(null);
    }
  }

  const presentesNinos = Object.entries(attendance).filter(([, presente]) => presente).length;
  const presentesMaestros = Object.entries(teacherAttendance).filter(([, presente]) => presente).length;

  return (
    <AppLayout>
      <PageHeader
        title="Asistencia por Aula y Turno"
        description="El maestro marca ninos por nombre en su aula y staff marca los maestros presentes del turno"
        actions={
          <Button disabled className="gap-2">
            <Users className="h-4 w-4" /> Actualizacion inmediata
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-sm lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Fecha</Label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Turno</Label>
          <Select value={turno} onValueChange={(value) => setTurno(value as Turno)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="manana">Manana</SelectItem>
              <SelectItem value="tarde">Tarde</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Aula</Label>
          <Select value={grupo} onValueChange={setGrupo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {gruposDisponibles.map((item) => (
                <SelectItem key={item} value={item}>{item} anos</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Maestro del Aula</Label>
          <Select value={maestroId} onValueChange={setMaestroId}>
            <SelectTrigger><SelectValue placeholder="Selecciona un maestro" /></SelectTrigger>
            <SelectContent>
              {maestrosDelAula.map((maestro) => (
                <SelectItem key={maestro.id} value={String(maestro.id)}>
                  {maestro.nombre} {maestro.grupo ? `(${maestro.grupo})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-6 rounded-xl border border-border/50 bg-card px-5 py-4 shadow-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span className="text-sm text-muted-foreground">
            Ninos presentes en {grupo}: <strong className="text-foreground">{presentesNinos}/{ninosDelAula.length}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">
            Maestros presentes en turno: <strong className="text-foreground">{presentesMaestros}/{maestrosActivosTurno.length}</strong>
          </span>
        </div>
        <div className="text-sm text-muted-foreground">Cada check se guarda al momento en backend.</div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm animate-fade-in">
          <div className="border-b border-border/50 bg-muted/30 px-5 py-4">
            <h3 className="text-sm font-semibold text-foreground">Ninos del Aula {grupo}</h3>
          </div>
          {ninosDelAula.length > 0 ? (
            <div className="divide-y divide-border/30">
              {ninosDelAula.map((nino) => {
                const presente = attendance[nino.id] || false;
                const isSaving = savingId === nino.id;

                return (
                  <label key={nino.id} className="flex cursor-pointer items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/20">
                    <Checkbox
                      checked={presente}
                      disabled={!maestroId || isSaving}
                      onCheckedChange={(checked) => marcarAsistenciaNino(nino.id, Boolean(checked))}
                    />
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-xs font-bold text-primary">{nino.nombre.charAt(0)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{nino.nombre}</p>
                      <p className="text-xs text-muted-foreground">{nino.edad} anos - Aula {nino.grupo}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSaving ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando
                        </span>
                      ) : presente ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Presente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <XCircle className="h-3.5 w-3.5" /> Pendiente
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">No hay ninos activos en esta aula para el turno seleccionado.</p>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm animate-fade-in">
          <div className="border-b border-border/50 bg-muted/30 px-5 py-4">
            <h3 className="text-sm font-semibold text-foreground">Maestros del Turno</h3>
          </div>
          {maestrosActivosTurno.length > 0 ? (
            <div className="divide-y divide-border/30">
              {maestrosActivosTurno.map((maestro) => {
                const presente = teacherAttendance[maestro.id] || false;
                const isSaving = savingTeacherId === maestro.id;

                return (
                  <label key={maestro.id} className="flex cursor-pointer items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/20">
                    <Checkbox
                      checked={presente}
                      disabled={isSaving}
                      onCheckedChange={(checked) => marcarAsistenciaMaestro(maestro.id, Boolean(checked))}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{maestro.nombre}</p>
                      <p className="text-xs text-muted-foreground">Aula {maestro.grupo || "Sin aula"} - Turno {maestro.turno}</p>
                    </div>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : presente ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">No hay maestros activos en este turno.</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
