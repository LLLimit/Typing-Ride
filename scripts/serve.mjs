import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const serverInfo = path.resolve(root, '../.ride-server.json');
const args = process.argv.slice(2); const preferred = args.includes('--port') ? Number(args[args.indexOf('--port') + 1]) : 5173;
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webm': 'video/webm', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8' };
await fs.access(path.join(root, 'index.html')).catch(() => { console.error('请先在项目文件夹执行 pnpm install 和 pnpm build。'); process.exit(1); });
const server = http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    const data = await fs.readFile(file); res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache', 'X-Content-Type-Options': 'nosniff' }); res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('未找到文件'); }
});
let port = preferred;
server.on('error', error => { if (error.code === 'EADDRINUSE' && port < preferred + 10) server.listen(++port, '127.0.0.1'); else { console.error(error.message); process.exit(1); } });
server.on('listening', () => {
  const url = `http://127.0.0.1:${port}/`; console.log(`\n逐字骑行 · TYPE & RIDE\n${url}\n\n保持此窗口打开。按 Ctrl+C 停止服务。\n`);
  void fs.writeFile(serverInfo, JSON.stringify({ url, pid: process.pid, root })).catch(() => {});
  if (args.includes('--open') && process.platform === 'win32') spawn('powershell.exe', ['-NoProfile', '-Command', `Start-Process '${url}'`], { windowsHide: true, stdio: 'ignore' }).unref();
});
process.on('SIGINT', () => { server.close(() => process.exit(0)); });
server.listen(port, '127.0.0.1');
