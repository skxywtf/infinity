import os
import json
import requests
import pandas as pd
from datetime import datetime
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# 1. Load Environment Variables
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
BEA_API_KEY = os.getenv("BEA_API_KEY")
FRED_API_KEY = os.getenv("FRED_API_KEY")
BLS_API_KEY = os.getenv("BLS_API_KEY")

# 2. Database Connection
engine = create_engine(DATABASE_URL)

def init_db():
    """Create the tables with a tab_order column for perfect dashboard sorting."""
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS series_metadata (
                series_id VARCHAR PRIMARY KEY,
                title VARCHAR,
                source VARCHAR,
                tab_name VARCHAR,
                tab_order INTEGER,
                frequency VARCHAR
            );
        """))
        try:
            conn.execute(text("ALTER TABLE series_metadata ADD COLUMN IF NOT EXISTS tab_order INTEGER;"))
        except:
            pass
            
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS macro_data (
                id SERIAL PRIMARY KEY,
                series_id VARCHAR REFERENCES series_metadata(series_id),
                date DATE,
                value NUMERIC,
                UNIQUE(series_id, date)
            );
        """))
        conn.commit()

def fetch_fred_data(series_id):
    """Fetch data from the FRED API."""
    print(f"Fetching {series_id} from FRED...")
    url = f"https://api.stlouisfed.org/fred/series/observations?series_id={series_id}&api_key={FRED_API_KEY}&file_type=json"
    response = requests.get(url).json()
    records = []
    for obs in response.get('observations', []):
        if obs['value'] != '.' and obs['value'] != '':
            records.append({'date': obs['date'], 'value': float(obs['value'])})
    return pd.DataFrame(records)

def fetch_world_bank_data(indicator):
    """Fetch global data directly from World Bank API."""
    print(f"Fetching {indicator} from World Bank...")
    url = f"https://api.worldbank.org/v2/country/WLD/indicator/{indicator}?format=json&per_page=100"
    response = requests.get(url).json()
    records = []
    if len(response) > 1:
        for item in response[1]:
            if item['value'] is not None:
                records.append({'date': f"{item['date']}-01-01", 'value': float(item['value'])})
    return pd.DataFrame(records)

def fetch_treasury_debt():
    """Fetch official daily public debt from the US Treasury API."""
    print("Fetching Public Debt from US Treasury...")
    url = "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=1000"
    try:
        response = requests.get(url).json()
        records = []
        for item in response.get('data', []):
            records.append({'date': item['record_date'], 'value': float(item['tot_pub_debt_out_amt'])})
        return pd.DataFrame(records).sort_values('date')
    except Exception as e:
        print(f"🚨 Treasury API Request Failed: {e}")
        return pd.DataFrame()

def fetch_bea_real_gdp():
    """Fetch Real GDP from the BEA API."""
    print("Fetching Real GDP from BEA...")
    url = f"https://apps.bea.gov/api/data?&UserID={BEA_API_KEY}&method=GetData&DataSetName=NIPA&TableName=T10106&Frequency=Q&Year=ALL&ResultFormat=JSON"
    response = requests.get(url).json()
    if 'Data' not in response.get('BEAAPI', {}).get('Results', {}):
        return pd.DataFrame() 
    data = response['BEAAPI']['Results']['Data']
    records = []
    for item in data:
        year = item['TimePeriod'][:4]
        quarter = item['TimePeriod'][4:]
        m = {'Q1':'01-01','Q2':'04-01','Q3':'07-01','Q4':'10-01'}.get(quarter)
        if m:
            records.append({'date': f"{year}-{m}", 'value': float(item['DataValue'].replace(',', ''))})
    return pd.DataFrame(records)

def fetch_bls_cpi():
    """Fetch CPI from BLS."""
    print("Fetching CPI from BLS...")
    headers = {'Content-type': 'application/json'}
    current_year = datetime.now().year
    payload = json.dumps({
        "seriesid": ['CUSR0000SA0'], 
        "startyear": str(current_year - 9), 
        "endyear": str(current_year)
    })
    try:
        response = requests.post('https://api.bls.gov/publicAPI/v2/timeseries/data/', data=payload, headers=headers).json()
        if response.get('status') in ['REQUEST_FAILED', 'REQUEST_NOT_PROCESSED']:
            return pd.DataFrame()
        records = []
        for series in response.get('Results', {}).get('series', []):
            for item in series.get('data', []):
                val = item.get('value', '').strip()
                if val and val not in ['-', '.', '']:
                    records.append({'date': f"{item['year']}-{item['period'][1:]}-01", 'value': float(val)})
        return pd.DataFrame(records)
    except Exception as e:
        print(f"🚨 BLS API Request Failed: {e}")
        return pd.DataFrame()

