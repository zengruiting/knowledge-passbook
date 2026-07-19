import os
from datetime import datetime
from uuid import uuid4
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, Header, Depends, status, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel
import numpy as np

from . import models, database, auth
from .database import engine, get_db
from .auth import get_current_user, get_password_hash, verify_password, create_access_token

# 初始化数据库
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Knowledge Passbook API (Local Mode)")
router = APIRouter(prefix="/api/knowledge")

@app.get("/api/knowledge/ping")
async def ping():
    return {"status": "ok", "message": "Knowledge API is alive"}

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件目录
GENERATED_DIR = os.path.join(os.path.dirname(__file__), "..", "generated")
os.makedirs(GENERATED_DIR, exist_ok=True)
app.mount("/static/generated", StaticFiles(directory=GENERATED_DIR), name="generated")

# --- 数据模型 (Pydantic) ---
class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class AssetContent(BaseModel):
    title: str
    what: str
    understand: str
    where: str
    action: str
    why: str

class AssetCreate(BaseModel):
    title: str

class VersionSubmit(BaseModel):
    asset_id: str
    content: AssetContent

class DraftRequest(BaseModel):
    content: AssetContent
    tags: List[str] = []
    coach_feedback: Optional[Dict] = {}

class MintRequest(BaseModel):
    content: AssetContent
    tags: List[str] = []

class RefineRequest(BaseModel):
    content: AssetContent

class SessionFinish(BaseModel):
    asset_id: str
    duration_minutes: int

class GenerateContentRequest(BaseModel):
    title: str
    what: str
    understand: str
    where: str
    action: str
    why: str
    platform: str # 'xiaohongshu' or 'douyin'

# --- 认证接口 ---

@router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="该邮箱已被注册")
    
    hashed_pwd = get_password_hash(user_data.password)
    new_user = models.User(email=user_data.email, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="邮箱或密码错误")
    
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

# --- 业务接口 ---

@router.post("/start_session")
async def start_session(
    data: AssetCreate, 
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_asset = models.Asset(
        user_id=current_user.id,
        title=data.title,
        status="incubating",
        current_version=1
    )
    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)

    # 创建初始空版本，确保“版本演进”有数据
    initial_version = models.AssetVersion(
        asset_id=new_asset.id,
        version_num=1,
        content={
            "title": data.title,
            "what": "",
            "understand": "",
            "where": "",
            "action": "",
            "why": ""
        },
        version_type="draft"
    )
    db.add(initial_version)
    db.commit()
    
    return {
        "id": new_asset.id,
        "title": new_asset.title,
        "status": new_asset.status,
        "current_version": new_asset.current_version,
        "created_at": new_asset.created_at
    }

