// Popeye AI: private, offline AI chat with personas.
// The model runs on this device through WebLLM (WebGPU). Nothing is sent to any server.
import * as webllm from 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.86/+esm';

const APP_VERSION = '1.0.0';
const STORE_KEY = 'popeye.v1';
const LOADING_KEY = 'popeye.loading';

const RECOMMENDED = [
  { id: 'Hermes-3-Llama-3.2-3B-q4f16_1-MLC', label: 'Hermes 3 (3B): best for stories and role-play' },
  { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 (3B): good all-rounder' },
  { id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC', label: 'Qwen 2.5 (3B): follows instructions well' },
  { id: 'gemma-4-E2B-it-q4f16_1-MLC', label: 'Gemma 4 E2B: newest, heavier (experimental)' },
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 (1B): fast and light' },
  { id: 'gemma3-1b-it-q4f16_1-MLC', label: 'Gemma 3 (1B): fast and light' }
];

const GM_PROMPT = [
  'You are the Game Master of a text-only fantasy role-playing adventure. The player controls one hero. You control the world, every other character and the dice.',
  '',
  'STYLE',
  '- Second person, present tense ("You push open the door...").',
  '- 1 to 3 short paragraphs per turn. Vivid but brief.',
  '- End every turn with an open situation and the question: What do you do?',
  '- Never act, speak or decide for the hero. Never skip ahead.',
  '',
  'START',
  'If the hero is not created yet, use the player\'s description, or invent a hero if they say "surprise me". Give the hero 20 HP, 10 gold and 3 fitting starting items, show the status line, then open with a short, dangerous hook.',
  '',
  'DICE',
  'When an action could fail, roll a d20 and show it like: [Roll d20: 14 + 2 = 16 vs 12 - success]',
  'Easy 8, normal 12, hard 16, heroic 20. Natural 20 = great success with a bonus. Natural 1 = failure with a complication.',
  'If the player writes (rolled dN: X), use that roll instead of rolling yourself.',
  'Combat: the hero hits on 12+ and deals 1d8 damage. Show enemies like [Goblin HP 7/7]. Enemies act after the hero.',
  '',
  'TRACKING',
  'After any change, show one status line:',
  '[HP 18/20 | Gold 12 | Items: torch, short sword, rope]',
  'Keep HP, gold and items consistent. Items cannot appear unless found or bought. At 0 HP the hero falls; offer to continue from the last safe place.',
  '',
  'WORLD',
  'Keep names, places and promises consistent. Make choices matter. Mix combat, puzzles, talking and exploring. Reward clever ideas. Danger is real, but be fair.',
  '',
  'COMMANDS',
  '"sheet": show the full character sheet. "recap": summarise the story so far in 5 lines. "rest": recover HP if safe; time passes. "inventory": list items and gold.'
].join('\n');

function defaultPersonas() {
  return [
    {
      id: 'gm', builtin: true, icon: '\u{1F3B2}', name: 'Game Master', temperature: 0.9, dice: true,
      quick: ['Look around', 'Inventory', 'Sheet', 'Recap', 'Rest'],
      greeting: 'Welcome, adventurer! Tell me your hero\'s name, race, class and one line of backstory, or just say "surprise me".',
      prompt: GM_PROMPT
    },
    {
      id: 'assistant', builtin: true, icon: '\u{1F4AC}', name: 'Assistant', temperature: 0.6, dice: false,
      quick: ['Explain simply', 'Summarise that', 'Give me 3 ideas'],
      greeting: 'Hi! I run entirely on this device, so nothing you type leaves it. What can I help with?',
      prompt: 'You are Popeye, a helpful assistant that runs fully offline on the user\'s phone. Answer clearly and briefly, using short paragraphs or bullet points. If you are not sure about something, say so plainly. You have no internet access and cannot look things up or know recent news.'
    },
    {
      id: 'story', builtin: true, icon: '\u{270D}\u{FE0F}', name: 'Story Partner', temperature: 0.95, dice: false,
      quick: ['Continue', 'Add a twist', 'Describe the scene', 'Make it darker'],
      greeting: 'Give me an opening line, a genre or an idea, and we\'ll write it together.',
      prompt: 'You are a creative co-writer. Continue the user\'s story in vivid prose that matches their tone and genre. Write 2 to 4 paragraphs per turn, then stop at an interesting moment. Keep characters, places and facts consistent. Follow any direction the user gives in square brackets, like [make it darker], without mentioning it.'
    }
  ];
}

// ---------- small helpers ----------
const $ = (sel) => document.querySelector(sel);
function el(tag, attrs, ...kids) {
  const n = document.createElement(tag);
  if (attrs) {
    for (const k in attrs) {
      const v = attrs[k];
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else if (v === true) n.setAttribute(k, '');
      else if (v !== false && v != null) n.setAttribute(k, v);
    }
  }
  for (const c of kids.flat()) {
    if (c == null) continue;
    n.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return n;
}
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const estTokens = (s) => Math.ceil((s || '').length / 3.6);
const errText = (e) => String((e && (e.message || e)) || 'Unknown error').slice(0, 300);
function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function safeRemove(k) { try { localStorage.removeItem(k); } catch (e) {} }
function shortName(id) { return (id || '').replace(/-q\d.*$/, '').replace(/-MLC.*$/, ''); }
function gb(mb) { return mb ? (mb / 1024).toFixed(1) + ' GB' : 'unknown'; }

// ---------- state ----------
function defaultSettings() { return { modelId: RECOMMENDED[0].id, maxTokens: 400, activeChatId: null }; }
function loadState() {
  try {
    const raw = safeGet(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.version === 1 && Array.isArray(s.chats) && Array.isArray(s.personas)) {
        const ids = new Set(s.personas.map((p) => p.id));
        for (const p of defaultPersonas()) if (!ids.has(p.id)) s.personas.push(p);
        s.settings = Object.assign(defaultSettings(), s.settings || {});
        return s;
      }
    }
  } catch (e) { console.warn('Could not read saved data', e); }
  return { version: 1, personas: defaultPersonas(), chats: [], settings: defaultSettings() };
}
let state = loadState();
let saveTimer = null;
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 300); }
function saveNow() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch (e) { toast('Could not save: storage is full. Export a backup and delete old chats.'); }
}
window.addEventListener('pagehide', saveNow);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });

