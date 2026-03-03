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
    
    def test_portfolio_groups_have_positions_structure(self, user_client):
        """Portfolio groups should have proper structure (positions list)"""
        response = user_client.get(f"{BASE_URL}/api/portfolio/groups")
        data = response.json()
        
        # Check structure exists - each group should have a positions list
        for group_name in ["HOLD", "ALTs", "HI_RISK"]:
            group = data["groups"][group_name]
            assert "positions" in group
            assert isinstance(group["positions"], list)
            # If positions exist, verify structure
            for pos in group["positions"]:
                assert "asset" in pos
                assert "size" in pos
                assert "value_usd" in pos


# ==================== ADMIN PORTFOLIO EDITOR TESTS (NEW) ====================

class TestAdminPortfolioEditor:
    """Test admin portfolio management endpoints including Apply to All"""
    
    def test_admin_can_list_portfolios(self, admin_client):
        """Admin should be able to list all users for portfolio management"""
        response = admin_client.get(f"{BASE_URL}/api/admin/portfolios")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            user = data[0]
            assert "user_id" in user
            assert "username" in user
            assert "email" in user
            assert "positions_count" in user
    
    def test_admin_can_get_user_portfolio(self, admin_client):
        """Admin should be able to get a specific user's portfolio"""
        # Get list of users first
        users_response = admin_client.get(f"{BASE_URL}/api/admin/portfolios")
        assert users_response.status_code == 200
        users = users_response.json()
        assert len(users) > 0
        user_id = users[0]["user_id"]
        
        # Get portfolio for user
        response = admin_client.get(f"{BASE_URL}/api/admin/portfolio/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "groups" in data
        assert "HOLD" in data["groups"]
        assert "ALTs" in data["groups"]
        assert "HI_RISK" in data["groups"]
    
    def test_admin_can_update_user_portfolio(self, admin_client):
        """Admin should be able to update a specific user's portfolio"""
        # Get list of users first
        users_response = admin_client.get(f"{BASE_URL}/api/admin/portfolios")
        users = users_response.json()
        assert len(users) > 0
        user_id = users[0]["user_id"]
        
        # Update portfolio with test position
        unique_asset = f"TEST_{uuid.uuid4().hex[:6].upper()}"
        update_response = admin_client.put(f"{BASE_URL}/api/admin/portfolio", json={
            "user_id": user_id,
            "group": "HOLD",
            "positions": [
                {"asset": unique_asset, "size": 100, "entry": 50000, "current": 55000, "notes": "Test position"}
            ],
            "description": "Test HOLD group"
        })
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["status"] == "updated"
        assert data["user_id"] == user_id
        assert data["group"] == "HOLD"
        
        # Verify the update
        portfolio = admin_client.get(f"{BASE_URL}/api/admin/portfolio/{user_id}").json()
        hold_positions = portfolio["groups"]["HOLD"]["positions"]
        assets = [p["asset"] for p in hold_positions]
        assert unique_asset in assets
    
    def test_admin_apply_to_all_users(self, admin_client):
        """Admin should be able to apply portfolio changes to ALL users"""
        # Get total user count
        users_response = admin_client.get(f"{BASE_URL}/api/admin/portfolios")
        users = users_response.json()
        user_count = len(users)
        assert user_count > 0, "Need at least 1 user to test Apply to All"
        
        # Apply position to ALL users
        unique_asset = f"ALL_TEST_{uuid.uuid4().hex[:6].upper()}"
        update_response = admin_client.put(f"{BASE_URL}/api/admin/portfolio", json={
            "user_id": "ALL",  # KEY: user_id = "ALL" applies to everyone
            "group": "ALTs",
            "positions": [
                {"asset": unique_asset, "size": 500, "entry": 100, "current": 120, "notes": "Applied to all"}
            ],
            "description": "ALTs applied to all users"
        })
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["status"] == "updated_all"
        assert data["users_count"] == user_count
        assert data["group"] == "ALTs"
        
        # Verify at least one user got the update
        if user_count > 0:
            test_user_id = users[0]["user_id"]
            portfolio = admin_client.get(f"{BASE_URL}/api/admin/portfolio/{test_user_id}").json()
            alts_positions = portfolio["groups"]["ALTs"]["positions"]
            assets = [p["asset"] for p in alts_positions]
            assert unique_asset in assets, f"Asset {unique_asset} not found in user {test_user_id}'s ALTs"
    
    def test_admin_portfolio_invalid_group_fails(self, admin_client):
        """Admin should get error for invalid portfolio group"""
        users_response = admin_client.get(f"{BASE_URL}/api/admin/portfolios")
        users = users_response.json()
        if len(users) == 0:
            pytest.skip("No users to test with")
        user_id = users[0]["user_id"]
        
        update_response = admin_client.put(f"{BASE_URL}/api/admin/portfolio", json={
            "user_id": user_id,
            "group": "INVALID_GROUP",
            "positions": [],
            "description": ""
        })
        assert update_response.status_code == 400
        assert "Invalid group" in update_response.json()["detail"]
    
    def test_non_admin_cannot_access_portfolio_admin(self, user_client):
        """Regular user should get 403 on admin portfolio endpoints"""
        response = user_client.get(f"{BASE_URL}/api/admin/portfolios")
        assert response.status_code == 403


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
