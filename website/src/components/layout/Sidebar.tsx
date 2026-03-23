"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/about",         label: "법인 소개",            icon: "🏢" },
  { href: "/securities",    label: "유가증권 포트폴리오",  icon: "📈" },
  { href: "/mstr",          label: "MSTR Preferred",       icon: "₿" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-56 min-h-screen flex flex-col"
      style={{ background: "#0e0e10", borderRight: "1px solid #1e1e24" }}
    >
      {/* 로고 */}
      <div className="px-5 py-7" style={{ borderBottom: "1px solid #1e1e24" }}>
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "#60606a" }}>
          Family Office
        </p>
        <h1 className="text-base font-semibold" style={{ color: "#d4a853" }}>
          Dirac &amp; Broglie
        </h1>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-2 py-5 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors"
              style={{
                background: isActive ? "#1e1e26" : "transparent",
                color: isActive ? "#d4a853" : "#8a8a92",
              }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 로그아웃 */}
      <div className="px-2 py-4" style={{ borderTop: "1px solid #1e1e24" }}>
        <button
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors"
          style={{ color: "#60606a" }}
        >
          <span>🔓</span>
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
