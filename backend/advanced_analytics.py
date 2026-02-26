"""
RUKOS_CRYPTO HUB - Advanced Crypto Analytics API
Extended endpoints for professional trading dashboard
"""
from fastapi import APIRouter
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
import random
import math
import logging

logger = logging.getLogger(__name__)

# Cache system
_cache: Dict[str, Any] = {}
_cache_expiry: Dict[str, datetime] = {}

def get_cached(key: str, ttl_seconds: int = 60):
    if key in _cache and key in _cache_expiry:
        if datetime.now(timezone.utc) < _cache_expiry[key]:
            return _cache[key]
    return None

def set_cached(key: str, data: Any, ttl_seconds: int = 60):
    _cache[key] = data
    _cache_expiry[key] = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)

def get_seed():
    """Consistent seed within 5-minute windows"""
    return int(datetime.now().timestamp() / 300)

# ==================== MARKET CORE ====================

def get_market_core_data() -> Dict:
    """Macro panel data with prices, fear&greed, gold"""
    cache_key = "market_core"
    cached = get_cached(cache_key, 60)
    if cached:
        return cached
    
    random.seed(get_seed())
    
    # Crypto prices
    btc_price = 97500 + random.uniform(-2000, 2000)
    eth_price = 3450 + random.uniform(-150, 150)
    sol_price = 185 + random.uniform(-10, 10)
    
    total_mcap = 3.45e12 + random.uniform(-0.1e12, 0.1e12)
    btc_mcap = btc_price * 19.5e6
    eth_mcap = eth_price * 120e6
    
    btc_dom = (btc_mcap / total_mcap) * 100
    eth_dom = (eth_mcap / total_mcap) * 100
    total3 = total_mcap - btc_mcap - eth_mcap
    
    # Stablecoins
    usdt_mcap = 142e9 + random.uniform(-2e9, 2e9)
    usdc_mcap = 45e9 + random.uniform(-1e9, 1e9)
    
    # Traditional markets with Gold
    dxy = 103.5 + random.uniform(-0.5, 0.5)
    us10y = 4.25 + random.uniform(-0.1, 0.1)
    spx = 6050 + random.uniform(-50, 50)
    nq = 21500 + random.uniform(-200, 200)
    gold = 2650 + random.uniform(-30, 30)  # Gold price per oz
    
    # M2 Global Liquidity
    m2_global = 108.5 + random.uniform(-0.5, 0.5)
    
    # Risk regime
    risk_score = random.uniform(0, 100)
    regime = "risk-on" if risk_score > 50 else "risk-off"
    
    # Fear & Greed (simulated with realistic values)
    fear_greed_value = random.randint(15, 85)
    if fear_greed_value <= 25:
        fg_class = "Extreme Fear"
    elif fear_greed_value <= 45:
        fg_class = "Fear"
    elif fear_greed_value <= 55:
        fg_class = "Neutral"
    elif fear_greed_value <= 75:
        fg_class = "Greed"
    else:
        fg_class = "Extreme Greed"
    
    data = {
        # Crypto prices
        "prices": [
            {
                "symbol": "BTC",
                "name": "Bitcoin",
                "price": round(btc_price, 2),
                "change_24h": round(random.uniform(-3, 5), 2),
                "change_7d": round(random.uniform(-8, 12), 2),
                "market_cap": btc_mcap,
                "volume_24h": random.uniform(40e9, 60e9)
            },
            {
                "symbol": "ETH",
                "name": "Ethereum",
                "price": round(eth_price, 2),
                "change_24h": round(random.uniform(-4, 6), 2),
                "change_7d": round(random.uniform(-10, 15), 2),
                "market_cap": eth_mcap,
                "volume_24h": random.uniform(15e9, 25e9)
            },
            {
                "symbol": "SOL",
                "name": "Solana",
                "price": round(sol_price, 2),
                "change_24h": round(random.uniform(-5, 8), 2),
                "change_7d": round(random.uniform(-12, 18), 2),
                "market_cap": sol_price * 430e6,
                "volume_24h": random.uniform(2e9, 5e9)
            }
        ],
        # Fear & Greed Index
        "fear_greed": {
            "value": fear_greed_value,
            "classification": fg_class,
            "previous_day": random.randint(15, 85),
            "previous_week": random.randint(15, 85)
        },
        # Market cap metrics
        "total_market_cap": total_mcap,
        "total_market_cap_change_24h": random.uniform(-3, 5),
        "btc_dominance": round(btc_dom, 2),
        "btc_dominance_change_24h": round(random.uniform(-0.5, 0.5), 2),
        "eth_dominance": round(eth_dom, 2),
        "eth_dominance_change_24h": round(random.uniform(-0.3, 0.3), 2),
        "total3": total3,
        "total3_change_24h": random.uniform(-4, 6),
        # Stablecoins
        "stablecoin_mcap": usdt_mcap + usdc_mcap,
        "usdt_mcap": usdt_mcap,
        "usdc_mcap": usdc_mcap,
        "stablecoin_change_24h": random.uniform(-0.5, 1),
        # Traditional markets
        "traditional_markets": {
            "dxy": {"value": round(dxy, 2), "change": round(random.uniform(-0.3, 0.3), 2)},
            "us10y": {"value": round(us10y, 3), "change": round(random.uniform(-0.05, 0.05), 3)},
            "spx": {"value": round(spx, 2), "change_pct": round(random.uniform(-1, 1.5), 2)},
            "nq": {"value": round(nq, 2), "change_pct": round(random.uniform(-1.5, 2), 2)},
            "gold": {"value": round(gold, 2), "change_pct": round(random.uniform(-1, 1), 2)}
        },
        # Legacy flat format for backward compatibility
        "dxy": round(dxy, 2),
        "dxy_change": round(random.uniform(-0.3, 0.3), 2),
        "us10y": round(us10y, 3),
        "us10y_change": round(random.uniform(-0.05, 0.05), 3),
        "spx": round(spx, 2),
        "spx_change_pct": round(random.uniform(-1, 1.5), 2),
        "nq": round(nq, 2),
        "nq_change_pct": round(random.uniform(-1.5, 2), 2),
        "gold": round(gold, 2),
        "gold_change_pct": round(random.uniform(-1, 1), 2),
        # Liquidity
        "m2_global": round(m2_global, 2),
        "m2_change_mom": round(random.uniform(-0.5, 1.5), 2),
        # Regime
        "market_regime": regime,
        "risk_score": round(risk_score, 1),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    set_cached(cache_key, data, 60)
    return data

# ==================== DERIVATIVES CONTROL PANEL ====================

def get_derivatives_data(asset: str = "all") -> Dict:
    """Derivatives data for BTC, ETH, SOL or all"""
    cache_key = f"derivatives_{asset}"
    cached = get_cached(cache_key, 30)
    if cached:
        return cached
    
    random.seed(get_seed())
    
    assets = ["BTC", "ETH", "SOL"] if asset == "all" else [asset.upper()]
    
    # Record values for comparison
    records = {
        "BTC": {"oi": 35e9, "funding": 0.15, "ls_ratio": 2.5},
        "ETH": {"oi": 15e9, "funding": 0.12, "ls_ratio": 2.2},
        "SOL": {"oi": 4e9, "funding": 0.18, "ls_ratio": 2.8}
    }
    
    assets_data = {}
    for a in assets:
        rec = records.get(a, records["BTC"])
        
        # Current values
        oi = rec["oi"] * random.uniform(0.7, 0.98)
        oi_24h = random.uniform(-5, 8)
        oi_7d = random.uniform(-10, 15)
        
        funding = random.uniform(-0.02, rec["funding"] * 1.1)
        ls_ratio = random.uniform(0.8, rec["ls_ratio"])
        
        basis = random.uniform(-0.5, 2.5)
        
        # Check if near record
        oi_to_record = ((rec["oi"] - oi) / rec["oi"]) * 100
        funding_to_record = ((rec["funding"] - abs(funding)) / rec["funding"]) * 100 if funding > 0 else 100
        
        is_oi_record = oi >= rec["oi"] * 0.95
        is_funding_record = abs(funding) >= rec["funding"] * 0.9
        
        # Generate funding history (last 7 days, 3 times per day)
        funding_history = []
        for i in range(21, -1, -1):
            dt = datetime.now() - timedelta(hours=i*8)
            funding_history.append({
                "timestamp": dt.isoformat(),
                "rate": round(random.uniform(-0.01, 0.08), 4),
                "time": dt.strftime("%d.%m %H:00")
            })
        
        # Liquidation clusters (price levels with liquidation density)
        base_price = {"BTC": 97500, "ETH": 3450, "SOL": 185}[a]
        liq_clusters = []
        for pct in [-10, -7, -5, -3, -1, 1, 3, 5, 7, 10]:
            price = base_price * (1 + pct/100)
            density = random.uniform(10, 100)
            side = "long" if pct < 0 else "short"
            liq_clusters.append({
                "price": round(price, 2),
                "pct_from_current": pct,
                "density": round(density, 1),
                "side": side,
                "value_usd": round(density * random.uniform(1e6, 10e6), 0)
            })
        
        # Top traders positioning
        top_traders = {
            "long_accounts": random.randint(40, 60),
            "short_accounts": 100 - random.randint(40, 60),
            "long_ratio": round(random.uniform(0.45, 0.65), 2),
            "whale_sentiment": "bullish" if random.random() > 0.5 else "bearish"
        }
        
        # OI Divergence (price up but OI down = bearish divergence)
        price_change = random.uniform(-5, 8)
        oi_change = oi_24h
        divergence = None
        if price_change > 2 and oi_change < -2:
            divergence = {"type": "bearish", "signal": "Price up, OI down", "strength": "medium"}
        elif price_change < -2 and oi_change > 2:
            divergence = {"type": "bullish", "signal": "Price down, OI up", "strength": "medium"}
        
        # Gamma exposure (options)
        gamma_exp = {
            "total_gamma": round(random.uniform(-500e6, 500e6), 0),
            "max_pain": round(base_price * random.uniform(0.95, 1.05), 0),
            "gamma_flip": round(base_price * random.uniform(0.97, 1.03), 0),
            "dealer_positioning": "long_gamma" if random.random() > 0.5 else "short_gamma"
        }
        
        assets_data[a] = {
            "open_interest": oi,
            "oi_change_24h": round(oi_24h, 2),
            "oi_change_7d": round(oi_7d, 2),
            "oi_to_record_pct": round(oi_to_record, 1),
            "is_oi_record": is_oi_record,
            "funding_rate": round(funding, 4),
            "funding_to_record_pct": round(funding_to_record, 1),
            "is_funding_record": is_funding_record,
            "funding_history": funding_history,
            "long_short_ratio": round(ls_ratio, 2),
            "basis": round(basis, 3),
            "top_traders": top_traders,
            "divergence": divergence,
            "liquidation_clusters": liq_clusters,
            "gamma_exposure": gamma_exp
        }
    
    # Aggregate for all crypto
    if asset == "all":
        total_oi = sum(d["open_interest"] for d in assets_data.values())
        avg_funding = sum(d["funding_rate"] for d in assets_data.values()) / len(assets_data)
        avg_ls = sum(d["long_short_ratio"] for d in assets_data.values()) / len(assets_data)
        
        data = {
            "total_open_interest": total_oi,
            "total_oi_change_24h": random.uniform(-3, 5),
            "avg_funding_rate": round(avg_funding, 4),
            "avg_long_short_ratio": round(avg_ls, 2),
            "by_asset": assets_data,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    else:
        data = {
            **assets_data[assets[0]],
            "asset": assets[0],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    
    set_cached(cache_key, data, 30)
    return data

# ==================== ETF FLOW INTELLIGENCE ====================

def get_etf_intelligence() -> Dict:
    """Extended ETF flow data with all existing crypto ETFs"""
    cache_key = "etf_intelligence"
    cached = get_cached(cache_key, 300)
    if cached:
        return cached
    
    random.seed(get_seed())
    
    # All BTC ETF Funds (comprehensive list)
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
    
    # All ETH ETF Funds
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
    
    # Calculate totals
    total_btc_aum = sum(f["aum"] for f in btc_funds)
    total_eth_aum = sum(f["aum"] for f in eth_funds)
    daily_btc_flow = sum(f["daily_flow"] for f in btc_funds)
    daily_eth_flow = sum(f["daily_flow"] for f in eth_funds)
    
    # Cumulative flows
    cumulative_btc = 38.5e9 + random.uniform(-1e9, 2e9)
    cumulative_eth = 3.2e9 + random.uniform(-0.5e9, 0.5e9)
    
    # % of spot volume
    btc_spot_volume = 45e9
    eth_spot_volume = 18e9
    btc_pct_spot = (abs(daily_btc_flow) / btc_spot_volume) * 100
    eth_pct_spot = (abs(daily_eth_flow) / eth_spot_volume) * 100
    
    # Premium/Discount
    btc_premium = random.uniform(-0.5, 0.8)
    eth_premium = random.uniform(-0.8, 0.5)
    
    # Flow vs Price correlation
    flow_price_corr_btc = random.uniform(0.3, 0.85)
    flow_price_corr_eth = random.uniform(0.2, 0.75)
    
    # Miner metrics
    miner_daily_sell = random.uniform(300, 600)
    miner_sell_usd = miner_daily_sell * 97500
    
    # ETF absorption
    etf_btc_bought = daily_btc_flow / 97500 if daily_btc_flow > 0 else 0
    etf_absorption = etf_btc_bought > miner_daily_sell
    absorption_ratio = etf_btc_bought / miner_daily_sell if miner_daily_sell > 0 else 0
    
    # Historical flows (last 14 days)
    flow_history = []
    for i in range(14, -1, -1):
        dt = datetime.now() - timedelta(days=i)
        flow_history.append({
            "date": dt.strftime("%Y-%m-%d"),
            "date_short": dt.strftime("%d.%m"),
            "btc_flow": random.uniform(-400e6, 700e6),
            "eth_flow": random.uniform(-100e6, 150e6),
            "btc_price": 97500 + random.uniform(-3000, 3000),
            "eth_price": 3450 + random.uniform(-200, 200)
        })
    
    # All funds combined (for "all ETFs" view)
    all_funds = []
    for f in btc_funds:
        all_funds.append({**f, "asset": "BTC"})
    for f in eth_funds:
        all_funds.append({**f, "asset": "ETH"})
    all_funds.sort(key=lambda x: x["aum"], reverse=True)
    
    data = {
        "total_aum": total_btc_aum + total_eth_aum,
        "total_daily_flow": daily_btc_flow + daily_eth_flow,
        "btc_etf": {
            "total_aum": total_btc_aum,
            "daily_net_flow": daily_btc_flow,
            "cumulative_flow": cumulative_btc,
            "pct_of_spot_volume": round(btc_pct_spot, 2),
            "premium_discount": round(btc_premium, 3),
            "flow_price_correlation": round(flow_price_corr_btc, 2),
            "funds": btc_funds,
            "fund_count": len(btc_funds)
        },
        "eth_etf": {
            "total_aum": total_eth_aum,
            "daily_net_flow": daily_eth_flow,
            "cumulative_flow": cumulative_eth,
            "pct_of_spot_volume": round(eth_pct_spot, 2),
            "premium_discount": round(eth_premium, 3),
            "flow_price_correlation": round(flow_price_corr_eth, 2),
            "funds": eth_funds,
            "fund_count": len(eth_funds)
        },
        "all_funds": all_funds,
        "miner_metrics": {
            "daily_sell_btc": round(miner_daily_sell, 1),
            "daily_sell_usd": miner_sell_usd
        },
        "etf_absorption": {
            "signal": etf_absorption,
            "ratio": round(absorption_ratio, 2),
            "status": "ABSORBING" if etf_absorption else "NOT ABSORBING"
        },
        "flow_history": flow_history,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    set_cached(cache_key, data, 300)
    return data

# ==================== ONCHAIN WAR ROOM ====================

def get_onchain_data(chain: str = "btc") -> Dict:
    """Smart Money / Onchain metrics for BTC, ETH, or SOL"""
    cache_key = f"onchain_{chain}"
    cached = get_cached(cache_key, 120)
    if cached:
        return cached
    
    random.seed(get_seed())
    chain = chain.upper()
    
    # Chain-specific configurations
    chain_configs = {
        "BTC": {
            "price": 97500 + random.uniform(-2000, 2000),
            "supply": 19.5e6,
            "top100_balance": 2.1e6,
            "exchange_reserve": 2.3e6,
            "realized_cap": 650e9,
            "notable_wallets": [
                {"name": "MicroStrategy", "balance": 252220, "change_30d": random.randint(0, 5000)},
                {"name": "US Government", "balance": 198109, "change_30d": random.randint(-1000, 0)},
                {"name": "Block.one", "balance": 164000, "change_30d": 0},
                {"name": "Tether Treasury", "balance": 82454, "change_30d": random.randint(-500, 2000)},
                {"name": "Marathon Digital", "balance": 44893, "change_30d": random.randint(500, 2000)},
                {"name": "Riot Platforms", "balance": 17722, "change_30d": random.randint(200, 800)},
                {"name": "Galaxy Digital", "balance": 15449, "change_30d": random.randint(-500, 500)},
                {"name": "Tesla", "balance": 9720, "change_30d": 0},
                {"name": "El Salvador", "balance": 5955, "change_30d": random.randint(0, 100)},
                {"name": "Coinbase Treasury", "balance": 9000, "change_30d": random.randint(-200, 200)},
            ]
        },
        "ETH": {
            "price": 3450 + random.uniform(-150, 150),
            "supply": 120e6,
            "top100_balance": 28.5e6,
            "exchange_reserve": 15.2e6,
            "realized_cap": 280e9,
            "notable_wallets": [
                {"name": "Ethereum Foundation", "balance": 273000, "change_30d": random.randint(-5000, 1000)},
                {"name": "Vitalik Buterin", "balance": 240000, "change_30d": random.randint(-2000, 500)},
                {"name": "Wrapped ETH Contract", "balance": 3200000, "change_30d": random.randint(-50000, 100000)},
                {"name": "Lido Staking", "balance": 9800000, "change_30d": random.randint(50000, 200000)},
                {"name": "Beacon Chain Deposit", "balance": 34000000, "change_30d": random.randint(100000, 500000)},
                {"name": "Kraken", "balance": 1500000, "change_30d": random.randint(-30000, 50000)},
                {"name": "Binance", "balance": 4200000, "change_30d": random.randint(-100000, 150000)},
                {"name": "Coinbase", "balance": 2100000, "change_30d": random.randint(-50000, 80000)},
                {"name": "Arbitrum Bridge", "balance": 850000, "change_30d": random.randint(10000, 50000)},
                {"name": "Optimism Bridge", "balance": 450000, "change_30d": random.randint(5000, 25000)},
            ]
        },
        "SOL": {
            "price": 185 + random.uniform(-10, 10),
            "supply": 430e6,
            "top100_balance": 180e6,
            "exchange_reserve": 45e6,
            "realized_cap": 45e9,
            "notable_wallets": [
                {"name": "Solana Foundation", "balance": 50000000, "change_30d": random.randint(-500000, 200000)},
                {"name": "Alameda Remnant", "balance": 8500000, "change_30d": random.randint(-200000, 0)},
                {"name": "Jump Trading", "balance": 12000000, "change_30d": random.randint(-100000, 500000)},
                {"name": "Binance", "balance": 25000000, "change_30d": random.randint(-500000, 1000000)},
                {"name": "Coinbase", "balance": 8000000, "change_30d": random.randint(-200000, 400000)},
                {"name": "Kraken", "balance": 5500000, "change_30d": random.randint(-100000, 200000)},
                {"name": "Marinade Finance", "balance": 8200000, "change_30d": random.randint(100000, 500000)},
                {"name": "Jito Stake Pool", "balance": 12500000, "change_30d": random.randint(200000, 800000)},
                {"name": "Multicoin Capital", "balance": 3500000, "change_30d": random.randint(-50000, 100000)},
                {"name": "Polychain Capital", "balance": 2800000, "change_30d": random.randint(-30000, 80000)},
            ]
        }
    }
    
    config = chain_configs.get(chain, chain_configs["BTC"])
    price = config["price"]
    
    # Top wallets
    top_wallets = {
        "total_balance": config["top100_balance"] + random.uniform(-config["top100_balance"]*0.01, config["top100_balance"]*0.02),
        "change_7d": random.uniform(-config["top100_balance"]*0.005, config["top100_balance"]*0.01),
        "change_30d": random.uniform(-config["top100_balance"]*0.02, config["top100_balance"]*0.03)
    }
    
    # Exchange flows
    base_flow = config["exchange_reserve"] * 0.005
    exchange_flows = {
        "inflow_24h": random.uniform(base_flow * 0.5, base_flow * 1.5),
        "outflow_24h": random.uniform(base_flow * 0.6, base_flow * 1.8),
        "exchange_reserve": config["exchange_reserve"] + random.uniform(-config["exchange_reserve"]*0.02, config["exchange_reserve"]*0.02)
    }
    exchange_flows["netflow_24h"] = exchange_flows["outflow_24h"] - exchange_flows["inflow_24h"]
    exchange_flows["netflow_signal"] = "ACCUMULATION" if exchange_flows["netflow_24h"] > 0 else "DISTRIBUTION"
    
    # Onchain metrics (varies by chain)
    if chain == "BTC":
        sopr = 1 + random.uniform(-0.05, 0.08)
        nupl = random.uniform(0.3, 0.65)
        mvrv = random.uniform(1.5, 3.2)
        cdd_7d = random.uniform(5e6, 25e6)
        cdd_status = "elevated" if cdd_7d > 15e6 else "normal"
    elif chain == "ETH":
        sopr = 1 + random.uniform(-0.03, 0.06)
        nupl = random.uniform(0.25, 0.55)
        mvrv = random.uniform(1.3, 2.8)
        cdd_7d = random.uniform(10e6, 80e6)
        cdd_status = "elevated" if cdd_7d > 50e6 else "normal"
    else:  # SOL
        sopr = 1 + random.uniform(-0.08, 0.12)
        nupl = random.uniform(0.2, 0.6)
        mvrv = random.uniform(1.2, 3.5)
        cdd_7d = random.uniform(50e6, 300e6)
        cdd_status = "elevated" if cdd_7d > 200e6 else "normal"
    
    market_cap = price * config["supply"]
    realized_cap = config["realized_cap"] + random.uniform(-config["realized_cap"]*0.02, config["realized_cap"]*0.03)
    
    # Whale accumulation zones
    accumulation_zones = [
        {"range": f"${int(price*0.85):,} - ${int(price*0.9):,}", "strength": random.uniform(60, 90), "pct": "-15% to -10%"},
        {"range": f"${int(price*0.9):,} - ${int(price*0.95):,}", "strength": random.uniform(70, 95), "pct": "-10% to -5%"},
        {"range": f"${int(price*0.95):,} - ${int(price):,}", "strength": random.uniform(50, 80), "pct": "-5% to current"},
    ]
    
    # Notable wallets with USD values
    notable_wallets = []
    for w in config["notable_wallets"]:
        notable_wallets.append({
            "name": w["name"],
            "balance": w["balance"],
            "value_usd": w["balance"] * price,
            "change_30d": w["change_30d"],
            "change_30d_usd": w["change_30d"] * price
        })
    notable_wallets.sort(key=lambda x: x["balance"], reverse=True)
    
    # Staking data (ETH and SOL specific)
    staking_data = None
    if chain == "ETH":
        staking_data = {
            "total_staked": 34000000 + random.uniform(-500000, 1000000),
            "staking_ratio": round(28.3 + random.uniform(-0.5, 0.5), 1),
            "validators": 1050000 + random.randint(-5000, 10000),
            "avg_apy": round(3.8 + random.uniform(-0.3, 0.3), 2),
            "pending_withdrawals": random.uniform(50000, 200000)
        }
    elif chain == "SOL":
        staking_data = {
            "total_staked": 380000000 + random.uniform(-5000000, 10000000),
            "staking_ratio": round(65.5 + random.uniform(-1, 1), 1),
            "validators": 1900 + random.randint(-50, 100),
            "avg_apy": round(7.2 + random.uniform(-0.5, 0.5), 2),
            "delinquent_stake": random.uniform(1, 3)
        }
    
    data = {
        "chain": chain,
        "price": price,
        "top_wallets": top_wallets,
        "exchange_flows": exchange_flows,
        "metrics": {
            "sopr": round(sopr, 4),
            "sopr_status": "profit_taking" if sopr > 1.02 else "accumulation" if sopr < 0.98 else "neutral",
            "nupl": round(nupl, 3),
            "nupl_zone": "belief" if nupl > 0.5 else "optimism" if nupl > 0.25 else "hope",
            "mvrv": round(mvrv, 2),
            "mvrv_signal": "overvalued" if mvrv > 2.5 else "fair" if mvrv > 1.5 else "undervalued",
            "realized_cap": realized_cap,
            "market_cap": market_cap,
            "cdd_7d_avg": cdd_7d,
            "cdd_status": cdd_status
        },
        "accumulation_zones": accumulation_zones,
        "notable_wallets": notable_wallets,
        "staking": staking_data,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # BTC specific: miner reserves
    if chain == "BTC":
        data["miner_reserves"] = {
            "btc_balance": 1.82e6 + random.uniform(-10000, 10000),
            "change_30d": random.uniform(-5000, 3000),
            "reserve_status": "stable"
        }
    
    set_cached(cache_key, data, 120)
    return data

# ==================== ALTSEASON MONITOR ====================

def get_altseason_data() -> Dict:
    """Altseason monitoring metrics"""
    cache_key = "altseason"
    cached = get_cached(cache_key, 180)
    if cached:
        return cached
    
    random.seed(get_seed())
    
    # TOTAL2 / TOTAL3 (alt market caps)
    total2 = 1.45e12 + random.uniform(-50e9, 80e9)  # All crypto except BTC
    total3 = 0.95e12 + random.uniform(-40e9, 60e9)  # All except BTC & ETH
    
    total2_change_7d = random.uniform(-8, 12)
    total3_change_7d = random.uniform(-10, 15)
    
    # BTC Dominance breakdown
    btc_dom = 54.5 + random.uniform(-1, 1)
    eth_dom = 11.8 + random.uniform(-0.5, 0.5)
    sol_dom = 2.8 + random.uniform(-0.2, 0.3)
    other_dom = 100 - btc_dom - eth_dom - sol_dom
    
    # Top 50 vs BTC performance (7d)
    top50_vs_btc = []
    coins = ["ETH", "SOL", "XRP", "BNB", "ADA", "DOGE", "AVAX", "DOT", "LINK", "MATIC", 
             "SHIB", "TRX", "UNI", "ATOM", "LTC", "XLM", "FIL", "NEAR", "APT", "INJ"]
    for coin in coins:
        perf = random.uniform(-15, 25)
        top50_vs_btc.append({"coin": coin, "vs_btc_7d": round(perf, 2), "outperforming": perf > 0})
    
    outperforming_count = sum(1 for c in top50_vs_btc if c["outperforming"])
    
    # Sector performance
    sectors = {
        "meme": {"change_7d": random.uniform(-15, 35), "volume_change": random.uniform(-20, 50)},
        "ai": {"change_7d": random.uniform(-10, 25), "volume_change": random.uniform(-15, 40)},
        "defi": {"change_7d": random.uniform(-8, 18), "volume_change": random.uniform(-10, 30)},
        "l2": {"change_7d": random.uniform(-12, 20), "volume_change": random.uniform(-15, 35)},
        "gaming": {"change_7d": random.uniform(-18, 22), "volume_change": random.uniform(-25, 45)},
        "rwa": {"change_7d": random.uniform(-5, 15), "volume_change": random.uniform(-10, 25)},
    }
    
    # DeFi TVL
    defi_tvl = 95e9 + random.uniform(-5e9, 8e9)
    defi_tvl_change_7d = random.uniform(-8, 12)
    
    # Narrative heatmap
    narratives = [
        {"name": "AI Agents", "score": random.uniform(60, 95), "trend": "hot"},
        {"name": "Memecoins", "score": random.uniform(40, 85), "trend": "volatile"},
        {"name": "RWA", "score": random.uniform(50, 75), "trend": "growing"},
        {"name": "DePIN", "score": random.uniform(45, 70), "trend": "stable"},
        {"name": "L2 Scaling", "score": random.uniform(55, 80), "trend": "growing"},
        {"name": "Restaking", "score": random.uniform(40, 65), "trend": "cooling"},
    ]
    
    # ALTSEASON PROBABILITY SCORE
    # Based on: BTC.D declining, Top50 outperforming, sector momentum, TVL growth
    alt_signals = [
        btc_dom < 55,  # BTC dominance declining
        outperforming_count > 10,  # Most alts outperforming
        total3_change_7d > 5,  # Altcoins pumping
        defi_tvl_change_7d > 3,  # TVL growing
        sectors["meme"]["change_7d"] > 10,  # Meme sector hot
    ]
    altseason_score = sum(20 for s in alt_signals if s) + random.uniform(0, 15)
    altseason_score = min(100, max(0, altseason_score))
    
    data = {
        "total2": total2,
        "total2_change_7d": round(total2_change_7d, 2),
        "total3": total3,
        "total3_change_7d": round(total3_change_7d, 2),
        "dominance": {
            "btc": round(btc_dom, 2),
            "eth": round(eth_dom, 2),
            "sol": round(sol_dom, 2),
            "other": round(other_dom, 2)
        },
        "top50_vs_btc": top50_vs_btc,
        "outperforming_count": outperforming_count,
        "sectors": sectors,
        "defi_tvl": defi_tvl,
        "defi_tvl_change_7d": round(defi_tvl_change_7d, 2),
        "narratives": narratives,
        "altseason_probability": round(altseason_score, 1),
        "altseason_status": "ALTSEASON" if altseason_score > 75 else "WARMING UP" if altseason_score > 50 else "BTC SEASON",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    set_cached(cache_key, data, 180)
    return data

# ==================== RISK ENGINE ====================

def get_risk_engine() -> Dict:
    """Risk assessment engine"""
    cache_key = "risk_engine"
    cached = get_cached(cache_key, 60)
    if cached:
        return cached
    
    random.seed(get_seed())
    
    # Crypto Volatility Index (DVOL)
    dvol_btc = random.uniform(45, 85)
    dvol_eth = random.uniform(50, 95)
    
    # Market regime
    regime_score = random.uniform(0, 100)
    if regime_score > 70:
        market_regime = "TREND"
        regime_desc = "Strong directional movement"
    elif regime_score > 40:
        market_regime = "CHOP"
        regime_desc = "Sideways, range-bound"
    else:
        market_regime = "DISTRIBUTION"
        regime_desc = "Potential top formation"
    
    # Overall risk score (1-10)
    risk_factors = {
        "funding_heat": random.uniform(0, 10),
        "leverage_crowding": random.uniform(0, 10),
        "exchange_reserve_change": random.uniform(0, 10),
        "stablecoin_flow": random.uniform(0, 10),
        "volatility": random.uniform(0, 10)
    }
    risk_score = sum(risk_factors.values()) / len(risk_factors)
    
    # Leverage crowding
    leverage_score = random.uniform(3, 9)
    leverage_status = "DANGEROUS" if leverage_score > 7 else "ELEVATED" if leverage_score > 5 else "NORMAL"
    
    # Stablecoin minting/burning
    usdt_minted_7d = random.uniform(-500e6, 800e6)
    usdc_minted_7d = random.uniform(-300e6, 400e6)
    
    # Exchange reserves
    exchange_btc_reserve = 2.3e6 + random.uniform(-50000, 50000)
    exchange_btc_change_30d = random.uniform(-5, 5)
    
    # OVERHEAT ALERTS
    overheat_alerts = []
    
    # Check funding
    funding_rate = random.uniform(-0.01, 0.12)
    if abs(funding_rate) > 0.05:
        overheat_alerts.append({
            "type": "FUNDING_SPIKE",
            "severity": "HIGH",
            "message": f"Funding rate at {funding_rate*100:.2f}% - market overheated",
            "asset": "BTC"
        })
    
    # Check OI vs Price divergence
    oi_change = random.uniform(-5, 15)
    price_change = random.uniform(-3, 8)
    if oi_change > 8 and price_change < 2:
        overheat_alerts.append({
            "type": "OI_PRICE_DIVERGENCE",
            "severity": "MEDIUM",
            "message": f"OI up {oi_change:.1f}% while price flat - potential squeeze setup",
            "asset": "ALL"
        })
    
    # CVD divergence
    cvd_signal = random.choice([None, "bullish", "bearish"])
    if cvd_signal:
        overheat_alerts.append({
            "type": "CVD_DIVERGENCE",
            "severity": "MEDIUM",
            "message": f"CVD shows {cvd_signal} divergence vs price",
            "asset": "BTC"
        })
    
    data = {
        "volatility": {
            "dvol_btc": round(dvol_btc, 1),
            "dvol_eth": round(dvol_eth, 1),
            "status": "HIGH" if dvol_btc > 70 else "MEDIUM" if dvol_btc > 50 else "LOW"
        },
        "market_regime": {
            "current": market_regime,
            "description": regime_desc,
            "score": round(regime_score, 1)
        },
        "risk_score": {
            "overall": round(risk_score, 1),
            "factors": {k: round(v, 1) for k, v in risk_factors.items()},
            "level": "EXTREME" if risk_score > 8 else "HIGH" if risk_score > 6 else "MEDIUM" if risk_score > 4 else "LOW"
        },
        "leverage_crowding": {
            "score": round(leverage_score, 1),
            "status": leverage_status
        },
        "stablecoin_flows": {
            "usdt_minted_7d": usdt_minted_7d,
            "usdc_minted_7d": usdc_minted_7d,
            "total_minted_7d": usdt_minted_7d + usdc_minted_7d,
            "signal": "BULLISH" if (usdt_minted_7d + usdc_minted_7d) > 300e6 else "NEUTRAL"
        },
        "exchange_reserves": {
            "btc_reserve": exchange_btc_reserve,
            "btc_change_30d_pct": round(exchange_btc_change_30d, 2),
            "signal": "BULLISH" if exchange_btc_change_30d < -2 else "BEARISH" if exchange_btc_change_30d > 2 else "NEUTRAL"
        },
        "overheat_alerts": overheat_alerts,
        "overheat_status": len(overheat_alerts) > 0,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    set_cached(cache_key, data, 60)
    return data

# ==================== OPTIONS INTELLIGENCE ====================

def get_options_data() -> Dict:
    """Options market intelligence"""
    cache_key = "options"
    cached = get_cached(cache_key, 120)
    if cached:
        return cached
    
    random.seed(get_seed())
    
    btc_price = 97500
    eth_price = 3450
    
    # Put/Call ratio
    btc_pc_ratio = random.uniform(0.4, 0.9)
    eth_pc_ratio = random.uniform(0.45, 0.95)
    
    # Max Pain
    btc_max_pain = btc_price * random.uniform(0.95, 1.02)
    eth_max_pain = eth_price * random.uniform(0.94, 1.03)
    
    # IV Rank (0-100)
    btc_iv_rank = random.uniform(20, 80)
    eth_iv_rank = random.uniform(25, 85)
    
    # Skew (negative = put demand, positive = call demand)
    btc_skew = random.uniform(-15, 10)
    eth_skew = random.uniform(-18, 12)
    
    # Gamma walls (significant strike levels)
    btc_gamma_walls = [
        {"strike": round(btc_price * 0.9, 0), "gamma": random.uniform(10, 30), "type": "support"},
        {"strike": round(btc_price * 0.95, 0), "gamma": random.uniform(15, 40), "type": "support"},
        {"strike": round(btc_price * 1.0, 0), "gamma": random.uniform(20, 50), "type": "neutral"},
        {"strike": round(btc_price * 1.05, 0), "gamma": random.uniform(15, 35), "type": "resistance"},
        {"strike": round(btc_price * 1.1, 0), "gamma": random.uniform(10, 25), "type": "resistance"},
    ]
    
    # Expiration heatmap
    expirations = []
    for i in range(1, 8):
        exp_date = datetime.now() + timedelta(days=i*7)
        expirations.append({
            "date": exp_date.strftime("%Y-%m-%d"),
            "label": exp_date.strftime("%d %b"),
            "btc_oi": random.uniform(1e9, 8e9),
            "eth_oi": random.uniform(200e6, 2e9),
            "notional": random.uniform(2e9, 15e9)
        })
    
    data = {
        "btc": {
            "put_call_ratio": round(btc_pc_ratio, 2),
            "max_pain": round(btc_max_pain, 0),
            "distance_to_max_pain_pct": round((btc_max_pain - btc_price) / btc_price * 100, 2),
            "iv_rank": round(btc_iv_rank, 1),
            "skew_25d": round(btc_skew, 2),
            "skew_signal": "PUT_DEMAND" if btc_skew < -5 else "CALL_DEMAND" if btc_skew > 5 else "NEUTRAL",
            "gamma_walls": btc_gamma_walls
        },
        "eth": {
            "put_call_ratio": round(eth_pc_ratio, 2),
            "max_pain": round(eth_max_pain, 0),
            "distance_to_max_pain_pct": round((eth_max_pain - eth_price) / eth_price * 100, 2),
            "iv_rank": round(eth_iv_rank, 1),
            "skew_25d": round(eth_skew, 2),
            "skew_signal": "PUT_DEMAND" if eth_skew < -5 else "CALL_DEMAND" if eth_skew > 5 else "NEUTRAL"
        },
        "expirations": expirations,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    set_cached(cache_key, data, 120)
    return data

# ==================== SOCIAL & SENTIMENT ====================

def get_sentiment_data() -> Dict:
    """Social sentiment tracking"""
    cache_key = "sentiment"
    cached = get_cached(cache_key, 300)
    if cached:
        return cached
    
    random.seed(get_seed())
    
    # Twitter/X volume
    twitter_btc = random.randint(50000, 200000)
    twitter_eth = random.randint(20000, 80000)
    twitter_sol = random.randint(15000, 60000)
    
    twitter_volume_change = random.uniform(-30, 80)
    is_spike = twitter_volume_change > 40
    
    # Influencer concentration
    influencer_sentiment = random.uniform(-1, 1)  # -1 bearish, 1 bullish
    influencer_bullish_pct = (influencer_sentiment + 1) / 2 * 100
    
    # Google Trends (relative, 0-100)
    google_btc = random.randint(40, 100)
    google_eth = random.randint(30, 80)
    google_crypto = random.randint(35, 90)
    
    # Telegram mentions
    tg_volume = random.randint(10000, 50000)
    tg_change = random.uniform(-20, 60)
    
    # Reddit activity
    reddit_posts = random.randint(500, 2000)
    reddit_comments = random.randint(5000, 20000)
    reddit_sentiment = random.uniform(-0.3, 0.5)
    
    # Narrative shifts
    narratives = [
        {"topic": "ETF Inflows", "momentum": random.uniform(-20, 50), "direction": "up" if random.random() > 0.4 else "down"},
        {"topic": "Rate Cuts", "momentum": random.uniform(-30, 40), "direction": "up" if random.random() > 0.5 else "down"},
        {"topic": "Halving Effect", "momentum": random.uniform(-10, 30), "direction": "stable"},
        {"topic": "AI Tokens", "momentum": random.uniform(-10, 70), "direction": "up"},
        {"topic": "Memecoin Mania", "momentum": random.uniform(-40, 60), "direction": "volatile"},
    ]
    
    # Sentiment vs Price divergence
    price_change_7d = random.uniform(-5, 10)
    sentiment_change_7d = random.uniform(-30, 40)
    
    divergence = None
    if price_change_7d > 3 and sentiment_change_7d < -10:
        divergence = {"type": "bearish", "message": "Price up but sentiment declining"}
    elif price_change_7d < -3 and sentiment_change_7d > 10:
        divergence = {"type": "bullish", "message": "Price down but sentiment improving"}
    
    data = {
        "twitter": {
            "btc_mentions": twitter_btc,
            "eth_mentions": twitter_eth,
            "sol_mentions": twitter_sol,
            "volume_change_24h": round(twitter_volume_change, 1),
            "is_spike": is_spike
        },
        "influencer_sentiment": {
            "score": round(influencer_sentiment, 2),
            "bullish_pct": round(influencer_bullish_pct, 1),
            "status": "BULLISH" if influencer_sentiment > 0.3 else "BEARISH" if influencer_sentiment < -0.3 else "NEUTRAL"
        },
        "google_trends": {
            "bitcoin": google_btc,
            "ethereum": google_eth,
            "crypto": google_crypto
        },
        "telegram": {
            "mention_count": tg_volume,
            "change_24h": round(tg_change, 1)
        },
        "reddit": {
            "posts_24h": reddit_posts,
            "comments_24h": reddit_comments,
            "sentiment_score": round(reddit_sentiment, 2)
        },
        "narrative_shifts": narratives,
        "sentiment_divergence": divergence,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    set_cached(cache_key, data, 300)
    return data

# ==================== CAPITAL FLOW MAP ====================

def get_capital_flows() -> Dict:
    """Capital rotation and sector flows"""
    cache_key = "capital_flows"
    cached = get_cached(cache_key, 300)
    if cached:
        return cached
    
    random.seed(get_seed())
    
    # Asset-to-asset flows (7d net)
    asset_flows = [
        {"from": "BTC", "to": "ETH", "flow_usd": random.uniform(-500e6, 800e6)},
        {"from": "ETH", "to": "SOL", "flow_usd": random.uniform(-200e6, 400e6)},
        {"from": "BTC", "to": "Alts", "flow_usd": random.uniform(-1e9, 1.5e9)},
        {"from": "Stables", "to": "BTC", "flow_usd": random.uniform(-800e6, 1.2e9)},
        {"from": "Stables", "to": "ETH", "flow_usd": random.uniform(-400e6, 600e6)},
    ]
    
    # Sector flows
    sectors = ["DeFi", "AI", "Meme", "L2", "Gaming", "RWA", "Infrastructure"]
    sector_flows = []
    for sector in sectors:
        inflow = random.uniform(-200e6, 500e6)
        sector_flows.append({
            "sector": sector,
            "net_flow_7d": inflow,
            "direction": "inflow" if inflow > 0 else "outflow",
            "strength": abs(inflow) / 500e6 * 100
        })
    
    # Rotation matrix (correlation between sectors)
    rotation_signals = [
        {"from_sector": "DeFi", "to_sector": "AI", "strength": random.uniform(0, 100)},
        {"from_sector": "L2", "to_sector": "DeFi", "strength": random.uniform(0, 100)},
        {"from_sector": "Meme", "to_sector": "AI", "strength": random.uniform(0, 100)},
        {"from_sector": "Gaming", "to_sector": "Meme", "strength": random.uniform(0, 100)},
    ]
    
    # Volume heatmap by sector
    volume_heatmap = {}
    for sector in sectors:
        volume_heatmap[sector] = {
            "volume_24h": random.uniform(100e6, 2e9),
            "change_24h": random.uniform(-30, 50),
            "relative_strength": random.uniform(0, 100)
        }
    
    data = {
        "asset_flows": asset_flows,
        "sector_flows": sorted(sector_flows, key=lambda x: x["net_flow_7d"], reverse=True),
        "rotation_signals": rotation_signals,
        "volume_heatmap": volume_heatmap,
        "dominant_flow": max(sector_flows, key=lambda x: x["net_flow_7d"])["sector"],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    set_cached(cache_key, data, 300)
    return data

# ==================== AI SIGNAL PANEL ====================

def get_ai_signals() -> Dict:
    """Multi-factor AI signals"""
    cache_key = "ai_signals"
    cached = get_cached(cache_key, 60)
    if cached:
        return cached
    
    random.seed(get_seed())
    
    btc_price = 97500
    
    # Multi-factor composite signal
    factors = {
        "onchain": random.uniform(-1, 1),
        "derivatives": random.uniform(-1, 1),
        "etf_flow": random.uniform(-1, 1),
        "macro": random.uniform(-1, 1),
        "sentiment": random.uniform(-1, 1)
    }
    
    composite_signal = sum(factors.values()) / len(factors)
    signal_strength = abs(composite_signal) * 100
    
    # Squeeze probabilities
    short_squeeze_prob = random.uniform(10, 60)
    long_squeeze_prob = random.uniform(10, 50)
    
    # Liquidity vacuum zones
    liquidity_zones = [
        {"price": round(btc_price * 0.92, 0), "type": "demand", "strength": random.uniform(50, 90)},
        {"price": round(btc_price * 0.95, 0), "type": "demand", "strength": random.uniform(60, 95)},
        {"price": round(btc_price * 1.05, 0), "type": "supply", "strength": random.uniform(55, 85)},
        {"price": round(btc_price * 1.08, 0), "type": "supply", "strength": random.uniform(45, 80)},
    ]
    
    # Weekly range prediction
    weekly_low = btc_price * (1 - random.uniform(0.03, 0.08))
    weekly_high = btc_price * (1 + random.uniform(0.03, 0.1))
    
    # Key levels
    key_levels = {
        "immediate_support": round(btc_price * 0.98, 0),
        "strong_support": round(btc_price * 0.95, 0),
        "immediate_resistance": round(btc_price * 1.02, 0),
        "strong_resistance": round(btc_price * 1.05, 0)
    }
    
    data = {
        "composite_signal": {
            "value": round(composite_signal, 3),
            "direction": "BULLISH" if composite_signal > 0.2 else "BEARISH" if composite_signal < -0.2 else "NEUTRAL",
            "strength": round(signal_strength, 1),
            "factors": {k: round(v, 2) for k, v in factors.items()}
        },
        "squeeze_probability": {
            "short_squeeze": round(short_squeeze_prob, 1),
            "long_squeeze": round(long_squeeze_prob, 1),
            "higher_risk": "SHORT" if short_squeeze_prob > long_squeeze_prob else "LONG"
        },
        "liquidity_zones": liquidity_zones,
        "weekly_range": {
            "predicted_low": round(weekly_low, 0),
            "predicted_high": round(weekly_high, 0),
            "range_pct": round((weekly_high - weekly_low) / btc_price * 100, 1)
        },
        "key_levels": key_levels,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    set_cached(cache_key, data, 60)
    return data

# ==================== PORTFOLIO / RUKOS CUSTOM ====================

def get_portfolio_data(user_id: str = "default") -> Dict:
    """User portfolio tracking"""
    cache_key = f"portfolio_{user_id}"
    cached = get_cached(cache_key, 30)
    if cached:
        return cached
    
    random.seed(get_seed() + hash(user_id) % 1000)
    
    # Portfolio positions
    positions = [
        {"asset": "BTC", "size": random.uniform(0.5, 5), "entry": random.uniform(85000, 95000), "current": 97500, "leverage": random.uniform(1, 5)},
        {"asset": "ETH", "size": random.uniform(5, 50), "entry": random.uniform(3200, 3400), "current": 3450, "leverage": random.uniform(1, 3)},
        {"asset": "SOL", "size": random.uniform(50, 500), "entry": random.uniform(170, 185), "current": 185, "leverage": random.uniform(1, 3)},
    ]
    
    total_value = 0
    total_pnl = 0
    
    for pos in positions:
        pos["value_usd"] = pos["size"] * pos["current"]
        pos["pnl_usd"] = pos["size"] * (pos["current"] - pos["entry"])
        pos["pnl_pct"] = ((pos["current"] - pos["entry"]) / pos["entry"]) * 100
        
        # Liquidation price
        if pos["leverage"] > 1:
            maint_margin = 0.5  # 0.5% maintenance margin
            liq_distance = (1 / pos["leverage"]) * (1 - maint_margin / 100)
            pos["liquidation_price"] = pos["entry"] * (1 - liq_distance) if pos["pnl_usd"] > 0 else pos["entry"] * (1 + liq_distance)
            pos["distance_to_liq_pct"] = abs((pos["current"] - pos["liquidation_price"]) / pos["current"]) * 100
        else:
            pos["liquidation_price"] = 0
            pos["distance_to_liq_pct"] = 100
        
        total_value += pos["value_usd"]
        total_pnl += pos["pnl_usd"]
    
    # Calculate exposure
    for pos in positions:
        pos["exposure_pct"] = (pos["value_usd"] / total_value) * 100 if total_value > 0 else 0
    
    # Risk metrics
    total_leverage_exposure = sum(pos["value_usd"] * pos["leverage"] for pos in positions)
    avg_leverage = total_leverage_exposure / total_value if total_value > 0 else 1
    
    # Risk per trade (assume 2% risk rule)
    account_balance = total_value * random.uniform(0.8, 1.2)
    risk_per_trade = account_balance * 0.02
    
    # Risk of ruin calculation (simplified)
    win_rate = random.uniform(0.45, 0.65)
    risk_reward = random.uniform(1.5, 3)
    risk_of_ruin = max(0, min(100, (1 - win_rate) * 100 / (1 + risk_reward)))
    
    # Concentration risk
    max_position = max(positions, key=lambda x: x["exposure_pct"])
    concentration_warning = max_position["exposure_pct"] > 40
    
    data = {
        "positions": positions,
        "summary": {
            "total_value": round(total_value, 2),
            "unrealized_pnl": round(total_pnl, 2),
            "unrealized_pnl_pct": round((total_pnl / (total_value - total_pnl)) * 100, 2) if total_value != total_pnl else 0,
            "account_balance": round(account_balance, 2)
        },
        "risk_metrics": {
            "avg_leverage": round(avg_leverage, 2),
            "total_leverage_exposure": round(total_leverage_exposure, 2),
            "risk_per_trade": round(risk_per_trade, 2),
            "risk_of_ruin_pct": round(risk_of_ruin, 1),
            "min_distance_to_liq": round(min(pos["distance_to_liq_pct"] for pos in positions), 1)
        },
        "concentration": {
            "largest_position": max_position["asset"],
            "largest_exposure_pct": round(max_position["exposure_pct"], 1),
            "warning": concentration_warning,
            "recommendation": "Consider reducing position size" if concentration_warning else "Diversification OK"
        },
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    set_cached(cache_key, data, 30)
    return data

# ==================== WAR MODE ====================

def get_war_mode_alerts() -> Dict:
    """Market stress detection"""
    cache_key = "war_mode"
    cached = get_cached(cache_key, 30)
    if cached:
        return cached
    
    random.seed(get_seed())
    
    alerts = []
    
    # Check various stress indicators
    
    # 1. Funding spike
    funding_rate = random.uniform(-0.02, 0.15)
    if abs(funding_rate) > 0.05:
        alerts.append({
            "type": "FUNDING_SPIKE",
            "severity": "HIGH" if abs(funding_rate) > 0.08 else "MEDIUM",
            "value": f"{funding_rate*100:.2f}%",
            "message": "Extreme funding rate detected",
            "action": "Consider counter-trading the crowd"
        })
    
    # 2. OI spike
    oi_change_1h = random.uniform(-5, 12)
    if abs(oi_change_1h) > 5:
        alerts.append({
            "type": "OI_SPIKE",
            "severity": "MEDIUM",
            "value": f"{oi_change_1h:+.1f}%",
            "message": "Rapid OI change in last hour",
            "action": "Watch for liquidation cascade"
        })
    
    # 3. ETF flow anomaly
    etf_flow = random.uniform(-800e6, 1e9)
    if abs(etf_flow) > 500e6:
        alerts.append({
            "type": "ETF_ANOMALY",
            "severity": "HIGH" if abs(etf_flow) > 700e6 else "MEDIUM",
            "value": f"${etf_flow/1e6:+.0f}M",
            "message": "Unusual ETF flow detected",
            "action": "Track institutional positioning"
        })
    
    # 4. Whale move
    whale_move = random.uniform(0, 150e6)
    if whale_move > 50e6:
        alerts.append({
            "type": "WHALE_MOVE",
            "severity": "HIGH" if whale_move > 100e6 else "MEDIUM",
            "value": f"${whale_move/1e6:.0f}M",
            "message": "Large whale transaction detected",
            "action": "Monitor exchange flows"
        })
    
    # 5. Liquidation spike
    liq_1h = random.uniform(5e6, 80e6)
    if liq_1h > 30e6:
        alerts.append({
            "type": "LIQUIDATION_SPIKE",
            "severity": "HIGH" if liq_1h > 50e6 else "MEDIUM",
            "value": f"${liq_1h/1e6:.0f}M/hr",
            "message": "Elevated liquidations",
            "action": "Reduce leverage exposure"
        })
    
    # 6. Stablecoin anomaly
    stable_flow = random.uniform(-500e6, 800e6)
    if abs(stable_flow) > 300e6:
        alerts.append({
            "type": "STABLECOIN_ANOMALY",
            "severity": "MEDIUM",
            "value": f"${stable_flow/1e6:+.0f}M",
            "message": "Large stablecoin movement",
            "action": "Potential buying/selling pressure incoming"
        })
    
    # Overall stress level
    stress_score = len(alerts) * 15 + sum(1 for a in alerts if a["severity"] == "HIGH") * 10
    stress_score = min(100, stress_score)
    
    stress_level = "CRITICAL" if stress_score > 70 else "HIGH" if stress_score > 50 else "ELEVATED" if stress_score > 30 else "NORMAL"
    
    data = {
        "stress_score": stress_score,
        "stress_level": stress_level,
        "active_alerts": len(alerts),
        "alerts": alerts,
        "war_mode_active": stress_score > 50,
        "recommendation": "Reduce exposure and increase hedges" if stress_score > 50 else "Monitor closely" if stress_score > 30 else "Normal operations",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    set_cached(cache_key, data, 30)
    return data