let engine = null;
let loadedModel = null;
let modelStatus = 'none'; // none | loading | ready | error
let loadProgress = 0;
let loadText = '';
let generating = false;
let gpuInfo = { ok: false, reason: 'Checking WebGPU...' };
let sheetKind = null;
let lastStatus = null;

function persona(id) { return state.personas.find((p) => p.id === id) || state.personas[0]; }
function activeChat() { return state.chats.find((c) => c.id === state.settings.activeChatId) || null; }
function modelRec(id) { return webllm.prebuiltAppConfig.model_list.find((m) => m.model_id === id); }
function needsF16(m) { return (m.required_features || []).indexOf('shader-f16') >= 0; }
function variantFor(id) {
  if (gpuInfo.f16) return id;
  const alt = id.replace('q4f16_1', 'q4f32_1');
  return modelRec(alt) ? alt : id;
}
function ctxWindow() {
  const r = modelRec(loadedModel);
  return (r && r.overrides && r.overrides.context_window_size) || 4096;
}

// ---------- WebGPU ----------
async function detectGPU() {
  if (!('gpu' in navigator)) {
    gpuInfo = { ok: false, reason: 'This browser does not support WebGPU, which Popeye AI needs to run a model. On iPhone, update to iOS 26 or later and use Safari.' };
    return;
  }
  try {
    const a = await navigator.gpu.requestAdapter();
    if (!a) { gpuInfo = { ok: false, reason: 'WebGPU is available but no graphics adapter was found.' }; return; }
    gpuInfo = { ok: true, f16: a.features.has('shader-f16'), maxBuf: a.limits.maxBufferSize, maxStorage: a.limits.maxStorageBufferBindingSize };
  } catch (e) {
    gpuInfo = { ok: false, reason: 'WebGPU error: ' + errText(e) };
  }
}
function deviceText() {
  if (!gpuInfo.ok) return gpuInfo.reason;
  return 'WebGPU ready. 16-bit shaders: ' + (gpuInfo.f16 ? 'yes' : 'no') + '. Largest buffer: ' + (gpuInfo.maxBuf / 1073741824).toFixed(1) + ' GB.';
}
async function storageText() {
  try {
    if (!navigator.storage || !navigator.storage.estimate) return '';
    const e = await navigator.storage.estimate();
    let persisted = false;
    try { persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false; } catch (x) {}
    return 'Storage used: ' + (e.usage / 1073741824).toFixed(2) + ' GB of about ' + (e.quota / 1073741824).toFixed(0) + ' GB allowed.' + (persisted ? ' Protected from automatic clean-up.' : '');
  } catch (e) { return ''; }
}

// ---------- model loading ----------
async function loadModel(id) {
  if (!gpuInfo.ok) { openModelSheet(); return; }
  if (modelStatus === 'loading' || generating) return;
  modelStatus = 'loading'; loadProgress = 0; loadText = 'Starting...';
  renderModelStatus();
  safeSet(LOADING_KEY, id);
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}
  const cb = (r) => { loadProgress = r.progress || 0; loadText = r.text || ''; renderModelStatus(); };
  try {
    if (!engine) {
      engine = await webllm.CreateMLCEngine(id, { initProgressCallback: cb });
    } else {
      engine.setInitProgressCallback(cb);
      await engine.reload(id);
    }
    loadedModel = id;
    modelStatus = 'ready';
    state.settings.modelId = id;
    save();
    toast('Model ready. Popeye AI now works offline.');
  } catch (e) {
    console.error(e);
    modelStatus = 'error';
    loadedModel = null;
    loadText = 'Could not load the model: ' + errText(e) + ' Try a smaller model.';
    try { if (engine) await engine.unload(); } catch (x) {}
    engine = null;
  } finally {
    safeRemove(LOADING_KEY);
    renderModelStatus();
    renderMessages();
  }
}

