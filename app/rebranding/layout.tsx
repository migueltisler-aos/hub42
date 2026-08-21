import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Space_Grotesk, Work_Sans } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-ff-display",
  subsets: ["latin"],
  display: "swap",
});

const workSans = Work_Sans({
  variable: "--font-ff-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Feedback Factory: Vorschau",
    template: "%s | Feedback Factory",
  },
  description:
    "Interne Vorschau des Feedback Factory Rebrandings. Nicht die aktuelle tryhub42.de.",
  robots: { index: false, follow: false },
};

export default function RebrandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // /rebranding ist offline gestellt (404). Zum Reaktivieren: notFound()-Zeile
  // und den notFound-Import entfernen.
  notFound();

  return (
    <div
      className={`${spaceGrotesk.variable} ${workSans.variable} min-h-screen bg-white text-black`}
      style={{ fontFamily: "var(--font-ff-body)" }}
    >
      {children}
    </div>
  );
}
