import { randomUUID } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const port = Number(process.env.PORT) || 5197;
const root = process.cwd();
const distDir = resolve(root, "dist");
const tokenDir = resolve(root, process.env.GENERATED_TOKEN_DIR || ".generated-tokens");

mkdirSync(tokenDir, { recursive: true });

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".ttf", "font/ttf"],
]);

function corsHeaders(req, res) {
  const origin = req.headers.origin;
  const allowedOrigins = new Set(["https://www.owlbear.rodeo", "https://owlbear.rodeo"]);
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin, Access-Control-Request-Headers");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] ?? "*");
}

function send(res, status, body = "") {
  res.statusCode = status;
  res.end(body);
}

function publicFilePath(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const normalized = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const path = resolve(distDir, normalized === "/app" || normalized === "/app/" ? "index.html" : `.${normalized}`);
  return path.startsWith(distDir) ? path : null;
}

function serveFile(req, res, path) {
  if (!path || !existsSync(path)) {
    send(res, 404);
    return;
  }
  const extension = extname(path).toLowerCase();
  const type = mimeTypes.get(extension) || "application/octet-stream";
  res.setHeader("Content-Type", type);
  if ([".html", ".json", ".js", ".css", ".svg"].includes(extension)) {
    res.setHeader("Cache-Control", "no-store, max-age=0");
  }
  res.statusCode = 200;
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  createReadStream(path).pipe(res);
}

function handleGeneratedTokens(req, res, url) {
  corsHeaders(req, res);
  if (req.method === "OPTIONS") {
    send(res, 204);
    return true;
  }

  if (req.method === "POST" && url.pathname === "/generated-tokens") {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const id = randomUUID();
      const contentType = String(req.headers["content-type"] ?? "image/png").toLowerCase();
      const extension = contentType.includes("svg") ? "svg" : "png";
      writeFileSync(join(tokenDir, `${id}.${extension}`), Buffer.concat(chunks));
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ id, url: `/generated-tokens/${id}.${extension}` }));
    });
    return true;
  }

  const match = url.pathname.match(/^\/generated-tokens\/([a-f0-9-]+)\.(png|svg)$/i);
  if (match && (req.method === "GET" || req.method === "HEAD")) {
    const [, id, extension] = match;
    serveFile(req, res, join(tokenDir, `${id}.${extension.toLowerCase()}`));
    return true;
  }

  if (url.pathname.startsWith("/generated-tokens")) {
    send(res, 404);
    return true;
  }

  return false;
}

createServer((req, res) => {
  corsHeaders(req, res);
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/healthz") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: true, app: "svgtoken-owlbear-extension" }));
    return;
  }

  if (handleGeneratedTokens(req, res, url)) return;
  if (req.method === "OPTIONS") {
    send(res, 204);
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    send(res, 405);
    return;
  }

  if (url.pathname === "/" || url.pathname === "/manifest") {
    serveFile(req, res, resolve(distDir, "manifest.json"));
    return;
  }

  const filePath = publicFilePath(url.pathname);
  const fallbackPath = resolve(distDir, "index.html");
  serveFile(req, res, filePath && existsSync(filePath) ? filePath : fallbackPath);
}).listen(port, () => {
  const manifestPath = resolve(distDir, "manifest.json");
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : null;
  const name = manifest?.name ? ` for ${manifest.name}` : "";
  console.log(`SVG Token Owlbear server listening on ${port}${name}.`);
});
