import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { DEFAULT_STATUS } from "./status";

// comments y profiles se relacionan de dos formas (autor y menciones): hay que indicar cuál usar.
const AUTHOR = "author:profiles!comments_author_id_fkey(email)";
const COMMENT_FIELDS = `id, ym, body, status_change, created_at, author_id, ${AUTHOR}, mentions:comment_mentions(user_id)`;

/** Comentarios y estado de un mes, actualizados en tiempo real, y cuántos son nuevos para el usuario. */
export function useMonthThread(ym, userId) {
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState(DEFAULT_STATUS);
  const [lastSeen, setLastSeen] = useState(undefined); // undefined = aún cargando, null = nunca abierto
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const [c, s] = await Promise.all([
      supabase.from("comments").select(COMMENT_FIELDS).eq("ym", ym).order("created_at"),
      supabase.from("month_status").select("status").eq("ym", ym).maybeSingle()
    ]);
    setLoading(false);
    if (c.error || s.error) { setError((c.error || s.error).message); return; }
    setComments(c.data);
    setStatus(s.data?.status || DEFAULT_STATUS);
    setError(null);
  }, [ym]);

  useEffect(() => {
    setLoading(true);
    setComments([]);
    setLastSeen(undefined);
    load();
    let current = true;
    supabase.from("month_reads").select("last_seen_at").eq("ym", ym).eq("user_id", userId).maybeSingle()
      .then(({ data }) => { if (current) setLastSeen(data?.last_seen_at ?? null); });
    const channel = supabase
      .channel(`mes-${ym}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: `ym=eq.${ym}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "month_status", filter: `ym=eq.${ym}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "comment_mentions" }, load)
      .subscribe();
    return () => { current = false; supabase.removeChannel(channel); };
  }, [ym, userId, load]);

  // Nuevos = comentarios de otras personas posteriores a lo último que vi en este mes.
  const seenTime = lastSeen ? Date.parse(lastSeen) : 0;
  const unread = lastSeen === undefined ? 0
    : comments.filter(c => c.author_id !== userId && Date.parse(c.created_at) > seenTime).length;

  /** Marca como vistos los comentarios del mes (hasta el último cargado). */
  const markSeen = useCallback(async () => {
    const latest = comments.at(-1)?.created_at;
    if (lastSeen === undefined || !latest || (lastSeen && Date.parse(latest) <= Date.parse(lastSeen))) return;
    setLastSeen(latest);
    await supabase.from("month_reads").upsert({ user_id: userId, ym, last_seen_at: latest });
  }, [comments, lastSeen, userId, ym]);

  /** Publica un comentario. `status` es opcional: si se indica, cambia el estado del mes. */
  const post = useCallback(async ({ body, mentions = [], status = null }) => {
    const { error } = await supabase.rpc("post_comment", { p_ym: ym, p_body: body, p_mentions: mentions, p_status: status });
    if (error) { setError(`No se pudo publicar: ${error.message}`); return false; }
    await load();
    return true;
  }, [ym, load]);

  return { comments, status, unread, loading, error, post, markSeen };
}
