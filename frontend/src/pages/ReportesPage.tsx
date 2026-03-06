import { FileBarChart, Download } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

export default function ReportesPage() {
  const [mes, setMes] = useState('03');
  const [tipoReporte, setTipoReporte] = useState('asistencia');

  return (
    <AppLayout>
      <PageHeader title="Reportes" description="Genera reportes detallados del ministerio" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-foreground text-sm mb-4">Filtros</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tipo de Reporte</label>
            <Select value={tipoReporte} onValueChange={setTipoReporte}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="asistencia">Asistencia Mensual</SelectItem>
                <SelectItem value="turno">Asistencia por Turno</SelectItem>
                <SelectItem value="maestros">Reporte de Maestros</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
          <div className="flex flex-col gap-2 pt-4">
            <Button className="gap-2 w-full">
              <Download className="w-4 h-4" /> Exportar a Excel
            </Button>
            <Button variant="outline" className="gap-2 w-full">
              <Download className="w-4 h-4" /> Exportar a PDF
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border/50 shadow-sm p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-6">
            <FileBarChart className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Vista Previa del Reporte</h3>
          </div>
          <div className="text-center py-16 text-muted-foreground">
            <FileBarChart className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-1">Conecta Lovable Cloud</p>
            <p className="text-sm max-w-md mx-auto">
              Para generar reportes reales con datos persistentes, conecta Lovable Cloud para habilitar la base de datos y la generación de reportes.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
