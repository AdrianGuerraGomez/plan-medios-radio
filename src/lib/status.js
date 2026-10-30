// Estados por los que pasa el plan de cada mes (deben coincidir con los de la base de datos).
export const STATUSES = {
  draft: { label: "Borrador" },
  review: { label: "Pendiente de revisión" },
  approved: { label: "Aprobado" }
};

export const STATUS_ORDER = ["draft", "review", "approved"];
export const DEFAULT_STATUS = "draft";
