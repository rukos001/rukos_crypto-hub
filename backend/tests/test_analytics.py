import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://trading-dashboard-99.preview.emergentagent.com').rstrip('/')


class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_login_success(self, api_client):
        """Test successful login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "password123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["email"] == "test@test.com"
    
    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


class TestMarketCoreEndpoint:
    """Test /api/analytics/market-core endpoint"""
    
    def test_market_core_returns_prices(self, api_client):
        """Market Core should return BTC, ETH, SOL prices"""
        response = api_client.get(f"{BASE_URL}/api/analytics/market-core")
        assert response.status_code == 200
        data = response.json()
        
        # Check prices array contains BTC, ETH, SOL
        prices = data.get("prices", [])
        assert len(prices) == 3
        symbols = [p["symbol"] for p in prices]
        assert "BTC" in symbols
        assert "ETH" in symbols
        assert "SOL" in symbols
        
        # Each price should have required fields
        for price in prices:
            assert "price" in price
            assert "change_24h" in price
            assert "change_7d" in price
            assert price["price"] > 0
    
    def test_market_core_has_fear_greed(self, api_client):
        """Market Core should return Fear & Greed Index"""
        response = api_client.get(f"{BASE_URL}/api/analytics/market-core")
        assert response.status_code == 200
        data = response.json()
        
        fg = data.get("fear_greed", {})
        assert "value" in fg
        assert "classification" in fg
        assert 0 <= fg["value"] <= 100
    
    def test_market_core_has_gold(self, api_client):
        """Market Core should return Gold price in Traditional Markets"""
        response = api_client.get(f"{BASE_URL}/api/analytics/market-core")
        assert response.status_code == 200
        data = response.json()
        
        # Gold should be present
        assert "gold" in data
        assert data["gold"] > 0
        
        # Also check traditional_markets structure
        traditional = data.get("traditional_markets", {})
        if "gold" in traditional:
            assert traditional["gold"]["value"] > 0
    
    def test_market_core_has_stablecoins(self, api_client):
        """Market Core should return Stablecoin data"""
        response = api_client.get(f"{BASE_URL}/api/analytics/market-core")
        assert response.status_code == 200
        data = response.json()
        
        assert "stablecoin_mcap" in data
        assert "usdt_mcap" in data
        assert "usdc_mcap" in data
        assert data["stablecoin_mcap"] > 0
    
    def test_market_core_has_global_liquidity(self, api_client):
        """Market Core should return M2 Global Liquidity"""
        response = api_client.get(f"{BASE_URL}/api/analytics/market-core")
        assert response.status_code == 200
        data = response.json()
        
        assert "m2_global" in data
        assert data["m2_global"] > 0


class TestETFIntelligenceEndpoint:
    """Test /api/analytics/etf-intelligence endpoint"""
    
    def test_etf_returns_all_funds(self, api_client):
        """ETF Intelligence should return all crypto ETFs"""
        response = api_client.get(f"{BASE_URL}/api/analytics/etf-intelligence")
        assert response.status_code == 200
        data = response.json()
        
        # Should have btc_etf and eth_etf sections
        assert "btc_etf" in data
        assert "eth_etf" in data
        assert "all_funds" in data
        
        # BTC ETFs should have multiple funds
        btc_funds = data["btc_etf"]["funds"]
        assert len(btc_funds) > 5
        
        # ETH ETFs should have multiple funds
        eth_funds = data["eth_etf"]["funds"]
        assert len(eth_funds) > 3
        
        # All funds should combine both
        all_funds = data["all_funds"]
        assert len(all_funds) == len(btc_funds) + len(eth_funds)
    
    def test_etf_has_required_fields(self, api_client):
        """ETF data should have AUM, daily flow, fund details"""
        response = api_client.get(f"{BASE_URL}/api/analytics/etf-intelligence")
        assert response.status_code == 200
        data = response.json()
        
        # Check totals
        assert "total_aum" in data
        assert "total_daily_flow" in data
        assert data["total_aum"] > 0
        
        # Check fund structure
        fund = data["all_funds"][0]
        assert "ticker" in fund
        assert "name" in fund
        assert "issuer" in fund
        assert "aum" in fund
        assert "daily_flow" in fund


class TestOnchainEndpoint:
    """Test /api/analytics/onchain endpoint with chain selector"""
    
    def test_onchain_btc(self, api_client):
        """Onchain should return BTC chain data"""
        response = api_client.get(f"{BASE_URL}/api/analytics/onchain?chain=btc")
        assert response.status_code == 200
        data = response.json()
        
        assert data["chain"] == "BTC"
        assert "metrics" in data
        assert "sopr" in data["metrics"]
        assert "mvrv" in data["metrics"]
        assert "nupl" in data["metrics"]
        
        # BTC should have miner_reserves
        assert "miner_reserves" in data
    
    def test_onchain_eth(self, api_client):
        """Onchain should return ETH chain data"""
        response = api_client.get(f"{BASE_URL}/api/analytics/onchain?chain=eth")
        assert response.status_code == 200
        data = response.json()
        
        assert data["chain"] == "ETH"
        assert "metrics" in data
        
        # ETH should have staking data
        assert "staking" in data
        assert "total_staked" in data["staking"]
        assert "staking_ratio" in data["staking"]
    
    def test_onchain_sol(self, api_client):
        """Onchain should return SOL chain data"""
        response = api_client.get(f"{BASE_URL}/api/analytics/onchain?chain=sol")
        assert response.status_code == 200
        data = response.json()
        
        assert data["chain"] == "SOL"
        assert "metrics" in data
        
        # SOL should have staking data
        assert "staking" in data
        assert "total_staked" in data["staking"]
        assert "staking_ratio" in data["staking"]
    
    def test_onchain_default_btc(self, api_client):
        """Onchain without chain param should default to BTC"""
        response = api_client.get(f"{BASE_URL}/api/analytics/onchain")
        assert response.status_code == 200
        data = response.json()
        
        # Default is BTC
        assert data["chain"] == "BTC"


class TestOtherAnalyticsEndpoints:
    """Test remaining analytics endpoints"""
    
    def test_derivatives_endpoint(self, api_client):
        """Test derivatives endpoint returns data"""
        response = api_client.get(f"{BASE_URL}/api/analytics/derivatives")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_open_interest" in data
        assert "by_asset" in data
        assert "BTC" in data["by_asset"]
        assert "ETH" in data["by_asset"]
        assert "SOL" in data["by_asset"]
    
    def test_altseason_endpoint(self, api_client):
        """Test altseason endpoint returns data"""
        response = api_client.get(f"{BASE_URL}/api/analytics/altseason")
        assert response.status_code == 200
        data = response.json()
        
        assert "altseason_probability" in data
        assert "altseason_status" in data
        assert "dominance" in data
    
    def test_risk_engine_endpoint(self, api_client):
        """Test risk engine endpoint returns data"""
        response = api_client.get(f"{BASE_URL}/api/analytics/risk-engine")
        assert response.status_code == 200
        data = response.json()
        
        assert "risk_score" in data
        assert "volatility" in data
        assert "market_regime" in data
    
    def test_ai_signals_endpoint(self, api_client):
        """Test AI signals endpoint returns data"""
        response = api_client.get(f"{BASE_URL}/api/analytics/ai-signals")
        assert response.status_code == 200
        data = response.json()
        
        assert "composite_signal" in data
        assert "squeeze_probability" in data
        assert "liquidity_zones" in data
    
    def test_war_mode_endpoint(self, api_client):
        """Test war mode endpoint returns data"""
        response = api_client.get(f"{BASE_URL}/api/analytics/war-mode")
        assert response.status_code == 200
        data = response.json()
        
        assert "stress_score" in data
        assert "stress_level" in data
        assert "alerts" in data
    
    def test_portfolio_requires_auth(self, api_client):
        """Portfolio endpoint should require authentication"""
        response = api_client.get(f"{BASE_URL}/api/analytics/portfolio")
        assert response.status_code == 403  # Forbidden without auth
    
    def test_portfolio_with_auth(self, authenticated_client):
        """Portfolio endpoint should work with authentication"""
        response = authenticated_client.get(f"{BASE_URL}/api/analytics/portfolio")
        assert response.status_code == 200
        data = response.json()
        
        assert "positions" in data
        assert "summary" in data
        assert "risk_metrics" in data
