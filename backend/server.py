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
    
    token = create_token(db_user["id"], db_user["username"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=db_user["id"],
            username=db_user["username"],
            email=db_user["email"],
            created_at=db_user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    db_user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**db_user)

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
    """Get real crypto prices from CoinGecko"""
    cache_key = "crypto_prices"
    cached = get_cached(cache_key, ttl_seconds=30)
    if cached:
        return cached
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Get coin market data
            response = await client.get(
                f"{COINGECKO_API}/coins/markets",
                params={
                    "vs_currency": "usd",
                    "ids": "bitcoin,ethereum,solana",
                    "order": "market_cap_desc",
                    "sparkline": "false",
                    "price_change_percentage": "24h,7d"
                }
            )
            response.raise_for_status()
            coins = response.json()
            
            # Calculate totals from coins data
            total_market_cap = sum(c.get("market_cap", 0) or 0 for c in coins)
            total_volume = sum(c.get("total_volume", 0) or 0 for c in coins)
            
            # Try to get global data, but don't fail if unavailable
            btc_dominance = 54.5
            eth_dominance = 11.5
            global_market_cap = 3500000000000
            
            try:
                global_response = await client.get(f"{COINGECKO_API}/global", timeout=5.0)
                if global_response.status_code == 200:
                    global_json = global_response.json()
                    if "data" in global_json:
                        global_data = global_json["data"]
                        global_market_cap = global_data.get("total_market_cap", {}).get("usd", global_market_cap)
                        btc_dominance = round(global_data.get("market_cap_percentage", {}).get("btc", btc_dominance), 1)
                        eth_dominance = round(global_data.get("market_cap_percentage", {}).get("eth", eth_dominance), 1)
            except Exception as ge:
                logger.warning(f"Global data unavailable: {ge}")
            
            data = {
                "data": [
                    {
                        "symbol": coin["symbol"].upper(),
                        "name": coin["name"],
                        "price": coin["current_price"],
                        "change_24h": round(coin.get("price_change_percentage_24h", 0) or 0, 2),
                        "change_7d": round(coin.get("price_change_percentage_7d_in_currency", 0) or 0, 2),
                        "market_cap": coin.get("market_cap", 0),
                        "volume_24h": coin.get("total_volume", 0),
                        "high_24h": coin.get("high_24h", 0),
                        "low_24h": coin.get("low_24h", 0),
                        "image": coin.get("image", "")
                    }
                    for coin in coins
                ],
                "total_market_cap": global_market_cap,
                "btc_dominance": btc_dominance,
                "eth_dominance": eth_dominance,
                "total_volume_24h": total_volume,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            set_cached(cache_key, data, ttl_seconds=30)
            return data
            
    except Exception as e:
        logger.error(f"CoinGecko API error: {str(e)}")
        return get_fallback_prices()

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
            
    except httpx.HTTPError as e:
        logger.error(f"CoinGecko API error: {str(e)}")
        raise HTTPException(status_code=503, detail="Price history unavailable")

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
    """Whale activity - simulated Arkham-style data"""
    cache_key = "whale_activity"
    cached = get_cached(cache_key, ttl_seconds=60)
    if cached:
        return cached
    
    # Try to get real whale data from whale-alert or similar
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Get top holders changes from CoinGecko
            response = await client.get(f"{COINGECKO_API}/coins/bitcoin")
            btc_data = response.json()
            
    except Exception:
        pass
    
    # Generate realistic whale alerts
    import random
    random.seed(int(datetime.now().timestamp() / 60))  # Changes every minute
    
    exchanges = ["Binance", "Coinbase", "Kraken", "OKX", "Bybit"]
    entities = ["Unknown Wallet", "Jump Trading", "Cumberland", "Wintermute", "Galaxy Digital", "Alameda Remnant"]
    
    alerts = []
    for i in range(8):
        coin = random.choice(["BTC", "ETH", "SOL"])
        coin_prices = {"BTC": 97000, "ETH": 3400, "SOL": 185}
        
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
    
    # Sort by time (most recent first)
    alerts.sort(key=lambda x: int(x["time"].split()[0]) if x["time"].split()[0].isdigit() else 999)
    
    data = {
        "alerts": alerts,
        "total_24h_volume": sum(a["usd_value"] for a in alerts) * 12,  # Extrapolate
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

@api_router.get("/analytics/market-core")
async def market_core():
    """Macro panel data"""
    return get_market_core_data()

@api_router.get("/analytics/derivatives")
async def derivatives(asset: str = "all"):
    """Derivatives data for BTC, ETH, SOL or all"""
    return get_derivatives_data(asset)

@api_router.get("/analytics/etf-intelligence")
async def etf_intelligence():
    """Extended ETF flow intelligence"""
    return get_etf_intelligence()

@api_router.get("/analytics/onchain")
async def onchain(chain: str = "btc"):
    """Onchain war room data for BTC, ETH, or SOL"""
    return get_onchain_data(chain)

@api_router.get("/analytics/altseason")
async def altseason():
    """Altseason monitor"""
    return get_altseason_data()

@api_router.get("/analytics/risk-engine")
async def risk_engine():
    """Risk assessment engine"""
    return get_risk_engine()

@api_router.get("/analytics/options")
async def options():
    """Options intelligence"""
    return get_options_data()

@api_router.get("/analytics/sentiment")
async def sentiment():
    """Social & sentiment data"""
    return get_sentiment_data()

@api_router.get("/analytics/capital-flows")
async def capital_flows():
    """Capital flow map"""
    return get_capital_flows()

@api_router.get("/analytics/ai-signals")
async def ai_signals():
    """AI signal panel"""
    return get_ai_signals()

@api_router.get("/analytics/portfolio")
async def portfolio(current_user: dict = Depends(get_current_user)):
    """User portfolio data"""
    return get_portfolio_data(current_user["user_id"])

@api_router.get("/analytics/war-mode")
async def war_mode():
    """War mode alerts"""
    return get_war_mode_alerts()

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
