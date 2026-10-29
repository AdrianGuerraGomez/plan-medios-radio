// Lógica del plan, sin dependencias de React ni de Supabase.
// Las fechas se manejan como texto "YYYY-MM-DD" para evitar problemas de zona horaria.

const MONTHS_SHORT = ["ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "sept.", "oct.", "nov.", "dic."];
export const MONTHS_LONG = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const WEEKDAY_INITIALS = "DLMXJVS";

export const pad = n => String(n).padStart(2, "0");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** "YYYY-MM" del mes siguiente al actual. */
export function nextMonthKey(today = new Date()) {
  const d = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** Desplaza un "YYYY-MM" k meses. */
export function shiftMonthKey(ym, k) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + k, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** Datos del mes: año, mes (1-12), nº de días, primer y último día. */
export function monthInfo(ym) {
  const [y, m] = ym.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  return { y, m, days, first: `${y}-${pad(m)}-01`, last: `${y}-${pad(m)}-${pad(days)}` };
}

export const monthTitle = M => `${MONTHS_LONG[M.m - 1]} ${M.y}`;

const formatDay = d => `${d.slice(8)} ${MONTHS_SHORT[+d.slice(5, 7) - 1]}`;
const dayOf = d => +d.slice(8);

/** Devuelve un mensaje de error si la cuña tiene fechas inválidas, o null si está bien. */
export function spotError(s) {
  if (!DATE_RE.test(s.start || "") || !DATE_RE.test(s.end || "")) return "Faltan fechas";
  if (s.end < s.start) return "La fecha de fin es anterior a la de inicio";
  return null;
}

export const inMonth = (s, M) => !spotError(s) && s.start <= M.last && s.end >= M.first;

/** Primer y último día (1..n) que ocupa la cuña dentro del mes. */
export function spanInMonth(s, M) {
  return [s.start < M.first ? 1 : dayOf(s.start), s.end > M.last ? M.days : dayOf(s.end)];
}

export function periodLabel(s, M) {
  if (s.start <= M.first && s.end >= M.last) return "mes completo";
  return `del ${formatDay(s.start < M.first ? M.first : s.start)} al ${formatDay(s.end > M.last ? M.last : s.end)}`;
}

/** Reparte cuñas en carriles para que no se pisen. Devuelve { laneOf: Map(id → carril), count }. */
export function assignLanes(spots) {
  const lanes = [];
  const laneOf = new Map();
  [...spots].sort((a, b) => a.start.localeCompare(b.start)).forEach(s => {
    let i = lanes.findIndex(lane => lane[lane.length - 1].end < s.start);
    if (i < 0) { lanes.push([s]); i = lanes.length - 1; } else lanes[i].push(s);
    laneOf.set(s.id, i);
  });
  return { laneOf, count: lanes.length || 1 };
}

/** Tramos de días sin ninguna cuña, como pares [inicio, fin]. */
export function gaps(spots, M) {
  const covered = Array(M.days + 2).fill(false);
  spots.forEach(s => {
    const [a, b] = spanInMonth(s, M);
    for (let d = a; d <= b; d++) covered[d] = true;
  });
  const result = [];
  let start = 0;
  for (let d = 1; d <= M.days + 1; d++) {
    if (d <= M.days && !covered[d]) { if (!start) start = d; }
    else if (start) { result.push([start, d - 1]); start = 0; }
  }
  return result;
}

export const formatGaps = list => list.map(([a, z]) => (a === z ? `${a}` : `${a}–${z}`)).join(", ");

export const hasOverlap = spots =>
  spots.some(x => spots.some(y => x !== y && x.start <= y.end && y.start <= x.end));

export const isWeekend = (M, day) => {
  const w = new Date(M.y, M.m - 1, day).getDay();
  return w === 0 || w === 6;
};
