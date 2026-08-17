import { createServer } from "node:http";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";

const root = resolve(process.cwd(), "dist");
const port = Number(process.env.PORT || 4173);
const files = new Map();

function loadDirectory(directory) {
  for (const name of readdirSync(directory)) {
    const fullPath = join(directory, name);
    if (statSync(fullPath).isDirectory()) {
      loadDirectory(fullPath);
      continue;
    }
    const route = `/${relative(root, fullPath).split(sep).join("/")}`;
    files.set(route, readFileSync(fullPath));
  }
}

loadDirectory(root);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  const asset = files.get(pathname) ?? files.get(pathname === "/" ? "/index.html" : pathname) ?? files.get("/index.html");
  const contentType = mimeTypes[extname(files.has(pathname) ? pathname : "/index.html")] ?? "application/octet-stream";
  response.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  response.end(asset);
}).listen(port, "127.0.0.1", () => {
  console.log(`Portfolio memory server: http://127.0.0.1:${port}/ (${files.size} files loaded)`);
});
