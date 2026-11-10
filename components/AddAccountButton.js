"use client";

import { useActionState, useEffect, useState } from "react";
import { createAccountAction } from "@/app/actions";

const fmt = (t) => new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

// "+ Ajouter" → modal in the platform's style (teacher dashboard .ens-modal).
export default function AddAccountButton({ role }) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const teacher = role === "teacher";

  return (
    <>
      <button type="button" className="ens-new-video-btn" onClick={() => setOpen(true)}>
        + {teacher ? "Ajouter un enseignant" : "Ajouter un élève"}
      </button>
      {open && (
        <AccountModal
          key={formKey}
          role={role}
          onClose={() => setOpen(false)}
          onAnother={() => setFormKey((k) => k + 1)}
        />
      )}
    </>
  );
}

function AccountModal({ role, onClose, onAnother }) {
  const teacher = role === "teacher";
  const [state, action, pending] = useActionState(createAccountAction, null);
  const [copied, setCopied] = useState(false);
  const acc = state?.account;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !pending && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, onClose]);

  // Same lines the scripts print, ready for WhatsApp / the delivery paper.
  const message = acc
    ? [
        "Droussy TN",
        `Nom : ${acc.name}`,
        `Téléphone : ${acc.phone}`,
        `Code : ${acc.pin}`,
        acc.plan === "trial"
          ? `Essai gratuit : ${acc.quota} documents jusqu'au ${fmt(acc.endsAt)}`
          : acc.endsAt
            ? `Abonnement valable jusqu'au ${fmt(acc.endsAt)}`
            : null,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return (
    <div className="ens-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !pending && onClose()}>
      <div className="ens-modal" role="dialog" aria-modal="true" aria-labelledby="adm-acc-title">
        <div className="ens-modal-header">
          <div>
            <h2 id="adm-acc-title" className="ens-modal-title">
              {teacher ? "Nouvel enseignant" : "Nouvel élève"}
            </h2>
            <p className="ens-modal-desc">
              {teacher
                ? "Le compte est créé avec un code à 4 chiffres. L'enseignant se connecte avec son numéro et ce code."
                : "L'élève se connecte avec son numéro et un code à 4 chiffres. Tous les niveaux et toutes les matières."}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={pending} className="ens-modal-close" aria-label="Fermer">
            ✕
          </button>
        </div>

        {acc ? (
          <div className="adm-creds">
            ✅ Compte créé
            <pre>{message}</pre>
            <div className="adm-actions" style={{ marginTop: 0 }}>
              <button
                type="button"
                className="adm-btn adm-btn-lg"
                onClick={() => navigator.clipboard.writeText(message).then(() => setCopied(true))}
              >
                {copied ? "✓ Copié" : "📋 Copier"}
              </button>
              <a
                className="adm-btn adm-btn-lg"
                href={`https://wa.me/216${acc.phone}?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                💬 WhatsApp
              </a>
              <button type="button" className="adm-btn adm-btn-lg adm-btn-primary" onClick={onAnother}>
                + Un autre
              </button>
            </div>
          </div>
        ) : (
          <form action={action} className="ens-modal-form">
            <input type="hidden" name="role" value={role} />
            <label className="ens-field">
              <span className="ens-field-label">Nom complet</span>
              <input name="name" required minLength={2} maxLength={80} className="ens-input" placeholder="Ex : Mohamed Chikhaoui" autoFocus />
            </label>
            <label className="ens-field">
              <span className="ens-field-label">Téléphone</span>
              <input name="phone" required inputMode="numeric" maxLength={20} className="ens-input" placeholder="Ex : 99536298" />
              <p className="ens-field-hint">8 chiffres. +216 / 00216 accepté, il est retiré automatiquement.</p>
            </label>
            {!teacher && (
              <fieldset className="ens-field adm-plan-field">
                <span className="ens-field-label">Formule</span>
                <div className="adm-plan-options">
                  <label className="adm-plan-option">
                    <input type="radio" name="plan" value="trial" defaultChecked />
                    <span>
                      <strong>🧪 Essai gratuit</strong>
                      <small>7 jours · 30 documents · vues non payées aux enseignants</small>
                    </span>
                  </label>
                  <label className="adm-plan-option">
                    <input type="radio" name="plan" value="paid" />
                    <span>
                      <strong>✅ Abonnement payé</strong>
                      <small>12 mois · tous les documents</small>
                    </span>
                  </label>
                </div>
              </fieldset>
            )}
            {teacher && (
              <label className="ens-field">
                <span className="ens-field-label">Civilité</span>
                <select name="sex" className="ens-select" defaultValue="man">
                  <option value="man">M. (homme)</option>
                  <option value="woman">Mme (femme)</option>
                </select>
              </label>
            )}
            {state?.error && <p className="ens-login-error">{state.error}</p>}
            <button type="submit" className="ens-publish-btn" disabled={pending}>
              {pending ? "Création…" : "Créer le compte"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
