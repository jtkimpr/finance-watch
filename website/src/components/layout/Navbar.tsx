"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/about",  label: "Company" },
  { href: "/family", label: "Investments" },
  { href: "/mstr",   label: "STRC" },
];

const DEFAULT_ADMIN_PASSWORD = "jintae.kim.dnb@gmail.com";
const DEFAULT_INVESTMENTS_PASSWORD = "980612";

function AdminModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"verify" | "manage">("verify");
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyError, setVerifyError] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState(false);
  const [locked, setLocked] = useState(false);

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const current = localStorage.getItem("dnb_admin_password") || DEFAULT_ADMIN_PASSWORD;
    if (verifyInput === current) {
      setStep("manage");
    } else {
      setVerifyError(true);
      setVerifyInput("");
    }
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPass.length < 1) {
      setPassError("Please enter a new password.");
      return;
    }
    if (newPass !== confirmPass) {
      setPassError("Passwords do not match.");
      return;
    }
    localStorage.setItem("dnb_password", newPass);
    setPassSuccess(true);
    setPassError("");
    setNewPass("");
    setConfirmPass("");
    setTimeout(() => setPassSuccess(false), 2500);
  }

  function handleLock() {
    sessionStorage.removeItem("dnb_auth");
    setLocked(true);
    setTimeout(() => setLocked(false), 2000);
  }

  return (
    <>
      {/* 백드롭 */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: 100,
        }}
      />

      {/* 모달 */}
      <div
        style={{
          position: "fixed",
          top: 64, right: 24,
          background: "#111113",
          border: "1px solid #28282e",
          borderRadius: 12,
          padding: "32px 36px",
          width: 340,
          zIndex: 101,
          boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
        }}
      >
        {step === "verify" ? (
          <>
            <p style={{ fontWeight: 700, fontSize: 16, color: "#f0f0ee", marginBottom: 6 }}>Admin</p>
            <p style={{ fontSize: 13, color: "#60606a", marginBottom: 24 }}>
              Enter the current password to continue.
            </p>
            <form onSubmit={handleVerify}>
              <input
                type="text"
                value={verifyInput}
                onChange={(e) => { setVerifyInput(e.target.value); setVerifyError(false); }}
                placeholder="Current password"
                autoFocus
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "#0c0c0e",
                  border: `1px solid ${verifyError ? "#ef4444" : "#28282e"}`,
                  borderRadius: 6, padding: "9px 12px",
                  color: "#f0f0ee", fontSize: 14, outline: "none",
                  marginBottom: verifyError ? 6 : 16,
                }}
              />
              {verifyError && (
                <p style={{ color: "#ef4444", fontSize: 12, marginBottom: 12 }}>
                  Incorrect password.
                </p>
              )}
              <button type="submit" style={{
                width: "100%", background: "#FA660F", color: "#fff",
                fontWeight: 700, fontSize: 13, border: "none",
                borderRadius: 6, padding: "9px 0", cursor: "pointer",
              }}>
                Verify
              </button>
            </form>
          </>
        ) : (
          <>
            <p style={{ fontWeight: 700, fontSize: 16, color: "#f0f0ee", marginBottom: 24 }}>Admin Panel</p>

            {/* 비밀번호 변경 */}
            <p style={{ fontSize: 12, color: "#60606a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Investments Password
            </p>
            <form onSubmit={handleChangePassword}>
              <input
                type="password"
                value={newPass}
                onChange={(e) => { setNewPass(e.target.value); setPassError(""); setPassSuccess(false); }}
                placeholder="New password"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "#0c0c0e", border: "1px solid #28282e",
                  borderRadius: 6, padding: "9px 12px",
                  color: "#f0f0ee", fontSize: 14, outline: "none", marginBottom: 8,
                }}
              />
              <input
                type="password"
                value={confirmPass}
                onChange={(e) => { setConfirmPass(e.target.value); setPassError(""); setPassSuccess(false); }}
                placeholder="Confirm new password"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "#0c0c0e",
                  border: `1px solid ${passError ? "#ef4444" : "#28282e"}`,
                  borderRadius: 6, padding: "9px 12px",
                  color: "#f0f0ee", fontSize: 14, outline: "none",
                  marginBottom: passError ? 6 : 12,
                }}
              />
              {passError && (
                <p style={{ color: "#ef4444", fontSize: 12, marginBottom: 10 }}>{passError}</p>
              )}
              {passSuccess && (
                <p style={{ color: "#22c55e", fontSize: 12, marginBottom: 10 }}>Password updated!</p>
              )}
              <button type="submit" style={{
                width: "100%", background: "#FA660F", color: "#fff",
                fontWeight: 700, fontSize: 13, border: "none",
                borderRadius: 6, padding: "9px 0", cursor: "pointer",
              }}>
                Update Password
              </button>
            </form>

            {/* 구분선 */}
            <div style={{ borderTop: "1px solid #28282e", margin: "20px 0" }} />

            {/* Investments 잠금 */}
            <p style={{ fontSize: 12, color: "#60606a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Session
            </p>
            <button
              onClick={handleLock}
              style={{
                width: "100%",
                background: locked ? "#1a1a1e" : "#1a1a1e",
                color: locked ? "#22c55e" : "#a0a0a8",
                fontWeight: 600, fontSize: 13,
                border: "1px solid #28282e",
                borderRadius: 6, padding: "9px 0", cursor: "pointer",
              }}
            >
              {locked ? "Locked ✓" : "Lock Investments"}
            </button>
          </>
        )}

        {/* 닫기 */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 12, right: 14,
            background: "none", border: "none",
            color: "#60606a", fontSize: 18, cursor: "pointer", lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
    </>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [showAdmin, setShowAdmin] = useState(false);

  return (
    <>
      <header
        className="w-full px-4 sm:px-8"
        style={{ background: "#FA660F", flexShrink: 0, position: "sticky", top: 0, zIndex: 50 }}
      >
        <div className="flex flex-wrap items-center">
          {/* 로고 */}
          <Link
            href="/about"
            className="h-12 flex items-center"
            style={{
              fontFamily: "var(--font-inter), Arial, sans-serif",
              fontWeight: 900,
              fontSize: "clamp(18px, 5vw, 26px)",
              color: "#1a0800",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            Dirac &amp; Broglie
          </Link>

          {/* 중앙 슬롯 — STRC 페이지에서 포털로 주입 (데스크탑만) */}
          <div id="navbar-center" className="hidden sm:flex flex-1 justify-center items-center h-12" />

          {/* 메뉴 — 모바일: 로고 아래 줄; 데스크탑: 우측 inline */}
          <nav className="flex items-center gap-0.5 sm:gap-1.5 w-full sm:w-auto sm:ml-auto pb-2 sm:pb-0 h-9 sm:h-12 flex-shrink-0">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    fontFamily: "var(--font-inter), Arial, sans-serif",
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: "#000000",
                    letterSpacing: "normal",
                    textDecoration: "none",
                    padding: "5px 10px",
                    borderRadius: 4,
                    background: isActive ? "rgba(0,0,0,0.13)" : "transparent",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* 관리자 아이콘 */}
            <button
              onClick={() => setShowAdmin(true)}
              className="ml-1 flex items-center justify-center"
              style={{ color: "#000000", width: 30, height: 30, background: "none", border: "none", cursor: "pointer" }}
              title="Admin"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </button>
          </nav>
        </div>
      </header>

      {showAdmin && <AdminModal onClose={() => setShowAdmin(false)} />}
    </>
  );
}
