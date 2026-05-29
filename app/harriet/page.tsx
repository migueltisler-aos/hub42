import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Harriet & Heike",
  description: "Jetzt Termin buchen oder direkt vernetzen.",
  robots: { index: false, follow: false },
};

const team = [
  {
    name: "Harriet Kollmann",
    image: "/team/harriet.jpg",
    linkedin: "https://www.linkedin.com/in/harriet-kollmann-881a7798/",
    calendly: "https://calendly.com/harriet-kollmann",
  },
  {
    name: "Heike Kmiotek",
    image: "/team/heike.jpg",
    linkedin: "https://www.linkedin.com/in/heike-kmiotek-a086a21bb/",
    calendly: "https://calendly.com/heike-kmiotek",
  },
];

export default function HarrietPage() {
  return (
    <main className="min-h-screen bg-green-dark flex flex-col items-center justify-center px-4 py-16">
      <p
        className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Hub42
      </p>
      <h1
        className="text-cream text-[clamp(2rem,6vw,4.5rem)] leading-none tracking-widest mb-14 text-center"
        style={{ fontFamily: "var(--font-bebas)" }}
      >
        Schreib uns an.
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        {team.map((person) => (
          <div
            key={person.name}
            className="bg-sage-warm rounded-2xl overflow-hidden flex flex-col"
          >
            <div className="relative w-full aspect-square">
              <Image
                src={person.image}
                alt={person.name}
                fill
                className="object-cover object-top"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            </div>

            <div className="p-5 flex flex-col gap-3">
              <h2
                className="text-green-dark text-xl font-bold leading-tight"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {person.name}
              </h2>

              <a
                href={person.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#0a66c2] text-white text-sm font-semibold rounded-lg px-4 py-2.5 hover:opacity-85 transition-opacity"
              >
                <LinkedInIcon />
                LinkedIn
              </a>

              <a
                href={person.calendly}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-bronze text-green-dark text-sm font-semibold rounded-lg px-4 py-2.5 hover:bg-bronze-light transition-colors"
              >
                <CalendarIcon />
                Termin buchen
              </a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function LinkedInIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
    </svg>
  );
}
