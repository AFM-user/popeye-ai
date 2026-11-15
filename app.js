// Popeye AI - offline AI chat and adventures. Runs a local model with WebLLM.
const APP_VERSION = '1.2.0';
const STORE_KEY = 'popeye.v1';
const LOADING_KEY = 'popeye.loading';
const WEBLLM_URL = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.86/+esm';
const WEBLLM_OLD = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.79/+esm';
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const SAFE_DEFAULT = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';
const BT = String.fromCharCode(96);
const QWEN15_LIB = 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_86/base/Qwen2-1.5B-Instruct-q4f16_1_cs1k-webgpu.wasm';

const LLAMA1B_OLD_LIB = 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Llama-3.2-1B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm';
const QWEN3_06_LIB = 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_86/base/Qwen3-0.6B-q4f16_1_cs1k-webgpu.wasm';
const CUSTOM_MODELS = [
  { model: 'https://huggingface.co/Jay0628/Dolphin3.0-Qwen2.5-1.5B-MLC-q4f16_1', model_id: 'Dolphin3.0-Qwen2.5-1.5B-MLC-q4f16_1', model_lib: QWEN15_LIB, vram_required_MB: 1629.75, low_resource_required: true, overrides: { context_window_size: 4096 } },
  { model: 'https://huggingface.co/Sandoche/Llama-3.2-1B-Instruct-abliterated-q4f16_1-MLC', model_id: 'Llama-3.2-1B-Instruct-abliterated-q4f16_1-MLC', model_lib: LLAMA1B_OLD_LIB, vram_required_MB: 879, low_resource_required: true, webllm: 'old', overrides: { context_window_size: 4096 } },
  { model: 'https://huggingface.co/Jay0628/Qwen3-0.6B-abliterated-MLC-q4f16_1', model_id: 'Qwen3-0.6B-abliterated-MLC-q4f16_1', model_lib: QWEN3_06_LIB, vram_required_MB: 1403, low_resource_required: true, overrides: { context_window_size: 4096 } },
  { model: 'https://huggingface.co/RickyRoscoe/Dolphin3.0-Llama3.2-1B-q4f16_1-MLC', model_id: 'Dolphin3.0-Llama3.2-1B-q4f16_1-MLC', model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_86/base/Llama-3.2-1B-Instruct-q4f16_1_cs1k-webgpu.wasm', vram_required_MB: 879.04, low_resource_required: true, overrides: { context_window_size: 4096 } },
  { model: 'https://huggingface.co/Jay0628/Dolphin3.0-Qwen2.5-0.5B-MLC-q4f16_1', model_id: 'Dolphin3.0-Qwen2.5-0.5B-MLC-q4f16_1', model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_86/base/Qwen2-0.5B-Instruct-q4f16_1_cs1k-webgpu.wasm', vram_required_MB: 944.62, low_resource_required: true, overrides: { context_window_size: 4096 } },
  { model: 'https://huggingface.co/Jay0628/SmolLM2-360M-heretic-MLC-q4f16_1', model_id: 'SmolLM2-360M-heretic-MLC-q4f16_1', model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_86/base/SmolLM2-360M-Instruct-q4f16_1_cs1k-webgpu.wasm', vram_required_MB: 376.06, low_resource_required: true, overrides: { context_window_size: 4096 } },
  { model: 'https://huggingface.co/willopcbeta/DeepSeek-R1-Distill-Qwen-1.5B-abliterated-q4f16_1-MLC', model_id: 'DeepSeek-R1-Distill-Qwen-1.5B-abliterated-q4f16_1-MLC', model_lib: 'https://huggingface.co/mitulagr2/DeepSeek-R1-Distill-Qwen-1.5B-q4f16_1-MLC/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B-q4f16_1-MLC-webgpu.wasm', vram_required_MB: 1800, low_resource_required: true, webllm: 'old', overrides: { context_window_size: 4096 } }
];

const RECOMMENDED = [
  { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', label: 'Qwen 2.5 1.5B', note: 'best all-round for iPhone' },
  { id: 'Dolphin3.0-Qwen2.5-1.5B-MLC-q4f16_1', label: 'Dolphin 3.0 Qwen 2.5 1.5B', note: 'uncensored, same size as Qwen' },
  { id: 'Llama-3.2-1B-Instruct-abliterated-q4f16_1-MLC', label: 'Llama 3.2 1B (abliterated)', note: 'no refusals, fast and light' },
  { id: 'Qwen3-0.6B-abliterated-MLC-q4f16_1', label: 'Qwen 3 0.6B (abliterated)', note: 'no refusals, tiny and fastest, weakest' },
  { id: 'Dolphin3.0-Llama3.2-1B-q4f16_1-MLC', label: 'Dolphin 3.0 Llama 3.2 1B', note: 'uncensored, fast and light' },
  { id: 'Dolphin3.0-Qwen2.5-0.5B-MLC-q4f16_1', label: 'Dolphin 3.0 Qwen 2.5 0.5B', note: 'uncensored, tiny and fast, weaker' },
  { id: 'SmolLM2-360M-heretic-MLC-q4f16_1', label: 'SmolLM2 360M (heretic)', note: 'no refusals, smallest, very basic' },
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 1B', note: 'fast and light' },
  { id: 'gemma3-1b-it-q4f16_1-MLC', label: 'Gemma 3 1B', note: 'light' },
  { id: 'Qwen3-1.7B-q4f16_1-MLC', label: 'Qwen 3 1.7B', note: 'may be tight' },
  { id: 'DeepSeek-R1-Distill-Qwen-1.5B-abliterated-q4f16_1-MLC', label: 'DeepSeek R1 1.5B (abliterated)', note: 'crashes on iPhone, PC only', heavy: true },
  { id: 'Hermes-3-Llama-3.2-3B-q4f16_1-MLC', label: 'Hermes 3 Llama 3.2 3B', note: 'too big for iPhone', heavy: true },
  { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 3B', note: 'too big for iPhone', heavy: true },
  { id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC', label: 'Qwen 2.5 3B', note: 'too big for iPhone', heavy: true }
];

// 42 portraits: gender then tags
const FACES = [
  'm young modern', 'm young modern', 'm adult modern', 'm adult modern', 'm old modern', 'm adult modern arab',
  'f young modern', 'f adult modern', 'f adult modern', 'f old modern', 'f adult modern', 'f adult modern hijab',
  'm young modern boy', 'm old modern scholar', 'f adult modern', 'f young modern', 'm adult modern', 'f old modern',
  'm young modern', 'f old modern', 'f young modern girl', 'f adult modern', 'm old modern wizard', 'f young modern girl',
  'f elf noble', 'm elf drow dark', 'f elf wood druid', 'm dwarf', 'f dwarf', 'm halfling hobbit',
  'f tiefling demon', 'm tiefling demon', 'm orc', 'f orc', 'm dragonborn dragon lizard', 'f dragonborn dragon kobold lizard',
  'f gnome', 'm goblin', 'f catfolk tabaxi cat leopard', 'm catfolk tabaxi cat tiger', 'f aasimar angel celestial', 'm goliath giant'
];
const RACES = ['elf', 'drow', 'dwarf', 'halfling', 'hobbit', 'tiefling', 'demon', 'orc', 'dragonborn', 'dragon', 'lizard', 'kobold', 'gnome', 'goblin', 'catfolk', 'tabaxi', 'cat', 'leopard', 'tiger', 'aasimar', 'angel', 'goliath', 'giant'];
const EMOJIS = ['🙂', '💬', '✍️', '🌐', '📝', '🎓', '💡', '📖', '🎲', '🧙', '🤖', '🐉', '👑', '🦊', '🗡️', '🕵️', '🏴‍☠️', '🚀'];

const SETTINGS = {
  fantasy: { label: 'Fantasy', e: '🏰', scene: 'town', desc: 'a classic sword-and-sorcery fantasy world of kingdoms, monsters and magic' },
  scifi: { label: 'Sci-fi', e: '🚀', scene: 'travel', desc: 'a gritty space-faring science-fiction future of starships, stations and aliens' },
  horror: { label: 'Horror', e: '🕯️', scene: 'night', desc: 'a creeping gothic horror setting where something is very wrong' },
  pirates: { label: 'Pirates', e: '🏴‍☠️', scene: 'port', desc: 'the golden age of piracy on dangerous seas full of treasure and navies' },
  mystery: { label: 'Modern mystery', e: '🕵️', scene: 'town', desc: 'a modern-day city full of secrets, crime and suspects' },
  custom: { label: 'Custom', e: '✨', scene: 'travel', desc: '' }
};
const TONES = ['Serious', 'Funny', 'Dark', 'Cozy', 'Epic'];
const CLASSES = { fantasy: ['Warrior', 'Rogue', 'Mage', 'Ranger', 'Cleric', 'Bard'], scifi: ['Pilot', 'Soldier', 'Engineer', 'Smuggler', 'Medic'], horror: ['Investigator', 'Priest', 'Doctor', 'Survivor'], pirates: ['Captain', 'Gunner', 'Navigator', 'Swashbuckler'], mystery: ['Detective', 'Journalist', 'Hacker', 'Lawyer'], custom: ['Hero', 'Explorer', 'Rogue'] };
const STARTER = { Warrior: ['sword', 'shield', 'rations'], Rogue: ['two daggers', 'lockpicks', 'dark cloak'], Mage: ['staff', 'spellbook', 'healing potion'], Ranger: ['bow', 'arrows', 'rope'], Cleric: ['mace', 'holy symbol', 'healing potion'], Bard: ['lute', 'rapier', 'fine clothes'], Pilot: ['blaster pistol', 'flight jacket', 'med-kit'], Soldier: ['rifle', 'armour vest', 'grenade'], Engineer: ['multitool', 'scanner', 'spare parts'], Smuggler: ['blaster pistol', 'fake ID', 'credits chip'], Medic: ['med-kit', 'stim pack', 'scanner'], Captain: ['cutlass', 'pistol', 'spyglass'], Gunner: ['pistol', 'powder horn', 'cutlass'], Navigator: ['sea charts', 'compass', 'dagger'], Swashbuckler: ['rapier', 'grappling hook', 'bottle of rum'], Detective: ['notebook', 'flashlight', 'badge'], Journalist: ['phone', 'notebook', 'press pass'], Hacker: ['laptop', 'USB drive', 'energy drink'], Lawyer: ['briefcase', 'phone', 'business cards'], Investigator: ['lantern', 'notebook', 'revolver'], Priest: ['holy water', 'cross', 'old bible'], Doctor: ['medical bag', 'scalpel', 'lantern'], Survivor: ['flashlight', 'crowbar', 'bandages'] };
const COMPANIONS = {
  fantasy: [{ name: 'Eldra', gender: 'f', face: 'f26', desc: 'elf ranger; calm, sharp-eyed, protective, dry humour' }, { name: 'Bram', gender: 'm', face: 'f27', desc: 'dwarf fighter; gruff, loyal, loves ale and gold' }],
  scifi: [{ name: 'Nova', gender: 'f', face: 'f10', desc: 'cocky ace pilot who jokes under pressure' }, { name: 'Vex', gender: 'm', face: 'f41', desc: 'stoic security officer of few words' }],
  horror: [{ name: 'Mara', gender: 'f', face: 'f21', desc: 'sceptical journalist who wants the truth' }, { name: 'Father Elias', gender: 'm', face: 'f13', desc: 'nervous old priest hiding a secret' }],
  pirates: [{ name: 'Rosa', gender: 'f', face: 'f28', desc: 'bold quartermaster, greedy, quick with a cutlass' }, { name: 'Fin', gender: 'm', face: 'f37', desc: 'sneaky goblin cabin boy who knows every rumour' }],
  mystery: [{ name: 'Hana', gender: 'f', face: 'f14', desc: 'sharp, impatient police detective' }, { name: 'Old Tom', gender: 'm', face: 'f22', desc: 'retired cop, slow but wise' }],
  custom: []
};
const SCENES = {
  town: { e: '🏘️', l: 'Town', m: ['town', 'tavern', 'port'] }, tavern: { e: '🍺', l: 'Tavern', m: ['tavern', 'town'] },
  forest: { e: '🌲', l: 'Wilds', m: ['forest', 'travel'] }, travel: { e: '🧭', l: 'Journey', m: ['travel', 'travel2', 'forest'] },
  dungeon: { e: '🕳️', l: 'Dungeon', m: ['dungeon', 'tension', 'snow'] }, castle: { e: '🏰', l: 'Castle', m: ['castle', 'town'] },
  port: { e: '⚓', l: 'Port', m: ['port', 'town'] }, shop: { e: '🛒', l: 'Shop', m: ['shop', 'town'] },
  battle: { e: '⚔️', l: 'Battle', m: ['battle', 'battle2'] }, boss: { e: '🐉', l: 'Boss fight', m: ['boss', 'boss2', 'final', 'battle'] },
  victory: { e: '🏆', l: 'Victory', m: ['victory'] }, night: { e: '🌙', l: 'Night', m: ['night', 'tension'] },
  snow: { e: '❄️', l: 'Frozen lands', m: ['snow', 'dungeon'] }, tension: { e: '⚠️', l: 'Danger', m: ['tension', 'dungeon'] },
  sad: { e: '💧', l: 'Sorrow', m: ['sad', 'night'] }
};
const MUSIC_SLOTS = [['title', 'Title'], ['town', 'Town'], ['tavern', 'Tavern'], ['port', 'Port'], ['shop', 'Shop'], ['forest', 'Forest'], ['travel', 'Journey'], ['travel2', 'Journey 2'], ['dungeon', 'Dungeon'], ['castle', 'Castle'], ['snow', 'Frozen'], ['night', 'Night'], ['tension', 'Danger'], ['battle', 'Battle'], ['battle2', 'Battle 2'], ['boss', 'Boss'], ['boss2', 'Boss 2'], ['final', 'Final battle'], ['victory', 'Victory'], ['sad', 'Sad'], ['hope', 'Hope'], ['ending', 'Ending']];
const TRACKS = [[/decisive battle 1/i, 'boss', 0.167, 107.502], [/decisive battle 2/i, 'boss2', 13.846, 82.308], [/final battle/i, 'final', 36.416, 92.6], [/battle 1/i, 'battle', 10.76, 62.608], [/battle 2/i, 'battle2', 0.63, 63.278], [/victory/i, 'victory', 8.501, 32.0], [/port town/i, 'port', 2.135, 76.8], [/firelight/i, 'tavern', 2.675, 71.287], [/our town/i, 'town', 23.106, 74.483], [/shop/i, 'shop', 0, 53.615], [/lost shrine/i, 'dungeon', 0, 92.957], [/mighty kingdom/i, 'castle', 11.503, 54.715], [/frozen abyss/i, 'snow', 0, 73.41], [/peaceful night/i, 'night', 0, 0], [/calm before/i, 'tension', 2.438, 83.267], [/winds roam/i, 'travel', 0.639, 66.032], [/the journey/i, 'travel2', 0, 0], [/never give up/i, 'hope', 0, 0], [/final of the fantasy/i, 'ending', 5.337, 114.667], [/title theme/i, 'title', 0, 0], [/falling apart/i, 'sad', 0, 0], [/silent forest/i, 'forest', 0, 85.807]];

const LIMITS = 'Runs offline on your phone: no internet, no news, and it can be wrong. Small models are good at rewriting, summarising, explaining, translating and ideas, and weak at facts and maths.';

function defaultPersonas() {
  return [
    { id: 'assistant', group: 'everyday', name: 'Assistant', emoji: '💬', face: 'f06', temp: 0.6, desc: 'Answers anything', prompt: 'You are Popeye, a helpful, friendly assistant that runs fully offline on the user\'s phone. You have no internet access and no knowledge of recent events; say so if asked about news, prices or live data. Answer clearly and concisely. Use markdown lists, tables or code blocks when they help. If you are not sure, say so instead of guessing.', quick: [['Summarise', 'Summarise this in 3 short bullet points:', 'Summarise your last reply in 3 short bullet points.'], ['Explain simply', 'Explain this simply, like I am 12:', 'Explain that more simply, like I am 12.'], ['Translate', 'Translate this to Malay (or to English if it is already Malay):', 'Translate your last reply to Malay.'], ['Make it formal', 'Rewrite this in a formal, polite tone:', 'Rewrite your last reply in a formal tone.'], ['Bullet points', 'Turn this into clear bullet points:', 'Turn that into clear bullet points.']] },
    { id: 'writer', group: 'everyday', name: 'Writer', emoji: '✍️', face: 'f21', temp: 0.7, desc: 'Emails, messages, rewrites', prompt: 'You are a skilled writing assistant. Help the user write and rewrite emails, messages, posts and documents. Match the tone they ask for. When rewriting, give only the rewritten text unless they ask for options. Keep their meaning; do not invent facts.', quick: [['Formal', 'Rewrite this in a formal tone:', 'Make that more formal.'], ['Friendly', 'Rewrite this in a warm, friendly tone:', 'Make that friendlier.'], ['Shorter', 'Make this shorter and clearer:', 'Make that shorter.'], ['Fix grammar', 'Fix the grammar and spelling, keep my style:', 'Check that for grammar mistakes.'], ['Reply to this', 'Write a polite reply to this message:', 'Write a reply to that.']] },
    { id: 'translator', group: 'everyday', name: 'Translator', emoji: '🌐', face: 'f11', temp: 0.3, desc: 'English and Malay', prompt: 'You translate between English and Malay (Bahasa Melayu). If the user writes in English, translate into Malay. If they write in Malay, translate into English. Follow any other language request they make. Give only the translation, then at most one short note if a phrase has no direct equivalent.', quick: [['To Malay', 'Translate to Malay:', 'Translate your last reply to Malay.'], ['To English', 'Translate to English:', 'Translate your last reply to English.'], ['More casual', 'Translate this in a casual, everyday style:', 'Make that translation more casual.'], ['Explain', 'Explain the grammar and key words in this:', 'Explain the key words in that translation.']] },
    { id: 'summariser', group: 'everyday', name: 'Summariser', emoji: '📝', face: 'f13', temp: 0.3, desc: 'Shortens text and files', prompt: 'You summarise text and documents. Start with a one or two sentence overview, then the key points as bullets, then any action items or deadlines. Stay faithful to the source and do not add facts. If the text is cut off, say so.', quick: [['Summarise', 'Summarise this:', 'Summarise the attachment or text above.'], ['Key points', 'List the key points of this:', 'List the key points.'], ['Action items', 'List the action items and deadlines in this:', 'List any action items and deadlines.'], ['ELI5', 'Explain this very simply:', 'Explain that very simply.']] },
    { id: 'tutor', group: 'everyday', name: 'Explainer', emoji: '🎓', face: 'f14', temp: 0.5, desc: 'Explains step by step', prompt: 'You are a patient tutor. Explain concepts step by step with simple examples and everyday comparisons. Check understanding with one short question at the end. If you are not sure about a fact, say so.', quick: [['Explain simply', 'Explain this simply:', 'Explain that more simply.'], ['Example', 'Give me a real-life example of this:', 'Give me an example.'], ['Quiz me', 'Quiz me with 3 questions about this:', 'Quiz me with 3 questions on that.'], ['Go deeper', 'Explain this in more depth:', 'Go deeper on that.']] },
    { id: 'brainstorm', group: 'everyday', name: 'Brainstorm', emoji: '💡', face: 'f23', temp: 0.95, desc: 'Ideas and options', prompt: 'You are a creative brainstorming partner. Give varied ideas as a numbered list, mixing practical and unusual ones. Then name the 2 strongest ideas and why.', quick: [['10 ideas', 'Give me 10 ideas for:', 'Give me 10 more ideas.'], ['Wilder', 'Give me wild, unusual ideas for:', 'Make the ideas wilder.'], ['Pros & cons', 'List pros and cons of:', 'List pros and cons of the best ideas.'], ['Pick the best', 'Which of these is best and why:', 'Pick the best idea and make a plan.']] },
    { id: 'story', group: 'fun', name: 'Story Partner', emoji: '📖', face: 'f26', temp: 0.95, desc: 'Write stories together', prompt: 'You are a creative co-writer. Write vivid, engaging fiction together with the user in the genre and tone they choose. Write in short passages (2 to 4 paragraphs), then stop so the user can steer. Keep characters consistent.', greeting: 'Hi! What story shall we write? Give me a genre, a character, or just a first line.', quick: [['Continue', '', 'Continue the story.'], ['Plot twist', '', 'Add a surprising plot twist.'], ['More dialogue', '', 'Continue with more dialogue.'], ['Describe', '', 'Describe the scene in rich detail.']] }
  ];
}
function defaultSettings() {
  return { modelId: SAFE_DEFAULT, maxTokens: 400, ctx: 4096, activeChatId: null, autoMem: true, memEvery: 4, aboutAuto: true, theme: 'auto', sound: { ui: true, sfx: true, music: true, uiVol: 0.4, sfxVol: 0.8, musicVol: 0.5 } };
}
function fresh() { return { version: 2, personas: defaultPersonas(), chats: [], profile: { about: '' }, customFaces: [], music: {}, settings: defaultSettings() }; }

// ---------- helpers ----------
const $ = (id) => document.getElementById(id);
function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]); }
function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function clip(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n) + '...' : s; }
function estTokens(s) { return Math.ceil(String(s || '').length / 3.6); }
function hash(s) { let h = 2166136261; s = String(s || ''); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lastIndex(arr, fn) { for (let i = arr.length - 1; i >= 0; i--) if (fn(arr[i])) return i; return -1; }
let toastTimer = 0;
function toast(msg, ms) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, ms || 2600); }

// ---------- storage ----------
let state = null;
function loadState() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { return null; } }
let saveTimer = 0;
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 400); }
function saveNow() { clearTimeout(saveTimer); try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { toast('Storage is full. Export a backup and delete old chats.', 5000); } }
const IDB = { db: null };
function idb() {
  if (IDB.db) return Promise.resolve(IDB.db);
  return new Promise((res, rej) => { const r = indexedDB.open('popeye', 1); r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('blobs')) d.createObjectStore('blobs'); }; r.onsuccess = () => { IDB.db = r.result; res(r.result); }; r.onerror = () => rej(r.error); });
}
async function idbGet(k) { const d = await idb(); return new Promise((res, rej) => { const q = d.transaction('blobs').objectStore('blobs').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); }
async function idbSet(k, v) { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction('blobs', 'readwrite'); t.objectStore('blobs').put(v, k); t.oncomplete = () => res(); t.onerror = () => rej(t.error); }); }
async function idbDel(k) { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction('blobs', 'readwrite'); t.objectStore('blobs').delete(k); t.oncomplete = () => res(); t.onerror = () => rej(t.error); }); }