async function deleteModel(id) {
  if (!confirm('Delete the downloaded copy of ' + shortName(id) + '? You would need to download it again to use it.')) return;
  try {
    if (loadedModel === id && engine) {
      await engine.unload();
      loadedModel = null;
      modelStatus = 'none';
    }
    await webllm.deleteModelAllInfoInCache(id);
    toast('Deleted.');
  } catch (e) {
    toast('Could not delete: ' + errText(e));
  }
  renderModelStatus();
  refreshModelSheet();
  storageText().then((t) => { const n = $('#mStore'); if (n) n.textContent = t; });
}

function ensureReady() {
  if (modelStatus === 'ready' && engine) return true;
  if (modelStatus === 'loading') { toast('The model is still loading.'); return false; }
  openModelSheet('Load a model first.');
  return false;
}

// ---------- chats ----------
function newChat(personaId) {
  const p = persona(personaId);
  const c = { id: uid(), personaId: p.id, title: p.name, titled: false, created: Date.now(), updated: Date.now(), memory: '', messages: [] };
  if (p.greeting) c.messages.push({ role: 'assistant', content: p.greeting, greeting: true });
  state.chats.unshift(c);
  state.settings.activeChatId = c.id;
  save();
  renderAll();
  return c;
}

function systemPrompt(c, p) {
  let s = (p.prompt || '').trim();
  if (c.memory && c.memory.trim()) s += '\n\nMEMORY (summary of the earlier conversation; treat it as true):\n' + c.memory.trim();
  return s;
}
function historyFor(c) {
  const out = [];
  for (const m of c.messages) {
    if (m.greeting || m.summarized || !m.content) continue;
    const role = m.role === 'user' ? 'user' : 'assistant';
    if (out.length && out[out.length - 1].role === role) out[out.length - 1].content += '\n\n' + m.content;
    else out.push({ role: role, content: m.content });
  }
  while (out.length && out[0].role !== 'user') out.shift();
  return out;
}
function buildMessages(c, p) { return [{ role: 'system', content: systemPrompt(c, p) }].concat(historyFor(c)); }
function cleanOutput(s) { return (s || '').replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<think>[\s\S]*$/, '').replace(/^\s+/, ''); }
function extraFor(req) { if (/^Qwen3/i.test(loadedModel || '')) req.extra_body = { enable_thinking: false }; return req; }

async function summarize(c, chunk) {
  const transcript = chunk.map((m) => (m.role === 'user' ? 'User: ' : 'AI: ') + m.content).join('\n\n');
  const prompt = 'Update the memory notes for an ongoing conversation.\n\nCURRENT MEMORY:\n' + (c.memory || '(empty)') +
    '\n\nNEW EVENTS:\n' + transcript.slice(-8000) +
    '\n\nWrite the updated memory as short bullet points, at most 180 words. Keep names, places, goals, promises, items, HP, gold and unresolved threads. No commentary.';
  const r = await engine.chat.completions.create(extraFor({
    messages: [{ role: 'system', content: 'You write compact, factual memory notes.' }, { role: 'user', content: prompt }],
    temperature: 0.2, max_tokens: 300, stream: false
  }));
  const text = cleanOutput((r.choices[0] && r.choices[0].message && r.choices[0].message.content) || '').trim();
  if (text) c.memory = text;
  for (const m of chunk) m.summarized = true;
  save();
}

async function fitContext(c, p, bubble) {
  const limit = ctxWindow() - state.settings.maxTokens - 150;
  for (let pass = 0; pass < 6; pass++) {
    const total = buildMessages(c, p).reduce((a, m) => a + estTokens(m.content) + 6, 0);
    if (total <= limit) return;
    const live = c.messages.filter((m) => !m.summarized && !m.greeting && m.content);
    if (live.length <= 1) return;
    if (live.length <= 4) { live[0].summarized = true; continue; }
    const chunk = live.slice(0, live.length - 4);
    bubble.innerHTML = '<div class="note">Updating memory so the conversation fits...</div>';
    await summarize(c, chunk);
  }
}

async function generate(c) {
  const p = persona(c.personaId);
  generating = true;
  updateSendButton();
  const msg = { role: 'assistant', content: '' };
  c.messages.push(msg);
  renderMessages();
  const bubble = $('#messages').lastElementChild.querySelector('.bubble');
  bubble.classList.add('typing');
  let failed = null;
  try {
    await fitContext(c, p, bubble);
    bubble.innerHTML = '';
    const stream = await engine.chat.completions.create(extraFor({
      messages: buildMessages(c, p),
      stream: true,
      temperature: typeof p.temperature === 'number' ? p.temperature : 0.8,
      max_tokens: state.settings.maxTokens,
      frequency_penalty: 0.2
    }));
    let raw = '';
    let queued = false;
    for await (const chunk of stream) {
      const d = chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content;
      if (!d) continue;
      raw += d;
      msg.content = cleanOutput(raw);
      if (!queued) {
        queued = true;
        requestAnimationFrame(() => { queued = false; bubble.innerHTML = formatText(msg.content); scrollToBottom(true); });
      }
    }
    msg.content = cleanOutput(raw).trim();
  } catch (e) {
    console.error(e);
    failed = e;
  }
  generating = false;
  if (failed) {
    const t = errText(failed);
    if (/lost|destroyed|disposed/i.test(t)) {
      engine = null; loadedModel = null; modelStatus = 'none';
      toast('iOS unloaded the model. Tap the model button to load it again (no new download needed).');
    } else {
      toast('Something went wrong: ' + t);
    }
    renderModelStatus();
  }
  if (!msg.content) c.messages.splice(c.messages.indexOf(msg), 1);
  c.updated = Date.now();
  save();
  renderMessages();
  updateSendButton();
}

