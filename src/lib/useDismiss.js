import { useEffect } from "react";

/** Cierra un desplegable al pulsar fuera de `ref` o con Escape. */
export function useDismiss(ref, open, close) {
  useEffect(() => {
    if (!open) return;
    const onClick = e => { if (!ref.current?.contains(e.target)) close(); };
    const onKey = e => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, open, close]);
}
