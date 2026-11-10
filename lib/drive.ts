import "server-only";

import { Readable } from "node:stream";
import { google } from "googleapis";

/* Google Drive für Dateien an Aufgaben. Dateien landen in einem Unterordner je
   Aufgabe im freigegebenen Ordner DRIVE_ORDNER_ID. Zugang wie Gmail über
   OAuth2 mit Refresh-Token (OAuth Playground, Scope .../auth/drive), angemeldet
   als Besitzer des Ordners. Client-ID und -Secret dürfen die von Gmail sein. */

function zugang() {
  const clientId = process.env.DRIVE_OAUTH_CLIENT_ID || process.env.GMAIL_OAUTH_CLIENT_ID;
  const clientSecret = process.env.DRIVE_OAUTH_CLIENT_SECRET || process.env.GMAIL_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.DRIVE_OAUTH_REFRESH_TOKEN;
  const ordner = process.env.DRIVE_ORDNER_ID;
  if (!clientId || !clientSecret || !refreshToken || !ordner) return null;
  return { clientId, clientSecret, refreshToken, ordner };
}

/** Sind alle vier Werte gesetzt? Ohne sie zeigt die App keinen Upload. */
export const driveBereit = () => zugang() !== null;

function drive() {
  const z = zugang();
  if (!z) throw new Error("Drive ist nicht eingerichtet (DRIVE_OAUTH_REFRESH_TOKEN, DRIVE_ORDNER_ID).");
  const auth = new google.auth.OAuth2(z.clientId, z.clientSecret);
  auth.setCredentials({ refresh_token: z.refreshToken });
  return { api: google.drive({ version: "v3", auth }), ordner: z.ordner };
}

/** Legt den Unterordner einer Aufgabe im freigegebenen Ordner an. */
export async function ordnerAnlegen(name: string): Promise<string> {
  const { api, ordner } = drive();
  const r = await api.files.create({
    requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [ordner] },
    fields: "id",
    supportsAllDrives: true,
  });
  if (!r.data.id) throw new Error("Drive hat keinen Ordner angelegt.");
  return r.data.id;
}

/** Lädt eine Datei in den Ordner und gibt id und Ansichts-Link zurück. */
export async function dateiHochladen(
  ordnerId: string,
  name: string,
  mime: string,
  inhalt: Buffer
): Promise<{ id: string; link: string }> {
  const { api } = drive();
  const r = await api.files.create({
    requestBody: { name, parents: [ordnerId] },
    media: { mimeType: mime || "application/octet-stream", body: Readable.from(inhalt) },
    fields: "id, webViewLink",
    supportsAllDrives: true,
  });
  if (!r.data.id || !r.data.webViewLink) throw new Error("Drive hat die Datei nicht angenommen.");
  return { id: r.data.id, link: r.data.webViewLink };
}
