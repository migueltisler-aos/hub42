import { redirect } from "next/navigation";

/* /crm hat keinen eigenen Inhalt: der Startscreen ist „Heute“. */
export default function CrmPage() {
  redirect("/crm/heute");
}
