#!/usr/bin/env python3
"""
generate_portfolio_json.py
Admin 시트의 모든 포트폴리오 섹션을 읽어 data/portfolio.json 생성

수식 캐시 의존 제거:
- Price 시트에서 직접 최신 가격 조회 (update_watchlist.py가 실제 숫자로 기록)
- Admin F:L 열에서 실제 보유수량 합산
- valuation = qty * price * exchange_rate 로 Python에서 직접 계산
"""

import json
import os
import re
import openpyxl
from openpyxl.utils import column_index_from_string

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
XLSX_PATH = os.path.join(BASE_DIR, "..", "data", "watchlist.xlsx")
JSON_PATH = os.path.join(BASE_DIR, "..", "data", "portfolio.json")

KRX_EXCHANGES = {"KRX", "KOSPI", "KOSDAQ"}

SPECIAL = {
    "KRW":  {"currency": "KRW", "exchange": "—", "ticker": "KRW"},
    "USD":  {"currency": "USD", "exchange": "—", "ticker": "USD"},
    "USDT": {"currency": "USD", "exchange": "—", "ticker": "USDT"},
}


def build_info_lookup(wb):
    """Info 시트에서 name/symbol → (currency, exchange, ticker) 매핑"""
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


def build_price_lookup(wb):
    """Price 시트 각 컬럼에서 최신 실제 숫자값 추출 (col_index → price)"""
    ws = wb["Price"]
    prices = {}
    max_col = ws.max_column
    for col_idx in range(2, max_col + 1):
        for row_idx in range(2, min(ws.max_row + 1, 1000)):
            val = ws.cell(row_idx, col_idx).value
            if val is not None and isinstance(val, (int, float)):
                prices[col_idx] = float(val)
                break
    return prices


def build_info_price_lookup(wb, price_lookup):
    """Info 시트 행 번호 → 가격 매핑 (Price 시트 참조 수식 해석)"""
    ws = wb["Info"]
    info_prices = {}
    for row_idx in range(1, ws.max_row + 1):
        val = ws.cell(row_idx, 5).value  # E열 = Price
        if val is None:
            continue
        if isinstance(val, (int, float)):
            info_prices[row_idx] = float(val)
        elif isinstance(val, str):
            m = re.match(r"=INDEX\(Price!([A-Z]+):", val)
            if m:
                col_idx = column_index_from_string(m.group(1))
                info_prices[row_idx] = price_lookup.get(col_idx, 0.0)
    return info_prices


def resolve_N(row_num, ws_admin, info_prices, visited=None):
    """Admin N열(가격) 해석: =Info!E{n}, =N{n} 체인, 또는 리터럴 숫자"""
    if visited is None:
        visited = set()
    if row_num in visited:
        return 0.0
    visited.add(row_num)

    cell_val = ws_admin.cell(row_num, 14).value  # N열 = 14번째
    if cell_val is None:
        return 0.0
    if isinstance(cell_val, (int, float)):
        return float(cell_val)
    m = re.match(r"=Info!E(\d+)", str(cell_val))
    if m:
        return info_prices.get(int(m.group(1)), 0.0)
    m = re.match(r"=N(\d+)", str(cell_val))
    if m:
        return resolve_N(int(m.group(1)), ws_admin, info_prices, visited)
    return 0.0


def resolve_O(row_num, ws_admin, info_prices, visited=None):
    """Admin O열(환율) 해석: =Info!E{n}, =O{n} 체인, 또는 리터럴 숫자"""
    if visited is None:
        visited = set()
    if row_num in visited:
        return 1.0
    visited.add(row_num)

    val = ws_admin.cell(row_num, 15).value  # O열 = 15번째
    if val is None:
        return 1.0
    if isinstance(val, (int, float)):
        return float(val)
    m = re.match(r"=Info!E(\d+)", str(val))
    if m:
        return info_prices.get(int(m.group(1)), 1.0)
    m = re.match(r"=O(\d+)", str(val))
    if m:
        return resolve_O(int(m.group(1)), ws_admin, info_prices, visited)
    return 1.0


def parse_admin_sheet(wb, info_lookup, info_prices):
    ws = wb["Admin"]
    portfolios = {}
    current_section = None

    for row_idx in range(1, ws.max_row + 1):
        a = ws.cell(row_idx, 1).value
        b = ws.cell(row_idx, 2).value

        if a is None and b is None:
            continue

        # 섹션 헤더: B열이 None이고 A열에 이름
        if b is None and a is not None:
            a_str = str(a).strip()
            # 헤더행 레이블(열 제목행) 제외
            if a_str in ("KRW value",):
                continue
            current_section = a_str
            portfolios[current_section] = []
            continue

        if current_section is None or b is None:
            continue

        # 헤더 레이블행 건너뜀 (B열이 'Stock # ' 같은 헤더인 경우)
        b_str = str(b).strip()
        if b_str in ("Stock # ", "Stock price", "Fiat rate", "KRW value"):
            continue

        name     = b_str
        category = str(a).strip()

        # qty: F:L열 합산 (col 6~12)
        qty = sum(
            float(ws.cell(row_idx, c).value)
            for c in range(6, 13)
            if ws.cell(row_idx, c).value is not None
                and isinstance(ws.cell(row_idx, c).value, (int, float))
        )

        # price: N열 (col 14)
        price = resolve_N(row_idx, ws, info_prices)

        # exchange_rate: O열 (col 15)
        exchange_rate = resolve_O(row_idx, ws, info_prices)

        valuation = qty * price * exchange_rate

        # 메타 정보
        if name in SPECIAL:
            meta = SPECIAL[name]
        elif name in info_lookup:
            meta = info_lookup[name]
        else:
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


def load_prev_totals():
    """기존 portfolio.json에서 각 멤버 총액 계산 → _prev_totals로 저장"""
    if not os.path.exists(JSON_PATH):
        return None
    try:
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            existing = json.load(f)
        members = ["Susie", "Dirac & Broglie", "Jintae", "Hyunhee"]
        prev = {}
        for m in members:
            holdings = existing.get(m, [])
            prev[m] = sum(h.get("valuation", 0) for h in holdings)
        return prev
    except Exception as e:
        print(f"[warn] prev_totals 로드 실패: {e}")
        return None


def main():
    prev_totals = load_prev_totals()

    # data_only=False: 수식 문자열을 직접 파싱하기 위해
    wb = openpyxl.load_workbook(XLSX_PATH, data_only=False)
    info_lookup   = build_info_lookup(wb)
    price_lookup  = build_price_lookup(wb)
    info_prices   = build_info_price_lookup(wb, price_lookup)
    portfolios    = parse_admin_sheet(wb, info_lookup, info_prices)

    portfolios["_prev_totals"] = prev_totals

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(portfolios, f, ensure_ascii=False, indent=2)

    summary = {k: len(v) if isinstance(v, list) else v for k, v in portfolios.items()}
    print(f"portfolio.json 생성 완료: {summary}")


if __name__ == "__main__":
    main()
