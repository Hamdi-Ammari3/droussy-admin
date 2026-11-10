"use client";

import { useState, useTransition } from "react";
import { activatePaidAction, startTrialAction } from "@/app/actions";
import { SUBSCRIPTION_PRICE_DT } from "@/lib/platform/subscription";

const fmt = (t) => new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/**
 * Row buttons on the Élèves tab:
 *  - trial student            → "Passer en payé"   (new 12-month subscription, teachers paid from now on)
 *  - none / expired / suspended → "Activer 12 mois" (+ "Essai 7 j" if this phone never had a trial)
 */
export default function StudentActions({ student }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState(null);
  const { sub } = student;
  const subscribed = sub.state === "active";

  const run = (confirmText, fn, done) => {
    if (!window.confirm(confirmText)) return;
    startTransition(async () => {
      setMsg(null);
      const res = await fn();
      setMsg(res?.error ? { error: res.error } : { ok: done(res) });
    });
  };

  if (msg?.ok) return <span className="ens-video-chip ens-video-chip-ok">{msg.ok}</span>;

  const canTrial = !subscribed && !student.trialUsedAt;
  const showPaid = sub.trial || !subscribed;

  return (
    <span className="adm-row-actions">
      {showPaid && (
        <button
          type="button"
          className="adm-btn adm-btn-publish"
          disabled={pending}
          onClick={() =>
            run(
              sub.trial
                ? `Passer ${student.name} en abonnement payé (12 mois, à partir d'aujourd'hui) ?\n\nÀ encaisser : ${SUBSCRIPTION_PRICE_DT} DT.`
                : `Activer un abonnement de 12 mois pour ${student.name}, à partir d'aujourd'hui ?\n\nÀ encaisser : ${SUBSCRIPTION_PRICE_DT} DT.`,
              () => activatePaidAction(student.id),
              (r) => `✅ Payé jusqu'au ${fmt(r.endsAt)}`
            )
          }
        >
          {pending ? "…" : sub.trial ? "💳 Passer en payé" : "💳 Activer 12 mois"}
        </button>
      )}
      {canTrial && (
        <button
          type="button"
          className="adm-btn"
          disabled={pending}
          onClick={() =>
            run(
              `Offrir l'essai gratuit (7 jours, 30 documents) à ${student.name} ?\n\nChaque numéro n'a droit qu'à un seul essai.`,
              () => startTrialAction(student.id),
              (r) => `🧪 Essai jusqu'au ${fmt(r.endsAt)}`
            )
          }
        >
          🧪 Essai 7 j
        </button>
      )}
      {msg?.error && <span className="adm-inline-error">{msg.error}</span>}
    </span>
  );
}
