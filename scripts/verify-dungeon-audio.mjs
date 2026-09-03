import { writeFileSync } from "node:fs";

const list = await fetch("http://127.0.0.1:9227/json/list").then((response) => response.json());
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

const expression = `(() => {
  const frame = document.querySelector("iframe");
  const game = frame?.contentWindow;
  const doc = frame?.contentDocument;
  if (!game || !doc) return { error: "game iframe missing" };
  const save = {P:{name:"오디오검증",job:"일반시민",level:1,xp:0,nextXp:100,gold:0,hp:100,maxHp:100,mp:30,maxMp:30,stat:{str:5,dex:5,con:5,int:5,wis:5},sp:0,skillPts:0,items:{potion:3,mana:1,elixir:0,scroll:0},weapon:{id:"club",name:"몽둥이",atk:10,mag:0,hit:99,speed:100},armor:{id:"work",name:"작업복",def:0},accessory:{id:"band",name:"팔찌",def:0,hit:0},skills:["bash"],equipLevel:{weapon:0,armor:0,accessory:0},ownedGear:{weapon:["club"],armor:["work"],accessory:["band"]},companions:[],dungeonProgress:{}},curArea:0};
  game.localStorage.setItem("logstory-save", JSON.stringify(save));
  game.loadSave();
  game.hideIntro();
  game.show("home");
  const home = { screen: doc.querySelector("#bgm")?.dataset.screen, src: doc.querySelector("#bgm")?.src || "" };
  game.show("world");
  const world = { screen: doc.querySelector("#bgm")?.dataset.screen, paused: doc.querySelector("#bgm")?.paused };
  game.enterArea(0);
  const dungeon = { screen: doc.querySelector("#bgm")?.dataset.screen, src: doc.querySelector("#bgm")?.src || "", dungeonMusic: (doc.querySelector("#bgm")?.src || "").endsWith("logstory-dungeon-01-bgm_bc61cf41.mp3") };
  const button = doc.querySelector("#dungeon button");
  button?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  const sfx = { playSfxFunction: typeof game.playSfx === "function", audioContextCreated: Boolean(game.sfxContext || game.sfxMaster) };
  game.startBattle({name:"오디오검증 적",emoji:"👾",lv:1,hp:100,atk:1,gold:0,xp:1,spd:1}, false);
  game.stopBattleTick();
  const battle = { screen: doc.querySelector("#bgm")?.dataset.screen, src: doc.querySelector("#bgm")?.src || "", dungeonMusic: (doc.querySelector("#bgm")?.src || "").endsWith("logstory-dungeon-01-bgm_bc61cf41.mp3"), paused: doc.querySelector("#bgm")?.paused };
  game.stopBattleTick();
  return { home, world, dungeon, sfx, battle };
})()`;
const result = await command("Runtime.evaluate", { awaitPromise: true, returnByValue: true, expression });
const details = result.result?.result?.value ?? { error: result.error ?? "evaluation failed" };
console.log(JSON.stringify(details, null, 2));
writeFileSync("/home/ubuntu/logstory-web/dungeon-audio-verification.json", JSON.stringify(details, null, 2));
socket.close();
if (details.error || !details.dungeon.dungeonMusic || !details.battle.dungeonMusic || !details.sfx.playSfxFunction) process.exitCode = 1;
