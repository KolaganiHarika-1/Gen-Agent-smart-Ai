import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(here, '..', 'data', 'db.json');

const emptyDb = { tasks: [], decisions: [], logs: [] };

export async function readDb() {
  try {
    const raw = await fs.readFile(dbPath, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...emptyDb, ...parsed };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await writeDb(emptyDb);
    return structuredClone(emptyDb);
  }
}

export async function writeDb(db) {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  const tempPath = `${dbPath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(db, null, 2), 'utf8');
  await fs.rename(tempPath, dbPath);
}

export async function addLog(type, message, meta = {}) {
  const db = await readDb();
  db.logs.unshift({
    id: `log-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    type, message, meta, createdAt: new Date().toISOString()
  });
  db.logs = db.logs.slice(0, 200);
  await writeDb(db);
}
