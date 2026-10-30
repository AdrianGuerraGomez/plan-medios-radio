import { useEffect, useState } from "react";
import { supabase } from "./supabase";

/** Personas del equipo (las invitadas a la app), para elegir a quién avisar. */
export function useProfiles() {
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    supabase.from("profiles").select("id, email").order("email")
      .then(({ data }) => { if (data) setProfiles(data); });
  }, []);

  return profiles;
}
