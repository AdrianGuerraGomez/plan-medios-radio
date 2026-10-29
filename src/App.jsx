import { useEffect, useState } from "react";
import { isConfigured, needsNewPassword, supabase } from "./lib/supabase";
import Login from "./components/Login";
import PlanPage from "./components/PlanPage";
import SetPassword from "./components/SetPassword";

function NotConfigured() {
  return (
    <div className="login">
      <div className="card">
        <h1>Falta configurar Supabase</h1>
        <p>Copia <code>.env.example</code> a <code>.env</code>, rellena la URL y la clave <i>anon</i> de tu proyecto y reinicia <code>npm run dev</code>.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = comprobando
  const [settingPassword, setSettingPassword] = useState(needsNewPassword);

  useEffect(() => {
    if (!isConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setSettingPassword(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!isConfigured) return <NotConfigured />;
  if (session === undefined) return <div className="login hint">Cargando…</div>;
  if (!session) return <Login />;
  if (settingPassword) return <SetPassword onDone={() => setSettingPassword(false)} />;
  return <PlanPage user={session.user} onSignOut={() => supabase.auth.signOut()} />;
}
