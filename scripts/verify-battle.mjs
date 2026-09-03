import { writeFileSync } from "node:fs";

const target = "http://127.0.0.1:3000/";
const list = await fetch("http://127.0.0.1:9224/json/list").then((r) => r.json());
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
    game.huntMonster();
    game.requestFlee();
    const fleeState = {
      button: frame.contentDocument.querySelector("#fleeBtn")?.textContent,
      modalOpen: frame.contentDocument.querySelector("#modal")?.classList.contains("show")
    };
    game.openModal("bossReady");
    const bossPopupState = {
      modalOpen: frame.contentDocument.querySelector("#modal")?.classList.contains("show"),
      hasBossAction: frame.contentDocument.querySelector("#modalbox")?.textContent.includes("보스 사냥")
    };
    game.closeModal();
    return new Promise((resolve) => setTimeout(() => {
      game.triggerMotion("#heroSprite", "attackMotion");
      const doc = frame.contentDocument;
      resolve({
        battleActive: doc.querySelector("#battle")?.classList.contains("active"),
        heroImage: doc.querySelector("#heroSprite img")?.getAttribute("src"),
        enemyImage: doc.querySelector("#enemySprite img")?.getAttribute("src"),
        hpText: doc.querySelector("#pHpText")?.textContent,
        mpText: doc.querySelector("#pMpText")?.textContent,
        xpText: doc.querySelector("#pXpText")?.textContent,
        dungeonName: doc.querySelector("#battleDungeonName")?.textContent,
        dungeonProgress: doc.querySelector("#battleDungeonProgress")?.textContent,
        headClass: doc.querySelector("#headClass")?.textContent,
        attackAnimationAvailable: typeof doc.querySelector("#heroSprite")?.animate === "function",
        heroMotionTransform: doc.querySelector("#heroSprite")?.getAnimations?.()[0]?.playState ?? "none",
        resourceFlashAvailable: typeof game.flashResourceBar === "function",
        fleeState,
        bossPopupState
      });
    }, 320));
  })()`,
});

const details = result.result?.result?.value ?? { error: result.error ?? "evaluation failed" };
console.log(JSON.stringify(details, null, 2));

const shot = await command("Page.captureScreenshot", { format: "png" });
if (shot.result?.data) writeFileSync("/home/ubuntu/screenshots/logstory-battle-test.png", Buffer.from(shot.result.data, "base64"));
socket.close();
if (details.error || !details.battleActive || !details.heroImage || !details.enemyImage || details.fleeState.modalOpen || details.fleeState.button !== "🏃 도주 예약됨" || !details.bossPopupState.hasBossAction || details.dungeonName !== "폐허 마을 외곽" || details.dungeonProgress !== "[0/10]" || !details.headClass?.startsWith("일반시민") ) process.exitCode = 1;
