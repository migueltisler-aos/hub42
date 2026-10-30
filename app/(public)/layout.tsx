import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {/* Platz für die Testkaufhaus-Leiste im festen Header (h-11 = 44 px):
          der Inhalt rückt um genau ihre Höhe nach unten, die Abstände der
          Seiten zum Header bleiben wie vorher. */}
      <div aria-hidden="true" className="h-11 shrink-0" />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
