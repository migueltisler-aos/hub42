"use client";

import { useState } from "react";

interface Props {
  brandEmail: string | null;
  brandName: string;
  ansprechpartner: string | null;
  currentUser: string;
  sendAction: (formData: FormData) => Promise<void>;
}

function defaultBody(brandName: string, ansprechpartner: string | null, currentUser: string): string {
  return `Hallo ${ansprechpartner || "zusammen"},

mein Name ist ${currentUser}, ich bin Mitgründer von Hub42. Wir bringen kuratierte, aufstrebende Marken wie ${brandName} auf physische Verkaufsfläche im Alexa Berlin – ohne dass ihr euch um Personal, Kasse oder Fläche kümmern müsst.

[hier kurz individuell ergänzen, warum ${brandName} passt]

Hättet ihr Lust auf ein kurzes Gespräch dazu?

Falls das gerade kein Thema ist, sagt einfach kurz Bescheid – dann melde ich mich nicht wieder.

Viele Grüße
${currentUser}
Hub42`;
}

export default function MailComposer({ brandEmail, brandName, ansprechpartner, currentUser, sendAction }: Props) {
  const [subject, setSubject] = useState(`${brandName} × Hub42 – Regalfläche im Alexa Berlin`);
  const [body, setBody] = useState(defaultBody(brandName, ansprechpartner, currentUser));
  const [sending, setSending] = useState(false);

  if (!brandEmail) {
    return (
      <div className="border border-stone-dark bg-green-mid/10 p-4">
        <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-2">Anschreiben senden</p>
        <p className="text-stone text-xs font-mono">
          Keine E-Mail-Adresse hinterlegt – oben eintragen und speichern, um ein Anschreiben zu versenden.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-bronze/30 bg-green-mid/10 p-4 space-y-3">
      <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase">
        Anschreiben senden an {brandEmail}
      </p>
      <form
        action={async (formData) => {
          setSending(true);
          await sendAction(formData);
        }}
        className="space-y-3"
      >
        <div>
          <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">Betreff</label>
          <input
            name="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm font-mono focus:outline-none focus:border-bronze"
          />
        </div>
        <div>
          <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">Text</label>
          <textarea
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm font-mono focus:outline-none focus:border-bronze resize-y"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={sending}
            className="px-6 py-3 bg-red-600 text-cream text-sm font-semibold hover:bg-red-500 transition-colors disabled:opacity-50"
          >
            {sending ? "Wird gesendet…" : "Senden →"}
          </button>
        </div>
      </form>
    </div>
  );
}
