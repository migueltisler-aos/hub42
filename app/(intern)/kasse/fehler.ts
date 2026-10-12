/** Supabase-Fehler sind Objekte, keine Error-Instanzen – beides lesbar machen. */
export function fehlerText(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return String(e);
}
