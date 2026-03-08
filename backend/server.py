from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
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
import socketio
import httpx
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'anywork_secret_key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7

# Email Config (MOCKED - set RESEND_API_KEY to enable real emails)
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@anywork.co.uk')
EMAIL_ENABLED = bool(RESEND_API_KEY)

# Socket.IO setup
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

# Create the main FastAPI app
fastapi_app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# AI Face Verification Config
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
FACE_MATCH_CONFIDENCE_THRESHOLD = 80  # Auto-approve if confidence >= 80%

# ==================== AI FACE VERIFICATION SERVICE ====================

async def compare_faces_with_ai(id_photo_base64: str, selfie_base64: str) -> dict:
    """
    Use AI vision to compare the face in ID photo with the selfie.
    Returns: {"match": bool, "confidence": int, "reason": str, "auto_approved": bool}
    """
    if not EMERGENT_LLM_KEY:
        logger.warning("[FACE VERIFICATION] No EMERGENT_LLM_KEY configured, skipping AI verification")
        return {
            "match": None,
            "confidence": 0,
            "reason": "AI verification not configured",
            "auto_approved": False
        }
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        
        # Initialize AI chat with vision capabilities
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"face_verify_{uuid.uuid4().hex[:8]}",
            system_message="""You are an expert ID verification system. Your task is to compare two photos:
1. A photo ID (passport, driving license, or national ID card)
2. A selfie of the person

Analyze both images carefully and determine if they show the SAME person.

IMPORTANT: Focus on facial features like:
- Face shape and structure
- Eye shape and spacing
- Nose shape
- Mouth shape
- Overall facial proportions

Consider that:
- The ID photo may be older
- Lighting and angles may differ
- Hair style/color may have changed
- Person may have aged slightly

Respond ONLY in this exact JSON format:
{
  "match": true/false,
  "confidence": 0-100,
  "reason": "Brief explanation of your decision"
}

Be strict but fair. If you cannot clearly see faces in either image, indicate low confidence."""
        ).with_model("openai", "gpt-5.2")
        
        # Strip data URL prefix if present
        def clean_base64(img_b64):
            if ',' in img_b64:
                return img_b64.split(',')[1]
            return img_b64
        
        id_clean = clean_base64(id_photo_base64)
        selfie_clean = clean_base64(selfie_base64)
        
        # Create image contents
        id_image = ImageContent(image_base64=id_clean)
        selfie_image = ImageContent(image_base64=selfie_clean)
        
        # Create message with both images
        user_message = UserMessage(
            text="Compare these two images. The first image is a photo ID document showing a person's face. The second image is a selfie. Determine if they show the same person.",
            file_contents=[id_image, selfie_image]
        )
        
        # Get AI response
        response = await chat.send_message(user_message)
        logger.info(f"[FACE VERIFICATION] AI Response: {response}")
        
        # Parse the JSON response
        import json
        import re
        
        # Extract JSON from response (handle markdown code blocks)
        json_match = re.search(r'\{[^{}]*\}', response, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            match = result.get("match", False)
            confidence = int(result.get("confidence", 0))
            reason = result.get("reason", "No reason provided")
            
            # Auto-approve if high confidence match
            auto_approved = match and confidence >= FACE_MATCH_CONFIDENCE_THRESHOLD
            
            return {
                "match": match,
                "confidence": confidence,
                "reason": reason,
                "auto_approved": auto_approved
            }
        else:
            logger.error(f"[FACE VERIFICATION] Could not parse AI response: {response}")
            return {
                "match": None,
                "confidence": 0,
                "reason": "Could not parse AI response",
                "auto_approved": False
            }
            
    except Exception as e:
        logger.error(f"[FACE VERIFICATION] Error: {str(e)}")
        return {
            "match": None,
            "confidence": 0,
            "reason": f"Error during verification: {str(e)}",
            "auto_approved": False
        }

# ==================== EMAIL SERVICE (MOCKED) ====================

async def send_email(to_email: str, subject: str, html_content: str) -> dict:
    """
    Send email using Resend API or mock if not configured.
    Returns dict with status and details.
    """
    if EMAIL_ENABLED:
        try:
            import resend
            resend.api_key = RESEND_API_KEY
            params = {
                "from": SENDER_EMAIL,
                "to": [to_email],
                "subject": subject,
                "html": html_content
            }
            email = await asyncio.to_thread(resend.Emails.send, params)
            logger.info(f"[EMAIL SENT] To: {to_email}, Subject: {subject}")
            return {"status": "sent", "email_id": email.get("id")}
        except Exception as e:
            logger.error(f"[EMAIL ERROR] Failed to send to {to_email}: {str(e)}")
            return {"status": "error", "error": str(e)}
    else:
        # MOCKED - Log what would be sent
        logger.info(f"[EMAIL MOCKED] To: {to_email}")
        logger.info(f"[EMAIL MOCKED] Subject: {subject}")
        logger.info(f"[EMAIL MOCKED] Content preview: {html_content[:200]}...")
        return {"status": "mocked", "message": "Email logged (Resend not configured)"}

def get_booking_confirmation_email(booking: dict, helper_name: str, customer_name: str) -> str:
    """Generate HTML email for booking confirmation"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0052CC; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">AnyWork</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #0F172A;">Booking Confirmed!</h2>
            <p style="color: #64748B;">Hi {customer_name},</p>
            <p style="color: #64748B;">Your booking has been confirmed. Here are the details:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Service:</strong> {booking.get('service_type', 'Service').replace('-', ' ').title()}</p>
                <p><strong>Helper:</strong> {helper_name}</p>
                <p><strong>Date:</strong> {booking.get('date', 'TBC')}</p>
                <p><strong>Time:</strong> {booking.get('time', 'TBC')}</p>
                <p><strong>Duration:</strong> {booking.get('duration_hours', 0)} hours</p>
                <p><strong>Total:</strong> £{booking.get('total_amount', 0):.2f}</p>
            </div>
            
            <p style="color: #64748B;">Your payment is held securely until the job is completed.</p>
            
            <a href="https://anywork.co.uk/dashboard" style="display: inline-block; background: #0052CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">View Booking</a>
        </div>
        <div style="padding: 20px; text-align: center; color: #94A3B8; font-size: 12px;">
            <p>© 2026 AnyWork Ltd. All rights reserved.</p>
        </div>
    </body>
    </html>
    """

def get_payment_released_email(helper_name: str, amount: float, service_type: str) -> str:
    """Generate HTML email for payment released to helper"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #10B981; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">AnyWork</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #0F172A;">Payment Released! 🎉</h2>
            <p style="color: #64748B;">Hi {helper_name},</p>
            <p style="color: #64748B;">Great news! Your payment has been released.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="font-size: 32px; color: #10B981; font-weight: bold; margin: 0;">£{amount:.2f}</p>
                <p style="color: #64748B; margin-top: 10px;">For: {service_type.replace('-', ' ').title()}</p>
            </div>
            
            <p style="color: #64748B;">The funds will be transferred to your bank account within 1-2 business days.</p>
            
            <a href="https://anywork.co.uk/dashboard" style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">View Earnings</a>
        </div>
        <div style="padding: 20px; text-align: center; color: #94A3B8; font-size: 12px;">
            <p>© 2026 AnyWork Ltd. All rights reserved.</p>
        </div>
    </body>
    </html>
    """

def get_new_booking_helper_email(helper_name: str, customer_name: str, booking: dict) -> str:
    """Generate HTML email for helper when they get a new booking"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0052CC; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">AnyWork</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #0F172A;">New Booking Request!</h2>
            <p style="color: #64748B;">Hi {helper_name},</p>
            <p style="color: #64748B;">You have a new booking from {customer_name}!</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Service:</strong> {booking.get('service_type', 'Service').replace('-', ' ').title()}</p>
                <p><strong>Customer:</strong> {customer_name}</p>
                <p><strong>Date:</strong> {booking.get('date', 'TBC')}</p>
                <p><strong>Time:</strong> {booking.get('time', 'TBC')}</p>
                <p><strong>Duration:</strong> {booking.get('duration_hours', 0)} hours</p>
                <p><strong>You'll earn:</strong> £{(booking.get('total_amount', 0) - booking.get('platform_fee', 0)):.2f}</p>
            </div>
            
            <a href="https://anywork.co.uk/messages" style="display: inline-block; background: #0052CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Contact Customer</a>
        </div>
        <div style="padding: 20px; text-align: center; color: #94A3B8; font-size: 12px;">
            <p>© 2026 AnyWork Ltd. All rights reserved.</p>
        </div>
    </body>
    </html>
    """

# ==================== MODELS ====================

class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: str = "customer"  # customer, helper, admin

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    role: str = "customer"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    phone: Optional[str] = None
    role: str = "customer"
    picture: Optional[str] = None
    created_at: datetime
    is_helper: bool = False
    verification_status: Optional[str] = None  # unverified, pending, verified, rejected
    is_verified: bool = False

class HelperProfileCreate(BaseModel):
    bio: str
    categories: List[str]
    hourly_rate: float
    fixed_rate: Optional[float] = None
    postcode: str
    availability: Dict[str, Any] = {}
    verified_id: bool = False
    insured: bool = False

class HelperProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    helper_id: str
    user_id: str
    bio: str
    categories: List[str]
    hourly_rate: float
    fixed_rate: Optional[float] = None
    postcode: str
    availability: Dict[str, Any] = {}
    verified_id: bool = False
    insured: bool = False
    rating: float = 0.0
    total_reviews: int = 0
    reliability_score: float = 100.0
    jobs_completed: int = 0
    created_at: datetime

class JobCreate(BaseModel):
    title: str
    description: str
    category: str
    location_type: str  # home, workplace, other
    postcode: str
    address: Optional[str] = None
    date_needed: str
    time_needed: str
    duration_hours: float
    budget_type: str  # hourly, fixed
    budget_amount: float
    photos: List[str] = []

class Job(BaseModel):
    model_config = ConfigDict(extra="ignore")
    job_id: str
    user_id: str
    user_name: str
    title: str
    description: str
    category: str
    location_type: str
    postcode: str
    address: Optional[str] = None
    date_needed: str
    time_needed: str
    duration_hours: float
    budget_type: str
    budget_amount: float
    photos: List[str] = []
    status: str = "open"  # open, in_progress, completed, cancelled
    created_at: datetime

class BookingCreate(BaseModel):
    job_id: Optional[str] = None
    helper_id: str
    service_type: str
    date: str
    time: str
    duration_hours: float
    total_amount: float
    platform_fee: float = 0  # Default to 0 since we don't process payments
    notes: Optional[str] = None
    preferred_payment: Optional[str] = "cash"  # cash or bank_transfer
    status: Optional[str] = "pending"

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    booking_id: str
    customer_id: str
    helper_id: str
    job_id: Optional[str] = None
    service_type: str
    date: str
    time: str
    duration_hours: float
    total_amount: float
    platform_fee: float
    notes: Optional[str] = None
    status: str = "pending"  # pending, confirmed, completed, cancelled
    payment_status: str = "unpaid"
    created_at: datetime

class ReviewCreate(BaseModel):
    booking_id: str
    helper_id: str
    rating: int
    comment: str

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    review_id: str
    booking_id: str
    reviewer_id: str
    reviewer_name: str
    helper_id: str
    rating: int
    comment: str
    created_at: datetime

class MessageCreate(BaseModel):
    conversation_id: str
    content: str

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str
    conversation_id: str
    sender_id: str
    sender_name: str
    content: str
    created_at: datetime

class CheckoutRequest(BaseModel):
    booking_id: str
    origin_url: str

class PayoutRequest(BaseModel):
    transaction_id: str
    
class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    transaction_id: str
    booking_id: str
    customer_id: str
    helper_id: str
    helper_user_id: str
    amount: float
    platform_fee: float
    helper_amount: float  # Amount to be paid to helper
    currency: str = "gbp"
    payment_status: str = "pending"  # pending, paid, held, released, refunded
    payout_status: str = "pending"  # pending, processing, completed, failed
    session_id: Optional[str] = None
    payout_date: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str) -> str:
    expiry = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    payload = {"user_id": user_id, "exp": expiry}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("user_id")
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

