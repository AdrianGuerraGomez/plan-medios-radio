import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { DEFAULT_STATUS } from "./status";

// comments y profiles se relacionan de dos formas (autor y menciones): hay que indicar cuál usar.
export const AUTHOR = "author:profiles!comments_author_id_fkey(email)";
const COMMENT_FIELDS = `id, ym, body, status_change, created_at, author_id, ${AUTHOR}, mentions:comment_mentions(user_id, read_at)`;

/** Comentarios y estado de un mes, actualizados en tiempo real. */
export function useMonthThread(ym, userId) {
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState(DEFAULT_STATUS);
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
    load();
    const channel = supabase
      .channel(`mes-${ym}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: `ym=eq.${ym}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "month_status", filter: `ym=eq.${ym}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "comment_mentions" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ym, load]);

  /** Publica un comentario. `status` es opcional: si se indica, cambia el estado del mes. */
  const post = useCallback(async ({ body, mentions = [], status = null }) => {
    const { error } = await supabase.rpc("post_comment", { p_ym: ym, p_body: body, p_mentions: mentions, p_status: status });
    if (error) { setError(`No se pudo publicar: ${error.message}`); return false; }
    await load();
    return true;
  }, [ym, load]);

  /** Marca como leídos mis avisos de este mes. */
  const markRead = useCallback(async () => {
    const ids = comments.filter(c => c.mentions.some(m => m.user_id === userId && !m.read_at)).map(c => c.id);
    if (!ids.length) return false;
    await supabase.from("comment_mentions").update({ read_at: new Date().toISOString() })
      .eq("user_id", userId).is("read_at", null).in("comment_id", ids);
    return true;
  }, [comments, userId]);

  return { comments, status, loading, error, post, markRead };
}
