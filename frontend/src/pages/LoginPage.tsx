import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  Lock,
  Mail,
  UsersRound,
  Waypoints,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/api";
import { setAuthSession } from "@/lib/auth";

const features = [
  {
    icon: Waypoints,
    title: "Conexion Ministerial",
  },
  {
    icon: UsersRound,
    title: "Control de Ninos y Maestros",
  },
  {
    icon: BarChart3,
    title: "Asistencia al 98%",
  },
  {
    icon: BarChart3,
    title: "Reportes Claros: 360",
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      setAuthSession(response.user, response.token);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(30,58,138,0.07),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(4,120,87,0.06),transparent_22%)]" />

      <div className="relative flex min-h-[720px] w-full max-w-7xl overflow-hidden rounded-[36px] border border-slate-200/80 bg-white shadow-[0_35px_90px_rgba(15,23,42,0.08)]">
        <section className="flex w-full flex-col justify-center px-8 py-12 sm:px-12 lg:w-1/2 lg:px-16">
          <div className="max-w-xl">
            <div className="mb-14">
              <p className="text-[clamp(3rem,7vw,5.5rem)] font-extrabold tracking-[0.08em] text-[#1E3A8A]">
                LIDERA
              </p>
              <p className="mt-2 text-sm font-light uppercase tracking-[0.42em] text-slate-500">
                SISTEMA DE GESTION
              </p>
            </div>

            <div className="space-y-5">
              {features.map(({ icon: Icon, title }) => (
                <div
                  key={title}
                  className="flex items-center gap-4 rounded-[22px] border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_100%)] text-[#1E3A8A] shadow-inner">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-lg font-medium text-[#111827]">{title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="hidden lg:flex lg:w-1/2 lg:items-center lg:justify-center lg:bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_60%,#f3f4f6_100%)] lg:px-10">
          <div className="w-full max-w-md rounded-[32px] border border-white/70 bg-white/80 p-9 shadow-[0_28px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] text-slate-400 shadow-inner">
                <Lock className="h-8 w-8" />
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Bienvenido</h1>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-600">
                  Tu usuario
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@iglesia.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 rounded-[12px] border-slate-200 bg-white pl-11 text-slate-900 shadow-[inset_0_1px_3px_rgba(15,23,42,0.08)] placeholder:text-slate-400 focus-visible:ring-[#1E3A8A]/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-600">
                  Contrasena
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 rounded-[12px] border-slate-200 bg-white pr-12 text-slate-900 shadow-[inset_0_1px_3px_rgba(15,23,42,0.08)] placeholder:text-slate-400 focus-visible:ring-[#1E3A8A]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-14 w-full rounded-[12px] bg-[#047857] text-base font-semibold text-white shadow-[0_18px_40px_rgba(4,120,87,0.24)] transition hover:bg-[#065f46]"
              >
                {loading ? "Entrando..." : "Entrar al Sistema"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <div className="rounded-[16px] border border-slate-200 bg-[#F3F4F6] px-4 py-4 text-sm text-slate-600">
                <p className="font-medium text-slate-700">Credenciales de prueba</p>
                <p className="mt-1">admin@iglesia.com / admin123</p>
              </div>
            </form>
          </div>
        </section>
      </div>

      <footer className="absolute bottom-4 left-0 right-0 text-center text-xs tracking-[0.22em] text-slate-500">
        POWERED BY CLOUDIX TECHNOLOGIES
      </footer>
    </div>
  );
}
