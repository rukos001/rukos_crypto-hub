from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
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
    remaining = base_total
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

# ==================== KNOWLEDGE BASE ====================

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
    """Default knowledge base articles"""
    return [
        {"id": "d1", "title": "What is DeFi?", "content": "Decentralized Finance (DeFi) refers to financial services built on blockchain technology that operate without traditional intermediaries like banks. Key concepts include:\n\n**Liquidity Pools** - Users deposit tokens into smart contracts to enable trading.\n\n**Yield Farming** - Earning rewards by providing liquidity to DeFi protocols.\n\n**Impermanent Loss** - Temporary loss when providing liquidity due to price divergence.\n\n**TVL (Total Value Locked)** - The total amount of assets deposited in DeFi protocols.", "category": "defi", "tags": ["basics", "liquidity", "yield"], "author": "system", "created_at": "2026-01-01T00:00:00Z"},
        {"id": "d2", "title": "AMM vs Order Book", "content": "**Automated Market Makers (AMMs)** use mathematical formulas (x*y=k) to determine prices, while **Order Books** match buy and sell orders directly.\n\nAMMs: Uniswap, Curve, Balancer\nOrder Books: dYdX, Serum\n\nAMMs offer simplicity but can suffer from impermanent loss. Order books offer better price discovery for large trades.", "category": "defi", "tags": ["amm", "trading", "dex"], "author": "system", "created_at": "2026-01-01T00:00:00Z"},
        {"id": "d3", "title": "DeFi Risk Management", "content": "Key risks in DeFi:\n\n1. **Smart Contract Risk** - Bugs or exploits in protocol code\n2. **Oracle Risk** - Price feed manipulation\n3. **Liquidation Risk** - Undercollateralized positions\n4. **Regulatory Risk** - Changing legal landscape\n\nBest practices: diversify across protocols, use audited contracts, monitor positions regularly.", "category": "defi", "tags": ["risk", "security"], "author": "system", "created_at": "2026-01-01T00:00:00Z"},
        {"id": "p1", "title": "Perpetual Futures Basics", "content": "Perpetual futures (perps) are derivative contracts with no expiration date. They track the underlying asset price through a **funding rate** mechanism.\n\n**Funding Rate** - Periodic payments between longs and shorts to keep the contract price close to spot.\n\n**Open Interest** - Total value of outstanding contracts.\n\n**Leverage** - Amplifies both gains and losses. Common: 1x-125x.", "category": "perp", "tags": ["basics", "futures", "leverage"], "author": "system", "created_at": "2026-01-01T00:00:00Z"},
        {"id": "p2", "title": "Funding Rate Strategy", "content": "**Positive Funding** = Longs pay shorts (bullish sentiment)\n**Negative Funding** = Shorts pay longs (bearish sentiment)\n\nStrategies:\n- **Cash & Carry**: Hold spot + short perp to collect funding\n- **Funding Rate Arbitrage**: Exploit rate differences between exchanges\n- **Extreme readings** often precede reversals (>0.1% = crowded trade)", "category": "perp", "tags": ["funding", "strategy", "arbitrage"], "author": "system", "created_at": "2026-01-01T00:00:00Z"},
        {"id": "p3", "title": "Liquidation Mechanics", "content": "Liquidation occurs when your margin balance falls below the maintenance margin.\n\n**Liquidation Price** = Entry Price * (1 - 1/Leverage) for longs\n\nTips:\n- Use isolated margin for risk containment\n- Set stop losses BEFORE liquidation price\n- Monitor funding rates for position cost\n- Never use max leverage", "category": "perp", "tags": ["liquidation", "risk", "leverage"], "author": "system", "created_at": "2026-01-01T00:00:00Z"},
        {"id": "o1", "title": "Options Fundamentals", "content": "Options give the right (not obligation) to buy/sell at a specific price.\n\n**Call** = Right to buy (bullish)\n**Put** = Right to sell (bearish)\n\n**Key Greeks:**\n- Delta: Price sensitivity to underlying\n- Gamma: Rate of delta change\n- Theta: Time decay\n- Vega: Sensitivity to volatility\n- IV (Implied Volatility): Market's expectation of future volatility", "category": "options", "tags": ["basics", "greeks", "calls", "puts"], "author": "system", "created_at": "2026-01-01T00:00:00Z"},
        {"id": "o2", "title": "Options Strategies for Crypto", "content": "Popular strategies:\n\n**Covered Call** - Hold spot + sell call = income generation\n**Protective Put** - Hold spot + buy put = downside protection\n**Straddle** - Buy call + put at same strike = profit from big moves\n**Iron Condor** - Sell OTM call + put, buy further OTM = range-bound profit\n\nDeribit is the primary crypto options exchange (~90% volume).", "category": "options", "tags": ["strategy", "deribit", "income"], "author": "system", "created_at": "2026-01-01T00:00:00Z"},
        {"id": "o3", "title": "Max Pain & Gamma Exposure", "content": "**Max Pain** - The price at which the most options expire worthless. Market makers often push price toward max pain near expiry.\n\n**Gamma Exposure (GEX)** - Measures how much dealers need to hedge. Positive GEX = price suppression (dealers sell rallies, buy dips). Negative GEX = amplified moves.\n\n**Gamma Flip** - Price level where GEX switches from positive to negative.", "category": "options", "tags": ["max-pain", "gamma", "market-makers"], "author": "system", "created_at": "2026-01-01T00:00:00Z"},
        {"id": "m1", "title": "Macro Indicators for Crypto", "content": "Key macro indicators:\n\n**DXY (Dollar Index)** - Strong dollar = bearish crypto. Inverse correlation.\n**US10Y (Treasury Yield)** - Rising yields = tighter conditions = risk-off\n**M2 Money Supply** - Expanding M2 historically correlates with BTC rallies (87-day lag)\n**Fed Funds Rate** - Lower rates = more risk appetite\n**CPI / PCE** - Inflation data drives Fed policy expectations", "category": "macro", "tags": ["dxy", "rates", "m2", "fed"], "author": "system", "created_at": "2026-01-01T00:00:00Z"},
        {"id": "m2", "title": "Global Liquidity & Bitcoin", "content": "Bitcoin closely tracks global M2 money supply with a ~87-day lag.\n\n**When M2 expands**: Capital flows into risk assets including crypto\n**When M2 contracts**: Liquidity drain leads to sell-offs\n\nWatch: Fed balance sheet, ECB TLTRO, BOJ yield curve control, PBOC RRR cuts.\n\nGlobal liquidity is the #1 macro driver of crypto prices.", "category": "macro", "tags": ["liquidity", "m2", "bitcoin", "correlation"], "author": "system", "created_at": "2026-01-01T00:00:00Z"},
        {"id": "m3", "title": "Risk-On vs Risk-Off", "content": "**Risk-On** environment:\n- Stocks rising, VIX low\n- Dollar weakening, yields falling\n- Credit spreads tightening\n- Crypto and alts outperforming\n\n**Risk-Off** environment:\n- Flight to safety (bonds, gold, USD)\n- VIX spiking, equities falling\n- BTC dominance rising\n- Altcoins underperforming\n\nKey signal: watch SPX + DXY correlation with BTC.", "category": "macro", "tags": ["risk", "sentiment", "vix"], "author": "system", "created_at": "2026-01-01T00:00:00Z"},
    ]

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
