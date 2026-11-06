import { Component, type ErrorInfo, type ReactNode } from "react";

/** Render-phase crash catcher: shows the error instead of a blank page. */
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Faith Hill UI crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", fontFamily: "system-ui" }}>
        <div style={{ maxWidth: "620px" }}>
          <h1 style={{ fontFamily: "inherit" }}>Something broke while rendering</h1>
          <p>Please share this message — it tells us exactly what to fix:</p>
          <pre style={{ background: "#fff2f1", border: "1px solid #f5c5c0", borderRadius: "10px", padding: "1rem", overflow: "auto", whiteSpace: "pre-wrap" }}>
            {String(this.state.error?.message ?? this.state.error)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: "0.5rem", padding: "0.7rem 1.6rem", borderRadius: "999px", border: 0, background: "#3b62e2", color: "#fff", fontWeight: 700, cursor: "pointer" }}
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}

/** Displays a fatal, non-render error (e.g. thrown inside an effect). */
export function showFatalError(rootEl: HTMLElement, error: unknown) {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  console.error("Faith Hill uncaught error:", error);
  rootEl.innerHTML = `
    <div style="min-height:100vh;display:grid;place-items:center;padding:2rem;font-family:system-ui">
      <div style="max-width:620px">
        <h1>Something broke while loading</h1>
        <p>Please share this message — it tells us exactly what to fix:</p>
        <pre style="background:#fff2f1;border:1px solid #f5c5c0;border-radius:10px;padding:1rem;white-space:pre-wrap">${message}</pre>
      </div>
    </div>`;
}
