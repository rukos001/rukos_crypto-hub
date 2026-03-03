from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any, Set
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret')
JWT_ALGORITHM = "HS256"
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI(title="RUKOS_CRYPTO | HUB API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cache for API data
cache: Dict[str, Any] = {}
cache_expiry: Dict[str, datetime] = {}

def get_cached(key: str, ttl_seconds: int = 60):
    """Get cached data if not expired"""
    if key in cache and key in cache_expiry:
        if datetime.now(timezone.utc) < cache_expiry[key]:
            return cache[key]
    return None

def set_cached(key: str, data: Any, ttl_seconds: int = 60):
    """Set cached data with TTL"""
    cache[key] = data
    cache_expiry[key] = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)

# ==================== WEBSOCKET MANAGER ====================

class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._broadcast_task: Optional[asyncio.Task] = None
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket connected. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket disconnected. Total: {len(self.active_connections)}")
    
    async def broadcast(self, message: dict):
        """Send message to all connected clients"""
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)
        
        # Clean up disconnected
        for conn in disconnected:
            self.active_connections.discard(conn)
    
    async def start_broadcast_loop(self):
        """Background task to broadcast market data every 30 seconds"""
        while True:
            try:
                if self.active_connections:
                    # Fetch fresh market data
                    data = await get_realtime_market_data()
                    await self.broadcast({
                        "type": "market_update",
                        "data": data,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })
                await asyncio.sleep(30)  # Update every 30 seconds
            except Exception as e:
                logger.error(f"Broadcast error: {e}")
                await asyncio.sleep(5)

manager = ConnectionManager()

