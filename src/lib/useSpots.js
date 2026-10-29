import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import { spotError } from "./plan";

const SAVE_DELAY_MS = 600;

// La tabla usa start_date / end_date ("end" es palabra reservada en SQL).
const fromRow = r => ({ id: r.id, brand: r.brand, name: r.name, start: r.start_date ?? "", end: r.end_date ?? "", note: r.note ?? "" });
const toRow = s => ({ brand: s.brand, name: s.name, start_date: s.start, end_date: s.end, note: s.note });

/**
 * Cuñas guardadas en Supabase. Los cambios se aplican al instante en pantalla
 * y se guardan en la base de datos al dejar de escribir (solo si las fechas son válidas).
 */
export function useSpots() {
  const [spots, setSpotsState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(0);
  const spotsRef = useRef([]);
  const timers = useRef(new Map());

  const setSpots = useCallback(fn => {
    spotsRef.current = typeof fn === "function" ? fn(spotsRef.current) : fn;
    setSpotsState(spotsRef.current);
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("spots").select("*").order("start_date");
    if (error) setError(error.message);
    else { setSpots(data.map(fromRow)); setError(null); }
    setLoading(false);
  }, [setSpots]);

  useEffect(() => { reload(); }, [reload]);

  const persist = useCallback(async id => {
    timers.current.delete(id);
    setPending(timers.current.size);
    const s = spotsRef.current.find(x => x.id === id);
    if (!s || spotError(s)) return;
    const { error } = await supabase.from("spots").update(toRow(s)).eq("id", id);
    if (error) setError(`No se pudo guardar: ${error.message}`);
  }, []);

  const updateSpot = useCallback((id, patch) => {
    setSpots(list => list.map(s => (s.id === id ? { ...s, ...patch } : s)));
    clearTimeout(timers.current.get(id));
    timers.current.set(id, setTimeout(() => persist(id), SAVE_DELAY_MS));
    setPending(timers.current.size);
  }, [persist, setSpots]);

  const addSpot = useCallback(async spot => {
    const { data, error } = await supabase.from("spots").insert(toRow(spot)).select().single();
    if (error) { setError(`No se pudo añadir: ${error.message}`); return null; }
    const added = fromRow(data);
    setSpots(list => [...list, added]);
    return added;
  }, [setSpots]);

  const deleteSpot = useCallback(async id => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setPending(timers.current.size);
    const { error } = await supabase.from("spots").delete().eq("id", id);
    if (error) { setError(`No se pudo eliminar: ${error.message}`); return; }
    setSpots(list => list.filter(s => s.id !== id));
  }, [setSpots]);

  /** Guarda ya los cambios pendientes (p. ej. antes de cerrar sesión). */
  const flush = useCallback(async () => {
    const ids = [...timers.current.keys()];
    ids.forEach(id => clearTimeout(timers.current.get(id)));
    await Promise.all(ids.map(persist));
  }, [persist]);

  // Avisa antes de cerrar la pestaña si quedan cambios sin guardar.
  useEffect(() => {
    const onBeforeUnload = e => { if (timers.current.size) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  return { spots, loading, error, saving: pending > 0, clearError: () => setError(null), reload, flush, updateSpot, addSpot, deleteSpot };
}
