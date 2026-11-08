# Droussy TN · Admin dashboard

This is a separate Next.js website (Next 16.2.6 and React 19.2.4, the same versions as Droussy TN) that connects to the **same Firebase project** ("study"). It reads and writes with the Admin SDK on the server only, so your Firestore rules don't change.

It is built from the platform's own code:

| Copied unchanged from `etude/` | Into |
|---|---|
| `lib/liveGrades.js`, `liveSubjects.js`, `videoDisplay.js`, `videoConfig.js`, `videoText.js`, `openDocs.js`, `subscription.js`, `phone.js` | `lib/platform/` |
| `app/homePage.css`, `videos/videos.css`, `components/catalogFilters.css`, `videoThumbnail.css`, `openDocs.css`, `navbar.css`, `enseignant/enseignantPage.css` | `app/platform-css/` |
| `app/components/VideoThumbnail.js` (imports re-pointed) | `components/` |

The admin pages use the **same class names and markup** as the platform:
- navbar from `Navbar.js`
- catalog filter bar and cards from `DocumentsCatalog.js` and `DocumentCards.js`
- stat cards and modals from the teacher dashboard

The only new CSS is `app/admin.css` (tables, status chips, admin buttons), and it is built on the same `--home-*` tokens.

---

## What each tab does

**📚 Contenus** (`/contenus`): every document in `videos`, whatever its status.
- **Filters:** the same filter bar as the home page (search, Niveau, Matière, Tout / 🎬 Vidéos / 📄 PDF, Tous / Gratuits, Section chips, PDF-type chips). It uses the same URL names (`?niveau=col-7&matiere=maths&type=pdf&doc=serie&gratuit=1&q=…`).
- **Sort:** the old **🔥 Populaires / 🆕 Récents** sort is back (`?tri=recentes`). It's the same rule as before you removed it: views, then newest.
- **Status filter (admin only):** a chip row with the count for each status: ⏳ En validation · ✅ Publiée · ⚙️ Traitement (with Bunny's %) · ⏫ Envoi en cours · ❌ Refusée · ⚠️ Échec.
- **✓ Publier / Refuser:** buttons on every pending card. They do exactly what `scripts/Reviewcontent.js` does:
  - The change runs in a transaction and only if the document is still `pending`.
  - It sets `publishedAt`, `reviewedAt` and `updatedAt`.
  - On a reject, the refusal reason is saved, and if the teacher loses his last free document, his oldest published one becomes free (the `lib/openDocs.js` rule).
- **Detail page** (`/contenus/[id]`): plays the video (signed Bunny embed, same token scheme as `lib/bunny.js`) or opens the PDF (signed Bunny Storage link). It shows all the details and has the publish and reject buttons.

**🎓 Élèves** (`/eleves`)
- **Numbers on top:** subscribed students, average documents opened per subscribed student, subscriptions expiring within 30 days, and expired or suspended subscriptions.
- **Table:** each student's subscription state and end date, plus `subscription.used` out of `quota` with a progress bar. These are the distinct documents opened on the current subscription. States come from `lib/subscription.js → subscriptionStatus()`, so they match the platform.
- **+ Ajouter un élève** (name and phone): writes exactly the document that `scripts/createStudentAccount.js` writes, with a 12-month subscription, quota `DOC_QUOTA` (1000) and a random 4-digit PIN in `password`. It then shows the credentials with **Copier** and **WhatsApp** buttons.

**🏫 Enseignants** (`/enseignants`)
- **Numbers on top:** teachers, published documents, total views, and balances to pay (how many teachers are at 100 DT or more).
- **Table:** published documents (🎬 / 📄), pending documents, views (`videoViewsTotal`) and balance (`videoBalanceMillimes`). Filters include "Paiement dû".
- **+ Ajouter un enseignant** (name, phone, M./Mme): writes the same document as `scripts/createTeacherAccount.js`.
- **Profile** (`/enseignants/[id]`): the same 3 cards as the teacher's own dashboard, all of his documents, his phone, and his **PIN** (hidden until you click *Afficher*). There are also WhatsApp and public-profile links, and the `payTeacher.js` command to run.

---

## Step-by-step setup

### 1. Get the code
Unzip `droussy-admin/`, or create the project and copy the files in:
```bash
npx create-next-app@16.2.6 droussy-admin --js --app --no-tailwind --no-src-dir --import-alias "@/*"
cd droussy-admin
npm install firebase-admin @aws-sdk/client-s3 @aws-sdk/s3-request-presigner server-only
```
If you start fresh, copy `app/`, `components/`, `lib/`, `proxy.js`, `next.config.mjs` and `jsconfig.json` over the generated files.

### 2. Environment
```bash
cp .env.example .env.local
```
- **Copy from Droussy's `.env`:** the `FIREBASE_ADMIN_*` and `BUNNY_*` values (same names, same values).
- **Add these new ones:**
  - `ADMIN_PASSWORD`: a long password, only for you.
  - `SESSION_SECRET`: the output of `openssl rand -hex 32`.
  - `NEXT_PUBLIC_PLATFORM_URL`: your platform's address, used for the "Voir sur Droussy TN" and "Profil public" links.

### 3. Run
```bash
npm install
npm run dev        # http://localhost:3001  (the platform keeps :3000)
```
Log in with `ADMIN_PASSWORD`, then test:
1. **Contenus:** try each filter, switch Populaires ↔ Récents, click **⏳ N à valider**, open a document, then **✓ Publier**. Check that it appears on the platform catalog.
2. **Élèves:** add a student with a number you own, then log in on Droussy with that phone and PIN.
3. **Enseignants:** open a teacher, then click *Afficher* to see the PIN.

### 4. Deploy
- Push to a **private** GitHub repo, because this site can read every PIN.
- Import it on Vercel, paste the env variables, and add a domain such as `admin.droussy.tn`.
- The pages are marked `noindex`, and `proxy.js` (Next 16's replacement for `middleware`) redirects everything to `/login` without the signed cookie.

---

## How it works

- **Data loading:** `lib/data/content.js` loads the `videos` collection once with `select()` (only the fields the dashboard shows). It keeps the result in memory for 30 seconds (`lib/memo.js`) and filters and counts in memory. That's why the admin can mix statuses, search inside titles and show a count next to every option without any new Firestore index.
- **After a change:** publishing, rejecting and creating an account clear that cache and call `refresh()`, so you see your change at once.
- **Read cost:** about 1 read per document every 30 seconds, and only while you're using the dashboard.
- **At scale:** past roughly 20,000 documents, switch the Contenus tab to paged Firestore queries.

### Keeping the UI in sync with the platform
When you change a shared style or rule on Droussy, copy the file again:
```bash
P=../etude
cp $P/app/homePage.css $P/app/videos/videos.css $P/app/components/{catalogFilters,videoThumbnail,openDocs,navbar}.css $P/app/enseignant/enseignantPage.css app/platform-css/
cp $P/lib/{liveGrades,liveSubjects,videoDisplay,videoConfig,videoText,openDocs,subscription,phone}.js lib/platform/
```
`VideoThumbnail.js` only needs its 3 import lines re-pointed after copying (to `@/lib/platform/…` and `@/app/platform-css/…`).

---

## Next ideas
- **"Marquer payé" button** for teachers with 100 DT or more. It would reuse the `payTeacher.js` transaction: deduct the amount and write a `payouts/` doc.
- **Renew / suspend / add quota** from the Élèves tab. It would reuse `setSubscription.js`.
- **"Actualiser depuis Bunny"** for videos stuck in ⚙️ Traitement. It would reuse `syncVideoFromBunny()`.
