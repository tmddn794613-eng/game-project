import { writeFileSync } from "node:fs";

const list = await fetch("http://127.0.0.1:9225/json/list").then((r) => r.json());
const page = list.find((item) => item.type === "page");
if (!page?.webSocketDebuggerUrl) throw new Error("Chrome CDP page target not found");

const socket = new WebSocket(page.webSocketDebuggerUrl);
let sequence = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }
});
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});
function command(method, params = {}) {
  return new Promise((resolve) => {
    const id = ++sequence;
    pending.set(id, resolve);
    socket.send(JSON.stringify({ id, method, params }));
  });
}
await command("Page.enable");
await command("Runtime.enable");
await new Promise((resolve) => setTimeout(resolve, 800));
const result = await command("Runtime.evaluate", {
  awaitPromise: true,
  returnByValue: true,
  expression: `(() => {
    const frame = document.querySelector("iframe");
    const game = frame?.contentWindow;
    if (!game) return { error: "game iframe missing" };
    game.newGame();
    const doc = frame.contentDocument;
    return {
      homeActive: doc.querySelector("#home")?.classList.contains("active"),
      homeBackground: getComputedStyle(doc.querySelector("#home")).backgroundImage,
      titleVisible: Boolean(doc.querySelector("#campTitle")?.textContent),
      newGameVisible: Boolean(doc.querySelector("#home button")?.textContent)
    };
  })()`,
});
const details = result.result?.result?.value ?? { error: result.error ?? "evaluation failed" };
console.log(JSON.stringify(details, null, 2));
const shot = await command("Page.captureScreenshot", { format: "png" });
if (shot.result?.data) writeFileSync("/home/ubuntu/screenshots/logstory-home-background-test.png", Buffer.from(shot.result.data, "base64"));
socket.close();
if (details.error || !details.homeActive || !details.homeBackground.includes("logstory-home-twilight-pixel")) process.exitCode = 1;
