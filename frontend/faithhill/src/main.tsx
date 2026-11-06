import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary, { showFatalError } from "./components/ErrorBoundary";
import "./styles.css";

const rootEl = document.getElementById("root")!;

createRoot(rootEl, {
  onUncaughtError: (error) => showFatalError(rootEl, error),
  onCaughtError: () => undefined,
}).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
);
