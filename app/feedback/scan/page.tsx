import { getProducts } from "@/lib/feedback";
import ScannerClient from "@/components/feedback/ScannerClient";

export default async function ScanPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-green-dark px-4 py-10">
      <div className="max-w-md mx-auto mb-6 text-center">
        <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-2">
          Hub42 Feedback-Studio
        </p>
        <h1
          className="text-cream text-3xl tracking-widest"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          QR-Code scannen
        </h1>
      </div>
      <ScannerClient
        products={products.map((p) => ({ id: p.id, name: p.name, brand: p.brand }))}
      />
    </div>
  );
}
