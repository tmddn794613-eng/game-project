import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync("/home/ubuntu/logstory-web/client/public/logstory.html", "utf8");
const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1];
if (!script) throw new Error("inline game script not found");

function classList() {
  const values = new Set();
  return {
    add: (...items) => items.forEach((item) => values.add(item)),
    remove: (...items) => items.forEach((item) => values.delete(item)),
    toggle: (item, force) => {
      const next = force === undefined ? !values.has(item) : force;
      if (next) values.add(item);
      else values.delete(item);
      return next;
    },
    contains: (item) => values.has(item),
  };
}

function element(id) {
  return {
    id,
    classList: classList(),
    style: {},
    dataset: {},
    disabled: false,
    innerHTML: "",
    textContent: "",
    value: "",
    querySelectorAll: () => [],
    setAttribute: () => {},
    addEventListener: () => {},
    appendChild: () => {},
    animate: () => {},
  };
}

const elements = new Map();
const getElement = (id) => {
  if (!elements.has(id)) elements.set(id, element(id));
  return elements.get(id);
};
const audio = getElement("bgm");
audio.volume = 1;
audio.play = () => Promise.resolve();
audio.pause = () => {};

class FakeAudioContext {
  constructor() {
    this.currentTime = 0;
    this.state = "running";
    this.destination = {};
  }
  createGain() {
    return { gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} }, connect() {} };
  }
  createOscillator() {
    return { frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} };
  }
  resume() { return Promise.resolve(); }
}

const storage = new Map();
const context = vm.createContext({
  window: { AudioContext: FakeAudioContext, webkitAudioContext: FakeAudioContext },
  document: {
    getElementById: getElement,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
  },
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
  setTimeout: () => 1,
  clearTimeout: () => {},
  setInterval: () => 1,
  clearInterval: () => {},
  Math,
  Number,
  JSON,
  Promise,
  console,
  confirm: () => true,
  alert: () => {},
  Image: class {},
});

vm.runInContext(script, context);
vm.runInContext("P=newPlayer();", context);

for (let i = 0; i < 3; i += 1) vm.runInContext("completeCompanionQuest('jack');", context);
vm.runInContext("recruitCompanion('jack');", context);

const affection = vm.runInContext("P.affection.jack", context);
const questCount = vm.runInContext("P.companionQuests.jack", context);
const questItems = vm.runInContext("P.questInventory.length", context);
const recruited = vm.runInContext("P.companions.includes('jack')", context);

vm.runInContext("P.items={potion:4,mana:2,elixir:1,scroll:3};P.materials={scrap:5};P.ownedGear={weapon:['club','sword'],armor:['work','vest'],accessory:['band','scope']};clearRunInventoryOnDeath();", context);
const deathState = vm.runInContext("({items:P.items,materials:P.materials,gear:P.ownedGear,questItems:P.questInventory.length,affection:P.affection.jack,recruited:P.companions.includes('jack')})", context);

vm.runInContext("enemy={name:'검증용 적',gold:100,hp:200,maxHp:200,atk:1,lv:1,spd:75,isBoss:false,stunTurns:0,bleedTurns:0,bleedDmg:0};P.companions=['jack','luna','bella'];P.gold=0;heroGauge=0;companionAction('jack');const goldBefore=P.gold;companionAction('luna');const lunaResult={gold:P.gold,hp:enemy.hp,stole:P.gold-goldBefore};for(let i=0;i<5;i++)companionAction('bella');", context);
const partyState = vm.runInContext("({heroGauge,PGold:P.gold,enemyHp:enemy.hp,lunaGold:P.gold})", context);

const details = { affection, questCount, questItems, recruited, deathState, partyState };
console.log(JSON.stringify(details, null, 2));
writeFileSync("/home/ubuntu/logstory-web/master-spec-verification.json", JSON.stringify(details, null, 2));

const inventoryCleared = Object.values(deathState.items).every((value) => value === 0) && deathState.materials.scrap === 0 && Object.values(deathState.gear).every((list) => list.length === 1);
if (affection !== 100 || questCount !== 3 || questItems !== 3 || !recruited || !inventoryCleared || deathState.questItems !== 3 || deathState.affection !== 100 || !deathState.recruited || partyState.heroGauge !== 20 || partyState.enemyHp >= 200) process.exitCode = 1;
