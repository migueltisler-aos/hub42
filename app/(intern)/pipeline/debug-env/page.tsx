import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function DebugEnvPage() {
  const cookieStore = await cookies();
  const currentUser = cookieStore.get("pipeline_user")?.value ?? "Unbekannt";

  const smtpKeys = Object.keys(process.env)
    .filter((k) => k.startsWith("SMTP_"))
    .sort();

  return (
    <div className="min-h-screen bg-green-dark px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-cream text-2xl font-mono mb-4">SMTP Env Debug</h1>
        <p className="text-stone text-sm font-mono mb-6">
          Eingeloggt als: <span className="text-bronze">{currentUser}</span>
        </p>
        <p className="text-stone text-xs font-mono mb-2">
          Vom Server sichtbare SMTP_*-Variablennamen ({smtpKeys.length}):
        </p>
        <pre className="bg-green-mid border border-stone-dark text-cream text-xs font-mono p-4 whitespace-pre-wrap">
          {smtpKeys.length > 0 ? smtpKeys.join("\n") : "(keine gefunden)"}
        </pre>
      </div>
    </div>
  );
}
