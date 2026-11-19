import { X, Table2, Search, FileText, FileBarChart, GitBranch } from 'lucide-react';
import type { OpenObject } from '../types/database';
export function Workspace({ tabs, active, onActivate, onClose, children }: { tabs: OpenObject[]; active: OpenObject | null; onActivate: (item: OpenObject) => void; onClose: (item: OpenObject) => void; children: React.ReactNode }) {
  const Icon = active?.kind === 'table' ? Table2 : active?.kind === 'query' ? Search : active?.kind === 'form' ? FileText : active?.kind === 'report' ? FileBarChart : GitBranch;
  return <main className="workspace">
    <div className="document-tabs">{tabs.map(t => <div key={`${t.kind}-${t.name}`} className={`doc-tab ${active?.kind === t.kind && active.name === t.name ? 'selected' : ''}`}><button onClick={() => onActivate(t)}>{t.kind === 'table' ? <Table2 size={14}/> : t.kind === 'query' ? <Search size={14}/> : t.kind === 'form' ? <FileText size={14}/> : t.kind === 'report' ? <FileBarChart size={14}/> : <GitBranch size={14}/>} {t.name}</button><button className="tab-close" onClick={() => onClose(t)}><X size={13}/></button></div>)}</div>
    <div className="workspace-content">{active && <div className="view-title"><Icon size={18}/><strong>{active.name}</strong><span className="view-mode">{active.kind === 'table' ? 'Подання таблиці' : active.kind === 'relationships' ? 'Схема даних' : 'Подання'}</span></div>}{children}</div>
  </main>;
}
