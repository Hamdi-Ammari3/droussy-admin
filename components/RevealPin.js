"use client";

import { useState } from "react";

export default function RevealPin({ pin }) {
  const [show, setShow] = useState(false);
  return (
    <span className="adm-pin">
      <span className="adm-mono">{show ? pin || "—" : "••••"}</span>
      <button type="button" className="adm-btn" onClick={() => setShow((s) => !s)}>
        {show ? "Masquer" : "Afficher"}
      </button>
    </span>
  );
}