function newAdvShell(setting, tone) {
  const S = SETTINGS[setting] || SETTINGS.fantasy;
  return { id: uid(), kind: 'adv', title: S.label + ' adventure', titled: true, created: Date.now(), updated: Date.now(), memory: '', messages: [], sinceMem: 0,
    adv: { setting: setting, settingText: S.desc, tone: tone || 'Serious', premise: '', scene: S.scene, to: [], cast: [{ id: 'dm', name: 'DM', role: 'dm', gender: 'm', face: 'f22', desc: 'the narrator and game master' }], player: { name: 'You', cls: 'Adventurer', face: 'f00', hp: 20, maxhp: 20, lvl: 1, xp: 0, gold: 10, inv: [] } } };
}
function migrate(s) {
  if (!s || typeof s !== 'object') return fresh();
  if (s.version === 2) {
    const f = fresh();
    s.personas = Array.isArray(s.personas) && s.personas.length ? s.personas : f.personas;
    s.chats = Array.isArray(s.chats) ? s.chats : [];
    s.profile = s.profile || { about: '' };
    s.customFaces = s.customFaces || [];
    s.music = s.music || {};
    s.settings = Object.assign(f.settings, s.settings || {});
    s.settings.sound = Object.assign(defaultSettings().sound, (s.settings && s.settings.sound) || {});
    return s;
  }
  const st = fresh();
  const defIds = ['gm', 'assistant', 'story'];
  (s.personas || []).forEach((p) => { if (!defIds.includes(p.id)) st.personas.push({ id: p.id || uid(), group: 'mine', name: p.name || 'Persona', emoji: p.emoji || '🙂', face: '', temp: p.temp || 0.8, desc: '', prompt: p.prompt || '', quick: [], greeting: p.greeting || '' }); });
  st.chats = (s.chats || []).map((c) => {
    const msgs = (c.messages || []).filter((m) => !m.greeting).map((m) => ({ role: m.role, content: m.content || '', hidden: !!m.hidden, summarized: !!m.summarized }));
    if (c.personaId === 'gm') { const a = newAdvShell('fantasy', 'Serious'); return Object.assign(a, { id: c.id || uid(), title: c.title || 'Adventure', memory: c.memory || '', messages: msgs, created: c.created || Date.now(), updated: c.updated || Date.now() }); }
    const pid = st.personas.some((p) => p.id === c.personaId) ? c.personaId : 'assistant';
    return { id: c.id || uid(), kind: 'chat', personaId: pid, title: c.title || 'Chat', titled: !!c.titled, created: c.created || Date.now(), updated: c.updated || Date.now(), memory: c.memory || '', messages: msgs, sinceMem: 0 };
  });
  if (s.settings) { st.settings.modelId = s.settings.modelId || SAFE_DEFAULT; st.settings.maxTokens = s.settings.maxTokens || 400; st.settings.activeChatId = s.settings.activeChatId || null; }
  return st;
}


// ---------- faces ----------
const customUrls = {};
async function loadCustomFaces() {
  for (const id of state.customFaces) { try { const b = await idbGet('face:' + id); if (b) customUrls[id] = URL.createObjectURL(b); } catch (e) {} }
  if (state.customFaces.length) renderAll();
}
function faceSrc(ref) {
  if (!ref) return '';
  if (/^f\d\d$/.test(ref)) return 'faces/' + ref + '.jpg';
  if (ref.indexOf('c:') === 0) return customUrls[ref.slice(2)] || '';
  return '';
}
function avatar(ref, fallback, cls) {
  const src = faceSrc(ref);
  const inner = src ? '<img src="' + esc(src) + '" alt="">' : esc((ref && !/^(f\d\d|c:)/.test(ref)) ? ref : (fallback || '🙂'));
  return '<span class="av' + (cls ? ' ' + cls : '') + '">' + inner + '</span>';
}
function faceTag(i) { return 'f' + String(i).padStart(2, '0'); }
function pickFace(c, text, g) {
  const t = String(text || '').toLowerCase();
  const used = new Set();
  if (c && c.adv) { c.adv.cast.forEach((x) => used.add(x.face)); used.add(c.adv.player.face); }
  const fantasy = RACES.some((r) => new RegExp('\\b' + r).test(t));
  const old = /\b(old|elder|elderly|aged|grey|gray|ancient|grandmother|grandfather|granny|wise|retired)\b/.test(t);
  const young = /\b(young|girl|boy|kid|child|teen|teenage|apprentice)\b/.test(t);
  const h = hash(text);
  let best = -1e9, bi = 0;
  FACES.forEach((tags, i) => {
    const tg = tags.split(' '); let sc = 0;
    tg.slice(1).forEach((w) => { if (w !== 'modern' && w !== 'adult' && new RegExp('\\b' + w).test(t)) sc += 6; });
    if (g) sc += tg[0] === g ? 3 : -6;
    if (!fantasy && tg.includes('modern')) sc += 2;
    if (fantasy && tg.includes('modern')) sc -= 3;
    if (old) sc += tg.includes('old') ? 3 : 0; else if (tg.includes('old')) sc -= 1;
    if (young && tg.includes('young')) sc += 2;
    if (used.has(faceTag(i))) sc -= 8;
    sc += ((h >>> (i % 25)) & 7) * 0.15;
    if (sc > best) { best = sc; bi = i; }
  });
  return faceTag(bi);
}

// ---------- chats ----------
function activeChat() { return state.chats.find((c) => c.id === state.settings.activeChatId) || null; }
function personaOf(c) { return state.personas.find((p) => p.id === c.personaId) || state.personas[0]; }
function newChat(personaId) {
  const p = state.personas.find((x) => x.id === personaId) || state.personas[0];
  const c = { id: uid(), kind: 'chat', personaId: p.id, title: p.name, titled: false, created: Date.now(), updated: Date.now(), memory: '', messages: [], sinceMem: 0 };
  if (p.greeting) c.messages.push({ role: 'assistant', content: p.greeting, greeting: true });
  state.chats.unshift(c); state.settings.activeChatId = c.id; saveNow();
  return c;
}
function ensureActive() {
  if (!state.chats.length) { newChat('assistant'); return; }
  if (!activeChat()) { const s = state.chats.slice().sort((a, b) => b.updated - a.updated); state.settings.activeChatId = s[0].id; }
}
function openChat(id) {
  state.settings.activeChatId = id; saveNow(); closeDrawer(); closeSheet(); pendingAtts = []; renderAll();
  const c = activeChat(); if (c && c.kind === 'adv') musicScene(c.adv.scene, true); else musicStop();
}
function deleteChat(id) {
  state.chats = state.chats.filter((c) => c.id !== id);
  if (state.settings.activeChatId === id) state.settings.activeChatId = null;
  ensureActive(); saveNow(); renderAll();
}
function dmOf(c) { return c.adv.cast.find((x) => x.role === 'dm') || c.adv.cast[0]; }
function findCast(c, nm) {
  const n = String(nm || '').trim().toLowerCase().replace(/^the\s+/, '');
  if (!n) return null;
  if (/^(dm|narrator|narration|game ?master|dungeon ?master|gm|storyteller)$/.test(n)) return dmOf(c);
  if (n === c.adv.player.name.toLowerCase()) return { player: true, name: c.adv.player.name };
  let hit = c.adv.cast.find((x) => x.name.toLowerCase() === n);
  if (!hit) hit = c.adv.cast.find((x) => x.role !== 'dm' && (x.name.toLowerCase().split(/\s+/).includes(n) || n.split(/\s+/).includes(x.name.toLowerCase())));
  return hit || null;
}
const NOT_NAMES = /^(note|notes|result|results|roll|rolls|scene|hp|gold|xp|item|items|inventory|status|action|actions|location|time|player|you|option|options|choice|choices|tip|warning|example|stats|quest|objective|outcome|ooc|summary|recap|health|level|setting|tone|format|characters?|new|everyone|all)$/i;
function isLikelyName(nm) { return nm.split(/\s+/).length <= 3 && !NOT_NAMES.test(nm.trim()) && /^[A-Z]/.test(nm); }
function addCast(c, name, desc, gender) {
  name = String(name || '').replace(/[*_"]/g, '').trim().slice(0, 30);
  if (!name || !isLikelyName(name)) return null;
  const hit = findCast(c, name);
  if (hit) { if (hit.id && desc && !hit.desc) hit.desc = desc; return hit; }
  let g = '';
  if (/^\s*(f|female|woman|girl|she)/i.test(gender || '') || /\b(woman|girl|lady|queen|princess|she|her|mother|sister|witch|priestess)\b/i.test(desc || '')) g = 'f';
  else if (/^\s*(m|male|man|boy|he)/i.test(gender || '') || /\b(man|boy|lord|king|prince|he|his|father|brother|wizard|priest)\b/i.test(desc || '')) g = 'm';
  const x = { id: uid(), name: name, role: 'npc', gender: g, desc: desc || '', face: pickFace(c, name + ' ' + (desc || ''), g) };
  c.adv.cast.push(x);
  const npcs = c.adv.cast.filter((y) => y.role === 'npc');
  if (npcs.length > 14) c.adv.cast.splice(c.adv.cast.indexOf(npcs[0]), 1);
  return x;
}

// ---------- model engine ----------
let engineOld = false, webllm = null, engine = null, loadedModel = null, loadedCtx = 0, busy = false, memBusy = null, memCancel = false, loadingModel = false;
async function getWebLLM() { if (!webllm) webllm = await import(WEBLLM_URL); return webllm; }
function appConfig() {
  const base = webllm.prebuiltAppConfig;
  const extra = CUSTOM_MODELS.filter((c) => !base.model_list.some((m) => m.model_id === c.model_id));
  return Object.assign({}, base, { model_list: base.model_list.concat(extra) });
}
function allModels() { return webllm ? appConfig().model_list : []; }
function modelRecord(id) { return allModels().find((m) => m.model_id === id) || null; }
function nativeCtx(id) { const r = modelRecord(id); return (r && r.overrides && r.overrides.context_window_size) || 4096; }
function ctxWindow() { return loadedModel ? Math.min(nativeCtx(loadedModel), loadedCtx || 2048) : 2048; }
function modelLabel(id) { const r = RECOMMENDED.find((x) => x.id === id); return r ? r.label : String(id || '').replace(/-q4f(16|32)_1-MLC$/, '').replace(/-MLC$/, ''); }
function showLoad(p) { $('loadBar').hidden = false; $('loadText').textContent = (p && p.text) || 'Working...'; $('loadFill').style.width = Math.round(((p && p.progress) || 0) * 100) + '%'; }
function hideLoad() { $('loadBar').hidden = true; }
function updateModelPill() {
  const pill = $('modelPill');
  if (loadingModel) pill.textContent = 'Loading...';
  else pill.textContent = loadedModel ? modelLabel(loadedModel) : 'Load model';
  $('btnModel').classList.toggle('on', !!loadedModel);
}
async function loadModel(id) {
  if (busy || loadingModel) return;
  loadingModel = true; updateModelPill(); showLoad({ text: 'Preparing ' + modelLabel(id) + '...', progress: 0 });
  try {
    await getWebLLM();
    if (!navigator.gpu) throw new Error('this browser has no WebGPU. On iPhone, update to the latest iOS.');
    localStorage.setItem(LOADING_KEY, id);
    try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}
    const ctx = Math.min(nativeCtx(id), state.settings.ctx || 4096);
    const progress = (p) => showLoad({ text: (p.text || '').replace(/\[.*?\]\s*/, '').slice(0, 120), progress: p.progress || 0 });
    const opts = { context_window_size: ctx };
    const ctxErr = (e) => /sliding|context_window/i.test(String(e && e.message));
    const rec = modelRecord(id); const wantOld = !!(rec && rec.webllm === 'old');
    const lib = wantOld ? await import(WEBLLM_OLD) : webllm;
    if (engine && engineOld !== wantOld) { try { await engine.unload(); } catch (e) {} engine = null; }
    engineOld = wantOld;
    if (!engine) {
      try { engine = await lib.CreateMLCEngine(id, { appConfig: appConfig(), initProgressCallback: progress }, opts); }
      catch (e) { if (ctxErr(e)) engine = await lib.CreateMLCEngine(id, { appConfig: appConfig(), initProgressCallback: progress }); else throw e; }
    } else {
      engine.setInitProgressCallback(progress);
      try { await engine.reload(id, opts); } catch (e) { if (ctxErr(e)) await engine.reload(id); else throw e; }
    }
    loadedModel = id; loadedCtx = ctx; state.settings.modelId = id; saveNow();
    localStorage.removeItem(LOADING_KEY);
    toast(modelLabel(id) + ' is ready');
  } catch (e) {
    localStorage.removeItem(LOADING_KEY); loadedModel = null;
    toast('Could not load ' + modelLabel(id) + ': ' + ((e && e.message) || e), 7000);
  } finally { loadingModel = false; hideLoad(); updateModelPill(); renderComposer(); }
}
function extraFor(id) { return /qwen3/i.test(id || '') ? { extra_body: { enable_thinking: false } } : {}; }
function cleanOutput(t) { return String(t || '').replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<think>[\s\S]*$/, '').replace(/^\s+/, ''); }
async function complete(messages, opts) {
  const req = Object.assign({ messages: messages, temperature: opts.temp == null ? 0.7 : opts.temp, max_tokens: opts.max || state.settings.maxTokens, frequency_penalty: 0.2 }, extraFor(loadedModel));
  if (opts.stop) req.stop = opts.stop;
  if (opts.onToken) {
    req.stream = true;
    const chunks = await engine.chat.completions.create(req);
    let out = '';
    for await (const ch of chunks) { const d = ch.choices && ch.choices[0] && ch.choices[0].delta && ch.choices[0].delta.content; if (d) { out += d; opts.onToken(out); } }
    return out;
  }
  const r = await engine.chat.completions.create(req);
  return (r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content) || '';
}
async function libFor(id) { const r = modelRecord(id); return r && r.webllm === 'old' ? await import(WEBLLM_OLD) : webllm; }
async function isCached(id) { try { const lib = await libFor(id); return await lib.hasModelInCache(id, appConfig()); } catch (e) { return false; } }
function thinkingModel() { return /deepseek-r1|r1-distill/i.test(loadedModel || ''); }

