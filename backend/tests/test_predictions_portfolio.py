"""
Tests for Predictions API (Polymarket) and Portfolio CRUD
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# ═══════════════════════════════════════════════════════════
# PREDICTIONS API TESTS
# ═══════════════════════════════════════════════════════════

def test_predictions_endpoint_returns_200():
    """GET /api/predictions should return 200"""
    resp = requests.get(f"{BASE_URL}/api/predictions")
    assert resp.status_code == 200

def test_predictions_has_top_events():
    """Response should contain top_events array"""
    resp = requests.get(f"{BASE_URL}/api/predictions")
    data = resp.json()
    assert "top_events" in data
    assert isinstance(data["top_events"], list)

def test_predictions_has_extreme_mover():
    """Response should contain extreme_mover field"""
    resp = requests.get(f"{BASE_URL}/api/predictions")
    data = resp.json()
    assert "extreme_mover" in data
    # extreme_mover can be null if no extreme activity found

def test_predictions_has_metadata():
    """Response should contain total_volume, active_markets, source, updated_at"""
    resp = requests.get(f"{BASE_URL}/api/predictions")
    data = resp.json()
    assert "total_volume" in data
    assert "active_markets" in data
    assert "source" in data
    assert "updated_at" in data
    assert data["source"] == "Polymarket" or "unavailable" in data["source"].lower()

def test_predictions_event_structure():
    """Each event should have required fields: id, title, yes/no probability, volume"""
    resp = requests.get(f"{BASE_URL}/api/predictions")
    data = resp.json()
    if data["top_events"]:
        event = data["top_events"][0]
        assert "id" in event
        assert "title" in event
        assert "yes_probability" in event
        assert "no_probability" in event
        assert "volume" in event
        # Probabilities should be 0-100
        assert 0 <= event["yes_probability"] <= 100
        assert 0 <= event["no_probability"] <= 100

def test_predictions_top_10_max_events():
    """top_events should have at most 10 events"""
    resp = requests.get(f"{BASE_URL}/api/predictions")
    data = resp.json()
    assert len(data["top_events"]) <= 10

def test_predictions_events_sorted_by_volume():
    """Events should be sorted by volume descending"""
    resp = requests.get(f"{BASE_URL}/api/predictions")
    data = resp.json()
    if len(data["top_events"]) >= 2:
        volumes = [e["volume"] for e in data["top_events"]]
        assert volumes == sorted(volumes, reverse=True), "Events should be sorted by volume descending"

def test_predictions_extreme_mover_structure():
    """If extreme_mover exists, it should have activity_score"""
    resp = requests.get(f"{BASE_URL}/api/predictions")
    data = resp.json()
    if data["extreme_mover"]:
        assert "activity_score" in data["extreme_mover"]
        assert "title" in data["extreme_mover"]
        assert "yes_probability" in data["extreme_mover"]


# ═══════════════════════════════════════════════════════════
# PORTFOLIO AUTH HELPERS
# ═══════════════════════════════════════════════════════════

@pytest.fixture
def admin_token():
    """Login as admin and get token"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@rukos.crypto",
        "password": "1661616irk"
    })
    if resp.status_code != 200:
        pytest.skip("Admin login failed - skipping authenticated tests")
    return resp.json()["access_token"]

@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ═══════════════════════════════════════════════════════════
# PORTFOLIO/MY TESTS (CRUD)
# ═══════════════════════════════════════════════════════════

def test_portfolio_my_requires_auth():
    """GET /api/portfolio/my should return 403 without auth"""
    resp = requests.get(f"{BASE_URL}/api/portfolio/my")
    assert resp.status_code == 403

def test_portfolio_my_returns_200_with_auth(admin_headers):
    """GET /api/portfolio/my should return 200 with valid token"""
    resp = requests.get(f"{BASE_URL}/api/portfolio/my", headers=admin_headers)
    assert resp.status_code == 200

def test_portfolio_my_structure(admin_headers):
    """Response should have groups, total_value, total_pnl, positions_count"""
    resp = requests.get(f"{BASE_URL}/api/portfolio/my", headers=admin_headers)
    data = resp.json()
    assert "groups" in data
    assert "total_value" in data
    assert "total_pnl" in data
    assert "positions_count" in data
    assert "updated_at" in data

