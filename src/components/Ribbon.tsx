import { FilePlus2, Table2, GitBranch, Search, FileText, FileSpreadsheet, FolderOpen, Save, Send, Download } from 'lucide-react';

interface Props {
  tab: string;
  setTab: (tab: string) => void;
  onCreateTable: () => void;
  onRelationships: () => void;
  onCreateQuery: () => void;
  onCreateForm: () => void;
  onCreateReport: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSubmit: () => void;
  onSql: () => void;
}
const tabs = ['Файл', 'Головна', 'Створення', 'Робота з базами даних'];
export function Ribbon(p: Props) {
  return <header className="ribbon">
    <div className="topline"><div className="brand"><span className="brand-mark">A</span><b>Навчальний Access</b><span className="muted-light">— Симулятор СКБД</span></div><div className="top-actions"><button onClick={p.onOpen}><FolderOpen size={15}/> Відкрити БД</button><button onClick={p.onSave}><Save size={15}/> Зберегти БД</button><button className="submit-btn" onClick={p.onSubmit}><Send size={15}/> Здати роботу</button></div></div>
    <nav className="ribbon-tabs">{tabs.map(t => <button key={t} className={p.tab === t ? 'active' : ''} onClick={() => p.setTab(t)}>{t}</button>)}</nav>
    <div className="ribbon-tools">
      {p.tab === 'Файл' ? <><Tool icon={<FolderOpen/>} label="Відкрити БД (.accdb)" onClick={p.onOpen}/><Tool icon={<Save/>} label="Зберегти БД (.accdb)" onClick={p.onSave}/><Tool icon={<Download/>} label="Експорт SQL (.sql)" onClick={p.onSql}/><Tool icon={<Send/>} label="Здати роботу" onClick={p.onSubmit}/></> :
      p.tab === 'Створення' ? <><Tool icon={<Table2/>} label="Таблиця" onClick={p.onCreateTable}/><Tool icon={<FileSpreadsheet/>} label="Конструктор таблиць" onClick={p.onCreateTable}/><Tool icon={<Search/>} label="Конструктор запитів" onClick={p.onCreateQuery}/><Tool icon={<FileText/>} label="Форма" onClick={p.onCreateForm}/><Tool icon={<FileText/>} label="Звіт" onClick={p.onCreateReport}/></> :
      <><Tool icon={<Table2/>} label="Нова таблиця" onClick={p.onCreateTable}/><Tool icon={<GitBranch/>} label="Схема даних" onClick={p.onRelationships}/><Tool icon={<Search/>} label="Запити" onClick={p.onCreateQuery}/><Tool icon={<FilePlus2/>} label="Створити форму" onClick={p.onCreateForm}/><Tool icon={<FileText/>} label="Створити звіт" onClick={p.onCreateReport}/></>}
    </div>
  </header>;
}
function Tool({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button className="tool" onClick={onClick}><span>{icon}</span><small>{label}</small></button>;
}
