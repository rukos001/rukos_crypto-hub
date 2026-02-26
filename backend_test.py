#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any

class RukosCryptoAPITester:
    def __init__(self):
        self.base_url = "https://crypto-dash-preview.preview.emergentagent.com/api"
        self.token = None
        self.user_id = None
        self.username = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": test_name,
            "status": "PASS" if success else "FAIL",
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status_icon = "✅" if success else "❌"
        print(f"{status_icon} {test_name}: {details}")

    def make_request(self, method: str, endpoint: str, data: Dict = None, expected_status: int = 200) -> tuple:
        """Make HTTP request with auth if available"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, f"Unsupported method: {method}"

            success = response.status_code == expected_status
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                return False, f"Expected {expected_status}, got {response.status_code}: {response.text}"

        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}"

    def test_auth_register(self):
        """Test user registration"""
        test_user = f"testuser_{datetime.now().strftime('%H%M%S')}"
        test_email = f"{test_user}@test.com"
        
        data = {
            "username": test_user,
            "email": test_email,
            "password": "TestPassword123!"
        }
        
        success, response = self.make_request("POST", "auth/register", data, 200)
        
        if success and isinstance(response, dict):
            if 'access_token' in response and 'user' in response:
                self.token = response['access_token']
                self.user_id = response['user']['id']
                self.username = response['user']['username']
                self.log_test("Auth Register", True, f"User registered: {test_user}")
                return True
            else:
                self.log_test("Auth Register", False, "Missing token or user in response")
                return False
        else:
            self.log_test("Auth Register", False, f"Registration failed: {response}")
            return False

    def test_auth_login(self):
        """Test user login (using registered user)"""
        if not self.username:
            self.log_test("Auth Login", False, "No registered user to test login")
            return False
            
        # Clear token to test fresh login
        old_token = self.token
        self.token = None
        
        data = {
            "email": f"{self.username}@test.com",
            "password": "TestPassword123!"
        }
        
        success, response = self.make_request("POST", "auth/login", data, 200)
        
        if success and isinstance(response, dict) and 'access_token' in response:
            self.token = response['access_token']
            self.log_test("Auth Login", True, "Login successful")
            return True
        else:
            self.token = old_token  # Restore token
            self.log_test("Auth Login", False, f"Login failed: {response}")
            return False

    def test_auth_me(self):
        """Test get current user endpoint"""
        if not self.token:
            self.log_test("Auth Me", False, "No token available")
            return False
            
        success, response = self.make_request("GET", "auth/me")
        
        if success and isinstance(response, dict) and 'username' in response:
            self.log_test("Auth Me", True, f"User info retrieved: {response['username']}")
            return True
        else:
            self.log_test("Auth Me", False, f"Get user failed: {response}")
            return False

    def test_crypto_prices(self):
        """Test crypto prices endpoint"""
        success, response = self.make_request("GET", "crypto/prices")
        
        if success and isinstance(response, dict) and 'data' in response:
            if len(response['data']) >= 3:  # Should have BTC, ETH, SOL
                coins = [coin['symbol'] for coin in response['data']]
                self.log_test("Crypto Prices", True, f"Got prices for: {', '.join(coins)}")
                return True
            else:
                self.log_test("Crypto Prices", False, "Not enough price data")
                return False
        else:
            self.log_test("Crypto Prices", False, f"Price fetch failed: {response}")
            return False

    def test_crypto_etf_flows(self):
        """Test ETF flows endpoint"""
        success, response = self.make_request("GET", "crypto/etf-flows")
        
        if success and isinstance(response, dict) and 'data' in response:
            self.log_test("ETF Flows", True, f"Got ETF flows data: {len(response['data'])} records")
            return True
        else:
            self.log_test("ETF Flows", False, f"ETF flows failed: {response}")
            return False

    def test_crypto_whale_activity(self):
        """Test whale activity endpoint"""
        success, response = self.make_request("GET", "crypto/whale-activity")
        
        if success and isinstance(response, dict) and 'alerts' in response:
            self.log_test("Whale Activity", True, f"Got whale alerts: {len(response['alerts'])} alerts")
            return True
        else:
            self.log_test("Whale Activity", False, f"Whale activity failed: {response}")
            return False

    def test_crypto_liquidations(self):
        """Test liquidations endpoint"""
        success, response = self.make_request("GET", "crypto/liquidations")
        
        if success and isinstance(response, dict) and 'total_24h' in response:
            self.log_test("Liquidations", True, f"Got liquidations data: ${response['total_24h']:,}")
            return True
        else:
            self.log_test("Liquidations", False, f"Liquidations failed: {response}")
            return False

    def test_crypto_fear_greed(self):
        """Test Fear & Greed Index endpoint"""
        success, response = self.make_request("GET", "crypto/fear-greed")
        
        if success and isinstance(response, dict) and 'current' in response:
            current = response['current']
            if 'value' in current and 'classification' in current:
                self.log_test("Fear & Greed Index", True, f"Current index: {current['value']} ({current['classification']})")
                return True
            else:
                self.log_test("Fear & Greed Index", False, "Missing current index data")
                return False
        else:
            self.log_test("Fear & Greed Index", False, f"Fear & Greed failed: {response}")
            return False

    def test_crypto_price_history(self):
        """Test price history endpoint"""
        success, response = self.make_request("GET", "crypto/price-history/btc?days=7")
        
        if success and isinstance(response, dict) and 'prices' in response:
            if len(response['prices']) > 0:
                self.log_test("Price History", True, f"Got {len(response['prices'])} price points for BTC")
                return True
            else:
                self.log_test("Price History", False, "No price history data")
                return False
        else:
            self.log_test("Price History", False, f"Price history failed: {response}")
            return False

    def test_posts_create(self):
        """Test creating a post"""
        if not self.token:
            self.log_test("Posts Create", False, "No auth token")
            return False
            
        data = {
            "title": "Test Post",
            "content": "This is a test post content about crypto market analysis.",
            "tags": ["test", "crypto", "btc"]
        }
        
        success, response = self.make_request("POST", "posts", data, 200)
        
        if success and isinstance(response, dict) and 'id' in response:
            self.created_post_id = response['id']
            self.log_test("Posts Create", True, f"Post created with ID: {response['id']}")
            return True
        else:
            self.log_test("Posts Create", False, f"Post creation failed: {response}")
            return False

    def test_posts_get(self):
        """Test getting posts list"""
        success, response = self.make_request("GET", "posts")
        
        if success and isinstance(response, list):
            self.log_test("Posts Get", True, f"Retrieved {len(response)} posts")
            return True
        else:
            self.log_test("Posts Get", False, f"Get posts failed: {response}")
            return False

    def test_posts_like(self):
        """Test liking a post"""
        if not hasattr(self, 'created_post_id'):
            self.log_test("Posts Like", False, "No post ID available")
            return False
            
        success, response = self.make_request("POST", f"posts/{self.created_post_id}/like")
        
        if success and isinstance(response, dict) and 'likes' in response:
            self.log_test("Posts Like", True, f"Post liked, total likes: {response['likes']}")
            return True
        else:
            self.log_test("Posts Like", False, f"Like post failed: {response}")
            return False

    def test_ideas_create(self):
        """Test creating a trading idea"""
        if not self.token:
            self.log_test("Ideas Create", False, "No auth token")
            return False
            
        data = {
            "title": "BTC Long Test Idea",
            "content": "Test trading idea for BTC long position",
            "coin": "BTC",
            "direction": "long",
            "target_price": 105000,
            "stop_loss": 95000
        }
        
        success, response = self.make_request("POST", "ideas", data, 200)
        
        if success and isinstance(response, dict) and 'id' in response:
            self.created_idea_id = response['id']
            self.log_test("Ideas Create", True, f"Idea created with ID: {response['id']}")
            return True
        else:
            self.log_test("Ideas Create", False, f"Idea creation failed: {response}")
            return False

    def test_ideas_get(self):
        """Test getting ideas list"""
        success, response = self.make_request("GET", "ideas")
        
        if success and isinstance(response, list):
            self.log_test("Ideas Get", True, f"Retrieved {len(response)} ideas")
            return True
        else:
            self.log_test("Ideas Get", False, f"Get ideas failed: {response}")
            return False

    def test_chat_create(self):
        """Test sending a chat message"""
        if not self.token:
            self.log_test("Chat Create", False, "No auth token")
            return False
            
        data = {"content": "Hello from test! Testing chat functionality."}
        
        success, response = self.make_request("POST", "chat", data, 200)
        
        if success and isinstance(response, dict) and 'id' in response:
            self.log_test("Chat Create", True, f"Message sent with ID: {response['id']}")
            return True
        else:
            self.log_test("Chat Create", False, f"Send message failed: {response}")
            return False

    def test_chat_get(self):
        """Test getting chat messages"""
        success, response = self.make_request("GET", "chat")
        
        if success and isinstance(response, list):
            self.log_test("Chat Get", True, f"Retrieved {len(response)} messages")
            return True
        else:
            self.log_test("Chat Get", False, f"Get messages failed: {response}")
            return False

    def test_ai_assistant(self):
        """Test AI assistant endpoint"""
        if not self.token:
            self.log_test("AI Assistant", False, "No auth token")
            return False
            
        data = {"message": "What is Bitcoin?"}
        
        success, response = self.make_request("POST", "ai-assistant", data, 200)
        
        if success and isinstance(response, dict) and 'response' in response:
            self.log_test("AI Assistant", True, f"AI responded: {response['response'][:50]}...")
            return True
        else:
            self.log_test("AI Assistant", False, f"AI assistant failed: {response}")
            return False

    # ==================== ANALYTICS DASHBOARD TESTS ====================
    
    def test_analytics_market_core(self):
        """Test Market Core analytics endpoint"""
        success, response = self.make_request("GET", "analytics/market-core")
        
        if success and isinstance(response, dict):
            required_fields = ['total_market_cap', 'btc_dominance', 'eth_dominance', 'market_regime']
            if all(field in response for field in required_fields):
                self.log_test("Analytics Market Core", True, f"Market regime: {response.get('market_regime')}, BTC Dom: {response.get('btc_dominance')}%")
                return True
            else:
                self.log_test("Analytics Market Core", False, f"Missing required fields: {required_fields}")
                return False
        else:
            self.log_test("Analytics Market Core", False, f"Market core failed: {response}")
            return False

    def test_analytics_derivatives(self):
        """Test Derivatives analytics endpoint"""
        success, response = self.make_request("GET", "analytics/derivatives")
        
        if success and isinstance(response, dict):
            if 'by_asset' in response and 'total_open_interest' in response:
                assets = list(response['by_asset'].keys()) if 'by_asset' in response else []
                self.log_test("Analytics Derivatives", True, f"OI: ${response.get('total_open_interest', 0):,.0f}, Assets: {assets}")
                return True
            else:
                self.log_test("Analytics Derivatives", False, "Missing by_asset or total_open_interest")
                return False
        else:
            self.log_test("Analytics Derivatives", False, f"Derivatives failed: {response}")
            return False

    def test_analytics_etf_intelligence(self):
        """Test ETF Intelligence analytics endpoint"""
        success, response = self.make_request("GET", "analytics/etf-intelligence")
        
        if success and isinstance(response, dict):
            if 'btc_etf' in response and 'eth_etf' in response:
                btc_aum = response['btc_etf'].get('total_aum', 0)
                eth_aum = response['eth_etf'].get('total_aum', 0)
                self.log_test("Analytics ETF Intelligence", True, f"BTC AUM: ${btc_aum:,.0f}, ETH AUM: ${eth_aum:,.0f}")
                return True
            else:
                self.log_test("Analytics ETF Intelligence", False, "Missing btc_etf or eth_etf data")
                return False
        else:
            self.log_test("Analytics ETF Intelligence", False, f"ETF Intelligence failed: {response}")
            return False

    def test_analytics_onchain(self):
        """Test Onchain analytics endpoint"""
        success, response = self.make_request("GET", "analytics/onchain")
        
        if success and isinstance(response, dict):
            if 'metrics' in response and 'exchange_flows' in response:
                sopr = response['metrics'].get('sopr', 0)
                mvrv = response['metrics'].get('mvrv', 0)
                self.log_test("Analytics Onchain", True, f"SOPR: {sopr:.3f}, MVRV: {mvrv:.2f}")
                return True
            else:
                self.log_test("Analytics Onchain", False, "Missing metrics or exchange_flows")
                return False
        else:
            self.log_test("Analytics Onchain", False, f"Onchain failed: {response}")
            return False

    def test_analytics_altseason(self):
        """Test Altseason analytics endpoint"""
        success, response = self.make_request("GET", "analytics/altseason")
        
        if success and isinstance(response, dict):
            if 'altseason_probability' in response and 'altseason_status' in response:
                prob = response.get('altseason_probability', 0)
                status = response.get('altseason_status', 'UNKNOWN')
                self.log_test("Analytics Altseason", True, f"Probability: {prob}%, Status: {status}")
                return True
            else:
                self.log_test("Analytics Altseason", False, "Missing probability or status")
                return False
        else:
            self.log_test("Analytics Altseason", False, f"Altseason failed: {response}")
            return False

    def test_analytics_risk_engine(self):
        """Test Risk Engine analytics endpoint"""
        success, response = self.make_request("GET", "analytics/risk-engine")
        
        if success and isinstance(response, dict):
            if 'risk_score' in response and 'market_regime' in response:
                risk_level = response['risk_score'].get('level', 'UNKNOWN')
                regime = response['market_regime'].get('current', 'UNKNOWN')
                self.log_test("Analytics Risk Engine", True, f"Risk Level: {risk_level}, Regime: {regime}")
                return True
            else:
                self.log_test("Analytics Risk Engine", False, "Missing risk_score or market_regime")
                return False
        else:
            self.log_test("Analytics Risk Engine", False, f"Risk Engine failed: {response}")
            return False

    def test_analytics_ai_signals(self):
        """Test AI Signals analytics endpoint"""
        success, response = self.make_request("GET", "analytics/ai-signals")
        
        if success and isinstance(response, dict):
            if 'composite_signal' in response and 'squeeze_probability' in response:
                signal_dir = response['composite_signal'].get('direction', 'UNKNOWN')
                signal_strength = response['composite_signal'].get('strength', 0)
                self.log_test("Analytics AI Signals", True, f"Signal: {signal_dir}, Strength: {signal_strength}%")
                return True
            else:
                self.log_test("Analytics AI Signals", False, "Missing composite_signal or squeeze_probability")
                return False
        else:
            self.log_test("Analytics AI Signals", False, f"AI Signals failed: {response}")
            return False

    def test_analytics_portfolio(self):
        """Test Portfolio analytics endpoint"""
        if not self.token:
            self.log_test("Analytics Portfolio", False, "No auth token")
            return False
            
        success, response = self.make_request("GET", "analytics/portfolio")
        
        if success and isinstance(response, dict):
            if 'positions' in response and 'summary' in response:
                total_value = response['summary'].get('total_value', 0)
                pnl = response['summary'].get('unrealized_pnl', 0)
                self.log_test("Analytics Portfolio", True, f"Total Value: ${total_value:,.2f}, PnL: ${pnl:,.2f}")
                return True
            else:
                self.log_test("Analytics Portfolio", False, "Missing positions or summary")
                return False
        else:
            self.log_test("Analytics Portfolio", False, f"Portfolio failed: {response}")
            return False

    def test_analytics_war_mode(self):
        """Test War Mode analytics endpoint"""
        success, response = self.make_request("GET", "analytics/war-mode")
        
        if success and isinstance(response, dict):
            if 'stress_score' in response and 'stress_level' in response:
                score = response.get('stress_score', 0)
                level = response.get('stress_level', 'UNKNOWN')
                war_mode = response.get('war_mode_active', False)
                self.log_test("Analytics War Mode", True, f"Stress: {score}/100 ({level}), War Mode: {war_mode}")
                return True
            else:
                self.log_test("Analytics War Mode", False, "Missing stress_score or stress_level")
                return False
        else:
            self.log_test("Analytics War Mode", False, f"War Mode failed: {response}")
            return False

    def run_all_tests(self):
        """Run comprehensive API test suite"""
        print("🚀 Starting RUKOS_CRYPTO | HUB API Testing")
        print(f"📍 Testing endpoint: {self.base_url}")
        print("=" * 60)

        # Test authentication first
        auth_success = self.test_auth_register()
        if auth_success:
            self.test_auth_login()
            self.test_auth_me()

        # Test crypto data endpoints (no auth required)
        self.test_crypto_prices()
        self.test_crypto_etf_flows()
        self.test_crypto_whale_activity()
        self.test_crypto_liquidations()
        self.test_crypto_fear_greed()
        self.test_crypto_price_history()

        # Test NEW Dashboard Analytics Endpoints
        print("\n📊 Testing Dashboard Analytics Endpoints...")
        self.test_analytics_market_core()
        self.test_analytics_derivatives()
        self.test_analytics_etf_intelligence()
        self.test_analytics_onchain()
        self.test_analytics_altseason()
        self.test_analytics_risk_engine()
        self.test_analytics_ai_signals()
        self.test_analytics_war_mode()

        # Test authenticated endpoints
        if self.token:
            print("\n🔐 Testing Authenticated Endpoints...")
            self.test_posts_create()
            self.test_posts_get()
            if hasattr(self, 'created_post_id'):
                self.test_posts_like()
            
            self.test_ideas_create()
            self.test_ideas_get()
            
            self.test_chat_create()
            self.test_chat_get()
            
            # Test portfolio (requires auth)
            self.test_analytics_portfolio()
            
            # AI Assistant test (might fail if key is invalid)
            self.test_ai_assistant()

        # Print summary
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed")
            return False

def main():
    tester = RukosCryptoAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/test_reports/backend_api_results.json', 'w') as f:
        json.dump({
            'summary': {
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'success_rate': f"{(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%",
                'timestamp': datetime.now().isoformat()
            },
            'detailed_results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())