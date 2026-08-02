import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// Statische, wörtliche process.env.X Zugriffe — bewusst NICHT über eine
// berechnete Variable/Bracket-Notation, um zu testen ob Next.js dynamische
// process.env[key]-Zugriffe (wie in lib/mail.ts) anders behandelt als
// statische process.env.X-Zugriffe.
const STATIC_CHECKS = {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER_MIGUEL: process.env.SMTP_USER_MIGUEL,
  SMTP_PASS_MIGUEL: process.env.SMTP_PASS_MIGUEL,
  SMTP_FROM_EMAIL_MIGUEL: process.env.SMTP_FROM_EMAIL_MIGUEL,
  PIPELINE_PASSWORD: process.env.PIPELINE_PASSWORD,
  FEEDBACK_PASSWORD: process.env.FEEDBACK_PASSWORD,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
};

export default async function DebugEnvPage() {
  const cookieStore = await cookies();
  const currentUser = cookieStore.get("pipeline_user")?.value ?? "Unbekannt";

  const smtpKeys = Object.keys(process.env)
    .filter((k) => k.startsWith("SMTP_"))
    .sort();

  const allKeysCount = Object.keys(process.env).length;

  return (
    <div className="min-h-screen bg-green-dark px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-cream text-2xl font-mono mb-4">SMTP Env Debug</h1>
        <p className="text-stone text-sm font-mono mb-6">
          Eingeloggt als: <span className="text-bronze">{currentUser}</span>
        </p>

        <p className="text-stone text-xs font-mono mb-2">
          Test 1 — dynamische Auflistung via Object.keys(process.env), gefiltert auf SMTP_ ({smtpKeys.length} von insgesamt {allKeysCount} Env-Keys):
        </p>
        <pre className="bg-green-mid border border-stone-dark text-cream text-xs font-mono p-4 whitespace-pre-wrap mb-6">
          {smtpKeys.length > 0 ? smtpKeys.join("\n") : "(keine gefunden)"}
        </pre>

        <p className="text-stone text-xs font-mono mb-2">
          Test 2 — statischer, wörtlicher Zugriff auf einzelne bekannte Variablen (nur ob gesetzt, keine Werte):
        </p>
        <pre className="bg-green-mid border border-stone-dark text-cream text-xs font-mono p-4 whitespace-pre-wrap">
          {Object.entries(STATIC_CHECKS)
            .map(([k, v]) => `${k}: ${v ? "✓ gesetzt" : "✗ fehlt"}`)
            .join("\n")}
        </pre>
      </div>
    </div>
  );
}
