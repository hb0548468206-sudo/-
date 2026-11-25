/* =========================================================
   Dreamy – אזור ניהול
   ---------------------------------------------------------
   • כניסה עם שם משתמש וסיסמה (הסיסמה שמורה כ-hash מוצפן ב-data.js).
   • כל שינוי נשמר כטיוטה בדפדפן הזה, וניתן לצפות בו ב"תצוגה מקדימה".
   • "הורדת קובץ לאתר" יוצר data.js חדש, ומעלים אותו לאחסון במקום הקיים.
   ========================================================= */

const DRAFT_KEY = "dreamy-admin-draft";
const SESSION_KEY = "dreamy-admin-session";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const clone = (o) => JSON.parse(JSON.stringify(o));
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const safe = {
  get(store, key) { try { return store.getItem(key); } catch { return null; } },
  set(store, key, v) { try { store.setItem(key, v); return true; } catch { return false; } },
  del(store, key) { try { store.removeItem(key); } catch { /* */ } }
};

let PUBLISHED = clone(window.DREAMY_DATA);

/* ---------- פרסום ישיר לאתר דרך גיטהאב ---------- */
const GH = { owner: "hb0548468206-sudo", repo: "-", branch: "main", path: "data.js" };
const TOKEN_KEY = "dreamy-admin-gh-token";
const getToken = () => safe.get(localStorage, TOKEN_KEY) || "";
let data = loadDraft() || clone(PUBLISHED);
let tab = "products";

const WEIGHTS = { personal: "250 גרם", family: "1 ליטר", stick: "90 מ\"ל", party: "" };
const FLAGS = [
  ["isNew", "חדש!"],
  ["limited", "מהדורה מוגבלת"],
  ["sugarFree", "ללא סוכר"],
  ["allergenFree", "ללא אלרגנים"],
  ["hidden", "מוסתר מהאתר"]
];
const COLOR_FIELDS = [["body", "גוף"], ["lid", "מכסה"], ["tx", "טקסט"], ["scoop", "כדור"], ["bits", "קטעים"]];

function loadDraft() {
  try {
    const d = JSON.parse(safe.get(localStorage, DRAFT_KEY) || "null");
    return d && d.PRODUCTS ? d : null;
  } catch { return null; }
}

/* =========================================================
   אבטחה – PBKDF2 בדפדפן
   ========================================================= */
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const unhex = (h) => new Uint8Array(h.match(/../g).map((x) => parseInt(x, 16)));

async function hashPassword(pass, saltHex, iterations) {
  if (!window.crypto?.subtle) throw new Error("no-crypto");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: unhex(saltHex), iterations }, key, 256);
  return hex(bits);
}

async function checkLogin(user, pass) {
  // בודקים מול הגרסה שבאתר, ומול טיוטה (אם הסיסמה שונתה ועוד לא הועלתה)
  const candidates = [PUBLISHED.ADMIN, data.ADMIN].filter(Boolean);
  for (const a of candidates) {
    if (a.user !== user.trim()) continue;
    if ((await hashPassword(pass, a.salt, a.iterations)) === a.hash) return a.hash;
  }
  return null;
}

function isLoggedIn() {
  const tok = safe.get(sessionStorage, SESSION_KEY);
  return !!tok && [PUBLISHED.ADMIN?.hash, data.ADMIN?.hash].includes(tok);
}

/* =========================================================
   שמירה וייצוא
   ========================================================= */
function isDirty() { return JSON.stringify(data) !== JSON.stringify(PUBLISHED); }

function save() {
  if (isDirty()) safe.set(localStorage, DRAFT_KEY, JSON.stringify(data));
  else safe.del(localStorage, DRAFT_KEY);
  updateState();
}

function updateState() {
  const el = $("#draft-state");
  const dirty = isDirty();
  el.textContent = dirty ? "יש שינויים שעוד לא פורסמו" : "הכול מפורסם באתר";
  el.classList.toggle("dirty", dirty);
}

function fileText() {
  const header = `/* =========================================================
   Dreamy – נתוני האתר
   ---------------------------------------------------------
   הקובץ הזה נוצר ומתעדכן מתוך אזור הניהול (admin/).
   עודכן: ${new Date().toLocaleString("he-IL")}
   ========================================================= */
window.DREAMY_DATA = `;
  return header + JSON.stringify(data, null, 2) + ";\n";
}

