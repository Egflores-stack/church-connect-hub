import { useEffect, useState } from "react";
import { KeyRound, Save, ShieldCheck, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createUser, deleteUser, getRolePermissions, getUsers, updateUser } from "@/lib/api";
import { hasPermission } from "@/lib/auth";
import type { Estado, RolePermission, User } from "@/types";

const formBase = {
  nombre: "",
  email: "",
  password: "",
  fechaCumpleanos: "",
  role: "digitador",
  estado: "activo" as Estado,
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [form, setForm] = useState(formBase);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [usersData, permissionsData] = await Promise.all([getUsers(), getRolePermissions()]);
      setUsers(usersData);
      setPermissions(permissionsData);
      if (permissionsData[0] && !form.role) {
        setForm((current) => ({ ...current, role: permissionsData[0].role }));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el modulo de usuarios.");
    }
  }

  function startEdit(user: User) {
    setEditingId(user.id);
    setForm({
      nombre: user.nombre,
      email: user.email,
      password: "",
      fechaCumpleanos: user.fechaCumpleanos || "",
      role: user.role,
      estado: (user.estado || "activo") as Estado,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      ...formBase,
      role: permissions[0]?.role || formBase.role,
    });
  }

  async function handleSubmit() {
    try {
      if (editingId) {
        const updated = await updateUser(editingId, form);
        setUsers((current) => current.map((user) => (user.id === editingId ? updated : user)));
        toast.success("Usuario actualizado.");
      } else {
        if (!form.password.trim()) {
          toast.error("La contrasena es obligatoria para nuevos usuarios.");
          return;
        }

        const created = await createUser(form);
        setUsers((current) => [...current, created]);
        toast.success("Usuario creado correctamente.");
      }

      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el usuario.");
    }
  }

  async function handleDelete(userId: number) {
    try {
      await deleteUser(userId);
      setUsers((current) => current.filter((user) => user.id !== userId));
      if (editingId === userId) {
        resetForm();
      }
      toast.success("Usuario eliminado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el usuario.");
    }
  }

  if (!hasPermission("users.manage")) {
    return (
      <AppLayout>
        <PageHeader title="Usuarios y Permisos" description="Acceso restringido" />
        <div className="rounded-xl border border-border/50 bg-card p-8 text-sm text-muted-foreground shadow-sm">
          Tu rol actual no tiene permiso para administrar usuarios.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader title="Usuarios y Permisos" description="Administra cuentas del sistema y revisa el alcance de cada rol" />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <UserCog className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">{editingId ? "Editar usuario" : "Nuevo usuario"}</h3>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Correo</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{editingId ? "Nueva contrasena opcional" : "Contrasena"}</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fecha de cumpleanos</Label>
                <Input type="date" value={form.fechaCumpleanos} onChange={(e) => setForm({ ...form, fechaCumpleanos: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {permissions.map((item) => (
                      <SelectItem key={item.role} value={item.role}>{item.role}</SelectItem>
                    ))}
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

            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={handleSubmit} className="gap-2">
                <Save className="h-4 w-4" /> {editingId ? "Actualizar" : "Guardar"}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={resetForm}>
                  Cancelar edicion
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">Permisos por rol</h3>
            </div>
            <div className="space-y-4">
              {permissions.map((item) => (
                <div key={item.role} className="rounded-lg border border-border/50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium text-foreground capitalize">{item.role}</p>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">{item.accessLevel}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.permissions.map((permission) => (
                      <span key={permission} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Usuarios registrados</h3>
          </div>

          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{user.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.email} - Rol {user.role} - {user.estado || "activo"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(user)}>
                    Editar
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">Todavia no hay usuarios creados.</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
