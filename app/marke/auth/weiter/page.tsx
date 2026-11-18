"use client";

// Rückfall für die Standard-Mailvorlage von Supabase: dort stehen die Tokens
// im #-Teil der URL (#access_token=…&refresh_token=…), den nur der Browser
// sieht. Die Seite übernimmt sie als Session-Cookie und geht weiter zu /marke.
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function Weiter() {
  const [fehler, setFehler] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    if (!access_token || !refresh_token) {
      window.location.replace("/marke/login?fehler=1");
      return;
    }
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    sb.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      if (error) setFehler(true);
      else window.location.replace("/marke");
    });
  }, []);

  return (
    <section className="mp-login mp-karte">
      <p>{fehler ? "Der Link hat nicht funktioniert. Bitte fordere auf der Anmeldeseite einen neuen an." : "Du wirst angemeldet …"}</p>
    </section>
  );
}
