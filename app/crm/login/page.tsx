import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PIPELINE_USERS, isPipelineUser } from "@/lib/pipeline-users";

export const metadata: Metadata = { title: "Anmelden" };

/** Nur interne Ziele unter /crm, sonst wäre `from` ein offener Redirect. */
const ziel = (from: string | undefined) => (from && /^\/crm(\/|$)/.test(from) ? from : "/crm/heute");

async function anmelden(formData: FormData) {
  "use server";
  const password = formData.get("password") as string;
  const name = (formData.get("name") as string)?.trim();
  const from = ziel(formData.get("from") as string);

  if (!password || !name || !isPipelineUser(name) || password !== process.env.PIPELINE_PASSWORD) {
    redirect(`/crm/login?fehler=1&from=${encodeURIComponent(from)}`);
  }

  // Dieselben Cookies wie /pipeline/login: ein Login gilt für beide Bereiche.
  const maxAge = 60 * 60 * 24 * 180;
  const cookieStore = await cookies();
  cookieStore.set("pipeline_auth", password, { path: "/", httpOnly: true, sameSite: "lax", maxAge });
  cookieStore.set("pipeline_user", name, { path: "/", httpOnly: false, sameSite: "lax", maxAge });

  redirect(from);
}

export default async function CrmLogin({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; fehler?: string }>;
}) {
  const { from, fehler } = await searchParams;

  return (
    <section className="anmelden regal" aria-labelledby="anmelden-titel">
      <h1 id="anmelden-titel" className="satz satz--h2">
        Anmelden
      </h1>
      <form action={anmelden} className="anmelden__form">
        <input type="hidden" name="from" value={ziel(from)} />
        <label className="anmelden__feld">
          <span className="anmelden__label">Name</span>
          <select name="name" required defaultValue="" className="anmelden__eingabe">
            <option value="" disabled>
              Wählen…
            </option>
            {PIPELINE_USERS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
        <label className="anmelden__feld">
          <span className="anmelden__label">Passwort</span>
          <input name="password" type="password" required autoComplete="current-password" className="anmelden__eingabe" />
        </label>
        {fehler && (
          <p className="anmelden__fehler" role="alert">
            Name oder Passwort stimmt nicht.
          </p>
        )}
        <button type="submit" className="anmelden__knopf">
          Anmelden
        </button>
      </form>
    </section>
  );
}