function sendText(text) {
  text = (text || '').trim();
  if (!text || generating) return;
  if (!ensureReady()) return;
  let c = activeChat();
  if (!c) c = newChat(state.personas[0].id);
  c.messages.push({ role: 'user', content: text });
  if (!c.titled) { c.title = text.length > 42 ? text.slice(0, 40) + '...' : text; c.titled = true; renderHeader(); }
  generate(c);
}
function onSend() {
  if (generating) { stopGen(); return; }
  const inp = $('#input');
  const t = inp.value.trim();
  if (!t) return;
  if (!ensureReady()) return;
  inp.value = '';
  autoGrow();
  sendText(t);
}
function stopGen() { try { if (engine) engine.interruptGenerate(); } catch (e) {} }

function retry() {
  const c = activeChat();
  if (!c || generating || !ensureReady()) return;
  const last = c.messages[c.messages.length - 1];
  if (last && last.role === 'assistant' && !last.greeting) c.messages.pop();
  generate(c);
}
function cont() {
  const c = activeChat();
  if (!c || generating || !ensureReady()) return;
  c.messages.push({ role: 'user', content: 'Continue from exactly where you stopped. Do not repeat anything.', hidden: true });
  generate(c);
}
function undo() {
  const c = activeChat();
  if (!c || generating) return;
  const top = () => c.messages[c.messages.length - 1];
  while (c.messages.length && !top().greeting && (top().role === 'assistant' || top().hidden)) c.messages.pop();
  if (c.messages.length && top().role === 'user') {
    const m = c.messages.pop();
    $('#input').value = m.content;
    autoGrow();
  }
  save();
  renderMessages();
}
function replyNow() { const c = activeChat(); if (c && !generating && ensureReady()) generate(c); }
function editLast() {
  const c = activeChat();
  if (!c || generating) return;
  const last = c.messages[c.messages.length - 1];
  if (last && last.role === 'user') { c.messages.pop(); $('#input').value = last.content; autoGrow(); save(); renderMessages(); }
}

function rollDie(n) {
  const r = 1 + Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 * n);
  const inp = $('#input');
  inp.value = (inp.value.trim() ? inp.value.replace(/\s+$/, '') + ' ' : '') + '(rolled d' + n + ': ' + r + ')';
  autoGrow();
  let extra = '';
  if (n === 20 && r === 20) extra = '  Natural 20!';
  if (n === 20 && r === 1) extra = '  Natural 1...';
  toast('d' + n + ': ' + r + extra);
}

// ---------- rendering ----------
function esc(s) { return s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
function inline(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<i>$2</i>')
    .replace(/\[(Roll[^\]]*)\]/g, '<span class="roll">$1</span>');
}
function formatText(s) {
  const out = [];
  for (const line of esc(s || '').split('\n')) {
    const t = line.trim();
    if (/^\[.*\]$/.test(t)) out.push('<div class="stat">' + inline(t.slice(1, -1)) + '</div>');
    else if (/^#{1,4}\s/.test(t)) out.push('<div class="h">' + inline(t.replace(/^#{1,4}\s/, '')) + '</div>');
    else if (/^[-*•]\s/.test(t)) out.push('<div>• ' + inline(t.slice(2)) + '</div>');
    else if (t === '') out.push('<div class="gap"></div>');
    else out.push('<div>' + inline(line) + '</div>');
  }
  return out.join('');
}
function scrollToBottom(onlyIfNear) {
  const box = $('#messages');
  if (onlyIfNear && box.scrollHeight - box.scrollTop - box.clientHeight > 200) return;
  box.scrollTop = box.scrollHeight;
}
function autoGrow() {
  const t = $('#input');
  t.style.height = 'auto';
  t.style.height = Math.min(t.scrollHeight, 140) + 'px';
}
let toastTimer = null;
function toast(text) {
  let n = $('#toast');
  if (!n) { n = el('div', { id: 'toast', class: 'toast', role: 'status' }); document.body.append(n); }
  n.textContent = text;
  n.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { n.hidden = true; }, 2800);
}

