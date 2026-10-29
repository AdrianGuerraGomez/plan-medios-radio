// ====== CONFIGURACIÓN: edita aquí marcas y colores ======
const BR = ["SEAT", "CUPRA", "CHANGAN", "EBRO", "ACFU"];
const COL = { SEAT: "#c4392f", CUPRA: "#a8672a", CHANGAN: "#2b6cb0", EBRO: "#2f855a", ACFU: "#7b5ea7" };
// =========================================================
const MS = ["ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "sept.", "oct.", "nov.", "dic."];
const MN = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const KEY = "planRadioV1";
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, "0");
const esc = t => String(t || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const now = new Date(), nx = new Date(now.getFullYear(), now.getMonth() + 1, 1);
let S = { ym: `${nx.getFullYear()}-${pad(nx.getMonth() + 1)}`, spots: [] }, uid = 1;

let saved = null;
try { saved = localStorage.getItem(KEY); } catch (e) {}
if (saved) { try { S = JSON.parse(saved); uid = Math.max(0, ...S.spots.map(s => s.id)) + 1; } catch (e) {} }
else {
  const M = month();
  S.spots = [
    ["SEAT", "Campaña Arona", M.first, M.last, ""],
    ["CUPRA", "Campaña Tavascan", M.first, `${M.y}-${pad(M.m)}-15`, ""],
    ["CUPRA", "Campaña Formentor", `${M.y}-${pad(M.m)}-16`, M.last, "Cambio de oferta"],
    ["CHANGAN", "Campaña por definir", M.first, M.last, ""],
    ["EBRO", "Campaña por definir", M.first, M.last, ""],
    ["ACFU", "Campaña por definir", M.first, M.last, ""]
  ].map(([brand, name, start, end, note]) => ({ id: uid++, brand, name, start, end, note }));
}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

function month() {
  const [y, m] = S.ym.split("-").map(Number), n = new Date(y, m, 0).getDate();
  return { y, m, n, first: `${y}-${pad(m)}-01`, last: `${y}-${pad(m)}-${pad(n)}` };
}
const fd = d => `${d.slice(8)} ${MS[+d.slice(5, 7) - 1]}`;
const dn = d => +d.slice(8);
const inMonth = s => { const M = month(); return s.start && s.end && s.start <= M.last && s.end >= M.first; };
const label = s => {
  const M = month();
  if (s.start <= M.first && s.end >= M.last) return "mes completo";
  return `del ${fd(s.start < M.first ? M.first : s.start)} al ${fd(s.end > M.last ? M.last : s.end)}`;
};

function lanes(list) {
  const L = [];
  list.slice().sort((a, b) => a.start.localeCompare(b.start)).forEach(s => {
    let i = L.findIndex(l => l[l.length - 1].end < s.start);
    if (i < 0) { L.push([s]); i = L.length - 1; } else L[i].push(s);
    s._l = i;
  });
  return L.length || 1;
}
function gaps(list) {
  const M = month(), cov = Array(M.n + 2).fill(0);
  list.forEach(s => {
    const a = s.start < M.first ? 1 : dn(s.start), b = s.end > M.last ? M.n : dn(s.end);
    for (let d = a; d <= b; d++) cov[d]++;
  });
  const g = []; let st = 0;
  for (let d = 1; d <= M.n + 1; d++) {
    if (d <= M.n && !cov[d]) { if (!st) st = d; } else if (st) { g.push([st, d - 1]); st = 0; }
  }
  return g;
}

function drawGantt() {
  const M = month(), pc = 100 / M.n;
  const dayCells = pad0 => { let h = ""; for (let d = 1; d <= M.n; d++) { const w = new Date(M.y, M.m - 1, d).getDay(); h += `<div class="d ${w == 0 || w == 6 ? "w" : ""}" ${pad0 ? 'style="padding:0"' : ""}>${pad0 ? "" : d + "<br>" + "DLMXJVS"[w]}</div>`; } return h; };
  let h = `<div class="gr hd"><div class="gl"></div><div class="gb"><div class="days">${dayCells(false)}</div></div></div>`;
  BR.forEach(b => {
    const list = S.spots.filter(s => s.brand === b && inMonth(s)), nl = lanes(list), gp = gaps(list);
    const gt = gp.map(([a, z]) => a === z ? a : `${a}–${z}`).join(", ");
    const solap = list.some(x => list.some(y => x !== y && x.start <= y.end && y.start <= x.end));
    h += `<div class="gr"><div class="gl">${b}${gp.length ? `<small>Sin cuña: ${gt}</small>` : ""}${solap ? `<small>Cuñas solapadas</small>` : ""}</div>
      <div class="gb" style="height:${nl * 28 + 6}px"><div class="days" style="position:absolute;inset:0">${dayCells(true)}</div>`;
    gp.forEach(([a, z]) => h += `<div class="gap" style="left:${(a - 1) * pc}%;width:${(z - a + 1) * pc}%"></div>`);
    list.forEach(s => {
      const a = s.start < M.first ? 1 : dn(s.start), z = s.end > M.last ? M.n : dn(s.end);
      h += `<div class="bar" title="${esc(s.name)} · ${label(s)}" style="background:${COL[b]};left:calc(${(a - 1) * pc}% + 1px);width:calc(${(z - a + 1) * pc}% - 2px);top:${s._l * 28 + 3}px">${esc(s.name)}</div>`;
    });
    h += `</div></div>`;
  });
  $("gantt").innerHTML = h;
  $("lg").innerHTML = BR.map(b => `<span><i class="dot" style="background:${COL[b]}"></i>${b}</span>`).join("") +
    `<span><i class="dot" style="background:var(--gap);border:1px solid var(--gapt)"></i>Días sin cuña</span>`;
}

function drawSum() {
  const rows = [];
  BR.forEach(b => S.spots.filter(s => s.brand === b && inMonth(s)).sort((x, y) => x.start.localeCompare(y.start)).forEach(s =>
    rows.push(`<div><b style="color:${COL[b]}">${b}</b> – ${esc(s.name)} (${label(s)})${s.note ? ` <span style="color:var(--mu)">· ${esc(s.note)}</span>` : ""}</div>`)));
  const miss = BR.filter(b => !S.spots.some(s => s.brand === b && inMonth(s)));
  $("sum").innerHTML = (rows.join("") || `<div class="hint">No hay cuñas este mes.</div>`) +
    miss.map(b => `<div class="warn"><b>${b}</b> – sin cuña asignada este mes</div>`).join("");
}

function refresh() {
  const M = month();
  $("pt").textContent = `Plan de medios · Radio — ${MN[M.m - 1]} ${M.y}`;
  document.title = `Plan de medios Radio ${MN[M.m - 1]} ${M.y}`; // nombre sugerido del PDF
  drawGantt(); drawSum(); save();
}

function drawTable() {
  const rows = S.spots.filter(inMonth).sort((a, b) => BR.indexOf(a.brand) - BR.indexOf(b.brand) || a.start.localeCompare(b.start));
  $("tb").innerHTML = rows.map(s => `<tr data-id="${s.id}">
    <td style="width:120px"><select data-f="brand">${BR.map(b => `<option ${b === s.brand ? "selected" : ""}>${b}</option>`).join("")}</select></td>
    <td><input data-f="name" value="${esc(s.name)}"></td>
    <td style="width:140px"><input type="date" data-f="start" value="${s.start}"></td>
    <td style="width:140px"><input type="date" data-f="end" value="${s.end}"></td>
    <td><input data-f="note" value="${esc(s.note)}"></td>
    <td style="white-space:nowrap;width:150px"><button data-a="full" title="Todo el mes">Mes completo</button> <button data-a="del" title="Eliminar">✕</button></td></tr>`).join("");
}

$("tb").addEventListener("input", e => {
  const tr = e.target.closest("tr"), f = e.target.dataset.f;
  if (!tr || !f) return;
  S.spots.find(x => x.id == tr.dataset.id)[f] = e.target.value;
  refresh();
});
$("tb").addEventListener("click", e => {
  const a = e.target.dataset.a, tr = e.target.closest("tr");
  if (!a) return;
  const s = S.spots.find(x => x.id == tr.dataset.id), M = month();
  if (a === "del") S.spots = S.spots.filter(x => x !== s);
  if (a === "full") { s.start = M.first; s.end = M.last; }
  drawTable(); refresh();
});
$("add").onclick = () => {
  const M = month();
  S.spots.push({ id: uid++, brand: BR[0], name: "Nueva campaña", start: M.first, end: M.last, note: "" });
  drawTable(); refresh();
};
const setM = v => { S.ym = v; $("mo").value = v; drawTable(); refresh(); };
const shift = k => { const M = month(), d = new Date(M.y, M.m - 1 + k, 1); setM(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`); };
$("pv").onclick = () => shift(-1);
$("nx").onclick = () => shift(1);
$("mo").onchange = e => e.target.value && setM(e.target.value);
$("pr").onclick = () => window.print();

$("mo").value = S.ym; drawTable(); refresh();
