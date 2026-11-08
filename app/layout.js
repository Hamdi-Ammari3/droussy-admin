import { Noto_Sans_Arabic } from "next/font/google";
// Platform stylesheets, copied unchanged from Droussy TN (see README → "Keeping the UI in sync").
import "./platform-css/homePage.css";
import "./platform-css/navbar.css";
import "./platform-css/videos.css";
import "./platform-css/catalogFilters.css";
import "./platform-css/openDocs.css";
import "./platform-css/enseignantPage.css";
// Admin-only additions (tables, status chips…), built on the same --home-* tokens.
import "./admin.css";

// Same Arabic font as the platform, for Arabic titles.
const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata = {
  title: "Droussy TN · Admin",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={`home-page adm-body ${notoArabic.variable}`}>{children}</body>
    </html>
  );
}
