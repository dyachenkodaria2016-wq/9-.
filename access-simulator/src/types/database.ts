export type FieldType = 'Короткий текст' | 'Число' | 'Дата/час' | 'Грошовий' | 'Логічний (Так/Ні)' | 'Лічильник';
export interface Field { name: string; type: FieldType; primary?: boolean; description?: string; }
export type Cell = string | number | boolean | null;
export interface DbTable { name: string; fields: Field[]; rows: Record<string, Cell>[]; }
export interface Relation { id: string; fromTable: string; fromField: string; toTable: string; toField: string; }
export interface QueryDef { name: string; table: string; field: string; operator: string; value: string; sort: 'none' | 'asc' | 'desc'; sql?: string; }
export interface DbState { tables: DbTable[]; relations: Relation[]; queries: QueryDef[]; forms: string[]; reports: string[]; }
export type ObjectKind = 'table' | 'query' | 'form' | 'report' | 'relationships';
export interface OpenObject { kind: ObjectKind; name: string; }
