import { BRANDS } from "../config";
import { spotError } from "../lib/plan";

function SpotRow({ spot, onChange, onFullMonth, onDelete }) {
  const error = spotError(spot);
  // Si la marca ya no está en la configuración, se mantiene como opción para no cambiarla sin querer.
  const brands = BRANDS.includes(spot.brand) ? BRANDS : [...BRANDS, spot.brand];
  const field = f => ({ value: spot[f], onChange: e => onChange({ [f]: e.target.value }) });

  return (
    <tr className={error ? "invalid" : undefined} title={error || undefined}>
      <td style={{ width: 120 }}>
        <select aria-label="Marca" {...field("brand")}>
          {brands.map(b => <option key={b}>{b}</option>)}
        </select>
      </td>
      <td><input aria-label="Campaña / cuña" {...field("name")} /></td>
      <td style={{ width: 140 }}><input type="date" aria-label="Inicio" {...field("start")} /></td>
      <td style={{ width: 140 }}><input type="date" aria-label="Fin" {...field("end")} /></td>
      <td><input aria-label="Notas" {...field("note")} /></td>
      <td style={{ whiteSpace: "nowrap", width: 150 }}>
        <button onClick={onFullMonth} title="Todo el mes">Mes completo</button>{" "}
        <button onClick={onDelete} title="Eliminar" aria-label="Eliminar">✕</button>
      </td>
    </tr>
  );
}

export default function SpotsTable({ rows, onUpdate, onFullMonth, onDelete, onAdd }) {
  const invalid = rows.filter(spotError).length;

  return (
    <div className="card no-print">
      <h2>Datos del plan</h2>
      <div className="sc2">
        <table>
          <thead>
            <tr><th>Marca</th><th>Campaña / cuña</th><th>Inicio</th><th>Fin</th><th>Notas (oferta, locutor…)</th><th /></tr>
          </thead>
          <tbody>
            {rows.map(s => (
              <SpotRow
                key={s.id}
                spot={s}
                onChange={patch => onUpdate(s.id, patch)}
                onFullMonth={() => onFullMonth(s.id)}
                onDelete={() => onDelete(s)}
              />
            ))}
          </tbody>
        </table>
      </div>
      {invalid > 0 && (
        <div className="warn small">
          {invalid === 1 ? "Hay 1 cuña" : `Hay ${invalid} cuñas`} con fechas incompletas o al revés (en rojo). No se guardan hasta que se corrijan.
        </div>
      )}
      <div style={{ marginTop: 10 }}><button className="pri" onClick={onAdd}>+ Añadir cuña</button></div>
      <div className="hint">
        Cambio de oferta a mitad de mes: acorta la fecha de fin de la cuña actual y añade otra de la misma marca con las nuevas fechas.
        Para el PDF, en el diálogo de impresión elige «Guardar como PDF».
      </div>
    </div>
  );
}
