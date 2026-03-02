import { useState } from 'react';
import { Save, CheckCircle2, XCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { mockNinos, mockMaestros } from '@/data/mock';
import { toast } from 'sonner';

export default function AsistenciaPage() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [turno, setTurno] = useState<'mañana' | 'tarde'>('mañana');
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [maestroAttendance, setMaestroAttendance] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  const ninosFiltrados = mockNinos.filter(n => n.turno === turno && n.estado === 'activo');
  const maestrosFiltrados = mockMaestros.filter(m => m.turno === turno && m.estado === 'activo');

  const toggleNino = (id: string) => {
    setAttendance(prev => ({ ...prev, [id]: !prev[id] }));
    setSaved(false);
  };

  const toggleMaestro = (id: string) => {
    setMaestroAttendance(prev => ({ ...prev, [id]: !prev[id] }));
    setSaved(false);
  };

  const handleSave = () => {
    // TODO: Save to database via Lovable Cloud
    setSaved(true);
    toast.success('Asistencia guardada correctamente');
  };

  const presentesNinos = Object.values(attendance).filter(Boolean).length;
  const presentesMaestros = Object.values(maestroAttendance).filter(Boolean).length;

  return (
    <AppLayout>
      <PageHeader
        title="Control de Asistencia"
        description="Registro diario de asistencia de niños y maestros"
        actions={
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" /> Guardar Asistencia
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-card rounded-xl border border-border/50 shadow-sm">
        <div className="space-y-2 flex-1 max-w-xs">
          <Label>Fecha</Label>
          <Input type="date" value={fecha} onChange={(e) => { setFecha(e.target.value); setSaved(false); }} />
        </div>
        <div className="space-y-2 w-40">
          <Label>Turno</Label>
          <Select value={turno} onValueChange={(v) => { setTurno(v as 'mañana' | 'tarde'); setSaved(false); setAttendance({}); setMaestroAttendance({}); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mañana">Mañana</SelectItem>
              <SelectItem value="tarde">Tarde</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-6 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span className="text-muted-foreground">Niños: <strong className="text-foreground">{presentesNinos}/{ninosFiltrados.length}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Maestros: <strong className="text-foreground">{presentesMaestros}/{maestrosFiltrados.length}</strong></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Niños */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden animate-fade-in">
          <div className="px-5 py-4 border-b border-border/50 bg-muted/30">
            <h3 className="font-semibold text-foreground text-sm">Niños — Turno {turno}</h3>
          </div>
          {ninosFiltrados.length > 0 ? (
            <div className="divide-y divide-border/30">
              {ninosFiltrados.map((n) => (
                <label key={n.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 cursor-pointer transition-colors">
                  <Checkbox
                    checked={attendance[n.id] || false}
                    onCheckedChange={() => toggleNino(n.id)}
                  />
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{n.nombre.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{n.nombre}</p>
                    <p className="text-xs text-muted-foreground">Grupo {n.grupo} • {n.edad} años</p>
                  </div>
                  <div>
                    {attendance[n.id] ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Presente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <XCircle className="w-3.5 h-3.5" /> Ausente
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-center py-10 text-muted-foreground text-sm">No hay niños registrados en este turno</p>
          )}
        </div>

        {/* Maestros */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden animate-fade-in">
          <div className="px-5 py-4 border-b border-border/50 bg-muted/30">
            <h3 className="font-semibold text-foreground text-sm">Maestros — Turno {turno}</h3>
          </div>
          {maestrosFiltrados.length > 0 ? (
            <div className="divide-y divide-border/30">
              {maestrosFiltrados.map((m) => (
                <label key={m.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 cursor-pointer transition-colors">
                  <Checkbox
                    checked={maestroAttendance[m.id] || false}
                    onCheckedChange={() => toggleMaestro(m.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{m.nombre}</p>
                  </div>
                  {maestroAttendance[m.id] ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground/40" />
                  )}
                </label>
              ))}
            </div>
          ) : (
            <p className="text-center py-10 text-muted-foreground text-sm">No hay maestros en este turno</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
