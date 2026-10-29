import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && anonKey);

// Si se llega desde un email de invitación o de recuperación de contraseña, hay que pedir
// una contraseña nueva. Se lee antes de crear el cliente, porque este limpia la URL.
export const needsNewPassword = /type=(invite|recovery)/.test(window.location.hash);

// null si faltan las variables de entorno: la app muestra un aviso en lugar de romperse.
export const supabase = isConfigured ? createClient(url, anonKey) : null;
