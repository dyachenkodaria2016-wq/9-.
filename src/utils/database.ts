import type { DbState, DbTable, Field, Cell } from '../types/database';

export const emptyDatabase = (): DbState => ({ tables: [], relations: [], queries: [], forms: [], reports: [] });

export function demoDatabase(): DbState {
  const customers: DbTable = {
    name: 'Клієнти',
    fields: [
      { name: 'ID_Клієнта', type: 'Лічильник', primary: true },
      { name: 'Імя', type: 'Короткий текст' },
      { name: 'Місто', type: 'Короткий текст' },
      { name: 'Електронна_пошта', type: 'Короткий текст' }
    ],
    rows: [
      { ID_Клієнта: 1, Імя: 'Олена Коваль', Місто: 'Київ', Електронна_пошта: 'olena@example.com' },
      { ID_Клієнта: 2, Імя: 'Андрій Мельник', Місто: 'Львів', Електронна_пошта: 'andrii@example.com' },
      { ID_Клієнта: 3, Імя: 'Марія Шевченко', Місто: 'Вінниця', Електронна_пошта: 'maria@example.com' }
    ]
  };
  const products: DbTable = {
    name: 'Товари',
    fields: [
      { name: 'ID_Товару', type: 'Лічильник', primary: true },
      { name: 'Назва', type: 'Короткий текст' },
      { name: 'Ціна', type: 'Грошовий' },
      { name: 'На_складі', type: 'Логічний (Так/Ні)' }
    ],
    rows: [
      { ID_Товару: 1, Назва: 'Навушники', Ціна: 1250, На_складі: true },
      { ID_Товару: 2, Назва: 'Клавіатура', Ціна: 890, На_складі: true },
      { ID_Товару: 3, Назва: 'Миша', Ціна: 540, На_складі: false }
    ]
  };
  const orders: DbTable = {
    name: 'Замовлення',
    fields: [
      { name: 'ID_Замовлення', type: 'Лічильник', primary: true },
      { name: 'ID_Клієнта', type: 'Число' },
      { name: 'Товар', type: 'Короткий текст' },
      { name: 'Дата', type: 'Дата/час' },
      { name: 'Сума', type: 'Грошовий' }
    ],
    rows: [
      { ID_Замовлення: 1, ID_Клієнта: 1, Товар: 'Навушники', Дата: '2026-11-12', Сума: 1250 },
      { ID_Замовлення: 2, ID_Клієнта: 2, Товар: 'Клавіатура', Дата: '2026-11-14', Сума: 890 },
      { ID_Замовлення: 3, ID_Клієнта: 1, Товар: 'Миша', Дата: '2026-11-16', Сума: 540 }
    ]
  };
  return {
    tables: [customers, products, orders],
    relations: [{ id: 'rel-1', fromTable: 'Клієнти', fromField: 'ID_Клієнта', toTable: 'Замовлення', toField: 'ID_Клієнта' }],
    queries: [{ name: 'Замовлення_від_клієнта_1', table: 'Замовлення', field: 'ID_Клієнта', operator: '=', value: '1', sort: 'none' }],
    forms: ['Картка клієнта'],
    reports: ['Звіт замовлень']
  };
}

export function validateCell(type: Field['type'], value: unknown): Cell {
  if (type === 'Лічильник') return Number(value) || 0;
  if (type === 'Логічний (Так/Ні)') return Boolean(value);
  if (type === 'Число' || type === 'Грошовий') {
    if (value === '' || value === null) return null;
    const n = Number(value);
    if (!Number.isFinite(n)) throw new Error('У числовому полі потрібно ввести число.');
    return n;
  }
  return value === '' ? null : String(value);
}

export function safeIdentifier(value: string): string {
  if (!value.trim()) throw new Error('Назва не може бути порожньою.');
  return `"${value.replaceAll('"', '""')}"`;
}

export function toSql(state: DbState): string {
  const lines: string[] = ['-- SQL-експорт навчальної бази даних'];
  for (const table of state.tables) {
    const columns = table.fields.map((f) => {
      const type = f.type === 'Лічильник' || f.type === 'Число' ? 'INTEGER' :
        f.type === 'Грошовий' ? 'REAL' : f.type === 'Логічний (Так/Ні)' ? 'INTEGER' :
        f.type === 'Дата/час' ? 'TEXT' : 'TEXT';
      return `  ${safeIdentifier(f.name)} ${type}${f.primary ? ' PRIMARY KEY' : ''}`;
    });
    lines.push(`CREATE TABLE ${safeIdentifier(table.name)} (\n${columns.join(',\n')}\n);`);
    for (const row of table.rows) {
      const names = table.fields.map((f) => safeIdentifier(f.name)).join(', ');
      const vals = table.fields.map((f) => {
        const v = row[f.name];
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'boolean') return v ? '1' : '0';
        if (typeof v === 'number') return String(v);
        return `'${String(v).replaceAll("'", "''")}'`;
      }).join(', ');
      lines.push(`INSERT INTO ${safeIdentifier(table.name)} (${names}) VALUES (${vals});`);
    }
  }
  return lines.join('\n\n');
}
