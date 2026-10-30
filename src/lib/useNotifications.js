import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { AUTHOR } from "./useMonthThread";

/** Menciones sin leer del usuario, en todos los meses, actualizadas en tiempo real. */
export function useNotifications(userId) {
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("comment_mentions")
      .select(`comment_id, comment:comments(id, ym, body, status_change, created_at, ${AUTHOR})`)
      .eq("user_id", userId)
      .is("read_at", null);
    if (error) return;
    setItems(data.map(d => d.comment).filter(Boolean).sort((a, b) => b.created_at.localeCompare(a.created_at)));
  }, [userId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`avisos-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comment_mentions", filter: `user_id=eq.${userId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, load]);

  const markAllRead = useCallback(async () => {
    await supabase.from("comment_mentions").update({ read_at: new Date().toISOString() })
      .eq("user_id", userId).is("read_at", null);
    load();
  }, [userId, load]);

  return { items, reload: load, markAllRead };
}
