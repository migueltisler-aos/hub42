/* Verweis auf testkaufhaus.de. Preise und Pakete stehen seit 2026-10-30 nur
   noch dort (Entscheidung der Gründer: tryhub42.de bleibt, nur ohne Preise).
   Eine Quelle für Adresse und Wortlaut, damit jede Seite gleich verweist. */

export const TESTKAUFHAUS_URL = "https://testkaufhaus.de";

export function TestkaufhausLink({
  className,
  children = "testkaufhaus.de",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <a href={TESTKAUFHAUS_URL} target="_blank" rel="noopener" className={className}>
      {children}
      <span className="sr-only"> (öffnet in neuem Tab)</span>
    </a>
  );
}

/** Der Satz „Preise und Pakete findest du auf testkaufhaus.de.“ mit Link. */
export default function PreiseAufTestkaufhaus({ linkClassName }: { linkClassName?: string }) {
  return (
    <>
      Preise und Pakete findest du auf <TestkaufhausLink className={linkClassName} />.
    </>
  );
}
