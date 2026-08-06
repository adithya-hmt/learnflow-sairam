import * as SQLite from 'expo-sqlite';
import { z } from 'zod';

const mutationSchema = z.object({ id: z.string().min(1), actorId: z.string().min(1), entity: z.string().min(1), action: z.enum(['upsert', 'delete']), payload: z.record(z.string(), z.unknown()) });
export type QueuedMutation = z.infer<typeof mutationSchema>;

let dbPromise: Promise<SQLite.SQLiteDatabase> | undefined;
async function db() {
  dbPromise ??= SQLite.openDatabaseAsync('learnflow.db');
  const database = await dbPromise;
  await database.execAsync('CREATE TABLE IF NOT EXISTS outbox (id TEXT PRIMARY KEY NOT NULL, actor_id TEXT, entity TEXT NOT NULL, action TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS outbox_quarantine (id TEXT PRIMARY KEY NOT NULL, entity TEXT NOT NULL, action TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL, reason TEXT NOT NULL); CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL, updated_at TEXT NOT NULL);');
  const columns = await database.getAllAsync<{ name: string }>('PRAGMA table_info(outbox)');
  if (!columns.some((column) => column.name === 'actor_id')) await database.execAsync('ALTER TABLE outbox ADD COLUMN actor_id TEXT;');
  await database.execAsync("INSERT OR IGNORE INTO outbox_quarantine (id, entity, action, payload, created_at, reason) SELECT id, entity, action, payload, created_at, 'missing_actor' FROM outbox WHERE actor_id IS NULL OR actor_id = ''; DELETE FROM outbox WHERE actor_id IS NULL OR actor_id = ''; ");
  return database;
}

export async function queueMutation(input: QueuedMutation) {
  const item = mutationSchema.parse(input);
  await (await db()).runAsync('INSERT OR REPLACE INTO outbox (id, actor_id, entity, action, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)', item.id, item.actorId, item.entity, item.action, JSON.stringify(item.payload), new Date().toISOString());
}
export async function queuedMutations(): Promise<QueuedMutation[]> {
  const rows = await (await db()).getAllAsync<{ id: string; actor_id: string | null; entity: string; action: string; payload: string }>('SELECT id, actor_id, entity, action, payload FROM outbox ORDER BY created_at');
  return rows.filter((row) => row.actor_id).map((row) => mutationSchema.parse({ id: row.id, actorId: row.actor_id, entity: row.entity, action: row.action, payload: JSON.parse(row.payload) }));
}
export async function completeMutation(id: string) { await (await db()).runAsync('DELETE FROM outbox WHERE id = ?', id); }
export async function pendingCount() { return (await (await db()).getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM outbox'))?.count ?? 0; }
export async function cacheValue(key: string, value: unknown) { await (await db()).runAsync('INSERT OR REPLACE INTO cache VALUES (?, ?, ?)', key, JSON.stringify(value), new Date().toISOString()); }
export async function readCache<T>(key: string): Promise<T | null> { const row = await (await db()).getFirstAsync<{ value: string }>('SELECT value FROM cache WHERE key = ?', key); return row ? JSON.parse(row.value) as T : null; }
export async function removeCache(key: string) { await (await db()).runAsync('DELETE FROM cache WHERE key = ?', key); }