function renderHeader() {
  const c = activeChat();
  const p = c ? persona(c.personaId) : null;
  $('#chatIcon').textContent = p ? p.icon : '⚓';
  $('#chatTitle').textContent = c ? c.title : 'Popeye AI';
}
function actionsRow(kind) {
  const r = el('div', { class: 'actions' });
  if (kind === 'ai') {
    r.append(
      el('button', { text: '↻ Retry', onclick: retry }),
      el('button', { text: '→ Continue', onclick: cont }),
      el('button', { text: '↶ Undo', onclick: undo })
    );
  } else {
    r.append(
      el('button', { text: '↳ Get reply', onclick: replyNow }),
      el('button', { text: '✎ Edit', onclick: editLast })
    );
  }
  return r;
}
function renderMsg(m, isLast) {
  const mine = m.role === 'user';
  const wrap = el('div', { class: 'msg ' + (mine ? 'me' : 'ai') + (m.summarized ? ' faded' : '') });
  wrap.append(el('div', { class: 'bubble', html: formatText(m.content) }));
  if (isLast && !generating) {
    if (!mine && !m.greeting) wrap.append(actionsRow('ai'));
    if (mine) wrap.append(actionsRow('user'));
  }
  return wrap;
}
function renderWelcome() {
  const w = el('div', { class: 'welcome' });
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  w.append(el('div', { class: 'card' },
    el('h2', { text: '⚓ Popeye AI' }),
    el('p', { class: 'muted', text: 'Private AI that runs on this device. No account and no cloud. After one download it works in Airplane Mode.' })));
  if (!gpuInfo.ok) w.append(el('div', { class: 'card warn', text: gpuInfo.reason }));
  let step = 1;
  if (ios && !standalone) {
    w.append(el('div', { class: 'card' },
      el('b', { text: 'Step ' + (step++) + ': Add to Home Screen' }),
      el('p', { class: 'muted', text: 'Tap the Share button, then "Add to Home Screen". Open Popeye AI from its new icon and download the model there. Safari and the Home Screen app keep separate storage.' })));
  }
  w.append(el('div', { class: 'card' },
    el('b', { text: 'Step ' + (step++) + ': Download a model' }),
    el('p', { class: 'muted', text: 'Use Wi-Fi. About 1 to 2 GB, once.' }),
    el('button', { class: 'btn primary', text: modelStatus === 'ready' ? 'Model ready ✓' : 'Choose model', onclick: () => openModelSheet() })));
  const row = el('div', { class: 'row' });
  for (const p of state.personas) row.append(el('button', { class: 'btn', onclick: () => newChat(p.id) }, p.icon + ' ' + p.name));
  w.append(el('div', { class: 'card' }, el('b', { text: 'Step ' + step + ': Start a chat' }), row));
  return w;
}
function renderMessages() {
  const box = $('#messages');
  box.innerHTML = '';
  const c = activeChat();
  if (!c) { box.append(renderWelcome()); return; }
  const visible = c.messages.filter((m) => !m.hidden);
  visible.forEach((m, i) => box.append(renderMsg(m, i === visible.length - 1)));
  scrollToBottom(false);
}
function renderComposer() {
  const c = activeChat();
  const p = c ? persona(c.personaId) : null;
  const q = $('#quick');
  q.innerHTML = '';
  const quick = (p && p.quick) || [];
  for (const label of quick) q.append(el('button', { class: 'chip', text: label, onclick: () => sendText(label) }));
  q.hidden = quick.length === 0;
  const d = $('#dice');
  d.innerHTML = '';
  if (p && p.dice) for (const n of [4, 6, 8, 10, 12, 20]) d.append(el('button', { class: 'chip die', text: 'd' + n, 'aria-label': 'Roll d' + n, onclick: () => rollDie(n) }));
  d.hidden = !(p && p.dice);
  updateSendButton();
}
function updateSendButton() {
  const b = $('#btnSend');
  b.textContent = generating ? '■' : '➤';
  b.classList.toggle('stop', generating);
  b.setAttribute('aria-label', generating ? 'Stop' : 'Send');
}
function renderModelStatus() {
  const pill = $('#btnModel');
  pill.className = 'pill ' + modelStatus;
  let t = 'No model';
  if (modelStatus === 'ready') t = shortName(loadedModel);
  else if (modelStatus === 'loading') t = 'Loading ' + Math.round(loadProgress * 100) + '%';
  else if (modelStatus === 'error') t = 'Model problem';
  $('#modelPill').textContent = t;
  updateProgressUI();
  if (lastStatus !== modelStatus) {
    lastStatus = modelStatus;
    if (sheetKind === 'model') refreshModelSheet();
    if (!activeChat()) renderMessages();
  }
}
function renderAll() { renderHeader(); renderMessages(); renderComposer(); renderModelStatus(); }

// ---------- sheets and drawer ----------
function openSheet(build) {
  const b = $('#sheetBody');
  b.innerHTML = '';
  $('#drawer').hidden = true;
  build(b);
  $('#sheet').hidden = false;
  $('#scrim').hidden = false;
  $('#sheet').scrollTop = 0;
}
function closeOverlays() {
  $('#sheet').hidden = true;
  $('#drawer').hidden = true;
  $('#scrim').hidden = true;
  sheetKind = null;
}
function closeRow() { return el('div', { class: 'row' }, el('button', { class: 'btn', text: 'Close', onclick: closeOverlays })); }

