import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Phone, Mail } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockMaestros } from '@/data/mock';
import type { Turno, Estado } from '@/types';
import { Maestro } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MaestrosPage() {
  const [maestros, setMaestros] = useState<Maestro[]>(mockMaestros);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaestro, setEditingMaestro] = useState<Maestro | null>(null);

  const [form, setForm] = useState<{ nombre: string; telefono: string; email: string; fechaCumpleanos: string; turno: Turno; estado: Estado }>({
    nombre: '', telefono: '', email: '', fechaCumpleanos: '', turno: 'mañana', estado: 'activo',
  });

  const filtered = maestros.filter(m =>
    m.nombre.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingMaestro(null);
    setForm({ nombre: '', telefono: '', email: '', fechaCumpleanos: '', turno: 'mañana', estado: 'activo' });
    setDialogOpen(true);
  };

  const openEdit = (m: Maestro) => {
    setEditingMaestro(m);
    setForm({ nombre: m.nombre, telefono: m.telefono, email: m.email, fechaCumpleanos: m.fechaCumpleanos, turno: m.turno, estado: m.estado });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingMaestro) {
      setMaestros(prev => prev.map(m => m.id === editingMaestro.id ? { ...m, ...form } : m));
    } else {
      setMaestros(prev => [...prev, { ...form, id: Date.now().toString() }]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setMaestros(prev => prev.filter(m => m.id !== id));
  };

  return (
    <AppLayout>
      <PageHeader
        title="Maestros"
        description="Gestión del equipo de maestros del ministerio"
        actions={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Nuevo Maestro
          </Button>
        }
      />

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar maestro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((m) => (
          <div key={m.id} className="bg-card rounded-xl border border-border/50 shadow-sm p-5 hover:shadow-md transition-all duration-200 animate-fade-in">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{m.nombre.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{m.nombre}</p>
                  <p className="text-xs text-muted-foreground capitalize">Turno {m.turno}</p>
                </div>
              </div>
              <StatusBadge status={m.estado} />
            </div>
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="w-3 h-3" /> {m.telefono}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="w-3 h-3" /> {m.email}
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-border/50">
              <Button variant="outline" size="sm" onClick={() => openEdit(m)} className="flex-1 gap-1 text-xs">
                <Pencil className="w-3 h-3" /> Editar
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(m.id)} className="text-destructive hover:text-destructive gap-1 text-xs">
                <Trash2 className="w-3 h-3" /> Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No se encontraron maestros</p>
          <p className="text-sm">Intenta con otro término de búsqueda</p>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editingMaestro ? 'Editar Maestro' : 'Nuevo Maestro'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cumpleaños</Label>
                <Input type="date" value={form.fechaCumpleanos} onChange={(e) => setForm({ ...form, fechaCumpleanos: e.target.value })} />
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
              {editingMaestro ? 'Guardar Cambios' : 'Crear Maestro'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
