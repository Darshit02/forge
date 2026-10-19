from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(
    title="Forge FastAPI Backend",
    version="1.0.0",
    description="Auto-generated backend scaffolded by Forge AI IDE",
)

class User(BaseModel):
    id: int
    name: str
    email: str
    role: Optional[str] = "developer"

# In-memory store for demonstration
USERS_DB = [
    User(id=1, name="Alice", email="alice@example.com", role="admin"),
    User(id=2, name="Bob", email="bob@example.com", role="developer"),
]

@app.get("/health", tags=["System"])
def health_check():
    """System health check endpoint"""
    return {"status": "ok", "service": "fastapi-backend"}

@app.get("/users", response_model=List[User], tags=["Users"])
def list_users():
    """Retrieve all users"""
    return USERS_DB

@app.post("/users", response_model=User, status_code=201, tags=["Users"])
def create_user(user: User):
    """Create a new user"""
    for u in USERS_DB:
        if u.id == user.id:
            raise HTTPException(status_code=400, detail="User already exists")
    USERS_DB.append(user)
    return user
