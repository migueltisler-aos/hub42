import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function login(formData: FormData) {
  "use server";
  const password = formData.get("password") as string;
  const name = (formData.get("name") as string).trim();
  const from = (formData.get("from") as string) || "/pipeline";

  if (!password || !name) return;
  if (password !== process.env.PIPELINE_PASSWORD) return;

  const cookieStore = await cookies();
  cookieStore.set("pipeline_auth", password, { path: "/", httpOnly: true, sameSite: "lax" });
  cookieStore.set("pipeline_user", name, { path: "/", httpOnly: false, sameSite: "lax" });

  redirect(from);
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  return (
    <div className="min-h-screen bg-green-dark flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p
          className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-2"
        >
          Hub42 Intern
        </p>
        <h1
          className="text-cream text-4xl tracking-widest mb-8"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          Sales Pipeline
        </h1>

        <form action={login} className="space-y-4">
          <input type="hidden" name="from" value={from ?? "/pipeline"} />

          <div>
            <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
              Dein Name
            </label>
            <input
              name="name"
              type="text"
              placeholder="z.B. Miguel"
              required
              className="w-full bg-green-mid border border-stone-dark text-cream px-4 py-3 text-sm font-mono focus:outline-none focus:border-bronze"
            />
          </div>

          <div>
            <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
              Passwort
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full bg-green-mid border border-stone-dark text-cream px-4 py-3 text-sm font-mono focus:outline-none focus:border-bronze"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-bronze text-green-dark font-semibold py-3 text-sm hover:bg-bronze-light transition-colors"
          >
            Zugang →
          </button>
        </form>
      </div>
    </div>
  );
}
