import { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Frontend runtime error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
          <div className="max-w-md rounded-xl border border-destructive/30 bg-card p-6 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-foreground">No se pudo cargar la aplicacion</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ocurrio un error en el frontend. Recarga la pagina y revisa la consola del navegador para ver el detalle.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
