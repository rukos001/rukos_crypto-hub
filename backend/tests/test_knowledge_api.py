"""
Test Knowledge Base API Endpoints
- GET /api/knowledge (all articles)
- GET /api/knowledge?category=defi (by category)
- POST /api/admin/knowledge (admin create)
- DELETE /api/admin/knowledge/{id} (admin delete)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://rukos-crypto-hub.preview.emergentagent.com').rstrip('/')

# ==================== FIXTURES ====================

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@rukos.crypto",
        "password": "1661616irk"
    })
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    data = response.json()
    assert data.get("user", {}).get("role") == "admin", "User is not admin"
    return data.get("access_token")

@pytest.fixture
def user_token(api_client):
    """Get regular user authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "test@test.com",
        "password": "password123"
    })
    assert response.status_code == 200, f"User login failed: {response.text}"
    return response.json().get("access_token")

@pytest.fixture
def admin_client(api_client, admin_token):
    """Session with admin auth header"""
    api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
    return api_client

@pytest.fixture
def user_client(api_client, user_token):
    """Session with user auth header"""
    api_client.headers.update({"Authorization": f"Bearer {user_token}"})
    return api_client

# ==================== KNOWLEDGE GET TESTS ====================

class TestKnowledgeGet:
    """Test GET /api/knowledge endpoint"""

    def test_get_all_knowledge_returns_19_articles(self, api_client):
        """GET /api/knowledge returns all 19 default articles"""
        response = api_client.get(f"{BASE_URL}/api/knowledge")
        assert response.status_code == 200
        articles = response.json()
        assert len(articles) == 19, f"Expected 19 articles, got {len(articles)}"

    def test_get_knowledge_defi_returns_4_articles(self, api_client):
        """GET /api/knowledge?category=defi returns 4 DeFi articles (d1, d2, d3, st1)"""
        response = api_client.get(f"{BASE_URL}/api/knowledge?category=defi")
        assert response.status_code == 200
        articles = response.json()
        assert len(articles) == 4, f"Expected 4 defi articles, got {len(articles)}"
        for article in articles:
            assert article["category"] == "defi"
        # Check expected article IDs
        article_ids = [a["id"] for a in articles]
        assert "d1" in article_ids  # Что такое DeFi?
        assert "st1" in article_ids  # Стейблкоины: Гид

    def test_get_knowledge_perp_returns_4_articles(self, api_client):
        """GET /api/knowledge?category=perp returns 4 PERP articles (p1, p2, p3, tr1)"""
        response = api_client.get(f"{BASE_URL}/api/knowledge?category=perp")
        assert response.status_code == 200
        articles = response.json()
        assert len(articles) == 4, f"Expected 4 perp articles, got {len(articles)}"
        for article in articles:
            assert article["category"] == "perp"

    def test_get_knowledge_options_returns_3_articles(self, api_client):
        """GET /api/knowledge?category=options returns 3 OPTIONS articles (o1, o2, o3)"""
        response = api_client.get(f"{BASE_URL}/api/knowledge?category=options")
        assert response.status_code == 200
        articles = response.json()
        assert len(articles) == 3, f"Expected 3 options articles, got {len(articles)}"
        for article in articles:
            assert article["category"] == "options"

    def test_get_knowledge_macro_returns_4_articles(self, api_client):
        """GET /api/knowledge?category=macro returns 4 MACRO articles (m1, m2, m3, alt1)"""
        response = api_client.get(f"{BASE_URL}/api/knowledge?category=macro")
        assert response.status_code == 200
        articles = response.json()
        assert len(articles) == 4, f"Expected 4 macro articles, got {len(articles)}"
        for article in articles:
            assert article["category"] == "macro"

    def test_get_knowledge_onchain_returns_3_articles(self, api_client):
        """GET /api/knowledge?category=onchain returns 3 ONCHAIN articles (on1, on2, on3)"""
        response = api_client.get(f"{BASE_URL}/api/knowledge?category=onchain")
        assert response.status_code == 200
        articles = response.json()
        assert len(articles) == 3, f"Expected 3 onchain articles, got {len(articles)}"
        for article in articles:
            assert article["category"] == "onchain"

    def test_get_knowledge_etf_returns_1_article(self, api_client):
        """GET /api/knowledge?category=etf returns 1 ETF article (etf1)"""
        response = api_client.get(f"{BASE_URL}/api/knowledge?category=etf")
        assert response.status_code == 200
        articles = response.json()
        assert len(articles) == 1, f"Expected 1 etf article, got {len(articles)}"
        assert articles[0]["category"] == "etf"
        assert articles[0]["id"] == "etf1"

    def test_knowledge_article_has_required_fields(self, api_client):
        """Articles have id, title, content, category, tags, author, created_at"""
        response = api_client.get(f"{BASE_URL}/api/knowledge?category=defi")
        assert response.status_code == 200
        articles = response.json()
        assert len(articles) > 0
        article = articles[0]
        assert "id" in article
        assert "title" in article
        assert "content" in article
        assert "category" in article
        assert "tags" in article
        assert "author" in article
        assert "created_at" in article
        assert isinstance(article["tags"], list)

    def test_knowledge_articles_are_in_russian(self, api_client):
        """All articles have Russian content"""
        response = api_client.get(f"{BASE_URL}/api/knowledge")
        assert response.status_code == 200
        articles = response.json()
        # Sample check for Russian characters in content
        for article in articles:
            # Check for Cyrillic characters in title or content
            has_cyrillic = any(ord(c) >= 0x0400 and ord(c) <= 0x04FF for c in article["title"] + article["content"])
            assert has_cyrillic, f"Article {article['id']} should have Russian content"

