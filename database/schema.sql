-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 资产表：核心总账
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- MVP 可暂时写死一个 demo_user_id
    title VARCHAR(255),
    status VARCHAR(50) DEFAULT 'incubating', -- incubating, reviewing, minted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_refined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    minted_at TIMESTAMP WITH TIME ZONE
);

-- 版本历史表：记录每一次思考的痕迹
CREATE TABLE asset_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id),
    version_num INT,
    content JSONB, -- { "what": "...", "action": "...", ... }
    coach_feedback JSONB, -- AI 的建议
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 给 assets 表增加一个字段，记录当前到了第几个版本，默认为 1
alter table assets add column current_version int default 1;

-- 1. 启用向量扩展 (这是 Supabase 的杀手锏)
create extension if not exists vector;

-- 2. 修改 assets 表，增加向量字段
-- (1536 是 OpenAI text-embedding-3-small 的维度)
alter table assets add column if not exists embedding vector(1536);

-- 3. 创建一个高性能的相似度搜索函数 (RPC)
-- 这一步很关键，它允许我们通过 API 直接调用数据库底层的向量计算
create or replace function match_assets (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_id uuid
)
returns table (
  id uuid,
  title text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    assets.id,
    assets.title,
    1 - (assets.embedding <=> query_embedding) as similarity
  from assets
  where 1 - (assets.embedding <=> query_embedding) > match_threshold
  and assets.id != filter_id -- 排除自己
  order by assets.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 增加版本类型字段
-- 枚举值: 'draft' (草稿), 'milestone' (提交审计), 'final' (入库)
alter table asset_versions add column version_type text default 'draft';

-- 给 assets 表增加 tags 字段，类型为文本数组
ALTER TABLE assets
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';


-- 1. 确保向量扩展已开启
create extension if not exists vector;

-- 2. 清理旧函数（防止冲突）
drop function if exists match_assets;

-- 3. 创建核心匹配函数 (RPC)
create or replace function match_assets (
  query_embedding vector(1536), -- 输入：当前资产的向量
  match_threshold float,        -- 输入：相似度门槛 (0-1)
  match_count int,              -- 输入：返回几个结果
  filter_id uuid                -- 输入：当前资产ID (用于排除自己)
)
returns table (
  id uuid,
  title text, -- 这里我们承诺返回 text
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    assets.id,
    assets.title::text, -- 👈 【核心修复】在这里加强制转换 (::text)
    1 - (assets.embedding <=> query_embedding) as similarity
  from assets
  where 1 - (assets.embedding <=> query_embedding) > match_threshold
  and assets.id != filter_id
  and assets.status = 'minted'
  order by assets.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 1. 开启 RLS (Row Level Security) 安全锁
alter table assets enable row level security;
alter table asset_versions enable row level security;

-- 2. 定义策略：用户只能【增删改查】自己的数据 (user_id 等于当前登录用户的 id)
-- 针对 assets 表
create policy "Users can manage their own assets"
on assets for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 针对 asset_versions 表 (需要关联 assets 表来判断权限，稍微复杂点，或者我们在 version 表也冗余存一个 user_id)
-- 为了 MVP 简单稳健，建议给 asset_versions 也加一个 user_id 字段
alter table asset_versions add column user_id uuid default auth.uid();

-- 然后给 asset_versions 加上策略
create policy "Users can manage their own versions"
on asset_versions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 1. 确保 RLS 已开启 (以防万一)
alter table assets enable row level security;
alter table asset_versions enable row level security;

-- 2. 清理旧策略 (防止冲突)
drop policy if exists "Users can see their own assets" on assets;
drop policy if exists "Users can see their own versions" on asset_versions;

-- 3. 【关键】添加 SELECT (读取) 策略
-- 允许用户查看 user_id 等于自己 UID 的资产主表
create policy "Users can see their own assets"
on assets for select
using (auth.uid() = user_id);

-- 允许用户查看 user_id 等于自己 UID 的版本表
create policy "Users can see their own versions"
on asset_versions for select
using (auth.uid() = user_id);

-- 4. 补全其他权限 (修改和删除)
create policy "Users can update their own assets"
on assets for update
using (auth.uid() = user_id);

create policy "Users can delete their own assets"
on assets for delete
using (auth.uid() = user_id);

-- 1. 允许读取 (SELECT) - 解决一直转圈看不到数据的问题
create policy "Enable select for owners"
on assets for select
using (auth.uid() = user_id);

create policy "Enable select versions for owners"
on asset_versions for select
using (auth.uid() = user_id);

-- 2. 允许修改 (UPDATE) - 解决无法盖章入库/修改标题的问题
create policy "Enable update for owners"
on assets for update
using (auth.uid() = user_id);

-- 3. 允许删除 (DELETE) - 解决无法删除资产的问题
create policy "Enable delete for owners"
on assets for delete
using (auth.uid() = user_id);

-- 暂时关闭 RLS，允许所有操作（先跑通业务逻辑）
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE asset_versions DISABLE ROW LEVEL SECURITY;

-- 1. 先开启 RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_versions ENABLE ROW LEVEL SECURITY;

-- 添加联合唯一索引
ALTER TABLE asset_versions
ADD CONSTRAINT unique_version_per_asset UNIQUE (asset_id, version_num);

-- 创建一个更智能的资产查询函数
-- 它会自动计算“有效复利值” (Compound Score)
create or replace function get_minted_assets_with_score ()
returns table (
  id uuid,
  title text,
  status text,
  created_at timestamptz,
  minted_at timestamptz,
  tags text[],
  current_version int,
  embedding vector(1536),
  compound_score bigint -- 👈 这就是我们要的真实分数
)
language plpgsql
as $$
begin
  return query
  select
    a.id,
    a.title,
    a.status,
    a.created_at,
    a.minted_at,
    a.tags,
    a.current_version,
    a.embedding,
    -- 👇 核心算法：统计该资产下，类型不是 'draft' 的版本数量，然后 * 10
    (select count(*) from asset_versions v
     where v.asset_id = a.id
     and v.version_type != 'draft') * 10 as compound_score
  from assets a
  where a.status = 'minted'
  order by a.minted_at desc;
end;
$$;

-- 向量索引表 (示意，需配合 pgvector)
-- CREATE TABLE asset_embeddings ...