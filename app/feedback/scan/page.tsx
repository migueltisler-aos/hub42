import { getProducts } from "@/lib/feedback";
import ScannerClient from "@/components/feedback/ScannerClient";
import FieldFrame from "@/components/feedback/FieldFrame";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const products = await getProducts();

  return (
    <FieldFrame>
      <div className="max-w-md mx-auto mb-8 text-center">
        <span className="stamp text-bronze mb-3 inline-block">Feld-Erfassung</span>
        <h1
          className="text-cream text-4xl tracking-widest"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          QR-Code scannen
        </h1>
        <p className="text-stone text-xs mt-2">Regal aufsuchen, Code einfangen, Stimme abgeben.</p>
      </div>
      <ScannerClient
        products={products.map((p) => ({ id: p.id, name: p.name, brand: p.brand }))}
      />
    </FieldFrame>
  );
}
