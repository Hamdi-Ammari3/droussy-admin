import AdminNavbar from "@/components/AdminNavbar";

export const dynamic = "force-dynamic";

export default function DashLayout({ children }) {
  return (
    <>
      <AdminNavbar />
      {children}
    </>
  );
}
