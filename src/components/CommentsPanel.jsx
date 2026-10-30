import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { iconClose } from "../lib/icons";
import { formatDateTime, ymTitle } from "../lib/format";
import { STATUSES, STATUS_ORDER } from "../lib/status";

function Comment({ comment, me, emailOf }) {
  const mine = comment.author_id === me;
  const mentionsMe = comment.mentions.some(m => m.user_id === me);
  const to = comment.mentions.map(m => emailOf(m.user_id)).filter(Boolean);

  return (
    <li className={`comment${mentionsMe ? " for-me" : ""}`}>
      <div className="comment-head">
        <b>{mine ? "Tú" : comment.author?.email}</b>
        <span className="muted">{formatDateTime(comment.created_at)}</span>
      </div>
      {comment.status_change && (
        <div className="comment-status">
          Cambió el estado a <span className={`status status-${comment.status_change} small-pill`}>{STATUSES[comment.status_change].label}</span>
        </div>
      )}
      {comment.body && <div className="comment-body">{comment.body}</div>}
      {to.length > 0 && <div className="comment-to muted">Para: {to.join(", ")}</div>}
    </li>
  );
}

function Composer({ profiles, me, status, onPost }) {
  const [body, setBody] = useState("");
  const [mentions, setMentions] = useState([]);
  const [newStatus, setNewStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const others = profiles.filter(p => p.id !== me);
  const available = others.filter(p => !mentions.includes(p.id));
  const emailOf = id => profiles.find(p => p.id === id)?.email;
  const canSend = !busy && (body.trim() || newStatus);

  const send = async e => {
    e?.preventDefault();
    if (!canSend) return;
    setBusy(true);
    const ok = await onPost({ body, mentions, status: newStatus || null });
    setBusy(false);
    if (ok) { setBody(""); setMentions([]); setNewStatus(""); }
  };

  return (
    <form className="composer" onSubmit={send}>
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(e); }}
        placeholder="Escribe un comentario…"
        rows={3}
        aria-label="Comentario"
      />
      <div className="composer-row">
        <span className="muted small-label">Avisar a</span>
        {mentions.map(id => (
          <span key={id} className="chip">
            {emailOf(id)}
            <button type="button" onClick={() => setMentions(m => m.filter(x => x !== id))} aria-label={`Quitar a ${emailOf(id)}`}><FontAwesomeIcon icon={iconClose} /></button>
          </span>
        ))}
        {available.length > 0 && (
          <select value="" onChange={e => e.target.value && setMentions(m => [...m, e.target.value])} aria-label="Añadir persona a avisar">
            <option value="">+ Añadir…</option>
            {available.map(p => <option key={p.id} value={p.id}>{p.email}</option>)}
          </select>
        )}
        {others.length === 0 && <span className="muted small-label">(no hay más personas invitadas)</span>}
      </div>
      <div className="composer-row">
        <label className="muted small-label" htmlFor="new-status">Estado del mes</label>
        <select id="new-status" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
          <option value="">Sin cambios ({STATUSES[status].label})</option>
          {STATUS_ORDER.filter(s => s !== status).map(s => <option key={s} value={s}>Pasar a «{STATUSES[s].label}»</option>)}
        </select>
      </div>
      <div className="composer-row end">
        <span className="muted small-label">⌘/Ctrl + Enter</span>
        <button className="pri" type="submit" disabled={!canSend}>{busy ? "Publicando…" : "Comentar"}</button>
      </div>
    </form>
  );
}

export default function CommentsPanel({ ym, me, profiles, thread, onClose }) {
  const { comments, status, loading, error, post } = thread;
  const listRef = useRef(null);
  const emailOf = id => profiles.find(p => p.id === id)?.email;

  // Baja al último comentario al abrir el mes o cuando llega uno nuevo.
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [comments.length, ym]);

  return (
    <aside className="side no-print" aria-label="Comentarios del mes">
      <div className="side-head">
        <h2>Comentarios · {ymTitle(ym)}</h2>
        <button className="icon-btn" onClick={onClose} title="Cerrar comentarios" aria-label="Cerrar comentarios"><FontAwesomeIcon icon={iconClose} /></button>
      </div>
      {error && <div className="warn small">{error}</div>}
      <ul className="comments" ref={listRef}>
        {loading && <li className="hint">Cargando…</li>}
        {!loading && comments.length === 0 && <li className="hint">Aún no hay comentarios este mes.</li>}
        {comments.map(c => <Comment key={c.id} comment={c} me={me} emailOf={emailOf} />)}
      </ul>
      <Composer profiles={profiles} me={me} status={status} onPost={post} />
    </aside>
  );
}
