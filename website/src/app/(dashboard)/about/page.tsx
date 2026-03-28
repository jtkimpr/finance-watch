export default function AboutPage() {
  return (
    <div style={{ color: "#f0f0ee" }}>

      {/* ── HERO: 헤드라인 + 설명 ── */}
      <section className="pt-4 pb-10 md:pb-16"
        style={{ borderBottom: "1px solid #28282e" }}>

        {/* 헤드라인 + 설명 */}
        <div>
          <h1
            className="leading-tight mb-6 md:mb-10"
            style={{
              fontFamily: "var(--font-inter), Arial, sans-serif",
              fontWeight: 900,
              fontSize: "clamp(28px, 4vw, 52px)",
              letterSpacing: "-0.03em",
              color: "#f0f0ee",
            }}
          >
            We invest in assets<br />
            that endure<br />
            across generations.
          </h1>

          {/* 구분선 */}
          <div style={{ width: 80, height: 4, background: "#FA660F", marginBottom: 32, borderRadius: 2 }} />

          <h3
            className="mb-4"
            style={{
              fontFamily: "var(--font-inter), Arial, sans-serif",
              fontSize: "clamp(15px, 1.6vw, 20px)",
              fontWeight: 600,
              color: "#f0f0ee",
            }}
          >
            About Dirac &amp; Broglie
          </h3>
          <p style={{ fontSize: "clamp(13px, 1.4vw, 18px)", fontWeight: 400, lineHeight: "1.7", color: "#a0a0a8", maxWidth: 460, marginBottom: 20 }}>
            Dirac &amp; Broglie is a family investment office established to grow
            and preserve wealth through systematic, long-term investment in
            securities and real estate.
          </p>
          <p style={{ fontSize: "clamp(13px, 1.4vw, 18px)", fontWeight: 400, lineHeight: "1.7", color: "#a0a0a8", maxWidth: 460 }}>
            Guided by conservative risk management principles, we make rational
            investment decisions aligned with market cycles — investing only in
            assets we fully understand, with the goal of compounding wealth
            across generations.
          </p>
        </div>
      </section>

      {/* ── 투자 철학 ── */}
      <section className="py-10 md:py-16" style={{ borderBottom: "1px solid #28282e" }}>
        <p style={{ fontSize: "clamp(15px, 1.6vw, 20px)", fontWeight: 600, color: "#f0f0ee", marginBottom: 40 }}>
          Investment Philosophy
        </p>
        <div className="grid grid-cols-1 gap-10">
          {[
            {
              num: "01",
              title: "Focus on cycles, not noise",
              desc: "We prioritize long-term trends over short-term volatility, targeting stable compounding growth.",
            },
            {
              num: "02",
              title: "Clarity before conviction",
              desc: "We only invest in assets whose fundamentals and risks we can clearly articulate and evaluate.",
            },
            {
              num: "03",
              title: "Margin of safety first",
              desc: "Leverage is used sparingly. We maintain a margin of safety by stress-testing against multiple scenarios.",
            },
          ].map((item, i) => (
            <div
              key={item.num}
              className="pr-0 text-left"
              style={{ borderRight: "none", paddingLeft: 0 }}
            >
              <p
                className="mb-5"
                style={{
                  fontFamily: "var(--font-inter), Arial, sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(28px, 3.5vw, 48px)",
                  color: "#FA660F",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                {item.num}
              </p>
              <p style={{ fontSize: "clamp(15px, 1.6vw, 20px)", fontWeight: 600, color: "#f0f0ee", marginBottom: 16 }}>{item.title}</p>
              <p style={{ fontSize: "clamp(13px, 1.4vw, 18px)", fontWeight: 400, lineHeight: "1.7", color: "#a0a0a8" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 기본 정보 (하단, 심플) ── */}
      <section className="py-8 md:py-10">
        <p className="text-xs uppercase tracking-widest mb-6" style={{ color: "#60606a" }}>Company Info</p>
        <div className="flex flex-wrap gap-x-14 gap-y-4" style={{ fontSize: "clamp(12px, 1.2vw, 16px)" }}>
          {[
            ["Entity", "유한회사 디랙앤브로이 (Dirac & Broglie)"],
            ["Representative", "김수지"],
            ["Address", "경기도 용인시 기흥구 동백중앙로 73, 5203-1402"],
            ["Phone", "010-2678-3620"],
            ["Email", "jtkim.pr@gmail.com"],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-4">
              <span style={{ color: "#60606a", minWidth: 100, fontWeight: 500 }}>{label}</span>
              <span style={{ color: "#a0a0a8" }}>{value}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
