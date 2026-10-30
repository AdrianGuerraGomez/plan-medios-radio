import { monthInfo, monthTitle } from "./plan";

const dateTime = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** "30 oct, 10:15" */
export const formatDateTime = iso => dateTime.format(new Date(iso));

/** "2026-11" → "noviembre 2026" */
export const ymTitle = ym => monthTitle(monthInfo(ym));