def test_portfolio_my_has_three_groups(admin_headers):
    """Groups should include HOLD, ALTs, HI_RISK"""
    resp = requests.get(f"{BASE_URL}/api/portfolio/my", headers=admin_headers)
    data = resp.json()
    groups = data["groups"]
    assert "HOLD" in groups
    assert "ALTs" in groups
    assert "HI_RISK" in groups

def test_portfolio_position_has_real_prices(admin_headers):
    """Positions should have current_price from CoinGecko"""
    resp = requests.get(f"{BASE_URL}/api/portfolio/my", headers=admin_headers)
    data = resp.json()
    # Find any position
    for g_name, g_data in data["groups"].items():
        for pos in g_data.get("positions", []):
            assert "current_price" in pos
            assert "pnl_usd" in pos
            assert "pnl_pct" in pos
            assert pos["current_price"] > 0, "Current price should be > 0 from CoinGecko"
            return
    # If no positions, that's ok

def test_portfolio_position_pnl_calculation(admin_headers):
    """PnL should be calculated: (current - entry) * size"""
    resp = requests.get(f"{BASE_URL}/api/portfolio/my", headers=admin_headers)
    data = resp.json()
    for g_name, g_data in data["groups"].items():
        for pos in g_data.get("positions", []):
            expected_pnl = (pos["current_price"] - pos["entry_price"]) * pos["size"]
            # Allow small floating point difference
            assert abs(pos["pnl_usd"] - expected_pnl) < 0.01, "PnL calculation mismatch"
            return


# ═══════════════════════════════════════════════════════════
# PORTFOLIO POSITION CRUD TESTS
# ═══════════════════════════════════════════════════════════

def test_create_position_requires_auth():
    """POST /api/portfolio/positions should require auth"""
    resp = requests.post(f"{BASE_URL}/api/portfolio/positions", json={
        "asset": "TEST", "size": 1, "entry_price": 100, "group": "HOLD"
    })
    assert resp.status_code == 403

