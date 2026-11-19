import { ChevronDown, Table2, Search, FileText, FileBarChart, GitBranch, Plus } from 'lucide-react';
import type { DbState, ObjectKind, OpenObject } from '../types/database';

interface Props { db: DbState; onOpen: (item: OpenObject) => void; onNewTable: () => void; onDelete: (kind: ObjectKind, name: string) => void; }
export function Sidebar({ db, onOpen, onNewTable, onDelete }: Props) {
  const groups: { title: string; kind: ObjectKind; names: string[]; icon: React.ReactNode }[] = [
    { title: 'Таблиці', kind: 'table', names: db.tables.map(t => t.name), icon: <Table2 size={15}/> },
    { title: 'Запити', kind: 'query', names: db.queries.map(q => q.name), icon: <Search size={15}/> },
    { title: 'Форми', kind: 'form', names: db.forms, icon: <FileText size={15}/> },
    { title: 'Звіти', kind: 'report', names: db.reports, icon: <FileBarChart size={15}/> }
  ];
  return <aside className="sidebar">
    <div className="sidebar-title">Усі об'єкти Access <ChevronDown size={14}/></div>
    {groups.map(g => <section className="object-group" key={g.kind}><div className="group-heading">{g.icon}<b>{g.title}</b><span>{g.names.length}</span>{g.kind === 'table' && <button title="Додати таблицю" onClick={onNewTable}><Plus size={14}/></button>}</div>
      {g.names.map(name => <div className="object-row" key={name}><button className="object-link" onDoubleClick={() => onOpen({ kind: g.kind, name })} onClick={() => onOpen({ kind: g.kind, name })}>{name}</button><button className="delete-mini" title="Видалити об'єкт" onClick={() => onDelete(g.kind, name)}>×</button></div>)}
      {!g.names.length && <div className="empty-group">Немає об'єктів</div>}
    </section>)}
    <button className="relationship-link" onClick={() => onOpen({ kind: 'relationships', name: 'Схема даних' })}><GitBranch size={15}/> Схема даних</button>
    <div className="sidebar-hint">Двічі клацніть об'єкт, щоб відкрити його у робочій області.</div>
  </aside>;
}
