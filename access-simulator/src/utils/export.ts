import initSqlJs, { type Database } from 'sql.js';
import type { DbState } from '../types/database';
import { safeIdentifier, toSql } from './database';

let sqlPromise: ReturnType<typeof initSqlJs> | null = null;
async function getSql() {
  sqlPromise ??= initSqlJs({ locateFile: (file) => new URL(`${import.meta.env.BASE_URL}${file}`, window.location.href).toString() });
  return sqlPromise;
}

export async function exportDatabase(state: DbState): Promise<Uint8Array> {
  const SQL = await getSql();
  const database: Database = new SQL.Database();
  database.run('PRAGMA foreign_keys = ON;');
  for (const table of state.tables) {
    const fields = table.fields.map((f) => {
      const type = f.type === 'Лічильник' || f.type === 'Число' ? 'INTEGER' :
        f.type === 'Грошовий' ? 'REAL' : f.type === 'Логічний (Так/Ні)' ? 'INTEGER' : 'TEXT';
      return `${safeIdentifier(f.name)} ${type}${f.primary ? ' PRIMARY KEY' : ''}${f.type === 'Лічильник' ? ' AUTOINCREMENT' : ''}`;
    });
    const relations = state.relations.filter((r) => r.toTable === table.name).map((r) =>
      `FOREIGN KEY (${safeIdentifier(r.toField)}) REFERENCES ${safeIdentifier(r.fromTable)} (${safeIdentifier(r.fromField)})`
    );
    database.run(`CREATE TABLE ${safeIdentifier(table.name)} (${[...fields, ...relations].join(', ')});`);
    for (const row of table.rows) {
      const names = table.fields.map((f) => safeIdentifier(f.name)).join(', ');
      const placeholders = table.fields.map(() => '?').join(', ');
      const values = table.fields.map((f) => {
        const v = row[f.name];
        return typeof v === 'boolean' ? (v ? 1 : 0) : v ?? null;
      });
      const stmt = database.prepare(`INSERT INTO ${safeIdentifier(table.name)} (${names}) VALUES (${placeholders})`);
      stmt.run(values as (string | number | null)[]);
      stmt.free();
    }
  }
  database.run('CREATE TABLE IF NOT EXISTS "_sys_access_meta" (id INTEGER PRIMARY KEY, payload TEXT NOT NULL);');
  database.run('INSERT INTO "_sys_access_meta" (payload) VALUES (?);', [JSON.stringify({
    relations: state.relations, queries: state.queries, forms: state.forms, reports: state.reports
  })]);
  const data = database.export();
  database.close();
  return data;
}

export async function importDatabase(buffer: ArrayBuffer): Promise<DbState> {
  const SQL = await getSql();
  const database = new SQL.Database(new Uint8Array(buffer));
  const tablesResult = database.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_sys_access_meta'");
  const tables = (tablesResult[0]?.values ?? []).map((row) => String(row[0]));
  const state: DbState = { tables: [], relations: [], queries: [], forms: [], reports: [] };
  for (const name of tables) {
    const info = database.exec(`PRAGMA table_info(${safeIdentifier(name)})`)[0]?.values ?? [];
    const fields = info.map((row) => {
      const fieldName = String(row[1]);
      const sqlType = String(row[2]).toUpperCase();
      const type = fieldName.toLowerCase().startsWith('id') && Number(row[5]) === 1 ? 'Лічильник' :
        sqlType.includes('REAL') ? 'Грошовий' : sqlType.includes('INT') ? 'Число' : 'Короткий текст';
      return { name: fieldName, type: type as import('../types/database').FieldType, primary: Number(row[5]) === 1 };
    });
    const result = database.exec(`SELECT * FROM ${safeIdentifier(name)}`)[0];
    const rows = (result?.values ?? []).map((values) => Object.fromEntries(fields.map((f, i) => [f.name, values[i] as import('../types/database').Cell])));
    state.tables.push({ name, fields, rows });
  }
  const meta = database.exec('SELECT payload FROM "_sys_access_meta" LIMIT 1')[0]?.values[0]?.[0];
  if (typeof meta === 'string') {
    try { Object.assign(state, JSON.parse(meta) as Partial<DbState>); } catch { /* metadata is optional */ }
  }
  database.close();
  return state;
}

export function downloadBlob(data: BlobPart, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportSql(state: DbState) {
  downloadBlob(toSql(state), 'database-export.sql', 'text/sql;charset=utf-8');
}
