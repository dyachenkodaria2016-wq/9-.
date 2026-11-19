import { X } from 'lucide-react';
export function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><section className="modal">
    <div className="modal-head"><h2>{title}</h2><button onClick={onClose} aria-label="Закрити"><X size={18}/></button></div>{children}
  </section></div>;
}
