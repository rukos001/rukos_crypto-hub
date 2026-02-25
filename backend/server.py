from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import jwt
import bcrypt
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
    direction: str  # "long" or "short"
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

def create_token(user_id: str, username: str) -> str:
    payload = {
        "user_id": user_id,
        "username": username,
        "exp": datetime.now(timezone.utc).timestamp() + 86400 * 7  # 7 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return {"user_id": payload["user_id"], "username": payload["username"]}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user: UserCreate):
    # Check if user exists
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
        "created_at": now
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user.username)
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user_id, username=user.username, email=user.email, created_at=now)
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
        
        # Save conversation to DB
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

# ==================== CRYPTO DATA ROUTES (MOCK) ====================

@api_router.get("/crypto/prices")
async def get_crypto_prices():
    """Mock crypto prices - BTC, ETH, SOL"""
    return {
        "data": [
            {"symbol": "BTC", "name": "Bitcoin", "price": 97542.18, "change_24h": 2.45, "market_cap": 1920000000000, "volume_24h": 45000000000},
            {"symbol": "ETH", "name": "Ethereum", "price": 3456.72, "change_24h": 1.23, "market_cap": 415000000000, "volume_24h": 18000000000},
            {"symbol": "SOL", "name": "Solana", "price": 187.34, "change_24h": -0.87, "market_cap": 86000000000, "volume_24h": 3500000000},
        ],
        "total_market_cap": 3500000000000,
        "btc_dominance": 54.8,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/crypto/etf-flows")
async def get_etf_flows():
    """Mock ETF flows data - SoSoValue style"""
    return {
        "data": [
            {"date": "2025-01-13", "btc_inflow": 425000000, "eth_inflow": 85000000},
            {"date": "2025-01-12", "btc_inflow": -120000000, "eth_inflow": 42000000},
            {"date": "2025-01-11", "btc_inflow": 890000000, "eth_inflow": 156000000},
            {"date": "2025-01-10", "btc_inflow": 234000000, "eth_inflow": -28000000},
            {"date": "2025-01-09", "btc_inflow": -450000000, "eth_inflow": 67000000},
        ],
        "total_btc_aum": 52000000000,
        "total_eth_aum": 8500000000,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/crypto/whale-activity")
async def get_whale_activity():
    """Mock whale activity - Arkham style"""
    return {
        "alerts": [
            {"coin": "BTC", "amount": 1250, "usd_value": 122000000, "from": "Binance", "to": "Unknown Wallet", "time": "5 мин назад", "type": "withdrawal"},
            {"coin": "ETH", "amount": 45000, "usd_value": 155500000, "from": "Unknown", "to": "Coinbase", "time": "12 мин назад", "type": "deposit"},
            {"coin": "SOL", "amount": 850000, "usd_value": 159200000, "from": "Jump Trading", "to": "Unknown", "time": "28 мин назад", "type": "transfer"},
            {"coin": "BTC", "amount": 3500, "usd_value": 341400000, "from": "MicroStrategy", "to": "Cold Wallet", "time": "1 час назад", "type": "accumulation"},
            {"coin": "ETH", "amount": 125000, "usd_value": 432100000, "from": "Ethereum Foundation", "to": "Kraken", "time": "2 часа назад", "type": "potential_sell"},
        ],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/crypto/liquidations")
async def get_liquidations():
    """Mock liquidations data - Coinglass style"""
    return {
        "total_24h": 245000000,
        "long_liquidations": 156000000,
        "short_liquidations": 89000000,
        "largest_single": {"coin": "BTC", "amount": 12500000, "type": "long", "exchange": "Binance"},
        "by_coin": [
            {"coin": "BTC", "total": 145000000, "longs": 95000000, "shorts": 50000000},
            {"coin": "ETH", "total": 65000000, "longs": 40000000, "shorts": 25000000},
            {"coin": "SOL", "total": 35000000, "longs": 21000000, "shorts": 14000000},
        ],
        "near_record": True,
        "record_24h": 1200000000,
        "current_vs_record_percent": 20.4,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

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
