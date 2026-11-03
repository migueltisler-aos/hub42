import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ladeHeute } from "@/lib/crm-heute";
import { ladePipeline } from "@/lib/crm-pipeline";
import { personAus } from "@/lib/crm-heute-model";
import { werAus } from "../logik";
import SalesAnsicht from "./SalesAnsicht";
import TrichterLeiste from "./TrichterLeiste";
import Kundenliste from "./Kundenliste";

export const metadata: Metadata = { title: "Pipeline" };

/* Pipeline-Dashboard: Zusagen und Trichter, Sales-Aufgaben mit SLA, Kunden
   mit Zusagen und Updates. ?wer= wählt die Person wie bei den Aufgaben. */
export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ wer }, cookieStore, sales, pipeline] = await Promise.all([searchParams, cookies(), ladeHeute(), ladePipeline()]);
  const ich = personAus(cookieStore.get("pipeline_user")?.value);
  return (
    <SalesAnsicht
      start={werAus(wer, ich)}
      ich={ich}
      daten={sales}
      // Zusagen und Kunden vor den Sales-Aufgaben: das ist der Kern des Dashboards.
      // Keys, weil React Elemente aus Server-Props sonst als Liste ohne key meldet.
      oben={[
        <TrichterLeiste key="trichter" trichter={pipeline.trichter} />,
        <Kundenliste key="kunden" kunden={pipeline.kunden} heute={sales.heute} />,
      ]}
    />
  );
}
