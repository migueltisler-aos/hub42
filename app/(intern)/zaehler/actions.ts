"use server";

import { cookies } from "next/headers";
import { rueckgaengig, zaehlen, type ZaehlArt } from "@/lib/zaehlung";

const wer = async () => (await cookies()).get("pipeline_user")?.value ?? "Team";

export async function zaehlAktion(art: ZaehlArt, brandId: string | null): Promise<{ ok: boolean; meldung?: string }> {
  if (!["besucher", "regal", "gekostet"].includes(art)) return { ok: false, meldung: "Unbekannte Zählart." };
  try {
    await zaehlen(art, brandId, await wer());
    return { ok: true };
  } catch (e) {
    return { ok: false, meldung: e instanceof Error ? e.message : String(e) };
  }
}

export async function rueckgaengigAktion(): Promise<{ art: ZaehlArt; brand_id: string | null } | null> {
  return rueckgaengig(await wer());
}
