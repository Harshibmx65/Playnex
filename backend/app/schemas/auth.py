from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SendOtpRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, max_length=100)

class VerifyOtpRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    otp_code: str = Field(..., min_length=4, max_length=10)

class ResendOtpRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)

class OtpResponse(BaseModel):
    message: str
    email: str
    cooldown_seconds: int = 60
    expires_in_seconds: int = 600
    delivery_mode: Optional[str] = None
    dev_otp: Optional[str] = None

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, max_length=100)

class UserLogin(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=1, max_length=100)

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
