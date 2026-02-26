"""
Test Admin Panel and Portfolio APIs
- Admin endpoints (users, stats, chat-messages, delete)
- Portfolio groups endpoint
- Authorization checks
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://market-dashboard-53.preview.emergentagent.com').rstrip('/')

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
    data = response.json()
    assert data.get("user", {}).get("role") == "user", "User should be regular user"
    return data.get("access_token")

@pytest.fixture
def admin_client(api_client, admin_token):
    """Session with admin auth header"""
    api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
    return api_client

@pytest.fixture
def user_client(api_client, user_token):
    """Session with regular user auth header"""
    api_client.headers.update({"Authorization": f"Bearer {user_token}"})
    return api_client

# ==================== ADMIN AUTH TESTS ====================

class TestAdminAuth:
    """Test admin authentication"""
    
    def test_admin_login_returns_role_admin(self, api_client):
        """Admin login should return role=admin"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@rukos.crypto",
            "password": "1661616irk"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "admin"
        assert data["user"]["email"] == "admin@rukos.crypto"
        assert data["user"]["username"] == "admin"
        assert "access_token" in data
    
    def test_regular_user_login_returns_role_user(self, api_client):
        """Regular user login should return role=user"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "password123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "user"

# ==================== ADMIN USERS ENDPOINT TESTS ====================

class TestAdminUsers:
    """Test /api/admin/users endpoint"""
    
    def test_admin_can_get_users_list(self, admin_client):
        """Admin should be able to get all users with raw_passwords"""
        response = admin_client.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Check that users have required fields
        for user in data:
            assert "id" in user
            assert "username" in user
            assert "email" in user
            assert "raw_password" in user
            assert "role" in user
            assert "created_at" in user
    
    def test_non_admin_cannot_get_users(self, user_client):
        """Regular user should get 403 on admin/users"""
        response = user_client.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 403
        assert "Admin access required" in response.json()["detail"]
    
    def test_admin_can_delete_non_admin_user(self, admin_client, api_client):
        """Admin should be able to delete non-admin users"""
        # Create a test user
        unique_id = str(uuid.uuid4())[:8]
        test_email = f"test_delete_{unique_id}@test.com"
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "username": f"test_del_{unique_id}",
            "email": test_email,
            "password": "testpass123"
        })
        assert response.status_code == 200
        user_id = response.json()["user"]["id"]
        
        # Delete the user
        delete_response = admin_client.delete(f"{BASE_URL}/api/admin/users/{user_id}")
        assert delete_response.status_code == 200
        assert delete_response.json()["status"] == "deleted"
        
        # Verify deletion
        users_response = admin_client.get(f"{BASE_URL}/api/admin/users")
        user_ids = [u["id"] for u in users_response.json()]
        assert user_id not in user_ids
    
    def test_admin_cannot_delete_admin_user(self, admin_client):
        """Admin should not be able to delete another admin"""
        # Get admin user id
        users_response = admin_client.get(f"{BASE_URL}/api/admin/users")
        admin_users = [u for u in users_response.json() if u["role"] == "admin"]
        assert len(admin_users) > 0
        admin_id = admin_users[0]["id"]
        
        # Try to delete admin
        delete_response = admin_client.delete(f"{BASE_URL}/api/admin/users/{admin_id}")
        assert delete_response.status_code == 400
        assert "Cannot delete admin" in delete_response.json()["detail"]
    
    def test_non_admin_cannot_delete_user(self, api_client):
        """Regular user should get 403 when trying to delete users"""
        # Get admin token to list users
        admin_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@rukos.crypto",
            "password": "1661616irk"
        })
        admin_token = admin_response.json()["access_token"]
        
        # Get a user id
        users_response = api_client.get(f"{BASE_URL}/api/admin/users", 
                                         headers={"Authorization": f"Bearer {admin_token}"})
        non_admin_users = [u for u in users_response.json() if u["role"] != "admin"]
        if len(non_admin_users) == 0:
            pytest.skip("No non-admin users to test with")
        user_id = non_admin_users[0]["id"]
        
        # Get user token
        user_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "password123"
        })
        user_token = user_response.json()["access_token"]
        
        # Try to delete as non-admin (fresh session)
        fresh_client = requests.Session()
        fresh_client.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {user_token}"
        })
        delete_response = fresh_client.delete(f"{BASE_URL}/api/admin/users/{user_id}")
        assert delete_response.status_code == 403

# ==================== ADMIN STATS ENDPOINT TESTS ====================

class TestAdminStats:
    """Test /api/admin/stats endpoint"""
    
    def test_admin_can_get_stats(self, admin_client):
        """Admin should be able to get platform stats"""
        response = admin_client.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "posts" in data
        assert "ideas" in data
        assert "chat_messages" in data
        assert isinstance(data["users"], int)
        assert isinstance(data["posts"], int)
        assert isinstance(data["ideas"], int)
        assert isinstance(data["chat_messages"], int)
    
    def test_non_admin_cannot_get_stats(self, user_client):
        """Regular user should get 403 on admin/stats"""
        response = user_client.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 403

# ==================== ADMIN CHAT MESSAGES TESTS ====================

class TestAdminChatMessages:
    """Test /api/admin/chat-messages endpoint"""
    
    def test_admin_can_get_chat_messages(self, admin_client):
        """Admin should be able to get all chat messages"""
        response = admin_client.get(f"{BASE_URL}/api/admin/chat-messages")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Check message structure if there are messages
        if len(data) > 0:
            msg = data[0]
            assert "id" in msg
            assert "content" in msg
            assert "author_id" in msg
            assert "author_username" in msg
            assert "created_at" in msg
    
    def test_admin_can_delete_chat_message(self, api_client):
        """Admin should be able to delete any chat message"""
        # Get user token
        user_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "password123"
        })
        user_token = user_response.json()["access_token"]
        
        # Create a message as regular user
        msg_client = requests.Session()
        msg_client.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {user_token}"
        })
        msg_response = msg_client.post(f"{BASE_URL}/api/chat", json={
            "content": f"Test message {uuid.uuid4()}"
        })
        assert msg_response.status_code == 200
        msg_id = msg_response.json()["id"]
        
        # Get admin token
        admin_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@rukos.crypto",
            "password": "1661616irk"
        })
        admin_token = admin_response.json()["access_token"]
        
        # Delete as admin (fresh session)
        admin_del_client = requests.Session()
        admin_del_client.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {admin_token}"
        })
        delete_response = admin_del_client.delete(f"{BASE_URL}/api/admin/chat-messages/{msg_id}")
        assert delete_response.status_code == 200
        assert delete_response.json()["status"] == "deleted"
        
        # Verify deletion
        messages = admin_del_client.get(f"{BASE_URL}/api/admin/chat-messages").json()
        msg_ids = [m["id"] for m in messages]
        assert msg_id not in msg_ids
    
    def test_non_admin_cannot_access_admin_chat_endpoint(self, user_client):
        """Regular user should get 403 on admin/chat-messages"""
        response = user_client.get(f"{BASE_URL}/api/admin/chat-messages")
        assert response.status_code == 403

# ==================== PORTFOLIO GROUPS TESTS ====================

class TestPortfolioGroups:
    """Test /api/portfolio/groups endpoint"""
    
    def test_authenticated_user_can_get_portfolio_groups(self, user_client):
        """Authenticated user should get portfolio with HOLD, ALTs, HI_RISK groups"""
        response = user_client.get(f"{BASE_URL}/api/portfolio/groups")
        assert response.status_code == 200
        data = response.json()
        
        # Check structure
        assert "groups" in data
        assert "total_value" in data
        assert "total_pnl" in data
        assert "total_pnl_pct" in data
        
        # Check groups exist
        groups = data["groups"]
        assert "HOLD" in groups
        assert "ALTs" in groups
        assert "HI_RISK" in groups
        
        # Check each group has positions and PnL data
        for group_name, group in groups.items():
            assert "description" in group
            assert "positions" in group
            assert "total_value" in group
            assert "total_pnl" in group
            assert isinstance(group["positions"], list)
            
            # Check position structure
            for pos in group["positions"]:
                assert "asset" in pos
                assert "size" in pos
                assert "entry" in pos
                assert "current" in pos
                assert "value_usd" in pos
                assert "pnl_usd" in pos
                assert "pnl_pct" in pos
    
    def test_portfolio_requires_auth(self, api_client):
        """Portfolio endpoint should require authentication"""
        response = api_client.get(f"{BASE_URL}/api/portfolio/groups")
        assert response.status_code in [401, 403]
    
    def test_admin_can_access_portfolio(self, admin_client):
        """Admin should also be able to access portfolio"""
        response = admin_client.get(f"{BASE_URL}/api/portfolio/groups")
        assert response.status_code == 200
        data = response.json()
        assert "groups" in data
        assert "HOLD" in data["groups"]
        assert "ALTs" in data["groups"]
        assert "HI_RISK" in data["groups"]
    
    def test_portfolio_groups_have_correct_positions(self, user_client):
        """Portfolio groups should have expected positions (mock data)"""
        response = user_client.get(f"{BASE_URL}/api/portfolio/groups")
        data = response.json()
        
        # HOLD should have BTC, ETH
        hold_assets = [p["asset"] for p in data["groups"]["HOLD"]["positions"]]
        assert "BTC" in hold_assets
        assert "ETH" in hold_assets
        
        # ALTs should have SOL, AVAX, LINK, ARB
        alts_assets = [p["asset"] for p in data["groups"]["ALTs"]["positions"]]
        assert "SOL" in alts_assets
        
        # HI_RISK should have PEPE, WIF, INJ
        hirisk_assets = [p["asset"] for p in data["groups"]["HI_RISK"]["positions"]]
        assert "PEPE" in hirisk_assets


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
