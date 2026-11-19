import { heuteStand, markenImRegal } from "@/lib/zaehlung";
import Zaehler from "./Zaehler";

export const dynamic = "force-dynamic";
export const metadata = { title: "Zähler · Intern" };

export default async function ZaehlerSeite() {
  const [marken, stand] = await Promise.all([markenImRegal(), heuteStand()]);
  return <Zaehler marken={marken} start={stand} />;
}
