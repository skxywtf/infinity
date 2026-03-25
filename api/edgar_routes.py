"""
WTF EDGAR Integration — Python port of Edgar 2 Java pipeline
Ported from: com.wtf.edgar.{client,parser,model,server}
"""
import time, requests
from fastapi import APIRouter
from fastapi.responses import JSONResponse

edgar_router = APIRouter()

CONCEPT_MAP = {
    "Revenue":             {"section":"income",   "concepts":["RevenueFromContractWithCustomerExcludingAssessedTax","RevenueFromContractWithCustomerIncludingAssessedTax","Revenues","SalesRevenueNet","SalesRevenueGoodsNet","NetRevenues","TotalRevenues","RevenueNet"]},
    "Cost of Revenue":     {"section":"income",   "concepts":["CostOfRevenue","CostOfGoodsAndServicesSold","CostOfGoodsSold","CostOfSales"]},
    "Gross Profit":        {"section":"income",   "concepts":["GrossProfit"]},
    "R&D Expense":         {"section":"income",   "concepts":["ResearchAndDevelopmentExpense","ResearchAndDevelopmentExpenseExcludingAcquiredInProcessCost"]},
    "SG&A Expense":        {"section":"income",   "concepts":["SellingGeneralAndAdministrativeExpense","GeneralAndAdministrativeExpense"]},
    "Operating Income":    {"section":"income",   "concepts":["OperatingIncomeLoss"]},
    "Interest Expense":    {"section":"income",   "concepts":["InterestExpense","InterestAndDebtExpense"]},
    "Pretax Income":       {"section":"income",   "concepts":["IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest"]},
    "Income Tax":          {"section":"income",   "concepts":["IncomeTaxExpenseBenefit"]},
    "Net Income":          {"section":"income",   "concepts":["NetIncomeLoss","ProfitLoss","NetIncomeLossAvailableToCommonStockholdersBasic"]},
    "EPS (Diluted)":       {"section":"income",   "concepts":["EarningsPerShareDiluted"]},
    "Cash & Equivalents":  {"section":"balance",  "concepts":["CashAndCashEquivalentsAtCarryingValue","CashCashEquivalentsAndShortTermInvestments","Cash"]},
    "Total Current Assets":{"section":"balance",  "concepts":["AssetsCurrent"]},
    "Total Assets":        {"section":"balance",  "concepts":["Assets"]},
    "Total Current Liabilities":{"section":"balance","concepts":["LiabilitiesCurrent"]},
    "Long-Term Debt":      {"section":"balance",  "concepts":["LongTermDebtNoncurrent","LongTermDebt","LongTermDebtAndCapitalLeaseObligations"]},
    "Total Liabilities":   {"section":"balance",  "concepts":["Liabilities"]},
    "Total Equity":        {"section":"balance",  "concepts":["StockholdersEquity","StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"]},
    "Operating Cash Flow": {"section":"cashflow", "concepts":["NetCashProvidedByUsedInOperatingActivities","NetCashProvidedByUsedInOperatingActivitiesContinuingOperations"]},
    "Capital Expenditures":{"section":"cashflow", "concepts":["PaymentsToAcquirePropertyPlantAndEquipment","PaymentsForCapitalImprovements"]},
    "Investing Cash Flow": {"section":"cashflow", "concepts":["NetCashProvidedByUsedInInvestingActivities","NetCashProvidedByUsedInInvestingActivitiesContinuingOperations"]},
    "Financing Cash Flow": {"section":"cashflow", "concepts":["NetCashProvidedByUsedInFinancingActivities","NetCashProvidedByUsedInFinancingActivitiesContinuingOperations"]},
    "Depreciation & Amortization":{"section":"cashflow","concepts":["DepreciationDepletionAndAmortization","DepreciationAndAmortization","Depreciation"]},
}

_HEADERS = {"User-Agent":"WorldTradeFactory research@worldtradefactory.com","Accept":"application/json"}
_last_call = 0.0

def _throttle():
    global _last_call
    elapsed = time.time() - _last_call
    if elapsed < 0.11:
        time.sleep(0.11 - elapsed)
    _last_call = time.time()