// ---------- prompts ----------
function playerName(c) { return c.adv ? c.adv.player.name : 'User'; }
function systemFor(c) {
  if (c.kind === 'adv') return advSystem(c);
  const p = personaOf(c); let s = p.prompt || 'You are a helpful assistant.';
  if (state.profile.about.trim()) s += '\n\nABOUT THE USER (remembered from earlier chats):\n' + state.profile.about.trim();
  if ((c.memory || '').trim()) s += '\n\nMEMORY OF THIS CONVERSATION SO FAR:\n' + c.memory.trim();
  return s;
}
function advSystem(c) {
  const a = c.adv, p = a.player;
  const cast = a.cast.filter((x) => x.role !== 'dm').map((x) => '- ' + x.name + ' (' + (x.role === 'party' ? 'party member' : 'character') + (x.gender ? ', ' + (x.gender === 'f' ? 'female' : 'male') : '') + '): ' + (x.desc || 'no details yet')).join('\n') || '- none yet; introduce characters when the story needs them';
  const L = [
    'You are the DM (game master) of a text role-playing adventure played in a group chat. You narrate as "DM" and you also voice every other character.',
    'SETTING: ' + (a.settingText || 'a fantasy world') + (a.premise ? '\nPREMISE: ' + a.premise : ''),
    'TONE: ' + a.tone,
    'PLAYER: ' + p.name + ', ' + p.cls + '. HP ' + p.hp + '/' + p.maxhp + ', level ' + p.lvl + ', XP ' + p.xp + ', gold ' + p.gold + '. Inventory: ' + (p.inv.join(', ') || 'nothing') + '.',
    'CHARACTERS YOU VOICE:\n' + cast,
    'FORMAT RULES (very important):',
    '- Every line starts with the speaker name and a colon. Format example only, never copy its words:\nDM: A gull snatches a fish from a market stall.\nMira: "Oi, thief!" *throws a shoe at it*',
    '- Characters speak in first person. Speech goes in "double quotes", actions in *asterisks*.',
    '- The player message starts with [To ...] naming who the player is talking to. Only those characters answer. If it says Everyone, choose who reacts. The DM may add one line of narration.',
    '- Never write a line for ' + p.name + ', never decide what ' + p.name + ' does, and never write [To ...]. Stop and let the player decide.',
    '- Keep it short: 1 to 4 lines, each under 60 words.',
    '- For a new character, give a name, speak as "Name: ...", and once add [NEW: Name | short description | male or female].',
    '- Only when something really changes, add a tag at the end of that line: [HP -3] (player hurt), [HP +5] (healed), [GOLD +10], [XP +50], [ITEM + rope], [ITEM - torch], [SCENE: forest]. Never invent changes.',
    '- Scenes: town, tavern, forest, travel, dungeon, castle, port, shop, battle, boss, victory, night, snow, tension.',
    '- For risky actions ask for a roll like [ROLL d20 for Stealth]. When the player sends a roll, narrate the result: 1 is a disaster, 10 is so-so, 20 is amazing.'
  ];
  if ((c.memory || '').trim()) L.push('STORY SO FAR:\n' + c.memory.trim());
  return L.join('\n');
}
function historyFor(c) {
  const out = [];
  for (const m of c.messages) {
    if (m.summarized || m.greeting || m.error || !m.content) continue;
    const role = m.role === 'user' ? 'user' : 'assistant';
    const content = m.role === 'user' ? (m.send || m.content) : m.content;
    if (out.length && out[out.length - 1].role === role) out[out.length - 1].content += '\n\n' + content;
    else out.push({ role: role, content: content });
  }
  while (out.length && out[0].role !== 'user') out.shift();
  return out;
}
function tidyBullets(t) {
  const b = String(t || '').split('\n').map((s) => s.trim()).filter((s) => /^[-*•]/.test(s)).map((s) => '- ' + s.replace(/^[-*•]+\s*/, '')).filter((s) => s.length > 3).slice(0, 12).join('\n');
  return b || String(t || '').trim().slice(0, 800);
}
async function updateMemory(c, msgs) {
  if (!engine || !loadedModel || memBusy) return;
  msgs = msgs || c.messages.filter((m) => !m.summarized && !m.hidden && !m.greeting && !m.error && m.content).slice(-((state.settings.memEvery || 4) * 2 + 2));
  if (!msgs.length) return;
  const isAdv = c.kind === 'adv';
  const convo = msgs.map((m) => (m.role === 'user' ? (isAdv ? playerName(c) : 'User') + ': ' + clip(m.send || m.content, 700) : (isAdv ? clip(m.content, 900) : 'Assistant: ' + clip(m.content, 900)))).join('\n');
  let prompt;
  if (isAdv) prompt = 'Current story notes:\n' + (c.memory || '(none)') + '\n\nRecent events:\n' + convo + '\n\nRewrite the story notes so they include the important new events: where the party is, characters met, quests, promises, clues, items and enemies. Write at most 12 short bullet points, each starting with "- ". Output only the bullet points.';
  else prompt = 'Current notes about this chat:\n' + (c.memory || '(none)') + '\n\nNew messages:\n' + convo + '\n\nRewrite the notes so they include the important new points: topics, decisions, facts, open tasks. At most 10 short bullet points, each starting with "- ". Output only the bullet points.';
  const job = (async () => {
    const out = cleanOutput(await complete([{ role: 'system', content: 'You keep short, accurate memory notes. Output only the notes.' }, { role: 'user', content: prompt }], { temp: 0.2, max: 320 }));
    if (memCancel) return;
    if (isAdv) { if (out.trim()) c.memory = tidyBullets(out); }
    else {
      if (out.trim()) c.memory = tidyBullets(out);
      const userText = msgs.filter((x) => x.role === 'user').map((x) => x.content).join('\n');
      if (state.settings.aboutAuto && !memCancel && /\b(i am|i'm|im|my|i work|i live|i like|i love|i prefer|i hate|call me|saya|nama)\b/i.test(userText)) {
        const u = cleanOutput(await complete([{ role: 'system', content: 'You keep a short list of lasting facts about the user. Output only the list.' }, { role: 'user', content: 'Known facts about the user:\n' + (state.profile.about || '(none)') + '\n\nThe user recently wrote:\n' + clip(userText, 1500) + '\n\nUpdate the list of lasting facts about the user: name, work, location, family, preferences, goals. Keep known facts unless the user contradicted them. Ignore questions and one-off requests. At most 10 bullet points, each starting with "- ". If nothing is known, write "- none".' }], { temp: 0.1, max: 200 }));
        if (!memCancel) { const b = tidyBullets(u); if (b.trim() && !/^-\s*none\.?$/i.test(b.trim())) state.profile.about = b; }
      }
    }
    c.sinceMem = 0; save();
  })();
  memBusy = job; showMemDot(true);
  try { await job; } catch (e) {} finally { memBusy = null; showMemDot(false); }
}
function showMemDot(on) { let d = $('memdot'); if (on) { if (!d) { d = el('div', 'memdot', '🧠 updating memory...'); d.id = 'memdot'; $('messages').appendChild(d); scrollDown(true); } } else if (d) d.remove(); }
async function stopMemory() { if (!memBusy) return; memCancel = true; try { engine.interruptGenerate(); } catch (e) {} try { await memBusy; } catch (e) {} memCancel = false; }
async function fitContext(c) {
  const budget = ctxWindow() - state.settings.maxTokens - 200;
  const est = () => estTokens(systemFor(c)) + historyFor(c).reduce((a, m) => a + estTokens(m.content) + 4, 0);
  if (est() <= budget) return;
  const live = c.messages.filter((m) => !m.summarized && !m.greeting && m.content);
  const old = live.slice(0, Math.max(0, live.length - 4));
  if (old.length) { memCancel = false; await updateMemory(c, old); old.forEach((m) => { m.summarized = true; }); }
  let guard = 0;
  while (est() > budget && guard++ < 50) { const m = c.messages.find((x) => !x.summarized && !x.greeting && x.content && x !== c.messages[c.messages.length - 1] && x !== c.messages[c.messages.length - 2]); if (!m) break; m.summarized = true; }
}


// ---------- sending ----------
let pendingAtts = [];
function currentTo(c, text) {
  const set = new Set(c.adv.to || []);
  const re = /@([A-Za-z][\w'-]*)/g; let m;
  while ((m = re.exec(text || ''))) { const hit = findCast(c, m[1]); if (hit && !hit.player) set.add(hit.name); }
  return Array.from(set);
}
function excerpt(full, query, max) {
  if (full.length <= max) return full;
  const chunks = []; let i = 0;
  while (i < full.length) { let end = Math.min(full.length, i + 1000); if (end < full.length) { const p = full.lastIndexOf('\n', end); const d = full.lastIndexOf('. ', end); const cut = Math.max(p, d); if (cut > i + 400) end = cut + 1; } chunks.push({ i: chunks.length, t: full.slice(i, end) }); i = end; }
  const stop = new Set(['the', 'and', 'this', 'that', 'with', 'what', 'about', 'from', 'have', 'please', 'tell', 'does', 'which', 'there', 'their', 'your', 'into', 'file', 'document', 'attachment']);
  const words = String(query || '').toLowerCase().match(/[a-z0-9À-ɏ]{4,}/g) || [];
  const keys = words.filter((w) => !stop.has(w));
  const broad = !keys.length || /summar|overview|ringkas|key points|about/i.test(query || '');
  let picked;
  const n = Math.max(1, Math.floor(max / 1050));
  if (broad) { const step = chunks.length / n; picked = []; for (let k = 0; k < n; k++) picked.push(chunks[Math.min(chunks.length - 1, Math.floor(k * step))]); }
  else { const scored = chunks.map((ch) => { const lt = ch.t.toLowerCase(); let s = 0; keys.forEach((w) => { let p = lt.indexOf(w); while (p >= 0) { s++; p = lt.indexOf(w, p + w.length); } }); return { ch: ch, s: s }; }); scored.sort((a, b) => b.s - a.s); picked = [chunks[0]].concat(scored.filter((x) => x.s > 0).map((x) => x.ch)); }
  const seen = new Set(); const out = []; let len = 0;
  for (const ch of picked) { if (seen.has(ch.i)) continue; if (len + ch.t.length > max) break; seen.add(ch.i); out.push(ch); len += ch.t.length; }
  out.sort((a, b) => a.i - b.i);
  return '(Long file: showing ' + (broad ? 'parts spread through it' : 'the most relevant parts') + ', about ' + len + ' of ' + full.length + ' characters.)\n' + out.map((x) => x.t.trim()).join('\n[...]\n');
}
function buildSend(c, msg, text, atts) {
  let s = text;
  if (msg.to && msg.to.length) s = '[To ' + msg.to.join(', ') + '] ' + s;
  else if (c.kind === 'adv') s = '[To Everyone] ' + s;
  if (c.kind === 'adv' && text) { const who = (msg.to || []).filter((n) => n !== 'Everyone'); const chars = who.filter((n) => n !== 'DM'); if (chars.length) s += '\n(Reply as ' + chars.join(' and ') + ': each of them speaks on a line starting with their name and a colon.)'; else if (who.length) s += '\n(Reply as DM.)'; }
  if (msg.mode === 'story') s = '[To DM] (Story direction from the player: ' + text + ' Narrate this happening in 2 or 3 lines, then let the player act.)';
  if (atts.length) {
    const budgetChars = Math.max(1500, Math.floor((ctxWindow() - state.settings.maxTokens - estTokens(systemFor(c)) - 500) * 3.2));
    const per = Math.floor(budgetChars / atts.length);
    let att = '';
    for (const a of atts) att += '\n\n[Attached ' + a.kindLabel + ': ' + a.name + ']\n' + excerpt(a.text, text, per);
    s = (text ? s : 'Please read this attachment and tell me briefly what it is about.') + att;
  }
  return s;
}
async function send(textOverride, opt) {
  opt = opt || {};
  const c = activeChat(); if (!c || busy) return;
  const fromInput = textOverride == null;
  const text = fromInput ? $('input').value.trim() : String(textOverride);
  const atts = fromInput ? pendingAtts.slice() : [];
  if (!text && !atts.length) return;
  if (!loadedModel) { toast(loadingModel ? 'The model is still loading...' : 'Load a model first.'); if (!loadingModel) openModelSheet(); return; }
  await stopMemory();
  let content = text, mode = null;
  if (c.kind === 'adv' && fromInput && text && !opt.hidden) { mode = c.adv.mode || 'do'; if (mode === 'do' && !/^[*"“(]/.test(text)) content = '*' + text + '*'; else if (mode === 'say' && !/^["“]/.test(text)) content = '"' + text + '"'; }
  const msg = { role: 'user', content: content, t: Date.now() };
  if (mode) msg.mode = mode;
  if (opt.hidden) msg.hidden = true;
  if (c.kind === 'adv') { const to = opt.to || currentTo(c, text); if (to.length) msg.to = to; }
  if (atts.length) msg.atts = atts.map((a) => ({ name: a.name, kind: a.kind, chars: a.text.length, thumb: a.thumb || '' }));
  msg.send = buildSend(c, msg, content, atts);
  if (fromInput) { $('input').value = ''; autoGrow(); pendingAtts = []; renderAtts(); }
  c.messages.push(msg); c.updated = Date.now();
  if (!c.titled && c.kind === 'chat' && text) { c.title = clip(text.replace(/\s+/g, ' '), 40); c.titled = true; }
  sfx('send', 'ui'); renderMessages(); renderHeader(); save();
  await generate(c);
}
async function generate(c) {
  busy = true; renderComposer();
  const reply = { role: 'assistant', content: '', t: Date.now(), streaming: true };
  c.messages.push(reply); renderMessages();
  let last = 0;
  try {
    await fitContext(c);
    const msgs = [{ role: 'system', content: systemFor(c) }].concat(historyFor(c));
    const temp = c.kind === 'adv' ? 0.85 : (personaOf(c).temp == null ? 0.7 : personaOf(c).temp);
    let max = thinkingModel() ? Math.max(state.settings.maxTokens, 900) : state.settings.maxTokens; if (c.kind === 'adv' && !thinkingModel()) max = Math.min(max, 280); const stop = c.kind === 'adv' ? ['\n' + c.adv.player.name + ':', '\n' + c.adv.player.name + ' :', '\n[To ', '\n**' + c.adv.player.name] : undefined;
    const out = await complete(msgs, { temp: temp, max: max, stop: stop, onToken: (t) => { reply.content = c.kind === 'adv' ? advTrim(c, cleanOutput(t)) : cleanOutput(t); reply.thinking = /<think>(?![\s\S]*<\/think>)/.test(t); const now = performance.now(); if (now - last > 70) { last = now; updateStreaming(c, reply); } } });
    reply.content = (c.kind === 'adv' ? advTrim(c, cleanOutput(out)) : cleanOutput(out)).trim();
    if (!reply.content && /<think>/.test(out)) reply.content = '💭 (still thinking when it reached the reply length; raise Reply length in Model settings)\n\n' + out.replace(/<\/?think>/g, '').trim().slice(-1500);
    if (!reply.content) { reply.content = 'No reply came back. Tap Retry.'; reply.error = true; }
  } catch (e) {
    const m = String((e && e.message) || e);
    if (/device|lost|dispos|gpu|memory|abort/i.test(m) && !/interrupt/i.test(m)) { engine = null; loadedModel = null; updateModelPill(); reply.content = 'The model stopped (the phone may have freed its memory). Tap the model button to load it again.'; }
    else reply.content = 'Error: ' + m;
    reply.error = true;
  } finally { delete reply.streaming; delete reply.thinking; busy = false; }
  if (c.kind === 'adv' && !reply.error) afterAdvReply(c, reply);
  c.updated = Date.now(); renderMessages(); renderComposer(); save();
  if (!reply.error) {
    if (c.kind !== 'adv') sfx('recv', 'ui');
    c.sinceMem = (c.sinceMem || 0) + 1;
    if (state.settings.autoMem && c.sinceMem >= (state.settings.memEvery || 4)) setTimeout(() => { if (!busy && activeChat()) updateMemory(c); }, 600);
  }
}
function stopGen() { try { engine && engine.interruptGenerate(); } catch (e) {} }
function retryLast() {
  const c = activeChat(); if (!c || busy) return;
  const i = lastIndex(c.messages, (m) => m.role === 'assistant' && !m.greeting); if (i < 0) return;
  const m = c.messages[i]; if (m.applied && c.kind === 'adv') undoAdvEffects(c, m);
  c.messages.splice(i, 1); generate(c);
}
function continueLast() { const c = activeChat(); if (!c || busy) return; send(c.kind === 'adv' ? 'Continue.' : 'Continue exactly where you stopped.', { hidden: true }); }
function undoLast(edit) {
  const c = activeChat(); if (!c || busy) return;
  const ui = lastIndex(c.messages, (m) => m.role === 'user' && !m.hidden); if (ui < 0) return;
  const removed = c.messages.splice(ui);
  removed.forEach((m) => { if (m.role === 'assistant' && m.applied && c.kind === 'adv') undoAdvEffects(c, m); });
  if (edit) { $('input').value = removed[0].content || ''; autoGrow(); $('input').focus(); }
  renderMessages(); save();
}
function copyText(t) {
  const done = () => toast('Copied');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, () => fallbackCopy(t)); else fallbackCopy(t);
}
function fallbackCopy(t) { const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('Copied'); } catch (e) { toast('Copy failed'); } ta.remove(); }

// ---------- adventure logic ----------
function parseAdv(c, text) {
  const segs = []; let cur = null;
  String(text || '').split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line) { if (cur && cur.text) cur.text += '\n'; return; }
    const mm = line.match(/^[*_]*\s*([A-Z][A-Za-z' .-]{0,28}?)\s*[*_]*\s*:\s*[*_]*\s*(.*)$/);
    let who = null, rest = line;
    if (mm && !/^\[/.test(line)) { const nm = mm[1].trim(); const hit = findCast(c, nm); if (hit) { who = hit; rest = mm[2]; } else if (isLikelyName(nm)) { who = { name: nm, id: null }; rest = mm[2]; } }
    if (who) { cur = { who: who, text: rest }; segs.push(cur); }
    else if (cur) cur.text += (cur.text && !/\n$/.test(cur.text) ? '\n' : '') + line;
    else { cur = { who: dmOf(c), text: line }; segs.push(cur); }
  });
  segs.forEach((s) => { s.text = s.text.replace(/\n+$/, ''); });
  return segs.filter((s) => s.text.trim());
}
function advTrim(c, t) {
  const nm = c.adv.player.name.replace(/[.*+?^()|[\]\\{}$]/g, '\\$&');
  const re = new RegExp('(^|\\n)\\s*[*_]*\\s*(' + nm + '\\s*[*_]*\\s*:|\\[To\\b)', 'i');
  const m = re.exec(t); let out = m ? t.slice(0, m.index) : t;
  out = out.replace(new RegExp('\\n\\s*[*_]*\\s*(' + nm + '|\\[To?)\\s*[*_]*\\s*$', 'i'), '');
  return out.replace(/^\s*DM:\s*A gull snatches[^\n]*\n?/i, '').replace(/^\s*Mira:\s*"Oi, thief[^\n]*\n?/im, '');
}
function stripTags(t) { return String(t || '').replace(/\[(HP|GOLD|XP|ITEM|SCENE|NEW|To)\b[^\]]*\]/gi, '').replace(/[ \t]+$/gm, ''); }
function normScene(s) { s = String(s || '').toLowerCase().trim(); if (SCENES[s]) return s; for (const k in SCENES) if (s.indexOf(k) >= 0) return k; if (/inn|pub/.test(s)) return 'tavern'; if (/cave|crypt|ruin|tomb|shrine/.test(s)) return 'dungeon'; if (/wood|jungle|field|road/.test(s)) return 'forest'; if (/ship|sea|dock|harbo/.test(s)) return 'port'; if (/fight|combat/.test(s)) return 'battle'; return null; }
function detectScene(t, cur) {
  const s = stripTags(t).toLowerCase();
  if (/\b(defeated|is slain|are slain|falls dead|drops dead|victory|the battle is over|you win|flees in terror)\b/.test(s) && (cur === 'battle' || cur === 'boss')) return 'victory';
  if (/\b(dragon|boss|demon lord|lich|final battle)\b/.test(s) && /\b(attack|attacks|roars|charges|fight|battle|lunges|breath)\b/.test(s)) return 'boss';
  if (/\b(attacks?|ambush(es)?|combat|initiative|charges at|lunges at|swings at|draws? (a |his |her |their )?(sword|blade|weapon|dagger|pistol|blaster)|battle begins|fight begins)\b/.test(s)) return 'battle';
  if (cur === 'battle' || cur === 'boss') return null;
  const order = [['tavern', /\b(tavern|inn|alehouse|pub|bar)\b/], ['shop', /\b(shop|merchant|store|market|blacksmith|vendor)\b/], ['port', /\b(port|harbou?r|docks?|ship|deck|pier)\b/], ['castle', /\b(castle|throne|palace|keep)\b/], ['dungeon', /\b(dungeon|crypt|tomb|ruins|shrine|catacombs?|caves?|cavern|tunnels?|sewers?)\b/], ['snow', /\b(snow|icy|frozen|blizzard|glacier)\b/], ['forest', /\b(forest|woods|jungle|grove|meadow|swamp)\b/], ['night', /\b(campfire|make camp|night falls|you rest|go to sleep)\b/], ['town', /\b(town|village|city|streets?|square|market)\b/], ['travel', /\b(road|journey|travel|path|ride|trail|space lane|hyperspace)\b/]];
  for (const o of order) if (o[1].test(s)) return o[0];
  return null;
}
function afterAdvReply(c, m) {
  if (m.applied) return; m.applied = true;
  const a = c.adv, p = a.player, t = m.content, fx = [], undo = { hp: p.hp, maxhp: p.maxhp, gold: p.gold, xp: p.xp, lvl: p.lvl, inv: p.inv.slice(), scene: a.scene, castLen: a.cast.length };
  let hurt = false, leveled = false, gotItem = false, gold = false, r;
  const re = /\[(HP|GOLD|XP)\s*:?\s*([+-]?)\s*(\d+)\s*\]/gi;
  while ((r = re.exec(t))) {
    const k = r[1].toUpperCase(), n = parseInt(r[3], 10) * (r[2] === '-' ? -1 : 1);
    if (k === 'HP') { p.hp = clamp(p.hp + n, 0, p.maxhp); fx.push('❤️ ' + (n > 0 ? '+' : '') + n); if (n < 0) hurt = true; }
    else if (k === 'GOLD') { p.gold = Math.max(0, p.gold + n); fx.push('💰 ' + (n > 0 ? '+' : '') + n); gold = true; }
    else { p.xp += Math.max(0, n); fx.push('⭐ +' + n + ' XP'); while (p.xp >= p.lvl * 100) { p.xp -= p.lvl * 100; p.lvl++; p.maxhp += 5; p.hp = p.maxhp; leveled = true; } if (leveled) fx.push('🎉 Level ' + p.lvl); }
  }
  const ri = /\[ITEM\s*:?\s*([+-])\s*([^\]]+)\]/gi;
  while ((r = ri.exec(t))) { const name = r[2].trim().slice(0, 40); if (r[1] === '+') { p.inv.push(name); fx.push('🎒 +' + name); gotItem = true; } else { const ix = p.inv.findIndex((x) => x.toLowerCase() === name.toLowerCase()); if (ix >= 0) p.inv.splice(ix, 1); fx.push('🎒 -' + name); } }
  const rn = /\[NEW\s*:?\s*([^|\]]+)\|?([^|\]]*)\|?([^\]]*)\]/gi;
  while ((r = rn.exec(t))) { const x = addCast(c, r[1], r[2].trim(), r[3].trim()); if (x && x.id) fx.push('👤 ' + x.name + ' joined the story'); }
  const rs = /\[SCENE\s*:?\s*([^\]]+)\]/i.exec(t);
  const scene = rs ? normScene(rs[1]) : detectScene(t, a.scene);
  if (scene && scene !== a.scene) { a.scene = scene; fx.push(SCENES[scene].e + ' ' + SCENES[scene].l); }
  m.fx = fx; m.undo = undo;
  playAdvSounds(c, t, { hurt: hurt, leveled: leveled, gotItem: gotItem, gold: gold, dead: p.hp <= 0 });
  musicScene(a.scene);
}
function undoAdvEffects(c, m) { const u = m.undo; if (!u) return; const p = c.adv.player; p.hp = u.hp; p.maxhp = u.maxhp; p.gold = u.gold; p.xp = u.xp; p.lvl = u.lvl; p.inv = u.inv; c.adv.scene = u.scene; }
function rollDie(n) { const a = new Uint32Array(1); crypto.getRandomValues(a); return (a[0] % n) + 1; }
function diceSound() { sfx('dice1'); setTimeout(() => sfx('dice2'), 90); setTimeout(() => sfx('dice3'), 200); }
function rollInto(n) {
  const r = rollDie(n); diceSound();
  const t = $('input'); const add = '(rolled d' + n + ': ' + r + ')';
  t.value = (t.value.trim() ? t.value.trim() + ' ' : '') + add; autoGrow();
  if (n === 20 && r === 20) setTimeout(() => sfx('j_success'), 350); else if (n === 20 && r === 1) setTimeout(() => sfx('j_fail'), 350);
  toast('🎲 d' + n + ': ' + r);
}
function rollRequested(what) {
  const m = /d(\d+)/i.exec(what); const n = m ? parseInt(m[1], 10) : 20;
  const r = rollDie(n); diceSound();
  if (n === 20 && r === 20) setTimeout(() => sfx('j_success'), 350); else if (n === 20 && r === 1) setTimeout(() => sfx('j_fail'), 350);
  send('(rolled ' + what.trim() + ': ' + r + ')', { to: ['DM'] });
}
const SFX_RULES = [
  ['door_open', /\b(doors?|gates?)\b[^.]{0,40}\b(open|opens|opened|swings|creaks open)\b|\bopens? the (door|gate)\b/],
  ['door_close', /\b(slams?|shuts?|closes?)\b[^.]{0,20}\b(door|gate)\b|\b(door|gate)\b[^.]{0,20}\b(slams|shuts|closes)\b/],
  ['draw', /\b(draws?|drew|unsheathes?|pulls? out)\b[^.]{0,25}\b(sword|blade|dagger|knife|weapon|cutlass|rapier)\b/],
  ['slash', /\b(slash(es)?|slices?|stabs?|strikes?|cuts? (down|into)|swings? (at|her|his))\b/],
  ['chop', /\b(axe|chops?|hack(s|ed)?)\b/],
  ['clang', /\b(clang|clash(es)?|parr(y|ies)|shield|armou?r rings)\b/],
  ['coins', /\b(coins?|gold pieces|purse|pays?|jingle)\b/],
  ['book', /\b(books?|scrolls?|maps?|pages?|tomes?|letters?|journal)\b/],
  ['latch', /\b(chests?|locks?|unlocks?|latch|lockpick)\b/],
  ['creak', /\bcreak/],
  ['step', /\b(footsteps|approaches|steps closer|walks in)\b/],
  ['cloth', /\b(cloak|robes?|rustl)\w*/],
  ['laser', /\b(laser|blasters?|fires? (a |his |her )?(pistol|rifle|blaster)|shoots?)\b/],
  ['zap', /\b(zap|shocks?|electric|sparks?)\b/],
  ['power_up', /\b(powers? up|hums? to life|boots? up)\b/]
];
function playAdvSounds(c, t, ev) {
  const s = stripTags(t).toLowerCase(); const scifi = c.adv.setting === 'scifi'; const hits = [];
  for (const rule of SFX_RULES) { if (hits.length >= 2) break; if (!scifi && (rule[0] === 'laser' || rule[0] === 'power_up')) continue; if (rule[1].test(s)) hits.push(rule[0]); }
  if (ev.gold && !hits.includes('coins')) hits.unshift('coins');
  hits.slice(0, 2).forEach((h, i) => setTimeout(() => sfx(h), 150 + i * 450));
  if (ev.dead) setTimeout(() => sfx('j_defeat'), 900);
  else if (ev.leveled) setTimeout(() => sfx('j_level'), 900);
  else if (ev.gotItem) setTimeout(() => sfx('j_item'), 900);
}


