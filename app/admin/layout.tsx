import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";

export const metadata = {
  title: "Admin",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900">
      <AdminHeader />

      <main className="mx-auto max-w-[1600px] px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
          <AdminSidebar />
          <div>{children}</div>
        </div>
      </main>
    </div>
  );
}