def _resolve_ticker(ticker):
    _throttle()
    resp = requests.get("https://www.sec.gov/files/company_tickers.json", headers=_HEADERS, timeout=15)
    resp.raise_for_status()
    for entry in resp.json().values():
        if entry.get("ticker","").upper() == ticker.upper():
            return {"ticker":ticker.upper(),"cik":f"{entry['cik_str']:010d}","name":entry.get("title","Unknown")}
    return None

def _fetch_facts(cik):
    _throttle()
    resp = requests.get(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json", headers=_HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.json()

def _extract_annual(facts, concept):
    try:
        node = facts.get("facts",{}).get("us-gaap",{}).get(concept,{})
        if not node: return {}
        units = node.get("units",{})
        entries = units.get("USD") or units.get("pure") or units.get("USD/shares") or []
        year_best = {}
        for e in entries:
            if e.get("form") != "10-K": continue
            end = e.get("end","")
            if len(end) < 4: continue
            try: yr = int(end[:4])
            except: continue
            val = e.get("val")
            if val is None: continue
            accn = e.get("accn","")
            if yr not in year_best or accn > year_best[yr][0]:
                year_best[yr] = (accn, float(val))
        return {yr: v for yr,(_, v) in year_best.items()}
    except: return {}

def _extract_financials(ticker, years_back=5):
    company = _resolve_ticker(ticker)
    if not company: raise ValueError(f"Ticker '{ticker}' not found in SEC EDGAR")
    facts = _fetch_facts(company["cik"])
    income, balance, cashflow = {}, {}, {}
    all_years, warnings, used = set(), [], set()
    for label, meta in CONCEPT_MAP.items():
        found = False
        for concept in meta["concepts"]:
            if concept in used: continue
            values = _extract_annual(facts, concept)
            if values:
                used.add(concept); all_years.update(values.keys())
                {"income":income,"balance":balance,"cashflow":cashflow}[meta["section"]][label] = values
                found = True; break
        if not found: warnings.append(f"No data: {label}")
    if all_years:
        max_yr = max(all_years); min_yr = max_yr - years_back + 1
        fiscal_years = sorted(y for y in all_years if y >= min_yr)
    else:
        fiscal_years = []
    def trim(d): return {k:{yr:v for yr,v in vals.items() if yr in fiscal_years} for k,vals in d.items()}
    return {"company":company,"fiscalYears":fiscal_years,"incomeStatement":trim(income),"balanceSheet":trim(balance),"cashFlowStatement":trim(cashflow),"warnings":warnings}

@edgar_router.get("/api/edgar/{ticker}")
def get_financials(ticker: str, years: int = 5):
    if not ticker.replace("-","").isalpha() or len(ticker) > 6:
        return JSONResponse({"error":"Invalid ticker"}, status_code=400)
    try:
        return JSONResponse(_extract_financials(ticker.upper(), min(max(years,1),10)))
    except ValueError as e:
        return JSONResponse({"error":str(e)}, status_code=404)
    except requests.HTTPError as e:
        return JSONResponse({"error":f"SEC API error: {e.response.status_code}"}, status_code=502)
    except Exception as e:
        return JSONResponse({"error":str(e)}, status_code=500)

@edgar_router.get("/api/edgar/{ticker}/summary")
def get_summary(ticker: str):
    try:
        data = _extract_financials(ticker.upper(), 1)
        years = data["fiscalYears"]
        if not years: return JSONResponse({"error":"No annual data"}, status_code=404)
        yr = years[-1]
        g = lambda s,l: s.get(l,{}).get(yr)
        return JSONResponse({"company":data["company"],"year":yr,
            "revenue":g(data["incomeStatement"],"Revenue"),
            "grossProfit":g(data["incomeStatement"],"Gross Profit"),
            "operatingIncome":g(data["incomeStatement"],"Operating Income"),
            "netIncome":g(data["incomeStatement"],"Net Income"),
            "eps":g(data["incomeStatement"],"EPS (Diluted)"),
            "totalAssets":g(data["balanceSheet"],"Total Assets"),
            "totalEquity":g(data["balanceSheet"],"Total Equity"),
            "longTermDebt":g(data["balanceSheet"],"Long-Term Debt"),
            "operatingCashFlow":g(data["cashFlowStatement"],"Operating Cash Flow"),
            "capex":g(data["cashFlowStatement"],"Capital Expenditures"),
        })
    except ValueError as e: return JSONResponse({"error":str(e)}, status_code=404)
    except Exception as e:  return JSONResponse({"error":str(e)}, status_code=500)
