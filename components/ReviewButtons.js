"use client";

import { useState, useTransition } from "react";
import { publishAction, rejectAction } from "@/app/actions";

// "✓ Publier" / "Refuser" for a pending document — same effect as
// `node scripts/Reviewcontent.js publish|reject <id>`.
export default function ReviewButtons({ id, size = "sm" }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const big = size === "lg" ? "adm-btn-lg" : "";

  const run = (fn) =>
    startTransition(async () => {
      setError("");
      const res = await fn();
      if (res?.error) setError(res.error);
    });

  return (
    <>
      <button type="button" className={`adm-btn adm-btn-publish ${big}`} disabled={pending} onClick={() => run(() => publishAction(id))}>
        {pending ? "…" : "✓ Publier"}
      </button>
      <button
        type="button"
        className={`adm-btn adm-btn-danger ${big}`}
        disabled={pending}
        onClick={() => {
          const reason = window.prompt("Raison du refus (visible par l'enseignant, optionnel) :", "");
          if (reason === null) return; // cancelled
          run(() => rejectAction(id, reason.trim()));
        }}
      >
        Refuser
      </button>
      {error && <span className="adm-inline-error">{error}</span>}
    </>
  );
}
