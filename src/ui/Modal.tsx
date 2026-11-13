import { useEffect, useRef, type ReactNode } from 'react';
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="imperial-dialog" aria-labelledby="dialog-title" onClose={onClose} onCancel={onClose}>
    <div className="panel-heading"><h2 id="dialog-title">{title}</h2><button onClick={onClose} aria-label="Đóng cửa sổ">×</button></div>{children}
  </dialog>;
}