// ---------- sound ----------
const Sound = { ctx: null, bufs: {}, primed: false };
function audioCtx() { if (!Sound.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; try { Sound.ctx = new AC(); } catch (e) { return null; } } return Sound.ctx; }
const SILENT = 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQIAAACAgA==';
function unlockAudio() {
  const s = state && state.settings.sound; if (!s || !(s.ui || s.sfx || s.music)) return;
  const ac = audioCtx(); if (!ac) return;
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (!Sound.primed && s.music) { Sound.primed = true; musicInit(); const el = Music.el; if (el && !Music.slot) { el.src = SILENT; el.play().then(() => { el.pause(); }).catch(() => { Sound.primed = false; }); } }
}
async function getBuf(name) {
  if (Sound.bufs[name]) return Sound.bufs[name];
  const ac = audioCtx(); const r = await fetch('sfx/' + name + '.wav'); const ab = await r.arrayBuffer();
  const b = await new Promise((res, rej) => ac.decodeAudioData(ab, res, rej));
  Sound.bufs[name] = b; return b;
}
function sfx(name, kind) {
  kind = kind || 'sfx'; const s = state.settings.sound; if (!s[kind]) return;
  const ac = audioCtx(); if (!ac || ac.state !== 'running') return;
  getBuf(name).then((b) => { const src = ac.createBufferSource(); src.buffer = b; const g = ac.createGain(); g.gain.value = kind === 'ui' ? s.uiVol : s.sfxVol; src.connect(g); g.connect(ac.destination); src.start(); }).catch(() => {});
}