def test_create_position(admin_headers):
    """POST /api/portfolio/positions should create a position"""
    import uuid
    test_asset = f"TEST{uuid.uuid4().hex[:4].upper()}"
    resp = requests.post(f"{BASE_URL}/api/portfolio/positions", headers=admin_headers, json={
        "asset": test_asset,
        "size": 10.5,
        "entry_price": 100.25,
        "group": "HI_RISK",
        "notes": "Test position"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["asset"] == test_asset
    assert data["size"] == 10.5
    assert data["entry_price"] == 100.25
    assert data["group"] == "HI_RISK"
    assert "id" in data
    
    # Cleanup - delete the test position
    pos_id = data["id"]
    requests.delete(f"{BASE_URL}/api/portfolio/positions/{pos_id}", headers=admin_headers)

def test_create_position_invalid_group(admin_headers):
    """Creating position with invalid group should fail"""
    resp = requests.post(f"{BASE_URL}/api/portfolio/positions", headers=admin_headers, json={
        "asset": "TEST",
        "size": 1,
        "entry_price": 100,
        "group": "INVALID_GROUP"
    })
    assert resp.status_code == 400

def test_update_position(admin_headers):
    """PUT /api/portfolio/positions/{id} should update position"""
    import uuid
    test_asset = f"UPD{uuid.uuid4().hex[:4].upper()}"
    
    # Create position first
    create_resp = requests.post(f"{BASE_URL}/api/portfolio/positions", headers=admin_headers, json={
        "asset": test_asset, "size": 5, "entry_price": 50, "group": "HOLD"
    })
    assert create_resp.status_code == 200
    pos_id = create_resp.json()["id"]
    
    # Update it
    update_resp = requests.put(f"{BASE_URL}/api/portfolio/positions/{pos_id}", headers=admin_headers, json={
        "size": 10,
        "group": "ALTs"
    })
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "updated"
    
    # Verify update via GET
    get_resp = requests.get(f"{BASE_URL}/api/portfolio/my", headers=admin_headers)
    data = get_resp.json()
    found = False
    for g_name, g_data in data["groups"].items():
        for pos in g_data.get("positions", []):
            if pos["id"] == pos_id:
                assert pos["size"] == 10
                assert pos["group"] == "ALTs"
                found = True
                break
    assert found, "Updated position not found"
    
    # Cleanup
    requests.delete(f"{BASE_URL}/api/portfolio/positions/{pos_id}", headers=admin_headers)

def test_delete_position(admin_headers):
    """DELETE /api/portfolio/positions/{id} should delete position"""
    import uuid
    test_asset = f"DEL{uuid.uuid4().hex[:4].upper()}"
    
    # Create
    create_resp = requests.post(f"{BASE_URL}/api/portfolio/positions", headers=admin_headers, json={
        "asset": test_asset, "size": 1, "entry_price": 10, "group": "HOLD"
    })
    pos_id = create_resp.json()["id"]
    
    # Delete
    del_resp = requests.delete(f"{BASE_URL}/api/portfolio/positions/{pos_id}", headers=admin_headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "deleted"
    
    # Verify deletion
    get_resp = requests.get(f"{BASE_URL}/api/portfolio/my", headers=admin_headers)
    data = get_resp.json()
    for g_name, g_data in data["groups"].items():
        for pos in g_data.get("positions", []):
            assert pos["id"] != pos_id, "Position was not deleted"

def test_delete_nonexistent_position(admin_headers):
    """DELETE on non-existent position should return 404"""
    resp = requests.delete(f"{BASE_URL}/api/portfolio/positions/nonexistent-id-12345", headers=admin_headers)
    assert resp.status_code == 404


# ═══════════════════════════════════════════════════════════
# RUKOS_CRYPTO PORTFOLIO TESTS
# ═══════════════════════════════════════════════════════════

def test_rukos_portfolio_no_auth_required():
    """GET /api/portfolio/rukos should work without auth"""
    resp = requests.get(f"{BASE_URL}/api/portfolio/rukos")
    assert resp.status_code == 200

def test_rukos_portfolio_structure():
    """RUKOS portfolio should have groups, description, updated_at"""
    resp = requests.get(f"{BASE_URL}/api/portfolio/rukos")
    data = resp.json()
    assert "groups" in data
    assert "total_value" in data
    assert "total_pnl" in data
    assert "positions_count" in data
    assert "description" in data
    assert "updated_at" in data

def test_rukos_portfolio_empty_state():
    """RUKOS portfolio should show empty state message when not configured"""
    resp = requests.get(f"{BASE_URL}/api/portfolio/rukos")
    data = resp.json()
    if data["positions_count"] == 0:
        assert "description" in data
        assert len(data["description"]) > 0


# ═══════════════════════════════════════════════════════════
# EXISTING POSITIONS VERIFICATION (per agent context)
# ═══════════════════════════════════════════════════════════

def test_existing_btc_position(admin_headers):
    """Verify BTC position exists: 1.5 @ $62K in HOLD"""
    resp = requests.get(f"{BASE_URL}/api/portfolio/my", headers=admin_headers)
    data = resp.json()
    hold_positions = data["groups"]["HOLD"]["positions"]
    btc_pos = next((p for p in hold_positions if p["asset"] == "BTC"), None)
    assert btc_pos is not None, "BTC position not found in HOLD"
    assert btc_pos["size"] == 1.5
    assert btc_pos["entry_price"] == 62000

def test_existing_eth_position(admin_headers):
    """Verify ETH position exists: 20 @ $1800 in HOLD"""
    resp = requests.get(f"{BASE_URL}/api/portfolio/my", headers=admin_headers)
    data = resp.json()
    hold_positions = data["groups"]["HOLD"]["positions"]
    eth_pos = next((p for p in hold_positions if p["asset"] == "ETH"), None)
    assert eth_pos is not None, "ETH position not found in HOLD"
    assert eth_pos["size"] == 20
    assert eth_pos["entry_price"] == 1800

def test_existing_sol_position(admin_headers):
    """Verify SOL position exists: 100 @ $75 in ALTs"""
    resp = requests.get(f"{BASE_URL}/api/portfolio/my", headers=admin_headers)
    data = resp.json()
    alts_positions = data["groups"]["ALTs"]["positions"]
    sol_pos = next((p for p in alts_positions if p["asset"] == "SOL"), None)
    assert sol_pos is not None, "SOL position not found in ALTs"
    assert sol_pos["size"] == 100
    assert sol_pos["entry_price"] == 75