# ==================== ADMIN KNOWLEDGE TESTS ====================

class TestAdminKnowledge:
    """Test admin knowledge endpoints"""

    def test_admin_create_article(self, admin_client):
        """POST /api/admin/knowledge creates article"""
        unique_id = str(uuid.uuid4())[:8]
        article_data = {
            "title": f"TEST_Article_{unique_id}",
            "content": "Test content with **bold** formatting",
            "category": "defi",
            "tags": ["test", "automated"]
        }
        response = admin_client.post(f"{BASE_URL}/api/admin/knowledge", json=article_data)
        assert response.status_code == 200
        created = response.json()
        assert created["title"] == article_data["title"]
        assert created["category"] == "defi"
        assert "id" in created

        # Cleanup - delete the test article
        article_id = created["id"]
        admin_client.delete(f"{BASE_URL}/api/admin/knowledge/{article_id}")

    def test_admin_delete_article(self, admin_client):
        """DELETE /api/admin/knowledge/{id} deletes article"""
        # First create an article
        unique_id = str(uuid.uuid4())[:8]
        article_data = {
            "title": f"TEST_ToDelete_{unique_id}",
            "content": "This article will be deleted",
            "category": "perp",
            "tags": ["test"]
        }
        create_response = admin_client.post(f"{BASE_URL}/api/admin/knowledge", json=article_data)
        assert create_response.status_code == 200
        article_id = create_response.json()["id"]

        # Now delete it
        delete_response = admin_client.delete(f"{BASE_URL}/api/admin/knowledge/{article_id}")
        assert delete_response.status_code == 200
        assert delete_response.json()["status"] == "deleted"

    def test_delete_nonexistent_article_returns_404(self, admin_client):
        """DELETE nonexistent article returns 404"""
        fake_id = "nonexistent-article-id"
        response = admin_client.delete(f"{BASE_URL}/api/admin/knowledge/{fake_id}")
        assert response.status_code == 404

    def test_non_admin_cannot_create_article(self, user_client):
        """Regular user cannot POST /api/admin/knowledge"""
        article_data = {
            "title": "Unauthorized Article",
            "content": "Should fail",
            "category": "defi",
            "tags": []
        }
        response = user_client.post(f"{BASE_URL}/api/admin/knowledge", json=article_data)
        assert response.status_code == 403

    def test_non_admin_cannot_delete_article(self, user_client):
        """Regular user cannot DELETE /api/admin/knowledge/{id}"""
        response = user_client.delete(f"{BASE_URL}/api/admin/knowledge/some-id")
        assert response.status_code == 403


