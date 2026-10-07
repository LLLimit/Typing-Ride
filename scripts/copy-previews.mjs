import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const source = fileURLToPath(new URL('../previews/', import.meta.url));
const target = fileURLToPath(new URL('../dist/previews/', import.meta.url));
try { await fs.access(source); await fs.cp(source, target, { recursive: true }); }
catch(error) { if(error.code !== 'ENOENT') throw error; }
