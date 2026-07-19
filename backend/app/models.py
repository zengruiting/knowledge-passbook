from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from uuid import uuid4
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    assets = relationship("Asset", back_populates="owner")

class Asset(Base):
    __tablename__ = "assets"
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    status = Column(String, default="incubating") # incubating, minted
    created_at = Column(DateTime, default=datetime.utcnow)
    minted_at = Column(DateTime, nullable=True)
    last_refined_at = Column(DateTime, default=datetime.utcnow)
    current_version = Column(Integer, default=1)
    tags = Column(JSON, default=[])
    embedding = Column(JSON, nullable=True) # 存为 JSON 数组，SQLite 不原生支持 vector
    
    owner = relationship("User", back_populates="assets")
    versions = relationship("AssetVersion", back_populates="asset")

class AssetVersion(Base):
    __tablename__ = "asset_versions"
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    asset_id = Column(String, ForeignKey("assets.id"))
    version_num = Column(Integer, nullable=False)
    content = Column(JSON, nullable=False)
    coach_feedback = Column(JSON, default={})
    version_type = Column(String) # draft, milestone, final
    created_at = Column(DateTime, default=datetime.utcnow)
    
    asset = relationship("Asset", back_populates="versions")

class FocusSession(Base):
    __tablename__ = "focus_sessions"
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    asset_id = Column(String, ForeignKey("assets.id"), nullable=True) # 可以不关联具体资产
    duration_minutes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)