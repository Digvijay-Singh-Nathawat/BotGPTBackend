import { spawn, ChildProcess } from "child_process";
import path from "path";

let pythonProcess: ChildProcess | null = null;
let isRestarting = false;

export function startPythonBackend(): void {
  if (pythonProcess || isRestarting) {
    console.log("[Python] Already running or restarting");
    return;
  }
  
  isRestarting = true;
  const botGptPath = path.join(process.cwd(), "bot-gpt");
  
  console.log("[Python] Starting FastAPI backend...");
  
  pythonProcess = spawn("python", ["-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"], {
    cwd: botGptPath,
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
    detached: false
  });
  
  pythonProcess.stdout?.on("data", (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line.includes("Application startup complete")) {
        console.log("[Python] Backend ready!");
      } else if (line.includes("ERROR") || line.includes("Traceback")) {
        console.error("[Python]", line);
      }
    }
  });
  
  pythonProcess.stderr?.on("data", (data) => {
    const output = data.toString().trim();
    if (output.includes("INFO") || output.includes("Started server")) {
      console.log("[Python]", output.split('\n')[0]);
    } else {
      console.error("[Python Error]", output);
    }
  });
  
  pythonProcess.on("error", (err) => {
    console.error("[Python] Failed to start:", err.message);
    pythonProcess = null;
    isRestarting = false;
  });
  
  pythonProcess.on("close", (code) => {
    console.log(`[Python] Process exited with code ${code}`);
    pythonProcess = null;
    isRestarting = false;
    
    if (code !== 0) {
      console.log("[Python] Will attempt restart in 5 seconds...");
      setTimeout(() => startPythonBackend(), 5000);
    }
  });
  
  setTimeout(() => {
    isRestarting = false;
  }, 3000);
}

export function stopPythonBackend(): void {
  if (pythonProcess) {
    console.log("[Python] Stopping backend...");
    pythonProcess.kill("SIGTERM");
    pythonProcess = null;
  }
}

export function isPythonRunning(): boolean {
  return pythonProcess !== null && !pythonProcess.killed;
}

process.on("exit", stopPythonBackend);
process.on("SIGINT", () => {
  stopPythonBackend();
  process.exit(0);
});
process.on("SIGTERM", () => {
  stopPythonBackend();
  process.exit(0);
});
