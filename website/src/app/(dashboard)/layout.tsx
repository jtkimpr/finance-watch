import Navbar from "@/components/layout/Navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0c0c0e" }}>
      <Navbar />
      <main className="flex-1 px-4 sm:px-8 lg:px-12 py-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
