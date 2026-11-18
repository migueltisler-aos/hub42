// Supabase-Client mit Login-Session der Marke (Cookies), nur für Auth.
//
// Daten liest das Portal NICHT über diesen Client, sondern über
// getSupabaseAdmin() + Filter auf die eigene brand_id (lib/marke.ts). Der
// Session-Client beantwortet nur eine Frage: wer ist eingeloggt.
import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getSupabaseMarke() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (liste) => {
        // In Server Components ist Setzen verboten; dort frischt proxy.ts die Session auf.
        try {
          for (const { name, value, options } of liste) store.set(name, value, options);
        } catch {}
      },
    },
  });
}
