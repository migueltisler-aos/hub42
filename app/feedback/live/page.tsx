import { getLiveStats } from "@/lib/feedback";
import FieldFrame from "@/components/feedback/FieldFrame";
import LiveCounter from "@/components/feedback/LiveCounter";

export const dynamic = "force-dynamic";

export const metadata = { title: "Hub42 Live" };

// Bildschirm am Event-Stand: wie viele Menschen den Startups mit ihrer Meinung
// geholfen haben. Öffentlich (keine Einzeldaten, nur Summen), lädt sich selbst neu.
export default async function LivePage() {
  const stats = await getLiveStats();
  return (
    <FieldFrame>
      <LiveCounter stats={stats} />
    </FieldFrame>
  );
}
