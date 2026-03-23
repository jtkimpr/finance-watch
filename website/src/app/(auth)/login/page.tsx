"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "dnb2024") {
      router.push("/home");
    } else {
      setError("비밀번호가 올바르지 않아요.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0c0c0e" }}>
      <div className="w-full max-w-sm px-10 py-12" style={{ border: "1px solid #1e1e24", borderRadius: 16, background: "#111113" }}>
        <div className="text-center mb-10">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "#60606a" }}>
            Family Office
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "#d4a853" }}>
            Dirac &amp; Broglie
          </h1>
          <p className="text-sm mt-2" style={{ color: "#60606a" }}>
            내부 포털에 오신 것을 환영합니다
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className="block text-sm mb-2" style={{ color: "#8a8a92" }}>
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none"
              style={{
                background: "#1a1a1e",
                border: "1px solid #2a2a30",
                color: "#f0f0ee",
              }}
            />
          </div>

          {error && <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>}

          <button
            type="submit"
            className="w-full py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85"
            style={{ background: "#d4a853", color: "#0c0c0e" }}
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}
