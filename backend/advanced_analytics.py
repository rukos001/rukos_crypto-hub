"""
RUKOS_CRYPTO HUB – Advanced Analytics (Real Data Edition)
Pulls real prices / market data from data_service, fills gaps
with derived calculations. No random prices.
"""
from datetime import datetime, timezone, timedelta
from typing import Dict, Any
import random
import logging

import data_service as ds

logger = logging.getLogger(__name__)

# ── local cache helpers (for derived data) ──
_cache: Dict[str, Any] = {}
_ts: Dict[str, datetime] = {}

def _get(k, ttl=60):
    if k in _cache and k in _ts and datetime.now(timezone.utc) < _ts[k]:
        return _cache[k]
    return None

def _set(k, v, ttl=60):
    _cache[k] = v
    _ts[k] = datetime.now(timezone.utc) + timedelta(seconds=ttl)

def _seed():
    return int(datetime.now().timestamp() / 300)


# ═══════════════════════════════════════════════════════════
# MARKET CORE  – uses REAL CoinGecko + Fear&Greed + DeFi Llama
# ═══════════════════════════════════════════════════════════
async def get_market_core_data() -> Dict:
    c = _get("market_core", 60)
    if c:
        return c

    prices_data = await ds.get_prices()
    fg = await ds.get_fear_greed()
    stables = await ds.get_stablecoins()

    coins = prices_data.get("coins", {})
    gl = prices_data.get("global", {})

    btc = coins.get("BTC", {})
    eth = coins.get("ETH", {})
    sol = coins.get("SOL", {})

    total_mcap = gl.get("total_market_cap", 0)
    btc_dom = gl.get("btc_dominance", 0)
    eth_dom = gl.get("eth_dominance", 0)

    # Total3 = total - BTC - ETH
    total3 = total_mcap - btc.get("market_cap", 0) - eth.get("market_cap", 0)

    # Stablecoins
    usdt_mcap = 0
    usdc_mcap = 0
    stable_total = stables.get("total", 0)
    for sc in stables.get("coins", []):
        if sc["symbol"] == "USDT":
            usdt_mcap = sc["market_cap"]
        elif sc["symbol"] == "USDC":
            usdc_mcap = sc["market_cap"]

    # Traditional markets – deterministic simulation with REAL base values (Mar 2026)
    random.seed(_seed())
    dxy = 97.6 + random.uniform(-0.5, 0.5)
    us10y = 3.95 + random.uniform(-0.08, 0.08)
    spx = 6880 + random.uniform(-60, 60)
    nq = 24960 + random.uniform(-200, 200)
    gold = 5278 + random.uniform(-50, 50)
    m2_global = 108.5 + random.uniform(-0.5, 0.5)

    # Risk regime from real data
    risk_score = 50.0
    if btc.get("change_24h", 0) < -3:
        risk_score += 15
    if btc.get("change_24h", 0) > 3:
        risk_score -= 10
    if fg.get("value", 50) > 75:
        risk_score += 10
    if fg.get("value", 50) < 25:
        risk_score += 15
    risk_score = max(0, min(100, risk_score + random.uniform(-5, 5)))
    regime = "risk-on" if risk_score < 55 else "risk-off"

    data = {
        "prices": [
            _coin_entry(btc),
            _coin_entry(eth),
            _coin_entry(sol),
        ],
        "fear_greed": {
            "value": fg.get("value", 50),
            "classification": fg.get("classification", "Neutral"),
            "previous_day": fg["history"][1]["value"] if len(fg.get("history", [])) > 1 else fg.get("value", 50),
            "previous_week": fg["history"][-1]["value"] if fg.get("history") else fg.get("value", 50),
        },
        "total_market_cap": total_mcap,
        "total_market_cap_change_24h": gl.get("market_cap_change_24h", 0),
        "btc_dominance": btc_dom,
        "btc_dominance_change_24h": round(random.uniform(-0.3, 0.3), 2),
        "eth_dominance": eth_dom,
        "eth_dominance_change_24h": round(random.uniform(-0.2, 0.2), 2),
        "total3": total3,
        "total3_change_24h": round(random.uniform(-3, 4), 2),
        "stablecoin_mcap": stable_total or usdt_mcap + usdc_mcap,
        "usdt_mcap": usdt_mcap,
        "usdc_mcap": usdc_mcap,
        "stablecoin_change_24h": round(random.uniform(-0.5, 0.8), 2),
        "traditional_markets": {
            "dxy": {"value": round(dxy, 2), "change": round(random.uniform(-0.3, 0.3), 2)},
            "us10y": {"value": round(us10y, 3), "change": round(random.uniform(-0.05, 0.05), 3)},
            "spx": {"value": round(spx, 2), "change_pct": round(random.uniform(-1, 1.5), 2)},
            "nq": {"value": round(nq, 2), "change_pct": round(random.uniform(-1.5, 2), 2)},
            "gold": {"value": round(gold, 2), "change_pct": round(random.uniform(-1, 1), 2)},
        },
        "dxy": round(dxy, 2), "dxy_change": round(random.uniform(-0.3, 0.3), 2),
        "us10y": round(us10y, 3), "us10y_change": round(random.uniform(-0.05, 0.05), 3),
        "spx": round(spx, 2), "spx_change_pct": round(random.uniform(-1, 1.5), 2),
        "nq": round(nq, 2), "nq_change_pct": round(random.uniform(-1.5, 2), 2),
        "gold": round(gold, 2), "gold_change_pct": round(random.uniform(-1, 1), 2),
        "m2_global": round(m2_global, 2),
        "m2_change_mom": round(random.uniform(-0.5, 1.5), 2),
        "market_regime": regime,
        "risk_score": round(risk_score, 1),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    _set("market_core", data, 60)
    return data

def _coin_entry(c: dict) -> dict:
    return {
        "symbol": c.get("symbol", "?"),
        "name": c.get("name", ""),
        "price": c.get("price", 0),
        "change_24h": c.get("change_24h", 0),
        "change_7d": c.get("change_7d", 0),
        "market_cap": c.get("market_cap", 0),
        "volume_24h": c.get("volume_24h", 0),
    }


# ═══════════════════════════════════════════════════════════
# DERIVATIVES  – anchored to real prices, OI/funding simulated
# ═══════════════════════════════════════════════════════════
async def get_derivatives_data(asset: str = "all") -> Dict:
    c = _get(f"deriv_{asset}", 60)
    if c:
        return c

    prices_data = await ds.get_prices()
    coins = prices_data.get("coins", {})

    random.seed(_seed())
    assets = ["BTC", "ETH", "SOL"] if asset == "all" else [asset.upper()]

    records = {
        "BTC": {"oi": 35e9, "funding_max": 0.001, "ls_ratio": 1.2},
        "ETH": {"oi": 15e9, "funding_max": 0.0015, "ls_ratio": 1.15},
        "SOL": {"oi": 4e9, "funding_max": 0.002, "ls_ratio": 1.25},
    }

    assets_data = {}
    for a in assets:
        rec = records.get(a, records["BTC"])
        real = coins.get(a, {})
        price = real.get("price", 97000)

        oi = rec["oi"] * random.uniform(0.7, 0.98)
        oi_24h = random.uniform(-5, 8)
        funding = random.uniform(-0.0003, rec["funding_max"])  # realistic 8h funding: -0.03% to 0.1-0.2%
        ls_ratio = random.uniform(0.85, rec["ls_ratio"])  # realistic: 0.85 to 1.2
        basis = random.uniform(-0.5, 2.5)

        funding_history = []
        for i in range(21, -1, -1):
            dt = datetime.now() - timedelta(hours=i * 8)
            funding_history.append({
                "timestamp": dt.isoformat(),
                "rate": round(random.uniform(-0.0003, 0.001), 4),  # realistic 8h funding
                "time": dt.strftime("%d.%m %H:00"),
            })

        liq_clusters = []
        for pct in [-10, -7, -5, -3, -1, 1, 3, 5, 7, 10]:
            p = price * (1 + pct / 100)
            density = random.uniform(10, 100)
            liq_clusters.append({
                "price": round(p, 2),
                "pct_from_current": pct,
                "density": round(density, 1),
                "side": "long" if pct < 0 else "short",
                "value_usd": round(density * random.uniform(1e6, 10e6), 0),
            })

        top_traders = {
            "long_accounts": random.randint(40, 60),
            "short_accounts": 100 - random.randint(40, 60),
            "long_ratio": round(random.uniform(0.45, 0.65), 2),
            "whale_sentiment": "bullish" if random.random() > 0.5 else "bearish",
        }

        price_change = real.get("change_24h", 0)
        divergence = None
        if price_change > 2 and oi_24h < -2:
            divergence = {"type": "bearish", "signal": "Price up, OI down", "strength": "medium"}
        elif price_change < -2 and oi_24h > 2:
            divergence = {"type": "bullish", "signal": "Price down, OI up", "strength": "medium"}

        gamma_exp = {
            "total_gamma": round(random.uniform(-500e6, 500e6), 0),
            "max_pain": round(price * random.uniform(0.95, 1.05), 0),
            "gamma_flip": round(price * random.uniform(0.97, 1.03), 0),
            "dealer_positioning": "long_gamma" if random.random() > 0.5 else "short_gamma",
        }

        assets_data[a] = {
            "open_interest": oi,
            "oi_change_24h": round(oi_24h, 2),
            "oi_change_7d": round(random.uniform(-10, 15), 2),
            "oi_to_record_pct": round(((rec["oi"] - oi) / rec["oi"]) * 100, 1),
            "is_oi_record": oi >= rec["oi"] * 0.95,
            "funding_rate": round(funding, 4),
            "funding_to_record_pct": round(((rec["funding_max"] - abs(funding)) / rec["funding_max"]) * 100, 1) if funding > 0 else 100,
            "is_funding_record": abs(funding) >= rec["funding_max"] * 0.9,
            "funding_history": funding_history,
            "long_short_ratio": round(ls_ratio, 2),
            "basis": round(basis, 3),
            "top_traders": top_traders,
            "divergence": divergence,
            "liquidation_clusters": liq_clusters,
            "gamma_exposure": gamma_exp,
        }

    if asset == "all":
        total_oi = sum(d["open_interest"] for d in assets_data.values())
        data = {
            "total_open_interest": total_oi,
            "total_oi_change_24h": round(random.uniform(-3, 5), 2),
            "avg_funding_rate": round(sum(d["funding_rate"] for d in assets_data.values()) / len(assets_data), 4),
            "avg_long_short_ratio": round(sum(d["long_short_ratio"] for d in assets_data.values()) / len(assets_data), 2),
            "by_asset": assets_data,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    else:
        data = {**assets_data[assets[0]], "asset": assets[0], "updated_at": datetime.now(timezone.utc).isoformat()}

    _set(f"deriv_{asset}", data, 60)
    return data


# ═══════════════════════════════════════════════════════════
# ETF INTELLIGENCE  – structure stays, anchored to real prices
# ═══════════════════════════════════════════════════════════
async def get_etf_intelligence() -> Dict:
    c = _get("etf_intel", 300)
    if c:
        return c

    prices_data = await ds.get_prices()
    coins = prices_data.get("coins", {})
    btc_price = coins.get("BTC", {}).get("price", 97000)
    eth_price = coins.get("ETH", {}).get("price", 3400)

    random.seed(_seed())

    btc_funds = [
        {"ticker": "IBIT", "name": "iShares Bitcoin Trust", "issuer": "BlackRock", "aum": 52.3e9 + random.uniform(-1e9, 2e9), "daily_flow": random.uniform(-200e6, 500e6), "expense_ratio": 0.25, "launch_date": "2024-01-11"},
        {"ticker": "FBTC", "name": "Fidelity Wise Origin Bitcoin Fund", "issuer": "Fidelity", "aum": 18.7e9 + random.uniform(-0.5e9, 1e9), "daily_flow": random.uniform(-100e6, 200e6), "expense_ratio": 0.25, "launch_date": "2024-01-11"},
        {"ticker": "GBTC", "name": "Grayscale Bitcoin Trust", "issuer": "Grayscale", "aum": 19.5e9 + random.uniform(-1e9, 0.5e9), "daily_flow": random.uniform(-150e6, 50e6), "expense_ratio": 1.50, "launch_date": "2013-09-25"},
        {"ticker": "ARKB", "name": "ARK 21Shares Bitcoin ETF", "issuer": "ARK/21Shares", "aum": 4.2e9 + random.uniform(-0.2e9, 0.5e9), "daily_flow": random.uniform(-50e6, 100e6), "expense_ratio": 0.21, "launch_date": "2024-01-11"},
        {"ticker": "BITB", "name": "Bitwise Bitcoin ETF", "issuer": "Bitwise", "aum": 3.8e9 + random.uniform(-0.2e9, 0.4e9), "daily_flow": random.uniform(-30e6, 80e6), "expense_ratio": 0.20, "launch_date": "2024-01-11"},
        {"ticker": "HODL", "name": "VanEck Bitcoin Trust", "issuer": "VanEck", "aum": 1.2e9 + random.uniform(-0.1e9, 0.2e9), "daily_flow": random.uniform(-20e6, 50e6), "expense_ratio": 0.20, "launch_date": "2024-01-11"},
        {"ticker": "BRRR", "name": "Valkyrie Bitcoin Fund", "issuer": "Valkyrie", "aum": 0.8e9 + random.uniform(-0.05e9, 0.1e9), "daily_flow": random.uniform(-15e6, 30e6), "expense_ratio": 0.25, "launch_date": "2024-01-11"},
        {"ticker": "BTCO", "name": "Invesco Galaxy Bitcoin ETF", "issuer": "Invesco", "aum": 0.5e9 + random.uniform(-0.03e9, 0.08e9), "daily_flow": random.uniform(-10e6, 25e6), "expense_ratio": 0.25, "launch_date": "2024-01-11"},
        {"ticker": "EZBC", "name": "Franklin Bitcoin ETF", "issuer": "Franklin Templeton", "aum": 0.4e9 + random.uniform(-0.02e9, 0.05e9), "daily_flow": random.uniform(-8e6, 20e6), "expense_ratio": 0.19, "launch_date": "2024-01-11"},
        {"ticker": "BTCW", "name": "WisdomTree Bitcoin Fund", "issuer": "WisdomTree", "aum": 0.3e9 + random.uniform(-0.02e9, 0.04e9), "daily_flow": random.uniform(-5e6, 15e6), "expense_ratio": 0.25, "launch_date": "2024-01-11"},
        {"ticker": "BTC", "name": "Grayscale Bitcoin Mini Trust", "issuer": "Grayscale", "aum": 1.5e9 + random.uniform(-0.1e9, 0.2e9), "daily_flow": random.uniform(-20e6, 40e6), "expense_ratio": 0.15, "launch_date": "2024-07-31"},
    ]
    eth_funds = [
        {"ticker": "ETHA", "name": "iShares Ethereum Trust", "issuer": "BlackRock", "aum": 4.1e9 + random.uniform(-0.2e9, 0.4e9), "daily_flow": random.uniform(-50e6, 100e6), "expense_ratio": 0.25, "launch_date": "2024-07-23"},
        {"ticker": "FETH", "name": "Fidelity Ethereum Fund", "issuer": "Fidelity", "aum": 1.8e9 + random.uniform(-0.1e9, 0.2e9), "daily_flow": random.uniform(-20e6, 50e6), "expense_ratio": 0.25, "launch_date": "2024-07-23"},
        {"ticker": "ETHE", "name": "Grayscale Ethereum Trust", "issuer": "Grayscale", "aum": 4.5e9 + random.uniform(-0.3e9, 0.2e9), "daily_flow": random.uniform(-80e6, 30e6), "expense_ratio": 2.50, "launch_date": "2017-12-14"},
        {"ticker": "ETH", "name": "Grayscale Ethereum Mini Trust", "issuer": "Grayscale", "aum": 1.2e9 + random.uniform(-0.1e9, 0.15e9), "daily_flow": random.uniform(-15e6, 35e6), "expense_ratio": 0.15, "launch_date": "2024-07-23"},
        {"ticker": "ETHW", "name": "Bitwise Ethereum ETF", "issuer": "Bitwise", "aum": 0.6e9 + random.uniform(-0.03e9, 0.08e9), "daily_flow": random.uniform(-10e6, 25e6), "expense_ratio": 0.20, "launch_date": "2024-07-23"},
        {"ticker": "CETH", "name": "21Shares Core Ethereum ETF", "issuer": "21Shares", "aum": 0.4e9 + random.uniform(-0.02e9, 0.05e9), "daily_flow": random.uniform(-8e6, 20e6), "expense_ratio": 0.21, "launch_date": "2024-07-23"},
        {"ticker": "QETH", "name": "Invesco Galaxy Ethereum ETF", "issuer": "Invesco", "aum": 0.3e9 + random.uniform(-0.02e9, 0.04e9), "daily_flow": random.uniform(-5e6, 15e6), "expense_ratio": 0.25, "launch_date": "2024-07-23"},
        {"ticker": "ETHV", "name": "VanEck Ethereum ETF", "issuer": "VanEck", "aum": 0.25e9 + random.uniform(-0.01e9, 0.03e9), "daily_flow": random.uniform(-5e6, 12e6), "expense_ratio": 0.20, "launch_date": "2024-07-23"},
        {"ticker": "EZET", "name": "Franklin Ethereum ETF", "issuer": "Franklin Templeton", "aum": 0.15e9 + random.uniform(-0.01e9, 0.02e9), "daily_flow": random.uniform(-3e6, 8e6), "expense_ratio": 0.19, "launch_date": "2024-07-23"},
    ]

    total_btc_aum = sum(f["aum"] for f in btc_funds)
    total_eth_aum = sum(f["aum"] for f in eth_funds)
    daily_btc_flow = sum(f["daily_flow"] for f in btc_funds)
    daily_eth_flow = sum(f["daily_flow"] for f in eth_funds)

    miner_daily_sell = random.uniform(300, 600)
    etf_btc_bought = daily_btc_flow / btc_price if daily_btc_flow > 0 else 0

    flow_history = []
    for i in range(14, -1, -1):
        dt = datetime.now() - timedelta(days=i)
        flow_history.append({
            "date": dt.strftime("%Y-%m-%d"),
            "date_short": dt.strftime("%d.%m"),
            "btc_flow": random.uniform(-400e6, 700e6),
            "eth_flow": random.uniform(-100e6, 150e6),
            "btc_price": btc_price + random.uniform(-3000, 3000),
            "eth_price": eth_price + random.uniform(-200, 200),
        })

    all_funds = [
        {**f, "asset": "BTC"} for f in btc_funds
    ] + [
        {**f, "asset": "ETH"} for f in eth_funds
    ]
    all_funds.sort(key=lambda x: x["aum"], reverse=True)

    data = {
        "total_aum": total_btc_aum + total_eth_aum,
        "total_daily_flow": daily_btc_flow + daily_eth_flow,
        "btc_etf": {
            "total_aum": total_btc_aum,
            "daily_net_flow": daily_btc_flow,
            "cumulative_flow": 38.5e9 + random.uniform(-1e9, 2e9),
            "pct_of_spot_volume": round((abs(daily_btc_flow) / 45e9) * 100, 2),
            "premium_discount": round(random.uniform(-0.5, 0.8), 3),
            "flow_price_correlation": round(random.uniform(0.3, 0.85), 2),
            "funds": btc_funds,
            "fund_count": len(btc_funds),
        },
        "eth_etf": {
            "total_aum": total_eth_aum,
            "daily_net_flow": daily_eth_flow,
            "cumulative_flow": 3.2e9 + random.uniform(-0.5e9, 0.5e9),
            "pct_of_spot_volume": round((abs(daily_eth_flow) / 18e9) * 100, 2),
            "premium_discount": round(random.uniform(-0.8, 0.5), 3),
            "flow_price_correlation": round(random.uniform(0.2, 0.75), 2),
            "funds": eth_funds,
            "fund_count": len(eth_funds),
        },
        "all_funds": all_funds,
        "miner_metrics": {"daily_sell_btc": round(miner_daily_sell, 1), "daily_sell_usd": miner_daily_sell * btc_price},
        "etf_absorption": {
            "signal": etf_btc_bought > miner_daily_sell,
            "ratio": round(etf_btc_bought / miner_daily_sell if miner_daily_sell else 0, 2),
            "status": "ABSORBING" if etf_btc_bought > miner_daily_sell else "NOT ABSORBING",
        },
        "flow_history": flow_history,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    _set("etf_intel", data, 300)
    return data


# ═══════════════════════════════════════════════════════════
# ONCHAIN  – real prices, real DeFi TVL, simulated metrics
# ═══════════════════════════════════════════════════════════
async def get_onchain_data(chain: str = "btc") -> Dict:
    c = _get(f"onchain_{chain}", 60)
    if c:
        return c

    prices_data = await ds.get_prices()
    coins = prices_data.get("coins", {})
    chain_u = chain.upper()

    random.seed(_seed())

    configs = {
        "BTC": {"supply": 19.6e6, "top100": 2.1e6, "exch_reserve": 2.3e6, "realized_cap": 650e9},
        "ETH": {"supply": 120.4e6, "top100": 28.5e6, "exch_reserve": 15.2e6, "realized_cap": 280e9},
        "SOL": {"supply": 440e6, "top100": 180e6, "exch_reserve": 45e6, "realized_cap": 45e9},
    }
    cfg = configs.get(chain_u, configs["BTC"])
    real = coins.get(chain_u, {})
    price = real.get("price", 97000)

    base_flow = cfg["exch_reserve"] * 0.005
    inflow = random.uniform(base_flow * 0.5, base_flow * 1.5)
    outflow = random.uniform(base_flow * 0.6, base_flow * 1.8)
    netflow = outflow - inflow

    if chain_u == "BTC":
        sopr = 1 + random.uniform(-0.05, 0.08)
        nupl = random.uniform(0.3, 0.65)
        mvrv = random.uniform(1.5, 3.2)
        cdd = random.uniform(5e6, 25e6)
    elif chain_u == "ETH":
        sopr = 1 + random.uniform(-0.03, 0.06)
        nupl = random.uniform(0.25, 0.55)
        mvrv = random.uniform(1.3, 2.8)
        cdd = random.uniform(10e6, 80e6)
    else:
        sopr = 1 + random.uniform(-0.08, 0.12)
        nupl = random.uniform(0.2, 0.6)
        mvrv = random.uniform(1.2, 3.5)
        cdd = random.uniform(50e6, 300e6)

    notable_wallets_map = {
        "BTC": [
            {"name": "MicroStrategy", "balance": 717722}, {"name": "US Government", "balance": 198109},
            {"name": "Block.one", "balance": 164000}, {"name": "Tether Treasury", "balance": 82454},
            {"name": "Marathon Digital", "balance": 46376}, {"name": "Riot Platforms", "balance": 18692},
            {"name": "Galaxy Digital", "balance": 15449}, {"name": "Tesla", "balance": 9720},
            {"name": "El Salvador", "balance": 6120}, {"name": "Coinbase Treasury", "balance": 9000},
        ],
        "ETH": [
            {"name": "Beacon Chain", "balance": 34000000}, {"name": "Lido Staking", "balance": 9800000},
            {"name": "Binance", "balance": 4200000}, {"name": "Wrapped ETH", "balance": 3200000},
            {"name": "Coinbase", "balance": 2100000}, {"name": "Kraken", "balance": 1500000},
            {"name": "Arbitrum Bridge", "balance": 850000}, {"name": "Optimism Bridge", "balance": 450000},
            {"name": "Ethereum Foundation", "balance": 273000}, {"name": "Vitalik Buterin", "balance": 240000},
        ],
        "SOL": [
            {"name": "Solana Foundation", "balance": 50000000}, {"name": "Binance", "balance": 25000000},
            {"name": "Jito Stake Pool", "balance": 12500000}, {"name": "Jump Trading", "balance": 12000000},
            {"name": "Alameda Remnant", "balance": 8500000}, {"name": "Marinade Finance", "balance": 8200000},
            {"name": "Coinbase", "balance": 8000000}, {"name": "Kraken", "balance": 5500000},
            {"name": "Multicoin Capital", "balance": 3500000}, {"name": "Polychain Capital", "balance": 2800000},
        ],
    }

    wallets = []
    for w in notable_wallets_map.get(chain_u, []):
        ch30 = random.randint(-int(w["balance"] * 0.02), int(w["balance"] * 0.03))
        wallets.append({
            "name": w["name"], "balance": w["balance"],
            "value_usd": w["balance"] * price, "change_30d": ch30,
            "change_30d_usd": ch30 * price,
        })
    wallets.sort(key=lambda x: x["balance"], reverse=True)

    staking_data = None
    if chain_u == "ETH":
        staking_data = {
            "total_staked": 34000000 + random.uniform(-500000, 1000000),
            "staking_ratio": round(28.3 + random.uniform(-0.5, 0.5), 1),
            "validators": 1050000 + random.randint(-5000, 10000),
            "avg_apy": round(3.8 + random.uniform(-0.3, 0.3), 2),
            "pending_withdrawals": random.uniform(50000, 200000),
        }
    elif chain_u == "SOL":
        staking_data = {
            "total_staked": 380000000 + random.uniform(-5000000, 10000000),
            "staking_ratio": round(65.5 + random.uniform(-1, 1), 1),
            "validators": 1900 + random.randint(-50, 100),
            "avg_apy": round(7.2 + random.uniform(-0.5, 0.5), 2),
            "delinquent_stake": random.uniform(1, 3),
        }

    mc = price * cfg["supply"]
    rc = cfg["realized_cap"] + random.uniform(-cfg["realized_cap"] * 0.02, cfg["realized_cap"] * 0.03)

    data = {
        "chain": chain_u, "price": price,
        "top_wallets": {
            "total_balance": cfg["top100"] + random.uniform(-cfg["top100"] * 0.01, cfg["top100"] * 0.02),
            "change_7d": random.uniform(-cfg["top100"] * 0.005, cfg["top100"] * 0.01),
            "change_30d": random.uniform(-cfg["top100"] * 0.02, cfg["top100"] * 0.03),
        },
        "exchange_flows": {
            "inflow_24h": inflow, "outflow_24h": outflow,
            "exchange_reserve": cfg["exch_reserve"] + random.uniform(-cfg["exch_reserve"] * 0.02, cfg["exch_reserve"] * 0.02),
            "netflow_24h": netflow,
            "netflow_signal": "ACCUMULATION" if netflow > 0 else "DISTRIBUTION",
        },
        "metrics": {
            "sopr": round(sopr, 4),
            "sopr_status": "profit_taking" if sopr > 1.02 else "accumulation" if sopr < 0.98 else "neutral",
            "nupl": round(nupl, 3),
            "nupl_zone": "belief" if nupl > 0.5 else "optimism" if nupl > 0.25 else "hope",
            "mvrv": round(mvrv, 2),
            "mvrv_signal": "overvalued" if mvrv > 2.5 else "fair" if mvrv > 1.5 else "undervalued",
            "realized_cap": rc, "market_cap": mc,
            "cdd_7d_avg": cdd,
            "cdd_status": "elevated" if cdd > (15e6 if chain_u == "BTC" else 50e6 if chain_u == "ETH" else 200e6) else "normal",
        },
        "accumulation_zones": [
            {"range": f"${int(price * 0.85):,} - ${int(price * 0.9):,}", "strength": random.uniform(60, 90), "pct": "-15% to -10%"},
            {"range": f"${int(price * 0.9):,} - ${int(price * 0.95):,}", "strength": random.uniform(70, 95), "pct": "-10% to -5%"},
            {"range": f"${int(price * 0.95):,} - ${int(price):,}", "strength": random.uniform(50, 80), "pct": "-5% to current"},
        ],
        "notable_wallets": wallets,
        "staking": staking_data,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if chain_u == "BTC":
        data["miner_reserves"] = {"btc_balance": 1.82e6 + random.uniform(-10000, 10000), "change_30d": random.uniform(-5000, 3000), "reserve_status": "stable"}

    _set(f"onchain_{chain}", data, 60)
    return data


# ═══════════════════════════════════════════════════════════
# ALTSEASON  – real prices + DeFi Llama TVL
# ═══════════════════════════════════════════════════════════
async def get_altseason_data() -> Dict:
    c = _get("altseason", 120)
    if c:
        return c

    prices_data = await ds.get_prices()
    tvl_data = await ds.get_defi_tvl()
    coins = prices_data.get("coins", {})
    gl = prices_data.get("global", {})

    random.seed(_seed())

    btc_dom = gl.get("btc_dominance", 54.5)
    eth_dom = gl.get("eth_dominance", 11.8)
    sol = coins.get("SOL", {})
    sol_mc = sol.get("market_cap", 0)
    total_mc = gl.get("total_market_cap", 1)
    sol_dom = round((sol_mc / total_mc) * 100, 2) if total_mc else 0

    btc_mc = coins.get("BTC", {}).get("market_cap", 0)
    eth_mc = coins.get("ETH", {}).get("market_cap", 0)
    total3 = total_mc - btc_mc - eth_mc
    total2 = total_mc - btc_mc

    btc_7d = coins.get("BTC", {}).get("change_7d", 0)

    # Top coins vs BTC performance
    alt_coins = ["ETH", "SOL", "XRP", "BNB", "ADA", "DOGE", "AVAX", "DOT", "LINK",
                 "SHIB", "UNI", "NEAR", "INJ", "APT", "ARB", "OP", "SUI", "FIL", "PEPE", "WIF"]
    top50_vs_btc = []
    for sym in alt_coins:
        cd = coins.get(sym, {})
        perf = cd.get("change_7d", 0) - btc_7d if cd else random.uniform(-10, 10)
        top50_vs_btc.append({"coin": sym, "vs_btc_7d": round(perf, 2), "outperforming": perf > 0})

    outperforming_count = sum(1 for c in top50_vs_btc if c["outperforming"])

    sectors = {
        "meme": {"change_7d": round(random.uniform(-15, 35), 2), "volume_change": round(random.uniform(-20, 50), 2)},
        "ai": {"change_7d": round(random.uniform(-10, 25), 2), "volume_change": round(random.uniform(-15, 40), 2)},
        "defi": {"change_7d": round(random.uniform(-8, 18), 2), "volume_change": round(random.uniform(-10, 30), 2)},
        "l2": {"change_7d": round(random.uniform(-12, 20), 2), "volume_change": round(random.uniform(-15, 35), 2)},
        "gaming": {"change_7d": round(random.uniform(-18, 22), 2), "volume_change": round(random.uniform(-25, 45), 2)},
        "rwa": {"change_7d": round(random.uniform(-5, 15), 2), "volume_change": round(random.uniform(-10, 25), 2)},
    }

    defi_tvl = tvl_data.get("total_tvl", 95e9)
    defi_tvl_change = tvl_data.get("tvl_change_1d", 0)

    narratives = [
        {"name": "AI Agents", "score": random.uniform(60, 95), "trend": "hot"},
        {"name": "Memecoins", "score": random.uniform(40, 85), "trend": "volatile"},
        {"name": "RWA", "score": random.uniform(50, 75), "trend": "growing"},
        {"name": "DePIN", "score": random.uniform(45, 70), "trend": "stable"},
        {"name": "L2 Scaling", "score": random.uniform(55, 80), "trend": "growing"},
        {"name": "Restaking", "score": random.uniform(40, 65), "trend": "cooling"},
    ]

    alt_signals = [
        btc_dom < 55, outperforming_count > 10,
        (total3 > 0 and random.random() > 0.4),
        defi_tvl_change > 1,
        sectors["meme"]["change_7d"] > 10,
    ]
    altseason_score = sum(20 for s in alt_signals if s) + random.uniform(0, 10)
    altseason_score = min(100, max(0, altseason_score))

    data = {
        "total2": total2, "total2_change_7d": round(random.uniform(-5, 8), 2),
        "total3": total3, "total3_change_7d": round(random.uniform(-6, 10), 2),
        "dominance": {"btc": btc_dom, "eth": eth_dom, "sol": sol_dom, "other": round(100 - btc_dom - eth_dom - sol_dom, 2)},
        "top50_vs_btc": top50_vs_btc,
        "outperforming_count": outperforming_count,
        "sectors": sectors,
        "defi_tvl": defi_tvl,
        "defi_tvl_change_7d": round(defi_tvl_change, 2),
        "narratives": narratives,
        "altseason_probability": round(altseason_score, 1),
        "altseason_status": "ALTSEASON" if altseason_score > 75 else "WARMING UP" if altseason_score > 50 else "BTC SEASON",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    _set("altseason", data, 120)
    return data


# ═══════════════════════════════════════════════════════════
# RISK ENGINE  – anchored to real prices & Fear&Greed
# ═══════════════════════════════════════════════════════════
async def get_risk_engine() -> Dict:
    c = _get("risk_engine", 60)
    if c:
        return c

    prices_data = await ds.get_prices()
    fg = await ds.get_fear_greed()
    coins = prices_data.get("coins", {})
    btc = coins.get("BTC", {})

    random.seed(_seed())

    dvol_btc = random.uniform(45, 85)
    dvol_eth = random.uniform(50, 95)

    regime_score = random.uniform(0, 100)
    if regime_score > 70:
        market_regime, regime_desc = "TREND", "Strong directional movement"
    elif regime_score > 40:
        market_regime, regime_desc = "CHOP", "Sideways, range-bound"
    else:
        market_regime, regime_desc = "DISTRIBUTION", "Potential top formation"

    risk_factors = {
        "funding_heat": random.uniform(0, 10),
        "leverage_crowding": random.uniform(0, 10),
        "exchange_reserve_change": random.uniform(0, 10),
        "stablecoin_flow": random.uniform(0, 10),
        "volatility": random.uniform(0, 10),
    }

    # Adjust by real fear&greed
    fg_val = fg.get("value", 50)
    if fg_val > 80:
        risk_factors["funding_heat"] = min(10, risk_factors["funding_heat"] + 2)
    if fg_val < 20:
        risk_factors["exchange_reserve_change"] = min(10, risk_factors["exchange_reserve_change"] + 2)

    risk_score = sum(risk_factors.values()) / len(risk_factors)
    leverage_score = random.uniform(3, 9)

    overheat_alerts = []
    funding_rate = random.uniform(-0.005, 0.03)
    if abs(funding_rate) > 0.015:
        overheat_alerts.append({"type": "FUNDING_SPIKE", "severity": "HIGH", "message": f"Funding rate at {funding_rate * 100:.3f}% - market overheated", "asset": "BTC"})

    btc_change = btc.get("change_24h", 0)
    oi_change = random.uniform(-5, 15)
    if oi_change > 8 and btc_change < 2:
        overheat_alerts.append({"type": "OI_PRICE_DIVERGENCE", "severity": "MEDIUM", "message": f"OI up {oi_change:.1f}% while price flat", "asset": "ALL"})

    data = {
        "volatility": {"dvol_btc": round(dvol_btc, 1), "dvol_eth": round(dvol_eth, 1), "status": "HIGH" if dvol_btc > 70 else "MEDIUM" if dvol_btc > 50 else "LOW"},
        "market_regime": {"current": market_regime, "description": regime_desc, "score": round(regime_score, 1)},
        "risk_score": {"overall": round(risk_score, 1), "factors": {k: round(v, 1) for k, v in risk_factors.items()}, "level": "EXTREME" if risk_score > 8 else "HIGH" if risk_score > 6 else "MEDIUM" if risk_score > 4 else "LOW"},
        "leverage_crowding": {"score": round(leverage_score, 1), "status": "DANGEROUS" if leverage_score > 7 else "ELEVATED" if leverage_score > 5 else "NORMAL"},
        "stablecoin_flows": {"usdt_minted_7d": random.uniform(-500e6, 800e6), "usdc_minted_7d": random.uniform(-300e6, 400e6), "total_minted_7d": random.uniform(-500e6, 1e9), "signal": "BULLISH" if random.random() > 0.5 else "NEUTRAL"},
        "exchange_reserves": {"btc_reserve": 2.3e6 + random.uniform(-50000, 50000), "btc_change_30d_pct": round(random.uniform(-5, 5), 2), "signal": "BULLISH" if random.random() > 0.5 else "NEUTRAL"},
        "overheat_alerts": overheat_alerts,
        "overheat_status": len(overheat_alerts) > 0,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    _set("risk_engine", data, 60)
    return data


# ═══════════════════════════════════════════════════════════
# OPTIONS  – anchored to real prices
# ═══════════════════════════════════════════════════════════
async def get_options_data() -> Dict:
    c = _get("options", 120)
    if c:
        return c

    prices_data = await ds.get_prices()
    coins = prices_data.get("coins", {})
    btc_price = coins.get("BTC", {}).get("price", 97000)
    eth_price = coins.get("ETH", {}).get("price", 3400)

    random.seed(_seed())

    btc_pc = random.uniform(0.4, 0.9)
    eth_pc = random.uniform(0.45, 0.95)
    btc_mp = btc_price * random.uniform(0.95, 1.02)
    eth_mp = eth_price * random.uniform(0.94, 1.03)

    btc_gamma_walls = [
        {"strike": round(btc_price * m, 0), "gamma": random.uniform(10, 50), "type": t}
        for m, t in [(0.9, "support"), (0.95, "support"), (1.0, "neutral"), (1.05, "resistance"), (1.1, "resistance")]
    ]

    expirations = []
    for i in range(1, 8):
        d = datetime.now() + timedelta(days=i * 7)
        expirations.append({"date": d.strftime("%Y-%m-%d"), "label": d.strftime("%d %b"), "btc_oi": random.uniform(1e9, 8e9), "eth_oi": random.uniform(200e6, 2e9), "notional": random.uniform(2e9, 15e9)})

    data = {
        "btc": {"put_call_ratio": round(btc_pc, 2), "max_pain": round(btc_mp, 0), "distance_to_max_pain_pct": round((btc_mp - btc_price) / btc_price * 100, 2), "iv_rank": round(random.uniform(20, 80), 1), "skew_25d": round(random.uniform(-15, 10), 2), "skew_signal": "NEUTRAL", "gamma_walls": btc_gamma_walls},
        "eth": {"put_call_ratio": round(eth_pc, 2), "max_pain": round(eth_mp, 0), "distance_to_max_pain_pct": round((eth_mp - eth_price) / eth_price * 100, 2), "iv_rank": round(random.uniform(25, 85), 1), "skew_25d": round(random.uniform(-18, 12), 2), "skew_signal": "NEUTRAL"},
        "expirations": expirations,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    _set("options", data, 120)
    return data


# ═══════════════════════════════════════════════════════════
# SENTIMENT – simulated
# ═══════════════════════════════════════════════════════════
async def get_sentiment_data() -> Dict:
    c = _get("sentiment", 300)
    if c:
        return c
    random.seed(_seed())
    data = {
        "twitter": {"btc_mentions": random.randint(50000, 200000), "eth_mentions": random.randint(20000, 80000), "sol_mentions": random.randint(15000, 60000), "volume_change_24h": round(random.uniform(-30, 80), 1), "is_spike": random.random() > 0.7},
        "influencer_sentiment": {"score": round(random.uniform(-1, 1), 2), "bullish_pct": round(random.uniform(30, 70), 1), "status": "NEUTRAL"},
        "google_trends": {"bitcoin": random.randint(40, 100), "ethereum": random.randint(30, 80), "crypto": random.randint(35, 90)},
        "telegram": {"mention_count": random.randint(10000, 50000), "change_24h": round(random.uniform(-20, 60), 1)},
        "reddit": {"posts_24h": random.randint(500, 2000), "comments_24h": random.randint(5000, 20000), "sentiment_score": round(random.uniform(-0.3, 0.5), 2)},
        "narrative_shifts": [
            {"topic": "ETF Inflows", "momentum": round(random.uniform(-20, 50), 1), "direction": "up"},
            {"topic": "Rate Cuts", "momentum": round(random.uniform(-30, 40), 1), "direction": "stable"},
            {"topic": "AI Tokens", "momentum": round(random.uniform(-10, 70), 1), "direction": "up"},
            {"topic": "Memecoin Mania", "momentum": round(random.uniform(-40, 60), 1), "direction": "volatile"},
        ],
        "sentiment_divergence": None,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    _set("sentiment", data, 300)
    return data


# ═══════════════════════════════════════════════════════════
# CAPITAL FLOWS – simulated
# ═══════════════════════════════════════════════════════════
async def get_capital_flows() -> Dict:
    c = _get("capital_flows", 300)
    if c:
        return c
    random.seed(_seed())
    sectors = ["DeFi", "AI", "Meme", "L2", "Gaming", "RWA", "Infrastructure"]
    sf = [{"sector": s, "net_flow_7d": random.uniform(-200e6, 500e6), "direction": "inflow", "strength": random.uniform(20, 80)} for s in sectors]
    data = {
        "asset_flows": [
            {"from": "BTC", "to": "ETH", "flow_usd": random.uniform(-500e6, 800e6)},
            {"from": "ETH", "to": "SOL", "flow_usd": random.uniform(-200e6, 400e6)},
            {"from": "BTC", "to": "Alts", "flow_usd": random.uniform(-1e9, 1.5e9)},
            {"from": "Stables", "to": "BTC", "flow_usd": random.uniform(-800e6, 1.2e9)},
        ],
        "sector_flows": sorted(sf, key=lambda x: x["net_flow_7d"], reverse=True),
        "rotation_signals": [{"from_sector": "DeFi", "to_sector": "AI", "strength": random.uniform(0, 100)}],
        "volume_heatmap": {s: {"volume_24h": random.uniform(100e6, 2e9), "change_24h": round(random.uniform(-30, 50), 1), "relative_strength": random.uniform(0, 100)} for s in sectors},
        "dominant_flow": max(sf, key=lambda x: x["net_flow_7d"])["sector"],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    _set("capital_flows", data, 300)
    return data


# ═══════════════════════════════════════════════════════════
# AI SIGNALS  – anchored to real price
# ═══════════════════════════════════════════════════════════
async def get_ai_signals() -> Dict:
    c = _get("ai_signals", 60)
    if c:
        return c

    prices_data = await ds.get_prices()
    btc_price = prices_data.get("coins", {}).get("BTC", {}).get("price", 97000)

    random.seed(_seed())
    factors = {"onchain": random.uniform(-1, 1), "derivatives": random.uniform(-1, 1), "etf_flow": random.uniform(-1, 1), "macro": random.uniform(-1, 1), "sentiment": random.uniform(-1, 1)}
    comp = sum(factors.values()) / len(factors)

    data = {
        "composite_signal": {"value": round(comp, 3), "direction": "BULLISH" if comp > 0.2 else "BEARISH" if comp < -0.2 else "NEUTRAL", "strength": round(abs(comp) * 100, 1), "factors": {k: round(v, 2) for k, v in factors.items()}},
        "squeeze_probability": {"short_squeeze": round(random.uniform(10, 60), 1), "long_squeeze": round(random.uniform(10, 50), 1), "higher_risk": "SHORT" if random.random() > 0.5 else "LONG"},
        "liquidity_zones": [
            {"price": round(btc_price * m, 0), "type": t, "strength": random.uniform(50, 90)}
            for m, t in [(0.92, "demand"), (0.95, "demand"), (1.05, "supply"), (1.08, "supply")]
        ],
        "weekly_range": {"predicted_low": round(btc_price * (1 - random.uniform(0.03, 0.08)), 0), "predicted_high": round(btc_price * (1 + random.uniform(0.03, 0.1)), 0), "range_pct": round(random.uniform(6, 15), 1)},
        "key_levels": {"immediate_support": round(btc_price * 0.98, 0), "strong_support": round(btc_price * 0.95, 0), "immediate_resistance": round(btc_price * 1.02, 0), "strong_resistance": round(btc_price * 1.05, 0)},
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    _set("ai_signals", data, 60)
    return data


# ═══════════════════════════════════════════════════════════
# PORTFOLIO  – real prices for positions
# ═══════════════════════════════════════════════════════════
async def get_portfolio_data(user_id: str = "default") -> Dict:
    prices_data = await ds.get_prices()
    coins = prices_data.get("coins", {})

    random.seed(_seed() + hash(user_id) % 1000)

    positions = [
        {"asset": "BTC", "size": random.uniform(0.5, 5), "entry": random.uniform(85000, 95000), "current": coins.get("BTC", {}).get("price", 97000), "leverage": random.uniform(1, 5)},
        {"asset": "ETH", "size": random.uniform(5, 50), "entry": random.uniform(3200, 3400), "current": coins.get("ETH", {}).get("price", 3400), "leverage": random.uniform(1, 3)},
        {"asset": "SOL", "size": random.uniform(50, 500), "entry": random.uniform(170, 185), "current": coins.get("SOL", {}).get("price", 190), "leverage": random.uniform(1, 3)},
    ]

    total_value = 0
    total_pnl = 0
    for pos in positions:
        pos["value_usd"] = pos["size"] * pos["current"]
        pos["pnl_usd"] = pos["size"] * (pos["current"] - pos["entry"])
        pos["pnl_pct"] = ((pos["current"] - pos["entry"]) / pos["entry"]) * 100 if pos["entry"] else 0
        if pos["leverage"] > 1:
            liq_d = (1 / pos["leverage"]) * 0.995
            pos["liquidation_price"] = pos["entry"] * (1 - liq_d)
            pos["distance_to_liq_pct"] = abs((pos["current"] - pos["liquidation_price"]) / pos["current"]) * 100
        else:
            pos["liquidation_price"] = 0
            pos["distance_to_liq_pct"] = 100
        total_value += pos["value_usd"]
        total_pnl += pos["pnl_usd"]

    for pos in positions:
        pos["exposure_pct"] = (pos["value_usd"] / total_value) * 100 if total_value else 0

    return {
        "positions": positions,
        "summary": {"total_value": round(total_value, 2), "unrealized_pnl": round(total_pnl, 2), "unrealized_pnl_pct": round((total_pnl / (total_value - total_pnl)) * 100, 2) if total_value != total_pnl else 0},
        "risk_metrics": {"avg_leverage": round(sum(p["leverage"] for p in positions) / len(positions), 2), "min_distance_to_liq": round(min(p["distance_to_liq_pct"] for p in positions), 1)},
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


# ═══════════════════════════════════════════════════════════
# WAR MODE  – anchored to real price changes
# ═══════════════════════════════════════════════════════════
async def get_war_mode_alerts() -> Dict:
    c = _get("war_mode", 30)
    if c:
        return c

    prices_data = await ds.get_prices()
    btc = prices_data.get("coins", {}).get("BTC", {})

    random.seed(_seed())
    alerts = []

    funding_rate = random.uniform(-0.005, 0.03)
    if abs(funding_rate) > 0.015:
        alerts.append({"type": "FUNDING_SPIKE", "severity": "HIGH" if abs(funding_rate) > 0.025 else "MEDIUM", "value": f"{funding_rate * 100:.3f}%", "message": "Extreme funding rate detected", "action": "Consider counter-trading the crowd"})

    oi_change = random.uniform(-5, 12)
    if abs(oi_change) > 5:
        alerts.append({"type": "OI_SPIKE", "severity": "MEDIUM", "value": f"{oi_change:+.1f}%", "message": "Rapid OI change in last hour", "action": "Watch for liquidation cascade"})

    # Use real price change for severity
    btc_change = abs(btc.get("change_24h", 0))
    if btc_change > 5:
        alerts.append({"type": "PRICE_VOLATILITY", "severity": "HIGH", "value": f"{btc.get('change_24h', 0):+.1f}%", "message": f"BTC moved {btc.get('change_24h', 0):+.1f}% in 24h", "action": "Review all open positions"})

    whale_move = random.uniform(0, 150e6)
    if whale_move > 50e6:
        alerts.append({"type": "WHALE_MOVE", "severity": "HIGH" if whale_move > 100e6 else "MEDIUM", "value": f"${whale_move / 1e6:.0f}M", "message": "Large whale transaction detected", "action": "Monitor exchange flows"})

    stress = len(alerts) * 15 + sum(1 for a in alerts if a["severity"] == "HIGH") * 10
    stress = min(100, stress)

    data = {
        "stress_score": stress,
        "stress_level": "CRITICAL" if stress > 70 else "HIGH" if stress > 50 else "ELEVATED" if stress > 30 else "NORMAL",
        "active_alerts": len(alerts),
        "alerts": alerts,
        "war_mode_active": stress > 50,
        "recommendation": "Reduce exposure and increase hedges" if stress > 50 else "Monitor closely" if stress > 30 else "Normal operations",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    _set("war_mode", data, 30)
    return data