async def get_realtime_market_data():
    """Fetch real-time market data for WebSocket broadcast"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Fetch BTC, ETH, SOL prices
            response = await client.get(
                "https://api.coingecko.com/api/v3/simple/price",
                params={
                    "ids": "bitcoin,ethereum,solana",
                    "vs_currencies": "usd",
                    "include_24hr_change": "true"
                }
            )
            
            if response.status_code == 429:
                # Rate limited - return cached or fallback data
                cached = get_cached("realtime_market")
                if cached:
                    return cached
                return None
            
            prices = response.json()
            
            # Fetch Fear & Greed
            fg_response = await client.get("https://api.alternative.me/fng/?limit=1")
            fg_data = fg_response.json().get("data", [{}])[0]
            
            result = {
                "prices": {
                    "btc": {
                        "price": prices.get("bitcoin", {}).get("usd", 0),
                        "change_24h": prices.get("bitcoin", {}).get("usd_24h_change", 0)
                    },
                    "eth": {
                        "price": prices.get("ethereum", {}).get("usd", 0),
                        "change_24h": prices.get("ethereum", {}).get("usd_24h_change", 0)
                    },
                    "sol": {
                        "price": prices.get("solana", {}).get("usd", 0),
                        "change_24h": prices.get("solana", {}).get("usd_24h_change", 0)
                    }
                },
                "fear_greed": {
                    "value": int(fg_data.get("value", 0)),
                    "classification": fg_data.get("value_classification", "Unknown")
                }
            }
            
            # Cache the result
            set_cached("realtime_market", result, ttl_seconds=60)
            return result
    except Exception as e:
        logger.error(f"Error fetching realtime data: {e}")
        # Return cached data on error
        cached = get_cached("realtime_market")
        return cached

# ==================== MODELS ====================

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    username: str
    email: str
    role: str = "user"
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class PostCreate(BaseModel):
    title: str
    content: str
    tags: List[str] = []

class PostResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    content: str
    tags: List[str]
    author_id: str
    author_username: str
    created_at: str
    likes: int = 0

class IdeaCreate(BaseModel):
    title: str
    content: str
    coin: str
    direction: str
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None

class IdeaResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    content: str
    coin: str
    direction: str
    target_price: Optional[float]
    stop_loss: Optional[float]
    author_id: str
    author_username: str
    created_at: str
    likes: int = 0

class ChatMessageCreate(BaseModel):
    content: str

class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    content: str
    author_id: str
    author_username: str
    created_at: str

class AIMessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class AIMessageResponse(BaseModel):
    response: str
    session_id: str

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, username: str, role: str = "user") -> str:
    payload = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "exp": datetime.now(timezone.utc).timestamp() + 86400 * 7
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return {"user_id": payload["user_id"], "username": payload["username"], "role": payload.get("role", "user")}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user: UserCreate):
    existing = await db.users.find_one({"$or": [{"email": user.email}, {"username": user.username}]})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "username": user.username,
        "email": user.email,
        "password_hash": hash_password(user.password),
        "raw_password": user.password,
        "role": "user",
        "created_at": now
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user.username, "user")
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user_id, username=user.username, email=user.email, role="user", created_at=now)
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(db_user["id"], db_user["username"], db_user.get("role", "user"))
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=db_user["id"],
            username=db_user["username"],
            email=db_user["email"],
            role=db_user.get("role", "user"),
            created_at=db_user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    db_user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**{**db_user, "role": db_user.get("role", "user")})

# ==================== POSTS ROUTES ====================

@api_router.post("/posts", response_model=PostResponse)
async def create_post(post: PostCreate, current_user: dict = Depends(get_current_user)):
    post_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    post_doc = {
        "id": post_id,
        "title": post.title,
        "content": post.content,
        "tags": post.tags,
        "author_id": current_user["user_id"],
        "author_username": current_user["username"],
        "created_at": now,
        "likes": 0
    }
    await db.posts.insert_one(post_doc)
    return PostResponse(**post_doc)

@api_router.get("/posts", response_model=List[PostResponse])
async def get_posts():
    posts = await db.posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [PostResponse(**p) for p in posts]

@api_router.post("/posts/{post_id}/like", response_model=PostResponse)
async def like_post(post_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.posts.find_one_and_update(
        {"id": post_id},
        {"$inc": {"likes": 1}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Post not found")
    result.pop("_id", None)
    return PostResponse(**result)

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, current_user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post["author_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.posts.delete_one({"id": post_id})
    return {"status": "deleted"}

# ==================== IDEAS ROUTES ====================

@api_router.post("/ideas", response_model=IdeaResponse)
async def create_idea(idea: IdeaCreate, current_user: dict = Depends(get_current_user)):
    idea_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    idea_doc = {
        "id": idea_id,
        "title": idea.title,
        "content": idea.content,
        "coin": idea.coin,
        "direction": idea.direction,
        "target_price": idea.target_price,
        "stop_loss": idea.stop_loss,
        "author_id": current_user["user_id"],
        "author_username": current_user["username"],
        "created_at": now,
        "likes": 0
    }
    await db.ideas.insert_one(idea_doc)
    return IdeaResponse(**idea_doc)

@api_router.get("/ideas", response_model=List[IdeaResponse])
async def get_ideas():
    ideas = await db.ideas.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [IdeaResponse(**i) for i in ideas]

@api_router.post("/ideas/{idea_id}/like", response_model=IdeaResponse)
async def like_idea(idea_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.ideas.find_one_and_update(
        {"id": idea_id},
        {"$inc": {"likes": 1}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Idea not found")
    result.pop("_id", None)
    return IdeaResponse(**result)

# ==================== CHAT ROUTES ====================

@api_router.post("/chat", response_model=ChatMessageResponse)
async def create_chat_message(msg: ChatMessageCreate, current_user: dict = Depends(get_current_user)):
    msg_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    msg_doc = {
        "id": msg_id,
        "content": msg.content,
        "author_id": current_user["user_id"],
        "author_username": current_user["username"],
        "created_at": now
    }
    await db.chat_messages.insert_one(msg_doc)
    return ChatMessageResponse(**msg_doc)

@api_router.get("/chat", response_model=List[ChatMessageResponse])
async def get_chat_messages():
    messages = await db.chat_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [ChatMessageResponse(**m) for m in messages]

# ==================== AI ASSISTANT ROUTE ====================

@api_router.post("/ai-assistant", response_model=AIMessageResponse)
async def ai_assistant(request: AIMessageRequest, current_user: dict = Depends(get_current_user)):
    session_id = request.session_id or str(uuid.uuid4())
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message="""Ты - криптовалютный AI-ассистент для платформы RUKOS_CRYPTO | HUB. 
            Помогай пользователям с информацией о криптовалютах, трейдинге, анализе рынка.
            Отвечай на русском языке. Будь краток и информативен."""
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=request.message)
        response = await chat.send_message(user_message)
        
        await db.ai_conversations.insert_one({
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "user_id": current_user["user_id"],
            "user_message": request.message,
            "ai_response": response,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return AIMessageResponse(response=response, session_id=session_id)
    except Exception as e:
        logger.error(f"AI Assistant error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

# ==================== REAL CRYPTO DATA ROUTES ====================

COINGECKO_API = "https://api.coingecko.com/api/v3"

@api_router.get("/crypto/prices")
async def get_crypto_prices():
    """Get real crypto prices via shared data service (60s cache)"""
    prices = await ds.get_prices()
    coins = prices.get("coins", {})
    gl = prices.get("global", {})

    data_list = []
    for sym in ["BTC", "ETH", "SOL"]:
        c = coins.get(sym, {})
        if c:
            data_list.append({
                "symbol": c.get("symbol", sym),
                "name": c.get("name", ""),
                "price": c.get("price", 0),
                "change_24h": c.get("change_24h", 0),
                "change_7d": c.get("change_7d", 0),
                "market_cap": c.get("market_cap", 0),
                "volume_24h": c.get("volume_24h", 0),
                "high_24h": c.get("high_24h", 0),
                "low_24h": c.get("low_24h", 0),
                "image": c.get("image", ""),
            })

    return {
        "data": data_list,
        "total_market_cap": gl.get("total_market_cap", 0),
        "btc_dominance": gl.get("btc_dominance", 0),
        "eth_dominance": gl.get("eth_dominance", 0),
        "total_volume_24h": gl.get("total_volume_24h", 0),
        "updated_at": prices.get("updated_at", datetime.now(timezone.utc).isoformat()),
    }

@api_router.get("/crypto/price-history/{coin_id}")
async def get_price_history(coin_id: str, days: int = 7):
    """Get price history for charts"""
    cache_key = f"price_history_{coin_id}_{days}"
    cached = get_cached(cache_key, ttl_seconds=300)
    if cached:
        return cached
    
    coin_map = {"btc": "bitcoin", "eth": "ethereum", "sol": "solana"}
    cg_id = coin_map.get(coin_id.lower(), coin_id.lower())
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{COINGECKO_API}/coins/{cg_id}/market_chart",
                params={"vs_currency": "usd", "days": days}
            )
            response.raise_for_status()
            data = response.json()
            
            result = {
                "coin_id": coin_id.upper(),
                "days": days,
                "prices": [
                    {"timestamp": p[0], "price": p[1], "date": datetime.fromtimestamp(p[0]/1000).strftime("%d.%m")}
                    for p in data["prices"]
                ],
                "volumes": [
                    {"timestamp": v[0], "volume": v[1], "date": datetime.fromtimestamp(v[0]/1000).strftime("%d.%m")}
                    for v in data["total_volumes"]
                ],
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            set_cached(cache_key, result, ttl_seconds=300)
            return result
            
    except Exception as e:
        logger.warning(f"CoinGecko price history error: {str(e)}")
        # Generate fallback price history from current real price
        prices_data = await ds.get_prices()
        coin_sym = coin_id.upper()
        current_price = prices_data.get("coins", {}).get(coin_sym, {}).get("price", 0)
        if not current_price:
            current_price = {"BTC": 67000, "ETH": 2000, "SOL": 86}.get(coin_sym, 1000)

        import random
        random.seed(int(datetime.now().timestamp() / 3600))
        prices_list = []
        volumes_list = []
        for i in range(days * 24, -1, -1):
            t = datetime.now() - timedelta(hours=i)
            ts = int(t.timestamp() * 1000)
            drift = random.uniform(-0.02, 0.02) * current_price
            p = current_price + drift * (i / (days * 24))
            prices_list.append({"timestamp": ts, "price": round(p, 2), "date": t.strftime("%d.%m")})
            volumes_list.append({"timestamp": ts, "volume": random.uniform(1e9, 5e9), "date": t.strftime("%d.%m")})

        result = {
            "coin_id": coin_sym,
            "days": days,
            "prices": prices_list,
            "volumes": volumes_list,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "is_fallback": True,
        }
        set_cached(cache_key, result, ttl_seconds=120)
        return result

@api_router.get("/crypto/etf-flows")
async def get_etf_flows():
    """ETF flows data - using realistic mock since real APIs require paid subscriptions"""
    cache_key = "etf_flows"
    cached = get_cached(cache_key, ttl_seconds=300)
    if cached:
        return cached
    
    # Generate realistic ETF data based on current date
    import random
    random.seed(datetime.now().day)  # Consistent within the day
    
    base_btc_aum = 55_000_000_000  # ~$55B total BTC ETF AUM
    base_eth_aum = 9_500_000_000   # ~$9.5B total ETH ETF AUM
    
    dates = []
    for i in range(7, -1, -1):
        date = datetime.now() - timedelta(days=i)
        btc_flow = random.randint(-600_000_000, 900_000_000)
        eth_flow = random.randint(-100_000_000, 200_000_000)
        dates.append({
            "date": date.strftime("%Y-%m-%d"),
            "date_short": date.strftime("%d.%m"),
            "btc_inflow": btc_flow,
            "eth_inflow": eth_flow
        })
    
    data = {
        "data": dates,
        "total_btc_aum": base_btc_aum + sum(d["btc_inflow"] for d in dates),
        "total_eth_aum": base_eth_aum + sum(d["eth_inflow"] for d in dates),
        "weekly_btc_flow": sum(d["btc_inflow"] for d in dates[-7:]),
        "weekly_eth_flow": sum(d["eth_inflow"] for d in dates[-7:]),
        "source": "SoSoValue (simulated)",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    set_cached(cache_key, data, ttl_seconds=300)
    return data

@api_router.get("/crypto/whale-activity")
async def get_whale_activity():
    """Whale activity - simulated Arkham-style data with real prices"""
    cache_key = "whale_activity"
    cached = get_cached(cache_key, ttl_seconds=60)
    if cached:
        return cached
    
    # Get real prices
    prices_data = await ds.get_prices()
    coins = prices_data.get("coins", {})
    coin_prices = {
        "BTC": coins.get("BTC", {}).get("price", 67000),
        "ETH": coins.get("ETH", {}).get("price", 2000),
        "SOL": coins.get("SOL", {}).get("price", 86),
    }
    
    import random
    random.seed(int(datetime.now().timestamp() / 60))
    
    exchanges = ["Binance", "Coinbase", "Kraken", "OKX", "Bybit"]
    entities = ["Unknown Wallet", "Jump Trading", "Cumberland", "Wintermute", "Galaxy Digital", "Alameda Remnant"]
    
    alerts = []
    for i in range(8):
        coin = random.choice(["BTC", "ETH", "SOL"])
        
        if coin == "BTC":
            amount = random.randint(100, 3500)
        elif coin == "ETH":
            amount = random.randint(5000, 80000)
        else:
            amount = random.randint(50000, 500000)
        
        usd_value = amount * coin_prices[coin]
        
        tx_types = ["withdrawal", "deposit", "transfer", "accumulation", "potential_sell"]
        tx_type = random.choice(tx_types)
        
        if tx_type in ["withdrawal", "potential_sell"]:
            from_entity = random.choice(exchanges)
            to_entity = random.choice(entities)
        elif tx_type == "deposit":
            from_entity = random.choice(entities)
            to_entity = random.choice(exchanges)
        else:
            from_entity = random.choice(entities)
            to_entity = random.choice(entities + ["Cold Wallet"])
        
        minutes_ago = random.randint(1, 180)
        if minutes_ago < 60:
            time_str = f"{minutes_ago} мин назад"
        else:
            time_str = f"{minutes_ago // 60} час{'а' if minutes_ago // 60 < 5 else 'ов'} назад"
        
        alerts.append({
            "coin": coin,
            "amount": amount,
            "usd_value": usd_value,
            "from": from_entity,
            "to": to_entity,
            "time": time_str,
            "type": tx_type,
            "tx_hash": f"0x{random.randbytes(4).hex()}...{random.randbytes(4).hex()}"
        })
    
    alerts.sort(key=lambda x: int(x["time"].split()[0]) if x["time"].split()[0].isdigit() else 999)
    
    data = {
        "alerts": alerts,
        "total_24h_volume": sum(a["usd_value"] for a in alerts) * 12,
        "source": "Arkham Intelligence (simulated)",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    set_cached(cache_key, data, ttl_seconds=60)
    return data

@api_router.get("/crypto/liquidations")
async def get_liquidations():
    """Liquidations data - simulated Coinglass-style data"""
    cache_key = "liquidations"
    cached = get_cached(cache_key, ttl_seconds=30)
    if cached:
        return cached
    
    import random
    random.seed(int(datetime.now().timestamp() / 30))
    
    # Base liquidation amounts (realistic ranges)
    base_total = random.randint(150_000_000, 450_000_000)
    long_ratio = random.uniform(0.45, 0.65)
    
    long_liqs = int(base_total * long_ratio)
    short_liqs = base_total - long_liqs
    
    coins_data = []
    for coin, share in [("BTC", 0.55), ("ETH", 0.28), ("SOL", 0.12), ("OTHER", 0.05)]:
        coin_total = int(base_total * share)
        coin_long_ratio = random.uniform(0.4, 0.6)
        coins_data.append({
            "coin": coin,
            "total": coin_total,
            "longs": int(coin_total * coin_long_ratio),
            "shorts": int(coin_total * (1 - coin_long_ratio))
        })
    
    # Historical data for chart
    history = []
    for i in range(24, -1, -1):
        hour = datetime.now() - timedelta(hours=i)
        h_total = random.randint(5_000_000, 35_000_000)
        h_long_ratio = random.uniform(0.4, 0.6)
        history.append({
            "hour": hour.strftime("%H:00"),
            "timestamp": hour.isoformat(),
            "total": h_total,
            "longs": int(h_total * h_long_ratio),
            "shorts": int(h_total * (1 - h_long_ratio))
        })
    
    record_24h = 1_200_000_000  # Actual record is around $1.2B
    current_vs_record = round((base_total / record_24h) * 100, 1)
    
    data = {
        "total_24h": base_total,
        "long_liquidations": long_liqs,
        "short_liquidations": short_liqs,
        "largest_single": {
            "coin": random.choice(["BTC", "ETH"]),
            "amount": random.randint(5_000_000, 25_000_000),
            "type": random.choice(["long", "short"]),
            "exchange": random.choice(["Binance", "OKX", "Bybit"])
        },
        "by_coin": coins_data,
        "history_24h": history,
        "near_record": current_vs_record > 30,
        "record_24h": record_24h,
        "current_vs_record_percent": current_vs_record,
        "source": "Coinglass (simulated)",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    set_cached(cache_key, data, ttl_seconds=30)
    return data

@api_router.get("/crypto/fear-greed")
async def get_fear_greed():
    """Fear & Greed Index"""
    cache_key = "fear_greed"
    cached = get_cached(cache_key, ttl_seconds=3600)
    if cached:
        return cached
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get("https://api.alternative.me/fng/?limit=7")
            response.raise_for_status()
            fg_data = response.json()
            
            data = {
                "current": {
                    "value": int(fg_data["data"][0]["value"]),
                    "classification": fg_data["data"][0]["value_classification"],
                    "timestamp": fg_data["data"][0]["timestamp"]
                },
                "history": [
                    {
                        "value": int(d["value"]),
                        "classification": d["value_classification"],
                        "date": datetime.fromtimestamp(int(d["timestamp"])).strftime("%d.%m")
                    }
                    for d in fg_data["data"]
                ],
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            set_cached(cache_key, data, ttl_seconds=3600)
            return data
            
    except Exception as e:
        logger.error(f"Fear & Greed API error: {str(e)}")
        # Fallback
        return {
            "current": {"value": 65, "classification": "Greed"},
            "history": [],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

def get_fallback_prices():
    """Fallback mock data when API is unavailable"""
    return {
        "data": [
            {"symbol": "BTC", "name": "Bitcoin", "price": 97542.18, "change_24h": 2.45, "change_7d": 5.2, "market_cap": 1920000000000, "volume_24h": 45000000000, "high_24h": 98500, "low_24h": 95000, "image": ""},
            {"symbol": "ETH", "name": "Ethereum", "price": 3456.72, "change_24h": 1.23, "change_7d": 3.1, "market_cap": 415000000000, "volume_24h": 18000000000, "high_24h": 3500, "low_24h": 3380, "image": ""},
            {"symbol": "SOL", "name": "Solana", "price": 187.34, "change_24h": -0.87, "change_7d": -2.4, "market_cap": 86000000000, "volume_24h": 3500000000, "high_24h": 192, "low_24h": 183, "image": ""},
        ],
        "total_market_cap": 3500000000000,
        "btc_dominance": 54.8,
        "eth_dominance": 11.8,
        "total_volume_24h": 125000000000,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "is_fallback": True
    }

# ==================== ADVANCED ANALYTICS ROUTES ====================

from advanced_analytics import (
    get_market_core_data, get_derivatives_data, get_etf_intelligence,
    get_onchain_data, get_altseason_data, get_risk_engine,
    get_options_data, get_sentiment_data, get_capital_flows,
    get_ai_signals, get_portfolio_data, get_war_mode_alerts
)
import data_service as ds

@api_router.get("/analytics/market-core")
async def market_core():
    """Macro panel data"""
    return await get_market_core_data()

@api_router.get("/analytics/derivatives")
async def derivatives(asset: str = "all"):
    """Derivatives data for BTC, ETH, SOL or all"""
    return await get_derivatives_data(asset)

@api_router.get("/analytics/etf-intelligence")
async def etf_intelligence():
    """Extended ETF flow intelligence"""
    return await get_etf_intelligence()

@api_router.get("/analytics/onchain")
async def onchain(chain: str = "btc"):
    """Onchain war room data for BTC, ETH, or SOL"""
    return await get_onchain_data(chain)

@api_router.get("/analytics/altseason")
async def altseason():
    """Altseason monitor"""
    return await get_altseason_data()

@api_router.get("/analytics/risk-engine")
async def risk_engine():
    """Risk assessment engine"""
    return await get_risk_engine()

@api_router.get("/analytics/options")
async def options():
    """Options intelligence"""
    return await get_options_data()

@api_router.get("/analytics/sentiment")
async def sentiment():
    """Social & sentiment data"""
    return await get_sentiment_data()

@api_router.get("/analytics/capital-flows")
async def capital_flows():
    """Capital flow map"""
    return await get_capital_flows()

@api_router.get("/analytics/ai-signals")
async def ai_signals():
    """AI signal panel"""
    return await get_ai_signals()

@api_router.get("/analytics/portfolio")
async def portfolio(current_user: dict = Depends(get_current_user)):
    """User portfolio data"""
    return await get_portfolio_data(current_user["user_id"])

@api_router.get("/analytics/war-mode")
async def war_mode():
    """War mode alerts"""
    return await get_war_mode_alerts()

@api_router.post("/analytics/refresh")
async def force_refresh():
    """Force refresh all cached data"""
    ds.clear_cache()
    return {"status": "ok", "message": "Cache cleared, next request will fetch fresh data"}

@api_router.get("/analytics/cache-status")
async def cache_status():
    """Get current cache status for debugging"""
    return ds.get_cache_status()

# ==================== ADMIN ROUTES ====================

class AdminUserResponse(BaseModel):
    id: str
    username: str
    email: str
    raw_password: Optional[str] = None
    role: str = "user"
    created_at: str

@api_router.get("/admin/users")
async def admin_get_users(admin: dict = Depends(get_admin_user)):
    """List all users with their details (admin only)"""
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return [AdminUserResponse(
        id=u["id"],
        username=u["username"],
        email=u["email"],
        raw_password=u.get("raw_password", "***"),
        role=u.get("role", "user"),
        created_at=u["created_at"]
    ) for u in users]

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a user (admin only)"""
    target = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete admin")
    await db.users.delete_one({"id": user_id})
    await db.posts.delete_many({"author_id": user_id})
    await db.ideas.delete_many({"author_id": user_id})
    await db.chat_messages.delete_many({"author_id": user_id})
    return {"status": "deleted", "user_id": user_id}

