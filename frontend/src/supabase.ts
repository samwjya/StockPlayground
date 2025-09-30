import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

let accessToken: string | null = null;

supabase.auth.onAuthStateChange((_event, session) => {
  accessToken = session?.access_token || null;
});

export function getAccessToken() {
  return accessToken;
}