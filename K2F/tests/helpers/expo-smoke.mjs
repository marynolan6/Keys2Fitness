// Test-only Hermes bridge. Uses Metro's existing ws dependency; adds no app API.
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import WebSocket from "ws";
import { isWorkoutStorageKey, captureWorkoutStorage, restoreWorkoutStorage } from "./smoke-storage.mjs";

const action = process.argv[2];
const input = action === "capture" ? null : JSON.parse(fs.readFileSync(0, "utf8"));
const metro = new URL(process.env.K2F_METRO_URL || "http://127.0.0.1:8081");
const status = await fetch(new URL("/status", metro));
if (status.headers.get("X-React-Native-Project-Root") !== fileURLToPath(new URL("../../", import.meta.url)).replace(/\/$/, "")) {
  throw new Error("Metro is not serving this K2F checkout.");
}
const functions = [isWorkoutStorageKey, captureWorkoutStorage, restoreWorkoutStorage].map((fn) => fn.toString()).join("\n");
const context = `const m = name => { const found = [...__r.getModules().entries()].find(([,v]) => v.verboseName?.endsWith(name));
  if (!found) throw new Error("Open the K2F development app first; missing " + name); return __r(found[0]); };
const storage = m("async-storage/src/AsyncStorage.native.ts").default;
const router = m("expo-router/build/exports.js").router;
const library = m("src/workouts/workoutLibraryStore.ts");
const sessions = m("src/workouts/workoutSession.ts").workoutSessionRepository;`;
// Leave the workout route before restoring storage so its controller cannot
// autosave a fixture again. Fence both adapter queues after effect cleanup.
const settle = `router.replace("/coach"); await new Promise(resolve => setTimeout(resolve, 750));
await sessions.loadWorkoutSession(${JSON.stringify(`__smoke_barrier_${Date.now()}`)});
try { await library.workoutLibraryRepository.listTemplates(); } catch { /* A failed fixture load must still be restorable. */ }`;
let operation;
if (action === "capture") operation = `${settle} return await captureWorkoutStorage(storage);`;
else if (action === "restore") operation = `${settle} return await restoreWorkoutStorage(storage, ${JSON.stringify(input)});`;
else if (action === "prepare") operation = `
  if (${JSON.stringify(input.previewClientId)} !== null) await library.workoutLibrary.setPreviewClient(${JSON.stringify(input.previewClientId)});
  for (const id of ${JSON.stringify(input.resetWorkoutIds)}) await storage.removeItem("keys2fitness:workout-session:" + id);
  return true;`;
else throw new Error("Use capture, restore (backup JSON on stdin), or prepare.");

async function execute() {
  const pages = await (await fetch(new URL("/json/list", metro))).json();
  const page = pages.filter((item) => item.appId === "host.exp.exponent").at(-1);
  if (!page) throw new Error("No Expo Go Hermes runtime is connected.");
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(page.webSocketDebuggerUrl, { origin: metro.origin });
    const key = `__k2fSmoke${Date.now()}`;
    const timer = setTimeout(() => finish(new Error("Hermes smoke cleanup timed out")), 20000);
    const finish = (error, value) => {
      clearTimeout(timer); ws.close();
      if (error) reject(error);
      else resolve(value);
    };
    const send = (id, method, params = {}) => ws.send(JSON.stringify({ id, method, params }));
    const evaluate = (id, expression) => send(id, "Runtime.evaluate", { expression, returnByValue: true });
    let result;
    ws.on("open", () => evaluate(1, `globalThis.${key}={done:false};
      (async()=>{${functions}\n${context}\n${operation}})().then(value=>globalThis.${key}={done:true,value},
      error=>globalThis.${key}={done:true,error:String(error.stack||error)}); "started"`));
    ws.on("message", (raw) => {
      const message = JSON.parse(raw);
      if (![1, 2, 3].includes(message.id)) return;
      if (message.error || message.result?.exceptionDetails) return finish(new Error(JSON.stringify(message)));
      if (message.id === 3) return finish(null, result);
      const state = message.id === 2 ? JSON.parse(message.result.result.value) : null;
      if (!state?.done) return setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) evaluate(2, `JSON.stringify(globalThis.${key})`);
      }, 100);
      if (state.error) return finish(new Error(state.error));
      result = state.value;
      evaluate(4, `delete globalThis.${key}`);
      // Reload the adapter read model after raw restoration; no stale assignments
      // or pending controllers may survive into the next walkthrough.
      if (action === "restore") send(3, "Page.reload");
      else finish(null, result);
    });
    ws.on("error", (error) => finish(error));
  });
}

let result;
for (let attempt = 0; attempt < 5; attempt++) {
  try { result = await execute(); break; }
  catch (error) {
    if (attempt === 4) throw error;
    // Android configuration changes/restarts can briefly leave a dead page in Metro.
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
console.log(JSON.stringify(result));
