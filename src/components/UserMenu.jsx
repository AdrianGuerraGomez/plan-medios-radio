import { useEffect, useRef, useState } from "react";

/** Dos primeras letras de la parte del correo antes de la @, en mayúsculas. */
const initials = email => (email.split("@")[0].replace(/[^a-z0-9]/gi, "").slice(0, 2) || "?").toUpperCase();

export default function UserMenu({ email, saving, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Cierra el menú al pulsar fuera o con Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = e => { if (!ref.current.contains(e.target)) setOpen(false); };
    const onKey = e => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const status = saving ? "Guardando…" : "Todo guardado";

  return (
    <div className="user-menu" ref={ref}>
      <button
        className={`avatar${saving ? " saving" : ""}`}
        onClick={() => setOpen(o => !o)}
        title={`${email} · ${status}`}
        aria-label={`Cuenta de ${email}. ${status}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {initials(email)}
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="menu-email">{email}</div>
          <div className={`menu-status${saving ? " is-saving" : ""}`}>{status}</div>
          <button role="menuitem" onClick={onSignOut}>Cerrar sesión</button>
        </div>
      )}
    </div>
  );
}