class UpdateUserRole(BaseModel):
    role: str

@api_router.put("/admin/users/{user_id}/role")
async def admin_update_role(user_id: str, body: UpdateUserRole, admin: dict = Depends(get_admin_user)):
    """Update user role (admin only)"""
    target = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    await db.users.update_one({"id": user_id}, {"$set": {"role": body.role}})
    return {"status": "updated", "user_id": user_id, "role": body.role}

@api_router.get("/admin/stats")
async def admin_get_stats(admin: dict = Depends(get_admin_user)):
    """Get platform stats (admin only)"""
    users_count = await db.users.count_documents({})
    posts_count = await db.posts.count_documents({})
    ideas_count = await db.ideas.count_documents({})
    messages_count = await db.chat_messages.count_documents({})
    return {
        "users": users_count,
        "posts": posts_count,
        "ideas": ideas_count,
        "chat_messages": messages_count
    }

@api_router.get("/admin/chat-messages")
async def admin_get_chat_messages(admin: dict = Depends(get_admin_user)):
    """Get all chat messages (admin only)"""
    messages = await db.chat_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return messages

@api_router.delete("/admin/chat-messages/{message_id}")
async def admin_delete_chat_message(message_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a chat message (admin only)"""
    result = await db.chat_messages.delete_one({"id": message_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"status": "deleted", "message_id": message_id}

# ==================== PORTFOLIO WITH SUBGROUPS ====================

@api_router.get("/portfolio/groups")
async def get_portfolio_groups(current_user: dict = Depends(get_current_user)):
    """Get user portfolio with HOLD / ALTs / HI RISK groups"""
    user_id = current_user["user_id"]
    
    # Check if user has custom portfolio data
    portfolio = await db.portfolios.find_one({"user_id": user_id}, {"_id": 0})
    
    if not portfolio:
        # Return default mock portfolio groups
        portfolio = {
            "user_id": user_id,
            "groups": {
                "HOLD": {
                    "description": "Long-term core positions",
                    "positions": [
                        {"asset": "BTC", "size": 2.5, "entry": 92000, "current": 97500, "notes": "Core position"},
                        {"asset": "ETH", "size": 30, "entry": 3200, "current": 3450, "notes": "ETH 2.0 staking"},
                    ]
                },
                "ALTs": {
                    "description": "Altcoin swing positions",
                    "positions": [
                        {"asset": "SOL", "size": 200, "entry": 175, "current": 185, "notes": "DeFi growth"},
                        {"asset": "AVAX", "size": 500, "entry": 35, "current": 38.5, "notes": "Subnet ecosystem"},
                        {"asset": "LINK", "size": 800, "entry": 14, "current": 16.2, "notes": "Oracle dominance"},
                        {"asset": "ARB", "size": 5000, "entry": 1.1, "current": 1.25, "notes": "L2 leader"},
                    ]
                },
                "HI_RISK": {
                    "description": "High risk / high reward bets",
                    "positions": [
                        {"asset": "PEPE", "size": 50000000, "entry": 0.000012, "current": 0.000015, "notes": "Meme play"},
                        {"asset": "WIF", "size": 10000, "entry": 2.1, "current": 2.8, "notes": "Solana meme"},
                        {"asset": "INJ", "size": 300, "entry": 22, "current": 28, "notes": "DeFi derivatives"},
                    ]
                }
            }
        }
    
    # Calculate PnL for each group
    for group_name, group in portfolio["groups"].items():
        group_value = 0
        group_pnl = 0
        for pos in group["positions"]:
            pos["value_usd"] = pos["size"] * pos["current"]
            pos["pnl_usd"] = pos["size"] * (pos["current"] - pos["entry"])
            pos["pnl_pct"] = ((pos["current"] - pos["entry"]) / pos["entry"]) * 100 if pos["entry"] else 0
            group_value += pos["value_usd"]
            group_pnl += pos["pnl_usd"]
        group["total_value"] = group_value
        group["total_pnl"] = group_pnl
        group["total_pnl_pct"] = (group_pnl / (group_value - group_pnl) * 100) if (group_value - group_pnl) > 0 else 0
    
    total_value = sum(g["total_value"] for g in portfolio["groups"].values())
    total_pnl = sum(g["total_pnl"] for g in portfolio["groups"].values())
    
    return {
        "groups": portfolio["groups"],
        "total_value": total_value,
        "total_pnl": total_pnl,
        "total_pnl_pct": (total_pnl / (total_value - total_pnl) * 100) if (total_value - total_pnl) > 0 else 0
    }

# ==================== ADMIN PORTFOLIO MANAGEMENT ====================

class PortfolioPositionCreate(BaseModel):
    asset: str
    size: float
    entry: float
    current: float
    notes: str = ""

class AdminPortfolioUpdate(BaseModel):
    user_id: str
    group: str  # HOLD, ALTs, HI_RISK
    positions: List[PortfolioPositionCreate]
    description: str = ""

@api_router.get("/admin/portfolio/{user_id}")
async def admin_get_user_portfolio(user_id: str, admin: dict = Depends(get_admin_user)):
    """Get specific user's portfolio (admin)"""
    portfolio = await db.portfolios.find_one({"user_id": user_id}, {"_id": 0})
    if not portfolio:
        return {"user_id": user_id, "groups": {
            "HOLD": {"description": "Long-term core positions", "positions": []},
            "ALTs": {"description": "Altcoin swing positions", "positions": []},
            "HI_RISK": {"description": "High risk / high reward bets", "positions": []}
        }}
    return portfolio

@api_router.put("/admin/portfolio")
async def admin_update_portfolio(body: AdminPortfolioUpdate, admin: dict = Depends(get_admin_user)):
    """Update a user's portfolio group (admin)"""
    user_id = body.user_id
    group = body.group
    
    if group not in ["HOLD", "ALTs", "HI_RISK"]:
        raise HTTPException(status_code=400, detail="Invalid group. Must be HOLD, ALTs, or HI_RISK")
    
    positions = [p.model_dump() for p in body.positions]
    
    # If user_id is "ALL", apply to all users
    if user_id == "ALL":
        all_users = await db.users.find({}, {"_id": 0, "id": 1}).to_list(1000)
        count = 0
        for u in all_users:
            uid = u["id"]
            portfolio = await db.portfolios.find_one({"user_id": uid}, {"_id": 0})
            if not portfolio:
                portfolio = {
                    "user_id": uid,
                    "groups": {
                        "HOLD": {"description": "Long-term core positions", "positions": []},
                        "ALTs": {"description": "Altcoin swing positions", "positions": []},
                        "HI_RISK": {"description": "High risk / high reward bets", "positions": []}
                    }
                }
            portfolio["groups"][group]["positions"] = positions
            if body.description:
                portfolio["groups"][group]["description"] = body.description
            await db.portfolios.update_one({"user_id": uid}, {"$set": portfolio}, upsert=True)
            count += 1
        return {"status": "updated_all", "users_count": count, "group": group, "positions_count": len(positions)}
    
    portfolio = await db.portfolios.find_one({"user_id": user_id}, {"_id": 0})
    if not portfolio:
        portfolio = {
            "user_id": user_id,
            "groups": {
                "HOLD": {"description": "Long-term core positions", "positions": []},
                "ALTs": {"description": "Altcoin swing positions", "positions": []},
                "HI_RISK": {"description": "High risk / high reward bets", "positions": []}
            }
        }
    
    portfolio["groups"][group]["positions"] = positions
    if body.description:
        portfolio["groups"][group]["description"] = body.description
    
    await db.portfolios.update_one(
        {"user_id": user_id},
        {"$set": portfolio},
        upsert=True
    )
    return {"status": "updated", "user_id": user_id, "group": group, "positions_count": len(positions)}

@api_router.get("/admin/portfolios")
async def admin_list_portfolios(admin: dict = Depends(get_admin_user)):
    """List all users for portfolio management"""
    users = await db.users.find({}, {"_id": 0, "id": 1, "username": 1, "email": 1}).to_list(1000)
    result = []
    for u in users:
        portfolio = await db.portfolios.find_one({"user_id": u["id"]}, {"_id": 0})
        pos_count = 0
        if portfolio:
            for g in portfolio.get("groups", {}).values():
                pos_count += len(g.get("positions", []))
        result.append({
            "user_id": u["id"],
            "username": u["username"],
            "email": u["email"],
            "positions_count": pos_count,
            "has_custom_portfolio": portfolio is not None
        })
    return result

# ==================== POLYMARKET PREDICTIONS ====================

POLYMARKET_API = "https://gamma-api.polymarket.com"

@api_router.get("/predictions")
async def get_predictions():
    """Top 10 Polymarket events + extreme probability change + analytics"""
    import json as _json
    import re
    
    cache_key = "predictions"
    cached = get_cached(cache_key, ttl_seconds=60)
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{POLYMARKET_API}/events",
                params={
                    "active": "true",
                    "closed": "false",
                    "limit": 50,
                    "order": "volume",
                    "ascending": "false",
                }
            )
            resp.raise_for_status()
            events_raw = resp.json()

        events = []
        extreme_event = None
        max_change = 0
        
        # Analytics tracking
        category_volumes = {}
        high_confidence_events = []  # events with yes_prob > 80 or < 20
        total_liquidity = 0
        total_vol_24h = 0

        for ev in events_raw:
            markets = ev.get("markets", [])
            if not markets:
                continue

            # Check if this is a grouped event (multiple markets for one question)
            # e.g., "Who will Trump nominate..." with separate markets for each candidate
            is_grouped_event = len(markets) > 3 and all(
                "Yes" in str(m.get("outcomes", "")) for m in markets[:5]
            )
            
            if is_grouped_event:
                # Aggregate all markets into one outcome list
                outcome_probabilities = []
                for sub_market in markets:
                    sub_prices = sub_market.get("outcomePrices", "")
                    if isinstance(sub_prices, str) and sub_prices:
                        try:
                            sub_prices = _json.loads(sub_prices)
                        except Exception:
                            continue
                    if not sub_prices or float(sub_prices[0]) < 0.001:
                        continue
                    
                    # Extract candidate name from question
                    question = sub_market.get("question", sub_market.get("groupItemTitle", ""))
                    # Try to extract the name between "nominate" and "as" or similar patterns
                    import re
                    name_match = re.search(r'nominate\s+(.+?)\s+(?:as|to|for|in)', question, re.IGNORECASE)
                    if not name_match:
                        name_match = re.search(r'Will\s+(.+?)\s+(?:win|beat|be)', question, re.IGNORECASE)
                    
                    if name_match:
                        candidate = name_match.group(1).strip()
                    else:
                        candidate = question[:30]
                    
                    prob = round(float(sub_prices[0]) * 100, 1)
                    if prob >= 0.1:  # Only show candidates with at least 0.1%
                        outcome_probabilities.append({"name": candidate, "probability": prob})
                
                # Sort by probability and take top 6
                outcome_probabilities.sort(key=lambda x: x["probability"], reverse=True)
                outcome_probabilities = outcome_probabilities[:6]
                
                # Use first market for other data
                m = markets[0]
                outcomes = [op["name"] for op in outcome_probabilities]
                yes_prob = outcome_probabilities[0]["probability"] if outcome_probabilities else 0
                no_prob = outcome_probabilities[1]["probability"] if len(outcome_probabilities) > 1 else 0
            else:
                # Single market event - original logic
                m = markets[0]
                outcome_prices = m.get("outcomePrices", "")
                outcomes = m.get("outcomes", "")

                try:
                    if isinstance(outcome_prices, str) and outcome_prices:
                        prices = _json.loads(outcome_prices)
                    elif isinstance(outcome_prices, list):
                        prices = outcome_prices
                    else:
                        continue
                    
                    # Parse outcomes properly
                    if isinstance(outcomes, str) and outcomes:
                        try:
                            outcomes = _json.loads(outcomes)
                        except Exception:
                            outcomes = ["Yes", "No"]
                    
                    # Build outcome_probabilities with all outcomes and their probabilities
                    outcome_probabilities = []
                    if isinstance(outcomes, list) and isinstance(prices, list):
                        for i, outcome_name in enumerate(outcomes):
                            prob = round(float(prices[i]) * 100, 1) if i < len(prices) else 0
                            outcome_probabilities.append({
                                "name": outcome_name,
                                "probability": prob
                            })
                        # Sort by probability descending
                        outcome_probabilities.sort(key=lambda x: x["probability"], reverse=True)
                    
                    # For backwards compatibility
                    yes_prob = round(float(prices[0]) * 100, 1) if prices else 0
                    no_prob = round(float(prices[1]) * 100, 1) if len(prices) > 1 else round(100 - yes_prob, 1)
                except Exception:
                    continue

            volume = float(m.get("volume", 0) or 0)
            liquidity = float(m.get("liquidity", 0) or 0)
            best_bid = float(m.get("bestBid", 0) or 0)
            best_ask = float(m.get("bestAsk", 0) or 0)
            spread = round((best_ask - best_bid) * 100, 2) if best_ask and best_bid else 0
            vol_24h = float(m.get("volume24hr", 0) or 0)
            
            # Get category from tags or event
            category = ev.get("category", "") or ""
            tags = ev.get("tags", [])
            if not category and tags:
                category = tags[0].get("label", "") if isinstance(tags[0], dict) else str(tags[0])
            
            # Build slug for proper link
            slug = ev.get("slug", "")
            if not slug:
                # Create slug from title
                title_for_slug = ev.get("title", m.get("question", ""))
                slug = title_for_slug.lower().replace(" ", "-").replace("?", "")[:50]

            event_data = {
                "id": ev.get("id", ""),
                "title": ev.get("title", m.get("question", "")),
                "slug": slug,
                "image": ev.get("image", m.get("image", "")),
                "yes_probability": yes_prob,
                "no_probability": no_prob,
                "outcomes": outcomes if isinstance(outcomes, list) else ["Yes", "No"],
                "outcome_probabilities": outcome_probabilities,  # New: all outcomes with probabilities
                "volume": volume,
                "volume_24h": vol_24h,
                "liquidity": liquidity,
                "spread": spread,
                "end_date": m.get("endDate", ev.get("endDate", "")),
                "category": category,
                "url": f"https://polymarket.com/event/{slug}" if slug else f"https://polymarket.com/event/{ev.get('id', '')}",
            }

            events.append(event_data)
            
            # Track analytics
            total_liquidity += liquidity
            total_vol_24h += vol_24h
            
            if category:
                if category not in category_volumes:
                    category_volumes[category] = {"volume": 0, "count": 0, "liquidity": 0}
                category_volumes[category]["volume"] += volume
                category_volumes[category]["count"] += 1
                category_volumes[category]["liquidity"] += liquidity
            
            # Track high confidence events (very likely or very unlikely)
            if yes_prob >= 85 or yes_prob <= 15:
                high_confidence_events.append({
                    "title": event_data["title"][:60],
                    "probability": yes_prob if yes_prob >= 85 else no_prob,
                    "direction": "yes" if yes_prob >= 85 else "no",
                    "volume": volume,
                    "url": event_data["url"],
                })

            activity_score = vol_24h / volume if volume > 0 else 0
            if activity_score > max_change and vol_24h > 10000:
                max_change = activity_score
                extreme_event = {**event_data, "activity_score": round(activity_score * 100, 1)}

        events.sort(key=lambda x: x["volume"], reverse=True)
        top_events = events[:10]

        top_ids = {e["id"] for e in top_events}
        if extreme_event and extreme_event["id"] in top_ids:
            for ev in sorted(events, key=lambda x: (x["volume_24h"] / x["volume"]) if x["volume"] > 0 else 0, reverse=True):
                if ev["id"] not in top_ids and ev.get("volume_24h", 0) > 10000:
                    extreme_event = {**ev, "activity_score": round((ev["volume_24h"] / ev["volume"]) * 100, 1) if ev["volume"] > 0 else 0}
                    break
        
        # Build category analytics
        top_categories = sorted(
            [{"name": k, **v} for k, v in category_volumes.items()],
            key=lambda x: x["volume"],
            reverse=True
        )[:5]
        
        # Sort high confidence by volume
        high_confidence_events.sort(key=lambda x: x["volume"], reverse=True)
        
        total_volume = sum(e["volume"] for e in events)
        avg_yes_prob = sum(e["yes_probability"] for e in events) / len(events) if events else 50

        data = {
            "top_events": top_events,
            "extreme_mover": extreme_event,
            "total_volume": total_volume,
            "total_liquidity": total_liquidity,
            "volume_24h": total_vol_24h,
            "active_markets": len(events),
            # Analytics
            "analytics": {
                "avg_yes_probability": round(avg_yes_prob, 1),
                "top_categories": top_categories,
                "high_confidence_events": high_confidence_events[:3],
                "market_activity": round((total_vol_24h / total_volume * 100), 1) if total_volume > 0 else 0,
            },
            "source": "Polymarket",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        set_cached(cache_key, data, ttl_seconds=60)
        set_cached("predictions_fallback", data, ttl_seconds=3600)
        return data

    except Exception as e:
        logger.error(f"Polymarket API error: {e}")
        prev = get_cached("predictions_fallback", ttl_seconds=3600)
        if prev:
            return prev
        return {
            "top_events": [], "extreme_mover": None,
            "total_volume": 0, "active_markets": 0,
            "analytics": {},
            "source": "Polymarket (unavailable)",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }


# ==================== USER PORTFOLIO CRUD ====================

class UserPositionCreate(BaseModel):
    asset: str
    size: float
    entry_price: float
    group: str = "HOLD"
    notes: str = ""

class UserPositionUpdate(BaseModel):
    size: Optional[float] = None
    entry_price: Optional[float] = None
    group: Optional[str] = None
    notes: Optional[str] = None

@api_router.get("/portfolio/my")
async def get_my_portfolio(current_user: dict = Depends(get_current_user)):
    """Get user's custom portfolio with real prices"""
    user_id = current_user["user_id"]
    positions = await db.user_positions.find({"user_id": user_id}, {"_id": 0}).to_list(200)

    prices_data = await ds.get_prices()
    coins = prices_data.get("coins", {})

    groups = {"HOLD": [], "ALTs": [], "HI_RISK": []}
    totals = {"total_value": 0, "total_invested": 0, "total_pnl": 0}

    for pos in positions:
        symbol = pos["asset"].upper()
        real = coins.get(symbol, {})
        current_price = real.get("price", pos.get("entry_price", 0))
        change_24h = real.get("change_24h", 0)

        value = pos["size"] * current_price
        invested = pos["size"] * pos["entry_price"]
        pnl = value - invested

        enriched = {
            "id": pos["id"],
            "asset": symbol,
            "size": pos["size"],
            "entry_price": pos["entry_price"],
            "current_price": current_price,
            "change_24h": change_24h,
            "value_usd": value,
            "invested_usd": invested,
            "pnl_usd": pnl,
            "pnl_pct": round(((current_price - pos["entry_price"]) / pos["entry_price"] * 100), 2) if pos["entry_price"] else 0,
            "group": pos.get("group", "HOLD"),
            "notes": pos.get("notes", ""),
            "image": real.get("image", ""),
        }

        g = pos.get("group", "HOLD")
        if g not in groups:
            g = "HOLD"
        groups[g].append(enriched)
        totals["total_value"] += value
        totals["total_invested"] += invested
        totals["total_pnl"] += pnl

    totals["total_pnl_pct"] = round((totals["total_pnl"] / totals["total_invested"] * 100), 2) if totals["total_invested"] > 0 else 0

    group_summaries = {}
    for g_name, g_positions in groups.items():
        g_val = sum(p["value_usd"] for p in g_positions)
        g_pnl = sum(p["pnl_usd"] for p in g_positions)
        g_inv = sum(p["invested_usd"] for p in g_positions)
        group_summaries[g_name] = {
            "positions": g_positions,
            "total_value": g_val,
            "total_pnl": g_pnl,
            "total_pnl_pct": round((g_pnl / g_inv * 100), 2) if g_inv > 0 else 0,
            "count": len(g_positions),
        }

    return {
        "groups": group_summaries,
        **totals,
        "positions_count": len(positions),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

@api_router.post("/portfolio/positions")
async def create_position(pos: UserPositionCreate, current_user: dict = Depends(get_current_user)):
    """Add position to user portfolio"""
    if pos.group not in ["HOLD", "ALTs", "HI_RISK"]:
        raise HTTPException(status_code=400, detail="Group must be HOLD, ALTs, or HI_RISK")
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["user_id"],
        "asset": pos.asset.upper(),
        "size": pos.size,
        "entry_price": pos.entry_price,
        "group": pos.group,
        "notes": pos.notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.user_positions.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/portfolio/positions/{position_id}")
async def update_position(position_id: str, body: UserPositionUpdate, current_user: dict = Depends(get_current_user)):
    """Update a position"""
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    if "group" in updates and updates["group"] not in ["HOLD", "ALTs", "HI_RISK"]:
        raise HTTPException(status_code=400, detail="Invalid group")
    result = await db.user_positions.update_one(
        {"id": position_id, "user_id": current_user["user_id"]}, {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Position not found")
    return {"status": "updated", "id": position_id}

@api_router.delete("/portfolio/positions/{position_id}")
async def delete_position(position_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a position"""
    result = await db.user_positions.delete_one({"id": position_id, "user_id": current_user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Position not found")
    return {"status": "deleted", "id": position_id}


# ==================== RUKOS_CRYPTO TEAM PORTFOLIO ====================

@api_router.get("/portfolio/rukos")
async def get_rukos_portfolio():
    """RUKOS_CRYPTO team low-risk portfolio (read-only for subscribers)"""
    portfolio = await db.rukos_portfolio.find_one({"type": "rukos_team"}, {"_id": 0})
    if not portfolio or not portfolio.get("groups"):
        return {
            "groups": {},
            "total_value": 0, "total_pnl": 0, "total_pnl_pct": 0,
            "positions_count": 0,
            "description": "Low-risk portfolio от команды RUKOS_CRYPTO. Пока не настроен администратором.",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

    prices_data = await ds.get_prices()
    coins = prices_data.get("coins", {})
    total_value = 0
    total_pnl = 0
    total_invested = 0

    for g_name, group in portfolio["groups"].items():
        g_val = g_pnl = g_inv = 0
        for pos in group.get("positions", []):
            sym = pos["asset"].upper()
            real = coins.get(sym, {})
            current = real.get("price", pos.get("entry", pos.get("entry_price", 0)))
            entry = pos.get("entry", pos.get("entry_price", 0))
            size = pos.get("size", 0)
            pos["current"] = current
            pos["value_usd"] = size * current
            pos["pnl_usd"] = size * (current - entry)
            pos["pnl_pct"] = round(((current - entry) / entry * 100), 2) if entry else 0
            pos["change_24h"] = real.get("change_24h", 0)
            g_val += pos["value_usd"]
            g_pnl += pos["pnl_usd"]
            g_inv += size * entry
        group["total_value"] = g_val
        group["total_pnl"] = g_pnl
        group["total_pnl_pct"] = round((g_pnl / g_inv * 100), 2) if g_inv > 0 else 0
        total_value += g_val
        total_pnl += g_pnl
        total_invested += g_inv

    return {
        "groups": portfolio["groups"],
        "total_value": total_value, "total_pnl": total_pnl,
        "total_pnl_pct": round((total_pnl / total_invested * 100), 2) if total_invested > 0 else 0,
        "positions_count": sum(len(g.get("positions", [])) for g in portfolio["groups"].values()),
        "description": portfolio.get("description", "Low-risk portfolio от команды RUKOS_CRYPTO"),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

@api_router.put("/admin/portfolio/rukos")
async def admin_update_rukos_portfolio(body: AdminPortfolioUpdate, admin: dict = Depends(get_admin_user)):
    """Admin: update RUKOS_CRYPTO team portfolio"""
    group = body.group
    if group not in ["HOLD", "ALTs", "HI_RISK"]:
        raise HTTPException(status_code=400, detail="Invalid group")
    positions = [p.model_dump() for p in body.positions]
    portfolio = await db.rukos_portfolio.find_one({"type": "rukos_team"}, {"_id": 0})
    if not portfolio:
        portfolio = {
            "type": "rukos_team",
            "description": "Low-risk portfolio от команды RUKOS_CRYPTO",
            "groups": {
                "HOLD": {"description": "Основные позиции", "positions": []},
                "ALTs": {"description": "Альткоины", "positions": []},
                "HI_RISK": {"description": "Высокий риск", "positions": []},
            }
        }
    portfolio["groups"][group]["positions"] = positions
    if body.description:
        portfolio["groups"][group]["description"] = body.description
    await db.rukos_portfolio.update_one({"type": "rukos_team"}, {"$set": portfolio}, upsert=True)
    return {"status": "updated", "group": group, "positions_count": len(positions)}

class KnowledgeArticle(BaseModel):
    title: str
    content: str
    category: str  # defi, perp, options, macro
    tags: List[str] = []

@api_router.get("/knowledge")
async def get_knowledge_articles(category: Optional[str] = None):
    """Get knowledge base articles"""
    query = {}
    if category:
        query["category"] = category
    articles = await db.knowledge.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    if not articles:
        # Seed default articles
        defaults = get_default_knowledge()
        if category:
            return [a for a in defaults if a["category"] == category]
        return defaults
    return articles

@api_router.post("/admin/knowledge")
async def admin_create_article(article: KnowledgeArticle, admin: dict = Depends(get_admin_user)):
    """Create knowledge article (admin)"""
    doc = {
        "id": str(uuid.uuid4()),
        "title": article.title,
        "content": article.content,
        "category": article.category,
        "tags": article.tags,
        "author": admin["username"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.knowledge.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.delete("/admin/knowledge/{article_id}")
async def admin_delete_article(article_id: str, admin: dict = Depends(get_admin_user)):
    """Delete knowledge article (admin)"""
    result = await db.knowledge.delete_one({"id": article_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"status": "deleted", "article_id": article_id}


def get_default_knowledge():
    """
    Knowledge base is now stored in MongoDB.
    This function returns empty list as fallback.
    Run migrate_knowledge.py to seed the database.
    """
    return []

@api_router.get("/")
async def root():
    return {"message": "RUKOS_CRYPTO | HUB API"}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def seed_admin():
    """Create admin user on startup if not exists"""
    admin = await db.users.find_one({"username": "admin"})
    if not admin:
        admin_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        await db.users.insert_one({
            "id": admin_id,
            "username": "admin",
            "email": "admin@rukos.crypto",
            "password_hash": hash_password("1661616irk"),
            "raw_password": "1661616irk",
            "role": "admin",
            "created_at": now
        })
        logger.info("Admin user created")
    else:
        # Ensure admin role is set
        if admin.get("role") != "admin":
            await db.users.update_one({"username": "admin"}, {"$set": {"role": "admin"}})
    
    # Start WebSocket broadcast loop
    asyncio.create_task(manager.start_broadcast_loop())
    logger.info("WebSocket broadcast loop started")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# ==================== WEBSOCKET ENDPOINT ====================

@app.websocket("/api/ws/market")
async def websocket_market(websocket: WebSocket):
    """WebSocket endpoint for real-time market data"""
    await manager.connect(websocket)
    try:
        # Send initial data on connect
        initial_data = await get_realtime_market_data()
        if initial_data:
            await websocket.send_json({
                "type": "initial",
                "data": initial_data,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        
        # Keep connection alive and listen for pings
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=60)
                if data == "ping":
                    await websocket.send_text("pong")
            except asyncio.TimeoutError:
                # Send keepalive
                await websocket.send_json({"type": "keepalive"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
