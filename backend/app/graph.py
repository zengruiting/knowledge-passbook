from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
import json
from langchain_openai import ChatOpenAI

# 模拟 LLM 以便无 Key 运行
class MockLLM:
    def invoke(self, messages):
        return SystemMessage(content="""
        {
            "feedback": "这里提到的‘底层逻辑’有点抽象。",
            "highlight": "底层逻辑",
            "suggestion": "能举个具体的例子吗？比如在超市排队时怎么用？"
        }
        """)


class AgentState(TypedDict):
    content: dict
    feedback: dict
    status: str


# 1. 教练节点：分析内容
# 修改节点函数，增加 config 参数
def coach_node(state: AgentState, config: RunnableConfig):
    print(f"--- AI Coach Analyzing ---")

    # 1. 从 config 中提取前端传来的 Key
    runtime_conf = config.get("configurable", {})
    api_key = runtime_conf.get("api_key")
    base_url = runtime_conf.get("base_url")
    model_name = runtime_conf.get("model")

    if not api_key:
        return {"feedback": {"error": "No API Key provided"}, "status": "error"}

    # 2. 动态初始化 LLM (这是 BYOK 的核心)
    # 这一步非常快，不会有性能问题
    llm = ChatOpenAI(
        api_key=api_key,
        base_url=base_url,
        model=model_name,
        temperature=0.5
    )

    # 3. 构造 Prompt
    content_text = str(state['content'])
    prompt = f"""
    你是认知教练。请分析以下知识卡片：
    {content_text}
    请以 JSON 格式返回：
    1. feedback: 发现的模糊点
    2. highlight: 原文中的模糊词
    3. suggestion: 具体修改建议
    """

    # 4. 调用 AI
    try:
        response = llm.invoke([SystemMessage(content=prompt)])

        # 清洗数据
        content_str = response.content.strip()
        if content_str.startswith("```"):
            content_str = content_str.strip("`").replace("json", "").strip()

        feedback_data = json.loads(content_str)

        # 【核心修复】数据清洗逻辑
        # 如果 AI 不听话返回了列表（数组），我们手动把它拼成字符串
        if isinstance(feedback_data.get('feedback'), list):
            feedback_data['feedback'] = "\n".join([str(item) for item in feedback_data['feedback']])

        if isinstance(feedback_data.get('suggestion'), list):
            feedback_data['suggestion'] = "\n".join([str(item) for item in feedback_data['suggestion']])

        return {"feedback": feedback_data, "status": "reviewing"}

    except Exception as e:
        print(f"AI Call Failed: {e}")
        return {"feedback": {"feedback": "AI 调用失败，请检查 Key", "suggestion": str(e)}, "status": "error"}

# 2. 入库节点：生成向量并保存
def mint_node(state: AgentState):
    print("--- Minting Asset to Vector DB ---")
    # 这里调用 Pinecone/Supabase Vector
    return {"status": "minted"}


# 构建图
workflow = StateGraph(AgentState)
workflow.add_node("coach", coach_node)
workflow.add_node("mint", mint_node)

# 设置流转
workflow.set_entry_point("coach")
workflow.add_edge("coach", END)  # MVP 简化：Coach 给完建议就结束，等待用户前端确认
workflow.add_edge("mint", END)

app_graph = workflow.compile()
