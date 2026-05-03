const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const root = __dirname;
const dataDir = path.join(root, "data");
const contentPath = path.join(dataDir, "site-content.json");
const leadsPath = path.join(dataDir, "leads.json");
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

async function ensureDataFiles() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(contentPath);
  } catch {
    await fs.writeFile(contentPath, "{}", "utf-8");
  }
  try {
    await fs.access(leadsPath);
  } catch {
    await fs.writeFile(leadsPath, "[]", "utf-8");
  }
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf-8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload, null, 2));
}

function publicContent(content) {
  const { adminPin, ...safeContent } = content || {};
  return safeContent;
}

function isPathInsideRoot(filePath) {
  const relative = path.relative(root, filePath);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function serveFile(request, response, pathname) {
  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.join(root, decodeURIComponent(cleanPath));
  if (!isPathInsideRoot(filePath)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=60"
    });
    response.end(data);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}

async function handleApi(request, response, pathname) {
  if (pathname === "/api/health" && request.method === "GET") {
    sendJson(response, 200, { ok: true, service: "dermalab-site" });
    return;
  }

  if (pathname === "/api/site-content" && request.method === "GET") {
    sendJson(response, 200, publicContent(await readJson(contentPath, {})));
    return;
  }

  if (pathname === "/api/site-content" && request.method === "PUT") {
    const current = await readJson(contentPath, {});
    const body = await readBody(request);
    const expectedPin = process.env.ADMIN_PIN || current.adminPin;
    if (body.pin !== expectedPin) {
      sendJson(response, 401, { error: "Invalid admin PIN" });
      return;
    }
    const next = { ...body.content, adminPin: current.adminPin || "admin123" };
    await fs.writeFile(contentPath, JSON.stringify(next, null, 2), "utf-8");
    sendJson(response, 200, publicContent(next));
    return;
  }

  if (pathname === "/api/leads" && request.method === "GET") {
    sendJson(response, 200, await readJson(leadsPath, []));
    return;
  }

  if (pathname === "/api/leads" && request.method === "POST") {
    const body = await readBody(request);
    const leads = await readJson(leadsPath, []);
    const lead = {
      id: `lead_${Date.now()}`,
      createdAt: new Date().toISOString(),
      name: String(body.name || "").trim(),
      contact: String(body.contact || "").trim(),
      need: String(body.need || "").trim(),
      message: String(body.message || "").trim(),
      language: String(body.language || "")
    };
    if (!lead.name || !lead.contact) {
      sendJson(response, 400, { error: "Name and contact are required" });
      return;
    }
    leads.unshift(lead);
    await fs.writeFile(leadsPath, JSON.stringify(leads, null, 2), "utf-8");
    sendJson(response, 201, lead);
    return;
  }

  sendJson(response, 404, { error: "Not found" });
}

async function main() {
  await ensureDataFiles();
  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      if (url.pathname.startsWith("/api/")) {
        await handleApi(request, response, url.pathname);
        return;
      }
      if (url.pathname === "/admin") {
        await serveFile(request, response, "/admin.html");
        return;
      }
      await serveFile(request, response, url.pathname);
    } catch (error) {
      sendJson(response, 500, { error: error.message });
    }
  });

  server.listen(port, "127.0.0.1", () => {
    console.log(`DermaLab site: http://127.0.0.1:${port}`);
    console.log(`Admin panel: http://127.0.0.1:${port}/admin`);
  });
}

main();