# ==================== ADMIN PORTFOLIO API TESTS ====================

class TestAdminPortfolioAPI:
    """Test admin portfolio management endpoints"""

    def test_admin_list_portfolios(self, admin_client):
        """GET /api/admin/portfolios lists all users with position counts"""
        response = admin_client.get(f"{BASE_URL}/api/admin/portfolios")
        assert response.status_code == 200
        users = response.json()
        assert isinstance(users, list)
        assert len(users) > 0
        # Check structure
        user = users[0]
        assert "user_id" in user
        assert "username" in user
        assert "email" in user
        assert "positions_count" in user
        assert "has_custom_portfolio" in user

    def test_admin_get_user_portfolio(self, admin_client):
        """GET /api/admin/portfolio/{user_id} returns user portfolio"""
        # First get a user_id from portfolios list
        list_response = admin_client.get(f"{BASE_URL}/api/admin/portfolios")
        users = list_response.json()
        user_id = users[0]["user_id"]

        # Get that user's portfolio
        response = admin_client.get(f"{BASE_URL}/api/admin/portfolio/{user_id}")
        assert response.status_code == 200
        portfolio = response.json()
        assert "user_id" in portfolio
        assert "groups" in portfolio
        assert "HOLD" in portfolio["groups"]
        assert "ALTs" in portfolio["groups"]
        assert "HI_RISK" in portfolio["groups"]

    def test_admin_update_portfolio(self, admin_client):
        """PUT /api/admin/portfolio saves positions for user+group"""
        # Get a user_id
        list_response = admin_client.get(f"{BASE_URL}/api/admin/portfolios")
        users = list_response.json()
        user_id = users[0]["user_id"]

        # Update HOLD group with a test position
        unique_asset = f"TEST_BTC_{str(uuid.uuid4())[:4]}"
        update_data = {
            "user_id": user_id,
            "group": "HOLD",
            "positions": [
                {"asset": unique_asset, "size": 0.5, "entry": 95000, "current": 96000, "notes": "Test position"}
            ],
            "description": "Test description"
        }
        response = admin_client.put(f"{BASE_URL}/api/admin/portfolio", json=update_data)
        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "updated"
        assert result["positions_count"] == 1

        # Verify the update by fetching portfolio
        get_response = admin_client.get(f"{BASE_URL}/api/admin/portfolio/{user_id}")
        assert get_response.status_code == 200
        portfolio = get_response.json()
        hold_positions = portfolio["groups"]["HOLD"]["positions"]
        assert len(hold_positions) == 1
        assert hold_positions[0]["asset"] == unique_asset

        # Cleanup - remove the test position
        cleanup_data = {
            "user_id": user_id,
            "group": "HOLD",
            "positions": [],
            "description": ""
        }
        admin_client.put(f"{BASE_URL}/api/admin/portfolio", json=cleanup_data)

    def test_admin_portfolio_invalid_group(self, admin_client):
        """PUT /api/admin/portfolio with invalid group returns 400"""
        list_response = admin_client.get(f"{BASE_URL}/api/admin/portfolios")
        users = list_response.json()
        user_id = users[0]["user_id"]

        update_data = {
            "user_id": user_id,
            "group": "INVALID_GROUP",
            "positions": [],
            "description": ""
        }
        response = admin_client.put(f"{BASE_URL}/api/admin/portfolio", json=update_data)
        assert response.status_code == 400

    def test_non_admin_cannot_access_portfolios(self, user_client):
        """Regular user cannot GET /api/admin/portfolios"""
        response = user_client.get(f"{BASE_URL}/api/admin/portfolios")
        assert response.status_code == 403

    def test_non_admin_cannot_update_portfolio(self, user_client):
        """Regular user cannot PUT /api/admin/portfolio"""
        update_data = {
            "user_id": "some-id",
            "group": "HOLD",
            "positions": [],
            "description": ""
        }
        response = user_client.put(f"{BASE_URL}/api/admin/portfolio", json=update_data)
        assert response.status_code == 403
