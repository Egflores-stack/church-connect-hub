import { useState } from "react";
import { ArrowRight, Building2, Church, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/api";
import { setAuthSession } from "@/lib/auth";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Ingresa tu correo y contrasena para continuar.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await login(email, password);
      setAuthSession(response.user);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-[-80px] top-[15%] h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute bottom-[-90px] left-1/3 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
        <section className="hidden lg:flex lg:w-1/2 lg:items-center lg:p-10">
          <div className="h-full w-full rounded-[30px] bg-gradient-to-b from-primary to-primary/90 p-10 text-primary-foreground shadow-2xl">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <Church className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-primary-foreground/70">Church Connect Hub</p>
                <h1 className="font-display text-2xl font-bold">Acceso Administrativo</h1>
              </div>
            </div>

            <h2 className="max-w-md font-display text-4xl leading-tight">
              Gestiona tu ministerio desde un panel seguro y organizado.
            </h2>
            <p className="mt-5 max-w-md text-primary-foreground/75">
              Control de ninos, maestros, asistencia y reportes en un solo lugar, con experiencia moderna y enfocada
              en operaciones diarias.
            </p>

            <div className="mt-10 grid gap-4">
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <div className="mb-2 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-secondary" />
                  <p className="text-sm font-semibold">Acceso protegido</p>
                </div>
                <p className="text-sm text-primary-foreground/75">Ingreso controlado para el personal autorizado.</p>
              </div>

              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <div className="mb-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-secondary" />
                  <p className="text-sm font-semibold">Panel unificado</p>
                </div>
                <p className="text-sm text-primary-foreground/75">Flujo rapido para navegacion del menu y dashboard.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card/90 p-7 shadow-2xl backdrop-blur-sm sm:p-10">
            <div className="mb-8">
              <div className="mb-6 flex items-center gap-3 lg:hidden">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Church className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Church Connect Hub</p>
                  <p className="font-display text-lg">Acceso Administrativo</p>
                </div>
              </div>

              <h3 className="font-display text-3xl font-bold text-foreground">Bienvenido</h3>
              <p className="mt-2 text-sm text-muted-foreground">Inicia sesion para entrar al dashboard del menu.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electronico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@iglesia.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contrasena</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="h-11 w-full font-semibold" disabled={loading}>
                {loading ? "Ingresando..." : "Iniciar sesion"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-8 border-t border-border/70 pt-5 text-center">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Powered by Cloudix Technologies
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Sistema de Gestion Ministerial v1.0</p>
              <p className="mt-4 text-[11px] text-muted-foreground">
                Credenciales semilla: admin@iglesia.com / admin123
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
