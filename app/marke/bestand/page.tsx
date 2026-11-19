import { redirect } from "next/navigation";

// Bestand ist jetzt Teil von /marke/artikel; alte Links und Lesezeichen leiten um.
export default function BestandUmzug() {
  redirect("/marke/artikel");
}
