import { redirect } from "next/navigation";

/* Alter Name des Screens „Aufgaben“, bleibt für Lesezeichen. */
export default function HeuteAlt() {
  redirect("/crm/aufgaben");
}
