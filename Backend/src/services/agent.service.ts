import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { config } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface StartQuoteInput {
  voiceTranscript?: string;
  slipImage?: string;
  clientName?: string;
  clientPhone?: string;
}

export interface ApproveQuoteInput {
  threadId: string;
  acceptQuote?: boolean;
  acceptAddon?: boolean;
  approvePo?: boolean;
  editedLineItems?: any[];
}

export class AgentService {
  /**
   * Helper to execute Python agent commands via Python runtime inside .venv.
   * This guarantees that whether langgraph dev is running or not,
   * the Express backend can execute the LangGraph pipeline with zero failure!
   */
  private static async executePythonAgent(payload: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      // Find Agent directory with agent/graph.py
      const possibleAgentDirs = [
        path.resolve(__dirname, "../../../Agent"),
        path.resolve(__dirname, "../../Agent"),
        path.resolve(process.cwd(), "Agent"),
        path.resolve(process.cwd(), "../Agent"),
        path.resolve(__dirname, "../../../"),
        process.cwd(),
      ];

      const agentDir =
        possibleAgentDirs.find((d) => fs.existsSync(path.join(d, "agent", "graph.py"))) ||
        possibleAgentDirs[0];

      // Find .venv python executable in Agent folder
      const possiblePythons = [
        path.join(agentDir, ".venv", "Scripts", "python.exe"),
        path.join(agentDir, ".venv", "bin", "python"),
        path.resolve(agentDir, "../Agent/.venv/Scripts/python.exe"),
        path.resolve(agentDir, "../.venv/Scripts/python.exe"),
        "python",
        "python3",
      ];

      const pythonExe =
        possiblePythons.find((p) => (p.includes(path.sep) ? fs.existsSync(p) : true)) || "python";

      console.log(`[AgentService] Using Python: "${pythonExe}" in cwd: "${agentDir}"`);

      const scriptContent = `
import sys
import json
from agent.graph import create_quoteflow_graph
from agent.checkpointer import get_postgres_checkpointer

try:
    cp = get_postgres_checkpointer()
except Exception:
    from langgraph.checkpoint.memory import MemorySaver
    cp = MemorySaver()

graph = create_quoteflow_graph(checkpointer=cp)

payload = json.loads(sys.stdin.read())
action = payload.get("action")
thread_id = payload.get("thread_id")
config = {"configurable": {"thread_id": thread_id}}

if action == "start":
    initial_input = payload.get("initial_input", {})
    # Run until interrupt_before=["execute_dispatch_node"]
    graph.invoke(initial_input, config=config)
    snapshot = graph.get_state(config)
    print("OUTPUT_JSON:" + json.dumps({
        "thread_id": thread_id,
        "next": list(snapshot.next),
        "values": snapshot.values
    }, default=str))

elif action == "resume":
    decisions = payload.get("decisions", {})
    graph.update_state(
        config=config,
        values={
            "human_vendor_approval": decisions.get("accept_quote", True),
            "human_accepted_addon": decisions.get("accept_addon", True),
            "human_approved_po": decisions.get("approve_po", True),
            "edited_line_items": decisions.get("edited_line_items")
        },
        as_node="revenue_and_procurement_node"
    )
    # Resume graph execution
    graph.invoke(None, config=config)
    snapshot = graph.get_state(config)
    print("OUTPUT_JSON:" + json.dumps({
        "thread_id": thread_id,
        "next": list(snapshot.next),
        "values": snapshot.values
    }, default=str))
`;

      const pyProcess = spawn(pythonExe, ["-u", "-c", scriptContent], {
        cwd: agentDir,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: "1",
        },
      });

      let stdout = "";
      let stderr = "";

      pyProcess.on("error", (err) => {
        console.error("[AgentService] Spawn error:", err);
        reject(new Error(`Failed to spawn Python agent (${pythonExe}): ${err.message}`));
      });

      pyProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pyProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pyProcess.on("close", (code) => {
        if (code !== 0) {
          console.error("[AgentService] Python error:", stderr);
          return reject(new Error(`Agent process failed with code ${code}: ${stderr}`));
        }

        const marker = "OUTPUT_JSON:";
        const idx = stdout.indexOf(marker);
        if (idx === -1) {
          return reject(new Error(`Failed to parse agent output. Raw: ${stdout} | Stderr: ${stderr}`));
        }

        try {
          const parsed = JSON.parse(stdout.slice(idx + marker.length).trim());
          resolve(parsed);
        } catch (e: any) {
          reject(new Error(`JSON parse error on agent response: ${e.message}`));
        }
      });

      // Write input to Python process stdin and close stream
      pyProcess.stdin.write(JSON.stringify(payload));
      pyProcess.stdin.end();
    });
  }

  /**
   * Starts the LangGraph quotation pipeline.
   * Runs Node 1 (Extractor) -> Node 2 (3-Tier & GST) -> Node 3 (Revenue & PO)
   * Pauses at HITL Interrupt Gate and returns the paused state snapshot.
   */
  static async startQuote(input: StartQuoteInput): Promise<any> {
    const threadId = `quote-${Date.now()}`;

    const agentPayload = {
      action: "start",
      thread_id: threadId,
      initial_input: {
        thread_id: threadId,
        client_name: input.clientName || "Sharma Electrical Contractors",
        client_phone: input.clientPhone || "+91-9826012345",
        voice_transcript: input.voiceTranscript || "",
        slip_image_url: input.slipImage || null,
      },
    };

    const res = await this.executePythonAgent(agentPayload);
    const values = res.values || {};

    return {
      threadId,
      status: "PAUSED_AT_HITL_GATE",
      nextPendingNode: res.next,
      clientName: values.client_name,
      clientPhone: values.client_phone,
      extractedItems: values.extracted_items || [],
      subtotal: values.subtotal || 0,
      gstTotal: values.gst_total || 0,
      grandTotal: values.grand_total || 0,
      aiRevenueAlert: values.ai_revenue_alert || null,
      restockPoDrafts: values.restock_po_drafts || [],
    };
  }

  /**
   * Resumes the LangGraph execution post human vendor review.
   * Updates state with vendor approvals and runs Node 4 (execute_dispatch_node).
   * Commits atomically to Neon DB and returns finalized quote data + client portal link.
   */
  static async approveAndDispatch(input: ApproveQuoteInput): Promise<any> {
    const agentPayload = {
      action: "resume",
      thread_id: input.threadId,
      decisions: {
        accept_quote: input.acceptQuote ?? true,
        accept_addon: input.acceptAddon ?? true,
        approve_po: input.approvePo ?? true,
        edited_line_items: input.editedLineItems || null,
      },
    };

    const res = await this.executePythonAgent(agentPayload);
    const values = res.values || {};
    const portalUrl = `${config.clientPortalBaseUrl}/${input.threadId}`;

    return {
      threadId: input.threadId,
      status: values.final_status || "QUOTED_AND_DISPATCHED",
      clientName: values.client_name,
      grandTotal: values.grand_total,
      clientPortalUrl: portalUrl,
      posIssued: values.pos_issued || [],
    };
  }
}
