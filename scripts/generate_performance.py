#!/usr/bin/env python3
"""
watchlist.xlsx의 Summary 시트에서 성과 데이터를 추출하여
data/performance.json으로 저장합니다.
"""

import json
import openpyxl
from datetime import datetime, timedelta
from pathlib import Path

def generate_performance():
    """watchlist.xlsx에서 성과 데이터 추출 및 JSON 생성"""

    # 파일 경로 설정
    xlsx_path = Path(__file__).parent.parent / "data" / "watchlist.xlsx"
    json_path = Path(__file__).parent.parent / "data" / "performance.json"

    if not xlsx_path.exists():
        print(f"Error: {xlsx_path} not found")
        return False

    try:
        # watchlist.xlsx 읽기
        wb = openpyxl.load_workbook(str(xlsx_path), data_only=True)
        if "Summary" not in wb.sheetnames:
            print("Error: Summary sheet not found in watchlist.xlsx")
            return False

        ws = wb["Summary"]

        # 날짜와 Total 데이터 추출 (row 4부터 시작)
        data_by_date = {}
        for row in ws.iter_rows(min_row=4, values_only=True):
            if row[0] and isinstance(row[0], datetime):
                date = row[0].date()
                total = row[1]
                if isinstance(total, (int, float)):
                    data_by_date[date] = total

        if not data_by_date:
            print("Error: No data found in Summary sheet")
            return False

        # 현재 데이터 (가장 최근 날짜)
        today = max(data_by_date.keys())
        current_total = data_by_date[today]

        # 변화율 계산 함수
        def calc_change(days_ago):
            target_date = today - timedelta(days=days_ago)

            # 정확한 날짜가 없으면 가장 가까운 날짜 찾기
            if target_date not in data_by_date:
                closest_date = min(
                    data_by_date.keys(),
                    key=lambda d: abs((d - target_date).days)
                )
                # 5일 이상 차이나면 None 반환
                if abs((closest_date - target_date).days) > 5:
                    return None
                target_date = closest_date

            prev_total = data_by_date[target_date]
            change_pct = ((current_total - prev_total) / prev_total) * 100
            return round(change_pct, 2)

        # 성과 데이터 생성
        performance = {
            "date": today.isoformat(),
            "current": int(current_total),
            "changes": {
                "day_1": calc_change(1),
                "day_7": calc_change(7),
                "day_30": calc_change(30),
                "day_60": calc_change(60),
            }
        }

        # JSON 저장
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(performance, f, indent=2, ensure_ascii=False)

        print(f"✅ Performance data saved to {json_path}")
        print(f"   Date: {performance['date']}")
        print(f"   Current: ₩{performance['current']:,}")
        print(f"   Changes: {performance['changes']}")

        return True

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = generate_performance()
    exit(0 if success else 1)