def save_to_db(series_id, title, source, tab_name, tab_order, frequency, df):
    """Save with bulk ingestion and tab_order for consistent sorting."""
    if df.empty:
        print(f"  ⚠️ Skipping {title} because no data was returned.")
        return
    try:
        with engine.begin() as conn:
            conn.execute(text("""
                INSERT INTO series_metadata (series_id, title, source, tab_name, tab_order, frequency)
                VALUES (:series_id, :title, :source, :tab_name, :tab_order, :frequency)
                ON CONFLICT (series_id) DO UPDATE SET 
                tab_name = EXCLUDED.tab_name, 
                tab_order = EXCLUDED.tab_order,
                title = EXCLUDED.title;
            """), {"series_id": series_id, "title": title, "source": source, 
                   "tab_name": tab_name, "tab_order": tab_order, "frequency": frequency})
            
            data = [{"series_id": series_id, "date": r['date'], "value": r['value']} for _, r in df.iterrows()]
            conn.execute(text("""
                INSERT INTO macro_data (series_id, date, value)
                VALUES (:series_id, :date, :value)
                ON CONFLICT (series_id, date) DO NOTHING;
            """), data)
        print(f"  ✅ Saved {title} (Tab: {tab_name})")
    except Exception as e:
        print(f"  ❌ Error saving {title}: {e}")

def main():
    print("🚀 Starting Final Phase Ingestion (Sections 1-10)...")
    init_db()
    
    # Existing Sections (1-5)
    save_to_db("BEA_REAL_GDP", "Real GDP (BEA)", "BEA", "Output / Growth", 1, "Quarterly", fetch_bea_real_gdp())
    save_to_db("GDPC1", "Real GDP (FRED)", "FRED", "Output / Growth", 1, "Quarterly", fetch_fred_data("GDPC1"))
    save_to_db("PI", "Personal Income", "FRED", "Income & Spending", 2, "Monthly", fetch_fred_data("PI"))
    save_to_db("CPIAUCSL", "CPI (FRED)", "FRED", "Inflation & Prices", 3, "Monthly", fetch_fred_data("CPIAUCSL"))
    save_to_db("UNRATE", "Unemployment Rate", "FRED", "Labor Market", 4, "Monthly", fetch_fred_data("UNRATE"))
    save_to_db("BOPGSTB", "Trade Balance (FRED)", "FRED", "Trade", 5, "Monthly", fetch_fred_data("BOPGSTB"))

    # 6. Monetary / Credit (3 charts)
    t6 = "Monetary / Credit"
    save_to_db("FEDFUNDS", "Fed Funds Rate", "FRED", t6, 6, "Monthly", fetch_fred_data("FEDFUNDS"))
    save_to_db("M2SL", "Money Supply (M2)", "FRED", t6, 6, "Monthly", fetch_fred_data("M2SL"))
    save_to_db("TCMDO", "Total Credit Outstanding", "FRED", t6, 6, "Quarterly", fetch_fred_data("TCMDO"))

    # 7. Fiscal (4 charts)
    t7 = "Fiscal"
    save_to_db("TREASURY_DEBT", "Public Debt (Treasury)", "US Treasury", t7, 7, "Daily", fetch_treasury_debt())
    save_to_db("GFDEBTN", "Public Debt (FRED)", "FRED", t7, 7, "Quarterly", fetch_fred_data("GFDEBTN"))
    save_to_db("GFDEGDQ188S", "Debt-to-GDP", "FRED", t7, 7, "Quarterly", fetch_fred_data("GFDEGDQ188S"))
    save_to_db("MTSDS133FMS", "Budget Deficit", "FRED", t7, 7, "Monthly", fetch_fred_data("MTSDS133FMS"))

    # 8. Sectoral Activity (3 charts)
    t8 = "Sectoral Activity"
    save_to_db("INDPRO", "Industrial Production", "FRED", t8, 8, "Monthly", fetch_fred_data("INDPRO"))
    save_to_db("IPMAN", "Manufacturing PMI (Proxy)", "ISM Proxy / FRED", t8, 8, "Monthly", fetch_fred_data("IPMAN"))
    save_to_db("SRVPRD", "Services PMI (Proxy)", "ISM Proxy / FRED", t8, 8, "Monthly", fetch_fred_data("SRVPRD"))

    # 9. Global Data (4 charts)
    t9 = "Global Data"
    save_to_db("WB_WLD_GDP", "World GDP (WB)", "World Bank", t9, 9, "Annual", fetch_world_bank_data("NY.GDP.MKTP.CD"))
    save_to_db("PALLFNFINDEXM", "Commodity Prices (WB)", "World Bank via FRED", t9, 9, "Monthly", fetch_fred_data("PALLFNFINDEXM"))
    save_to_db("DEXUSEU", "FX Rates (Fed Reserve)", "Fed via FRED", t9, 9, "Daily", fetch_fred_data("DEXUSEU"))
    save_to_db("DTWEXBGS", "Broad Dollar Index", "FRED", t9, 9, "Daily", fetch_fred_data("DTWEXBGS"))

    # ==========================================
    # 10. PHASE 1 ADDITIONS (SAGE'S REQUEST)
    # ==========================================
    t10 = "Yield Curve & Credit"
    save_to_db("T10Y2Y", "10Y-2Y Yield Spread", "FRED", t10, 10, "Daily", fetch_fred_data("T10Y2Y"))
    save_to_db("T10Y3M", "10Y-3M Yield Spread", "FRED", t10, 10, "Daily", fetch_fred_data("T10Y3M"))
    save_to_db("BAMLH0A0HYM2", "High Yield OAS", "FRED", t10, 10, "Daily", fetch_fred_data("BAMLH0A0HYM2"))
    save_to_db("USREC", "NBER Recession Indicator", "FRED", t10, 10, "Monthly", fetch_fred_data("USREC"))

    print("\n🎉 ALL SECTIONS INGESTED! Refresh your terminal.")

if __name__ == "__main__":
    main()