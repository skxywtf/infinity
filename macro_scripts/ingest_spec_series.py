"""
WTFXAI - Spec Series Ingestion
Adds all NEW series from the developer data spec.
Does NOT touch series already in ingest_data.py - purely additive.

Run after migrate_spec.py:
    python -m macro_scripts.ingest_spec_series
"""

import os, io, csv, time, requests, zipfile
import pandas as pd
import xml.etree.ElementTree as ET
from datetime import datetime
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "")
FRED_API_KEY = os.getenv("FRED_API_KEY", "")
if DATABASE_URL.startswith("postgres://"): DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
if "?" not in DATABASE_URL: DATABASE_URL += "?sslmode=require"
engine = create_engine(DATABASE_URL)


def fetch_fred(series_id: str, start: str = "2000-01-01") -> pd.DataFrame:
    url = "https://api.stlouisfed.org/fred/series/observations"
    params = {"series_id": series_id, "api_key": FRED_API_KEY, "file_type": "json", "observation_start": start, "sort_order": "asc"}
    resp = requests.get(url, params=params, timeout=15)
    resp.raise_for_status()
    rows = [{"date": obs["date"], "value": float(obs["value"])} for obs in resp.json().get("observations", []) if obs["value"] not in (".", "")]
    return pd.DataFrame(rows)


def save_series(series_id, title, source, tab_name, tab_order, frequency, category, df, sub_category=None, bloomberg_equiv=None, chart_type="line"):
    if df.empty: print(f"  skip {title}"); return
    try:
        with engine.begin() as conn:
            conn.execute(text("""INSERT INTO series_metadata (series_id,title,source,tab_name,tab_order,frequency,category,sub_category,bloomberg_equiv,chart_type)
                VALUES (:sid,:title,:source,:tab,:order,:freq,:cat,:sub,:bbg,:ctype)
                ON CONFLICT (series_id) DO UPDATE SET tab_name=EXCLUDED.tab_name,tab_order=EXCLUDED.tab_order,
                category=EXCLUDED.category,sub_category=EXCLUDED.sub_category,bloomberg_equiv=EXCLUDED.bloomberg_equiv,chart_type=EXCLUDED.chart_type;"""),
                {"sid":series_id,"title":title,"source":source,"tab":tab_name,"order":tab_order,"freq":frequency,"cat":category,"sub":sub_category,"bbg":bloomberg_equiv,"ctype":chart_type})
            rows = [{"series_id":series_id,"date":r["date"],"value":r["value"]} for _,r in df.iterrows()]
            conn.execute(text("INSERT INTO macro_data(series_id,date,value) VALUES(:series_id,:date,:value) ON CONFLICT(series_id,date) DO NOTHING;"), rows)
        print(f"  ok {title} - {len(df)} rows")
    except Exception as e: print(f"  ERR {title}: {e}")


TREASURY_MATURITY_MAP = {
    "d1Month":("t1m","1-Month Treasury Yield","DGS1MO","line"),
    "d2Month":("t2m","2-Month Treasury Yield",None,"line"),
    "d3Month":("t3m","3-Month Treasury Yield","DGS3MO","line"),
    "d6Month":("t6m","6-Month Treasury Yield","DGS6MO","line"),
    "d1Year":("t1y","1-Year Treasury Yield","DGS1","line"),
    "d2Year":("t2y","2-Year Treasury Yield","USGG2YR Index","line"),
    "d3Year":("t3y","3-Year Treasury Yield",None,"line"),
    "d5Year":("t5y","5-Year Treasury Yield","USGG5YR Index","line"),
    "d7Year":("t7y","7-Year Treasury Yield",None,"line"),
    "d10Year":("t10y","10-Year Treasury Yield","USGG10YR Index","line"),
    "d20Year":("t20y","20-Year Treasury Yield",None,"line"),
    "d30Year":("t30y","30-Year Treasury Yield","USGG30YR Index","line"),
}