async def get_current_user(request: Request) -> User:
    # Check cookie first
    session_token = request.cookies.get("session_token")
    if session_token:
        session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if session:
            expires_at = session.get("expires_at")
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
                if user:
                    return User(**user)
    
    # Check Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        user_id = decode_jwt_token(token)
        if user_id:
            user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
            if user:
                return User(**user)
    
    raise HTTPException(status_code=401, detail="Not authenticated")

async def get_optional_user(request: Request) -> Optional[User]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(data: UserCreate):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": data.email,
        "name": data.name,
        "phone": data.phone,
        "role": data.role,
        "password_hash": hash_password(data.password),
        "picture": None,
        "is_helper": data.role == "helper",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_jwt_token(user_id)
    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    
    return {"token": token, "user": user_doc}

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user["user_id"])
    user.pop("password_hash", None)
    
    return {"token": token, "user": user}

# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
@api_router.post("/auth/session")
async def process_google_session(request: Request):
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        google_data = response.json()
    
    email = google_data.get("email")
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": google_data.get("name", existing_user.get("name")),
                "picture": google_data.get("picture")
            }}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": google_data.get("name", ""),
            "picture": google_data.get("picture"),
            "phone": None,
            "role": "customer",
            "is_helper": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    session_token = google_data.get("session_token")
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    
    response = JSONResponse(content={"user": user})
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    return response

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("session_token", path="/")
    return response

# ==================== HELPER ROUTES ====================

@api_router.post("/helpers/profile")
async def create_helper_profile(data: HelperProfileCreate, user: User = Depends(get_current_user)):
    existing = await db.helper_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Helper profile already exists")
    
    helper_id = f"helper_{uuid.uuid4().hex[:12]}"
    profile_doc = {
        "helper_id": helper_id,
        "user_id": user.user_id,
        **data.model_dump(),
        "rating": 0.0,
        "total_reviews": 0,
        "reliability_score": 100.0,
        "jobs_completed": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.helper_profiles.insert_one(profile_doc)
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"is_helper": True, "role": "helper"}}
    )
    
    profile_doc.pop("_id", None)
    return profile_doc

@api_router.put("/helpers/profile")
async def update_helper_profile(data: HelperProfileCreate, user: User = Depends(get_current_user)):
    result = await db.helper_profiles.update_one(
        {"user_id": user.user_id},
        {"$set": data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile = await db.helper_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    return profile

@api_router.get("/helpers")
async def list_helpers(
    category: Optional[str] = None,
    postcode: Optional[str] = None,
    min_rating: Optional[float] = None,
    verified_only: bool = False,
    insured_only: bool = False,
    available_now: bool = False,
    skip: int = 0,
    limit: int = 20
):
    query = {}
    if category:
        query["categories"] = {"$in": [category]}
    if postcode:
        query["postcode"] = {"$regex": f"^{postcode[:3]}", "$options": "i"}
    if min_rating:
        query["rating"] = {"$gte": min_rating}
    if verified_only:
        query["verified_id"] = True
    if insured_only:
        query["insured"] = True
    
    # Use aggregation pipeline to join helpers with users in a single query (fixes N+1)
    pipeline = [
        {"$match": query},
        {"$skip": skip},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "users",
                "localField": "user_id",
                "foreignField": "user_id",
                "as": "user_data"
            }
        },
        {"$unwind": {"path": "$user_data", "preserveNullAndEmptyArrays": True}},
        {
            "$addFields": {
                "user_name": {"$ifNull": ["$user_data.name", ""]},
                "user_picture": "$user_data.picture"
            }
        },
        {"$project": {"user_data": 0, "_id": 0}}
    ]
    
    helpers = await db.helper_profiles.aggregate(pipeline).to_list(limit)
    total = await db.helper_profiles.count_documents(query)
    return {"helpers": helpers, "total": total}

@api_router.get("/helpers/featured")
async def get_featured_helpers(limit: int = 6):
    """Get top-rated featured helpers for homepage"""
    pipeline = [
        {"$match": {"rating": {"$gte": 4.5}, "total_reviews": {"$gte": 5}}},
        {"$sort": {"rating": -1, "total_reviews": -1}},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "users",
                "localField": "user_id",
                "foreignField": "user_id",
                "as": "user_data"
            }
        },
        {"$unwind": {"path": "$user_data", "preserveNullAndEmptyArrays": True}},
        {
            "$addFields": {
                "user_name": {"$ifNull": ["$user_data.name", ""]},
                "user_picture": "$user_data.picture"
            }
        },
        {"$project": {"user_data": 0, "_id": 0}}
    ]
    
    helpers = await db.helper_profiles.aggregate(pipeline).to_list(limit)
    
    # If not enough high-rated helpers, get any helpers
    if len(helpers) < limit:
        additional = await db.helper_profiles.aggregate([
            {"$match": {"helper_id": {"$nin": [h["helper_id"] for h in helpers]}}},
            {"$sort": {"jobs_completed": -1}},
            {"$limit": limit - len(helpers)},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "user_id",
                    "as": "user_data"
                }
            },
            {"$unwind": {"path": "$user_data", "preserveNullAndEmptyArrays": True}},
            {
                "$addFields": {
                    "user_name": {"$ifNull": ["$user_data.name", ""]},
                    "user_picture": "$user_data.picture"
                }
            },
            {"$project": {"user_data": 0, "_id": 0}}
        ]).to_list(limit - len(helpers))
        helpers.extend(additional)
    
    return {"helpers": helpers}

@api_router.get("/helpers/{helper_id}")
async def get_helper(helper_id: str):
    helper = await db.helper_profiles.find_one({"helper_id": helper_id}, {"_id": 0})
    if not helper:
        raise HTTPException(status_code=404, detail="Helper not found")
    
    user = await db.users.find_one({"user_id": helper["user_id"]}, {"_id": 0, "password_hash": 0})
    if user:
        helper["user_name"] = user.get("name", "")
        helper["user_picture"] = user.get("picture")
        helper["user_email"] = user.get("email")
    
    reviews = await db.reviews.find({"helper_id": helper_id}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    helper["recent_reviews"] = reviews
    
    return helper

@api_router.get("/helpers/me/profile")
async def get_my_helper_profile(user: User = Depends(get_current_user)):
    profile = await db.helper_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="No helper profile found")
    return profile

# ==================== JOB ROUTES ====================

