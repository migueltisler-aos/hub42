"use client";

import { useActionState } from "react";
import { loginAnfordern } from "../actions";

export default function LoginForm() {
  const [status, aktion, laeuft] = useActionState(loginAnfordern, null);
  return (
    <form action={aktion} className="mp-form">
      <label className="mp-feld">
        <span>E-Mail-Adresse</span>
        <input type="email" name="email" required autoComplete="email" inputMode="email" />
      </label>
      <div className="mp-aktionen">
        <button className="mp-knopf" type="submit" disabled={laeuft}>
          {laeuft ? "Wird gesendet …" : "Login-Link senden"}
        </button>
      </div>
      {status && (
        <p className={status.ok ? "mp-hinweis" : "mp-hinweis mp-hinweis--warn"} role="status">
          {status.meldung}
        </p>
      )}
    </form>
  );
}
