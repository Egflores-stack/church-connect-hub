import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createNino, deleteNino, getNinos, updateNino } from "@/lib/api";
import type { Estado, Nino, Turno } from "@/types";

const emptyForm = {
  nombre: "",
  fechaNacimiento: "",
  grupo: "4-6",
  turno: "manana" as Turno,
  responsable: "",
  telefonoResponsable: "",
  estado: "activo" as Estado,
};

export default function NinosPage() {
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [search, setSearch] = useState("");
  const [filterTurno, setFilterTurno] = useState("todos");
  const [filterGrupo, setFilterGrupo] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNino, setEditingNino] = useState<Nino | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadNinos();
  }, []);

  async function loadNinos() {
    try {
      setNinos(await getNinos());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron cargar los ninos.");
    }
  }

  const filtered = useMemo(
    () =>
      ninos.filter((nino) => {
        const matchSearch = nino.nombre.toLowerCase().includes(search.toLowerCase());
        const matchTurno = filterTurno === "todos" || nino.turno === filterTurno;
        const matchGrupo = filterGrupo === "todos" || nino.grupo === filterGrupo;
        return matchSearch && matchTurno && matchGrupo;
      }),
    [ninos, search, filterTurno, filterGrupo],
  );

  const grupos = [...new Set(ninos.map((nino) => nino.grupo))].sort();

  function openCreate() {
    setEditingNino(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(nino: Nino) {
    setEditingNino(nino);
    setForm({
      nombre: nino.nombre,
      fechaNacimiento: nino.fechaNacimiento,
      grupo: nino.grupo,
      turno: nino.turno,
      responsable: nino.responsable || "",
      telefonoResponsable: nino.telefonoResponsable || "",
      estado: nino.estado,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    try {
      if (editingNino) {
        const updated = await updateNino(editingNino.id, form);
        setNinos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        toast.success("Nino actualizado.");
      } else {
        const created = await createNino(form);
        setNinos((current) => [created, ...current]);
        toast.success("Nino registrado.");
      }

      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el nino.");
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteNino(id);
      setNinos((current) => current.filter((nino) => nino.id !== id));
      toast.success("Nino eliminado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el nino.");
    }
  }

  return (
    <AppLayout>
      <PageHeader
        title="Ninos"
        description="Registro de ninos del ministerio infantil"
        actions={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Nuevo Nino
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar nino..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterTurno} onValueChange={setFilterTurno}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Turno" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="manana">Manana</SelectItem>
            <SelectItem value="tarde">Tarde</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterGrupo} onValueChange={setFilterGrupo}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Grupo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {grupos.map((grupo) => (
              <SelectItem key={grupo} value={grupo}>Grupo {grupo}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Edad</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Grupo</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Turno</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">Responsable</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((nino) => (
                <tr key={nino.id} className="border-b border-border/30 transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-xs font-bold text-primary">{nino.nombre.charAt(0)}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{nino.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{nino.edad} anos</td>
                  <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">Grupo {nino.grupo}</td>
                  <td className="hidden px-4 py-3 text-sm capitalize text-muted-foreground md:table-cell">{nino.turno}</td>
                  <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell">{nino.responsable || "-"}</td>
                  <td className="px-4 py-3"><StatusBadge status={nino.estado} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(nino)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(nino.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <User className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No se encontraron ninos</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editingNino ? "Editar Nino" : "Nuevo Nino"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de nacimiento</Label>
                <Input type="date" value={form.fechaNacimiento} onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Grupo</Label>
                <Select value={form.grupo} onValueChange={(value) => setForm({ ...form, grupo: value })}>
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
            <div className="space-y-2">
              <Label>Responsable</Label>
              <Input value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Telefono del responsable</Label>
              <Input value={form.telefonoResponsable} onChange={(e) => setForm({ ...form, telefonoResponsable: e.target.value })} />
            </div>
            <Button onClick={handleSave} className="w-full">
              {editingNino ? "Guardar Cambios" : "Registrar Nino"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