function exportFile() {
  const problems = validate();
  if (problems.length) { toast(problems[0]); return; }
  const blob = new Blob([fileText()], { type: "text/javascript;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "data.js";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast("גיבוי הנתונים ירד למחשב");
}

/* UTF-8 ↔ base64 (גיטהאב שומר תוכן קבצים ב-base64) */
function toB64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
const fromB64 = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, "")), (c) => c.charCodeAt(0)));

async function gh(method, body) {
  const url = `https://api.github.com/repos/${GH.owner}/${encodeURIComponent(GH.repo)}/contents/${GH.path}` + (method === "GET" ? `?ref=${GH.branch}&t=${Date.now()}` : "");
  const res = await fetch(url, {
    method,
    cache: "no-store",
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${getToken()}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const err = new Error(`gh-${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

const parseDataFile = (text) => JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));

/* טוען את הגרסה העדכנית ביותר מגיטהאב (האתר עצמו מתעדכן באיחור של כדקה) */
async function syncFromGitHub() {
  if (!getToken()) return;
  try {
    const file = await gh("GET");
    const latest = parseDataFile(fromB64(file.content));
    const hadDraft = isDirty();
    PUBLISHED = latest;
    if (!hadDraft) data = clone(latest);
    render();
  } catch { /* נשארים עם מה שנטען מהאתר */ }
}

async function publish() {
  const problems = validate();
  if (problems.length) { toast(problems[0]); return; }
  if (!getToken()) {
    tab = "settings";
    render();
    toast("כדי לפרסם ישירות לאתר צריך קודם לחבר את גיטהאב (פעם אחת)");
    return;
  }
  if (!isDirty()) { toast("אין שינויים לפרסם"); return; }
  const btn = $("#publish-btn");
  btn.disabled = true;
  btn.textContent = "מפרסם…";
  try {
    const current = await gh("GET");
    await gh("PUT", {
      message: "עדכון נתוני האתר מאזור הניהול",
      content: toB64(fileText()),
      sha: current.sha,
      branch: GH.branch
    });
    PUBLISHED = clone(data);
    safe.del(localStorage, DRAFT_KEY);
    updateState();
    toast("פורסם! האתר יתעדכן תוך דקה או שתיים");
  } catch (e) {
    toast(e.status === 401 || e.status === 403 || e.status === 404
      ? "גיטהאב סירב לשמירה. בדקו את מפתח הגישה בלשונית הגדרות"
      : "הפרסום לא הצליח. בדקו את החיבור לאינטרנט ונסו שוב");
  } finally {
    btn.disabled = false;
    btn.textContent = "שמירה ופרסום באתר";
  }
}

function validate() {
  const out = [];
  data.PRODUCTS.forEach((p) => {
    if (!String(p.name || "").trim()) out.push("יש מוצר בלי שם. תנו לו שם לפני ההורדה");
    if (!(Number(p.price) > 0)) out.push(`למוצר "${p.name || "ללא שם"}" חסר מחיר`);
  });
  data.BRANCHES.forEach((b) => { if (!String(b.city || "").trim()) out.push("יש סניף בלי שם עיר"); });
  return out;
}

/* =========================================================
   עזרי טפסים
   ========================================================= */
/* נתיב כמו "PRODUCTS.3.price" → קריאה/כתיבה בתוך data */
function getPath(path) { return path.split(".").reduce((o, k) => (o == null ? o : o[k]), data); }
function setPath(path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const obj = keys.reduce((o, k) => o[k], data);
  if (value === undefined) delete obj[last];
  else obj[last] = value;
}

const field = (label, path, { type = "text", cls = "", attrs = "" } = {}) => {
  const v = getPath(path);
  const val = type === "list" ? (v || []).join(", ") : v ?? "";
  const kind = type === "list" ? "list" : type === "number" ? "number" : "text";
  if (type === "textarea") {
    return `<label class="${cls}">${label}<textarea data-path="${path}" data-kind="text" ${attrs}>${esc(val)}</textarea></label>`;
  }
  const inputType = type === "number" ? "number" : type === "tel" ? "tel" : "text";
  return `<label class="${cls}">${label}<input type="${inputType}" data-path="${path}" data-kind="${kind}" value="${esc(val)}" ${type === "number" ? 'min="0" step="1" inputmode="numeric"' : ""} ${attrs}></label>`;
};

const select = (label, path, options, { cls = "", rerender = false } = {}) => {
  const v = getPath(path);
  return `<label class="${cls}">${label}<select data-path="${path}" data-kind="text" ${rerender ? "data-rerender" : ""}>
    ${options.map(([k, t]) => `<option value="${esc(k)}" ${k === v ? "selected" : ""}>${esc(t)}</option>`).join("")}
  </select></label>`;
};

const toggleBtn = (id) => {
  const open = PANELS._open === id;
  return `<button type="button" class="btn btn-ghost btn-sm" data-act="toggle" data-id="${esc(id)}" aria-expanded="${open}">${open ? "סגירה ▴" : "עריכה ▾"}</button>`;
};

const check = (label, path) =>
  `<label><input type="checkbox" data-path="${path}" data-kind="bool" ${getPath(path) ? "checked" : ""}>${esc(label)}</label>`;

/* =========================================================
   לשוניות
   ========================================================= */
const PANELS = {
  products() {
    const q = (PANELS._q || "").trim();
    const flavorOpts = Object.entries(data.FLAVORS).map(([k, f]) => [k, f.name]);
    const typeOpts = data.DREAMS.filter((d) => ["personal", "family", "stick", "party"].includes(d.key)).map((d) => [d.key, d.label]);
    const textureOpts = Object.entries(data.TEXTURES);
    const items = data.PRODUCTS.map((p, i) => ({ p, i })).filter(({ p }) => !q || `${p.name} ${p.short} ${p.id}`.includes(q));

    return `
      <div class="panel-head">
        <h2>מוצרים (${data.PRODUCTS.length})</h2>
        <div class="card-row">
          <input type="text" class="search" id="product-search" placeholder="חיפוש מוצר…" value="${esc(q)}">
          <button type="button" class="btn btn-primary" data-act="add-product">+ מוצר חדש</button>
        </div>
        <p class="hint">אפשר לשנות מחיר ישירות ברשימה. לחיצה על "עריכה" פותחת את כל פרטי המוצר.</p>
      </div>
      <div class="list">
        ${items.map(({ p, i }) => {
          const fl = data.FLAVORS[p.flavor] || {};
          const sizePriced = !!data.SIZES[p.type];
          const typeLabel = (data.DREAMS.find((d) => d.key === p.type) || {}).label || p.type;
          return `
          <div class="card ${p.hidden ? "is-hidden" : ""}" data-id="${esc(p.id)}">
            <div class="card-row">
              <span class="card-title">
                <span class="dot" style="background:${esc(fl.scoop || "#ccc")}"></span>
                ${esc(p.name || "מוצר חדש")}
                <span class="chip">${esc(typeLabel)}</span>
                ${p.hidden ? `<span class="chip warn">מוסתר</span>` : ""}
                ${p.isNew ? `<span class="chip">חדש</span>` : ""}
              </span>
              ${sizePriced
                ? `<span class="chip">מחיר לפי גודל</span>`
                : `<span class="price-inline">${field("", `PRODUCTS.${i}.price`, { type: "number", attrs: 'aria-label="מחיר"' })}</span>`}
              ${toggleBtn(p.id)}
            </div>
            <div class="card-body" ${PANELS._open === p.id ? "" : "hidden"}>
            <div class="grid">
              ${field("שם המוצר", `PRODUCTS.${i}.name`)}
              ${select("סוג", `PRODUCTS.${i}.type`, typeOpts, { rerender: true })}
              ${select("טעם (קובע את צבע האריזה)", `PRODUCTS.${i}.flavor`, flavorOpts, { rerender: true })}
              ${select("מרקם", `PRODUCTS.${i}.texture`, textureOpts)}
              ${sizePriced ? `<label>מחיר<input type="text" value="נקבע בלשונית גדלים ומחירים" disabled></label>` : field("מחיר (ש\"ח)", `PRODUCTS.${i}.price`, { type: "number" })}
              ${field("תגיות (מופרדות בפסיק)", `PRODUCTS.${i}.tags`, { type: "list" })}
              ${field("תיאור קצר (בכרטיס המוצר)", `PRODUCTS.${i}.short`, { type: "textarea", cls: "wide" })}
              ${field("תיאור מלא (בעמוד המוצר)", `PRODUCTS.${i}.long`, { type: "textarea", cls: "wide" })}
              <div class="checks"><span style="color:var(--muted);font-size:.9rem">קטגוריות:</span>
                ${data.GROUPS.map((g) => `<label><input type="checkbox" data-group="${esc(g.key)}" data-index="${i}" ${(p.groups || []).includes(g.key) ? "checked" : ""}>${esc(g.label)}</label>`).join("")}
              </div>
              <div class="checks">${FLAGS.map(([k, t]) => check(t, `PRODUCTS.${i}.${k}`)).join("")}</div>
              ${p.pack ? `<p class="wide" style="margin:0;color:var(--muted);font-size:.9rem">מארז: הלקוח בוחר עד ${p.pack.max} טעמים.</p>` : ""}
              <p class="wide" style="margin:0;color:var(--muted);font-size:.85rem">תמונה (לא חובה): <code>images/products/${esc(p.id)}.png</code></p>
            </div>
            <div class="card-foot">
              <button type="button" class="btn btn-danger btn-sm" data-act="del-product" data-index="${i}">מחיקת המוצר</button>
            </div>
            </div>
          </div>`;
        }).join("") || `<p>לא נמצאו מוצרים.</p>`}
      </div>`;
  },

  sizes() {
    const names = { family: "קופסה משפחתית", stick: "שלגונים וארטיקים" };
    return `
      <div class="panel-head">
        <h2>גדלים ומחירים</h2>
        <p class="hint">המחירים כאן חלים על כל המוצרים מהסוג הזה.</p>
      </div>
      <div class="list">
        ${Object.keys(data.SIZES).map((t) => `
          <div class="card">
            <h3>${esc(names[t] || t)}</h3>
            <div class="size-table">
              ${data.SIZES[t].map((s, j) => `
                <div class="size-row">
                  ${field("שם הגודל", `SIZES.${t}.${j}.label`)}
                  ${field("מחיר (ש\"ח)", `SIZES.${t}.${j}.price`, { type: "number" })}
                  ${data.SIZES[t].length > 1 ? `<button type="button" class="btn btn-danger btn-sm" data-act="del-size" data-type="${t}" data-index="${j}">הסרה</button>` : "<span></span>"}
                </div>`).join("")}
            </div>
            <div class="card-foot"><button type="button" class="btn btn-soft btn-sm" data-act="add-size" data-type="${t}">+ גודל נוסף</button></div>
          </div>`).join("")}
      </div>`;
  },

  flavors() {
    return `
      <div class="panel-head">
        <h2>טעמים</h2>
        <p class="hint">שינוי שם הטעם וצבעי האריזה. להוספת טעם חדש צריך גם תמונת קופסה, אז כרגע אפשר לערוך רק את הקיימים.</p>
      </div>
      <div class="list">
        ${Object.entries(data.FLAVORS).map(([k, f]) => `
          <div class="card" data-id="fl-${esc(k)}">
            <div class="card-row">
              <span class="card-title"><span class="dot" style="background:${esc(f.scoop)}"></span>${esc(f.name)}</span>
              ${toggleBtn("fl-" + k)}
            </div>
            <div class="card-body grid" ${PANELS._open === "fl-" + k ? "" : "hidden"}>
              ${field("שם הטעם", `FLAVORS.${k}.name`)}
              ${field("שם באנגלית (על התווית)", `FLAVORS.${k}.en`, { attrs: 'class="ltr"' })}
              <div class="colors">
                ${COLOR_FIELDS.map(([c, t]) => `<label><input type="color" data-path="FLAVORS.${k}.${c}" data-kind="text" value="${esc(f[c])}">${t}</label>`).join("")}
              </div>
            </div>
          </div>`).join("")}
      </div>`;
  },

  branches() {
    return `
      <div class="panel-head">
        <h2>סניפים (${data.BRANCHES.length})</h2>
        <button type="button" class="btn btn-primary" data-act="add-branch">+ סניף חדש</button>
      </div>
      <div class="list">
        ${data.BRANCHES.map((b, i) => `
          <div class="card">
            <div class="grid" style="margin-top:0">
              ${field("עיר", `BRANCHES.${i}.city`)}
              ${field("כתובת", `BRANCHES.${i}.address`)}
              ${field("שעות פתיחה", `BRANCHES.${i}.hours`, { cls: "wide" })}
            </div>
            <div class="card-foot">
              ${i > 0 ? `<button type="button" class="btn btn-ghost btn-sm" data-act="move-branch" data-index="${i}">▲ למעלה</button>` : ""}
              <button type="button" class="btn btn-danger btn-sm" data-act="del-branch" data-index="${i}">מחיקה</button>
            </div>
          </div>`).join("")}
      </div>`;
  },

  reviews() {
    return `
      <div class="panel-head">
        <h2>המלצות לקוחות (${data.REVIEWS.length})</h2>
        <button type="button" class="btn btn-primary" data-act="add-review">+ המלצה חדשה</button>
      </div>
      <div class="list">
        ${data.REVIEWS.map((r, i) => `
          <div class="card">
            <div class="grid" style="margin-top:0">
              ${field("שם הממליץ", `REVIEWS.${i}.who`)}
              ${field("על איזה מוצר", `REVIEWS.${i}.flavor`)}
              ${field("ההמלצה", `REVIEWS.${i}.text`, { type: "textarea", cls: "wide" })}
            </div>
            <div class="card-foot"><button type="button" class="btn btn-danger btn-sm" data-act="del-review" data-index="${i}">מחיקה</button></div>
          </div>`).join("")}
      </div>`;
  },

  business() {
    return `
      <div class="panel-head"><h2>פרטי העסק</h2></div>
      <div class="card">
        <div class="grid" style="margin-top:0">
          ${field("טלפון (מוצג באתר)", "CONFIG.phone", { type: "tel", attrs: 'class="ltr"' })}
          ${field("מספר וואטסאפ להזמנות (עם 972, בלי 0)", "CONFIG.whatsapp", { type: "tel", attrs: 'class="ltr"' })}
          ${field("דמי משלוח (ש\"ח)", "CONFIG.shippingPrice", { type: "number" })}
          ${field("משלוח חינם מעל (ש\"ח)", "CONFIG.freeShippingFrom", { type: "number" })}
        </div>
      </div>`;
  },

  settings() {
    const has = !!getToken();
    return `
      <div class="panel-head"><h2>חיבור לאתר</h2></div>
      <form class="card" id="token-form" style="max-width:620px;margin-bottom:1.4rem">
        <p style="margin-top:0">${has
          ? "<strong style='color:var(--ok)'>✓ מחובר.</strong> לחיצה על \"שמירה ופרסום באתר\" מעדכנת את האתר ישירות."
          : "כדי שלחיצה על \"שמירה ופרסום באתר\" תעדכן את האתר, צריך להדביק כאן פעם אחת מפתח גישה מגיטהאב. המפתח נשמר רק במחשב הזה."}</p>
        <details style="margin-bottom:.8rem"><summary class="link-btn" style="margin:0">איך יוצרים מפתח גישה?</summary>
          <ol style="margin:.6rem 0;padding-inline-start:1.2rem;font-size:.95rem">
            <li>נכנסים ל-<a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener" style="color:var(--maroon)">יצירת מפתח בגיטהאב</a> (מחוברים לחשבון של האתר).</li>
            <li>נותנים שם, למשל "ניהול Dreamy", ותוקף לשנה.</li>
            <li>ב-Repository access בוחרים Only select repositories ואת המאגר של האתר.</li>
            <li>ב-Permissions → Repository permissions → Contents בוחרים Read and write.</li>
            <li>לוחצים Generate token, מעתיקים ומדביקים כאן.</li>
          </ol>
        </details>
        <label>מפתח גישה<input type="password" name="token" class="ltr" placeholder="${has ? "••••••••  (להחלפה הדביקו מפתח חדש)" : "github_pat_…"}" autocomplete="off"></label>
        <p class="error" id="token-error" role="alert"></p>
        <div class="card-foot">
          ${has ? `<button type="button" class="btn btn-ghost btn-sm" data-act="forget-token">ניתוק</button>` : ""}
          <button type="submit" class="btn btn-primary">שמירה ובדיקה</button>
        </div>
      </form>

      <div class="panel-head">
        <h2>שם משתמש וסיסמה</h2>
        <p class="hint">הסיסמה החדשה תעבוד מכל מחשב אחרי לחיצה על "שמירה ופרסום באתר".</p>
      </div>
      <form class="card" id="pass-form" style="max-width:460px">
        <div class="grid" style="margin-top:0;grid-template-columns:1fr">
          <label>שם משתמש<input type="text" name="user" value="${esc(data.ADMIN?.user || "admin")}" autocomplete="username" required></label>
          <label>סיסמה נוכחית<input type="password" name="current" autocomplete="current-password" required></label>
          <label>סיסמה חדשה (לפחות 8 תווים)<input type="password" name="next" autocomplete="new-password" minlength="8" required></label>
          <label>הקלדה חוזרת של הסיסמה החדשה<input type="password" name="again" autocomplete="new-password" minlength="8" required></label>
          <p class="error" id="pass-error" role="alert"></p>
        </div>
        <div class="card-foot"><button type="submit" class="btn btn-primary">שמירת הסיסמה</button></div>
      </form>`;
  }
};

function render() {
  $$("#tabs [data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === tab)));
  $("#panel").innerHTML = PANELS[tab]();
  updateState();
}

/* =========================================================
   אירועים
   ========================================================= */
function onInput(e) {
  const el = e.target;
  if (el.id === "product-search") {
    PANELS._q = el.value;
    const pos = el.selectionStart;
    render();
    const s = $("#product-search");
    s.focus();
    s.setSelectionRange(pos, pos);
    return;
  }
  if (el.dataset.group) {
    const p = data.PRODUCTS[+el.dataset.index];
    const set = new Set(p.groups || []);
    el.checked ? set.add(el.dataset.group) : set.delete(el.dataset.group);
    p.groups = data.GROUPS.map((g) => g.key).filter((k) => set.has(k));
    save();
    return;
  }
  const path = el.dataset.path;
  if (!path) return;
  let v;
  switch (el.dataset.kind) {
    case "number": v = el.value === "" ? 0 : Math.max(0, Number(el.value)); break;
    case "list": v = el.value.split(",").map((t) => t.trim()).filter(Boolean); break;
    case "bool": v = el.checked || undefined; break;
    default: v = el.value;
  }
  setPath(path, v);

  // סוג מוצר משפיע על המשקל המוצג
  const m = path.match(/^PRODUCTS\.(\d+)\.type$/);
  if (m) data.PRODUCTS[+m[1]].weight = WEIGHTS[v] ?? "";

  // שינויים במחיר ברשימה ובכרטיס הפתוח – מסנכרנים את השדה השני
  $$(`[data-path="${path}"]`).forEach((o) => { if (o !== el && o.type !== "checkbox") o.value = el.value; });

  save();
  if (el.hasAttribute("data-rerender") || el.dataset.kind === "bool") {
    const card = el.closest("[data-id]");
    PANELS._open = card ? card.dataset.id : null;
    render();
  }
}

function onClick(e) {
  const btn = e.target.closest("[data-act], [data-tab]");
  if (!btn) return;
  if (btn.dataset.tab) {
    tab = btn.dataset.tab;
    PANELS._open = null;
    render();
    window.scrollTo({ top: 0 });
    return;
  }
  const i = +btn.dataset.index;
  switch (btn.dataset.act) {
    case "toggle":
      PANELS._open = PANELS._open === btn.dataset.id ? null : btn.dataset.id;
      render();
      return;
    case "forget-token":
      safe.del(localStorage, TOKEN_KEY);
      render();
      toast("גיטהאב נותק מהמחשב הזה");
      return;
    case "add-product": {
      const id = `item-${Date.now().toString(36)}`;
      data.PRODUCTS.unshift({
        id, flavor: Object.keys(data.FLAVORS)[0], type: "personal", groups: [], price: 35, texture: "creamy",
        likes: 0, short: "", long: "", weight: WEIGHTS.personal, name: "", tags: []
      });
      PANELS._q = "";
      PANELS._open = id;
      break;
    }
    case "del-product":
      if (!confirmInline(btn, "ללחוץ שוב למחיקה")) return;
      data.PRODUCTS.splice(i, 1);
      break;
    case "add-size":
      data.SIZES[btn.dataset.type].push({ key: `s${Date.now().toString(36)}`, label: "", price: 0 });
      break;
    case "del-size":
      data.SIZES[btn.dataset.type].splice(i, 1);
      break;
    case "add-branch":
      data.BRANCHES.push({ city: "", address: "", hours: "" });
      break;
    case "move-branch":
      [data.BRANCHES[i - 1], data.BRANCHES[i]] = [data.BRANCHES[i], data.BRANCHES[i - 1]];
      break;
    case "del-branch":
      if (!confirmInline(btn, "ללחוץ שוב למחיקה")) return;
      data.BRANCHES.splice(i, 1);
      break;
    case "add-review":
      data.REVIEWS.push({ who: "", flavor: "", text: "" });
      break;
    case "del-review":
      if (!confirmInline(btn, "ללחוץ שוב למחיקה")) return;
      data.REVIEWS.splice(i, 1);
      break;
    default: return;
  }
  save();
  render();
}

/* אישור מחיקה בלחיצה שנייה, בלי חלון קופץ */
function confirmInline(btn, text) {
  if (btn.dataset.armed) return true;
  btn.dataset.armed = "1";
  const old = btn.textContent;
  btn.textContent = text;
  setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.textContent = old; } }, 3000);
  return false;
}

async function onTokenSubmit(e) {
  const tok = String(new FormData(e.target).get("token")).trim();
  const err = $("#token-error");
  err.textContent = "";
  if (!tok) { err.textContent = "הדביקו את מפתח הגישה"; return; }
  const old = getToken();
  safe.set(localStorage, TOKEN_KEY, tok);
  try {
    await gh("GET");
    toast("מחובר! מעכשיו אפשר לפרסם ישירות לאתר");
    await syncFromGitHub();
    render();
  } catch (x) {
    old ? safe.set(localStorage, TOKEN_KEY, old) : safe.del(localStorage, TOKEN_KEY);
    err.textContent = x.status === 401 ? "המפתח לא תקין או שפג תוקפו" : "למפתח אין גישה למאגר של האתר. בדקו את ההרשאות";
  }
}

async function onPassSubmit(e) {
  if (e.target.id === "token-form") { e.preventDefault(); return onTokenSubmit(e); }
  if (e.target.id !== "pass-form") return;
  e.preventDefault();
  const f = new FormData(e.target);
  const err = $("#pass-error");
  const user = String(f.get("user")).trim();
  const next = String(f.get("next"));
  err.textContent = "";
  if (!user) { err.textContent = "צריך שם משתמש"; return; }
  if (next.length < 8) { err.textContent = "הסיסמה החדשה צריכה להכיל לפחות 8 תווים"; return; }
  if (next !== f.get("again")) { err.textContent = "שתי הסיסמאות החדשות לא זהות"; return; }
  const a = data.ADMIN;
  if ((await hashPassword(String(f.get("current")), a.salt, a.iterations)) !== a.hash) {
    err.textContent = "הסיסמה הנוכחית לא נכונה";
    return;
  }
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  const iterations = 150000;
  data.ADMIN = { user, salt, hash: await hashPassword(next, salt, iterations), iterations };
  safe.set(sessionStorage, SESSION_KEY, data.ADMIN.hash);
  save();
  render();
  toast("הסיסמה נשמרה. לחצו \"שמירה ופרסום באתר\" כדי שתיכנס לתוקף");
}

async function onLogin(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const err = $("#login-error");
  const btn = e.target.querySelector("button[type=submit]");
  err.textContent = "";
  btn.disabled = true;
  try {
    const tok = await checkLogin(String(f.get("user")), String(f.get("pass")));
    if (!tok) { err.textContent = "שם המשתמש או הסיסמה לא נכונים"; return; }
    safe.set(sessionStorage, SESSION_KEY, tok);
    showApp();
  } catch {
    err.textContent = "הדפדפן לא תומך בכניסה מאובטחת. פתחו את האתר דרך https.";
  } finally {
    btn.disabled = false;
  }
}

function showApp() {
  $("#login-screen").hidden = true;
  $("#app").hidden = false;
  render();
  syncFromGitHub();
}

function logout() {
  safe.del(sessionStorage, SESSION_KEY);
  location.reload();
}

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3500);
}

/* =========================================================
   הפעלה
   ========================================================= */
$("#login-form").addEventListener("submit", onLogin);
$("#panel").addEventListener("input", onInput);
$("#panel").addEventListener("submit", onPassSubmit);
document.addEventListener("click", onClick);
$("#export-btn").addEventListener("click", exportFile);
$("#publish-btn").addEventListener("click", publish);
$("#logout-btn").addEventListener("click", logout);
$("#reset-btn").addEventListener("click", (e) => {
  if (!confirmInline(e.target, "בטוחים? לחצו שוב לביטול הטיוטה")) return;
  data = clone(PUBLISHED);
  safe.del(localStorage, DRAFT_KEY);
  render();
  toast("הטיוטה בוטלה");
});

if (isLoggedIn()) showApp();