@router.get("/incubator")
async def get_incubator(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assets = db.query(models.Asset).filter(
        models.Asset.user_id == current_user.id,
        models.Asset.status == "incubating"
    ).order_by(models.Asset.created_at.desc()).all()
    return assets

@router.get("/assets/{asset_id}")
async def get_asset_detail(
    asset_id: str, 
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    asset = db.query(models.Asset).filter(
        models.Asset.id == asset_id, 
        models.Asset.user_id == current_user.id
    ).first()
    if not asset:
        raise HTTPException(status_code=404, detail="资产不存在")
    
    latest_version = db.query(models.AssetVersion).filter(
        models.AssetVersion.asset_id == asset_id
    ).order_by(models.AssetVersion.version_num.desc()).first()
    
    content = latest_version.content if latest_version else {}
    coach_feedback = latest_version.coach_feedback if latest_version else {}
    
    return {
        "id": asset.id,
        "title": asset.title,
        "tags": asset.tags,
        "content": content,
        "coach_feedback": coach_feedback,
        "status": asset.status,
        "current_version": asset.current_version,
        "created_at": asset.created_at,
        "minted_at": asset.minted_at
    }

@router.get("/assets")
async def list_all_assets(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assets = db.query(models.Asset).filter(
        models.Asset.user_id == current_user.id
    ).order_by(models.Asset.created_at.desc()).all()
    return assets

@router.get("/assets/{asset_id}/versions")
async def get_asset_versions(
    asset_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    versions = db.query(models.AssetVersion).filter(
        models.AssetVersion.asset_id == asset_id
    ).order_by(models.AssetVersion.version_num.asc()).all()
    return versions

@router.post("/draft/{asset_id}")
async def save_draft(
    asset_id: str, 
    data: DraftRequest, 
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id, models.Asset.user_id == current_user.id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    asset.tags = data.tags
    asset.last_refined_at = datetime.utcnow()
    
    next_ver = asset.current_version + 1
    new_version = models.AssetVersion(
        asset_id=asset_id,
        version_num=next_ver,
        content=data.content.dict(),
        coach_feedback=data.coach_feedback,
        version_type="draft"
    )
    db.add(new_version)
    asset.current_version = next_ver
    db.commit()
    
    return {"status": "success", "version": next_ver}

@router.post("/refine")
@router.post("/refine/")
async def refine_asset(
    data: RefineRequest,
    x_api_key: str = Header(None),
    x_base_url: str = Header(None),
    x_model: str = Header(None),
    current_user: models.User = Depends(get_current_user)
):
    # 诊断性日志：观察所有报头
    print(f"--- REFINE REQUEST HEADERS ---")
    print(f"X-API-KEY: {x_api_key}")
    print(f"X-BASE-URL: {x_base_url}")
    print(f"X-MODEL: {x_model}")
    print(f"------------------------------")

    if not x_api_key:
        # 如果没有 Key，返回一个模拟反馈，提示用户配置
        return {
            "feedback": "检测到未配置 AI API Key。为了获得真实的认知教练反馈，请在设置中配置您的 OpenAI 或 兼容接口的 Key。",
            "suggestion": "您可以先自行完善内容，或者在右侧设置中填入有效的 API 密钥后再尝试。"
        }

    from langchain_openai import ChatOpenAI
    from langchain_core.messages import SystemMessage, HumanMessage
    import json

    base_url = x_base_url or "https://api.openai.com/v1"
    
    try:
        model_name = x_model or "gpt-4o-mini"
        print(f"DEBUG: Calling AI - Model: {model_name}, BaseURL: {base_url}")
        llm = ChatOpenAI(
            api_key=x_api_key,
            base_url=base_url,
            model=model_name,
            temperature=0.7
        )

        prompt = f"""
        你是一位深度学习教练。请审计用户的知识资产内容，指出其中的模糊点、逻辑漏洞，并给出具体的改进建议。
        
        资产标题: {data.content.title}
        核心定义 (What): {data.content.what}
        我的理解 (Understand): {data.content.understand}
        场景 (Where): {data.content.where}
        动作 (Action): {data.content.action}
        价值 (Why): {data.content.why}
        
        请以 JSON 格式返回:
        {{
            "feedback": "对内容的批判性评价或指出不清晰的地方",
            "suggestion": "具体的修改或补全建议"
        }}
        """

        response = await llm.ainvoke([
            SystemMessage(content="你是一个专业的知识管理专家和认知科学教练。请以 JSON 格式回复。"),
            HumanMessage(content=prompt)
        ])
        
        # 尝试解析 JSON
        try:
            content = response.content.replace("```json", "").replace("```", "").strip()
            result = json.loads(content)
            return result
        except:
            return {
                "feedback": response.content,
                "suggestion": "建议根据反馈进一步优化内容。"
            }

    except Exception as e:
        import traceback
        error_msg = str(e)
        print(f"AI Refine Error: {error_msg}")
        traceback.print_exc()
        
        # 针对常见错误提供更友好的提示
        friendly_error = f"AI 服务调用失败: {error_msg}"
        if "401" in error_msg or "auth" in error_msg.lower():
            friendly_error = "AI 身份验证失败，请检查设置中的 API Key 是否正确。"
        elif "404" in error_msg:
            friendly_error = "AI 模型不存在或接口地址错误，请检查设置中的模型名称和 Base URL。"
        elif "connection" in error_msg.lower() or "timeout" in error_msg.lower():
            friendly_error = "无法连接到 AI 服务，请检查您的网络连接或代理设置。"

        raise HTTPException(status_code=500, detail=friendly_error)

@router.post("/generate_content")
async def generate_content(
    data: GenerateContentRequest,
    x_api_key: str = Header(None),
    x_base_url: str = Header(None),
    x_model: str = Header(None),
    current_user: models.User = Depends(get_current_user)
):
    if not x_api_key:
        return {"content": "请在设置中配置 API Key 以便生成自媒体文案。"}

    from langchain_openai import ChatOpenAI
    from langchain_core.messages import SystemMessage, HumanMessage
    import json

    base_url = x_base_url or "https://api.openai.com/v1"
    model_name = x_model or "gpt-4o-mini"
    
    try:
        llm = ChatOpenAI(
            api_key=x_api_key,
            base_url=base_url,
            model=model_name,
            temperature=0.8
        )

        if data.platform == "xiaohongshu":
            prompt = f"""
            你是一位在小红书拥有百万粉丝的顶流知识爆款博主。你的目标是将用户的个人知识资产转化为爆款小红书笔记和极其精美的配套封面海报。
            
            用户知识资产数据:
            - 标题: {data.title}
            - 核心定义: {data.what}
            - 深度理解: {data.understand}
            - Application/应用场景: {data.where}
            - Action/推荐行动: {data.action}
            - Value/核心价值: {data.why}
            
            你的生成步骤和思考逻辑如下：
            
            第一步：撰写爆款小红书笔记正文 (note_content)
            - 笔记要口语化、接地气，多用 emoji 装饰，包含痛点共鸣、核心干货方法拆解、具体行动步骤和热门标签。
            - 笔记要能提供真正的实际价值和可落地的方案，让人看完了迫不及待想要保存收藏。
            
            第二步：设计海报卡片内容 (cover_design)
            - 主标题 (main_title)：控制在 5-10 字之间，痛点直击或颠覆认知，具有强烈的视觉冲击力和好奇心钩子。
            - 卡片内容/原副标题 (sub_title)：【这是整张海报的干货与洞见灵魂，决定海报是否会被用户截图保存】
              * **【绝对禁令】** 严禁生成简短的、空洞的单行短句或流程图公式（例如绝对不能生成类似 “愿望→意义→拆解→行动→复盘”、“只需3步助你成长”、“目标-行动-反馈”等）。这种内容冰冷干瘪，用户看了莫名其妙，毫无保存欲望！
              * **【内容要求】** 必须生成一段或两段、字数在 60-150 字之间、排版优美的高价值“核心金句/深度洞见/痛点剖析”。使用隐喻、对比或警醒的句式，触动读者的情绪，让人感觉醍醐灌顶。
              * **【排版格式】** 如果是两段，必须使用 `\n\n` 换行分隔，保证海报的卡片框内有优美的段落感。
              * **【One-Shot 黄金案例参考】**
                - 示例1（梦想/愿望主题）：
                  “梦想不是许愿池里的硬币，而是你亲手搭建的阶梯——每一步都要踩得准、站得稳、调得快！\n\n梦想决定起点，但方法、意义感和持续校准，才决定你能不能走到终点。”
                - 示例2（深度工作/专注主题）：
                  “深度工作不是把自己锁在小黑屋里苦熬，而是用物理隔离和最小动作倒推，打造一道保护心流的防火墙。\n\n别去挑战你的意志力，要用环境和机制来替你做选择，保护你最宝贵的注意力。”
                - 示例3（知识管理/学习主题）：
                  “真正的学习，从来不是把别人的PPT塞满自己的网盘，而是给混乱的旧大脑做一次外科手术。\n\n不能转化为『第一动作』的知识，都只是伪装成勤奋的大脑垃圾。”
              * 请根据当前的知识主题，精心打磨一个具有类似深度和文笔的金句段落，填入 `sub_title` 中。
            
            请严格返回以下 JSON 格式：
            {{
                "note_content": "第一步生成的笔记正文",
                "cover_design": {{
                    "main_title": "第二步设计的主标题",
                    "sub_title": "根据以上黄金案例规范生成的、高价值、金句化的卡片正文段落（60-150字，使用\\n\\n分段）"
                }}
            }}
            """
        else: # douyin
            prompt = f"""
            你是一位短视频脚本专家。请根据以下知识资产，创作一篇适合抖音/视频号的短视频脚本。
            
            资产内容:
            - 标题: {data.title}
            - 知识点: {data.what}
            - 理解: {data.understand}
            
            脚本内容应包含：黄金3秒开头、痛点描述、知识讲解、行动呼吁。
            请直接返回脚本正文。
            """

        response = await llm.ainvoke([
            SystemMessage(content="你是一个自媒体内容专家。请根据要求生成高质量内容。"),
            HumanMessage(content=prompt)
        ])
        
        return {"content": response.content}

    except Exception as e:
        print(f"Content Generation Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"生成失败: {str(e)}")

@router.post("/mint/{asset_id}")
async def mint_asset(
    asset_id: str, 
    data: MintRequest, 
    x_api_key: str = Header(None),
    x_base_url: str = Header(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id, models.Asset.user_id == current_user.id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    vector = [0.0] * 1536
    if x_api_key:
        try:
            import requests
            api_url = f"{x_base_url or 'https://api.openai.com/v1'}/embeddings"
            text_to_embed = f"标题: {data.content.title}\n核心定义: {data.content.what}\n我的理解: {data.content.understand}\n分类: {', '.join(data.tags)}"
            
            response = requests.post(
                api_url,
                headers={
                    "Authorization": f"Bearer {x_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "input": text_to_embed,
                    "model": "text-embedding-3-small"
                },
                timeout=10
            )
            if response.status_code == 200:
                res_data = response.json()
                vector = res_data["data"][0]["embedding"]
            else:
                response2 = requests.post(
                    api_url,
                    headers={
                        "Authorization": f"Bearer {x_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "input": text_to_embed,
                        "model": "text-embedding-ada-002"
                    },
                    timeout=10
                )
                if response2.status_code == 200:
                    res_data2 = response2.json()
                    vector = res_data2["data"][0]["embedding"]
        except Exception as e:
            print(f"Failed to generate embedding: {str(e)}")
    
    next_ver = asset.current_version + 1
    new_version = models.AssetVersion(
        asset_id=asset_id,
        version_num=next_ver,
        content=data.content.dict(),
        version_type="final"
    )
    db.add(new_version)
    
    asset.status = "minted"
    asset.title = data.content.title
    asset.minted_at = datetime.utcnow()
    asset.current_version = next_ver
    asset.tags = data.tags
    asset.embedding = vector
    
    db.commit()
    return {"status": "minted", "id": asset_id, "final_version": next_ver}

@router.get("/minted_assets")
async def get_minted_assets(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assets = db.query(models.Asset).filter(
        models.Asset.user_id == current_user.id,
        models.Asset.status == "minted"
    ).order_by(models.Asset.minted_at.desc()).all()
    
    return assets

@router.get("/assets/{asset_id}/related")
async def get_related_assets(
    asset_id: str, 
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not current:
        return []
    
    others = db.query(models.Asset).filter(
        models.Asset.id != asset_id,
        models.Asset.user_id == current_user.id,
        models.Asset.status == "minted"
    ).all()
    
    import numpy as np
    v1 = current.embedding
    has_v1 = v1 and any(x != 0.0 for x in v1)
    
    related = []
    for other in others:
        v2 = other.embedding
        has_v2 = v2 and any(x != 0.0 for x in v2)
        
        sim = 0.0
        reason = "相关资产"
        
        if has_v1 and has_v2:
            arr1 = np.array(v1)
            arr2 = np.array(v2)
            norm1 = np.linalg.norm(arr1)
            norm2 = np.linalg.norm(arr2)
            if norm1 > 0 and norm2 > 0:
                sim = float(np.dot(arr1, arr2) / (norm1 * norm2))
                reason = "语义关联"
        else:
            # Fallback text/tag similarity
            t_sim = 0.0
            if current.tags and other.tags:
                s1 = set(current.tags)
                s2 = set(other.tags)
                if s1.union(s2):
                    t_sim = len(s1.intersection(s2)) / len(s1.union(s2))
            
            title1 = current.title or ""
            title2 = other.title or ""
            chars1 = set(title1)
            chars2 = set(title2)
            char_sim = 0.0
            if chars1.union(chars2):
                char_sim = len(chars1.intersection(chars2)) / len(chars1.union(chars2))
                
            if t_sim > 0:
                sim = 0.5 * t_sim + 0.3 * char_sim + 0.1
                reason = "分类关联"
            elif char_sim > 0.1:
                sim = 0.6 * char_sim
                reason = "内容关联"
            else:
                sim = 0.0
        
        if sim >= 0.15:
            sim = max(0.0, min(1.0, sim))
            related.append({
                "id": other.id,
                "title": other.title,
                "reason": reason,
                "similarity": sim
            })
            
    related.sort(key=lambda x: x["similarity"], reverse=True)
    return related[:5]

@router.post("/finish_session")
async def finish_session(
    data: SessionFinish,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_session = models.FocusSession(
        user_id=current_user.id,
        asset_id=data.asset_id,
        duration_minutes=data.duration_minutes
    )
    db.add(new_session)
    db.commit()
    return {"status": "success", "session_id": new_session.id}

@router.get("/stats/daily")
async def get_daily_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from sqlalchemy import func
    from datetime import date
    
    today = date.today()
    
    # 1. 今天的专注时间
    focus_minutes = db.query(func.sum(models.FocusSession.duration_minutes)).filter(
        models.FocusSession.user_id == current_user.id,
        func.date(models.FocusSession.created_at) == today
    ).scalar() or 0
    
    # 2. 今天的铸造数量
    minted_today = db.query(func.count(models.Asset.id)).filter(
        models.Asset.user_id == current_user.id,
        models.Asset.status == "minted",
        func.date(models.Asset.minted_at) == today
    ).scalar() or 0
    
    # 3. 总资产数量
    total_assets = db.query(func.count(models.Asset.id)).filter(
        models.Asset.user_id == current_user.id,
        models.Asset.status == "minted"
    ).scalar() or 0
    
    return {
        "focus_minutes": int(focus_minutes),
        "minted_count": minted_today,
        "total_assets": total_assets
    }

@router.delete("/assets/{asset_id}")
async def delete_asset(
    asset_id: str, 
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id, models.Asset.user_id == current_user.id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    db.query(models.AssetVersion).filter(models.AssetVersion.asset_id == asset_id).delete()
    db.delete(asset)
    db.commit()
    return {"status": "success"}

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
