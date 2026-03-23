export default function HomePage() {
  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-10">
        <h2 className="text-3xl font-bold" style={{ color: "#f0f0ee" }}>대시보드</h2>
        <p className="text-sm mt-1" style={{ color: "#60606a" }}>Dirac &amp; Broglie 자산 현황 요약</p>
      </div>

      {/* 주요 지표 — strategy.com 스타일: 테두리 없이 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-0" style={{ borderBottom: "1px dashed #28282e" }}>
        {[
          { label: "총 자산", value: "—", unit: "원" },
          { label: "부동산 자산", value: "—", unit: "원" },
          { label: "유가증권 자산", value: "—", unit: "원" },
        ].map((card, i) => (
          <div
            key={card.label}
            className="py-8 px-6"
            style={{
              borderRight: i < 2 ? "1px dashed #28282e" : "none",
            }}
          >
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#60606a" }}>
              {card.label}
            </p>
            <p className="text-4xl font-bold" style={{ color: "#f0f0ee" }}>
              {card.value}
            </p>
            <p className="text-sm mt-2" style={{ color: "#60606a" }}>{card.unit}</p>
          </div>
        ))}
      </div>

      {/* 안내 메시지 */}
      <div className="mt-10 px-4 py-3 rounded-lg text-sm" style={{ background: "#1a1a1e", color: "#60606a", border: "1px solid #28282e" }}>
        데이터를 입력하면 이 화면에 자산 현황이 자동으로 표시돼요.
      </div>
    </div>
  );
}
