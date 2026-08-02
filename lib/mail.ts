import nodemailer from "nodemailer";

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromEmail: string;
}

function envKey(user: string, key: string): string {
  return `SMTP_${key}_${user.toUpperCase()}`;
}

// Personenspezifische Env-Vars (z. B. SMTP_USER_MIGUEL) überschreiben die generischen
// SMTP_* Fallback-Vars — so kann jede Person ihr eigenes Postfach senden, ohne dass alle
// drei zwingend eigene Zugangsdaten brauchen, falls noch nicht eingerichtet.
function getConfigFor(fromName: string): SmtpConfig {
  const host = process.env[envKey(fromName, "HOST")] ?? process.env.SMTP_HOST;
  const port = Number(process.env[envKey(fromName, "PORT")] ?? process.env.SMTP_PORT ?? 587);
  const user = process.env[envKey(fromName, "USER")] ?? process.env.SMTP_USER;
  const pass = process.env[envKey(fromName, "PASS")] ?? process.env.SMTP_PASS;
  const fromEmail = process.env[envKey(fromName, "FROM_EMAIL")] ?? process.env.SMTP_FROM_EMAIL;

  if (!host || !user || !pass || !fromEmail) {
    throw new Error(
      `SMTP-Zugangsdaten für "${fromName}" fehlen (weder ${envKey(fromName, "USER")} noch SMTP_USER gesetzt)`
    );
  }

  return { host, port, user, pass, fromEmail };
}

const transporters = new Map<string, ReturnType<typeof nodemailer.createTransport>>();

function getTransporter(config: SmtpConfig) {
  const cacheKey = `${config.host}:${config.user}`;
  let t = transporters.get(cacheKey);
  if (!t) {
    t = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
    });
    transporters.set(cacheKey, t);
  }
  return t;
}

export async function sendMail({
  to,
  subject,
  text,
  fromName,
}: {
  to: string;
  subject: string;
  text: string;
  /** Pipeline-Login-Name — bestimmt, welches Postfach tatsächlich sendet. */
  fromName: string;
}): Promise<void> {
  const config = getConfigFor(fromName);

  await getTransporter(config).sendMail({
    from: `"${fromName} · Hub42" <${config.fromEmail}>`,
    to,
    subject,
    text,
  });
}
