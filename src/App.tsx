import { useMemo, useRef, useState } from 'react';
import { Database, Plus, Play, Printer, Download, KeyRound, AlertCircle, CheckCircle2, BookOpen, Table2, ChevronLeft, ChevronRight, Trash2, Search, FileText } from 'lucide-react';
import { Ribbon } from './components/Ribbon';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { Modal } from './components/Modal';
import { useDatabase } from './hooks/useDatabase';
import { demoDatabase, validateCell } from './utils/database';
import { downloadBlob, exportDatabase, exportSql, importDatabase } from './utils/export';
import type { DbState, DbTable, Field, FieldType, ObjectKind, OpenObject, QueryDef, Relation } from './types/database';
import './styles.css';

const fieldTypes: FieldType[] = ['Короткий текст', 'Число', 'Дата/час', 'Грошовий', 'Логічний (Так/Ні)', 'Лічильник'];
const uid = () => Math.random().toString(36).slice(2, 10);

export default function App() {
  const { db, setDb } = useDatabase();
  const [ribbonTab, setRibbonTab] = useState('Головна');
  const [tabs, setTabs] = useState<OpenObject[]>([]);
  const [active, setActive] = useState<OpenObject | null>(null);
  const [modal, setModal] = useState<'table' | 'query' | 'relation' | 'submit' | null>(null);
  const [message, setMessage] = useState('');
  const [design, setDesign] = useState(false);
  const [student, setStudent] = useState({ name: '', className: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  const notify = (text: string) => { setMessage(text); window.setTimeout(() => setMessage(''), 3600); };
  const openObject = (item: OpenObject) => {
    setTabs(old => old.some(t => t.kind === item.kind && t.name === item.name) ? old : [...old, item]);
    setActive(item); setDesign(false);
  };
  const closeTab = (item: OpenObject) => {
    const next = tabs.filter(t => !(t.kind === item.kind && t.name === item.name));
    setTabs(next);
    if (active?.kind === item.kind && active.name === item.name) setActive(next.at(-1) ?? null);
  };
  const createTable = () => setModal('table');
  const saveTable = (name: string, fields: Field[]) => {
    if (!name.trim() || !fields.length) { notify('Укажіть назву таблиці та додайте поля.'); return; }
    if (db.tables.some(t => t.name === name)) { notify('Таблиця з такою назвою вже існує.'); return; }
    if (!fields.some(f => f.primary)) { notify('Призначте первинний ключ хоча б одному полю.'); return; }
    if (fields.some(f => !f.name.trim()) || new Set(fields.map(f => f.name)).size !== fields.length) { notify('Назви полів мають бути заповнені й унікальні.'); return; }
    setDb({ ...db, tables: [...db.tables, { name, fields, rows: [] }] }); setModal(null); openObject({ kind: 'table', name }); notify('Таблицю створено.');
  };
  const deleteObject = (kind: ObjectKind, name: string) => {
    if (!window.confirm(`Видалити об'єкт «${name}»?`)) return;
    if (kind === 'table') {
      if (db.relations.some(r => r.fromTable === name || r.toTable === name)) { notify('Спочатку видаліть зв’язки цієї таблиці.'); return; }
      setDb({ ...db, tables: db.tables.filter(t => t.name !== name) });
    } else if (kind === 'query') setDb({ ...db, queries: db.queries.filter(q => q.name !== name) });
    else if (kind === 'form') setDb({ ...db, forms: db.forms.filter(n => n !== name) });
    else if (kind === 'report') setDb({ ...db, reports: db.reports.filter(n => n !== name) });
    closeTab({ kind, name }); notify('Об’єкт видалено.');
  };
  const loadDemo = () => { setDb(demoDatabase()); setTabs([]); setActive(null); notify('Навчальну базу «Інтернет-магазин» завантажено.'); };
  const saveDb = async (filename = 'Database1.accdb') => {
    try { const bytes = await exportDatabase(db); downloadBlob(bytes, filename, 'application/vnd.ms-access'); notify('Файл бази даних сформовано.'); }
    catch (e) { notify(`Помилка експорту: ${e instanceof Error ? e.message : 'невідома помилка'}`); }
  };
  const openDb = async (file?: File) => {
    if (!file) return;
    try { const state = await importDatabase(await file.arrayBuffer()); setDb(state); setTabs([]); setActive(null); notify('Базу даних відкрито.'); }
    catch (e) { notify(`Не вдалося відкрити файл: ${e instanceof Error ? e.message : 'невідома помилка'}`); }
  };
  const submitWork = async () => {
    if (!student.name.trim() || !student.className.trim()) { notify('Заповніть прізвище, ім’я та клас/групу.'); return; }
    const filename = `${student.name.trim().replaceAll(/\s+/g, '_')}_${student.className.trim().replaceAll(/\s+/g, '_')}_БазаДаних.accdb`;
    await saveDb(filename); setModal(null);
  };
  const createQuery = () => setModal('query');
  const saveQuery = (q: QueryDef) => {
    if (db.queries.some(x => x.name === q.name)) { notify('Запит із такою назвою вже існує.'); return; }
    setDb({ ...db, queries: [...db.queries, q] }); setModal(null); openObject({ kind: 'query', name: q.name });
  };
  const createForm = () => {
    const table = db.tables[0];
    if (!table) { notify('Спочатку створіть або завантажте таблицю.'); return; }
    const name = `Форма_${table.name}`;
    setDb({ ...db, forms: db.forms.includes(name) ? db.forms : [...db.forms, name] }); openObject({ kind: 'form', name });
  };
  const createReport = () => {
    const table = db.tables[0];
    if (!table) { notify('Спочатку створіть або завантажте таблицю.'); return; }
    const name = `Звіт_${table.name}`;
    setDb({ ...db, reports: db.reports.includes(name) ? db.reports : [...db.reports, name] }); openObject({ kind: 'report', name });
  };
  const createRelation = (relation: Relation) => {
    if (db.relations.some(r => r.fromTable === relation.fromTable && r.toTable === relation.toTable && r.toField === relation.toField)) { notify('Такий зв’язок уже існує.'); return; }
    setDb({ ...db, relations: [...db.relations, relation] }); setModal(null); notify('Зв’язок створено.');
  };

  const content = useMemo(() => {
    if (!active) return null;
    if (active.kind === 'table') return <TableView table={db.tables.find(t => t.name === active.name)} onChange={rows => setDb(old => ({ ...old, tables: old.tables.map(t => t.name === active.name ? { ...t, rows } : t) }))} design={design} onDesign={() => setDesign(!design)} />;
    if (active.kind === 'query') return <QueryView query={db.queries.find(q => q.name === active.name)} db={db} />;
    if (active.kind === 'form') return <FormView name={active.name} db={db} setDb={setDb} notify={notify} />;
    if (active.kind === 'report') return <ReportView name={active.name} db={db} />;
    return <RelationsView db={db} onAdd={() => setModal('relation')} onDelete={id => setDb(old => ({ ...old, relations: old.relations.filter(r => r.id !== id) }))} />;
  }, [active, db, design, setDb]);

  return <div className="app-shell">
    <Ribbon tab={ribbonTab} setTab={setRibbonTab} onCreateTable={createTable} onRelationships={() => openObject({ kind: 'relationships', name: 'Схема даних' })} onCreateQuery={createQuery} onCreateForm={createForm} onCreateReport={createReport} onOpen={() => fileRef.current?.click()} onSave={() => void saveDb()} onSubmit={() => setModal('submit')} onSql={() => exportSql(db)} />
    <input ref={fileRef} type="file" accept=".accdb,.sqlite,.db" hidden onChange={e => { void openDb(e.target.files?.[0]); e.currentTarget.value = ''; }} />
    <div className="main-layout"><Sidebar db={db} onOpen={openObject} onNewTable={createTable} onDelete={deleteObject}/>
      <Workspace tabs={tabs} active={active} onActivate={setActive} onClose={closeTab}>
        {content ?? <Welcome onDemo={loadDemo} onNew={createTable} />}
      </Workspace>
    </div>
    <footer className="statusbar"><span><span className="status-dot"/> Готово</span><span>Навчальний режим · Локальне збереження активне</span><span>{db.tables.length} таблиць · {db.queries.length} запитів</span></footer>
    {message && <div className="toast"><CheckCircle2 size={17}/>{message}</div>}
    {modal === 'table' && <TableModal onClose={() => setModal(null)} onSave={saveTable}/>}
    {modal === 'query' && <QueryModal db={db} onClose={() => setModal(null)} onSave={saveQuery}/>}
    {modal === 'relation' && <RelationModal db={db} onClose={() => setModal(null)} onSave={createRelation}/>}
    {modal === 'submit' && <Modal title="Здати роботу" onClose={() => setModal(null)}><div className="form-stack"><p>Вкажіть дані учня. Вони будуть використані в назві файлу.</p><label>Прізвище та ім’я<input value={student.name} onChange={e => setStudent({ ...student, name: e.target.value })} placeholder="Наприклад, Іваненко Олена"/></label><label>Клас / група<input value={student.className} onChange={e => setStudent({ ...student, className: e.target.value })} placeholder="Наприклад, 8-А"/></label><div className="stats-grid">{[['Таблиці', db.tables.length], ['Запити', db.queries.length], ['Форми', db.forms.length], ['Звіти', db.reports.length], ['Зв’язки', db.relations.length]].map(([k,v]) => <div key={k}><b>{v}</b><span>{k}</span></div>)}</div><button className="primary-btn" onClick={() => void submitWork()}><Download size={16}/> Сформувати файл роботи</button></div></Modal>}
  </div>;
}

function Welcome({ onDemo, onNew }: { onDemo: () => void; onNew: () => void }) {
  return <div className="welcome"><div className="welcome-icon"><Database size={38}/></div><h1>Ласкаво просимо до Access</h1><p>Створюйте таблиці, пов’язуйте дані, конструюйте запити, форми та звіти.</p><div className="welcome-actions"><button className="primary-btn" onClick={onDemo}><BookOpen size={17}/> Завантажити навчальну базу даних</button><button className="secondary-btn" onClick={onNew}><Plus size={17}/> Створити порожню таблицю</button></div><div className="feature-cards"><div><Table2/><b>Таблиці</b><span>Поля, типи даних і первинні ключі</span></div><div><Search/><b>Запити</b><span>Відбір, сортування та SQL</span></div><div><FileText/><b>Форми й звіти</b><span>Введення даних і друк результатів</span></div></div><div className="notice"><AlertCircle size={16}/> Файл із розширенням .accdb у цьому симуляторі є SQLite-базою для навчального обміну, а не нативною базою Microsoft Access.</div></div>;
}

function TableModal({ onClose, onSave }: { onClose: () => void; onSave: (name: string, fields: Field[]) => void }) {
  const [name, setName] = useState('Таблиця1');
  const [fields, setFields] = useState<Field[]>([{ name: 'ID', type: 'Лічильник', primary: true }, { name: 'Назва', type: 'Короткий текст' }]);
  const update = (i: number, patch: Partial<Field>) => setFields(old => old.map((f, n) => n === i ? { ...f, ...patch, ...(patch.primary ? {} : {}) } : patch.primary ? { ...f, primary: false } : f));
  return <Modal title="Конструктор таблиць" onClose={onClose}><div className="form-stack"><label>Назва таблиці<input value={name} onChange={e => setName(e.target.value)}/></label><div className="field-grid head"><span>Ім’я поля</span><span>Тип даних</span><span>Ключ</span><span>Опис</span><span/></div>{fields.map((f,i) => <div className="field-grid" key={i}><input value={f.name} onChange={e => update(i,{name:e.target.value})}/><select value={f.type} onChange={e => update(i,{type:e.target.value as FieldType})}>{fieldTypes.map(t => <option key={t}>{t}</option>)}</select><label className="key-check"><input type="checkbox" checked={!!f.primary} onChange={e => update(i,{primary:e.target.checked})}/><KeyRound size={15}/></label><input value={f.description ?? ''} onChange={e => update(i,{description:e.target.value})} placeholder="Опис"/><button className="icon-btn" onClick={() => setFields(old => old.filter((_,n) => n !== i))}>×</button></div>)}<button className="secondary-btn" onClick={() => setFields(old => [...old,{name:`Поле${old.length+1}`,type:'Короткий текст'}])}><Plus size={15}/> Додати поле</button><div className="modal-actions"><button className="secondary-btn" onClick={onClose}>Скасувати</button><button className="primary-btn" onClick={() => onSave(name,fields)}>Створити таблицю</button></div></div></Modal>;
}

function TableView({ table, onChange, design, onDesign }: { table?: DbTable; onChange: (rows: DbTable['rows']) => void; design: boolean; onDesign: () => void }) {
  if (!table) return <p className="empty-state">Таблицю не знайдено.</p>;
  const addRow = () => {
    const row: Record<string, string | number | boolean | null> = {};
    table.fields.forEach(f => { row[f.name] = f.type === 'Лічильник' ? Math.max(0,...table.rows.map(r => Number(r[f.name]) || 0))+1 : f.type === 'Логічний (Так/Ні)' ? false : null; });
    onChange([...table.rows,row]);
  };
  const updateCell = (rowIndex: number, field: Field, value: unknown) => {
    try {
      const normalized = validateCell(field.type,value);
      onChange(table.rows.map((r,i) => i === rowIndex ? {...r,[field.name]:normalized} : r));
    } catch (e) { window.alert(e instanceof Error ? e.message : 'Некоректне значення'); }
  };
  return <div className="table-view"><div className="view-toolbar"><button className={!design?'active-tool':''} onClick={onDesign}>Подання таблиці</button><button className={design?'active-tool':''} onClick={onDesign}>Конструктор</button><span className="toolbar-spacer"/><button onClick={addRow}><Plus size={15}/> Новий запис</button><span>{table.rows.length} записів</span></div>
    {design ? <div className="design-table"><div className="field-grid head"><span>Ім’я поля</span><span>Тип даних</span><span>Ключ</span><span>Опис</span></div>{table.fields.map(f => <div className="field-grid" key={f.name}><b>{f.name}</b><span>{f.type}</span><span>{f.primary ? <KeyRound size={15} color="#b17b16"/> : ''}</span><span>{f.description}</span></div>)}</div> :
    <div className="data-grid-wrap"><table className="data-grid"><thead><tr><th className="row-number">№</th>{table.fields.map(f=><th key={f.name}>{f.primary && <KeyRound size={12}/>} {f.name}</th>)}<th/></tr></thead><tbody>{table.rows.map((row,i)=><tr key={i}><td className="row-number">{i+1}</td>{table.fields.map(f=><td key={f.name}>{f.type === 'Логічний (Так/Ні)' ? <input type="checkbox" checked={Boolean(row[f.name])} onChange={e=>updateCell(i,f,e.target.checked)}/> : f.type === 'Лічильник' ? <span className="readonly-cell">{String(row[f.name] ?? '')}</span> : <input type={f.type === 'Число' || f.type === 'Грошовий' ? 'number' : f.type === 'Дата/час' ? 'date' : 'text'} value={String(row[f.name] ?? '')} onChange={e=>updateCell(i,f,e.target.value)}/>}</td>)}<td><button className="delete-row" onClick={()=>onChange(table.rows.filter((_,n)=>n!==i))}><Trash2 size={14}/></button></td></tr>)}</tbody></table>{!table.rows.length && <div className="empty-state">Таблиця поки не містить записів. Натисніть «Новий запис».</div>}</div>}
  </div>;
}

function QueryModal({ db, onClose, onSave }: { db: DbState; onClose: () => void; onSave: (q: QueryDef) => void }) {
  const [name,setName] = useState('Запит1'); const [table,setTable] = useState(db.tables[0]?.name ?? '');
  const [field,setField] = useState(db.tables[0]?.fields[0]?.name ?? ''); const [operator,setOperator] = useState('='); const [value,setValue] = useState(''); const [sort,setSort] = useState<'none'|'asc'|'desc'>('none');
  const selected = db.tables.find(t=>t.name===table);
  return <Modal title="Конструктор запитів" onClose={onClose}><div className="form-stack"><label>Назва запиту<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Таблиця<select value={table} onChange={e=>{setTable(e.target.value);setField(db.tables.find(t=>t.name===e.target.value)?.fields[0]?.name ?? '');}}>{db.tables.map(t=><option key={t.name}>{t.name}</option>)}</select></label><label>Поле для відбору<select value={field} onChange={e=>setField(e.target.value)}>{selected?.fields.map(f=><option key={f.name}>{f.name}</option>)}</select></label><div className="two-col"><label>Оператор<select value={operator} onChange={e=>setOperator(e.target.value)}>{['=','>','<','>=','<=','LIKE'].map(o=><option key={o}>{o}</option>)}</select></label><label>Критерій<input value={value} onChange={e=>setValue(e.target.value)} placeholder="Наприклад, 100 або Київ"/></label></div><label>Сортування<select value={sort} onChange={e=>setSort(e.target.value as typeof sort)}><option value="none">Без сортування</option><option value="asc">За зростанням</option><option value="desc">За спаданням</option></select></label><div className="sql-preview"><b>Попередній перегляд SQL</b><code>SELECT * FROM "{table}" WHERE "{field}" {operator} '{value}'{sort!=='none'?` ORDER BY "${field}" ${sort==='asc'?'ASC':'DESC'}`:''};</code></div><div className="modal-actions"><button className="secondary-btn" onClick={onClose}>Скасувати</button><button className="primary-btn" disabled={!selected} onClick={()=>onSave({name,table,field,operator,value,sort})}>Зберегти запит</button></div></div></Modal>;
}

function QueryView({ query, db }: { query?: QueryDef; db: DbState }) {
  const [sqlMode,setSqlMode] = useState(false);
  if (!query) return <p className="empty-state">Запит не знайдено.</p>;
  const table = db.tables.find(t=>t.name===query.table);
  const filtered = (table?.rows ?? []).filter(row => {
    const a = row[query.field]; const b = query.value;
    if (query.operator === 'LIKE') return String(a ?? '').toLowerCase().includes(b.replaceAll('%','').toLowerCase());
    const n1=Number(a),n2=Number(b); const numeric = b.trim()!=='' && Number.isFinite(n1) && Number.isFinite(n2);
    const left = numeric ? n1 : String(a ?? '').toLowerCase(); const right = numeric ? n2 : b.toLowerCase();
    switch(query.operator) { case '=': return left===right; case '>': return left>right; case '<': return left<right; case '>=': return left>=right; case '<=': return left<=right; default: return false; }
  }).sort((a,b)=>query.sort==='none'?0:String(a[query.field]??'').localeCompare(String(b[query.field]??''), 'uk', {numeric:true})*(query.sort==='desc'?-1:1));
  const sql = `SELECT * FROM "${query.table}" WHERE "${query.field}" ${query.operator} '${query.value}'${query.sort!=='none'?` ORDER BY "${query.field}" ${query.sort.toUpperCase()}`:''};`;
  return <div className="query-view"><div className="view-toolbar"><button className={!sqlMode?'active-tool':''} onClick={()=>setSqlMode(false)}>Режим таблиці</button><button className={sqlMode?'active-tool':''} onClick={()=>setSqlMode(true)}>Режим SQL</button><span className="toolbar-spacer"/><span>{filtered.length} результатів</span><button className="primary-btn small" onClick={()=>notifyQuery() }><Play size={14}/> Виконати</button></div>{sqlMode?<pre className="sql-editor">{sql}</pre>:<ResultTable rows={filtered} fields={table?.fields.map(f=>f.name) ?? []}/>}</div>;
  function notifyQuery(){ /* query execution is reflected by the live result grid */ }
}

function ResultTable({ rows, fields }: { rows: Record<string, unknown>[]; fields: string[] }) {
  return <div className="data-grid-wrap"><table className="data-grid"><thead><tr>{fields.map(f=><th key={f}>{f}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{fields.map(f=><td key={f}>{typeof r[f]==='boolean'?(r[f]?'Так':'Ні'):String(r[f]??'')}</td>)}</tr>)}</tbody></table>{!rows.length&&<div className="empty-state">За заданими умовами записів не знайдено.</div>}</div>;
}

function RelationModal({ db, onClose, onSave }: { db: DbState; onClose: () => void; onSave: (r: Relation) => void }) {
  const [from,setFrom]=useState(db.tables[0]?.name??''); const [to,setTo]=useState(db.tables[1]?.name??db.tables[0]?.name??'');
  const [fromField,setFromField]=useState(''); const [toField,setToField]=useState('');
  const parent=db.tables.find(t=>t.name===from); const child=db.tables.find(t=>t.name===to);
  const primary=parent?.fields.find(f=>f.primary);
  return <Modal title="Створення зв’язку" onClose={onClose}><div className="form-stack"><p>Зв’яжіть первинний ключ головної таблиці із зовнішнім ключем підпорядкованої таблиці.</p><label>Головна таблиця<select value={from} onChange={e=>{setFrom(e.target.value);setFromField('');}}>{db.tables.map(t=><option key={t.name}>{t.name}</option>)}</select></label><label>Первинний ключ<select value={fromField} onChange={e=>setFromField(e.target.value)}><option value="">Оберіть поле</option>{parent?.fields.filter(f=>f.primary).map(f=><option key={f.name}>{f.name}</option>)}</select></label><label>Підпорядкована таблиця<select value={to} onChange={e=>{setTo(e.target.value);setToField('');}}>{db.tables.map(t=><option key={t.name}>{t.name}</option>)}</select></label><label>Зовнішній ключ<select value={toField} onChange={e=>setToField(e.target.value)}><option value="">Оберіть поле</option>{child?.fields.filter(f=>f.type==='Число'||f.primary).map(f=><option key={f.name}>{f.name}</option>)}</select></label><div className="modal-actions"><button className="secondary-btn" onClick={onClose}>Скасувати</button><button className="primary-btn" disabled={!fromField||!toField||from===to||!primary} onClick={()=>onSave({id:uid(),fromTable:from,fromField,toTable:to,toField})}>Створити зв’язок</button></div></div></Modal>;
}

function RelationsView({ db, onAdd, onDelete }: { db: DbState; onAdd: () => void; onDelete: (id:string)=>void }) {
  return <div className="relations-view"><div className="view-toolbar"><span>Зв’язки між таблицями</span><span className="toolbar-spacer"/><button className="primary-btn small" onClick={onAdd}><Plus size={14}/> Додати зв’язок</button></div><div className="relation-canvas">{db.tables.map(t=><div className="relation-card" key={t.name}><h3><Table2 size={15}/>{t.name}</h3>{t.fields.map(f=><div className="relation-field" key={f.name}>{f.primary&&<KeyRound size={12}/>}<span>{f.name}</span><small>{f.type}</small></div>)}</div>)}</div><h3 className="section-label">Наявні зв’язки</h3>{db.relations.map(r=><div className="relation-item" key={r.id}><b>{r.fromTable}.{r.fromField}</b><span className="relation-line">1 ───────── ∞</span><b>{r.toTable}.{r.toField}</b><button className="delete-row" onClick={()=>onDelete(r.id)}><Trash2 size={14}/></button></div>)}{!db.relations.length&&<p className="empty-state">Зв’язків поки немає. Додайте зв’язок між первинним і зовнішнім ключами.</p>}</div>;
}

function FormView({ name, db, setDb, notify }: { name:string; db:DbState; setDb: (fn:(old:DbState)=>DbState)=>void; notify:(s:string)=>void }) {
  const table=db.tables.find(t=>name===`Форма_${t.name}`)||db.tables[0];
  const [index,setIndex]=useState(0);
  if(!table) return <p className="empty-state">Немає таблиці для форми.</p>;
  const row=table.rows[index]??{};
  const change=(field:Field,value:unknown)=>{try{const v=validateCell(field.type,value);setDb(old=>({...old,tables:old.tables.map(t=>t.name===table.name?{...t,rows:t.rows.map((r,i)=>i===index?{...r,[field.name]:v}:r)}:t)}));}catch(e){notify(e instanceof Error?e.message:'Помилка введення');}};
  const add=()=>{const r:Record<string,string|number|boolean|null>={};table.fields.forEach(f=>r[f.name]=f.type==='Лічильник'?Math.max(0,...table.rows.map(x=>Number(x[f.name])||0))+1:f.type==='Логічний (Так/Ні)'?false:null);setDb(old=>({...old,tables:old.tables.map(t=>t.name===table.name?{...t,rows:[...t.rows,r]}:t)}));setIndex(table.rows.length);};
  return <div className="form-view"><div className="record-card"><div className="record-heading"><h2>{name}</h2><span>{table.name}</span></div>{table.fields.map(f=><label className="record-field" key={f.name}><span>{f.name}{f.primary?' 🔑':''}</span>{f.type==='Логічний (Так/Ні)'?<input type="checkbox" checked={Boolean(row[f.name])} onChange={e=>change(f,e.target.checked)}/>:<input disabled={f.type==='Лічильник'} type={f.type==='Число'||f.type==='Грошовий'?'number':f.type==='Дата/час'?'date':'text'} value={String(row[f.name]??'')} onChange={e=>change(f,e.target.value)}/>}</label>)}<div className="record-nav"><button onClick={()=>setIndex(0)} disabled={!table.rows.length||index===0}><ChevronLeft/><ChevronLeft/></button><button onClick={()=>setIndex(Math.max(0,index-1))} disabled={index===0}><ChevronLeft/></button><span>Запис {table.rows.length?index+1:0} з {table.rows.length}</span><button onClick={()=>setIndex(Math.min(table.rows.length-1,index+1))} disabled={index>=table.rows.length-1}><ChevronRight/></button><button onClick={()=>setIndex(Math.max(0,table.rows.length-1))} disabled={!table.rows.length||index===table.rows.length-1}><ChevronRight/><ChevronRight/></button><button className="primary-btn small" onClick={add}><Plus size={14}/> Новий</button><button className="delete-row" onClick={()=>{if(table.rows.length){setDb(old=>({...old,tables:old.tables.map(t=>t.name===table.name?{...t,rows:t.rows.filter((_,i)=>i!==index)}:t)}));setIndex(Math.max(0,index-1));}}}><Trash2 size={15}/></button></div></div></div>;
}

function ReportView({ name, db }: { name:string; db:DbState }) {
  const table=db.tables.find(t=>name===`Звіт_${t.name}`)||db.tables[0];
  if(!table)return <p className="empty-state">Немає даних для звіту.</p>;
  const numeric=table.fields.filter(f=>f.type==='Число'||f.type==='Грошовий');
  return <div className="report-shell"><div className="view-toolbar no-print"><span>Попередній перегляд звіту</span><span className="toolbar-spacer"/><button className="primary-btn small" onClick={()=>window.print()}><Printer size={14}/> Друк / PDF</button></div><article className="paper"><div className="report-kicker">НАВЧАЛЬНИЙ СИМУЛЯТОР СКБД</div><h1>{name.replace('Звіт_','Звіт: ')}</h1><p>Дата формування: {new Date().toLocaleDateString('uk-UA')}</p><ResultTable rows={table.rows} fields={table.fields.map(f=>f.name)}/><div className="report-summary"><b>Кількість записів: {table.rows.length}</b>{numeric.map(f=><span key={f.name}>Сума поля «{f.name}»: {table.rows.reduce((s,r)=>s+Number(r[f.name]??0),0).toLocaleString('uk-UA')}</span>)}</div></article></div>;
}
