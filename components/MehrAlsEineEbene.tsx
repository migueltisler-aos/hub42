/* Online buchbar ist ein Regalplatz bis zu einer Ebene (MAX_REGAL_CM).
   Ab Regalplatz L steht dieser Hinweis unter der Eingabe, mit dem Link auf
   den Termin oder Kontakt, den die jeweilige Seite schon hat. */

import { MAX_REGAL_CM } from "@/lib/deck-economics";

export default function MehrAlsEineEbene({
  href,
  className,
  linkClassName,
}: {
  href: string;
  className?: string;
  linkClassName?: string;
}) {
  return (
    <p className={className}>
      Mehr als {MAX_REGAL_CM}&nbsp;cm?{" "}
      <a href={href} className={linkClassName}>
        Sprich uns&nbsp;an.
      </a>
    </p>
  );
}
