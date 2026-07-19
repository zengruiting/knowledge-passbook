from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# 获取 .env 文件路径并加载环境变量
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
env_path = os.path.join(backend_dir, ".env")
load_dotenv(dotenv_path=env_path)

# 动态获取数据库连接，如未配置则降级为本地 SQLite
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./knowledge_passbook.db")

is_sqlite = SQLALCHEMY_DATABASE_URL.startswith("sqlite")

if is_sqlite:
    # SQLite 专用连接参数
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL/MySQL 生产级连接池参数，防止高并发下连接耗尽
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_size=10,          # 连接池的基础连接数
        max_overflow=20,       # 允许超出的最大连接数
        pool_recycle=3600,     # 连接回收时间（秒）
        pool_pre_ping=True     # 在取出连接前先进行 ping 检测，防止连接失效报错
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# 获取数据库会话的依赖项
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

