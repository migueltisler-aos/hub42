import { getExportRows, toCsv } from "@/lib/feedback";

export const dynamic = "force-dynamic";

export async function GET() {
  const { headers, rows } = await getExportRows();
  const csv = toCsv(headers, rows);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hub42-feedback-export-${date}.csv"`,
    },
  });
}
