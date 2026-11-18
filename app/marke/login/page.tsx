import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { aktuelleMarke } from "@/lib/marke";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Anmelden" };

export default async function MarkeLogin({ searchParams }: { searchParams: Promise<{ fehler?: string }> }) {
  if (await aktuelleMarke()) redirect("/marke");
  const { fehler } = await searchParams;
  return (
    <section className="mp-login mp-karte" aria-labelledby="login-titel">
      <h1 id="login-titel" className="mp-h1">Anmelden</h1>
      <p>
        Hier siehst du Abverkauf, Bestand und Auszahlung deiner Marke im Testkaufhaus. Gib die E-Mail-Adresse ein, mit
        der wir dich eingeladen haben. Du bekommst einen Link, ein Passwort brauchst du nicht.
      </p>
      {fehler && (
        <p className="mp-hinweis mp-hinweis--warn" role="alert">
          Der Link ist abgelaufen oder wurde schon benutzt. Fordere hier einfach einen neuen an.
        </p>
      )}
      <LoginForm />
    </section>
  );
}
