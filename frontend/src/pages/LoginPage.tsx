import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, login } from "@/lib/api";
import { setAuthSession } from "@/lib/auth";

type LoginErrorDetails = {
  status: number;
  operation?: string;
  resource?: string;
  field?: string;
  parameter?: string;
  value?: string;
  fields?: string[];
  detail?: string;
};

function getLoginErrorMessage(err: unknown) {
  if (err instanceof ApiError) {
    if (err.status === 0) {
      return "No se pudo conectar con el backend. Verifica que el servidor este encendido, que la URL de la API sea correcta y que exista conexion de red.";
    }

    if (err.status === 400) {
      const fields = Array.isArray(err.context.fields) ? err.context.fields.map((field) => String(field)) : [];
      if (fields.includes("email") && fields.includes("password")) {
        return "Revisa tu correo y tu contrasena. Faltan datos obligatorios para iniciar sesion.";
      }
      if (fields.includes("email")) {
        return "El correo no tiene un formato valido.";
      }
      if (fields.includes("password")) {
        return "La contrasena debe tener al menos 6 caracteres.";
      }
      if (err.context.field === "email") {
        return "El correo no tiene un formato valido.";
      }
      if (err.context.field === "password") {
        return "La contrasena debe tener al menos 6 caracteres.";
      }
    }

    if (err.status === 401) {
      return "Credenciales invalidas. Verifica tu usuario y contrasena.";
    }

    if (err.status >= 500) {
      const detail = typeof err.context.detail === "string" && err.context.detail.trim()
        ? ` Detalle tecnico: ${err.context.detail}`
        : "";
      return `El backend no pudo completar el inicio de sesion. Puede ser un fallo del servidor o de la base de datos.${detail}`;
    }

    return err.message;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return "No se pudo iniciar sesion.";
}

function getLoginErrorDetails(err: unknown): LoginErrorDetails | null {
  if (!(err instanceof ApiError)) {
    return null;
  }

  const fields = Array.isArray(err.context.fields)
    ? err.context.fields.map((field) => String(field))
    : undefined;

  return {
    status: err.status,
    operation: typeof err.context.operation === "string" ? err.context.operation : undefined,
    resource: typeof err.context.resource === "string" ? err.context.resource : undefined,
    field: typeof err.context.field === "string" ? err.context.field : undefined,
    parameter: typeof err.context.parameter === "string" ? err.context.parameter : undefined,
    value: typeof err.context.value === "string" ? err.context.value : err.context.value !== undefined ? String(err.context.value) : undefined,
    fields,
    detail: typeof err.context.detail === "string" ? err.context.detail : undefined,
  };
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
      <span className="min-w-28 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</span>
      <span className="break-all text-sm text-slate-700">{value}</span>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState<LoginErrorDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Ingresa tu correo y contrasena para continuar.");
      setErrorDetails(null);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setErrorDetails(null);
      const response = await login(email, password);
      setAuthSession(response.user, response.token);
      navigate("/");
    } catch (err) {
      setError(getLoginErrorMessage(err));
      setErrorDetails(getLoginErrorDetails(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(30,58,138,0.08),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#f8fafc_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-8rem] h-72 w-72 -translate-x-1/2 rounded-full bg-[#1E3A8A]/10 blur-3xl" />
        <div className="absolute bottom-[-6rem] right-[-4rem] h-72 w-72 rounded-full bg-[#047857]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md items-center">
        <section className="w-full rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] text-slate-500 shadow-inner">
              <Lock className="h-8 w-8" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1E3A8A]">
              Church Connect Hub
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Iniciar sesion
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Accede a tu panel desde cualquier dispositivo.
            </p>
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
                  autoComplete="email"
                  inputMode="email"
                  placeholder="admin@iglesia.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 rounded-[14px] border-slate-200 bg-white pl-11 text-slate-900 shadow-[inset_0_1px_3px_rgba(15,23,42,0.08)] placeholder:text-slate-400 focus-visible:ring-[#1E3A8A]/20"
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
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 rounded-[14px] border-slate-200 bg-white pr-12 text-slate-900 shadow-[inset_0_1px_3px_rgba(15,23,42,0.08)] placeholder:text-slate-400 focus-visible:ring-[#1E3A8A]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <p>{error}</p>
                {errorDetails && (
                  <details className="mt-3 rounded-[12px] border border-red-200/80 bg-white/70 px-3 py-2 text-slate-700">
                    <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.22em] text-red-700">
                      Detalle tecnico
                    </summary>
                    <div className="mt-3 space-y-2">
                      <DetailRow label="Codigo" value={errorDetails.status ? String(errorDetails.status) : undefined} />
                      <DetailRow label="Operacion" value={errorDetails.operation} />
                      <DetailRow label="Recurso" value={errorDetails.resource} />
                      <DetailRow label="Campo" value={errorDetails.field} />
                      <DetailRow label="Parametro" value={errorDetails.parameter} />
                      <DetailRow
                        label="Valor"
                        value={errorDetails.value}
                      />
                      <DetailRow
                        label="Campos"
                        value={errorDetails.fields?.length ? errorDetails.fields.join(", ") : undefined}
                      />
                      <DetailRow label="Detalle" value={errorDetails.detail} />
                    </div>
                  </details>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-14 w-full rounded-[14px] bg-[#047857] text-base font-semibold text-white shadow-[0_18px_40px_rgba(4,120,87,0.24)] transition hover:bg-[#065f46]"
            >
              {loading ? "Entrando..." : "Entrar al sistema"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

          </form>
        </section>
      </div>

      <footer className="absolute bottom-4 left-0 right-0 text-center text-xs tracking-[0.22em] text-slate-500">
        HECHO POR CLOUDIX TECNOLOGIES
      </footer>
    </div>
  );
}
