import { useEffect, useState } from "react";
import { Bell, CalendarDays, Plus, Save, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  getCatalogSettings,
  getNotificationSettings,
  getUpcomingBirthdays,
  syncBirthdayCalendar,
  updateCatalogSettings,
  updateNotificationSettings,
} from "@/lib/api";
import type { AgeRangeCatalogItem, CatalogSettings, NotificationSettings, UpcomingBirthday } from "@/types";

const defaultSettings: NotificationSettings = {
  appEnabled: true,
  googleCalendarEnabled: false,
  daysBefore: 7,
  googleCalendarId: "",
  googleServiceAccountJson: "",
};

const defaultCatalogs: CatalogSettings = {
  aulas: ["4-6", "7-9", "10-12"],
  turnos: ["manana", "tarde"],
  roles: ["admin", "supervisor", "digitador"],
  edades: [
    { label: "4-6 anos", min: 4, max: 6 },
    { label: "7-9 anos", min: 7, max: 9 },
    { label: "10-12 anos", min: 10, max: 12 },
  ],
};

function updateCatalogList(list: string[], index: number, value: string) {
  return list.map((item, itemIndex) => (itemIndex === index ? value : item));
}

function updateAgeRange(list: AgeRangeCatalogItem[], index: number, patch: Partial<AgeRangeCatalogItem>) {
  return list.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
}

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [catalogs, setCatalogs] = useState<CatalogSettings>(defaultCatalogs);
  const [birthdays, setBirthdays] = useState<UpcomingBirthday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [settingsData, birthdaysData, catalogsData] = await Promise.all([
          getNotificationSettings(),
          getUpcomingBirthdays(30),
          getCatalogSettings(),
        ]);

        setSettings({ ...defaultSettings, ...settingsData });
        setBirthdays(birthdaysData);
        setCatalogs({ ...defaultCatalogs, ...catalogsData });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo cargar la configuracion.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleSaveNotifications() {
    try {
      const saved = await updateNotificationSettings(settings);
      setSettings({ ...defaultSettings, ...saved });
      toast.success("Configuracion de recordatorios guardada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la configuracion.");
    }
  }

  async function handleSaveCatalogs() {
    try {
      const saved = await updateCatalogSettings(catalogs);
      setCatalogs({ ...defaultCatalogs, ...saved });
      toast.success("Catalogos guardados correctamente.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron guardar los catalogos.");
    }
  }

  async function handleSyncCalendar() {
    try {
      const result = await syncBirthdayCalendar();
      toast.success(`Cumpleanos sincronizados: ${result.synced}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo sincronizar Google Calendar.");
    }
  }

  return (
    <AppLayout>
      <PageHeader title="Parametrizacion" description="Administra catalogos base, recordatorios y sincronizacion con Google Calendar" />

      <div className="max-w-5xl space-y-6">
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm animate-fade-in">
          <div className="mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Catalogos del sistema</h3>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3 rounded-lg border border-border/50 p-4">
              <div className="flex items-center justify-between">
                <Label>Aulas</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setCatalogs({ ...catalogs, aulas: [...catalogs.aulas, ""] })}>
                  <Plus className="mr-2 h-4 w-4" /> Agregar
                </Button>
              </div>
              {catalogs.aulas.map((aula, index) => (
                <div key={`aula-${index}`} className="flex gap-2">
                  <Input value={aula} onChange={(e) => setCatalogs({ ...catalogs, aulas: updateCatalogList(catalogs.aulas, index, e.target.value) })} placeholder="Ej. 4-6" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setCatalogs({ ...catalogs, aulas: catalogs.aulas.filter((_, itemIndex) => itemIndex !== index) })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-lg border border-border/50 p-4">
              <div className="flex items-center justify-between">
                <Label>Turnos</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setCatalogs({ ...catalogs, turnos: [...catalogs.turnos, ""] })}>
                  <Plus className="mr-2 h-4 w-4" /> Agregar
                </Button>
              </div>
              {catalogs.turnos.map((turno, index) => (
                <div key={`turno-${index}`} className="flex gap-2">
                  <Input value={turno} onChange={(e) => setCatalogs({ ...catalogs, turnos: updateCatalogList(catalogs.turnos, index, e.target.value) })} placeholder="Ej. manana" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setCatalogs({ ...catalogs, turnos: catalogs.turnos.filter((_, itemIndex) => itemIndex !== index) })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-lg border border-border/50 p-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Roles de usuario</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setCatalogs({ ...catalogs, roles: [...catalogs.roles, ""] })}>
                  <Plus className="mr-2 h-4 w-4" /> Agregar
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {catalogs.roles.map((role, index) => (
                  <div key={`role-${index}`} className="flex gap-2">
                    <Input value={role} onChange={(e) => setCatalogs({ ...catalogs, roles: updateCatalogList(catalogs.roles, index, e.target.value) })} placeholder="Ej. supervisor" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setCatalogs({ ...catalogs, roles: catalogs.roles.filter((_, itemIndex) => itemIndex !== index) })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border/50 p-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Rangos de edades</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCatalogs({
                      ...catalogs,
                      edades: [...catalogs.edades, { label: "", min: 0, max: 0 }],
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" /> Agregar
                </Button>
              </div>
              <div className="space-y-3">
                {catalogs.edades.map((edad, index) => (
                  <div key={`edad-${index}`} className="grid gap-3 rounded-lg border border-border/50 p-3 md:grid-cols-[2fr_1fr_1fr_auto]">
                    <Input
                      value={edad.label}
                      onChange={(e) => setCatalogs({ ...catalogs, edades: updateAgeRange(catalogs.edades, index, { label: e.target.value }) })}
                      placeholder="Ej. 4-6 anos"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={edad.min}
                      onChange={(e) => setCatalogs({ ...catalogs, edades: updateAgeRange(catalogs.edades, index, { min: Number(e.target.value) || 0 }) })}
                      placeholder="Min"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={edad.max}
                      onChange={(e) => setCatalogs({ ...catalogs, edades: updateAgeRange(catalogs.edades, index, { max: Number(e.target.value) || 0 }) })}
                      placeholder="Max"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setCatalogs({ ...catalogs, edades: catalogs.edades.filter((_, itemIndex) => itemIndex !== index) })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <Button onClick={handleSaveCatalogs} className="gap-2">
              <Save className="h-4 w-4" /> Guardar Catalogos
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm animate-fade-in">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Recordatorios</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Notificacion dentro de la app</p>
                <p className="text-xs text-muted-foreground">Mostrar proximos cumpleanos al equipo dentro del sistema.</p>
              </div>
              <Switch checked={settings.appEnabled} onCheckedChange={(value) => setSettings({ ...settings, appEnabled: value })} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Google Calendar</p>
                <p className="text-xs text-muted-foreground">Sincronizar cumpleanos anuales al calendario.</p>
              </div>
              <Switch checked={settings.googleCalendarEnabled} onCheckedChange={(value) => setSettings({ ...settings, googleCalendarEnabled: value })} />
            </div>

            <div className="space-y-2 border-t border-border/50 pt-4">
              <Label>Dias antes para avisar</Label>
              <Input
                type="number"
                min={0}
                value={settings.daysBefore}
                onChange={(e) => setSettings({ ...settings, daysBefore: Number(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="mt-5">
            <Button onClick={handleSaveNotifications} className="gap-2">
              <Save className="h-4 w-4" /> Guardar Configuracion
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm animate-fade-in">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Google Calendar</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Calendar ID</Label>
              <Input value={settings.googleCalendarId} onChange={(e) => setSettings({ ...settings, googleCalendarId: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Service Account JSON</Label>
              <textarea
                className="min-h-44 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={settings.googleServiceAccountJson}
                onChange={(e) => setSettings({ ...settings, googleServiceAccountJson: e.target.value })}
                placeholder="Pega aqui el JSON completo de la service account"
              />
            </div>
          </div>
          <div className="mt-5">
            <Button variant="outline" onClick={handleSyncCalendar}>
              Sincronizar Google Calendar
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm animate-fade-in">
          <div className="mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Proximos cumpleanos</h3>
          </div>
          <div className="space-y-3">
            {birthdays.map((birthday) => (
              <div key={`${birthday.entityType}-${birthday.entityId}`} className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{birthday.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {birthday.entityType === "maestro" ? `Maestro ${birthday.grupo || ""}` : "Staff"} - {birthday.nextBirthday}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {birthday.daysUntil === 0 ? "Hoy" : `${birthday.daysUntil} dia(s)`}
                </p>
              </div>
            ))}
            {!loading && birthdays.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay cumpleanos proximos registrados.</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