def fetch_treasury_yield_curve(year: int):
    url = f"https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value={year}"
    resp = requests.get(url, timeout=20); resp.raise_for_status()
    root = ET.fromstring(resp.content)
    entries = root.findall(".//{http://www.w3.org/2005/Atom}entry") or root.findall(".//entry")
    data = {k: [] for k in TREASURY_MATURITY_MAP}
    for entry in entries:
        content = entry.find("{http://www.w3.org/2005/Atom}content") or entry.find("content")
        if content is None: continue
        date_el = None
        for child in content.iter():
            if child.tag.endswith("NEW_DATE"): date_el = child; break
        if date_el is None or not date_el.text: continue
        obs_date = date_el.text[:10]
        for xml_key in TREASURY_MATURITY_MAP:
            val_el = None
            for child in content.iter():
                if child.tag.endswith(xml_key): val_el = child; break
            if val_el is not None and val_el.text:
                try: data[xml_key].append({"date": obs_date, "value": float(val_el.text)})
                except ValueError: pass
    return data

def ingest_treasury_yield_curve():
    cy = datetime.now().year; years = list(range(cy-5, cy+1))
    combined = {k: [] for k in TREASURY_MATURITY_MAP}
    for yr in years:
        print(f"  Treasury yield curve {yr}...")
        try:
            d = fetch_treasury_yield_curve(yr)
            for k, rows in d.items(): combined[k].extend(rows)
            time.sleep(0.3)
        except Exception as e: print(f"    year {yr}: {e}")
    for xml_key, (slug, title, bbg, ctype) in TREASURY_MATURITY_MAP.items():
        df = pd.DataFrame(combined[xml_key]).drop_duplicates("date")
        save_series(slug.upper(), title, "US Treasury", "Yield Curve & Credit", 10, "Daily", "rates", df, "yield_curve", bbg, ctype)

CFTC_BASE = "https://www.cftc.gov/files/dea/history/fut_fin_txt_{year}.zip"
COT_MARKETS = {"E-MINI S&P 500 STOCK INDEX": "cot_sp500_net", "10-YEAR U.S. TREASURY NOTES": "cot_treasury_net"}

def ingest_cot():
    cy = datetime.now().year; years = list(range(cy-3, cy+1))
    combined = {v: [] for v in COT_MARKETS.values()}
    for year in years:
        print(f"  CFTC COT {year}...")
        try:
            resp = requests.get(CFTC_BASE.format(year=year), timeout=30); resp.raise_for_status()
            with zipfile.ZipFile(io.BytesIO(resp.content)) as z:
                fname = z.namelist()[0]
                with z.open(fname) as f:
                    reader = csv.DictReader(io.TextIOWrapper(f, encoding="latin-1"))
                    for row in reader:
                        market = row.get("Market_and_Exchange_Names", "").strip().upper()
                        for mn, slug in COT_MARKETS.items():
                            if mn in market:
                                try:
                                    dt = datetime.strptime(row["As_of_Date_In_Form_YYMMDD"].strip(), "%y%m%d")
                                    net = float(row["NonComm_Positions_Long_All"].replace(",","")) - float(row["NonComm_Positions_Short_All"].replace(",",""))
                                    combined[slug].append({"date": dt.strftime("%Y-%m-%d"), "value": net})
                                except (KeyError, ValueError): pass
            time.sleep(0.5)
        except Exception as e: print(f"    year {year}: {e}")
    titles = {"cot_sp500_net": ("COT Net Non-Commercial (S&P 500 Futures)", "SPX CFTC Index"), "cot_treasury_net": ("COT Net Non-Commercial (10Y Treasury Futures)", "TY1 CFTC Index")}
    for slug, (title, bbg) in titles.items():
        save_series(slug.upper(), title, "CFTC", "Positioning", 14, "Weekly", "positioning", pd.DataFrame(combined[slug]).drop_duplicates("date") if combined[slug] else pd.DataFrame(), bloomberg_equiv=bbg, chart_type="bar")

