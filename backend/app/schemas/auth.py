import re
from pydantic import BaseModel, Field, field_validator, EmailStr
from typing import Optional
from datetime import datetime

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr = Field(..., max_length=255)
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter (A-Z)")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter (a-z)")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_=+[\]\\/;'`~]", v):
            raise ValueError("Password must contain at least one special character (!@#$%^&*...)")
        return v

class UserLogin(BaseModel):
    email: EmailStr = Field(..., max_length=255)
    password: str = Field(..., min_length=1, max_length=128)

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    avatar: Optional[str] = None
    is_verified: bool = True
    is_guest: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    is_guest: Optional[bool] = False

