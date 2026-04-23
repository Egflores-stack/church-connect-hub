import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/api";
import { setAuthSession } from "@/lib/auth";

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

      <div className="relative w-full max-w-md overflow-hidden rounded-[36px] border border-slate-200/80 bg-white p-8 shadow-[0_35px_90px_rgba(15,23,42,0.08)] sm:p-12">
        <div className="mb-10 text-center">
          <p className="text-[clamp(2.5rem,10vw,4rem)] font-extrabold tracking-[0.08em] text-[#1E3A8A]">
            LIDERA
          </p>
          <p className="mt-1 text-xs font-light uppercase tracking-[0.3em] text-slate-500">
            SISTEMA DE GESTION
          </p>
        </div>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] text-slate-400 shadow-inner">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Bienvenido</h1>
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
        </form>
      </div>

      <footer className="absolute bottom-4 left-0 right-0 text-center text-xs tracking-[0.22em] text-slate-500">
        POWERED BY CLOUDIX TECHNOLOGIES
      </footer>
    </div>
  );
}
