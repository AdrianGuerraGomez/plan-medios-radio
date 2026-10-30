import { useCallback, useRef, useState } from "react";
import { formatDateTime, ymTitle } from "../lib/format";
import { STATUSES } from "../lib/status";
import { useDismiss } from "../lib/useDismiss";

/** Campana con las menciones sin leer. Al pulsar una, abre los comentarios de ese mes. */
export default function NotificationsBell({ items, onOpen, onMarkAllRead }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useDismiss(ref, open, useCallback(() => setOpen(false), []));
  const count = items.length;
  const label = count === 0 ? "Sin avisos" : count === 1 ? "1 aviso sin leer" : `${count} avisos sin leer`;

  return (
    <div className="bell-wrap" ref={ref}>
      <button
        className="icon-btn"
        onClick={() => setOpen(o => !o)}
        title={label}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        🔔{count > 0 && <span className="count">{count > 9 ? "9+" : count}</span>}
      </button>
      {open && (
        <div className="menu notif-menu" role="menu">
          <div className="menu-head">
            <b>Avisos</b>
            {count > 0 && <button className="link" onClick={() => { onMarkAllRead(); setOpen(false); }}>Marcar todo como leído</button>}
          </div>
          {count === 0 && <div className="hint">No tienes avisos pendientes.</div>}
          {items.map(c => (
            <button key={c.id} role="menuitem" className="notif" onClick={() => { onOpen(c.ym); setOpen(false); }}>
              <span className="notif-meta">
                <b>{c.author?.email}</b> te ha mencionado · {ymTitle(c.ym)}
              </span>
              {c.status_change && <span className={`status status-${c.status_change} small-pill`}>{STATUSES[c.status_change].label}</span>}
              {c.body && <span className="notif-body">{c.body}</span>}
              <span className="notif-time">{formatDateTime(c.created_at)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
