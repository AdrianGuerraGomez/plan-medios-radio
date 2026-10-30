import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { iconMoon, iconSun } from "../lib/icons";

const THEME_KEY = "planRadio.theme";
const systemTheme = () => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

function savedTheme() {
  try { return localStorage.getItem(THEME_KEY); } catch { return null; }
}

/** Botón para cambiar entre modo claro y oscuro. Sin elección guardada, sigue al sistema. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || systemTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Mientras el usuario no elija, acompaña los cambios del sistema.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => { if (!savedTheme()) setTheme(systemTheme()); };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* sin almacenamiento local */ }
  };

  const label = theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
  return (
    <button className="icon-btn" onClick={toggle} title={label} aria-label={label}>
      <FontAwesomeIcon icon={theme === "dark" ? iconSun : iconMoon} />
    </button>
  );
}