// ---------- music ----------
const Music = { el: null, gain: null, slot: null, ls: 0, ll: 0, url: '' };
function musicInit() {
  if (Music.el) return;
  const el = new Audio(); el.preload = 'auto'; el.setAttribute('playsinline', ''); Music.el = el;
  const ac = audioCtx();
  if (ac) { try { const node = ac.createMediaElementSource(el); Music.gain = ac.createGain(); Music.gain.gain.value = 0; node.connect(Music.gain); Music.gain.connect(ac.destination); } catch (e) { Music.gain = null; } }
  el.addEventListener('timeupdate', () => { if (Music.slot && Music.ll > 0 && el.currentTime >= Music.ls + Music.ll) el.currentTime = Music.ls; });
  el.addEventListener('ended', () => { if (!Music.slot) return; el.currentTime = Music.ls || 0; el.play().catch(() => {}); });
}
function musicVol(v, ms) {
  if (Music.gain) { const ac = audioCtx(); const g = Music.gain.gain; const now = ac.currentTime; g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(v, now + ms / 1000); }
  else if (Music.el) { try { Music.el.volume = v; } catch (e) {} }
}
let musicSeq = 0;
async function musicScene(scene, force) {
  const s = state.settings.sound; const c = activeChat();
  if (!s.music || !c || c.kind !== 'adv') { musicStop(); return; }
  const prefs = (SCENES[scene] && SCENES[scene].m) || [scene];
  const slot = prefs.find((k) => state.music[k]);
  if (!slot) { if (force) musicStop(); return; }
  musicInit();
  if (slot === Music.slot && !Music.el.paused) return;
  const seq = ++musicSeq;
  if (Music.slot && !Music.el.paused) { musicVol(0, 600); await sleep(650); }
  if (seq !== musicSeq) return;
  const rec = await idbGet('music:' + slot).catch(() => null); if (!rec || seq !== musicSeq) return;
  if (Music.url) URL.revokeObjectURL(Music.url);
  Music.url = URL.createObjectURL(rec); Music.el.src = Music.url; Music.slot = slot;
  const meta = state.music[slot] || {}; Music.ls = meta.ls || 0; Music.ll = meta.ll || 0;
  const ac = audioCtx(); if (ac && ac.state === 'suspended') { try { await ac.resume(); } catch (e) {} }
  try { await Music.el.play(); } catch (e) { Music.slot = null; renderSceneBar(c); return; }
  musicVol(s.musicVol, 900); renderSceneBar(c);
}
function musicStop() { musicSeq++; if (Music.el && !Music.el.paused) { musicVol(0, 400); const el = Music.el; setTimeout(() => el.pause(), 450); } Music.slot = null; }
async function importMusic(files) {
  let n = 0;
  for (const f of files) {
    let slot = null, ls = 0, ll = 0;
    for (const t of TRACKS) if (t[0].test(f.name)) { slot = t[1]; ls = t[2]; ll = t[3]; break; }
    if (!slot) slot = (MUSIC_SLOTS.find((x) => !state.music[x[0]]) || [null])[0];
    if (!slot) continue;
    try { await idbSet('music:' + slot, f); state.music[slot] = { name: f.name.replace(/\.[^.]+$/, ''), ls: ls, ll: ll }; n++; } catch (e) { toast('Could not store ' + f.name); }
  }
  saveNow(); toast(n + ' track' + (n === 1 ? '' : 's') + ' added');
  const c = activeChat(); if (c && c.kind === 'adv') musicScene(c.adv.scene, true);
}

// ---------- attachments ----------
function loadScript(src) { return new Promise((res, rej) => { if (document.querySelector('script[data-src="' + src + '"]')) return res(); const s = document.createElement('script'); s.src = src; s.dataset.src = src; s.onload = () => res(); s.onerror = () => rej(new Error('could not load a helper. The first use needs internet.')); document.head.appendChild(s); }); }
async function imageCanvas(f, max) {
  const bmp = await createImageBitmap(f); const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height); if (bmp.close) bmp.close(); return cv;
}
async function makeThumb(f, size) {
  const bmp = await createImageBitmap(f); const s = Math.min(bmp.width, bmp.height);
  const cv = document.createElement('canvas'); cv.width = size; cv.height = size;
  cv.getContext('2d').drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size); if (bmp.close) bmp.close();
  return cv.toDataURL('image/jpeg', 0.72);
}
async function ocrImage(f) {
  await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
  const cv = await imageCanvas(f, 1800);
  showLoad({ text: 'Getting the text reader ready...', progress: 0 });
  const worker = await window.Tesseract.createWorker('eng', 1, { logger: (m) => { if (m.status) showLoad({ text: (m.status === 'recognizing text' ? 'Reading text in the photo' : m.status) + '... ' + Math.round((m.progress || 0) * 100) + '%', progress: m.progress || 0 }); } });
  try { const r = await worker.recognize(cv); return (r.data && r.data.text || '').replace(/\n{3,}/g, '\n\n').trim(); }
  finally { try { await worker.terminate(); } catch (e) {} hideLoad(); }
}
async function pdfText(f) {
  const base = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/';
  const pdfjs = await import(base + 'pdf.min.mjs');
  if (!pdfjs.GlobalWorkerOptions.workerPort) { const src = await (await fetch(base + 'pdf.worker.min.mjs')).text(); pdfjs.GlobalWorkerOptions.workerPort = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })), { type: 'module' }); }
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise;
  let out = ''; const n = Math.min(doc.numPages, 300);
  try { for (let i = 1; i <= n; i++) { const pg = await doc.getPage(i); const tc = await pg.getTextContent(); out += tc.items.map((it) => (it.str || '') + (it.hasEOL ? '\n' : ' ')).join('') + '\n\n'; showLoad({ text: 'Reading PDF page ' + i + ' of ' + n, progress: i / n }); } }
  finally { hideLoad(); try { await doc.destroy(); } catch (e) {} }
  out = out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!out) throw new Error('this PDF has no text layer (it may be a scan). Take a photo of the page instead.');
  return out;
}
async function docxText(f) {
  await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js');
  const r = await window.mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() });
  return (r.value || '').replace(/\n{3,}/g, '\n\n').trim();
}
async function readAttachment(f) {
  const name = f.name || 'file'; const ext = (name.split('.').pop() || '').toLowerCase(); const type = f.type || '';
  if (type.indexOf('image/') === 0 || /^(jpe?g|png|heic|heif|webp|gif|bmp)$/.test(ext)) {
    const thumb = await makeThumb(f, 160).catch(() => '');
    const text = await ocrImage(f);
    return { name: name, kind: 'image', kindLabel: 'photo (text read from it)', text: text || '(no readable text was found in this photo)', thumb: thumb };
  }
  if (ext === 'pdf' || type === 'application/pdf') return { name: name, kind: 'pdf', kindLabel: 'PDF', text: await pdfText(f) };
  if (ext === 'docx') return { name: name, kind: 'docx', kindLabel: 'Word document', text: await docxText(f) };
  if (ext === 'doc') throw new Error('old .doc files are not supported. Save it as .docx or PDF.');
  if (f.size > 8 * 1024 * 1024) throw new Error('that file is too big (over 8 MB).');
  const text = await f.text();
  if (/\u0000/.test(text.slice(0, 2000))) throw new Error('this does not look like a text file.');
  return { name: name, kind: 'text', kindLabel: 'file', text: text };
}
async function handleFiles(files) {
  for (const f of Array.from(files || [])) {
    try { toast('Reading ' + f.name + '...', 60000); const a = await readAttachment(f); pendingAtts.push(a); renderAtts(); toast('Attached ' + a.name + ' (' + a.text.length.toLocaleString() + ' characters)'); }
    catch (e) { hideLoad(); toast('Could not read ' + f.name + ': ' + ((e && e.message) || e), 6000); }
  }
}
function renderAtts() {
  const box = $('attachPreview'); box.innerHTML = ''; box.hidden = !pendingAtts.length;
  pendingAtts.forEach((a, i) => {
    const d = el('div', 'att', (a.thumb ? '<img src="' + a.thumb + '" alt="">' : '<span>' + (a.kind === 'pdf' ? '📕' : a.kind === 'docx' ? '📘' : '📄') + '</span>') + '<span>' + esc(clip(a.name, 22)) + '</span><button aria-label="Remove">✕</button>');
    d.querySelector('button').onclick = () => { pendingAtts.splice(i, 1); renderAtts(); };
    box.appendChild(d);
  });
}
function pickFiles(accept, capture) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept; if (capture) inp.setAttribute('capture', 'environment'); if (!capture) inp.multiple = true;
  inp.onchange = () => { closeSheet(); handleFiles(inp.files); };
  inp.click();
}


