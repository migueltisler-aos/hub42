/* Anteilsvergleich: dieselben 20 cm einmal im LEH-Frühstücksregal und
   einmal an unserer Wand. Beide Regale füllen die volle Breite – verglichen
   wird der Anteil, nicht die absolute Länge. */

interface Props {
  fronts: number;
  /** Nullbasierter Index der hervorgehobenen Front. */
  meine: number;
  titel: string;
  mass: string;
  hub?: boolean;
  children: React.ReactNode;
}

function Balken({ fronts, meine, titel, mass, hub, children }: Props) {
  return (
    <div className={"shelf-bar" + (hub ? " shelf-bar--hub" : "")}>
      <div className="shelf-bar__head">
        <span className="shelf-bar__t">{titel}</span>
        <span className="shelf-bar__m">{mass}</span>
      </div>
      <div className="shelf-bar__row" aria-hidden="true">
        {Array.from({ length: fronts }, (_, i) => (
          <div key={i} className={"slotlet" + (i === meine ? " slotlet--mine" : "")} />
        ))}
      </div>
      <p className="shelf-bar__foot">{children}</p>
    </div>
  );
}

export default function Anteil() {
  return (
    <div className="share">
      <Balken
        fronts={60}
        meine={42}
        titel="Frühstücksregal, Lebensmitteleinzelhandel"
        mass="12,0 m · 60 Fronts"
      >
        <strong>1 von 60</strong> · Listungskosten 2.000–50.000 € · Handelsmarge 30–50 % · der
        Händler setzt den Preis
      </Balken>

      <Balken hub fronts={13} meine={6} titel="Hub42, Regalwand A" mass="0,84 m · 13 Fronts">
        <strong>1 von 13</strong> · keine Listungsgebühr · 7 % Provision · du setzt den Preis
      </Balken>
    </div>
  );
}
