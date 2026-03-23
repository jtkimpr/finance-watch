#!/usr/bin/env python3
"""
generate_portfolio_json.py
Admin 시트의 모든 포트폴리오 섹션을 읽어 data/portfolio.json 생성
- 섹션 헤더(B열=None) 기준으로 구분
- Info 시트에서 거래소/통화 정보 교차 참조
"""

import json
import os
import openpyxl

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
XLSX_PATH = os.path.join(BASE_DIR, "..", "data", "watchlist.xlsx")
JSON_PATH = os.path.join(BASE_DIR, "..", "data", "portfolio.json")

KRX_EXCHANGES = {"KRX", "KOSPI", "KOSDAQ"}

# 거래소 정보 없이 통화가 명확한 특수 항목
SPECIAL = {
    "KRW":  {"currency": "KRW", "exchange": "—", "ticker": "KRW"},
    "USD":  {"currency": "USD", "exchange": "—", "ticker": "USD"},
    "USDT": {"currency": "USD", "exchange": "—", "ticker": "USDT"},
}


def build_info_lookup(wb):
    """Info 시트에서 name/symbol → (currency, exchange, ticker) 매핑 생성"""
    ws = wb["Info"]
    lookup = {}
    for row in ws.iter_rows(min_row=2, values_only=True):
        if row[0] is None:
            continue
        name     = str(row[0]).strip()
        symbol   = str(row[1]).strip() if row[1] else ""
        exchange = str(row[2]).strip() if row[2] else ""
        currency = "KRW" if exchange in KRX_EXCHANGES else "USD"
        entry = {"currency": currency, "exchange": exchange, "ticker": symbol or name}
        lookup[name] = entry
        if symbol:
            lookup[symbol] = entry
    return lookup


def parse_admin_sheet(wb, info_lookup):
    ws = wb["Admin"]
    portfolios = {}
    current_section = None

    for row in ws.iter_rows(min_col=1, max_col=14, values_only=True):
        a, b = row[0], row[1]

        # 빈 행(구분자)
        if a is None and b is None:
            continue

        # 섹션 헤더 행: B열이 None이고 A열에 이름이 있음
        if b is None and a is not None:
            current_section = str(a).strip()
            portfolios[current_section] = []
            continue

        if current_section is None or b is None:
            continue

        name      = str(b).strip()
        category  = str(a).strip()
        valuation = float(row[3])  if row[3]  is not None else 0.0  # D열: 평가금액
        qty       = float(row[4])  if row[4]  is not None else 0.0  # E열: 보유수량
        price     = float(row[13]) if row[13] is not None else 0.0  # N열: 현재가

        # 통화·거래소·티커 결정
        if name in SPECIAL:
            meta = SPECIAL[name]
        elif name in info_lookup:
            meta = info_lookup[name]
        else:
            # 폴백: 대문자 라틴 문자 위주면 USD, 아니면 KRW
            is_latin = all(c.isascii() for c in name.replace(" ", ""))
            meta = {
                "currency": "USD" if is_latin else "KRW",
                "exchange": "—",
                "ticker":   name,
            }

        portfolios[current_section].append({
            "name":      name,
            "ticker":    meta["ticker"],
            "exchange":  meta["exchange"],
            "category":  category,
            "currency":  meta["currency"],
            "qty":       qty,
            "price":     price,
            "valuation": valuation,
        })

    return portfolios


def main():
    wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
    info_lookup  = build_info_lookup(wb)
    portfolios   = parse_admin_sheet(wb, info_lookup)

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(portfolios, f, ensure_ascii=False, indent=2)

    summary = {k: len(v) for k, v in portfolios.items()}
    print(f"portfolio.json 생성 완료: {summary}")


if __name__ == "__main__":
    main()