NEW_FRED_SERIES = [
    ("DGS2","2-Year Treasury Yield","Yield Curve & Credit",10,"Daily","rates","yield_curve","USGG2YR Index","line"),
    ("DGS5","5-Year Treasury Yield","Yield Curve & Credit",10,"Daily","rates","yield_curve","USGG5YR Index","line"),
    ("DGS10","10-Year Treasury Yield","Yield Curve & Credit",10,"Daily","rates","yield_curve","USGG10YR Index","line"),
    ("DGS30","30-Year Treasury Yield","Yield Curve & Credit",10,"Daily","rates","yield_curve","USGG30YR Index","line"),
    ("SOFR","SOFR Rate","Yield Curve & Credit",10,"Daily","rates","overnight","SOFRRATE Index","line"),
    ("T10YIE","10Y Breakeven Inflation (TIPS)","Inflation & Prices",3,"Daily","inflation","breakeven","USGGBE10 Index","line"),
    ("BAMLC0A0CM","IG Credit Spread (OAS)","Yield Curve & Credit",10,"Daily","credit","ig_spread","LUACOAS Index","line"),
    ("VIXCLS","VIX Volatility Index","Sentiment & Risk",11,"Daily","sentiment","volatility","VIX Index","line"),
    ("NFCI","Chicago Fed Financial Conditions","Sentiment & Risk",11,"Weekly","financial_conditions",None,"NFCI Index","line"),
    ("MORTGAGE30US","30-Year Fixed Mortgage Rate","Housing",12,"Weekly","housing","rates","MTGEFNM30 Index","line"),
    ("HOUST","Housing Starts","Housing",12,"Monthly","housing","starts","USHSTART Index","bar"),
    ("CSUSHPISA","Case-Shiller Home Price Index","Housing",12,"Monthly","housing","prices","SPCSUSA Index","line"),
    ("RECPROUSM156N","Recession Probability (Smoothed)","Output / Growth",1,"Monthly","regime","recession_prob",None,"area"),
    ("DCOILWTICO","WTI Crude Oil Price","Commodities",13,"Daily","commodities","energy","CL1 Comdty","line"),
    ("GOLDAMGBD228NLBM","Gold Price (London Fix)","Commodities",13,"Daily","commodities","metals","XAU Curncy","line"),
    ("JTSJOL","JOLTS Job Openings","Labor Market",4,"Monthly","labor","openings","INJOLTOT Index","bar"),
    ("CES0500000003","Avg Hourly Earnings (All Workers)","Labor Market",4,"Monthly","labor","wages","AHE YOY Index","line"),
    ("ICSA","Initial Jobless Claims","Labor Market",4,"Weekly","labor","claims","INJCJC Index","line"),
    ("WALCL","Fed Balance Sheet Total Assets","Monetary / Credit",6,"Weekly","monetary","balance_sheet","FARBAST Index","area"),
    ("WRBWFRBL","Reserve Balances at Fed","Monetary / Credit",6,"Weekly","monetary","reserves",None,"line"),
    ("RSAFS","Retail Sales (Advance)","Income & Spending",2,"Monthly","consumption",None,"RSTAMOM Index","bar"),
    ("UMCSENT","Univ. of Michigan Consumer Sentiment","Sentiment & Risk",11,"Monthly","sentiment","consumer","CONSSENT Index","line"),
]

def main():
    print("WTFXAI Spec Series Ingestion starting...")
    for (sid,title,tab,order,freq,cat,sub,bbg,ctype) in NEW_FRED_SERIES:
        try:
            df = fetch_fred(sid)
            save_series(sid,title,"FRED",tab,order,freq,cat,df,sub,bbg,ctype)
            time.sleep(0.15)
        except Exception as e: print(f"  ERR {title}: {e}")
    print("\nTreasury Yield Curve...")
    ingest_treasury_yield_curve()
    print("\nCFTC COT...")
    ingest_cot()
    print("\nDone. Run ingest_rss_feeds.py next.")

if __name__ == "__main__": main()
