"""
Test TermLink Mappings - Verify term-to-article ID mappings
Tests the expected mappings from frontend/src/components/shared/TermLink.js
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://rukos-crypto-hub.preview.emergentagent.com').rstrip('/')

# Expected mappings from TermLink.js TERM_MAPPINGS
EXPECTED_TERM_MAPPINGS = {
    # DeFi terms -> d1, d2, d3, st1
    'tvl': {'category': 'defi', 'articleId': 'd1'},
    'defi': {'category': 'defi', 'articleId': 'd1'},
    'liquidity': {'category': 'defi', 'articleId': 'd1'},
    'amm': {'category': 'defi', 'articleId': 'd2'},
    'dex': {'category': 'defi', 'articleId': 'd2'},
    'impermanent loss': {'category': 'defi', 'articleId': 'd3'},
    'oracle': {'category': 'defi', 'articleId': 'd3'},
    'stablecoin': {'category': 'defi', 'articleId': 'st1'},
    'usdt': {'category': 'defi', 'articleId': 'st1'},
    'usdc': {'category': 'defi', 'articleId': 'st1'},
    
    # Perp terms -> p1, p2, p3, tr1
    'perpetual': {'category': 'perp', 'articleId': 'p1'},
    'open interest': {'category': 'perp', 'articleId': 'p1'},
    'leverage': {'category': 'perp', 'articleId': 'p1'},
    'long/short': {'category': 'perp', 'articleId': 'p1'},
    'funding rate': {'category': 'perp', 'articleId': 'p2'},
    'contango': {'category': 'perp', 'articleId': 'p2'},
    'backwardation': {'category': 'perp', 'articleId': 'p2'},
    'liquidation': {'category': 'perp', 'articleId': 'p3'},
    'margin': {'category': 'perp', 'articleId': 'p3'},
    'support': {'category': 'perp', 'articleId': 'tr1'},
    'resistance': {'category': 'perp', 'articleId': 'tr1'},
    
    # Options terms -> o1, o2, o3
    'options': {'category': 'options', 'articleId': 'o1'},
    'delta': {'category': 'options', 'articleId': 'o1'},
    'gamma': {'category': 'options', 'articleId': 'o1'},
    'theta': {'category': 'options', 'articleId': 'o1'},
    'vega': {'category': 'options', 'articleId': 'o1'},
    'iv': {'category': 'options', 'articleId': 'o1'},
    'dvol': {'category': 'options', 'articleId': 'o1'},
    'straddle': {'category': 'options', 'articleId': 'o2'},
    'covered call': {'category': 'options', 'articleId': 'o2'},
    'max pain': {'category': 'options', 'articleId': 'o3'},
    'gamma exposure': {'category': 'options', 'articleId': 'o3'},
    'gex': {'category': 'options', 'articleId': 'o3'},
    'gamma flip': {'category': 'options', 'articleId': 'o3'},
    
    # Macro terms -> m1, m2, m3, alt1
    'dxy': {'category': 'macro', 'articleId': 'm1'},
    'm2': {'category': 'macro', 'articleId': 'm1'},
    'fed': {'category': 'macro', 'articleId': 'm1'},
    'cpi': {'category': 'macro', 'articleId': 'm1'},
    'inflation': {'category': 'macro', 'articleId': 'm1'},
    'global liquidity': {'category': 'macro', 'articleId': 'm2'},
    'risk-on': {'category': 'macro', 'articleId': 'm3'},
    'risk-off': {'category': 'macro', 'articleId': 'm3'},
    'vix': {'category': 'macro', 'articleId': 'm3'},
    'fear & greed': {'category': 'macro', 'articleId': 'm3'},
    'dominance': {'category': 'macro', 'articleId': 'alt1'},
    'altseason': {'category': 'macro', 'articleId': 'alt1'},
    
    # Onchain terms -> on1, on2, on3
    'sopr': {'category': 'onchain', 'articleId': 'on1'},
    'nupl': {'category': 'onchain', 'articleId': 'on2'},
    'mvrv': {'category': 'onchain', 'articleId': 'on3'},
    'realized cap': {'category': 'onchain', 'articleId': 'on3'},
    'market cap': {'category': 'onchain', 'articleId': 'on3'},
    
    # ETF terms -> etf1
    'etf': {'category': 'etf', 'articleId': 'etf1'},
    'aum': {'category': 'etf', 'articleId': 'etf1'},
    'inflow': {'category': 'etf', 'articleId': 'etf1'},
    'outflow': {'category': 'etf', 'articleId': 'etf1'},
}


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def all_articles(api_client):
    """Get all knowledge articles"""
    response = api_client.get(f"{BASE_URL}/api/knowledge")
    assert response.status_code == 200
    return response.json()


class TestTermLinkMappings:
    """Verify that article IDs referenced in TERM_MAPPINGS exist in the knowledge base"""
    
    def test_all_article_ids_exist(self, all_articles):
        """All articleIds in TERM_MAPPINGS exist in the knowledge base"""
        article_ids = {a['id'] for a in all_articles}
        
        # Get unique article IDs from mappings
        expected_ids = {v['articleId'] for v in EXPECTED_TERM_MAPPINGS.values()}
        
        missing = expected_ids - article_ids
        assert not missing, f"Article IDs in TERM_MAPPINGS but not in knowledge base: {missing}"
    
    def test_defi_articles_exist(self, api_client):
        """DeFi category has d1, d2, d3, st1 articles"""
        response = api_client.get(f"{BASE_URL}/api/knowledge?category=defi")
        assert response.status_code == 200
        articles = response.json()
        article_ids = {a['id'] for a in articles}
        
        expected = {'d1', 'd2', 'd3', 'st1'}
        missing = expected - article_ids
        assert not missing, f"Missing DeFi articles: {missing}"
    
    def test_perp_articles_exist(self, api_client):
        """Perp category has p1, p2, p3, tr1 articles"""
        response = api_client.get(f"{BASE_URL}/api/knowledge?category=perp")
        assert response.status_code == 200
        articles = response.json()
        article_ids = {a['id'] for a in articles}
        
        expected = {'p1', 'p2', 'p3', 'tr1'}
        missing = expected - article_ids
        assert not missing, f"Missing Perp articles: {missing}"
    
    def test_options_articles_exist(self, api_client):
        """Options category has o1, o2, o3 articles"""
        response = api_client.get(f"{BASE_URL}/api/knowledge?category=options")
        assert response.status_code == 200
        articles = response.json()
        article_ids = {a['id'] for a in articles}
        
        expected = {'o1', 'o2', 'o3'}
        missing = expected - article_ids
        assert not missing, f"Missing Options articles: {missing}"
    
    def test_macro_articles_exist(self, api_client):
        """Macro category has m1, m2, m3, alt1 articles"""
        response = api_client.get(f"{BASE_URL}/api/knowledge?category=macro")
        assert response.status_code == 200
        articles = response.json()
        article_ids = {a['id'] for a in articles}
        
        expected = {'m1', 'm2', 'm3', 'alt1'}
        missing = expected - article_ids
        assert not missing, f"Missing Macro articles: {missing}"
    
    def test_onchain_articles_exist(self, api_client):
        """Onchain category has on1, on2, on3 articles"""
        response = api_client.get(f"{BASE_URL}/api/knowledge?category=onchain")
        assert response.status_code == 200
        articles = response.json()
        article_ids = {a['id'] for a in articles}
        
        expected = {'on1', 'on2', 'on3'}
        missing = expected - article_ids
        assert not missing, f"Missing Onchain articles: {missing}"
    
    def test_etf_articles_exist(self, api_client):
        """ETF category has etf1 article"""
        response = api_client.get(f"{BASE_URL}/api/knowledge?category=etf")
        assert response.status_code == 200
        articles = response.json()
        article_ids = {a['id'] for a in articles}
        
        expected = {'etf1'}
        missing = expected - article_ids
        assert not missing, f"Missing ETF articles: {missing}"


class TestTermLinkArticleContent:
    """Verify article content matches expected topics"""
    
    def test_fear_greed_article_content(self, api_client):
        """m3 article (fear & greed) has Risk-On vs Risk-Off content"""
        response = api_client.get(f"{BASE_URL}/api/knowledge?category=macro")
        assert response.status_code == 200
        articles = response.json()
        
        m3 = next((a for a in articles if a['id'] == 'm3'), None)
        assert m3 is not None, "Article m3 not found"
        assert 'Risk-On vs Risk-Off' in m3['title']
        assert 'страх' in m3['content'].lower() or 'жадность' in m3['content'].lower()
    
    def test_tvl_article_content(self, api_client):
        """d1 article (TVL) has DeFi basics content"""
        response = api_client.get(f"{BASE_URL}/api/knowledge?category=defi")
        assert response.status_code == 200
        articles = response.json()
        
        d1 = next((a for a in articles if a['id'] == 'd1'), None)
        assert d1 is not None, "Article d1 not found"
        assert 'DeFi' in d1['title']
        assert 'TVL' in d1['content']
    
    def test_funding_rate_article_content(self, api_client):
        """p2 article (funding rate) has funding rate strategies"""
        response = api_client.get(f"{BASE_URL}/api/knowledge?category=perp")
        assert response.status_code == 200
        articles = response.json()
        
        p2 = next((a for a in articles if a['id'] == 'p2'), None)
        assert p2 is not None, "Article p2 not found"
        assert 'фандинг' in p2['title'].lower()
        assert 'фандинг' in p2['content'].lower()
    
    def test_sopr_article_content(self, api_client):
        """on1 article has SOPR onchain metric content"""
        response = api_client.get(f"{BASE_URL}/api/knowledge?category=onchain")
        assert response.status_code == 200
        articles = response.json()
        
        on1 = next((a for a in articles if a['id'] == 'on1'), None)
        assert on1 is not None, "Article on1 not found"
        assert 'SOPR' in on1['title']
        assert 'SOPR' in on1['content']
    
    def test_etf_article_content(self, api_client):
        """etf1 article has Bitcoin ETF basics"""
        response = api_client.get(f"{BASE_URL}/api/knowledge?category=etf")
        assert response.status_code == 200
        articles = response.json()
        
        etf1 = next((a for a in articles if a['id'] == 'etf1'), None)
        assert etf1 is not None, "Article etf1 not found"
        assert 'ETF' in etf1['title']
        assert 'AUM' in etf1['content']
