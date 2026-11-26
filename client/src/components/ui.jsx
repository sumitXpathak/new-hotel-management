import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { initials } from '../lib';

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef();
  const notify = useCallback((text, type = 'ok') => {
    clearTimeout(timer.current);
    setToast({ text, type });
    timer.current = setTimeout(() => setToast(null), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={notify}>
      {children}
      {toast && <div className={`toast ${toast.type}`} role="status">{toast.text}</div>}
    </ToastCtx.Provider>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const Pill = ({ kind, children }) => <span className={`pill ${kind}`}>{children}</span>;
export const Avatar = ({ name }) => <span className="avatar">{initials(name)}</span>;
export const Empty = ({ children }) => <div className="empty">{children}</div>;
export const Field = ({ label, children }) => (
  <label className="field"><span>{label}</span>{children}</label>
);
