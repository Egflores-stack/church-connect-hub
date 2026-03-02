import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, User } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { mockNinos } from '@/data/mock';
import { Nino, Turno, Estado } from '@/types';

export default function NinosPage() {
  const [ninos, setNinos] = useState<Nino[]>(mockNinos);
  const [search, setSearch] = useState('');
  const [filterTurno, setFilterTurno] = useState('todos');
  const [filterGrupo, setFilterGrupo] = useState('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNino, setEditingNino] = useState<Nino | null>(null);

  const [form, setForm] = useState<{ nombre: string; edad: number; fechaNacimiento: string; grupo: string; turno: Turno; estado: Estado; responsable: string }>({
    nombre: '', edad: 0, fechaNacimiento: '', grupo: 'A', turno: 'mañana', responsable: '', estado: 'activo',
  });

  const filtered = ninos.filter(n => {
    const matchSearch = n.nombre.toLowerCase().includes(search.toLowerCase());
    const matchTurno = filterTurno === 'todos' || n.turno === filterTurno;
    const matchGrupo = filterGrupo === 'todos' || n.grupo === filterGrupo;
    return matchSearch && matchTurno && matchGrupo;
  });

  const grupos = [...new Set(ninos.map(n => n.grupo))].sort();

  const openCreate = () => {
    setEditingNino(null);
    setForm({ nombre: '', edad: 0, fechaNacimiento: '', grupo: 'A', turno: 'mañana', responsable: '', estado: 'activo' });
    setDialogOpen(true);
  };

  const openEdit = (n: Nino) => {
    setEditingNino(n);
    setForm({ nombre: n.nombre, edad: n.edad, fechaNacimiento: n.fechaNacimiento, grupo: n.grupo, turno: n.turno, responsable: n.responsable || '', estado: n.estado });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingNino) {
      setNinos(prev => prev.map(n => n.id === editingNino.id ? { ...n, ...form } : n));
    } else {
      setNinos(prev => [...prev, { ...form, id: Date.now().toString() }]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setNinos(prev => prev.filter(n => n.id !== id));
  };

  return (
    <AppLayout>
      <PageHeader
        title="Niños"
        description="Registro de niños del ministerio infantil"
        actions={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Nuevo Niño
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar niño..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterTurno} onValueChange={setFilterTurno}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Turno" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="mañana">Mañana</SelectItem>
            <SelectItem value="tarde">Tarde</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterGrupo} onValueChange={setFilterGrupo}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Grupo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {grupos.map(g => <SelectItem key={g} value={g}>Grupo {g}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Edad</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Grupo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Turno</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Responsable</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((n) => (
                <tr key={n.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{n.nombre.charAt(0)}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{n.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{n.edad} años</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">Grupo {n.grupo}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground capitalize hidden md:table-cell">{n.turno}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{n.responsable || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={n.estado} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(n)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(n.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No se encontraron niños</p>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editingNino ? 'Editar Niño' : 'Nuevo Niño'}</DialogTitle>
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
                <Label>Edad</Label>
                <Input type="number" value={form.edad} onChange={(e) => setForm({ ...form, edad: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grupo</Label>
                <Select value={form.grupo} onValueChange={(v) => setForm({ ...form, grupo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Grupo A</SelectItem>
                    <SelectItem value="B">Grupo B</SelectItem>
                    <SelectItem value="C">Grupo C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Turno</Label>
                <Select value={form.turno} onValueChange={(v) => setForm({ ...form, turno: v as 'mañana' | 'tarde' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mañana">Mañana</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Responsable (opcional)</Label>
              <Input value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v as 'activo' | 'inactivo' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} className="w-full">
              {editingNino ? 'Guardar Cambios' : 'Registrar Niño'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
