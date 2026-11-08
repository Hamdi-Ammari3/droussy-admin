"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <main className="adm-login">
      <form action={action} className="adm-login-card">
        <div className="navbar-brand">
          <span className="navbar-logo-badge">🎒</span>
          <span className="navbar-wordmark">
            Droussy <span className="navbar-brand-accent">TN</span>
          </span>
          <span className="adm-badge">Admin</span>
        </div>
        <label className="ens-field">
          <span className="ens-field-label">Mot de passe administrateur</span>
          <input className="ens-input" type="password" name="password" required autoFocus autoComplete="current-password" />
        </label>
        {state?.error && <p className="ens-login-error">{state.error}</p>}
        <button type="submit" className="ens-publish-btn" disabled={pending}>
          {pending ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
