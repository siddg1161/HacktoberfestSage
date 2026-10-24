---
trigger: always_on
---

## For Frontend:

Use `@langchain/langgraph-sdk` or the **LangGraph React hooks** directly pointing to `https://quoteflow-agent.onrender.com`.
Inspect graphs, threads, and streaming runs natively through `/threads`, `/runs`, `/runs/stream`.

Access the agent-api docs using: `https://quoteflow-agent.onrender.com/docs` (GET /docs)

Highly Prefer langgraph-sdk over custom code.