function openModelSheet(note) {
  openSheet((b) => {
    sheetKind = 'model';
    b.append(el('h2', { text: 'AI model' }));
    if (note) b.append(el('p', { class: 'warn', text: note }));
    if (!gpuInfo.ok) { b.append(el('p', { class: 'warn', text: gpuInfo.reason }), closeRow()); return; }
    const sel = el('select', { id: 'mSel' });
    const g1 = el('optgroup', { label: 'Recommended' });
    for (const r of RECOMMENDED) {
      const id = variantFor(r.id);
      const rec = modelRec(id);
      if (!rec || (needsF16(rec) && !gpuInfo.f16)) continue;
      g1.append(el('option', { value: id, text: r.label }));
    }
    const g2 = el('optgroup', { label: 'All models (advanced)' });
    for (const m of webllm.prebuiltAppConfig.model_list) {
      if (/embed|snowflake/i.test(m.model_id)) continue;
      if (needsF16(m) && !gpuInfo.f16) continue;
      g2.append(el('option', { value: m.model_id, text: m.model_id + ' (' + gb(m.vram_required_MB) + ')' }));
    }
    sel.append(g1, g2);
    sel.value = loadedModel || variantFor(state.settings.modelId);
    if (!sel.value) sel.selectedIndex = 0;
    sel.addEventListener('change', refreshModelSheet);
    const btn = el('button', { id: 'mBtn', class: 'btn primary block', text: 'Download and load', onclick: () => loadModel(sel.value) });
    const len = el('input', { type: 'range', id: 'mLen', min: '120', max: '800', step: '20', value: String(state.settings.maxTokens) });
    const lenVal = el('span', { text: ' (' + state.settings.maxTokens + ' tokens)' });
    len.addEventListener('input', () => { state.settings.maxTokens = +len.value; lenVal.textContent = ' (' + len.value + ' tokens)'; save(); });
    b.append(
      el('label', { for: 'mSel', text: 'Model' }), sel,
      el('p', { id: 'mInfo', class: 'muted' }),
      el('div', { class: 'progress', id: 'mProgWrap' }, el('div', { id: 'mProg' })),
      el('p', { id: 'mText', class: 'muted' }),
      btn,
      el('div', { class: 'row' }, el('button', { class: 'btn danger', text: 'Delete downloaded copy', onclick: () => deleteModel(sel.value) })),
      el('label', { for: 'mLen' }, 'Reply length', lenVal), len,
      el('h3', { text: 'This device' }),
      el('p', { class: 'muted', text: deviceText() }),
      el('p', { class: 'muted', id: 'mStore' }),
      closeRow()
    );
    refreshModelSheet();
    storageText().then((t) => { const n = $('#mStore'); if (n) n.textContent = t; });
  });
}
async function refreshModelSheet() {
  const sel = $('#mSel');
  if (!sel || sheetKind !== 'model') return;
  const id = sel.value;
  const rec = modelRec(id);
  let cached = false;
  try { cached = await webllm.hasModelInCache(id); } catch (e) {}
  const info = $('#mInfo');
  if (info) info.textContent = 'Needs about ' + gb(rec && rec.vram_required_MB) + ' of memory. ' + (cached ? 'Downloaded: works offline.' : 'Downloads once over Wi-Fi, then works offline.');
  const btn = $('#mBtn');
  if (btn) {
    if (modelStatus === 'loading') { btn.textContent = 'Loading...'; btn.disabled = true; }
    else if (modelStatus === 'ready' && loadedModel === id) { btn.textContent = 'Ready ✓'; btn.disabled = true; }
    else { btn.textContent = cached ? 'Load model' : 'Download and load'; btn.disabled = false; }
  }
  updateProgressUI();
}
function updateProgressUI() {
  const p = $('#mProg'), t = $('#mText'), w = $('#mProgWrap');
  if (!p || !t || !w) return;
  w.hidden = modelStatus !== 'loading';
  p.style.width = Math.round(loadProgress * 100) + '%';
  if (modelStatus === 'loading' || modelStatus === 'error') t.textContent = loadText;
  else if (modelStatus === 'ready') t.textContent = 'Loaded: ' + shortName(loadedModel);
  else t.textContent = 'No model loaded.';
  t.className = modelStatus === 'error' ? 'warn' : 'muted';
}

