import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type PluginOption } from "vite-plus";
import { viteSingleFile } from "vite-plugin-singlefile";

/**
 * Two build outputs share this config:
 *
 * - `vp build` — the hosted bundle in `dist/`, with a service worker for
 *   offline use. A plain static bundle; host TBD.
 * - `vp build --mode singlefile` — `dist-single/index.html`, everything
 *   inlined, runs from `file://`. The build script renames it `aged.html`.
 *
 * The CSP is injected at build time only (the dev server needs a WebSocket
 * for HMR, which `connect-src 'none'` would kill). `connect-src 'none'`
 * blocks every background network request the page could make — fetch,
 * XHR, WebSocket, beacons, EventSource. Inline scripts are allowed by
 * SHA-256 hash, never by 'unsafe-inline'.
 */

function csp(scriptHashes: readonly string[]): string {
  return [
    "default-src 'self'",
    `script-src 'self' ${scriptHashes.join(" ")}`.trimEnd(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'none'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; ");
}

/**
 * Injects the CSP meta tag into every emitted HTML file, allowing each
 * inline script by hash. Runs after vite-plugin-singlefile has inlined the
 * bundle so the hashes cover the final script bodies. Fails the build if
 * injection can't happen — a silently missing CSP would void the privacy
 * guarantee.
 */
function injectCsp(): PluginOption {
  return {
    name: "aged:inject-csp",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      for (const item of Object.values(bundle)) {
        if (item.type !== "asset" || !item.fileName.endsWith(".html")) {
          continue;
        }
        const html = item.source.toString();
        const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
          .map((match) => match[1] ?? "")
          .filter((body) => body !== "");
        const hashes = inlineScripts.map(
          (body) => `'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`,
        );
        const anchor = "<meta charset=";
        if (!html.includes(anchor)) {
          throw new Error(`CSP injection failed: no charset meta tag in ${item.fileName}`);
        }
        item.source = html.replace(
          anchor,
          `<meta http-equiv="Content-Security-Policy" content="${csp(hashes)}" />\n    ${anchor}`,
        );
      }
    },
  };
}

/**
 * Emits sw.js for the hosted build from scripts/sw.template.js, filling in
 * a cache name derived from the build's content and the exact precache
 * list, so each deploy invalidates the previous cache and the worker never
 * serves files the build didn't produce.
 */
function serviceWorker(): PluginOption {
  return {
    name: "aged:service-worker",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      const files = Object.values(bundle)
        .map((item) => item.fileName)
        .sort();
      const hash = createHash("sha256");
      for (const item of Object.values(bundle)) {
        hash.update(item.fileName);
        hash.update(item.type === "asset" ? item.source : item.code);
      }
      const precache = [
        "./",
        ...files.filter((name) => !name.endsWith(".html")),
        "favicon.svg",
        "manifest.webmanifest",
      ];
      const template = readFileSync(new URL("./scripts/sw.template.js", import.meta.url), "utf8");
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: template
          .replace("__CACHE_NAME__", `aged-${hash.digest("hex").slice(0, 16)}`)
          .replace("__PRECACHE__", JSON.stringify(precache)),
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const singlefile = mode === "singlefile";
  return {
    base: "./",
    resolve: {
      alias: {
        "@": new URL("./src", import.meta.url).pathname,
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      ...(singlefile ? [viteSingleFile({ removeViteModuleLoader: true })] : [serviceWorker()]),
      injectCsp(),
    ],
    define: {
      // The single-file build has no service worker; the hosted one does.
      __AGED_SINGLEFILE__: JSON.stringify(singlefile),
    },
    build: singlefile ? { outDir: "dist-single" } : {},
    fmt: {},
    lint: {
      jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
      rules: { "vite-plus/prefer-vite-plus-imports": "error" },
      options: { typeAware: true, typeCheck: true },
    },
  };
});