// ---------- formatting ----------
function inline(s) {
  s = s.replace(new RegExp(BT + '([^' + BT + ']+)' + BT, 'g'), '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<i>$2</i>');
  return s;
}
function mdBlocks(t) {
  const lines = t.split('\n'); let out = '', list = null, i = 0;
  const close = () => { if (list) { out += '</' + list + '>'; list = null; } };
  while (i < lines.length) {
    const line = lines[i].trim(); let m;
    if (/^\|.*\|$/.test(line) && i + 1 < lines.length && /^\|?\s*:?-{2,}/.test(lines[i + 1].trim())) {
      close();
      const row = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((x) => inline(esc(x.trim())));
      out += '<div class="tbl"><table><thead><tr>' + row(line).map((x) => '<th>' + x + '</th>').join('') + '</tr></thead><tbody>';
      i += 2;
      while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) { out += '<tr>' + row(lines[i]).map((x) => '<td>' + x + '</td>').join('') + '</tr>'; i++; }
      out += '</tbody></table></div>'; continue;
    }
    if (!line) close();
    else if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) { close(); out += '<hr>'; }
    else if ((m = line.match(/^(#{1,6})\s+(.*)$/))) { close(); out += '<h4>' + inline(esc(m[2])) + '</h4>'; }
    else if ((m = line.match(/^[-*•]\s+(.*)$/))) { if (list !== 'ul') { close(); out += '<ul>'; list = 'ul'; } out += '<li>' + inline(esc(m[1])) + '</li>'; }
    else if ((m = line.match(/^(\d+)[.)]\s+(.*)$/))) { if (list !== 'ol') { close(); out += '<ol start="' + m[1] + '">'; list = 'ol'; } out += '<li>' + inline(esc(m[2])) + '</li>'; }
    else { close(); out += '<p>' + inline(esc(line)) + '</p>'; }
    i++;
  }
  close(); return out;
}
function md(text) {
  const fence = BT + BT + BT; let html = '';
  String(text || '').split(fence).forEach((part, i) => {
    if (i % 2 === 1) { const nl = part.indexOf('\n'); const code = nl >= 0 && /^[\w+#.-]*$/.test(part.slice(0, nl).trim()) ? part.slice(nl + 1) : part; html += '<pre><code>' + esc(code.replace(/\n$/, '')) + '</code></pre>'; }
    else html += mdBlocks(part);
  });
  return html;
}
function fmtAdv(t) {
  let s = esc(stripTags(t));
  s = s.replace(/\[ROLL\s+([^\]]+)\]/gi, (all, what) => '<button class="rollbtn" data-roll="' + what + '">🎲 Roll ' + what + '</button>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*\n]+)\*/g, '<em class="act">$1</em>');
  s = s.replace(/(&quot;|“)([^\n]*?)(&quot;|”)/g, '<span class="q">“$2”</span>');
  return s.replace(/\n/g, '<br>');
}

// ---------- rendering ----------
function nearBottom() { const b = $('messages'); return b.scrollHeight - b.scrollTop - b.clientHeight < 140; }
function scrollDown(force) { const b = $('messages'); if (force || nearBottom()) requestAnimationFrame(() => { b.scrollTop = b.scrollHeight; }); }
function renderAll() { const cc = activeChat(); document.body.classList.toggle('adv', !!(cc && cc.kind === 'adv')); renderHeader(); renderMessages(); renderComposer(); renderAtts(); updateModelPill(); }
function renderHeader() {
  const c = activeChat(); if (!c) return;
  if (c.kind === 'adv') { $('chatIcon').outerHTML = '<span id="chatIcon">' + avatar(dmOf(c).face, '🎲', 'sm') + '</span>'; $('chatTitle').textContent = c.title; }
  else { const p = personaOf(c); $('chatIcon').outerHTML = '<span id="chatIcon">' + avatar(p.face || p.emoji, p.emoji, 'sm') + '</span>'; $('chatTitle').textContent = c.titled ? c.title : p.name; }
}
function renderSceneBar(c) {
  const bar = $('sceneBar');
  if (!c || c.kind !== 'adv') { bar.hidden = true; return; }
  const a = c.adv, p = a.player, S = SCENES[a.scene] || SCENES.town;
  const hasMusic = Object.keys(state.music).length > 0;
  bar.hidden = false;
  bar.innerHTML = '<span>' + S.e + ' ' + esc(S.l) + '</span><span>❤️ ' + p.hp + '/' + p.maxhp + '</span><span>💰 ' + p.gold + '</span><span>⭐ Lv ' + p.lvl + '</span><span class="sp"></span>' + (hasMusic ? '<button id="btnMusic">' + (Music.slot && state.settings.sound.music ? '🎵 On' : '🔇 Music') + '</button>' : '') + '<button id="btnSheet">🎒</button>';
  bar.querySelectorAll('span').forEach((x) => { if (!x.classList.contains('sp')) x.onclick = () => openAdvSheet(c); });
  $('btnSheet').onclick = () => openAdvSheet(c);
  const bm = $('btnMusic');
  if (bm) bm.onclick = () => { const s = state.settings.sound; if (Music.slot && s.music) { s.music = false; musicStop(); } else { s.music = true; unlockAudio(); musicScene(a.scene, true); } saveNow(); setTimeout(() => renderSceneBar(c), 300); };
}
function emptyState(c) {
  if (c.kind === 'adv') return el('div', 'empty', '<div>' + avatar(dmOf(c).face, '🎲', 'lg') + '</div><h3>' + esc(c.title) + '</h3><div>' + (loadedModel ? 'Your tale begins. What do you do?' : 'Load a model (top right) to begin your tale.') + '</div>');
  const p = personaOf(c);
  return el('div', 'empty', '<div>' + avatar(p.face || p.emoji, p.emoji, 'lg') + '</div><h3>' + esc(p.name) + '</h3><div>' + esc(p.desc || '') + '</div>' + (loadedModel ? '' : '<p><b>Load a model</b> with the button at the top right.</p>') + (p.group === 'everyday' ? '<div class="note">' + esc(LIMITS) + '</div>' : ''));
}
function attHTML(m) { return (m.atts || []).map((a) => '<div class="att">' + (a.thumb ? '<img src="' + a.thumb + '" alt="">' : '<span>' + (a.kind === 'pdf' ? '📕' : a.kind === 'docx' ? '📘' : '📄') + '</span>') + '<span>' + esc(clip(a.name, 30)) + '<br><small class="muted">' + Number(a.chars || 0).toLocaleString() + ' characters</small></span></div>').join(''); }
function userBubble(c, m, isLast) {
  const isAdv = c.kind === 'adv';
  const row = el('div', 'row user');
  const face = isAdv ? avatar(c.adv.player.face, '🧑') : '';
  row.innerHTML = (isAdv ? face : '') + '<div class="bubble">' + (isAdv ? '<div class="name">' + esc(c.adv.player.name) + '</div>' : '') + (m.to && m.to.length ? '<div class="to">to ' + esc(m.to.join(', ')) + '</div>' : '') + attHTML(m) + '<div class="txt">' + (isAdv ? fmtAdv(m.content) : md(m.content)) + '</div>' + (isLast && !busy ? '<div class="acts"><button data-a="edit">✎ Edit</button><button data-a="undo">↶ Undo</button></div>' : '') + '</div>';
  return row;
}
function actsHTML(c, m, isLast) {
  let h = '<div class="acts"><button data-a="copy">⧉ Copy</button>';
  if (isLast && !busy && !m.greeting) h += '<button data-a="retry">↻ Retry</button>' + (m.error ? '' : '<button data-a="cont">➜ Continue</button>');
  return h + '</div>';
}
function aiBubble(c, m, isLast) {
  const p = personaOf(c);
  const row = el('div', 'row ai');
  const body = m.streaming && !m.content ? '<p class="muted">' + (m.thinking || thinkingModel() ? '🤔 thinking...' : '...') + '</p>' : md(m.content);
  row.innerHTML = avatar(p.face || p.emoji, p.emoji) + '<div class="bubble"><div class="name">' + esc(p.name) + '</div><div class="txt">' + body + '</div>' + (m.streaming ? '' : actsHTML(c, m, isLast)) + '</div>';
  row.dataset.copy = m.content;
  return row;
}
function advBlock(c, m, isLast) {
  const wrap = el('div', 'advmsg');
  let segs = parseAdv(c, m.content);
  if (!segs.length) segs = [{ who: dmOf(c), text: m.streaming ? (thinkingModel() ? '🤔 thinking...' : '...') : '' }];
  segs.forEach((s, k) => {
    const who = s.who; const isDM = who.role === 'dm'; const isP = !!who.player;
    const face = isP ? c.adv.player.face : (who.face || pickFace(c, who.name, ''));
    const row = el('div', 'row ' + (isP ? 'user' : 'ai') + (isDM ? ' dm' : ''));
    const isEnd = k === segs.length - 1;
    row.innerHTML = avatar(face, isDM ? '🎲' : '🙂') + '<div class="bubble"><div class="name">' + esc(isP ? c.adv.player.name : who.name) + '</div><div class="txt">' + fmtAdv(s.text) + '</div>' + (isEnd && !m.streaming ? actsHTML(c, m, isLast) : '') + '</div>';
    wrap.appendChild(row);
  });
  if (m.fx && m.fx.length) wrap.appendChild(el('div', 'fx', m.fx.map((x) => '<span>' + esc(x) + '</span>').join('')));
  wrap.dataset.copy = segs.map((s) => (s.who.player ? c.adv.player.name : s.who.name) + ': ' + stripTags(s.text)).join('\n');
  return wrap;
}
function msgNode(c, m, i, lastA, lastU) {
  if (m.role === 'user') return userBubble(c, m, i === lastU);
  return c.kind === 'adv' ? advBlock(c, m, i === lastA) : aiBubble(c, m, i === lastA);
}
function renderMessages() {
  const c = activeChat(); const box = $('messages'); box.innerHTML = '';
  if (!c) return;
  renderSceneBar(c);
  if (!c.messages.some((m) => !m.hidden)) box.appendChild(emptyState(c));
  const lastA = lastIndex(c.messages, (m) => m.role === 'assistant');
  const lastU = lastIndex(c.messages, (m) => m.role === 'user' && !m.hidden);
  c.messages.forEach((m, i) => { if (m.hidden) return; const n = msgNode(c, m, i, lastA, lastU); n.dataset.i = i; box.appendChild(n); });
  if (memBusy) showMemDot(true);
  scrollDown(true);
}
function updateStreaming(c, m) {
  const box = $('messages'); const i = c.messages.indexOf(m);
  const old = box.querySelector('[data-i="' + i + '"]');
  const stick = nearBottom();
  const n = msgNode(c, m, i, i, -1); n.dataset.i = i;
  if (old) old.replaceWith(n); else box.appendChild(n);
  if (stick) box.scrollTop = box.scrollHeight;
}
function onMessagesClick(e) {
  const rb = e.target.closest('.rollbtn');
  if (rb) { if (!busy) rollRequested(rb.getAttribute('data-roll') || 'd20'); return; }
  const b = e.target.closest('button[data-a]'); if (!b) return;
  const a = b.dataset.a;
  if (a === 'copy') { const holder = b.closest('[data-copy]') || b.closest('.advmsg'); copyText(holder ? holder.dataset.copy : ''); }
  else if (a === 'retry') retryLast(); else if (a === 'cont') continueLast(); else if (a === 'undo') undoLast(false); else if (a === 'edit') undoLast(true);
}
function chip(label, cls) { const b = el('button', 'chip' + (cls ? ' ' + cls : '')); b.innerHTML = label; return b; }
function keepFocus(b) { b.addEventListener('mousedown', (e) => e.preventDefault()); b.addEventListener('touchstart', (e) => { if (document.activeElement === $('input')) { e.preventDefault(); b.click(); } }, { passive: false }); }
function insertPair(ch) {
  const t = $('input'); const s = t.selectionStart == null ? t.value.length : t.selectionStart; const e = t.selectionEnd == null ? s : t.selectionEnd; const v = t.value; const sel = v.slice(s, e);
  t.value = v.slice(0, s) + ch + sel + ch + v.slice(e);
  const pos = sel ? e + 2 : s + 1;
  t.focus(); t.setSelectionRange(pos, pos); autoGrow();
}
function quickSend(q) {
  const t = $('input'); const typed = t.value.trim();
  if (typed && q[1]) { t.value = ''; autoGrow(); send(q[1] + '\n\n' + typed); }
  else send(q[2] || q[1]);
}
const ADV_QUICK = [['👀 Look around', '*looks around carefully*'], ['🔍 Search', '*searches the area*'], ['⚔️ Attack', '*attacks*'], ['🤫 Sneak', '*tries to move quietly*'], ['💬 Talk', null], ['🏕️ Rest', '*rests for a while*'], ['📜 Recap', 'recap']];
function renderComposer() {
  const c = activeChat(); if (!c) return;
  const sendBtn = $('btnSend');
  sendBtn.classList.toggle('stop', busy); sendBtn.innerHTML = busy ? '■' : '➤'; sendBtn.setAttribute('aria-label', busy ? 'Stop' : 'Send');
  const quick = $('quick'); quick.innerHTML = '';
  const tools = $('tools'); tools.innerHTML = '';
  const toRow = $('toRow'); toRow.innerHTML = '';
  if (c.kind === 'adv') {
    $('input').placeholder = 'Message as ' + c.adv.player.name;
    toRow.hidden = false;
    const sel = c.adv.to || [];
    const all = chip('👥 Everyone', sel.length ? '' : 'on'); all.onclick = () => { c.adv.to = []; save(); renderComposer(); }; toRow.appendChild(all);
    c.adv.cast.forEach((x) => {
      const on = sel.includes(x.name);
      const b = chip(avatar(x.face, x.role === 'dm' ? '🎲' : '🙂') + esc(x.name), on ? 'on' : '');
      b.onclick = () => { const s = new Set(c.adv.to || []); if (s.has(x.name)) s.delete(x.name); else s.add(x.name); c.adv.to = Array.from(s); save(); renderComposer(); };
      toRow.appendChild(b);
    });
    tools.hidden = false;
    const mode = c.adv.mode || 'do';
    [['do', '🗡️ Do'], ['say', '💬 Say'], ['story', '📜 Story']].forEach((md) => { const b = chip(md[1], 'mode' + (mode === md[0] ? ' on' : '')); keepFocus(b); b.onclick = () => { c.adv.mode = md[0]; save(); renderComposer(); }; tools.appendChild(b); });
    const dice = chip('🎲', 'sym'); dice.onclick = () => openDiceSheet(c); tools.appendChild(dice);
    ['"', '*'].forEach((ch) => { const b = chip(ch === '"' ? '“ ”' : '* *', 'sym'); keepFocus(b); b.onclick = () => insertPair(ch); tools.appendChild(b); });
    $('input').placeholder = mode === 'say' ? 'What do you say?' : mode === 'story' ? 'What happens next?' : 'What do you do?';
  } else {
    const p = personaOf(c);
    $('input').placeholder = 'Message ' + p.name;
    toRow.hidden = true; tools.hidden = true;
    (p.quick || []).forEach((q) => { const b = chip(esc(q[0])); keepFocus(b); b.onclick = () => { if (!busy) quickSend(q); }; quick.appendChild(b); });
  }
  quick.hidden = !quick.children.length;
}
function autoGrow() { const t = $('input'); t.style.height = 'auto'; t.style.height = Math.min(140, t.scrollHeight + 2) + 'px'; }


// ---------- drawer and sheets ----------
function openDrawer() { renderDrawer(); $('drawer').classList.add('open'); $('drawer').setAttribute('aria-hidden', 'false'); $('scrim').hidden = false; sfx('open', 'ui'); }
function closeDrawer() { $('drawer').classList.remove('open'); $('drawer').setAttribute('aria-hidden', 'true'); if ($('sheet').hidden) $('scrim').hidden = true; }
function openSheet(title, html, mount) {
  $('sheetBody').innerHTML = '<div class="sheetHead"><h3>' + esc(title) + '</h3><button aria-label="Close" id="sheetX">✕</button></div>' + html;
  $('sheet').hidden = false; $('scrim').hidden = false; $('sheet').scrollTop = 0;
  $('sheetX').onclick = closeSheet;
  if (mount) mount($('sheetBody'));
}
function closeSheet() { $('sheet').hidden = true; if (!$('drawer').classList.contains('open')) $('scrim').hidden = true; }
function chatItem(c) {
  const isAdv = c.kind === 'adv'; const p = isAdv ? null : personaOf(c);
  const b = el('div', 'item' + (c.id === state.settings.activeChatId ? ' on' : ''));
  b.innerHTML = avatar(isAdv ? dmOf(c).face : (p.face || p.emoji), isAdv ? '🎲' : p.emoji, 'sm') + '<div class="meta"><div>' + esc(c.title) + '</div><small>' + esc(isAdv ? (SETTINGS[c.adv.setting] || SETTINGS.custom).label + ' · ' + c.adv.player.name : p.name) + '</small></div><button class="more" aria-label="Options">⋯</button>';
  b.onclick = (e) => { if (e.target.closest('.more')) { openChatOptions(c); return; } openChat(c.id); };
  return b;
}
function renderDrawer() {
  const d = $('drawer'); d.innerHTML = '';
  d.appendChild(el('div', 'dh', '<img src="icon-192.png" alt=""><b>Popeye AI</b>'));
  const row = el('div', 'btnrow', '<button class="btn pri" id="dNewChat">💬 New chat</button><button class="btn" id="dNewAdv">🎲 New adventure</button>');
  d.appendChild(row);
  row.querySelector('#dNewChat').onclick = () => { closeDrawer(); openNewChatSheet(); };
  row.querySelector('#dNewAdv').onclick = () => { closeDrawer(); openNewAdventure(); };
  const chats = state.chats.filter((c) => c.kind !== 'adv').sort((a, b) => b.updated - a.updated);
  const advs = state.chats.filter((c) => c.kind === 'adv').sort((a, b) => b.updated - a.updated);
  d.appendChild(el('div', 'sec', '💬 Chats'));
  if (!chats.length) d.appendChild(el('div', 'muted', '&nbsp; No chats yet'));
  chats.forEach((c) => d.appendChild(chatItem(c)));
  d.appendChild(el('div', 'sec', '🎲 Adventures'));
  if (!advs.length) d.appendChild(el('div', 'muted', '&nbsp; No adventures yet'));
  advs.forEach((c) => d.appendChild(chatItem(c)));
  d.appendChild(el('div', 'sec', 'More'));
  [['🌗 Appearance: ' + ({ auto: 'Auto', light: 'Light', dark: 'Dark' })[state.settings.theme || 'auto'], openAppearance], ['👤 Personas', openPersonas], ['🧠 About you (memory)', openAboutYou], ['🤖 Model', openModelSheet], ['🔊 Sound & music', openSoundSheet], ['⚙️ Settings & backup', openSettings], ['ℹ️ About & credits', openCredits]].forEach((x) => { const b = el('button', 'link', '<span>' + x[0] + '</span><span class="muted">›</span>'); b.onclick = () => { closeDrawer(); x[1](); }; d.appendChild(b); });
  d.appendChild(el('div', 'ver', 'Version ' + APP_VERSION));
}
function openChatOptions(c) {
  closeDrawer();
  openSheet(c.title, '<label>Name</label><input id="coName" value="' + esc(c.title) + '"><div class="btnrow"><button class="btn pri" id="coSave">Save name</button></div><div class="btnrow"><button class="btn danger" id="coDel">Delete</button></div>', (b) => {
    b.querySelector('#coSave').onclick = () => { c.title = b.querySelector('#coName').value.trim() || c.title; c.titled = true; saveNow(); renderHeader(); closeSheet(); };
    const del = b.querySelector('#coDel'); let armed = false;
    del.onclick = () => { if (!armed) { armed = true; del.textContent = 'Tap again to delete for good'; return; } deleteChat(c.id); closeSheet(); };
  });
}
function personaGrid(list) { return '<div class="pgrid">' + list.map((p) => '<button data-p="' + esc(p.id) + '">' + avatar(p.face || p.emoji, p.emoji) + '<span>' + esc(p.name) + '</span></button>').join('') + '</div>'; }
function openNewChatSheet() {
  const ev = state.personas.filter((p) => p.group === 'everyday'), fun = state.personas.filter((p) => p.group === 'fun'), mine = state.personas.filter((p) => p.group === 'mine');
  openSheet('New chat', '<div class="sec">Everyday</div>' + personaGrid(ev) + (fun.length ? '<div class="sec">Fun</div>' + personaGrid(fun) : '') + (mine.length ? '<div class="sec">My personas</div>' + personaGrid(mine) : '') + '<div class="btnrow"><button class="btn" id="ncAdv">🎲 Start an adventure instead</button></div>', (b) => {
    b.querySelectorAll('[data-p]').forEach((x) => { x.onclick = () => { const c = newChat(x.dataset.p); closeSheet(); openChat(c.id); }; });
    b.querySelector('#ncAdv').onclick = () => openNewAdventure();
  });
}
function openFacePicker(current, cb) {
  const faces = FACES.map((t, i) => faceTag(i));
  const custom = state.customFaces.map((id) => 'c:' + id);
  openSheet('Choose a face', '<div class="grid">' + faces.concat(custom).map((f) => '<button data-f="' + f + '" class="' + (f === current ? 'on' : '') + '"><img src="' + esc(faceSrc(f)) + '" alt=""></button>').join('') + '</div><div class="sec">Or an emoji</div><div class="grid">' + EMOJIS.map((e) => '<button data-f="' + e + '">' + e + '</button>').join('') + '</div><div class="btnrow"><button class="btn" id="fpUp">📷 Use my own picture</button></div>', (b) => {
    b.querySelectorAll('[data-f]').forEach((x) => { x.onclick = () => { cb(x.dataset.f); }; });
    b.querySelector('#fpUp').onclick = () => {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = async () => { const f = inp.files[0]; if (!f) return; try { const url = await makeThumb(f, 256); const blob = await (await fetch(url)).blob(); const id = uid(); await idbSet('face:' + id, blob); state.customFaces.push(id); customUrls[id] = URL.createObjectURL(blob); saveNow(); cb('c:' + id); } catch (e) { toast('Could not use that picture'); } };
      inp.click();
    };
  });
}
function openNewAdventure() {
  const d = { setting: 'fantasy', tone: 'Serious', name: '', cls: 'Warrior', face: 'f00', premise: '', companions: true };
  const draw = () => {
    const S = SETTINGS[d.setting];
    openSheet('New adventure', '<label>Setting</label><div class="chips" style="flex-wrap:wrap">' + Object.keys(SETTINGS).map((k) => '<button class="chip ' + (k === d.setting ? 'on' : '') + '" data-set="' + k + '">' + SETTINGS[k].e + ' ' + SETTINGS[k].label + '</button>').join('') + '</div>' +
      '<label>Tone</label><div class="chips" style="flex-wrap:wrap">' + TONES.map((t) => '<button class="chip ' + (t === d.tone ? 'on' : '') + '" data-tone="' + t + '">' + t + '</button>').join('') + '</div>' +
      '<label>Story idea (optional)</label><textarea id="naPrem" rows="2" placeholder="' + (d.setting === 'custom' ? 'Describe your world and goal' : 'e.g. a stolen crown, a haunted lighthouse') + '">' + esc(d.premise) + '</textarea>' +
      '<div class="sec">Your character</div><div class="castRow"><button id="naFace">' + avatar(d.face, '🧑', 'lg') + '</button><div class="meta"><label>Name</label><input id="naName" value="' + esc(d.name) + '" placeholder="Your name"><label>Class or role</label><input id="naCls" value="' + esc(d.cls) + '"></div></div>' +
      '<div class="chips" style="flex-wrap:wrap">' + (CLASSES[d.setting] || []).map((x) => '<button class="chip" data-cls="' + x + '">' + x + '</button>').join('') + '</div>' +
      '<div class="tog"><span>Start with companions' + ((COMPANIONS[d.setting] || []).length ? ' (' + COMPANIONS[d.setting].map((x) => x.name).join(' and ') + ')' : '') + '</span><input type="checkbox" id="naComp" ' + (d.companions ? 'checked' : '') + '></div>' +
      '<div class="btnrow"><button class="btn pri" id="naGo">Start adventure</button></div>', (b) => {
      const keep = () => { d.premise = b.querySelector('#naPrem').value; d.name = b.querySelector('#naName').value; d.cls = b.querySelector('#naCls').value; d.companions = b.querySelector('#naComp').checked; };
      b.querySelectorAll('[data-set]').forEach((x) => { x.onclick = () => { keep(); d.setting = x.dataset.set; d.cls = (CLASSES[d.setting] || ['Hero'])[0]; draw(); }; });
      b.querySelectorAll('[data-tone]').forEach((x) => { x.onclick = () => { keep(); d.tone = x.dataset.tone; draw(); }; });
      b.querySelectorAll('[data-cls]').forEach((x) => { x.onclick = () => { b.querySelector('#naCls').value = x.dataset.cls; }; });
      b.querySelector('#naFace').onclick = () => { keep(); openFacePicker(d.face, (f) => { d.face = f; draw(); }); };
      b.querySelector('#naGo').onclick = () => { keep(); startAdventure(d); };
    });
  };
  draw();
}
function startAdventure(d) {
  const c = newAdvShell(d.setting, d.tone);
  const a = c.adv;
  a.premise = d.premise.trim();
  if (d.setting === 'custom' && a.premise) a.settingText = a.premise;
  a.player.name = d.name.trim() || 'Traveller'; a.player.cls = d.cls.trim() || 'Adventurer'; a.player.face = d.face;
  a.player.inv = (STARTER[a.player.cls] || ['torch', 'rope', 'rations']).slice();
  if (d.setting === 'scifi') a.cast[0].face = 'f41';
  if (d.companions) (COMPANIONS[d.setting] || []).forEach((x) => a.cast.push({ id: uid(), name: x.name, role: 'party', gender: x.gender, face: x.face === a.player.face ? pickFace(c, x.desc, x.gender) : x.face, desc: x.desc }));
  c.title = (SETTINGS[d.setting] || SETTINGS.custom).label + ' · ' + a.player.name;
  state.chats.unshift(c); state.settings.activeChatId = c.id; saveNow();
  closeSheet(); renderAll(); unlockAudio(); sfx('j_start'); musicScene(a.scene, true);
  if (loadedModel) send('Start the adventure: set the opening scene in 2 or 3 lines, let each companion say one short line, then ask what I do.', { hidden: true, to: ['Everyone'] });
  else { toast('Load a model, then say anything to begin.'); openModelSheet(); }
}
function openAdvSheet(c) {
  const a = c.adv, p = a.player;
  const castHTML = a.cast.map((x) => '<div class="castRow" data-id="' + esc(x.id) + '">' + avatar(x.face, x.role === 'dm' ? '🎲' : '🙂') + '<div class="meta"><div><b>' + esc(x.name) + '</b> <small>' + (x.role === 'dm' ? 'game master' : x.role === 'party' ? 'party' : 'character') + '</small></div><small>' + esc(clip(x.desc, 70)) + '</small></div><button class="btn" data-edit="' + esc(x.id) + '">Edit</button></div>').join('');
  openSheet(c.title,
    '<div class="sec">Your character</div><div class="castRow"><button id="asFace">' + avatar(p.face, '🧑', 'lg') + '</button><div class="meta"><label>Name</label><input id="asName" value="' + esc(p.name) + '"><label>Class</label><input id="asCls" value="' + esc(p.cls) + '"></div></div>' +
    '<div class="stat"><span style="width:70px">❤️ HP</span><button data-hp="-1">−</button><input id="asHp" type="number" value="' + p.hp + '"><span>/</span><input id="asMax" type="number" value="' + p.maxhp + '"><button data-hp="1">+</button></div>' +
    '<div class="stat"><span style="width:70px">💰 Gold</span><input id="asGold" type="number" value="' + p.gold + '"><span>⭐ Lv</span><input id="asLvl" type="number" value="' + p.lvl + '"><span>XP</span><input id="asXp" type="number" value="' + p.xp + '"></div>' +
    '<label>🎒 Inventory (one item per line)</label><textarea id="asInv" rows="4">' + esc(p.inv.join('\n')) + '</textarea>' +
    '<div class="sec">Cast</div>' + castHTML + '<div class="btnrow"><button class="btn" id="asAdd">＋ Add character</button></div>' +
    '<div class="sec">Story log (auto memory)</div><textarea id="asMem" rows="6" placeholder="Fills in automatically as you play">' + esc(c.memory) + '</textarea><div class="btnrow"><button class="btn" id="asMemNow">🧠 Update now</button></div>' +
    '<div class="sec">World</div><label>Setting</label><textarea id="asSet" rows="2">' + esc(a.settingText) + '</textarea><label>Story idea</label><textarea id="asPrem" rows="2">' + esc(a.premise) + '</textarea><label>Tone</label><input id="asTone" value="' + esc(a.tone) + '">' +
    '<div class="btnrow"><button class="btn pri" id="asSave">Save</button></div>', (b) => {
    const q = (s) => b.querySelector(s);
    const keep = () => { p.name = q('#asName').value.trim() || p.name; p.cls = q('#asCls').value.trim() || p.cls; p.maxhp = Math.max(1, parseInt(q('#asMax').value, 10) || p.maxhp); p.hp = clamp(parseInt(q('#asHp').value, 10) || 0, 0, p.maxhp); p.gold = Math.max(0, parseInt(q('#asGold').value, 10) || 0); p.lvl = Math.max(1, parseInt(q('#asLvl').value, 10) || 1); p.xp = Math.max(0, parseInt(q('#asXp').value, 10) || 0); p.inv = q('#asInv').value.split('\n').map((s) => s.trim()).filter(Boolean); c.memory = q('#asMem').value.trim(); a.settingText = q('#asSet').value.trim(); a.premise = q('#asPrem').value.trim(); a.tone = q('#asTone').value.trim() || a.tone; save(); };
    b.querySelectorAll('[data-hp]').forEach((x) => { x.onclick = () => { q('#asHp').value = clamp((parseInt(q('#asHp').value, 10) || 0) + parseInt(x.dataset.hp, 10), 0, parseInt(q('#asMax').value, 10) || 1); }; });
    q('#asFace').onclick = () => { keep(); openFacePicker(p.face, (f) => { p.face = f; save(); renderAll(); openAdvSheet(c); }); };
    b.querySelectorAll('[data-edit]').forEach((x) => { x.onclick = () => { keep(); openCastEdit(c, a.cast.find((y) => y.id === x.dataset.edit)); }; });
    q('#asAdd').onclick = () => { keep(); openCastEdit(c, null); };
    q('#asMemNow').onclick = async () => { keep(); if (!loadedModel) { toast('Load a model first'); return; } closeSheet(); await updateMemory(c); openAdvSheet(c); };
    q('#asSave').onclick = () => { keep(); saveNow(); closeSheet(); renderAll(); };
  });
}
function openCastEdit(c, x) {
  const isNew = !x;
  const d = x ? Object.assign({}, x) : { id: uid(), name: '', role: 'party', gender: 'f', face: pickFace(c, '', 'f'), desc: '' };
  const draw = () => openSheet(isNew ? 'New character' : d.name, '<div class="castRow"><button id="ceFace">' + avatar(d.face, '🙂', 'lg') + '</button><div class="meta"><label>Name</label><input id="ceName" value="' + esc(d.name) + '"></div></div>' +
    (d.role === 'dm' ? '' : '<label>Role</label><select id="ceRole"><option value="party"' + (d.role === 'party' ? ' selected' : '') + '>Party member</option><option value="npc"' + (d.role === 'npc' ? ' selected' : '') + '>Other character</option></select><label>Gender</label><select id="ceG"><option value="f"' + (d.gender === 'f' ? ' selected' : '') + '>Female</option><option value="m"' + (d.gender === 'm' ? ' selected' : '') + '>Male</option><option value=""' + (!d.gender ? ' selected' : '') + '>Other</option></select>') +
    '<label>Personality and details</label><textarea id="ceDesc" rows="3" placeholder="e.g. elf ranger; calm, protective, dry humour">' + esc(d.desc) + '</textarea>' +
    '<div class="btnrow"><button class="btn pri" id="ceSave">Save</button>' + (isNew || d.role === 'dm' ? '' : '<button class="btn danger" id="ceDel">Remove</button>') + '</div>', (b) => {
    const q = (s) => b.querySelector(s);
    const keep = () => { d.name = q('#ceName').value.trim(); if (q('#ceRole')) d.role = q('#ceRole').value; if (q('#ceG')) d.gender = q('#ceG').value; d.desc = q('#ceDesc').value.trim(); };
    q('#ceFace').onclick = () => { keep(); openFacePicker(d.face, (f) => { d.face = f; draw(); }); };
    q('#ceSave').onclick = () => { keep(); if (!d.name) { toast('Give them a name'); return; } if (isNew) c.adv.cast.push(d); else Object.assign(x, d); saveNow(); renderAll(); openAdvSheet(c); };
    if (q('#ceDel')) q('#ceDel').onclick = () => { c.adv.cast = c.adv.cast.filter((y) => y.id !== x.id); c.adv.to = (c.adv.to || []).filter((n) => n !== x.name); saveNow(); renderAll(); openAdvSheet(c); };
  });
  draw();
}
function openDiceSheet(c) {
  openSheet('Dice & actions', '<div class="dicegrid">' + [4, 6, 8, 10, 12, 20].map((n) => '<button data-d="' + n + '">d' + n + '</button>').join('') + '</div><p class="muted">The roll goes into your message so you can add what you do.</p><div class="sec">Quick actions</div><div class="chips" style="flex-wrap:wrap">' + ADV_QUICK.map((q, i) => '<button class="chip" data-q="' + i + '">' + q[0] + '</button>').join('') + '</div>', (b) => {
    b.querySelectorAll('[data-d]').forEach((x) => { x.onclick = () => { closeSheet(); rollInto(parseInt(x.dataset.d, 10)); }; });
    b.querySelectorAll('[data-q]').forEach((x) => { x.onclick = () => { const q = ADV_QUICK[parseInt(x.dataset.q, 10)]; closeSheet(); if (busy) return; if (q[1] === null) { c.adv.mode = 'say'; renderComposer(); $('input').focus(); return; } if (q[1] === 'recap') { send('(Out of character) Give me a short recap of the story so far and my current goal.', { to: ['DM'] }); return; } send(q[1]); }; });
  });
}
function openChatInfo() {
  const c = activeChat(); if (!c) return;
  if (c.kind === 'adv') { openAdvSheet(c); return; }
  const p = personaOf(c);
  openSheet(c.title, '<div class="castRow">' + avatar(p.face || p.emoji, p.emoji, 'lg') + '<div class="meta"><b>' + esc(p.name) + '</b><br><small>' + esc(p.desc || '') + '</small></div></div>' +
    '<label>Chat name</label><input id="ciName" value="' + esc(c.title) + '">' +
    '<label>Persona</label><select id="ciP">' + state.personas.map((x) => '<option value="' + esc(x.id) + '"' + (x.id === c.personaId ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') + '</select>' +
    '<label>Memory of this chat (updates automatically)</label><textarea id="ciMem" rows="6" placeholder="Fills in as you chat">' + esc(c.memory) + '</textarea>' +
    '<div class="btnrow"><button class="btn" id="ciMemNow">🧠 Update now</button><button class="btn pri" id="ciSave">Save</button></div>', (b) => {
    const q = (s) => b.querySelector(s);
    const keep = () => { c.title = q('#ciName').value.trim() || c.title; c.titled = true; c.personaId = q('#ciP').value; c.memory = q('#ciMem').value.trim(); saveNow(); };
    q('#ciSave').onclick = () => { keep(); closeSheet(); renderAll(); };
    q('#ciMemNow').onclick = async () => { keep(); if (!loadedModel) { toast('Load a model first'); return; } closeSheet(); await updateMemory(c); openChatInfo(); };
  });
}


function openPersonas() {
  const groups = [['everyday', 'Everyday'], ['fun', 'Fun'], ['mine', 'My personas']];
  openSheet('Personas', groups.map((g) => { const list = state.personas.filter((p) => p.group === g[0]); if (!list.length && g[0] !== 'mine') return ''; return '<div class="sec">' + g[1] + '</div>' + list.map((p) => '<div class="castRow">' + avatar(p.face || p.emoji, p.emoji) + '<div class="meta"><b>' + esc(p.name) + '</b><br><small>' + esc(p.desc || clip(p.prompt, 60)) + '</small></div><button class="btn" data-chat="' + esc(p.id) + '">Chat</button><button class="btn" data-ed="' + esc(p.id) + '">Edit</button></div>').join(''); }).join('') + '<div class="btnrow"><button class="btn pri" id="pNew">＋ New persona</button></div><div class="btnrow"><button class="btn" id="pReset">Restore built-in personas</button></div>', (b) => {
    b.querySelectorAll('[data-chat]').forEach((x) => { x.onclick = () => { const c = newChat(x.dataset.chat); closeSheet(); openChat(c.id); }; });
    b.querySelectorAll('[data-ed]').forEach((x) => { x.onclick = () => openPersonaEdit(state.personas.find((p) => p.id === x.dataset.ed)); });
    b.querySelector('#pNew').onclick = () => openPersonaEdit(null);
    b.querySelector('#pReset').onclick = () => { const mine = state.personas.filter((p) => p.group === 'mine'); state.personas = defaultPersonas().concat(mine); saveNow(); renderAll(); openPersonas(); toast('Built-in personas restored'); };
  });
}
function openPersonaEdit(p) {
  const isNew = !p;
  const d = p ? JSON.parse(JSON.stringify(p)) : { id: uid(), group: 'mine', name: '', emoji: '🙂', face: '', temp: 0.8, desc: '', prompt: 'You are ', quick: [], greeting: '' };
  const draw = () => openSheet(isNew ? 'New persona' : d.name, '<div class="castRow"><button id="peFace">' + avatar(d.face || d.emoji, d.emoji, 'lg') + '</button><div class="meta"><label>Name</label><input id="peName" value="' + esc(d.name) + '"><label>Short description</label><input id="peDesc" value="' + esc(d.desc || '') + '"></div></div>' +
    '<label>Instructions (who it is and how it should reply)</label><textarea id="pePrompt" rows="6">' + esc(d.prompt) + '</textarea>' +
    '<label>Creativity: <span id="peTv">' + d.temp + '</span></label><input id="peTemp" type="range" min="0" max="1.2" step="0.05" value="' + d.temp + '">' +
    '<label>Quick buttons, one per line: Label | instruction</label><textarea id="peQuick" rows="4" placeholder="Summarise | Summarise this in 3 bullet points:">' + esc((d.quick || []).map((q) => q[0] + ' | ' + (q[1] || q[2])).join('\n')) + '</textarea>' +
    '<label>First message (optional)</label><input id="peGreet" value="' + esc(d.greeting || '') + '">' +
    '<div class="btnrow"><button class="btn pri" id="peSave">Save</button>' + (d.group === 'mine' && !isNew ? '<button class="btn danger" id="peDel">Delete</button>' : '') + '</div>', (b) => {
    const q = (s) => b.querySelector(s);
    q('#peTemp').oninput = () => { q('#peTv').textContent = q('#peTemp').value; };
    const keep = () => {
      d.name = q('#peName').value.trim(); d.desc = q('#peDesc').value.trim(); d.prompt = q('#pePrompt').value.trim(); d.temp = parseFloat(q('#peTemp').value); d.greeting = q('#peGreet').value.trim();
      d.quick = q('#peQuick').value.split('\n').map((l) => l.split('|')).filter((x) => x[0].trim()).map((x) => { const instr = (x[1] || x[0]).trim(); return [x[0].trim(), /:\s*$/.test(instr) ? instr : '', /:\s*$/.test(instr) ? instr.replace(/:\s*$/, ' (use the text above).') : instr]; });
    };
    q('#peFace').onclick = () => { keep(); openFacePicker(d.face, (f) => { if (/^(f\d\d|c:)/.test(f)) d.face = f; else { d.face = ''; d.emoji = f; } draw(); }); };
    q('#peSave').onclick = () => { keep(); if (!d.name) { toast('Give it a name'); return; } if (isNew) state.personas.push(d); else Object.assign(p, d); saveNow(); renderAll(); openPersonas(); };
    if (q('#peDel')) q('#peDel').onclick = () => { state.personas = state.personas.filter((x) => x.id !== p.id); state.chats.forEach((c) => { if (c.personaId === p.id) c.personaId = 'assistant'; }); saveNow(); renderAll(); openPersonas(); };
  });
  draw();
}
function openAboutYou() {
  openSheet('About you', '<p class="muted">Facts Popeye remembers about you. Every everyday chat can see these. Adventures keep their own story memory instead.</p><textarea id="ayText" rows="8" placeholder="- My name is ...&#10;- I work as ...">' + esc(state.profile.about) + '</textarea>' +
    '<div class="tog"><span>Learn about me automatically</span><input type="checkbox" id="ayAuto" ' + (state.settings.aboutAuto ? 'checked' : '') + '></div>' +
    '<div class="btnrow"><button class="btn" id="ayClear">Clear</button><button class="btn pri" id="aySave">Save</button></div>', (b) => {
    b.querySelector('#ayClear').onclick = () => { b.querySelector('#ayText').value = ''; };
    b.querySelector('#aySave').onclick = () => { state.profile.about = b.querySelector('#ayText').value.trim(); state.settings.aboutAuto = b.querySelector('#ayAuto').checked; saveNow(); closeSheet(); toast('Saved'); };
  });
}
async function openModelSheet() {
  try { await getWebLLM(); } catch (e) { openSheet('Model', '<p>Could not load the AI library. The first start needs internet.</p>'); return; }
  const ids = new Set(allModels().map((m) => m.model_id));
  const rec = RECOMMENDED.filter((r) => ids.has(r.id));
  const cur = state.settings.modelId;
  const opt = (id, label) => '<option value="' + esc(id) + '"' + (id === cur ? ' selected' : '') + '>' + esc(label) + '</option>';
  const others = allModels().map((m) => m.model_id).filter((id) => !rec.some((r) => r.id === id)).sort();
  let html = '<label>Model</label><select id="mSel"><optgroup label="Recommended for iPhone">' + rec.filter((r) => !r.heavy).map((r) => opt(r.id, r.label + ' - ' + r.note)).join('') + '</optgroup><optgroup label="Too big for iPhone (will likely crash)">' + rec.filter((r) => r.heavy).map((r) => opt(r.id, r.label)).join('') + '</optgroup><optgroup label="All models (advanced)">' + others.map((id) => opt(id, id)).join('') + '</optgroup></select>' +
    '<div class="muted" id="mInfo"></div><div class="btnrow"><button class="btn pri" id="mLoad">' + (loadedModel === cur ? 'Reload' : 'Download / load') + '</button></div>' +
    '<label>Memory size (context)</label><select id="mCtx">' + [2048, 4096].map((n) => '<option value="' + n + '"' + (n === state.settings.ctx ? ' selected' : '') + '>' + n + ' tokens' + (n === 4096 ? ' (recommended for 1-1.5B models)' : ' (lighter)') + '</option>').join('') + '</select>' +
    '<label>Reply length: <span id="mTv">' + state.settings.maxTokens + '</span> tokens</label><input id="mTok" type="range" min="150" max="900" step="50" value="' + state.settings.maxTokens + '">' +
    '<div class="sec">This device</div><div class="muted" id="mDev">Checking...</div><div class="btnrow"><button class="btn danger" id="mDel">Delete downloaded copy of this model</button></div>';
  openSheet('Model', html, async (b) => {
    const q = (s) => b.querySelector(s);
    const info = async () => { const id = q('#mSel').value; const r = RECOMMENDED.find((x) => x.id === id); const m = modelRecord(id); let cached = false; cached = await isCached(id); q('#mInfo').textContent = (r ? r.note + '. ' : '') + (m && m.vram_required_MB ? 'Needs about ' + (m.vram_required_MB / 1024).toFixed(1) + ' GB of memory. ' : '') + (cached ? 'Downloaded on this device.' : 'Not downloaded yet.') + (loadedModel === id ? ' Loaded now.' : ''); };
    q('#mSel').onchange = info; info();
    q('#mLoad').onclick = () => { const id = q('#mSel').value; if (IS_IOS && RECOMMENDED.some((r) => r.heavy && r.id === id)) toast('Warning: this model is probably too big for iPhone.', 4000); closeSheet(); loadModel(id); };
    q('#mCtx').onchange = () => { state.settings.ctx = parseInt(q('#mCtx').value, 10); saveNow(); if (loadedModel) { closeSheet(); loadModel(loadedModel); } };
    q('#mTok').oninput = () => { state.settings.maxTokens = parseInt(q('#mTok').value, 10); q('#mTv').textContent = state.settings.maxTokens; save(); };
    q('#mDel').onclick = async () => { const id = q('#mSel').value; if (id === loadedModel) { toast('Load a different model first'); return; } try { await (await libFor(id)).deleteModelAllInfoInCache(id, appConfig()); toast('Deleted'); info(); } catch (e) { toast('Could not delete: ' + e.message); } };
    let dev = '';
    try { const ad = navigator.gpu ? await navigator.gpu.requestAdapter() : null; dev += ad ? 'WebGPU ready · shader-f16 ' + (ad.features.has('shader-f16') ? 'yes' : 'no') + ' · max buffer ' + (ad.limits.maxBufferSize / 1073741824).toFixed(1) + ' GB' : 'No WebGPU on this browser'; } catch (e) { dev += 'WebGPU check failed'; }
    try { const est = await navigator.storage.estimate(); dev += '<br>Storage used ' + (est.usage / 1073741824).toFixed(2) + ' GB of ' + (est.quota / 1073741824).toFixed(0) + ' GB'; } catch (e) {}
    q('#mDev').innerHTML = dev;
  });
}
function openSoundSheet() {
  const s = state.settings.sound;
  const slots = MUSIC_SLOTS.map((x) => { const m = state.music[x[0]]; return '<div class="castRow"><div class="meta"><b>' + x[1] + '</b><br><small>' + (m ? esc(m.name) : 'no track') + '</small></div>' + (m ? '<button class="btn" data-del="' + x[0] + '">✕</button>' : '') + '</div>'; }).join('');
  openSheet('Sound & music', '<div class="tog"><span>App sounds</span><input type="checkbox" id="sUi" ' + (s.ui ? 'checked' : '') + '><input type="range" id="sUiV" min="0" max="1" step="0.05" value="' + s.uiVol + '"></div>' +
    '<div class="tog"><span>Adventure sound effects</span><input type="checkbox" id="sSfx" ' + (s.sfx ? 'checked' : '') + '><input type="range" id="sSfxV" min="0" max="1" step="0.05" value="' + s.sfxVol + '"></div>' +
    '<div class="tog"><span>Adventure music</span><input type="checkbox" id="sMus" ' + (s.music ? 'checked' : '') + '><input type="range" id="sMusV" min="0" max="1" step="0.05" value="' + s.musicVol + '"></div>' +
    '<div class="sec">Music library</div><p class="muted">Add music files (for example the xDeviruchi MP3s) from your Files app. Tracks are matched to scenes by name and stored on this phone only. Music plays in adventures and changes with the scene.</p><div class="btnrow"><button class="btn pri" id="sImp">＋ Add music files</button></div>' + slots, (b) => {
    const q = (x) => b.querySelector(x);
    const keep = () => { s.ui = q('#sUi').checked; s.sfx = q('#sSfx').checked; s.music = q('#sMus').checked; s.uiVol = parseFloat(q('#sUiV').value); s.sfxVol = parseFloat(q('#sSfxV').value); s.musicVol = parseFloat(q('#sMusV').value); save(); unlockAudio(); };
    ['#sUi', '#sSfx', '#sUiV', '#sSfxV'].forEach((x) => { q(x).onchange = () => { keep(); sfx('tap', 'ui'); sfx('coins'); }; });
    q('#sMus').onchange = () => { keep(); const c = activeChat(); if (s.music && c && c.kind === 'adv') musicScene(c.adv.scene, true); else musicStop(); };
    q('#sMusV').oninput = () => { keep(); if (Music.slot) musicVol(s.musicVol, 100); };
    q('#sImp').onclick = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true; inp.accept = 'audio/*,.mp3,.ogg,.m4a,.wav'; inp.onchange = async () => { unlockAudio(); await importMusic(inp.files); openSoundSheet(); }; inp.click(); };
    b.querySelectorAll('[data-del]').forEach((x) => { x.onclick = async () => { const k = x.dataset.del; if (Music.slot === k) musicStop(); await idbDel('music:' + k).catch(() => {}); delete state.music[k]; saveNow(); openSoundSheet(); }; });
  });
}
function openSettings() {
  const st = state.settings;
  openSheet('Settings & backup', '<div class="tog"><span>Auto-update memory as I chat</span><input type="checkbox" id="stMem" ' + (st.autoMem ? 'checked' : '') + '></div>' +
    '<label>Update memory every</label><select id="stEvery">' + [2, 4, 6, 8].map((n) => '<option value="' + n + '"' + (n === st.memEvery ? ' selected' : '') + '>' + n + ' replies</option>').join('') + '</select>' +
    '<p class="muted">Each update takes a few seconds after a reply. It stops by itself if you send a new message.</p>' +
    '<div class="sec">Backup</div><div class="btnrow"><button class="btn" id="stExp">Export backup</button><button class="btn" id="stImp">Import backup</button></div><p class="muted">The backup holds chats, adventures, personas and memory. Music and your own pictures stay on the phone.</p>', (b) => {
    const q = (x) => b.querySelector(x);
    q('#stMem').onchange = () => { st.autoMem = q('#stMem').checked; saveNow(); };
    q('#stEvery').onchange = () => { st.memEvery = parseInt(q('#stEvery').value, 10); saveNow(); };
    q('#stExp').onclick = () => { const blob = new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'popeye-backup-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); };
    q('#stImp').onclick = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json'; inp.onchange = async () => { try { const data = JSON.parse(await inp.files[0].text()); const music = state.music, faces = state.customFaces; state = migrate(data); state.music = Object.assign({}, data.music || {}, music); state.customFaces = Array.from(new Set((data.customFaces || []).concat(faces))); ensureActive(); saveNow(); closeSheet(); renderAll(); toast('Backup imported'); } catch (e) { toast('That file is not a Popeye backup'); } }; inp.click(); };
  });
}
function openCredits() {
  openSheet('About & credits', '<p><b>Popeye AI ' + APP_VERSION + '</b>. Your private AI that runs on your phone.</p><p class="muted">' + esc(LIMITS) + '</p>' +
    '<div class="sec">Credits</div><p class="muted">AI engine: WebLLM (MLC AI), Apache 2.0.<br>Models: Qwen (Alibaba), Llama (Meta), Gemma (Google), Dolphin 3.0 (Cognitive Computations, conversion by Jay0628), Llama 3.2 1B abliterated (conversion by Sandoche), Qwen 3 0.6B abliterated, Dolphin 0.5B and SmolLM2 heretic (conversions by Jay0628), Dolphin Llama 1B (conversion by RickyRoscoe), DeepSeek R1 Distill abliterated (huihui-ai, conversion by willopcbeta, program file by mitulagr2).<br>Photo text reading: Tesseract.js. PDF: pdf.js (Mozilla). Word: mammoth.js.<br>Sound effects and jingles: Kenney (kenney.nl), CC0.<br>Music, if added by you: Original music by Marllon Silva (xDeviruchi).<br>Character portraits: provided by the owner.</p>');
}

function applyTheme() {
  const t = (state && state.settings.theme) || 'auto'; const root = document.documentElement;
  if (t === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', t);
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', dark ? '#14161c' : '#f6f4ef');
}
function openAppearance() {
  const cur = state.settings.theme || 'auto';
  openSheet('Appearance', '<div class="btnrow">' + [['auto', '📱 Auto'], ['light', '☀️ Light'], ['dark', '🌙 Dark']].map((x) => '<button class="btn' + (x[0] === cur ? ' pri' : '') + '" data-th="' + x[0] + '">' + x[1] + '</button>').join('') + '</div><p class="muted">Auto follows your iPhone setting.</p>', (b) => {
    b.querySelectorAll('[data-th]').forEach((x) => { x.onclick = () => { state.settings.theme = x.dataset.th; saveNow(); applyTheme(); openAppearance(); }; });
  });
}

// ---------- events and start ----------
function bindUI() {
  $('btnMenu').onclick = openDrawer;
  $('scrim').onclick = () => { closeDrawer(); closeSheet(); };
  $('btnModel').onclick = openModelSheet;
  $('btnChatInfo').onclick = openChatInfo;
  $('btnNew').onclick = () => { const c = activeChat(); if (c && c.kind === 'adv') openNewAdventure(); else openNewChatSheet(); };
  $('btnAttach').onclick = () => openSheet('Attach', '<div class="btnrow"><button class="btn" id="atCam">📷 Camera</button><button class="btn" id="atPho">🖼️ Photos</button></div><div class="btnrow"><button class="btn" id="atFile">📄 File (PDF, Word, text)</button></div><p class="muted">Photos: the text in the picture is read and sent (the AI cannot see the image itself). Files: the text is extracted; long files are trimmed to the most relevant parts. The first use of each needs internet to fetch the reader.</p>', (b) => {
    b.querySelector('#atCam').onclick = () => pickFiles('image/*', true);
    b.querySelector('#atPho').onclick = () => pickFiles('image/*', false);
    b.querySelector('#atFile').onclick = () => pickFiles('.pdf,.docx,.txt,.md,.csv,.json,.html,.xml,.log,.js,.py,.css,.ts,.java,.c,.cpp,.rtf,text/*,application/pdf', false);
  });
  $('btnSend').onclick = () => { if (busy) stopGen(); else send(); };
  const inp = $('input');
  inp.addEventListener('input', autoGrow);
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (!busy) send(); } });
  $('messages').addEventListener('click', onMessagesClick);
  document.addEventListener('pointerdown', unlockAudio, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });
}
async function init() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  state = migrate(loadState());
  applyTheme();
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme); } catch (e) {}
  ensureActive(); saveNow();
  bindUI(); renderAll();
  $('boot').hidden = true;
  loadCustomFaces();
  const stuck = localStorage.getItem(LOADING_KEY);
  if (stuck) {
    localStorage.removeItem(LOADING_KEY);
    state.settings.modelId = SAFE_DEFAULT; saveNow();
    openSheet('Loading stopped', '<p>Loading <b>' + esc(modelLabel(stuck)) + '</b> stopped before it finished. The phone probably ran out of memory.</p>' + (stuck === SAFE_DEFAULT ? '<p>You can try again.</p>' : '<p>Switched to <b>' + esc(modelLabel(SAFE_DEFAULT)) + '</b>, which fits iPhone.</p>') + '<div class="btnrow"><button class="btn pri" id="stLoad">Load ' + esc(modelLabel(SAFE_DEFAULT)) + '</button></div>', (b) => { b.querySelector('#stLoad').onclick = () => { closeSheet(); loadModel(SAFE_DEFAULT); }; });
    return;
  }
  try {
    await getWebLLM();
    if (IS_IOS && RECOMMENDED.some((r) => r.heavy && r.id === state.settings.modelId)) { state.settings.modelId = SAFE_DEFAULT; saveNow(); }
    updateModelPill();
    if (navigator.gpu && await isCached(state.settings.modelId)) loadModel(state.settings.modelId);
  } catch (e) { toast('Offline and the AI library is not cached yet. Connect once to set up.', 5000); }
}
init();
