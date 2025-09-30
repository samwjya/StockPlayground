import os
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from jose import jwt

security = HTTPBearer()
JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
JWT_ALG = "HS256"

if not JWT_SECRET:
    raise ValueError("SUPABASE_JWT_SECRET is not set!")

JWT_SECRET = JWT_SECRET.strip()

def get_user_id(credentials=Depends(security)) -> str:
    token = credentials.credentials 

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALG],
            options={"verify_aud": False}
        )

        aud = payload.get("aud")
        if aud not in ("authenticated", ["authenticated"]):
            raise HTTPException(status_code=401, detail="Invalid audience")

        return payload["sub"]

    except Exception as e:
        print("JWT decode error:", str(e))
        raise HTTPException(status_code=401, detail="Invalid or expired token")