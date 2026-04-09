"""
Strategy Dashboard — 가격 자동 업데이트 스크립트
GitHub Actions에서 하루 2회 실행 (00:00, 12:00 KST)
"""

import csv
import json
import os
import time
import urllib.request
from datetime import datetime, timezone, timedelta

import yfinance as yf

# KST 기준 오늘 날짜
KST = timezone(timedelta(hours=9))
today = datetime.now(KST).strftime("%Y-%m-%d")

FINNHUB_API_KEY = os.environ.get("FINNHUB_API_KEY")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "strategy")

RETRY_DELAY = 5  # 재시도 대기 시간 (초)


def fetch_finnhub(ticker):
    url = f"https://finnhub.io/api/v1/quote?symbol={ticker}&token={FINNHUB_API_KEY}"
    for attempt in range(2):
        try:
            with urllib.request.urlopen(url, timeout=15) as res:
                data = json.loads(res.read())
            price = data.get("c", 0)
            if not price or price == 0:
                raise ValueError(f"{ticker} 가격 0 반환 (장 휴장 또는 오류)")
            return round(price, 4)
        except Exception as e:
            if attempt == 0:
                print(f"  [finnhub] {ticker} 1차 실패 ({e}), {RETRY_DELAY}초 후 재시도...")
                time.sleep(RETRY_DELAY)
            else:
                raise


def fetch_yfinance(ticker):
    """yfinance 폴백 — Finnhub 403 또는 타임아웃 시 사용"""
    data = yf.Ticker(ticker)
    info = data.fast_info
    price = getattr(info, "last_price", None)
    if not price or price == 0:
        raise ValueError(f"{ticker} yfinance 가격 없음")
    return round(float(price), 4)


def fetch_finnhub_with_fallback(ticker):
    """Finnhub 우선, 실패 시 yfinance 폴백"""
    try:
        return fetch_finnhub(ticker)
    except Exception as finnhub_err:
        print(f"  [finnhub] {ticker}: {finnhub_err} → yfinance 폴백 시도")
        return fetch_yfinance(ticker)


def fetch_btc():
    url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
    for attempt in range(2):
        try:
            with urllib.request.urlopen(url, timeout=15) as res:
                data = json.loads(res.read())
            price = data["bitcoin"]["usd"]
            if not price or price == 0:
                raise ValueError("BTC 가격 0 반환")
            return round(price, 2)
        except Exception as e:
            if attempt == 0:
                print(f"  [coingecko] BTC 1차 실패 ({e}), {RETRY_DELAY}초 후 재시도...")
                time.sleep(RETRY_DELAY)
            else:
                raise


def update_csv(filename, price):
    path = os.path.join(DATA_DIR, filename)
    rows = []

    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    existing = next((r for r in rows if r["date"] == today), None)
    if existing:
        existing["price"] = price
        action = "업데이트"
    else:
        rows.append({"date": today, "price": price})
        action = "추가"

    rows.sort(key=lambda x: x["date"])
    with open(path, "w", newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["date", "price"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"[{today}] {filename}: {price} ({action})")


def main():
    tasks = [
        ("btc.csv",  "BTC",  fetch_btc),
        ("mstr.csv", "MSTR", lambda: fetch_finnhub_with_fallback("MSTR")),
        ("strf.csv", "STRF", lambda: fetch_finnhub_with_fallback("STRF")),
        ("strk.csv", "STRK", lambda: fetch_finnhub_with_fallback("STRK")),
        ("strc.csv", "STRC", lambda: fetch_finnhub_with_fallback("STRC")),
        ("strd.csv", "STRD", lambda: fetch_finnhub_with_fallback("STRD")),
    ]

    errors = []
    for filename, ticker, fetch_fn in tasks:
        try:
            price = fetch_fn()
            update_csv(filename, price)
        except Exception as e:
            print(f"[오류] {ticker}: {e}")
            errors.append(ticker)

    if errors:
        print(f"\n⚠️  일부 티커 업데이트 실패 (워크플로우는 계속 진행): {', '.join(errors)}")
    else:
        print("\n모든 데이터 업데이트 완료")


if __name__ == "__main__":
    main()
