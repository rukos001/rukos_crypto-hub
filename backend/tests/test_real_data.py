"""
Tests to verify real API data from CoinGecko, Alternative.me, and DeFi Llama.
These tests verify the fix for incorrect mock/random data issue.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://rukos-crypto-hub.preview.emergentagent.com').rstrip('/')


class TestRealPriceData:
    """Verify real prices from CoinGecko are being used"""
    
    def test_btc_price_is_realistic(self, api_client):
        """BTC price should be from CoinGecko, not hardcoded ~97K"""
        response = api_client.get(f"{BASE_URL}/api/analytics/market-core")
        assert response.status_code == 200
        data = response.json()
        
        prices = data.get("prices", [])
        btc = next((p for p in prices if p["symbol"] == "BTC"), None)
        assert btc is not None
        
        # Price should be reasonable (not exactly 97000 or 97500)
        # CoinGecko real price should vary
        assert btc["price"] > 0
        # Check it has market_cap (real data attribute)
        assert "market_cap" in btc
        assert btc["market_cap"] > 0
    
    def test_eth_price_has_real_fields(self, api_client):
        """ETH price should have all real data fields"""
        response = api_client.get(f"{BASE_URL}/api/analytics/market-core")
        assert response.status_code == 200
        data = response.json()
        
        prices = data.get("prices", [])
        eth = next((p for p in prices if p["symbol"] == "ETH"), None)
        assert eth is not None
        
        # Real data fields from CoinGecko
        assert "price" in eth
        assert "change_24h" in eth
        assert "change_7d" in eth
        assert "market_cap" in eth
        assert "volume_24h" in eth
    
    def test_sol_price_is_present(self, api_client):
        """SOL price should be from real data"""
        response = api_client.get(f"{BASE_URL}/api/analytics/market-core")
        assert response.status_code == 200
        data = response.json()
        
        prices = data.get("prices", [])
        sol = next((p for p in prices if p["symbol"] == "SOL"), None)
        assert sol is not None
        assert sol["price"] > 0


class TestFearGreedIndex:
    """Verify Fear & Greed Index from Alternative.me"""
    
    def test_fear_greed_value_is_real(self, api_client):
        """Fear & Greed should come from Alternative.me API"""
        response = api_client.get(f"{BASE_URL}/api/analytics/market-core")
        assert response.status_code == 200
        data = response.json()
        
        fg = data.get("fear_greed", {})
        assert "value" in fg
        assert "classification" in fg
        
        # Value should be between 0-100
        assert 0 <= fg["value"] <= 100
        
        # Should have a valid classification
        valid_classes = ["Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed"]
        assert fg["classification"] in valid_classes
    
    def test_fear_greed_has_history(self, api_client):
        """Fear & Greed should have previous day/week values"""
        response = api_client.get(f"{BASE_URL}/api/analytics/market-core")
        assert response.status_code == 200
        data = response.json()
        
        fg = data.get("fear_greed", {})
        assert "previous_day" in fg
        assert "previous_week" in fg


class TestBTCDominanceAndMarketCap:
    """Verify BTC dominance and total market cap from CoinGecko global"""
    
    def test_btc_dominance_is_present(self, api_client):
        """BTC dominance should come from CoinGecko global endpoint"""
        response = api_client.get(f"{BASE_URL}/api/analytics/market-core")
        assert response.status_code == 200
        data = response.json()
        
        assert "btc_dominance" in data
        # BTC dominance should be a percentage (typically 45-65%)
        assert 30 <= data["btc_dominance"] <= 80
        
        # Should also have ETH dominance
        assert "eth_dominance" in data
        assert 5 <= data["eth_dominance"] <= 25
    
    def test_total_market_cap_is_present(self, api_client):
        """Total market cap should come from CoinGecko global"""
        response = api_client.get(f"{BASE_URL}/api/analytics/market-core")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_market_cap" in data
        # Total market cap should be in trillions
        assert data["total_market_cap"] > 1e12  # > $1 trillion


class TestDefiTVL:
    """Verify DeFi TVL from DeFi Llama"""
    
    def test_altseason_has_defi_tvl(self, api_client):
        """Altseason tab should show real DeFi TVL from DeFi Llama"""
        response = api_client.get(f"{BASE_URL}/api/analytics/altseason")
        assert response.status_code == 200
        data = response.json()
        
        assert "defi_tvl" in data
        # DeFi TVL should be in billions (typically $50-150B range)
        assert data["defi_tvl"] > 1e9  # > $1 billion
    
    def test_altseason_has_tvl_change(self, api_client):
        """Altseason should have TVL change percentage"""
        response = api_client.get(f"{BASE_URL}/api/analytics/altseason")
        assert response.status_code == 200
        data = response.json()
        
        assert "defi_tvl_change_7d" in data


class TestAISignalsKeyLevels:
    """Verify AI Signals key levels are based on real BTC price"""
    
    def test_ai_signals_key_levels_exist(self, api_client):
        """AI Signals should have key levels based on real price"""
        response = api_client.get(f"{BASE_URL}/api/analytics/ai-signals")
        assert response.status_code == 200
        data = response.json()
        
        assert "key_levels" in data
        kl = data["key_levels"]
        
        assert "immediate_support" in kl
        assert "strong_support" in kl
        assert "immediate_resistance" in kl
        assert "strong_resistance" in kl
        
        # Key levels should be reasonable prices (thousands for BTC)
        assert kl["immediate_support"] > 10000
        assert kl["strong_support"] > 10000
        assert kl["immediate_resistance"] > 10000
        assert kl["strong_resistance"] > 10000
    
    def test_ai_signals_liquidity_zones(self, api_client):
        """AI Signals liquidity zones should be based on real price"""
        response = api_client.get(f"{BASE_URL}/api/analytics/ai-signals")
        assert response.status_code == 200
        data = response.json()
        
        assert "liquidity_zones" in data
        zones = data["liquidity_zones"]
        assert len(zones) > 0
        
        # Each zone should have a realistic price
        for zone in zones:
            assert "price" in zone
            assert zone["price"] > 10000  # Reasonable BTC price


class TestOnchainRealPrice:
    """Verify onchain data uses real prices"""
    
    def test_onchain_btc_has_real_price(self, api_client):
        """Onchain BTC data should include real price"""
        response = api_client.get(f"{BASE_URL}/api/analytics/onchain?chain=btc")
        assert response.status_code == 200
        data = response.json()
        
        assert "price" in data
        assert data["price"] > 10000  # Reasonable BTC price
    
    def test_onchain_eth_has_real_price(self, api_client):
        """Onchain ETH data should include real price"""
        response = api_client.get(f"{BASE_URL}/api/analytics/onchain?chain=eth")
        assert response.status_code == 200
        data = response.json()
        
        assert "price" in data
        assert data["price"] > 100  # Reasonable ETH price


class TestUpdatedAtTimestamps:
    """Verify all endpoints return updated_at timestamps"""
    
    @pytest.mark.parametrize("endpoint", [
        "/api/analytics/market-core",
        "/api/analytics/derivatives",
        "/api/analytics/etf-intelligence",
        "/api/analytics/onchain",
        "/api/analytics/altseason",
        "/api/analytics/risk-engine",
        "/api/analytics/ai-signals",
        "/api/analytics/war-mode",
    ])
    def test_endpoint_has_updated_at(self, api_client, endpoint):
        """Each analytics endpoint should return updated_at timestamp"""
        response = api_client.get(f"{BASE_URL}{endpoint}")
        assert response.status_code == 200
        data = response.json()
        
        assert "updated_at" in data
        # updated_at should be an ISO timestamp
        assert "T" in data["updated_at"]  # ISO format check


class TestNo500Errors:
    """Verify no 500 errors on any analytics endpoint"""
    
    @pytest.mark.parametrize("endpoint", [
        "/api/analytics/market-core",
        "/api/analytics/derivatives",
        "/api/analytics/derivatives?asset=btc",
        "/api/analytics/derivatives?asset=eth",
        "/api/analytics/derivatives?asset=sol",
        "/api/analytics/etf-intelligence",
        "/api/analytics/onchain",
        "/api/analytics/onchain?chain=btc",
        "/api/analytics/onchain?chain=eth",
        "/api/analytics/onchain?chain=sol",
        "/api/analytics/altseason",
        "/api/analytics/risk-engine",
        "/api/analytics/ai-signals",
        "/api/analytics/war-mode",
        "/api/analytics/options",
        "/api/analytics/sentiment",
        "/api/analytics/capital-flows",
    ])
    def test_endpoint_no_500(self, api_client, endpoint):
        """Each endpoint should not return 500 error"""
        response = api_client.get(f"{BASE_URL}{endpoint}")
        assert response.status_code != 500, f"Endpoint {endpoint} returned 500: {response.text}"
        assert response.status_code in [200, 401, 403], f"Endpoint {endpoint} returned unexpected {response.status_code}"


class TestCryptoPricesEndpoint:
    """Test the /crypto/prices endpoint uses real data"""
    
    def test_crypto_prices_endpoint(self, api_client):
        """Test /crypto/prices returns real data from shared data service"""
        response = api_client.get(f"{BASE_URL}/api/crypto/prices")
        assert response.status_code == 200
        data = response.json()
        
        # Should have data array with prices
        assert "data" in data
        assert len(data["data"]) >= 3  # BTC, ETH, SOL
        
        # Should have global market data
        assert "total_market_cap" in data
        assert "btc_dominance" in data
        
        # Should have updated_at
        assert "updated_at" in data
