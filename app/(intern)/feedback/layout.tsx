import { getStudioCounts } from "@/lib/feedback";
import StudioNav from "./admin/_components/StudioNav";

export const dynamic = "force-dynamic";

/**
 * Gemeinsamer Rahmen für alle Studio-Seiten (/feedback/admin/* und
 * /feedback/leads). Die Zähler an den Reitern kommen aus einer reinen
 * COUNT-Abfrage, damit jede Seite dieselbe Orientierung hat, ohne dass
 * jede Seite dafür Daten laden muss.
 */
export default async function FeedbackStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const counts = await getStudioCounts();

  return (
    <>
      <StudioNav zaehler={counts} />
      {children}
    </>
  );
}
