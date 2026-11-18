"use client";

import { markeWaehlen } from "../actions";

export default function MarkeWechsel({ aktiv, alle }: { aktiv: string; alle: { brandId: string; brandName: string }[] }) {
  return (
    <form action={markeWaehlen}>
      <label className="sr-only" htmlFor="marke-wahl">Marke</label>
      <select
        id="marke-wahl"
        name="brand_id"
        defaultValue={aktiv}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {alle.map((m) => (
          <option key={m.brandId} value={m.brandId}>
            {m.brandName}
          </option>
        ))}
      </select>
    </form>
  );
}
