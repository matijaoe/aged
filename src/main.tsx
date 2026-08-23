import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import "./index.css";

declare const __AGED_SINGLEFILE__: boolean;

const root = document.getElementById("root");
if (root === null) {
  throw new Error("missing #root element");
}
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// The hosted build registers a service worker for offline use; the
// single-file build runs from file:// where service workers don't exist.
if (!__AGED_SINGLEFILE__ && import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {
    // Offline caching is an enhancement; the app works without it.
  });
}