function openDrawer() {
  closeOverlays();
  const d = $('#drawer');
  d.innerHTML = '';
  d.append(el('h2', { text: '⚓ Popeye AI' }));
  d.append(el('button', { class: 'btn primary block', text: '+ New chat', onclick: openNewChatSheet }));
  d.append(el('h3', { text: 'Chats' }));
  const list = el('div', { class: 'list' });
  if (!state.chats.length) list.append(el('p', { class: 'muted', text: 'No chats yet.' }));
  for (const c of state.chats) {
    const p = persona(c.personaId);
    list.append(el('button', {
      class: 'item' + (c.id === state.settings.activeChatId ? ' active' : ''),
      onclick: () => { state.settings.activeChatId = c.id; save(); closeOverlays(); renderAll(); }
    }, el('span', { class: 'ic', text: p.icon }), el('span', { class: 'grow' }, c.title, el('small', { text: p.name + ', ' + new Date(c.updated).toLocaleDateString() }))));
  }
  d.append(list);
  d.append(el('h3', { text: 'Personas' }));
  const pl = el('div', { class: 'list' });
  for (const p of state.personas) {
    pl.append(el('button', { class: 'item', onclick: () => openPersonaSheet(p.id) },
      el('span', { class: 'ic', text: p.icon }), el('span', { class: 'grow' }, p.name, el('small', { text: (p.builtin ? 'Built-in' : 'Custom') + ', tap to edit' }))));
  }
  pl.append(el('button', { class: 'item', onclick: () => openPersonaSheet(null) }, el('span', { class: 'ic', text: '+' }), el('span', { class: 'grow' }, 'New persona')));
  d.append(pl);
  d.append(el('h3', { text: 'More' }));
  d.append(el('div', { class: 'row' },
    el('button', { class: 'btn', text: 'AI model', onclick: () => openModelSheet() }),
    el('button', { class: 'btn', text: 'Export backup', onclick: exportBackup }),
    el('button', { class: 'btn', text: 'Import backup', onclick: importBackup })));
  d.append(el('p', { class: 'muted', text: 'Version ' + APP_VERSION + '. ' + (navigator.onLine ? 'Online' : 'Offline') + '. Everything stays on this device.' }));
  d.hidden = false;
  $('#scrim').hidden = false;
}

function openNewChatSheet() {
  openSheet((b) => {
    sheetKind = 'new';
    b.append(el('h2', { text: 'New chat' }));
    const list = el('div', { class: 'list' });
    for (const p of state.personas) {
      list.append(el('button', { class: 'item', onclick: () => { closeOverlays(); newChat(p.id); } },
        el('span', { class: 'ic', text: p.icon }), el('span', { class: 'grow' }, p.name, el('small', { text: (p.greeting || p.prompt || '').slice(0, 90) }))));
    }
    b.append(list, closeRow());
  });
}

function openChatSheet() {
  const c = activeChat();
  if (!c) { openDrawer(); return; }
  openSheet((b) => {
    sheetKind = 'chat';
    const p = persona(c.personaId);
    b.append(el('h2', { text: p.icon + ' ' + p.name }));
    const fTitle = el('input', { type: 'text', id: 'cTitle', value: c.title });
    const fMem = el('textarea', { id: 'cMem', rows: '8', placeholder: 'Facts the AI should always remember. Filled in automatically as the chat grows.' });
    fMem.value = c.memory || '';
    b.append(
      el('label', { for: 'cTitle', text: 'Title' }), fTitle,
      el('label', { for: 'cMem', text: 'Memory' }), fMem,
      el('p', { class: 'muted', text: 'Memory is sent with every message. When a chat gets long, older messages are summarised into it automatically and appear faded.' }),
      el('div', { class: 'row' },
        el('button', { class: 'btn primary', text: 'Save', onclick: () => { c.title = fTitle.value.trim() || c.title; c.titled = true; c.memory = fMem.value.trim(); save(); closeOverlays(); renderAll(); } }),
        el('button', { class: 'btn danger', text: 'Delete chat', onclick: () => {
          if (!confirm('Delete this chat?')) return;
          state.chats = state.chats.filter((x) => x.id !== c.id);
          state.settings.activeChatId = state.chats[0] ? state.chats[0].id : null;
          save(); closeOverlays(); renderAll();
        } }),
        el('button', { class: 'btn', text: 'Close', onclick: closeOverlays }))
    );
  });
}

