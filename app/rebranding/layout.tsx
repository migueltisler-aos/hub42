import type { Metadata } from "next";
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
  return (
    <div
      className={`${spaceGrotesk.variable} ${workSans.variable} min-h-screen bg-white text-black`}
      style={{ fontFamily: "var(--font-ff-body)" }}
    >
      {children}
    </div>
  );
}
