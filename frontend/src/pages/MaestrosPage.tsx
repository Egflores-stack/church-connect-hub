import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createMaestro, deleteMaestro, getMaestros, updateMaestro } from "@/lib/api";
import type { Estado, Maestro, Turno } from "@/types";

const emptyForm: Omit<Maestro, "id"> = {
  nombre: "",
  telefono: "",
  email: "",
  fechaCumpleanos: "",
  grupo: "4-6",
  turno: "manana",
  estado: "activo",
};

export default function MaestrosPage() {
  const [maestros, setMaestros] = useState<Maestro[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaestro, setEditingMaestro] = useState<Maestro | null>(null);
  const [form, setForm] = useState<Omit<Maestro, "id">>(emptyForm);

  useEffect(() => {
    loadMaestros();
  }, []);

  async function loadMaestros() {
    try {
      setLoading(true);
      setMaestros(await getMaestros());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron cargar los maestros.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(
    () =>
      maestros.filter(
        (maestro) =>
          maestro.nombre.toLowerCase().includes(search.toLowerCase()) ||
          maestro.email.toLowerCase().includes(search.toLowerCase()),
      ),
    [maestros, search],
  );

  function openCreate() {
    setEditingMaestro(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(maestro: Maestro) {
    setEditingMaestro(maestro);
    setForm({
      nombre: maestro.nombre,
      telefono: maestro.telefono,
      email: maestro.email,
      fechaCumpleanos: maestro.fechaCumpleanos || "",
      grupo: maestro.grupo || "4-6",
      turno: maestro.turno,
      estado: maestro.estado,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    try {
      if (editingMaestro) {
        const updated = await updateMaestro(editingMaestro.id, form);
        setMaestros((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        toast.success("Maestro actualizado.");
      } else {
        const created = await createMaestro(form);
        setMaestros((current) => [created, ...current]);
        toast.success("Maestro creado.");
      }

      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el maestro.");
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteMaestro(id);
      setMaestros((current) => current.filter((maestro) => maestro.id !== id));
      toast.success("Maestro eliminado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el maestro.");
    }
  }

  return (
    <AppLayout>
      <PageHeader
        title="Maestros"
        description="Gestion del equipo de maestros del ministerio"
        actions={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Nuevo Maestro
          </Button>
        }
      />

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar maestro..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((maestro) => (
          <div key={maestro.id} className="rounded-xl border border-border/50 bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md animate-fade-in">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-sm font-bold text-primary">
                    {maestro.nombre
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{maestro.nombre}</p>
                  <p className="text-xs capitalize text-muted-foreground">Turno {maestro.turno} - Aula {maestro.grupo || "Sin grupo"}</p>
                </div>
              </div>
              <StatusBadge status={maestro.estado} />
            </div>
            <div className="mb-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" /> {maestro.telefono || "Sin telefono"}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" /> {maestro.email || "Sin email"}
              </div>
            </div>
            <div className="flex gap-2 border-t border-border/50 pt-3">
              <Button variant="outline" size="sm" onClick={() => openEdit(maestro)} className="flex-1 gap-1 text-xs">
                <Pencil className="h-3 w-3" /> Editar
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(maestro.id)} className="gap-1 text-xs text-destructive hover:text-destructive">
                <Trash2 className="h-3 w-3" /> Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-lg font-medium">No se encontraron maestros</p>
          <p className="text-sm">Intenta con otro termino de busqueda</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editingMaestro ? "Editar Maestro" : "Nuevo Maestro"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefono</Label>
                <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cumpleanos</Label>
                <Input type="date" value={form.fechaCumpleanos} onChange={(e) => setForm({ ...form, fechaCumpleanos: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Aula / Grupo</Label>
                <Select value={form.grupo || "4-6"} onValueChange={(value) => setForm({ ...form, grupo: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4-6">4-6 anos</SelectItem>
                    <SelectItem value="7-9">7-9 anos</SelectItem>
                    <SelectItem value="10-12">10-12 anos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Turno</Label>
                <Select value={form.turno} onValueChange={(value) => setForm({ ...form, turno: value as Turno })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manana">Manana</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={(value) => setForm({ ...form, estado: value as Estado })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSave} className="w-full">
              {editingMaestro ? "Guardar Cambios" : "Crear Maestro"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
