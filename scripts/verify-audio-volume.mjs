import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync("/home/ubuntu/logstory-web/client/public/logstory.html", "utf8");
const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1];
if (!script) throw new Error("inline game script not found");

function createClassList() {
  const values = new Set();
  return {
    add: (...names) => names.forEach((name) => values.add(name)),
    remove: (...names) => names.forEach((name) => values.delete(name)),
    toggle: (name, force) => {
      const next = force === undefined ? !values.has(name) : force;
      if (next) values.add(name);
      else values.delete(name);
      return next;
    },
    contains: (name) => values.has(name),
  };
}

function createElement(id) {
  return {
    id,
    classList: createClassList(),
    style: {},
    dataset: {},
    disabled: false,
    innerHTML: "",
    textContent: "",
    querySelectorAll: () => [],
    setAttribute: () => {},
    addEventListener: () => {},
    appendChild: () => {},
  };
}

const elements = new Map();
const getElement = (id) => {
  if (!elements.has(id)) elements.set(id, createElement(id));
  return elements.get(id);
};
const audio = getElement("bgm");
audio.src = "";
audio.volume = 1;
audio.paused = true;
audio.currentTime = 0;
audio.play = () => {
  audio.paused = false;
  return Promise.resolve();
};
audio.pause = () => {
  audio.paused = true;
};

class FakeAudioContext {
  constructor() {
    this.currentTime = 0;
    this.state = "running";
    this.destination = {};
  }
  createGain() {
    return {
      gain: {
        value: 0,
        setValueAtTime() {},
        exponentialRampToValueAtTime() {},
        setTargetAtTime(value) {
          this.value = value;
        },
      },
      connect() {},
    };
  }
  createOscillator() {
    return {
      type: "square",
      frequency: {
        setValueAtTime() {},
        exponentialRampToValueAtTime() {},
      },
      connect() {},
      start() {},
      stop() {},
    };
  }
  resume() {
    return Promise.resolve();
  }
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
});

vm.runInContext(script, context);
context.setAudioSetting("bgm", 1);
const bgmLevel1 = audio.volume;
context.setAudioSetting("bgm", 5);
const bgmLevel5 = audio.volume;
context.setAudioSetting("sfx", 1);
const sfxLevel1 = context.sfxVolume();
context.playSfx("hit");
context.setAudioSetting("sfx", 5);
const sfxLevel5 = context.sfxVolume();
const stored = JSON.parse(storage.get("logstory-audio-settings"));
context.loadAudioSettings();
const details = {
  bgmLevel1,
  bgmLevel5,
  sfxLevel1,
  sfxLevel5,
  stored,
  expected: { bgmLevel1: 0.04, bgmLevel5: 0.32, sfxLevel1: 0.2, sfxLevel5: 0.95 },
};
console.log(JSON.stringify(details, null, 2));
writeFileSync("/home/ubuntu/logstory-web/audio-volume-verification.json", JSON.stringify(details, null, 2));
if (bgmLevel1 !== 0.04 || bgmLevel5 !== 0.32 || sfxLevel1 !== 0.2 || sfxLevel5 !== 0.95 || stored.bgm !== 5 || stored.sfx !== 5) process.exitCode = 1;
