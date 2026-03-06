import { Settings, Bell, Mail } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ConfiguracionPage() {
  const [notificaciones, setNotificaciones] = useState(true);
  const [emailAlerta, setEmailAlerta] = useState('admin@iglesia.com');

  const handleSave = () => {
    toast.success('Configuración guardada');
  };

  return (
    <AppLayout>
      <PageHeader title="Configuración" description="Ajustes del sistema" />

      <div className="max-w-2xl space-y-6">
        {/* Notifications */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Notificaciones</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Alertas de cumpleaños</p>
                <p className="text-xs text-muted-foreground">Enviar correo automático en cumpleaños de niños y maestros</p>
              </div>
              <Switch checked={notificaciones} onCheckedChange={setNotificaciones} />
            </div>
            {notificaciones && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                <Label className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> Correo para alertas
                </Label>
                <Input type="email" value={emailAlerta} onChange={(e) => setEmailAlerta(e.target.value)} />
              </div>
            )}
          </div>
        </div>

        {/* System Info */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Información del Sistema</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Versión</p>
              <p className="font-medium text-foreground">1.0.0</p>
            </div>
            <div>
              <p className="text-muted-foreground">Entorno</p>
              <p className="font-medium text-foreground">Desarrollo</p>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full sm:w-auto">Guardar Configuración</Button>
      </div>
    </AppLayout>
  );
}
