import { useEffect, useMemo, useState } from "react";
import { BRANDS } from "../config";
import { inMonth, monthInfo, monthTitle, nextMonthKey, shiftMonthKey, spotError } from "../lib/plan";
import { useSpots } from "../lib/useSpots";
import { useMonthThread } from "../lib/useMonthThread";
import { useNotifications } from "../lib/useNotifications";
import { useProfiles } from "../lib/useProfiles";
import CommentsPanel from "./CommentsPanel";
import Gantt from "./Gantt";
import NotificationsBell from "./NotificationsBell";
import SpotsTable from "./SpotsTable";
import StatusBadge from "./StatusBadge";
import UserMenu from "./UserMenu";

const MONTH_KEY = "planRadio.month";
const PANEL_KEY = "planRadio.commentsOpen";

function initialMonth() {
  try { return localStorage.getItem(MONTH_KEY) || nextMonthKey(); } catch { return nextMonthKey(); }
}

// El panel de comentarios empieza abierto en pantallas anchas, salvo que se haya cerrado antes.
function initialPanelOpen() {
  try {
    const saved = localStorage.getItem(PANEL_KEY);
    if (saved !== null) return saved === "1";
  } catch { /* sin almacenamiento local */ }
  return window.innerWidth >= 1100;
}

export default function PlanPage({ user, onSignOut }) {
  const { spots, loading, error, saving, clearError, reload, flush, updateSpot, addSpot, deleteSpot } = useSpots();
  const [ym, setYm] = useState(initialMonth);
  const M = useMemo(() => monthInfo(ym), [ym]);

  const profiles = useProfiles();
  const thread = useMonthThread(ym, user.id);
  const notifications = useNotifications(user.id);
  const [panelOpen, setPanelOpen] = useState(initialPanelOpen);

  useEffect(() => {
    try { localStorage.setItem(PANEL_KEY, panelOpen ? "1" : "0"); } catch { /* sin almacenamiento local */ }
  }, [panelOpen]);

  // Con el panel abierto, los avisos de este mes se dan por leídos.
  const { markRead } = thread;
  const reloadNotifications = notifications.reload;
  useEffect(() => {
    if (panelOpen) markRead().then(changed => changed && reloadNotifications());
  }, [panelOpen, markRead, reloadNotifications]);

  const openMonthComments = target => { setYm(target); setPanelOpen(true); };

  // Filas de la tabla: se fijan al cambiar de mes o al cargar, para que una cuña no
  // desaparezca de la tabla mientras se le cambian las fechas. Las inválidas siempre se ven.
  const [rowIds, setRowIds] = useState(new Set());
  useEffect(() => {
    setRowIds(new Set(spots.filter(s => inMonth(s, M) || spotError(s)).map(s => s.id)));
  }, [ym, loading]); // a propósito no depende de `spots`

  const rows = spots
    .filter(s => rowIds.has(s.id) || spotError(s))
    .sort((a, b) => BRANDS.indexOf(a.brand) - BRANDS.indexOf(b.brand) || a.start.localeCompare(b.start));

  useEffect(() => {
    document.title = `Plan de medios Radio ${monthTitle(M)}`; // nombre sugerido del PDF
    try { localStorage.setItem(MONTH_KEY, ym); } catch { /* sin almacenamiento local */ }
  }, [M, ym]);

  const handleAdd = async () => {
    const added = await addSpot({ brand: BRANDS[0], name: "Nueva campaña", start: M.first, end: M.last, note: "" });
    if (added) setRowIds(ids => new Set(ids).add(added.id));
  };

  const handleDelete = s => {
    if (window.confirm(`¿Eliminar la cuña «${s.name}» de ${s.brand}?`)) deleteSpot(s.id);
  };

  const handleSignOut = async () => {
    await flush();
    onSignOut();
  };

  return (
    <div className={`layout${panelOpen ? " with-panel" : ""}`}>
      <main>
        <div className="top">
          <div className="title">
            <h1>Radio — {monthTitle(M)}</h1>
            <StatusBadge status={thread.status} onChange={s => thread.post({ body: "", status: s })} />
          </div>
          <div className="nav">
            <button onClick={() => setYm(shiftMonthKey(ym, -1))} title="Mes anterior" aria-label="Mes anterior">‹</button>
            <input type="month" value={ym} onChange={e => e.target.value && setYm(e.target.value)} aria-label="Mes" />
            <button onClick={() => setYm(shiftMonthKey(ym, 1))} title="Mes siguiente" aria-label="Mes siguiente">›</button>
            <button className="pri" onClick={() => window.print()}>🖨 Imprimir / Guardar PDF</button>
            <button
              className={`icon-btn${panelOpen ? " active" : ""}`}
              onClick={() => setPanelOpen(o => !o)}
              title={panelOpen ? "Ocultar comentarios" : "Ver comentarios"}
              aria-label={`Comentarios del mes (${thread.comments.length})`}
              aria-pressed={panelOpen}
            >
              💬{thread.comments.length > 0 && <span className="count neutral">{thread.comments.length}</span>}
            </button>
            <NotificationsBell items={notifications.items} onOpen={openMonthComments} onMarkAllRead={notifications.markAllRead} />
            <UserMenu email={user.email} saving={saving} onSignOut={handleSignOut} />
          </div>
        </div>

        {error && (
          <div className="alert no-print">
            {error} <button onClick={() => { clearError(); reload(); }}>Reintentar</button>
          </div>
        )}

        {loading ? (
          <div className="card hint">Cargando plan…</div>
        ) : (
          <>
            <Gantt spots={spots} M={M} />
            <SpotsTable
              rows={rows}
              onUpdate={updateSpot}
              onFullMonth={id => updateSpot(id, { start: M.first, end: M.last })}
              onDelete={handleDelete}
              onAdd={handleAdd}
            />
          </>
        )}
      </main>

      {panelOpen && (
        <CommentsPanel ym={ym} me={user.id} profiles={profiles} thread={thread} onClose={() => setPanelOpen(false)} />
      )}
    </div>
  );
}
