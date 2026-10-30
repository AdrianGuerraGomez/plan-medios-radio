import { useCallback, useRef, useState } from "react";
import { STATUSES, STATUS_ORDER } from "../lib/status";
import { useDismiss } from "../lib/useDismiss";

/** Estado del mes. Al pulsarlo se puede cambiar (queda registrado en los comentarios). */
export default function StatusBadge({ status, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useDismiss(ref, open, useCallback(() => setOpen(false), []));

  const choose = s => {
    setOpen(false);
    if (s !== status) onChange(s);
  };

  return (
    <div className="status-wrap" ref={ref}>
      <button
        className={`status status-${status}`}
        onClick={() => setOpen(o => !o)}
        title="Cambiar el estado del mes"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {STATUSES[status].label}<span className="caret no-print" aria-hidden>▾</span>
      </button>
      {open && (
        <div className="menu menu-left" role="menu">
          {STATUS_ORDER.map(s => (
            <button key={s} role="menuitemradio" aria-checked={s === status} className="status-option" onClick={() => choose(s)}>
              <i className={`dot status-dot status-${s}`} />{STATUSES[s].label}{s === status && " ✓"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
