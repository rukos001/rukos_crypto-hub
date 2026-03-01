"""
Centralized real-time data fetcher for RUKOS_CRYPTO | HUB.
Single source of truth for all market data with 60-second caching.
Uses free APIs: CoinGecko, Alternative.me, DeFi Llama.
"""
import httpx
import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

# ── In-memory cache ──
_cache: Dict[str, Any] = {}
_cache_ts: Dict[str, datetime] = {}

def _get(key: str, ttl: int = 60) -> Optional[Any]:
    if key in _cache and key in _cache_ts:
        if datetime.now(timezone.utc) < _cache_ts[key]:
            return _cache[key]
    return None

def _set(key: str, data: Any, ttl: int = 60):
    _cache[key] = data
    _cache_ts[key] = datetime.now(timezone.utc) + timedelta(seconds=ttl)

# ── HTTP client helper ──
async def _fetch(url: str, params: dict = None, timeout: float = 12.0) -> Optional[dict]:
    try:
        async with httpx.AsyncClient(timeout=timeout) as c:
            r = await c.get(url, params=params)
            r.raise_for_status()
            return r.json()
    except Exception as e:
        logger.warning(f"API fetch failed {url}: {e}")
        return None

# ═══════════════════════════════════════════════════════════
# 1. CoinGecko: prices, market data for top coins
# ═══════════════════════════════════════════════════════════
COINGECKO = "https://api.coingecko.com/api/v3"