@api_router.post("/jobs")
async def create_job(data: JobCreate, user: User = Depends(get_current_user)):
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    job_doc = {
        "job_id": job_id,
        "user_id": user.user_id,
        "user_name": user.name,
        **data.model_dump(),
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.jobs.insert_one(job_doc)
    job_doc.pop("_id", None)
    return job_doc

@api_router.get("/jobs")
async def list_jobs(
    category: Optional[str] = None,
    postcode: Optional[str] = None,
    status: str = "open",
    skip: int = 0,
    limit: int = 20
):
    query = {"status": status}
    if category:
        query["category"] = category
    if postcode:
        query["postcode"] = {"$regex": f"^{postcode[:3]}", "$options": "i"}
    
    jobs = await db.jobs.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.jobs.count_documents(query)
    return {"jobs": jobs, "total": total}

@api_router.get("/jobs/{job_id}")
async def get_job(job_id: str):
    job = await db.jobs.find_one({"job_id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@api_router.get("/jobs/user/my-jobs")
async def get_my_jobs(user: User = Depends(get_current_user)):
    jobs = await db.jobs.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"jobs": jobs}

# ==================== BOOKING ROUTES ====================

@api_router.post("/bookings")
async def create_booking(data: BookingCreate, user: User = Depends(get_current_user)):
    booking_id = f"booking_{uuid.uuid4().hex[:12]}"
    booking_doc = {
        "booking_id": booking_id,
        "customer_id": user.user_id,
        **data.model_dump(),
        "status": "pending",
        "payment_status": "unpaid",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bookings.insert_one(booking_doc)
    booking_doc.pop("_id", None)
    
    # Send notification to helper about new booking request
    helper_profile = await db.helper_profiles.find_one({"helper_id": data.helper_id}, {"_id": 0})
    if helper_profile:
        helper_user = await db.users.find_one({"user_id": helper_profile["user_id"]}, {"_id": 0})
        if helper_user:
            email_html = get_new_booking_helper_email(
                helper_user.get("name", "Helper"),
                user.name,
                booking_doc
            )
            await send_email(helper_user.get("email"), "New Booking Request - AnyWork 📋", email_html)
            
            # Create in-app notification
            await db.notifications.insert_one({
                "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
                "user_id": helper_profile["user_id"],
                "type": "new_booking",
                "title": "New Booking Request",
                "message": f"{user.name} wants to book your {data.service_type.replace('-', ' ')} service for {data.date}",
                "data": {"booking_id": booking_id},
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    
    return booking_doc

@api_router.get("/bookings")
async def list_bookings(user: User = Depends(get_current_user)):
    # Get bookings where user is customer or helper
    helper_profile = await db.helper_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    
    query = {"$or": [{"customer_id": user.user_id}]}
    if helper_profile:
        query["$or"].append({"helper_id": helper_profile["helper_id"]})
    
    # Use aggregation pipeline to join bookings with helpers and users in a single query (fixes N+1)
    pipeline = [
        {"$match": query},
        {"$sort": {"created_at": -1}},
        {"$limit": 100},
        # Lookup helper profile
        {
            "$lookup": {
                "from": "helper_profiles",
                "localField": "helper_id",
                "foreignField": "helper_id",
                "as": "helper_data"
            }
        },
        {"$unwind": {"path": "$helper_data", "preserveNullAndEmptyArrays": True}},
        # Lookup helper user info
        {
            "$lookup": {
                "from": "users",
                "localField": "helper_data.user_id",
                "foreignField": "user_id",
                "as": "helper_user"
            }
        },
        {"$unwind": {"path": "$helper_user", "preserveNullAndEmptyArrays": True}},
        # Lookup customer info
        {
            "$lookup": {
                "from": "users",
                "localField": "customer_id",
                "foreignField": "user_id",
                "as": "customer_data"
            }
        },
        {"$unwind": {"path": "$customer_data", "preserveNullAndEmptyArrays": True}},
        # Add enriched fields
        {
            "$addFields": {
                "helper_name": {"$ifNull": ["$helper_user.name", ""]},
                "helper_picture": "$helper_user.picture",
                "customer_name": {"$ifNull": ["$customer_data.name", ""]}
            }
        },
        # Remove temporary lookup fields
        {"$project": {"helper_data": 0, "helper_user": 0, "customer_data": 0, "_id": 0}}
    ]
    
    bookings = await db.bookings.aggregate(pipeline).to_list(100)
    return {"bookings": bookings}

@api_router.get("/bookings/helper")
async def get_helper_bookings(user: User = Depends(get_current_user)):
    """Get all bookings where the current user is the helper"""
    helper_profile = await db.helper_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    if not helper_profile:
        return {"bookings": []}
    
    pipeline = [
        {"$match": {"helper_id": helper_profile["helper_id"]}},
        {"$sort": {"created_at": -1}},
        {"$limit": 100},
        # Lookup customer info
        {
            "$lookup": {
                "from": "users",
                "localField": "customer_id",
                "foreignField": "user_id",
                "as": "customer_data"
            }
        },
        {"$unwind": {"path": "$customer_data", "preserveNullAndEmptyArrays": True}},
        {
            "$addFields": {
                "customer_name": {"$ifNull": ["$customer_data.name", "Customer"]},
                "customer_email": "$customer_data.email"
            }
        },
        {"$project": {"customer_data": 0, "_id": 0}}
    ]
    
    bookings = await db.bookings.aggregate(pipeline).to_list(100)
    return {"bookings": bookings}

@api_router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str, user: User = Depends(get_current_user)):
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

class BookingStatusUpdate(BaseModel):
    status: str

@api_router.put("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, data: BookingStatusUpdate, user: User = Depends(get_current_user)):
    """Update booking status - helpers can accept/decline/complete, customers can cancel"""
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user is authorized to update this booking
    helper_profile = await db.helper_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    is_helper = helper_profile and helper_profile.get("helper_id") == booking.get("helper_id")
    is_customer = booking.get("customer_id") == user.user_id
    
    if not is_helper and not is_customer:
        raise HTTPException(status_code=403, detail="Not authorized to update this booking")
    
    # Validate status transition
    valid_statuses = ['pending', 'confirmed', 'declined', 'completed', 'cancelled']
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    result = await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {"status": data.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Send notification emails
    if data.status == 'confirmed':
        customer = await db.users.find_one({"user_id": booking["customer_id"]}, {"_id": 0})
        helper_user = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
        if customer:
            email_html = f"""
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #10B981; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">AnyWork</h1>
                </div>
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2 style="color: #0F172A;">Booking Confirmed! ✅</h2>
                    <p style="color: #64748B;">Hi {customer.get('name', 'Customer')},</p>
                    <p style="color: #64748B;">Great news! {helper_user.get('name', 'Your helper')} has accepted your booking.</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Service:</strong> {booking.get('service_type', 'Service').replace('-', ' ').title()}</p>
                        <p><strong>Date:</strong> {booking.get('date', 'TBC')}</p>
                        <p><strong>Time:</strong> {booking.get('time', 'TBC')}</p>
                        <p><strong>Estimated Total:</strong> £{booking.get('total_amount', 0)}</p>
                        <p><strong>Payment Method:</strong> {booking.get('preferred_payment', 'cash').replace('_', ' ').title()}</p>
                    </div>
                    
                    <p style="color: #64748B;">Please arrange payment directly with {helper_user.get('name', 'your helper')}.</p>
                    
                    <a href="https://anywork.co.uk/messages" style="display: inline-block; background: #0052CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Message Helper</a>
                </div>
            </body>
            </html>
            """
            await send_email(customer.get('email'), "Booking Confirmed - AnyWork ✅", email_html)
            
            # Create notification
            await db.notifications.insert_one({
                "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
                "user_id": booking["customer_id"],
                "type": "booking_confirmed",
                "title": "Booking Confirmed!",
                "message": f"{helper_user.get('name', 'Helper')} accepted your booking for {booking.get('date')}",
                "data": {"booking_id": booking_id},
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    
    updated_booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    return updated_booking

# ==================== REVIEW ROUTES ====================

@api_router.post("/reviews")
async def create_review(data: ReviewCreate, user: User = Depends(get_current_user)):
    review_id = f"review_{uuid.uuid4().hex[:12]}"
    review_doc = {
        "review_id": review_id,
        "reviewer_id": user.user_id,
        "reviewer_name": user.name,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reviews.insert_one(review_doc)
    
    # Use aggregation to calculate average rating efficiently (fixes unbounded query)
    pipeline = [
        {"$match": {"helper_id": data.helper_id}},
        {"$group": {
            "_id": None,
            "avg_rating": {"$avg": "$rating"},
            "total_reviews": {"$sum": 1}
        }}
    ]
    result = await db.reviews.aggregate(pipeline).to_list(1)
    
    if result:
        avg_rating = round(result[0]["avg_rating"], 1)
        total_reviews = result[0]["total_reviews"]
        await db.helper_profiles.update_one(
            {"helper_id": data.helper_id},
            {"$set": {"rating": avg_rating, "total_reviews": total_reviews}}
        )
    
    review_doc.pop("_id", None)
    return review_doc

@api_router.get("/reviews/helper/{helper_id}")
async def get_helper_reviews(helper_id: str, skip: int = 0, limit: int = 20):
    reviews = await db.reviews.find({"helper_id": helper_id}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.reviews.count_documents({"helper_id": helper_id})
    return {"reviews": reviews, "total": total}

# ==================== REPORT ROUTES ====================

class ReportCreate(BaseModel):
    reported_user_id: str
    reason: str
    details: Optional[str] = None

@api_router.post("/reports")
async def create_report(data: ReportCreate, user: User = Depends(get_current_user)):
    """Report a user for inappropriate behavior"""
    report_id = f"report_{uuid.uuid4().hex[:12]}"
    report_doc = {
        "report_id": report_id,
        "reporter_id": user.user_id,
        "reporter_name": user.name,
        "reported_user_id": data.reported_user_id,
        "reason": data.reason,
        "details": data.details,
        "status": "pending",  # pending, reviewed, resolved, dismissed
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reports.insert_one(report_doc)
    report_doc.pop("_id", None)
    return report_doc

# ==================== MESSAGE ROUTES ====================

@api_router.get("/conversations")
async def list_conversations(user: User = Depends(get_current_user)):
    """List user's conversations with optimized aggregation pipeline"""
    pipeline = [
        # Match conversations where user is a participant
        {"$match": {"participants": user.user_id}},
        
        # Sort by most recent
        {"$sort": {"updated_at": -1}},
        
        # Limit results
        {"$limit": 100},
        
        # Lookup last message for each conversation
        {"$lookup": {
            "from": "messages",
            "let": {"conv_id": "$conversation_id"},
            "pipeline": [
                {"$match": {"$expr": {"$eq": ["$conversation_id", "$$conv_id"]}}},
                {"$sort": {"created_at": -1}},
                {"$limit": 1},
                {"$project": {"_id": 0}}
            ],
            "as": "last_message_arr"
        }},
        
        # Lookup participant user data
        {"$lookup": {
            "from": "users",
            "localField": "participants",
            "foreignField": "user_id",
            "as": "participant_data"
        }},
        
        # Project final shape
        {"$project": {
            "_id": 0,
            "conversation_id": 1,
            "participants": 1,
            "booking_id": 1,
            "created_at": 1,
            "updated_at": 1,
            "last_message": {"$arrayElemAt": ["$last_message_arr", 0]},
            "participant_data": {
                "$map": {
                    "input": "$participant_data",
                    "as": "p",
                    "in": {
                        "user_id": "$$p.user_id",
                        "name": "$$p.name",
                        "email": "$$p.email",
                        "picture": "$$p.picture"
                    }
                }
            }
        }}
    ]
    
    conversations = await db.conversations.aggregate(pipeline).to_list(100)
    
    # Extract other_user for each conversation
    for conv in conversations:
        participant_data = conv.pop("participant_data", [])
        other_user = next((p for p in participant_data if p["user_id"] != user.user_id), None)
        conv["other_user"] = other_user
    
    return {"conversations": conversations}

@api_router.post("/conversations")
async def create_conversation(other_user_id: str, booking_id: Optional[str] = None, user: User = Depends(get_current_user)):
    # Check if conversation exists
    existing = await db.conversations.find_one({
        "participants": {"$all": [user.user_id, other_user_id]}
    }, {"_id": 0})
    
    if existing:
        return existing
    
    conversation_id = f"conv_{uuid.uuid4().hex[:12]}"
    conv_doc = {
        "conversation_id": conversation_id,
        "participants": [user.user_id, other_user_id],
        "booking_id": booking_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.conversations.insert_one(conv_doc)
    conv_doc.pop("_id", None)
    return conv_doc

@api_router.get("/messages/{conversation_id}")
async def get_messages(conversation_id: str, user: User = Depends(get_current_user)):
    conv = await db.conversations.find_one({"conversation_id": conversation_id}, {"_id": 0})
    if not conv or user.user_id not in conv.get("participants", []):
        raise HTTPException(status_code=403, detail="Access denied")
    
    messages = await db.messages.find(
        {"conversation_id": conversation_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    return {"messages": messages, "conversation": conv}

@api_router.post("/messages")
async def send_message(data: MessageCreate, user: User = Depends(get_current_user)):
    conv = await db.conversations.find_one({"conversation_id": data.conversation_id}, {"_id": 0})
    if not conv or user.user_id not in conv.get("participants", []):
        raise HTTPException(status_code=403, detail="Access denied")
    
    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    msg_doc = {
        "message_id": message_id,
        "conversation_id": data.conversation_id,
        "sender_id": user.user_id,
        "sender_name": user.name,
        "content": data.content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.messages.insert_one(msg_doc)
    
    await db.conversations.update_one(
        {"conversation_id": data.conversation_id},
        {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    msg_doc.pop("_id", None)
    
    # Broadcast via WebSocket
    await sio.emit('new_message', msg_doc, room=data.conversation_id)
    
    return msg_doc

# ==================== PAYMENT ROUTES ====================

@api_router.post("/payments/checkout")
async def create_checkout(data: CheckoutRequest, user: User = Depends(get_current_user)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    
    booking = await db.bookings.find_one({"booking_id": data.booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["customer_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your booking")
    
    # Get helper info for the transaction
    helper = await db.helper_profiles.find_one({"helper_id": booking["helper_id"]}, {"_id": 0})
    if not helper:
        raise HTTPException(status_code=404, detail="Helper not found")
    
    api_key = os.environ.get('STRIPE_API_KEY')
    host_url = data.origin_url
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    total_amount = float(booking["total_amount"])
    platform_fee = float(booking["platform_fee"])
    helper_amount = total_amount - platform_fee  # Amount helper will receive
    
    success_url = f"{host_url}/booking/{data.booking_id}/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/booking/{data.booking_id}"
    
    checkout_request = CheckoutSessionRequest(
        amount=total_amount,
        currency="gbp",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "booking_id": data.booking_id,
            "user_id": user.user_id,
            "helper_id": booking["helper_id"]
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record with escrow info
    transaction_id = f"txn_{uuid.uuid4().hex[:12]}"
    await db.payment_transactions.insert_one({
        "transaction_id": transaction_id,
        "booking_id": data.booking_id,
        "customer_id": user.user_id,
        "helper_id": booking["helper_id"],
        "helper_user_id": helper["user_id"],
        "session_id": session.session_id,
        "amount": total_amount,
        "platform_fee": platform_fee,
        "helper_amount": helper_amount,
        "currency": "gbp",
        "payment_status": "pending",  # Will become "held" when paid
        "payout_status": "pending",   # Will become "completed" when paid to helper
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"url": session.url, "session_id": session.session_id, "transaction_id": transaction_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, user: User = Depends(get_current_user)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    api_key = os.environ.get('STRIPE_API_KEY')
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction if paid - money is now HELD in platform account
    if status.payment_status == "paid":
        txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        if txn and txn.get("payment_status") not in ["paid", "held"]:
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "payment_status": "held",  # Money held in platform account
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            await db.bookings.update_one(
                {"booking_id": txn["booking_id"]},
                {"$set": {"payment_status": "paid", "status": "confirmed"}}
            )
            
            # Send booking confirmation emails
            booking = await db.bookings.find_one({"booking_id": txn["booking_id"]}, {"_id": 0})
            customer = await db.users.find_one({"user_id": txn["customer_id"]}, {"_id": 0})
            helper_profile = await db.helper_profiles.find_one({"helper_id": txn["helper_id"]}, {"_id": 0})
            helper_user = await db.users.find_one({"user_id": txn["helper_user_id"]}, {"_id": 0})
            
            if booking and customer and helper_user:
                # Email to customer
                customer_email = get_booking_confirmation_email(
                    booking, 
                    helper_user.get("name", "Helper"),
                    customer.get("name", "Customer")
                )
                await send_email(customer.get("email"), "Booking Confirmed - AnyWork", customer_email)
                
                # Email to helper
                helper_email = get_new_booking_helper_email(
                    helper_user.get("name", "Helper"),
                    customer.get("name", "Customer"),
                    booking
                )
                await send_email(helper_user.get("email"), "New Booking Request - AnyWork", helper_email)
                
                # Store notification in database
                await db.notifications.insert_one({
                    "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
                    "user_id": txn["customer_id"],
                    "type": "booking_confirmed",
                    "title": "Booking Confirmed",
                    "message": f"Your booking with {helper_user.get('name')} has been confirmed.",
                    "data": {"booking_id": txn["booking_id"]},
                    "read": False,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
                await db.notifications.insert_one({
                    "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
                    "user_id": txn["helper_user_id"],
                    "type": "new_booking",
                    "title": "New Booking",
                    "message": f"You have a new booking from {customer.get('name')}.",
                    "data": {"booking_id": txn["booking_id"]},
                    "read": False,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    api_key = os.environ.get('STRIPE_API_KEY')
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    try:
        event = await stripe_checkout.handle_webhook(body, signature)
        
        if event.payment_status == "paid":
            txn = await db.payment_transactions.find_one({"session_id": event.session_id}, {"_id": 0})
            if txn and txn.get("payment_status") not in ["paid", "held"]:
                await db.payment_transactions.update_one(
                    {"session_id": event.session_id},
                    {"$set": {
                        "payment_status": "held",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                await db.bookings.update_one(
                    {"booking_id": txn["booking_id"]},
                    {"$set": {"payment_status": "paid", "status": "confirmed"}}
                )
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": False, "error": str(e)}

# ==================== ADMIN PAYMENT MANAGEMENT ====================

# Admin email for simple admin check
ADMIN_EMAIL = "admin@anywork.co.uk"
ADMIN_EMAILS = ["admin@anywork.co.uk", "nabeel.ucp@gmail.com"]

async def require_admin(user: User = Depends(get_current_user)) -> User:
    """Dependency that requires the user to be an admin"""
    # Check by role first, then by email for backwards compatibility
    user_doc = await db.users.find_one({"user_id": user.user_id})
    if user_doc and user_doc.get("role") == "admin":
        return user
    if user.email in ADMIN_EMAILS:
        return user
    raise HTTPException(status_code=403, detail="Admin access required")

@api_router.get("/admin/payments")
async def get_all_payments(
    status: Optional[str] = None,
    payout_status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    user: User = Depends(require_admin)
):
    """Get all payment transactions for admin dashboard"""
    query = {}
    if status:
        query["payment_status"] = status
    if payout_status:
        query["payout_status"] = payout_status
    
    # Use aggregation to join with bookings and users
    pipeline = [
        {"$match": query},
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "bookings",
                "localField": "booking_id",
                "foreignField": "booking_id",
                "as": "booking"
            }
        },
        {"$unwind": {"path": "$booking", "preserveNullAndEmptyArrays": True}},
        {
            "$lookup": {
                "from": "users",
                "localField": "customer_id",
                "foreignField": "user_id",
                "as": "customer"
            }
        },
        {"$unwind": {"path": "$customer", "preserveNullAndEmptyArrays": True}},
        {
            "$lookup": {
                "from": "users",
                "localField": "helper_user_id",
                "foreignField": "user_id",
                "as": "helper"
            }
        },
        {"$unwind": {"path": "$helper", "preserveNullAndEmptyArrays": True}},
        {
            "$addFields": {
                "customer_name": "$customer.name",
                "customer_email": "$customer.email",
                "helper_name": "$helper.name",
                "helper_email": "$helper.email",
                "service_type": "$booking.service_type",
                "booking_date": "$booking.date",
                "booking_status": "$booking.status"
            }
        },
        {"$project": {"customer": 0, "helper": 0, "booking": 0, "_id": 0}}
    ]
    
    transactions = await db.payment_transactions.aggregate(pipeline).to_list(limit)
    total = await db.payment_transactions.count_documents(query)
    
    # Calculate summary stats
    held_pipeline = [
        {"$match": {"payment_status": "held", "payout_status": "pending"}},
        {"$group": {"_id": None, "total": {"$sum": "$helper_amount"}, "count": {"$sum": 1}}}
    ]
    held_result = await db.payment_transactions.aggregate(held_pipeline).to_list(1)
    held_amount = held_result[0]["total"] if held_result else 0
    held_count = held_result[0]["count"] if held_result else 0
    
    released_pipeline = [
        {"$match": {"payout_status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$helper_amount"}, "count": {"$sum": 1}}}
    ]
    released_result = await db.payment_transactions.aggregate(released_pipeline).to_list(1)
    released_amount = released_result[0]["total"] if released_result else 0
    released_count = released_result[0]["count"] if released_result else 0
    
    platform_fees_pipeline = [
        {"$match": {"payment_status": {"$in": ["held", "released"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$platform_fee"}}}
    ]
    fees_result = await db.payment_transactions.aggregate(platform_fees_pipeline).to_list(1)
    total_fees = fees_result[0]["total"] if fees_result else 0
    
    return {
        "transactions": transactions,
        "total": total,
        "summary": {
            "held_amount": round(held_amount, 2),
            "held_count": held_count,
            "released_amount": round(released_amount, 2),
            "released_count": released_count,
            "platform_fees_earned": round(total_fees, 2)
        }
    }

@api_router.get("/admin/payments/{transaction_id}")
async def get_payment_detail(transaction_id: str, user: User = Depends(require_admin)):
    """Get detailed payment transaction info"""
    txn = await db.payment_transactions.find_one({"transaction_id": transaction_id}, {"_id": 0})
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Get related booking
    booking = await db.bookings.find_one({"booking_id": txn["booking_id"]}, {"_id": 0})
    
    # Get customer info
    customer = await db.users.find_one({"user_id": txn["customer_id"]}, {"_id": 0, "password_hash": 0})
    
    # Get helper info
    helper = await db.users.find_one({"user_id": txn["helper_user_id"]}, {"_id": 0, "password_hash": 0})
    helper_profile = await db.helper_profiles.find_one({"helper_id": txn["helper_id"]}, {"_id": 0})
    
    return {
        "transaction": txn,
        "booking": booking,
        "customer": customer,
        "helper": helper,
        "helper_profile": helper_profile
    }

@api_router.post("/admin/payments/{transaction_id}/release")
async def release_payment(transaction_id: str, user: User = Depends(require_admin)):
    """Release held payment to helper (admin action)"""
    txn = await db.payment_transactions.find_one({"transaction_id": transaction_id}, {"_id": 0})
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if txn["payment_status"] != "held":
        raise HTTPException(status_code=400, detail=f"Cannot release payment with status: {txn['payment_status']}")
    
    if txn["payout_status"] == "completed":
        raise HTTPException(status_code=400, detail="Payment already released")
    
    # Update transaction status - In production, this would trigger actual bank transfer
    await db.payment_transactions.update_one(
        {"transaction_id": transaction_id},
        {"$set": {
            "payment_status": "released",
            "payout_status": "completed",
            "payout_date": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update booking status
    await db.bookings.update_one(
        {"booking_id": txn["booking_id"]},
        {"$set": {"status": "completed"}}
    )
    
    # Update helper's completed jobs count
    await db.helper_profiles.update_one(
        {"helper_id": txn["helper_id"]},
        {"$inc": {"jobs_completed": 1}}
    )
    
    # Create payout record for tracking
    payout_id = f"payout_{uuid.uuid4().hex[:12]}"
    await db.payouts.insert_one({
        "payout_id": payout_id,
        "transaction_id": transaction_id,
        "helper_id": txn["helper_id"],
        "helper_user_id": txn["helper_user_id"],
        "amount": txn["helper_amount"],
        "currency": txn["currency"],
        "status": "completed",
        "released_by": user.user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Send payment released email to helper
    helper_user = await db.users.find_one({"user_id": txn["helper_user_id"]}, {"_id": 0})
    booking = await db.bookings.find_one({"booking_id": txn["booking_id"]}, {"_id": 0})
    if helper_user and booking:
        email_html = get_payment_released_email(
            helper_user.get("name", "Helper"),
            txn["helper_amount"],
            booking.get("service_type", "service")
        )
        await send_email(helper_user.get("email"), "Payment Released - AnyWork 🎉", email_html)
        
        # Store notification
        await db.notifications.insert_one({
            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
            "user_id": txn["helper_user_id"],
            "type": "payment_released",
            "title": "Payment Released!",
            "message": f"£{txn['helper_amount']:.2f} has been released to your account.",
            "data": {"payout_id": payout_id, "amount": txn["helper_amount"]},
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {
        "message": "Payment released successfully",
        "payout_id": payout_id,
        "amount": txn["helper_amount"],
        "helper_id": txn["helper_id"]
    }

@api_router.post("/admin/payments/{transaction_id}/refund")
async def refund_payment(transaction_id: str, user: User = Depends(require_admin)):
    """Refund payment to customer (admin action)"""
    txn = await db.payment_transactions.find_one({"transaction_id": transaction_id}, {"_id": 0})
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if txn["payment_status"] not in ["held", "paid"]:
        raise HTTPException(status_code=400, detail=f"Cannot refund payment with status: {txn['payment_status']}")
    
    if txn["payout_status"] == "completed":
        raise HTTPException(status_code=400, detail="Cannot refund - payment already released to helper")
    
    # Update transaction status - In production, this would trigger Stripe refund
    await db.payment_transactions.update_one(
        {"transaction_id": transaction_id},
        {"$set": {
            "payment_status": "refunded",
            "payout_status": "cancelled",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update booking status
    await db.bookings.update_one(
        {"booking_id": txn["booking_id"]},
        {"$set": {"status": "cancelled", "payment_status": "refunded"}}
    )
    
    return {
        "message": "Payment refunded successfully",
        "amount": txn["amount"],
        "customer_id": txn["customer_id"]
    }

# ==================== ADMIN REPORTS ====================

@api_router.get("/admin/reports")
async def get_reports(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    user: User = Depends(require_admin)
):
    """Get all reports (admin only)"""
    query = {}
    if status:
        query["status"] = status
    
    reports = await db.reports.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.reports.count_documents(query)
    
    # Enrich with user info
    for report in reports:
        reported_user = await db.users.find_one({"user_id": report["reported_user_id"]}, {"_id": 0, "password_hash": 0})
        report["reported_user"] = reported_user
    
    return {"reports": reports, "total": total}

# ==================== ADMIN DASHBOARD STATS ====================

@api_router.get("/admin/dashboard/stats")
async def get_admin_dashboard_stats(user: User = Depends(require_admin)):
    """Get dashboard statistics for admin panel"""
    from datetime import timedelta
    
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    # Total counts
    total_users = await db.users.count_documents({})
    total_jobs = await db.jobs.count_documents({})
    total_bookings = await db.bookings.count_documents({})
    
    # Job status counts
    active_jobs = await db.jobs.count_documents({"status": {"$in": ["open", "active", None]}})
    completed_jobs = await db.bookings.count_documents({"status": "completed"})
    in_progress_jobs = await db.bookings.count_documents({"status": {"$in": ["confirmed", "in_progress"]}})
    
    # Today's stats
    users_today = await db.users.count_documents({"created_at": {"$gte": today_start.isoformat()}})
    jobs_today = await db.jobs.count_documents({"created_at": {"$gte": today_start.isoformat()}})
    
    # Weekly stats
    users_this_week = await db.users.count_documents({"created_at": {"$gte": week_ago.isoformat()}})
    jobs_this_week = await db.jobs.count_documents({"created_at": {"$gte": week_ago.isoformat()}})
    
    # Verification stats
    pending_verifications = await db.verifications.count_documents({"status": "pending"})
    verified_users = await db.users.count_documents({"is_verified": True})
    
    # Helper stats
    total_helpers = await db.users.count_documents({"is_helper": True})
    
    # Reports stats
    pending_reports = await db.reports.count_documents({"status": "pending"})
    
    return {
        "total_users": total_users,
        "total_jobs": total_jobs,
        "total_bookings": total_bookings,
        "active_jobs": active_jobs,
        "completed_jobs": completed_jobs,
        "in_progress_jobs": in_progress_jobs,
        "users_today": users_today,
        "jobs_today": jobs_today,
        "users_this_week": users_this_week,
        "jobs_this_week": jobs_this_week,
        "pending_verifications": pending_verifications,
        "verified_users": verified_users,
        "total_helpers": total_helpers,
        "pending_reports": pending_reports
    }

@api_router.get("/admin/dashboard/activity")
async def get_admin_recent_activity(limit: int = 20, user: User = Depends(require_admin)):
    """Get recent activity feed for admin dashboard"""
    activities = []
    
    # Recent users
    recent_users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).limit(5).to_list(5)
    for u in recent_users:
        activities.append({
            "type": "user_registered",
            "message": f"New user registered: {u.get('name', 'Unknown')}",
            "user_id": u.get("user_id"),
            "timestamp": u.get("created_at"),
            "icon": "user"
        })
    
    # Recent jobs
    recent_jobs = await db.jobs.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    for j in recent_jobs:
        activities.append({
            "type": "job_posted",
            "message": f"New job posted: {j.get('title', 'Untitled')}",
            "job_id": j.get("job_id"),
            "timestamp": j.get("created_at"),
            "icon": "briefcase"
        })
    
    # Recent bookings
    recent_bookings = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    for b in recent_bookings:
        activities.append({
            "type": "booking_created",
            "message": f"Booking request created",
            "booking_id": b.get("booking_id"),
            "timestamp": b.get("created_at"),
            "icon": "calendar"
        })
    
    # Recent verifications
    recent_verifications = await db.verifications.find({}, {"_id": 0}).sort("submitted_at", -1).limit(5).to_list(5)
    for v in recent_verifications:
        activities.append({
            "type": "verification_submitted",
            "message": f"ID verification submitted by {v.get('user_name', 'Unknown')}",
            "verification_id": v.get("verification_id"),
            "timestamp": v.get("submitted_at"),
            "icon": "shield"
        })
    
    # Sort all activities by timestamp
    activities.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    return {"activities": activities[:limit]}

@api_router.get("/admin/dashboard/charts")
async def get_admin_chart_data(days: int = 7, user: User = Depends(require_admin)):
    """Get chart data for admin dashboard"""
    from datetime import timedelta
    
    now = datetime.now(timezone.utc)
    chart_data = []
    
    for i in range(days - 1, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        users_count = await db.users.count_documents({
            "created_at": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}
        })
        
        jobs_count = await db.jobs.count_documents({
            "created_at": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}
        })
        
        bookings_count = await db.bookings.count_documents({
            "created_at": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}
        })
        
        chart_data.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "day": day_start.strftime("%a"),
            "users": users_count,
            "jobs": jobs_count,
            "bookings": bookings_count
        })
    
    return {"chart_data": chart_data}

# ==================== ADMIN USER MANAGEMENT ====================

@api_router.get("/admin/users")
async def get_admin_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    user: User = Depends(require_admin)
):
    """Get all users for admin management"""
    query = {}
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    if role == "helper":
        query["is_helper"] = True
    elif role == "customer":
        query["is_helper"] = {"$ne": True}
    
    if status == "verified":
        query["is_verified"] = True
    elif status == "suspended":
        query["is_suspended"] = True
    elif status == "active":
        query["is_suspended"] = {"$ne": True}
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    return {"users": users, "total": total}

@api_router.get("/admin/users/{user_id}")
async def get_admin_user_detail(user_id: str, user: User = Depends(require_admin)):
    """Get detailed user info for admin"""
    target_user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's jobs
    jobs = await db.jobs.find({"poster_id": user_id}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    
    # Get user's bookings
    bookings = await db.bookings.find(
        {"$or": [{"customer_id": user_id}, {"helper_id": user_id}]},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    # Get helper profile if helper
    helper_profile = None
    if target_user.get("is_helper"):
        helper_profile = await db.helper_profiles.find_one({"user_id": user_id}, {"_id": 0})
    
    # Get verification status
    verification = await db.verifications.find_one({"user_id": user_id}, {"_id": 0})
    
    return {
        "user": target_user,
        "jobs": jobs,
        "bookings": bookings,
        "helper_profile": helper_profile,
        "verification": verification
    }

@api_router.put("/admin/users/{user_id}/status")
async def update_user_status(user_id: str, action: str, reason: Optional[str] = None, user: User = Depends(require_admin)):
    """Suspend, activate, or deactivate a user"""
    target_user = await db.users.find_one({"user_id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if action == "suspend":
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"is_suspended": True, "suspended_at": datetime.now(timezone.utc).isoformat(), "suspension_reason": reason}}
        )
        message = "User suspended"
    elif action == "activate":
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"is_suspended": False}, "$unset": {"suspended_at": "", "suspension_reason": ""}}
        )
        message = "User activated"
    elif action == "deactivate":
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"is_active": False, "deactivated_at": datetime.now(timezone.utc).isoformat()}}
        )
        message = "User deactivated"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    # Return updated user
    updated_user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return updated_user

# ==================== ADMIN JOB MANAGEMENT ====================

@api_router.get("/admin/jobs")
async def get_admin_jobs(
    search: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    user: User = Depends(require_admin)
):
    """Get all jobs for admin management"""
    query = {}
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    if status:
        query["status"] = status
    
    if category:
        query["category"] = category
    
    jobs = await db.jobs.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.jobs.count_documents(query)
    
    # Enrich with poster info
    for job in jobs:
        poster = await db.users.find_one({"user_id": job.get("user_id")}, {"_id": 0, "name": 1, "email": 1, "picture": 1})
        job["poster"] = poster
    
    return {"jobs": jobs, "total": total}

@api_router.get("/admin/jobs/{job_id}")
async def get_admin_job_detail(job_id: str, user: User = Depends(require_admin)):
    """Get detailed job info for admin"""
    job = await db.jobs.find_one({"job_id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get poster info
    poster = await db.users.find_one({"user_id": job.get("user_id")}, {"_id": 0, "name": 1, "email": 1, "picture": 1})
    
    # Get applications/bookings for this job
    bookings = await db.bookings.find({"job_id": job_id}, {"_id": 0}).to_list(100)
    
    # Enrich bookings with helper info - need to get helper profile first to get user_id
    for booking in bookings:
        helper_profile = await db.helper_profiles.find_one({"helper_id": booking.get("helper_id")}, {"_id": 0, "user_id": 1})
        if helper_profile:
            helper = await db.users.find_one({"user_id": helper_profile.get("user_id")}, {"_id": 0, "name": 1, "email": 1, "picture": 1})
            booking["helper"] = helper
    
    return {
        "job": job,
        "poster": poster,
        "applications": bookings
    }

@api_router.put("/admin/jobs/{job_id}/status")
async def update_job_status(job_id: str, status: str, reason: Optional[str] = None, user: User = Depends(require_admin)):
    """Update job status (remove, close, etc.)"""
    job = await db.jobs.find_one({"job_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    update_data = {"status": status}
    if status == "removed":
        update_data["removed_at"] = datetime.now(timezone.utc).isoformat()
        update_data["removal_reason"] = reason
    
    await db.jobs.update_one({"job_id": job_id}, {"$set": update_data})
    
    # Return updated job
    updated_job = await db.jobs.find_one({"job_id": job_id}, {"_id": 0})
    return updated_job

@api_router.delete("/admin/jobs/{job_id}")
async def delete_job(job_id: str, user: User = Depends(require_admin)):
    """Delete a job permanently"""
    result = await db.jobs.delete_one({"job_id": job_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {"message": "Job deleted", "job_id": job_id}

@api_router.get("/admin/bookings")
async def get_admin_bookings(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    user: User = Depends(require_admin)
):
    """Get all bookings (admin only)"""
    query = {}
    if status:
        query["status"] = status
    
    bookings = await db.bookings.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.bookings.count_documents(query)
    
    # Enrich with customer and helper info
    for booking in bookings:
        customer = await db.users.find_one({"user_id": booking.get("customer_id")}, {"_id": 0, "name": 1, "email": 1})
        helper = await db.users.find_one({"user_id": booking.get("helper_id")}, {"_id": 0, "name": 1, "email": 1})
        job = await db.jobs.find_one({"job_id": booking.get("job_id")}, {"_id": 0, "title": 1})
        booking["customer"] = customer
        booking["helper"] = helper
        booking["job"] = job
    
    return {"bookings": bookings, "total": total}

# ==================== ID VERIFICATION ====================

class VerificationSubmit(BaseModel):
    id_type: str  # passport, driving_license, national_id
    id_front: str  # base64 encoded image
    id_back: Optional[str] = None  # base64 encoded image
    selfie: str  # base64 encoded image

@api_router.post("/verification/submit")
async def submit_verification(data: VerificationSubmit, user: User = Depends(get_current_user)):
    """Submit ID verification documents with AI face comparison"""
    # Check if already verified or pending
    existing = await db.verifications.find_one({"user_id": user.user_id, "status": {"$in": ["pending", "verified"]}})
    if existing:
        if existing["status"] == "verified":
            raise HTTPException(status_code=400, detail="Already verified")
        if existing["status"] == "pending":
            raise HTTPException(status_code=400, detail="Verification already in progress")
    
    verification_id = f"verify_{uuid.uuid4().hex[:12]}"
    
    # Run AI face comparison
    logger.info(f"[VERIFICATION] Starting AI face comparison for user {user.user_id}")
    face_result = await compare_faces_with_ai(data.id_front, data.selfie)
    logger.info(f"[VERIFICATION] AI result: {face_result}")
    
    # Determine initial status based on AI result
    if face_result["auto_approved"]:
        # High confidence match - auto approve
        initial_status = "verified"
        notification_message = "Your ID has been verified automatically! You now have full access to AnyWork."
        notification_type = "verification_approved"
        notification_title = "ID Verified!"
    elif face_result["match"] is False and face_result["confidence"] >= 70:
        # High confidence NO match - auto reject
        initial_status = "rejected"
        notification_message = f"Your verification was not approved. Reason: Face in selfie does not match ID photo. Please try again with clearer photos."
        notification_type = "verification_rejected"
        notification_title = "Verification Not Approved"
    else:
        # Uncertain - flag for admin review
        initial_status = "pending"
        notification_message = "Your ID verification is being reviewed by our team. This usually takes 24-48 hours."
        notification_type = "verification_submitted"
        notification_title = "Verification Submitted"
    
    verification_doc = {
        "verification_id": verification_id,
        "user_id": user.user_id,
        "user_name": user.name,
        "user_email": user.email,
        "id_type": data.id_type,
        "id_front": data.id_front,
        "id_back": data.id_back,
        "selfie": data.selfie,
        "status": initial_status,
        "ai_verification": {
            "match": face_result["match"],
            "confidence": face_result["confidence"],
            "reason": face_result["reason"],
            "auto_processed": face_result["auto_approved"] or (face_result["match"] is False and face_result["confidence"] >= 70)
        },
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "reviewed_at": datetime.now(timezone.utc).isoformat() if initial_status != "pending" else None,
        "reviewed_by": "AI_SYSTEM" if initial_status != "pending" else None,
        "rejection_reason": face_result["reason"] if initial_status == "rejected" else None
    }
    
    await db.verifications.insert_one(verification_doc)
    
    # Update user's verification status
    user_update = {"verification_status": initial_status}
    if initial_status == "verified":
        user_update["is_verified"] = True
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": user_update}
    )
    
    # Create notification
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "type": notification_type,
        "title": notification_title,
        "message": notification_message,
        "data": {"verification_id": verification_id},
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # If pending (needs admin review), send email to admin
    if initial_status == "pending":
        email_html = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>New Verification Request - Needs Review</h2>
            <p>User: {user.name} ({user.email})</p>
            <p>ID Type: {data.id_type}</p>
            <p>AI Confidence: {face_result['confidence']}%</p>
            <p>AI Result: {face_result['reason']}</p>
            <p>Submitted: {datetime.now(timezone.utc).isoformat()}</p>
            <p><a href="https://anywork.co.uk/admin/dashboard">Review in Admin Dashboard</a></p>
        </body>
        </html>
        """
        await send_email("admin@anywork.co.uk", f"Verification Needs Review - {user.name}", email_html)
    
    return {
        "message": notification_message,
        "verification_id": verification_id,
        "status": initial_status,
        "ai_result": {
            "confidence": face_result["confidence"],
            "auto_processed": face_result["auto_approved"] or (face_result["match"] is False and face_result["confidence"] >= 70)
        }
    }

@api_router.get("/verification/status")
async def get_verification_status(user: User = Depends(get_current_user)):
    """Get current user's verification status"""
    verification = await db.verifications.find_one(
        {"user_id": user.user_id},
        {"_id": 0, "id_front": 0, "id_back": 0, "selfie": 0}  # Don't return images
    )
    
    return {
        "status": user.verification_status or "unverified",
        "verification": verification
    }

@api_router.get("/admin/verifications")
async def get_admin_verifications(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    user: User = Depends(require_admin)
):
    """Get all verification requests (admin only)"""
    query = {}
    if status:
        query["status"] = status
    
    # Don't return full base64 images in list view
    verifications = await db.verifications.find(query, {"_id": 0}).sort("submitted_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.verifications.count_documents(query)
    
    # Strip large image data for list view (keep small preview indicator)
    for v in verifications:
        v["has_id_front"] = bool(v.get("id_front"))
        v["has_id_back"] = bool(v.get("id_back"))
        v["has_selfie"] = bool(v.get("selfie"))
        v.pop("id_front", None)
        v.pop("id_back", None)
        v.pop("selfie", None)
    
    pending_count = await db.verifications.count_documents({"status": "pending"})
    
    return {"verifications": verifications, "total": total, "pending_count": pending_count}

@api_router.get("/admin/verifications/{verification_id}")
async def get_verification_detail(verification_id: str, user: User = Depends(require_admin)):
    """Get verification details including images (admin only)"""
    verification = await db.verifications.find_one({"verification_id": verification_id}, {"_id": 0})
    if not verification:
        raise HTTPException(status_code=404, detail="Verification not found")
    return verification

class VerificationReview(BaseModel):
    status: str  # verified or rejected
    rejection_reason: Optional[str] = None

@api_router.put("/admin/verifications/{verification_id}")
async def review_verification(verification_id: str, data: VerificationReview, user: User = Depends(require_admin)):
    """Approve or reject a verification (admin only)"""
    if data.status not in ["verified", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be 'verified' or 'rejected'")
    
    verification = await db.verifications.find_one({"verification_id": verification_id}, {"_id": 0})
    if not verification:
        raise HTTPException(status_code=404, detail="Verification not found")
    
    # Update verification
    await db.verifications.update_one(
        {"verification_id": verification_id},
        {"$set": {
            "status": data.status,
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
            "reviewed_by": user.user_id,
            "rejection_reason": data.rejection_reason if data.status == "rejected" else None
        }}
    )
    
    # Update user's verification status
    await db.users.update_one(
        {"user_id": verification["user_id"]},
        {"$set": {"verification_status": data.status, "is_verified": data.status == "verified"}}
    )
    
    # Also update helper profile if user is a helper
    await db.helper_profiles.update_one(
        {"user_id": verification["user_id"]},
        {"$set": {"is_verified": data.status == "verified"}}
    )
    
    # Send notification to user
    if data.status == "verified":
        await db.notifications.insert_one({
            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
            "user_id": verification["user_id"],
            "type": "verification_approved",
            "title": "Verification Approved! ✅",
            "message": "Your identity has been verified. You now have a verified badge on your profile.",
            "data": {"verification_id": verification_id},
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Send email
        verified_user = await db.users.find_one({"user_id": verification["user_id"]}, {"_id": 0})
        if verified_user:
            email_html = f"""
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #10B981; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">AnyWork</h1>
                </div>
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2 style="color: #0F172A;">You're Verified! ✅</h2>
                    <p style="color: #64748B;">Hi {verified_user.get('name', 'User')},</p>
                    <p style="color: #64748B;">Great news! Your identity has been verified. You now have a "Verified" badge on your profile, which helps build trust with other users.</p>
                    <a href="https://anywork.co.uk/dashboard" style="display: inline-block; background: #0052CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">View Your Profile</a>
                </div>
            </body>
            </html>
            """
            await send_email(verified_user.get("email"), "You're Verified - AnyWork ✅", email_html)
    else:
        await db.notifications.insert_one({
            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
            "user_id": verification["user_id"],
            "type": "verification_rejected",
            "title": "Verification Not Approved",
            "message": data.rejection_reason or "Your verification was not approved. Please try again with clearer documents.",
            "data": {"verification_id": verification_id},
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {"message": f"Verification {data.status}", "verification_id": verification_id}

# ==================== HELPER EARNINGS ====================

@api_router.get("/helper/earnings")
async def get_helper_earnings(user: User = Depends(get_current_user)):
    """Get earnings summary for logged-in helper"""
    helper_profile = await db.helper_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    if not helper_profile:
        raise HTTPException(status_code=404, detail="Helper profile not found")
    
    helper_id = helper_profile["helper_id"]
    
    # Get pending earnings (held)
    pending_pipeline = [
        {"$match": {"helper_id": helper_id, "payment_status": "held", "payout_status": "pending"}},
        {"$group": {"_id": None, "total": {"$sum": "$helper_amount"}, "count": {"$sum": 1}}}
    ]
    pending_result = await db.payment_transactions.aggregate(pending_pipeline).to_list(1)
    pending_amount = pending_result[0]["total"] if pending_result else 0
    pending_count = pending_result[0]["count"] if pending_result else 0
    
    # Get released earnings (completed)
    released_pipeline = [
        {"$match": {"helper_id": helper_id, "payout_status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$helper_amount"}, "count": {"$sum": 1}}}
    ]
    released_result = await db.payment_transactions.aggregate(released_pipeline).to_list(1)
    released_amount = released_result[0]["total"] if released_result else 0
    released_count = released_result[0]["count"] if released_result else 0
    
    # Get recent transactions
    recent_txns = await db.payment_transactions.find(
        {"helper_id": helper_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    # Enrich with booking info
    for txn in recent_txns:
        booking = await db.bookings.find_one({"booking_id": txn["booking_id"]}, {"_id": 0})
        if booking:
            txn["service_type"] = booking.get("service_type")
            txn["booking_date"] = booking.get("date")
    
    return {
        "summary": {
            "pending_amount": round(pending_amount, 2),
            "pending_count": pending_count,
            "total_earned": round(released_amount, 2),
            "jobs_paid": released_count
        },
        "recent_transactions": recent_txns
    }

@api_router.get("/helper/payouts")
async def get_helper_payouts(user: User = Depends(get_current_user)):
    """Get payout history for logged-in helper"""
    helper_profile = await db.helper_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    if not helper_profile:
        raise HTTPException(status_code=404, detail="Helper profile not found")
    
    payouts = await db.payouts.find(
        {"helper_user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"payouts": payouts}

# ==================== NOTIFICATIONS ====================

@api_router.get("/notifications")
async def get_notifications(user: User = Depends(get_current_user), unread_only: bool = False):
    """Get notifications for the current user"""
    query = {"user_id": user.user_id}
    if unread_only:
        query["read"] = False
    
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    unread_count = await db.notifications.count_documents({"user_id": user.user_id, "read": False})
    
    return {"notifications": notifications, "unread_count": unread_count}

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user: User = Depends(get_current_user)):
    """Mark a notification as read"""
    result = await db.notifications.update_one(
        {"notification_id": notification_id, "user_id": user.user_id},
        {"$set": {"read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(user: User = Depends(get_current_user)):
    """Mark all notifications as read"""
    await db.notifications.update_many(
        {"user_id": user.user_id, "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All notifications marked as read"}

# ==================== SEASONAL PRICING ====================

# Seasonal pricing adjustments (month -> category -> multiplier)
SEASONAL_PRICING = {
    # Spring (March-May): Higher demand for gardening, cleaning
    3: {"gardening": 1.2, "cleaning": 1.1, "pressure-washing": 1.15},
    4: {"gardening": 1.25, "cleaning": 1.1, "pressure-washing": 1.2},
    5: {"gardening": 1.3, "cleaning": 1.15, "pressure-washing": 1.25},
    # Summer (June-August): Peak for outdoor services
    6: {"gardening": 1.35, "car-wash": 1.2, "moving": 1.15, "event-staff": 1.2},
    7: {"gardening": 1.4, "car-wash": 1.25, "moving": 1.2, "event-staff": 1.25, "childcare": 1.15},
    8: {"gardening": 1.35, "car-wash": 1.2, "moving": 1.2, "event-staff": 1.2, "childcare": 1.2},
    # Autumn (September-November): Back to school tutoring demand
    9: {"tutoring": 1.2, "gutter-cleaning": 1.2, "gardening": 1.1},
    10: {"tutoring": 1.15, "gutter-cleaning": 1.3, "gardening": 1.0},
    11: {"tutoring": 1.1, "gutter-cleaning": 1.25, "cleaning": 1.1},
    # Winter (December-February): Holiday and indoor focus
    12: {"cleaning": 1.2, "event-staff": 1.35, "waiters": 1.3, "bartenders": 1.3, "decoration-setup": 1.4},
    1: {"cleaning": 1.15, "handyman": 1.1, "plumbing": 1.15},
    2: {"cleaning": 1.1, "handyman": 1.05, "plumbing": 1.1},
}

@api_router.get("/pricing/seasonal")
async def get_seasonal_pricing():
    """Get current seasonal pricing adjustments"""
    current_month = datetime.now().month
    adjustments = SEASONAL_PRICING.get(current_month, {})
    
    # Get categories with seasonal hints
    seasonal_categories = []
    for cat in CATEGORIES:
        cat_data = cat.copy()
        multiplier = adjustments.get(cat["id"], 1.0)
        if multiplier > 1.0:
            cat_data["seasonal_multiplier"] = multiplier
            cat_data["seasonal_hint"] = f"High demand - prices may be {int((multiplier - 1) * 100)}% higher"
        elif multiplier < 1.0:
            cat_data["seasonal_multiplier"] = multiplier
            cat_data["seasonal_hint"] = f"Low season - potential savings of {int((1 - multiplier) * 100)}%"
        seasonal_categories.append(cat_data)
    
    return {
        "month": current_month,
        "adjustments": adjustments,
        "categories": seasonal_categories
    }

@api_router.get("/pricing/category/{category_id}")
async def get_category_pricing(category_id: str):
    """Get pricing info for a specific category including seasonal adjustments"""
    category = next((c for c in CATEGORIES if c["id"] == category_id), None)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    current_month = datetime.now().month
    adjustments = SEASONAL_PRICING.get(current_month, {})
    multiplier = adjustments.get(category_id, 1.0)
    
    result = {
        "category": category,
        "base_price_range": category.get("price_range"),
        "seasonal_multiplier": multiplier,
    }
    
    if multiplier > 1.0:
        result["seasonal_status"] = "high_demand"
        result["seasonal_hint"] = f"Peak season for {category['name']} - prices typically {int((multiplier - 1) * 100)}% higher"
    elif multiplier < 1.0:
        result["seasonal_status"] = "low_demand"
        result["seasonal_hint"] = f"Off-peak for {category['name']} - potential savings available"
    else:
        result["seasonal_status"] = "normal"
        result["seasonal_hint"] = "Standard pricing period"
    
    return result

# ==================== CATEGORIES ====================

# Main category groups
CATEGORY_GROUPS = [
    {"id": "home-services", "name": "Home Services", "icon": "Home"},
    {"id": "vehicle-services", "name": "Vehicle Services", "icon": "Car"},
    {"id": "personal-services", "name": "Personal Services", "icon": "User"},
    {"id": "business-support", "name": "Business Support", "icon": "Briefcase"},
    {"id": "digital-services", "name": "Digital Services", "icon": "Monitor"},
    {"id": "events-staffing", "name": "Events & Staffing", "icon": "PartyPopper"},
]

# All subcategories with their parent groups and pricing guidance
CATEGORIES = [
    # Home Services
    {"id": "handyman", "name": "Handyman", "group": "home-services", "icon": "Wrench", "price_range": "£25-45/hr"},
    {"id": "plumbing", "name": "Plumbing", "group": "home-services", "icon": "Droplet", "price_range": "£40-70/hr"},
    {"id": "electrical", "name": "Electrical Work", "group": "home-services", "icon": "Zap", "price_range": "£45-75/hr"},
    {"id": "painting", "name": "Painting & Decorating", "group": "home-services", "icon": "Paintbrush", "price_range": "£20-35/hr"},
    {"id": "cleaning", "name": "Cleaning", "group": "home-services", "icon": "Sparkles", "price_range": "£12-20/hr"},
    {"id": "gardening", "name": "Gardening", "group": "home-services", "icon": "Flower2", "price_range": "£15-30/hr"},
    {"id": "moving", "name": "Moving Help", "group": "home-services", "icon": "Truck", "price_range": "£20-35/hr"},
    {"id": "furniture-assembly", "name": "Furniture Assembly", "group": "home-services", "icon": "Armchair", "price_range": "£25-40/hr"},
    {"id": "pressure-washing", "name": "Pressure Washing", "group": "home-services", "icon": "Droplets", "price_range": "£30-50/hr"},
    {"id": "gutter-cleaning", "name": "Gutter Cleaning", "group": "home-services", "icon": "Home", "price_range": "£80-150/job"},
    # Vehicle Services
    {"id": "mobile-mechanic", "name": "Mobile Mechanic", "group": "vehicle-services", "icon": "Wrench", "price_range": "£45-80/hr"},
    {"id": "car-servicing", "name": "Car Servicing", "group": "vehicle-services", "icon": "Car", "price_range": "£100-250/service"},
    {"id": "brake-replacement", "name": "Brake & Pad Replacement", "group": "vehicle-services", "icon": "CircleStop", "price_range": "£120-300/job"},
    {"id": "car-diagnostics", "name": "Car Diagnostics", "group": "vehicle-services", "icon": "Search", "price_range": "£40-80/check"},
    {"id": "battery-replacement", "name": "Battery Replacement", "group": "vehicle-services", "icon": "Battery", "price_range": "£80-180/job"},
    {"id": "tyre-fitting", "name": "Tyre Fitting (Mobile)", "group": "vehicle-services", "icon": "Circle", "price_range": "£20-40/tyre"},
    {"id": "jump-start", "name": "Jump Start", "group": "vehicle-services", "icon": "Zap", "price_range": "£40-70/callout"},
    {"id": "car-wash", "name": "Car Wash at Home", "group": "vehicle-services", "icon": "Droplet", "price_range": "£20-60/wash"},
    {"id": "driving-cover", "name": "Driving Cover", "group": "vehicle-services", "icon": "Car", "price_range": "£12-20/hr"},
    # Personal Services
    {"id": "tutoring", "name": "Tutoring", "group": "personal-services", "icon": "GraduationCap", "price_range": "£25-60/hr"},
    {"id": "childcare", "name": "Childcare", "group": "personal-services", "icon": "Baby", "price_range": "£10-18/hr"},
    {"id": "eldercare", "name": "Elder Care", "group": "personal-services", "icon": "Heart", "price_range": "£12-22/hr"},
    {"id": "pets", "name": "Pets", "group": "personal-services", "icon": "PawPrint", "price_range": "£10-20/hr"},
    {"id": "personal-assistant", "name": "Personal Assistant", "group": "personal-services", "icon": "ClipboardList", "price_range": "£15-30/hr"},
    {"id": "grocery-pickup", "name": "Grocery Pickup", "group": "personal-services", "icon": "ShoppingCart", "price_range": "£10-20/trip"},
    {"id": "parcel-collection", "name": "Parcel Collection", "group": "personal-services", "icon": "Package", "price_range": "£8-15/trip"},
    {"id": "home-help", "name": "Home Help", "group": "personal-services", "icon": "Home", "price_range": "£12-20/hr"},
    # Business Support
    {"id": "temporary-staff", "name": "Temporary Staff", "group": "business-support", "icon": "Users", "price_range": "£12-25/hr"},
    {"id": "retail-staff", "name": "Retail Staff Cover", "group": "business-support", "icon": "Store", "price_range": "£11-18/hr"},
    {"id": "warehouse-support", "name": "Warehouse Support", "group": "business-support", "icon": "Warehouse", "price_range": "£12-20/hr"},
    {"id": "delivery-drivers", "name": "Delivery Drivers", "group": "business-support", "icon": "Truck", "price_range": "£14-22/hr"},
    {"id": "admin-support", "name": "Admin Support", "group": "business-support", "icon": "FileText", "price_range": "£15-30/hr"},
    {"id": "event-setup", "name": "Event Setup Crew", "group": "business-support", "icon": "Tent", "price_range": "£12-20/hr"},
    {"id": "labourers", "name": "Labourers", "group": "business-support", "icon": "HardHat", "price_range": "£12-18/hr"},
    # Digital Services
    {"id": "graphic-design", "name": "Graphic Design", "group": "digital-services", "icon": "Palette", "price_range": "£25-60/hr"},
    {"id": "video-editing", "name": "Video Editing", "group": "digital-services", "icon": "Film", "price_range": "£30-70/hr"},
    {"id": "cv-writing", "name": "CV Writing", "group": "digital-services", "icon": "FileText", "price_range": "£50-150/CV"},
    {"id": "website-setup", "name": "Website Setup", "group": "digital-services", "icon": "Globe", "price_range": "£200-1000/site"},
    {"id": "social-media", "name": "Social Media Management", "group": "digital-services", "icon": "Share2", "price_range": "£200-600/month"},
    {"id": "data-entry", "name": "Data Entry", "group": "digital-services", "icon": "Keyboard", "price_range": "£12-20/hr"},
    {"id": "translation", "name": "Translation", "group": "digital-services", "icon": "Languages", "price_range": "£0.08-0.15/word"},
    # Events & Staffing
    {"id": "event-staff", "name": "Event Staff", "group": "events-staffing", "icon": "Users", "price_range": "£12-20/hr"},
    {"id": "waiters", "name": "Waiters", "group": "events-staffing", "icon": "UtensilsCrossed", "price_range": "£12-18/hr"},
    {"id": "bartenders", "name": "Bartenders", "group": "events-staffing", "icon": "Wine", "price_range": "£14-25/hr"},
    {"id": "security", "name": "Security", "group": "events-staffing", "icon": "Shield", "price_range": "£15-25/hr"},
    {"id": "dj-services", "name": "DJ Services", "group": "events-staffing", "icon": "Music", "price_range": "£150-400/event"},
    {"id": "photographer", "name": "Photographer", "group": "events-staffing", "icon": "Camera", "price_range": "£100-300/hr"},
    {"id": "videographer", "name": "Videographer", "group": "events-staffing", "icon": "Video", "price_range": "£150-400/hr"},
    {"id": "decoration-setup", "name": "Decoration Setup", "group": "events-staffing", "icon": "Sparkles", "price_range": "£15-30/hr"},
]

# Popular services by UK region (based on postcode prefix)
POPULAR_BY_REGION = {
    # London areas
    "SW": ["cleaning", "handyman", "tutoring", "pets"],
    "SE": ["cleaning", "moving", "handyman", "gardening"],
    "E": ["cleaning", "moving", "delivery-drivers", "handyman"],
    "W": ["cleaning", "tutoring", "pets", "personal-assistant"],
    "N": ["cleaning", "handyman", "tutoring", "moving"],
    "NW": ["cleaning", "tutoring", "pets", "childcare"],
    "EC": ["admin-support", "delivery-drivers", "cleaning", "event-staff"],
    "WC": ["cleaning", "admin-support", "event-staff", "waiters"],
    # Other major cities
    "M": ["cleaning", "handyman", "moving", "delivery-drivers"],
    "B": ["cleaning", "handyman", "gardening", "mobile-mechanic"],
    "L": ["cleaning", "handyman", "moving", "pets"],
    "LS": ["cleaning", "handyman", "tutoring", "moving"],
    "S": ["cleaning", "handyman", "gardening", "mobile-mechanic"],
    "BS": ["cleaning", "handyman", "gardening", "moving"],
    "G": ["cleaning", "handyman", "moving", "gardening"],
    "EH": ["cleaning", "handyman", "tutoring", "moving"],
    "CF": ["cleaning", "handyman", "gardening", "moving"],
    "BT": ["cleaning", "handyman", "gardening", "plumbing"],
}

@api_router.get("/categories")
async def get_categories():
    return {"categories": CATEGORIES, "groups": CATEGORY_GROUPS}

@api_router.get("/categories/groups")
async def get_category_groups():
    return {"groups": CATEGORY_GROUPS}

@api_router.get("/categories/group/{group_id}")
async def get_categories_by_group(group_id: str):
    group_categories = [c for c in CATEGORIES if c.get("group") == group_id]
    return {"categories": group_categories}

@api_router.get("/categories/popular/{postcode_prefix}")
async def get_popular_categories(postcode_prefix: str):
    prefix = postcode_prefix.upper().replace(" ", "")[:2]
    popular_ids = POPULAR_BY_REGION.get(prefix, ["cleaning", "handyman", "gardening", "moving"])
    popular_categories = [c for c in CATEGORIES if c["id"] in popular_ids]
    return {"categories": popular_categories, "region": prefix}

# ==================== SOCKET.IO EVENTS ====================

@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")

@sio.event
async def join_room(sid, data):
    room_id = data.get("room_id")
    if room_id:
        await sio.enter_room(sid, room_id)
        logger.info(f"Client {sid} joined room {room_id}")

@sio.event
async def leave_room(sid, data):
    room_id = data.get("room_id")
    if room_id:
        await sio.leave_room(sid, room_id)
        logger.info(f"Client {sid} left room {room_id}")

# ==================== SAMPLE DATA ====================

@api_router.post("/seed-data")
async def seed_sample_data():
    """Seed sample helpers and jobs for demo purposes"""
    
    # Sample helpers
    sample_helpers = [
        {
            "helper_id": f"helper_{uuid.uuid4().hex[:12]}",
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "bio": "Professional cleaner with 5 years experience. I take pride in making homes sparkle!",
            "categories": ["cleaning", "home-help"],
            "hourly_rate": 15.0,
            "postcode": "SW1A 1AA",
            "availability": {"monday": ["09:00-17:00"], "tuesday": ["09:00-17:00"], "wednesday": ["09:00-17:00"]},
            "verified_id": True,
            "insured": True,
            "rating": 4.9,
            "total_reviews": 47,
            "reliability_score": 98.0,
            "jobs_completed": 52,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "user_name": "Sarah Johnson",
            "user_picture": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
        },
        {
            "helper_id": f"helper_{uuid.uuid4().hex[:12]}",
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "bio": "Certified dog walker and pet sitter. Your furry friends are in safe hands!",
            "categories": ["pets"],
            "hourly_rate": 12.0,
            "postcode": "E1 6AN",
            "availability": {"monday": ["07:00-20:00"], "tuesday": ["07:00-20:00"], "saturday": ["08:00-18:00"]},
            "verified_id": True,
            "insured": True,
            "rating": 4.8,
            "total_reviews": 89,
            "reliability_score": 99.0,
            "jobs_completed": 124,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "user_name": "James Williams",
            "user_picture": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
        },
        {
            "helper_id": f"helper_{uuid.uuid4().hex[:12]}",
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "bio": "Maths and Science tutor - GCSE & A-Level specialist. Helping students achieve their best!",
            "categories": ["tutoring"],
            "hourly_rate": 35.0,
            "postcode": "NW1 4RY",
            "availability": {"monday": ["16:00-21:00"], "wednesday": ["16:00-21:00"], "saturday": ["10:00-18:00"]},
            "verified_id": True,
            "insured": False,
            "rating": 5.0,
            "total_reviews": 23,
            "reliability_score": 100.0,
            "jobs_completed": 28,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "user_name": "Dr. Emily Chen",
            "user_picture": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
        },
        {
            "helper_id": f"helper_{uuid.uuid4().hex[:12]}",
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "bio": "Experienced handyman - no job too small! From flat-pack assembly to minor repairs.",
            "categories": ["handyman", "home-help"],
            "hourly_rate": 25.0,
            "fixed_rate": 50.0,
            "postcode": "SE1 9SG",
            "availability": {"tuesday": ["08:00-18:00"], "thursday": ["08:00-18:00"], "friday": ["08:00-18:00"]},
            "verified_id": True,
            "insured": True,
            "rating": 4.7,
            "total_reviews": 156,
            "reliability_score": 96.0,
            "jobs_completed": 203,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "user_name": "Mike Thompson",
            "user_picture": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150"
        },
        {
            "helper_id": f"helper_{uuid.uuid4().hex[:12]}",
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "bio": "Professional gardener with passion for creating beautiful outdoor spaces.",
            "categories": ["gardening"],
            "hourly_rate": 20.0,
            "postcode": "W8 4PT",
            "availability": {"monday": ["08:00-16:00"], "wednesday": ["08:00-16:00"], "friday": ["08:00-16:00"]},
            "verified_id": True,
            "insured": True,
            "rating": 4.9,
            "total_reviews": 67,
            "reliability_score": 97.0,
            "jobs_completed": 89,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "user_name": "David Green",
            "user_picture": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
        }
    ]
    
    # Insert helpers
    for helper in sample_helpers:
        existing = await db.helper_profiles.find_one({"user_name": helper["user_name"]}, {"_id": 0})
        if not existing:
            # Create user first
            user_doc = {
                "user_id": helper["user_id"],
                "email": f"{helper['user_name'].lower().replace(' ', '.')}@example.com",
                "name": helper["user_name"],
                "picture": helper["user_picture"],
                "role": "helper",
                "is_helper": True,
                "created_at": helper["created_at"]
            }
            await db.users.insert_one(user_doc)
            await db.helper_profiles.insert_one(helper)
    
    return {"message": "Sample data seeded successfully"}

# ==================== ROOT ROUTE ====================

@api_router.get("/")
async def root():
    return {"message": "AnyWork API - UK Marketplace for Local Help"}

# Include the router in the main app
fastapi_app.include_router(api_router)

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@fastapi_app.on_event("startup")
async def startup():
    logger.info("AnyWork server starting...")
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.helper_profiles.create_index("helper_id", unique=True)
    await db.helper_profiles.create_index("user_id")
    await db.helper_profiles.create_index("categories")
    await db.helper_profiles.create_index("postcode")
    await db.jobs.create_index("job_id", unique=True)
    await db.bookings.create_index("booking_id", unique=True)

@fastapi_app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Wrap FastAPI with Socket.IO
socket_app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app, socketio_path='/api/socket.io')
app = socket_app