function openPersonaSheet(id) {
  const existing = id ? state.personas.find((x) => x.id === id) : null;
  const p = existing ? JSON.parse(JSON.stringify(existing)) : { id: uid(), icon: '✨', name: '', temperature: 0.7, dice: false, quick: [], greeting: '', prompt: '' };
  openSheet((b) => {
    sheetKind = 'persona';
    b.append(el('h2', { text: existing ? 'Edit persona' : 'New persona' }));
    const fIcon = el('input', { type: 'text', id: 'pIcon', value: p.icon });
    const fName = el('input', { type: 'text', id: 'pName', value: p.name, placeholder: 'For example: Spanish Tutor' });
    const fPrompt = el('textarea', { id: 'pPrompt', rows: '10', placeholder: 'Describe who the AI is and how it should behave.' });
    fPrompt.value = p.prompt || '';
    const fGreet = el('textarea', { id: 'pGreet', rows: '2', placeholder: 'First message in a new chat (optional)' });
    fGreet.value = p.greeting || '';
    const fQuick = el('input', { type: 'text', id: 'pQuick', value: (p.quick || []).join(', '), placeholder: 'Comma-separated, for example: Explain, Quiz me' });
    const tempVal = el('span', { text: ' (' + p.temperature + ')' });
    const fTemp = el('input', { type: 'range', id: 'pTemp', min: '0', max: '1.5', step: '0.05', value: String(p.temperature) });
    fTemp.addEventListener('input', () => { tempVal.textContent = ' (' + fTemp.value + ')'; });
    const fDice = el('input', { type: 'checkbox', id: 'pDice' });
    fDice.checked = !!p.dice;
    b.append(
      el('label', { for: 'pIcon', text: 'Icon (emoji)' }), fIcon,
      el('label', { for: 'pName', text: 'Name' }), fName,
      el('label', { for: 'pPrompt', text: 'Instructions' }), fPrompt,
      el('label', { for: 'pGreet', text: 'Greeting' }), fGreet,
      el('label', { for: 'pQuick', text: 'Quick buttons' }), fQuick,
      el('label', { for: 'pTemp' }, 'Creativity', tempVal), fTemp,
      el('label', { class: 'check' }, fDice, 'Show dice tray')
    );
    const doSave = () => {
      const name = fName.value.trim();
      const prompt = fPrompt.value.trim();
      if (!name || !prompt) { toast('Name and instructions are required.'); return null; }
      Object.assign(p, {
        icon: fIcon.value.trim() || '✨', name: name, prompt: prompt, greeting: fGreet.value.trim(),
        quick: fQuick.value.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 8),
        temperature: +fTemp.value, dice: fDice.checked
      });
      const i = state.personas.findIndex((x) => x.id === p.id);
      if (i >= 0) state.personas[i] = p; else state.personas.push(p);
      save();
      return p;
    };
    const row = el('div', { class: 'row' });
    row.append(el('button', { class: 'btn primary', text: 'Save', onclick: () => { if (doSave()) { closeOverlays(); renderAll(); toast('Saved.'); } } }));
    row.append(el('button', { class: 'btn', text: 'Save and start chat', onclick: () => { const s = doSave(); if (s) { closeOverlays(); newChat(s.id); } } }));
    if (existing && existing.builtin) {
      row.append(el('button', { class: 'btn', text: 'Reset to default', onclick: () => {
        const d = defaultPersonas().find((x) => x.id === existing.id);
        if (!d || !confirm('Reset this persona to its original settings?')) return;
        state.personas[state.personas.indexOf(existing)] = d;
        save(); closeOverlays(); renderAll(); toast('Reset.');
      } }));
    }
    if (existing && !existing.builtin) {
      row.append(el('button', { class: 'btn danger', text: 'Delete', onclick: () => {
        if (!confirm('Delete this persona? Its chats are kept.')) return;
        state.personas = state.personas.filter((x) => x.id !== existing.id);
        save(); closeOverlays(); renderAll();
      } }));
    }
    row.append(el('button', { class: 'btn', text: 'Cancel', onclick: closeOverlays }));
    b.append(row);
  });
}

function exportBackup() {
  saveNow();
  const blob = new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' });
  const a = el('a', { href: URL.createObjectURL(blob), download: 'popeye-backup-' + new Date().toISOString().slice(0, 10) + '.json' });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}
function importBackup() {
  const inp = el('input', { type: 'file', accept: 'application/json,.json' });
  inp.addEventListener('change', async () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    try {
      const s = JSON.parse(await f.text());
      if (!s || s.version !== 1 || !Array.isArray(s.chats) || !Array.isArray(s.personas)) throw new Error('This is not a Popeye AI backup.');
      if (!confirm('Replace all chats and personas on this device with the backup?')) return;
      s.settings = Object.assign(defaultSettings(), s.settings || {});
      state = s;
      saveNow(); closeOverlays(); renderAll(); toast('Backup restored.');
    } catch (e) { toast('Import failed: ' + errText(e)); }
  });
  inp.click();
}

// ---------- start-up ----------
function wireEvents() {
  $('#btnMenu').addEventListener('click', openDrawer);
  $('#btnChatInfo').addEventListener('click', openChatSheet);
  $('#btnModel').addEventListener('click', () => openModelSheet());
  $('#scrim').addEventListener('click', closeOverlays);
  $('#btnSend').addEventListener('click', onSend);
  const inp = $('#input');
  inp.addEventListener('input', autoGrow);
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); onSend(); }
  });
}
function registerSW() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service worker not registered', e));
}

async function init() {
  wireEvents();
  registerSW();
  await detectGPU();
  if (!activeChat() && state.chats.length) state.settings.activeChatId = state.chats[0].id;
  renderAll();
  const boot = $('#boot');
  if (boot) boot.remove();
  window.__popeyeReady = true;
  const unfinished = safeGet(LOADING_KEY);
  if (unfinished) {
    safeRemove(LOADING_KEY);
    modelStatus = 'error';
    loadText = 'Last time, loading ' + shortName(unfinished) + ' did not finish. The app may have been closed, or the device ran out of memory. Tap the button to try again (finished parts are kept), or pick a smaller model.';
    renderModelStatus();
    return;
  }
  if (gpuInfo.ok) {
    let cached = false;
    try { cached = await webllm.hasModelInCache(state.settings.modelId); } catch (e) {}
    if (cached) loadModel(state.settings.modelId);
  }
}
init().catch((e) => {
  console.error(e);
  const b = $('#boot');
  if (b) b.textContent = 'Popeye AI failed to start: ' + errText(e);
});
