import Navbar from "@/components/layout/Navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0c0c0e" }}>
      <Navbar />
      <main className="flex-1 px-12 py-10">
        {children}
      </main>
    </div>
  );
}
