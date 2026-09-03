import { writeFileSync } from "node:fs";

const list = await fetch("http://127.0.0.1:9226/json/list").then((r) => r.json());
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
await new Promise((resolve) => setTimeout(resolve, 900));

const expression = `(async () => {
  const frame = document.querySelector("iframe");
  const game = frame?.contentWindow;
  const doc = frame?.contentDocument;
  if (!game || !doc) return { error: "game iframe missing" };
  const freshPlayer = (job) => ({
    name: "검증용", job, level: 5, xp: 0, nextXp: 100, gold: 0,
    hp: 20, maxHp: 178, mp: 10, maxMp: 60,
    stat: {str: 8, dex: 20, con: 5, int: 8, wis: 5}, sp: 0, skillPts: 0,
    items: {potion: 3, mana: 1, elixir: 0, scroll: 0},
    weapon: {id: "club", name: "검증 몽둥이", atk: 20, mag: 0, hit: 99, speed: 100, price: 0},
    armor: {id: "work", name: "작업복", def: 0},
    accessory: {id: "band", name: "팔찌", def: 0, hit: 0},
    skills: ["bash"], equipLevel: {weapon: 0, armor: 0, accessory: 0},
    ownedGear: {weapon: ["club"], armor: ["work"], accessory: ["band"]},
    companions: [], dungeonProgress: {}
  });
  const enemy = {name: "검증용 적", emoji: "👾", lv: 1, hp: 300, atk: 1, gold: 0, xp: 1, spd: 1};
  const runJob = async (job) => {
    game.stopBattleTick();
    game.localStorage.setItem("logstory-save", JSON.stringify({P: freshPlayer(job), curArea: 0}));
    game.loadSave();
    game.hideIntro();
    game.startBattle(enemy, false);
    game.stopBattleTick();
    await new Promise((resolve) => setTimeout(resolve, 500));
    for (let i = 0; i < 40; i++) game.tickBattle();
    const readyText = doc.querySelector("#heroReadyTag")?.textContent || "";
    const hpText = doc.querySelector("#pHpText")?.textContent || "";
    const mpText = doc.querySelector("#pMpText")?.textContent || "";
    const beforeAttackLog = doc.querySelector("#log")?.textContent || "";
    const enemyGaugeBefore = doc.querySelector("#eGaugeBar")?.style.width || "";
    for (let i = 0; i < 4; i++) game.tickBattle();
    const enemyGaugeAfter = doc.querySelector("#eGaugeBar")?.style.width || "";
    game.attack();
    const afterActionTag = doc.querySelector("#heroReadyTag")?.textContent || "";
    const afterAttackLog = doc.querySelector("#log")?.textContent || "";
    const heroImage = doc.querySelector("#heroSprite img");
    const heroCanvas = doc.querySelector("#heroSprite canvas");
    const heroRect = doc.querySelector("#heroSprite")?.getBoundingClientRect();
    const heroCanvasCornerAlpha = heroCanvas ? heroCanvas.getContext("2d").getImageData(0,0,1,1).data[3] : -1;
    return {job, readyText, hpText, mpText, beforeAttackLog, afterAttackLog, enemyGaugeBefore, enemyGaugeAfter, manualEnemyGaugeStayedStopped: enemyGaugeBefore === enemyGaugeAfter, afterActionTag, heroImageLoaded: !!heroImage?.complete && heroImage.naturalWidth > 0, heroImageNaturalWidth: heroImage?.naturalWidth || 0, heroCanvasCreated: !!heroCanvas, heroCanvasSource: heroCanvas?.dataset.source || "", heroCanvasCornerAlpha, heroRect: heroRect ? {left: heroRect.left, top: heroRect.top, width: heroRect.width, height: heroRect.height} : null};
  };
  const descriptions = (async () => {
    game.stopBattleTick();
    game.localStorage.setItem("logstory-save", JSON.stringify({P: freshPlayer("일반시민"), curArea: 0}));
    game.loadSave();
    game.openModal("job");
    await new Promise((resolve) => setTimeout(resolve, 500));
    const text = doc.querySelector("#modalbox")?.innerText || "";
    const previewCount = doc.querySelectorAll(".jobPreview img, .jobPreview canvas").length;
    game.closeModal();
    return {text, previewCount};
  })();
  const descriptionsText = await descriptions;
  const results = [await runJob("현장직원"), await runJob("도둑"), await runJob("마술사")];
  game.stopBattleTick();
  return {
    descriptionsIncludeField: descriptionsText.text.includes("현장 회복"),
    descriptionsIncludeThief: descriptionsText.text.includes("첫 수의 기회"),
    descriptionsIncludeMage: descriptionsText.text.includes("마력 충전"),
    descriptionsIncludePreview: descriptionsText.text.includes("전직 후 모습 미리보기"),
    previewImageCount: descriptionsText.previewCount,
    results,
    activeSprite: doc.querySelector("#heroSprite img")?.getAttribute("src") || doc.querySelector("#heroSprite canvas")?.dataset.source || "",
    canvasCount: doc.querySelectorAll("#heroSprite canvas").length
  };
})()`;
const result = await command("Runtime.evaluate", {awaitPromise: true, returnByValue: true, expression});
const details = result.result?.result?.value ?? {error: result.error ?? "evaluation failed"};
console.log(JSON.stringify(details, null, 2));
const shot = await command("Page.captureScreenshot", {format: "png"});
if (shot.result?.data) writeFileSync("/home/ubuntu/screenshots/logstory-job-passives-test.png", Buffer.from(shot.result.data, "base64"));
socket.close();
const allText = JSON.stringify(details);
if (details.error || !details.descriptionsIncludeField || !details.descriptionsIncludeThief || !details.descriptionsIncludeMage || !details.descriptionsIncludePreview || details.previewImageCount < 2 || !details.activeSprite.includes("cutout") || !allText.includes("현장 회복") || !allText.includes("마력 충전") || !allText.includes("도둑 패시브") || !details.results.every((item) => item.manualEnemyGaugeStayedStopped && item.heroCanvasCreated && item.heroCanvasCornerAlpha === 0)) process.exitCode = 1;
