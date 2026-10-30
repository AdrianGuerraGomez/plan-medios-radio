// ====== CONFIGURACIÓN: edita aquí marcas y colores ======
export const BRANDS = ["SEAT", "CUPRA", "CHANGAN", "EBRO", "ACFU"];

export const BRAND_COLORS = {
  SEAT: "#CF2738",
  CUPRA: "#7405A6",
  CHANGAN: "#63D48B",
  EBRO: "#0076FC",
  ACFU: "#FC9B00"
};
// =========================================================

export const FALLBACK_COLOR = "#6b6a65";
export const brandColor = brand => BRAND_COLORS[brand] || FALLBACK_COLOR;