async def get_prices() -> dict:
    """Real prices for BTC, ETH, SOL + global market data."""
    cached = _get("prices", 60)
    if cached:
        return cached

    coins_data = await _fetch(
        f"{COINGECKO}/coins/markets",
        params={
            "vs_currency": "usd",
            "ids": "bitcoin,ethereum,solana,binancecoin,ripple,cardano,dogecoin,avalanche-2,chainlink,polkadot,near,uniswap,stellar,filecoin,injective-protocol,aptos,arbitrum,optimism,sui,shiba-inu,pepe,dogwifcoin",
            "order": "market_cap_desc",
            "sparkline": "false",
            "price_change_percentage": "24h,7d",
        },
    )

    global_data = await _fetch(f"{COINGECKO}/global")

    if not coins_data:
        prev = _get("prices_fallback", 3600)
        if prev:
            return prev
        return _fallback_prices()

    # Parse coins
    coins = {}
    for c in coins_data:
        sym = c["symbol"].upper()
        coins[sym] = {
            "symbol": sym,
            "name": c["name"],
            "price": c.get("current_price", 0) or 0,
            "change_24h": round(c.get("price_change_percentage_24h") or 0, 2),
            "change_7d": round(c.get("price_change_percentage_7d_in_currency") or 0, 2),
            "market_cap": c.get("market_cap") or 0,
            "volume_24h": c.get("total_volume") or 0,
            "high_24h": c.get("high_24h") or 0,
            "low_24h": c.get("low_24h") or 0,
            "image": c.get("image", ""),
            "ath": c.get("ath") or 0,
            "ath_change_percentage": round(c.get("ath_change_percentage") or 0, 2),
        }

    # Parse global
    gd = {}
    if global_data and "data" in global_data:
        g = global_data["data"]
        gd = {
            "total_market_cap": g.get("total_market_cap", {}).get("usd", 0),
            "total_volume_24h": g.get("total_volume", {}).get("usd", 0),
            "btc_dominance": round(g.get("market_cap_percentage", {}).get("btc", 0), 2),
            "eth_dominance": round(g.get("market_cap_percentage", {}).get("eth", 0), 2),
            "market_cap_change_24h": round(g.get("market_cap_change_percentage_24h_usd", 0), 2),
            "active_cryptocurrencies": g.get("active_cryptocurrencies", 0),
        }
    else:
        # Derive from coins
        total_mc = sum(c.get("market_cap", 0) for c in coins.values())
        btc_mc = coins.get("BTC", {}).get("market_cap", 0)
        eth_mc = coins.get("ETH", {}).get("market_cap", 0)
        gd = {
            "total_market_cap": total_mc,
            "total_volume_24h": sum(c.get("volume_24h", 0) for c in coins.values()),
            "btc_dominance": round(btc_mc / total_mc * 100, 2) if total_mc else 0,
            "eth_dominance": round(eth_mc / total_mc * 100, 2) if total_mc else 0,
            "market_cap_change_24h": 0,
            "active_cryptocurrencies": 0,
        }

    result = {
        "coins": coins,
        "global": gd,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    _set("prices", result, 60)
    _set("prices_fallback", result, 3600)
    return result


# ═══════════════════════════════════════════════════════════
# 2. Fear & Greed Index (Alternative.me)
# ═══════════════════════════════════════════════════════════
async def get_fear_greed() -> dict:
    cached = _get("fear_greed", 600)
    if cached:
        return cached

    data = await _fetch("https://api.alternative.me/fng/?limit=7")
    if not data or "data" not in data:
        return {"value": 50, "classification": "Neutral", "history": []}

    current = data["data"][0]
    result = {
        "value": int(current["value"]),
        "classification": current["value_classification"],
        "history": [
            {
                "value": int(d["value"]),
                "classification": d["value_classification"],
                "date": datetime.fromtimestamp(int(d["timestamp"])).strftime("%d.%m"),
            }
            for d in data["data"]
        ],
    }
    _set("fear_greed", result, 600)
    return result


# ═══════════════════════════════════════════════════════════
# 3. DeFi Llama: TVL, stablecoins, protocols
# ═══════════════════════════════════════════════════════════
DEFILLAMA = "https://api.llama.fi"

async def get_defi_tvl() -> dict:
    """Total DeFi TVL + top protocols."""
    cached = _get("defi_tvl", 120)
    if cached:
        return cached

    tvl_data = await _fetch(f"{DEFILLAMA}/v2/historicalChainTvl")
    protocols = await _fetch(f"{DEFILLAMA}/protocols")

    total_tvl = 0
    tvl_change_1d = 0

    if tvl_data and len(tvl_data) > 1:
        total_tvl = tvl_data[-1].get("tvl", 0)
        prev = tvl_data[-2].get("tvl", 0)
        tvl_change_1d = round(((total_tvl - prev) / prev) * 100, 2) if prev else 0

    # Top protocols by TVL
    top_protocols = []
    if protocols:
        sorted_p = sorted(protocols, key=lambda x: x.get("tvl", 0) or 0, reverse=True)[:20]
        for p in sorted_p:
            top_protocols.append({
                "name": p.get("name", ""),
                "tvl": p.get("tvl", 0),
                "change_1d": round(p.get("change_1d") or 0, 2),
                "change_7d": round(p.get("change_7d") or 0, 2),
                "category": p.get("category", ""),
                "chains": p.get("chains", [])[:5],
            })

    result = {
        "total_tvl": total_tvl,
        "tvl_change_1d": tvl_change_1d,
        "top_protocols": top_protocols,
    }
    _set("defi_tvl", result, 120)
    return result


async def get_stablecoins() -> dict:
    """Stablecoin market caps from DeFi Llama."""
    cached = _get("stablecoins", 300)
    if cached:
        return cached

    data = await _fetch("https://stablecoins.llama.fi/stablecoins?includePrices=true")
    if not data or "peggedAssets" not in data:
        return {"total": 0, "coins": []}

    stables = []
    total = 0
    for s in data["peggedAssets"]:
        mc = 0
        chains = s.get("chainCirculating", {})
        for chain_data in chains.values():
            mc += chain_data.get("current", {}).get("peggedUSD", 0) or 0

        if mc > 100_000_000:  # Only stables > $100M
            stables.append({
                "name": s.get("name", ""),
                "symbol": s.get("symbol", ""),
                "market_cap": mc,
                "peg_type": s.get("pegType", ""),
            })
            total += mc

    stables.sort(key=lambda x: x["market_cap"], reverse=True)

    result = {
        "total": total,
        "coins": stables[:10],
    }
    _set("stablecoins", result, 300)
    return result


async def get_chain_tvl() -> dict:
    """TVL by chain from DeFi Llama."""
    cached = _get("chain_tvl", 120)
    if cached:
        return cached

    data = await _fetch(f"{DEFILLAMA}/v2/chains")
    if not data:
        return {"chains": []}

    chains = []
    for c in data[:20]:
        chains.append({
            "name": c.get("name", ""),
            "tvl": c.get("tvl", 0),
            "tokenSymbol": c.get("tokenSymbol", ""),
        })

    result = {"chains": chains}
    _set("chain_tvl", result, 120)
    return result


# ═══════════════════════════════════════════════════════════
# Fallback data
# ═══════════════════════════════════════════════════════════
def _fallback_prices() -> dict:
    return {
        "coins": {
            "BTC": {"symbol": "BTC", "name": "Bitcoin", "price": 97000, "change_24h": 0, "change_7d": 0, "market_cap": 1900000000000, "volume_24h": 40000000000, "high_24h": 98000, "low_24h": 96000, "image": "", "ath": 109000, "ath_change_percentage": -11},
            "ETH": {"symbol": "ETH", "name": "Ethereum", "price": 3400, "change_24h": 0, "change_7d": 0, "market_cap": 410000000000, "volume_24h": 18000000000, "high_24h": 3450, "low_24h": 3350, "image": "", "ath": 4878, "ath_change_percentage": -30},
            "SOL": {"symbol": "SOL", "name": "Solana", "price": 190, "change_24h": 0, "change_7d": 0, "market_cap": 85000000000, "volume_24h": 3500000000, "high_24h": 195, "low_24h": 185, "image": "", "ath": 260, "ath_change_percentage": -27},
        },
        "global": {
            "total_market_cap": 3500000000000,
            "total_volume_24h": 125000000000,
            "btc_dominance": 54.5,
            "eth_dominance": 11.8,
            "market_cap_change_24h": 0,
            "active_cryptocurrencies": 0,
        },
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "is_fallback": True,
    }
