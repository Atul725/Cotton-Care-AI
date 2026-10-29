import os
import hmac
import hashlib
import json
import base64
import time
from typing import Optional, Dict, Any
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import httpx

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.farmer import FarmerUser

# Secret key for signing tokens
AUTH_SECRET = settings.SECRET_KEY.encode("utf-8")
TOKEN_EXPIRY_SECONDS = 7 * 24 * 3600  # 7 days

security_scheme = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with 100,000 iterations and random 16-byte salt."""
    salt = os.urandom(16)
    kdf = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return f"pbkdf2:sha256:100000${salt.hex()}${kdf.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against stored PBKDF2 hash using constant-time comparison."""
    if not hashed_password or "$" not in hashed_password:
        return False
    try:
        parts = hashed_password.split("$")
        if len(parts) != 3:
            return False
        meta, salt_hex, hash_hex = parts
        salt = bytes.fromhex(salt_hex)
        expected_hash = bytes.fromhex(hash_hex)
        
        # Extract iterations from meta (e.g. pbkdf2:sha256:100000)
        iterations = int(meta.split(":")[-1]) if ":" in meta else 100000
        computed = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, iterations)
        return hmac.compare_digest(computed, expected_hash)
    except Exception:
        return False

def create_access_token(identifier: str, email: Optional[str] = None, name: Optional[str] = None) -> str:
    """Generates an HMAC-SHA256 signed JWT-like access token with payload and signature."""
    payload = {
        "sub": identifier,
        "email": email or "",
        "name": name or "",
        "exp": int(time.time()) + TOKEN_EXPIRY_SECONDS,
        "iat": int(time.time())
    }
    header = {"alg": "HS256", "typ": "JWT"}
    
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    
    signature = hmac.new(AUTH_SECRET, signing_input, hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    
    return f"{header_b64}.{payload_b64}.{sig_b64}"

def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Verifies the HMAC signature and expiration time of an access token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        
        # Verify signature
        expected_sig = hmac.new(AUTH_SECRET, signing_input, hashlib.sha256).digest()
        actual_sig = base64.urlsafe_b64decode(sig_b64 + "=" * (-len(sig_b64) % 4))
        
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
        
        payload_bytes = base64.urlsafe_b64decode(payload_b64 + "=" * (-len(payload_b64) % 4))
        payload = json.loads(payload_bytes.decode())
        
        # Check expiration
        if payload.get("exp", 0) < time.time():
            return None
            
        return payload
    except Exception:
        return None

async def verify_google_id_token(id_token: str) -> Optional[Dict[str, Any]]:
    """
    Validates a Google OAuth2 ID token using Google's public tokeninfo API endpoint.
    Verifies issuer, audience (if configured), and expiration.
    """
    google_client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}")
            if resp.status_code != 200:
                return None
            data = resp.json()
            
            # Verify issuer
            if data.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
                return None
            
            # If GOOGLE_CLIENT_ID is configured in environment, verify audience
            if google_client_id and data.get("aud") != google_client_id:
                return None
                
            return {
                "sub": data.get("sub"),
                "email": data.get("email"),
                "name": data.get("name", "Google Farmer"),
                "email_verified": data.get("email_verified", False)
            }
    except Exception:
        return None

def get_current_user_optional(
    auth: Optional[HTTPAuthorizationCredentials] = Security(security_scheme),
    db: Session = Depends(get_db)
) -> Optional[FarmerUser]:
    """Retrieves current authenticated farmer user, or returns None if no token or invalid."""
    if not auth or not auth.credentials:
        return None
    payload = verify_access_token(auth.credentials)
    if not payload:
        return None
    identifier = payload.get("sub")
    if not identifier:
        return None
    return db.query(FarmerUser).filter_by(identifier=identifier).first()

def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Security(security_scheme),
    db: Session = Depends(get_db)
) -> FarmerUser:
    """Enforces authentication. Raises HTTP 401 if token is missing, expired, or invalid."""
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = verify_access_token(auth.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or is invalid. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    identifier = payload.get("sub")
    user = db.query(FarmerUser).filter_by(identifier=identifier).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
