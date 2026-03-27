import { useEffect, useState } from "react";
import { BookUser, Save, Users } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createMaestro, createNino, getCatalogSettings, getMaestros, getNinos } from "@/lib/api";
import type { CatalogSettings, Estado, Maestro, Nino, Turno } from "@/types";

const maestroFormBase = {
  nombre: "",
  telefono: "",
  email: "",
  fechaCumpleanos: "",
  grupo: "4-6",
  turno: "manana" as Turno,
  estado: "activo" as Estado,
};

const ninoFormBase = {
  nombre: "",
  fechaNacimiento: "",
  grupo: "4-6",
  turno: "manana" as Turno,
  responsable: "",
  telefonoResponsable: "",
  estado: "activo" as Estado,
};

export default function IngresoDatosPage() {
  const [maestros, setMaestros] = useState<Maestro[]>([]);
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [maestroForm, setMaestroForm] = useState(maestroFormBase);
  const [ninoForm, setNinoForm] = useState(ninoFormBase);
  const [catalogs, setCatalogs] = useState<CatalogSettings>({
    aulas: ["4-6", "7-9", "10-12"],
    turnos: ["manana", "tarde"],
    roles: ["admin", "supervisor", "digitador"],
    edades: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [maestrosData, ninosData, catalogsData] = await Promise.all([getMaestros(), getNinos(), getCatalogSettings()]);
      setMaestros(maestrosData);
      setNinos(ninosData);
      setCatalogs(catalogsData);
      if (catalogsData.aulas[0]) {
        setMaestroForm((current) => ({ ...current, grupo: current.grupo || catalogsData.aulas[0] }));
        setNinoForm((current) => ({ ...current, grupo: current.grupo || catalogsData.aulas[0] }));
      }
      if (catalogsData.turnos[0]) {
        setMaestroForm((current) => ({ ...current, turno: current.turno || (catalogsData.turnos[0] as Turno) }));
        setNinoForm((current) => ({ ...current, turno: current.turno || (catalogsData.turnos[0] as Turno) }));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron cargar los datos.");
    }
  }

  async function handleCreateMaestro() {
    try {
      const created = await createMaestro(maestroForm);
      setMaestros((current) => [created, ...current]);
      setMaestroForm({
        ...maestroFormBase,
        grupo: catalogs.aulas[0] || maestroFormBase.grupo,
        turno: (catalogs.turnos[0] as Turno) || maestroFormBase.turno,
      });
      toast.success("Maestro registrado correctamente.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar el maestro.");
    }
  }

  async function handleCreateNino() {
    try {
      const created = await createNino(ninoForm);
      setNinos((current) => [created, ...current]);
      setNinoForm({
        ...ninoFormBase,
        grupo: catalogs.aulas[0] || ninoFormBase.grupo,
        turno: (catalogs.turnos[0] as Turno) || ninoFormBase.turno,
      });
      toast.success("Nino registrado correctamente.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar el nino.");
    }
  }

  return (
    <AppLayout>
      <PageHeader
        title="Ingreso de Datos"
        description="Captura maestros y ninos por aula desde una sola pantalla"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Maestros registrados</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">{maestros.length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <BookUser className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Ninos registrados</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">{ninos.length}</p>
        </div>
      </div>

      <Tabs defaultValue="maestros" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="maestros">Maestros</TabsTrigger>
          <TabsTrigger value="ninos">Ninos</TabsTrigger>
        </TabsList>

        <TabsContent value="maestros" className="space-y-6">
          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-foreground">Registrar Maestro</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input value={maestroForm.nombre} onChange={(e) => setMaestroForm({ ...maestroForm, nombre: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Telefono</Label>
                <Input value={maestroForm.telefono} onChange={(e) => setMaestroForm({ ...maestroForm, telefono: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={maestroForm.email} onChange={(e) => setMaestroForm({ ...maestroForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fecha de cumpleanos</Label>
                <Input type="date" value={maestroForm.fechaCumpleanos} onChange={(e) => setMaestroForm({ ...maestroForm, fechaCumpleanos: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Aula</Label>
                <Select value={maestroForm.grupo || catalogs.aulas[0] || "4-6"} onValueChange={(value) => setMaestroForm({ ...maestroForm, grupo: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {catalogs.aulas.map((aula) => (
                      <SelectItem key={aula} value={aula}>{aula} anos</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Turno</Label>
                <Select value={maestroForm.turno} onValueChange={(value) => setMaestroForm({ ...maestroForm, turno: value as Turno })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {catalogs.turnos.map((turno) => (
                      <SelectItem key={turno} value={turno} className="capitalize">{turno}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCreateMaestro} className="mt-5 gap-2">
              <Save className="h-4 w-4" /> Guardar Maestro
            </Button>
          </div>

          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-foreground">Ultimos Maestros</h3>
            <div className="space-y-3">
              {maestros.slice(0, 8).map((maestro) => (
                <div key={maestro.id} className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{maestro.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      Aula {maestro.grupo || "Sin aula"} - Turno {maestro.turno}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{maestro.estado}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ninos" className="space-y-6">
          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-foreground">Registrar Nino</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input value={ninoForm.nombre} onChange={(e) => setNinoForm({ ...ninoForm, nombre: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fecha de nacimiento</Label>
                <Input type="date" value={ninoForm.fechaNacimiento} onChange={(e) => setNinoForm({ ...ninoForm, fechaNacimiento: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Aula</Label>
                <Select value={ninoForm.grupo} onValueChange={(value) => setNinoForm({ ...ninoForm, grupo: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {catalogs.aulas.map((aula) => (
                      <SelectItem key={aula} value={aula}>{aula} anos</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Turno</Label>
                <Select value={ninoForm.turno} onValueChange={(value) => setNinoForm({ ...ninoForm, turno: value as Turno })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {catalogs.turnos.map((turno) => (
                      <SelectItem key={turno} value={turno} className="capitalize">{turno}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Responsable</Label>
                <Input value={ninoForm.responsable} onChange={(e) => setNinoForm({ ...ninoForm, responsable: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Telefono del responsable</Label>
                <Input value={ninoForm.telefonoResponsable} onChange={(e) => setNinoForm({ ...ninoForm, telefonoResponsable: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleCreateNino} className="mt-5 gap-2">
              <Save className="h-4 w-4" /> Guardar Nino
            </Button>
          </div>

          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-foreground">Ultimos Ninos</h3>
            <div className="space-y-3">
              {ninos.slice(0, 10).map((nino) => (
                <div key={nino.id} className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{nino.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      Aula {nino.grupo} - {nino.edad} anos - Turno {nino.turno}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{nino.estado}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
