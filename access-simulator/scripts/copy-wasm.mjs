import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const source = resolve('node_modules/sql.js/dist/sql-wasm.wasm');
const target = resolve('public/sql-wasm.wasm');

if (!existsSync(source)) {
  throw new Error(`Не знайдено ${source}. Переконайтеся, що пакет sql.js встановлено.`);
}
mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log('Готово: sql-wasm.wasm скопійовано до public/.');
