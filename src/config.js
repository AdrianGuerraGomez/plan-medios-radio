// ====== CONFIGURACIÓN: edita aquí marcas y colores ======
export const BRANDS = ["SEAT", "CUPRA", "CHANGAN", "EBRO", "ACFU"];

export const BRAND_COLORS = {
  SEAT: "#c4392f",
  CUPRA: "#a8672a",
  CHANGAN: "#2b6cb0",
  EBRO: "#2f855a",
  ACFU: "#7b5ea7"
};
// =========================================================

export const FALLBACK_COLOR = "#6b6a65";
export const brandColor = brand => BRAND_COLORS[brand] || FALLBACK_COLOR;
