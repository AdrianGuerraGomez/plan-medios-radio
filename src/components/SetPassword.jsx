import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function SetPassword({ onDone }) {
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const save = async e => {
    e.preventDefault();
    if (password.length < 8) { setError("Usa al menos 8 caracteres."); return; }
    if (password !== repeat) { setError("Las contraseñas no coinciden."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setError(error.message);
    else onDone();
  };

  return (
    <div className="login">
      <form className="card" onSubmit={save}>
        <h1>Elige tu contraseña</h1>
        <label>Nueva contraseña
          <input type="password" autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        <label>Repite la contraseña
          <input type="password" autoComplete="new-password" required value={repeat} onChange={e => setRepeat(e.target.value)} />
        </label>
        {error && <div className="warn small">{error}</div>}
        <button className="pri" type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar y entrar"}</button>
      </form>
    </div>
  );
}
