import { useState } from "react";
import { supabase } from "../lib/supabase";

const MESSAGES = {
  "Invalid login credentials": "Email o contraseña incorrectos.",
  "Email not confirmed": "Tienes que confirmar tu email antes de entrar."
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const signIn = async e => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage({ type: "error", text: MESSAGES[error.message] || error.message });
    setBusy(false);
  };

  const resetPassword = async () => {
    if (!email) { setMessage({ type: "error", text: "Escribe tu email y vuelve a pulsar." }); return; }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    setMessage(error
      ? { type: "error", text: error.message }
      : { type: "ok", text: "Te hemos enviado un email para cambiar la contraseña." });
    setBusy(false);
  };

  return (
    <div className="login">
      <form className="card" onSubmit={signIn}>
        <h1>Plan de medios · Radio</h1>
        <p className="muted">Inicia sesión para ver y editar el plan.</p>
        <label>Email
          <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label>Contraseña
          <input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        {message && <div className={message.type === "error" ? "warn small" : "ok small"}>{message.text}</div>}
        <button className="pri" type="submit" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
        <button type="button" className="link" onClick={resetPassword} disabled={busy}>He olvidado mi contraseña</button>
      </form>
    </div>
  );
}
