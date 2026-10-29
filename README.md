# Plan de medios · Radio

App web (React + Vite) para planificar las cuñas de radio de cada marca por mes:
vista tipo Gantt, tabla editable, resumen y exportación a PDF. Los datos se guardan
en Supabase y hace falta iniciar sesión. Todo el equipo comparte el mismo plan.

La versión anterior (HTML + JS sin servidor, datos en el navegador) está en `legacy/`.

## Puesta en marcha

### 1. Crear el proyecto en Supabase

1. Crea una cuenta y un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**.
3. En **Authentication → Sign In / Providers**, desactiva **Allow new users to sign up**.
   Así nadie puede registrarse por su cuenta: solo entra quien invites.
4. En **Authentication → URL Configuration**, pon en **Site URL** la dirección de la app
   (`http://localhost:5173` mientras pruebas en local; luego, la URL de producción).
5. Invita a cada persona en **Authentication → Users → Invite user**. Recibirá un email,
   al abrirlo la app le pedirá que elija contraseña.

### 2. Configurar y arrancar la app

```bash
cp .env.example .env
```

Rellena `.env` con los valores de **Project Settings → API** (`Project URL` y la clave `anon` / `publishable`).
La clave `anon` es pública por diseño; la seguridad la ponen las políticas RLS del esquema.
**No uses nunca la clave `service_role`** en la app.

```bash
npm install
```

```bash
npm run dev
```

### 3. Publicar

`npm run build` genera la carpeta `dist/`, que se puede publicar en Vercel, Netlify o similar.
Configura allí las mismas variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`,
y añade la URL final en Supabase (Site URL / Redirect URLs).

## Marcas y colores

Se editan en [`src/config.js`](src/config.js).

## Estructura

- `src/lib/plan.js` — lógica del plan (meses, carriles, huecos, etiquetas). Sin dependencias.
- `src/lib/useSpots.js` — carga y guardado de cuñas en Supabase.
- `src/components/` — pantallas (login, plan) y piezas (Gantt, tabla, resumen).
- `supabase/schema.sql` — tabla `spots` y permisos.
