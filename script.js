/* =========================================================
   Dreamy – אתר מכירות גלידה
   ---------------------------------------------------------
   ✎ את הפרטים (טלפון, טעמים, מוצרים ומחירים, סניפים)
     מעדכנים באזור הניהול: /admin. הנתונים נשמרים ב-data.js.

   תמונות (לא חובה):
   • images/logo.png            – הלוגו (כבר בשימוש).
   • images/tubs/tub-<טעם>.webp  – קופסאות הגלידה לפי טעם.
   • images/products/<id>.png   – יחליף את האיור של המוצר
     (ה-id מופיע בכל מוצר ברשימה למטה, למשל choc-cup.png).
   כל עוד הקובץ לא קיים, מוצג איור מעוצב אוטומטית.
   ========================================================= */

/* ---------- הנתונים נטענים מ-data.js (שמתעדכן מאזור הניהול) ---------- */
const DATA = (() => {
  // תצוגה מקדימה: מנהל שמחובר באזור הניהול רואה את הטיוטה שלו בדפדפן שלו בלבד
  try {
    if (new URLSearchParams(location.search).has("preview")) {
      const draft = JSON.parse(localStorage.getItem("dreamy-admin-draft") || "null");
      if (draft && draft.PRODUCTS) return draft;
    }
  } catch { /* ממשיכים עם הנתונים הרגילים */ }
  return window.DREAMY_DATA;
})();

const { CONFIG, FLAVORS, DREAMS, GROUPS, TEXTURES, SIZES, PACK_FLAVORS, BRANCHES, REVIEWS } = DATA;
const ALL_PRODUCTS = DATA.PRODUCTS;
/* מוצר שסומן "מוסתר" באזור הניהול לא מוצג בחנות */
const PRODUCTS = ALL_PRODUCTS.filter((x) => !x.hidden);

/* =========================================================
   עזרים
   ========================================================= */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const money = (n) => `${n} ${CONFIG.currency}`;
const byId = (id) => ALL_PRODUCTS.find((x) => x.id === id);
let uidN = 0;
const uid = () => `d${++uidN}`;

const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* מצב פרטי – ממשיכים בלי שמירה */ }
  }
};

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* הכהיה/הבהרה של צבע hex */
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const t = amt < 0 ? 0 : 255;
  const a = Math.abs(amt);
  const ch = (v) => Math.round((t - v) * a + v);
  const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/* בדיקה אם קובץ תמונה קיים */
const imgCache = new Map();
function imageExists(src) {
  if (!imgCache.has(src)) {
    imgCache.set(src, new Promise((res) => {
      const i = new Image();
      i.onload = () => res(true);
      i.onerror = () => res(false);
      i.src = src;
    }));
  }
  return imgCache.get(src);
}

/* מחליף איורים בתמונות אמיתיות אם הועלו */
function hydrateImages(root = document) {
  $$("[data-img]", root).forEach((box) => {
    const src = `images/products/${box.dataset.img}.png`;
    imageExists(src).then((ok) => {
      if (!ok) return;
      const img = new Image();
      img.src = src;
      img.alt = box.getAttribute("aria-label") || "";
      img.loading = "lazy";
      box.replaceChildren(img);
    });
  });
}

/* =========================================================
   איורים – SVG
   ========================================================= */
/* קופסה אמיתית: התמונה המקורית, צבועה לפי הטעם, עם שם הטעם על המכסה ועל התווית */
const titleCase = (t) => t.toLowerCase().replace(/(^|[\s&])([a-z])/g, (m, a, b) => a + b.toUpperCase());
function isLight(hex) {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 165;
}
function tubPhoto(key, badge = "") {
  const f = FLAVORS[key];
  const tx = isLight(f.body) ? "#8a5f3a" : "#e8c995";
  const texts = key === "choc" ? "" /* התמונה המקורית כבר כוללת את הכיתוב */
    : `<span class="tub-lid">${esc(titleCase(f.en))}</span><span class="tub-name">${esc(f.en)}</span>`;
  return `<span class="tub" style="--tub-tx:${tx}"><img src="images/tubs/tub-${key}.webp" alt="" loading="lazy" decoding="async">${texts}${badge ? `<span class="tub-badge">${badge}</span>` : ""}</span>`;
}

function tubSVG(f, { big = false, label = "" } = {}) {
  const u = uid();
  const top = big ? 52 : 66, bot = big ? 182 : 172;
  const tw = big ? 90 : 72, bw = big ? 76 : 58;
  const cx = 110;
  const fs = big ? 46 : 40;
  const ly = big ? 122 : 120;
  return `<svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="${u}b" x1="0" x2="1">
        <stop offset="0" stop-color="${shade(f.body, -.25)}"/><stop offset=".35" stop-color="${shade(f.body, .1)}"/>
        <stop offset=".7" stop-color="${f.body}"/><stop offset="1" stop-color="${shade(f.body, -.3)}"/>
      </linearGradient>
      <linearGradient id="${u}l" x1="0" x2="1">
        <stop offset="0" stop-color="${shade(f.lid, -.25)}"/><stop offset=".4" stop-color="${shade(f.lid, .12)}"/><stop offset="1" stop-color="${shade(f.lid, -.3)}"/>
      </linearGradient>
      <linearGradient id="${u}g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${shade(f.tx, .3)}"/><stop offset="1" stop-color="${shade(f.tx, -.12)}"/>
      </linearGradient>
    </defs>
    <ellipse cx="${cx}" cy="${bot + 8}" rx="${bw + 18}" ry="7" fill="#5a2a40" opacity=".16"/>
    <path d="M${cx - tw} ${top}L${cx - bw} ${bot}Q${cx} ${bot + 12} ${cx + bw} ${bot}L${cx + tw} ${top}Z" fill="url(#${u}b)"/>
    <path d="M${cx - tw + 12} ${top + 6}L${cx - bw + 10} ${bot - 6}L${cx - bw + 18} ${bot - 4}L${cx - tw + 22} ${top + 6}Z" fill="#fff" opacity=".13"/>
    <rect x="${cx - tw - 7}" y="${top - 16}" width="${(tw + 7) * 2}" height="20" rx="5" fill="url(#${u}l)"/>
    <ellipse cx="${cx}" cy="${top - 16}" rx="${tw + 7}" ry="${big ? 16 : 14}" fill="${shade(f.lid, .08)}"/>
    <ellipse cx="${cx}" cy="${top - 16}" rx="${tw - 8}" ry="${big ? 11 : 9}" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1.5"/>
    <text x="${cx}" y="${ly}" text-anchor="middle" font-family="Dancing Script, cursive" font-weight="700" font-size="${fs}" fill="url(#${u}g)">Dreamy</text>
    <path d="M${cx + 46} ${ly - 30}l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="${f.tx}" opacity=".85"/>
    <text x="${cx}" y="${ly + 22}" text-anchor="middle" font-family="Rubik, Arial, sans-serif" font-size="${big ? 10 : 9}" letter-spacing="2" fill="${f.tx}" opacity=".9">${f.en}</text>
    <g fill="${f.bits}" opacity=".9">
      <rect x="${cx + 26}" y="${bot - 30}" width="9" height="9" rx="2" transform="rotate(20 ${cx + 30} ${bot - 26})"/>
      <rect x="${cx + 40}" y="${bot - 44}" width="7" height="7" rx="2" transform="rotate(-15 ${cx + 43} ${bot - 41})"/>
      <circle cx="${cx - 34}" cy="${bot - 24}" r="3"/>
    </g>
    ${label ? `<g><rect x="${cx - 26}" y="${bot - 22}" width="52" height="16" rx="8" fill="${f.tx}"/><text x="${cx}" y="${bot - 10.5}" text-anchor="middle" font-family="Rubik, Arial" font-size="9" font-weight="600" fill="${f.body}">${label}</text></g>` : ""}
  </svg>`;
}

function stickSVG(f, prod) {
  const u = uid();
  const coat = prod.coat || f.body;
  const dz = prod.drizzle || f.tx;
  return `<svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="${u}c" x1="0" x2="1">
        <stop offset="0" stop-color="${shade(coat, -.2)}"/><stop offset=".4" stop-color="${shade(coat, .15)}"/><stop offset="1" stop-color="${shade(coat, -.25)}"/>
      </linearGradient>
    </defs>
    <ellipse cx="110" cy="190" rx="60" ry="6" fill="#5a2a40" opacity=".14"/>
    <g transform="rotate(-18 110 100)">
      <rect x="99" y="128" width="22" height="66" rx="10" fill="#e6c899"/>
      <path d="M104 140v44M110 136v50M116 140v44" stroke="#c9a56f" stroke-width=".8" opacity=".6"/>
      <rect x="66" y="12" width="88" height="134" rx="42" fill="url(#${u}c)"/>
      <path d="M78 24q-6 40 0 100" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="7" stroke-linecap="round"/>
      <path d="M140 18q8 6 10 18" fill="none" stroke="#fff" stroke-opacity=".15" stroke-width="4" stroke-linecap="round"/>
      <path d="M70 52l16 -8 14 8 14 -8 14 8 14 -8 12 6M70 82l16 -8 14 8 14 -8 14 8 14 -8 12 6" fill="none" stroke="${dz}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>
      <circle cx="96" cy="112" r="3" fill="${f.scoop}"/><circle cx="124" cy="104" r="2.5" fill="${f.scoop}"/><circle cx="112" cy="124" r="2" fill="${f.scoop}"/>
      <path d="M66 120q0 26 44 26t44-26" fill="${shade(coat, -.12)}" opacity=".35"/>
    </g>
  </svg>`;
}

function scoopSVG(f, size = 100) {
  const u = uid();
  return `<svg viewBox="0 0 120 110" width="${size}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><radialGradient id="${u}s" cx=".35" cy=".3" r=".8">
      <stop offset="0" stop-color="${shade(f.scoop, .35)}"/><stop offset=".6" stop-color="${f.scoop}"/><stop offset="1" stop-color="${shade(f.scoop, -.22)}"/>
    </radialGradient></defs>
    <path d="M14 70C6 30 40 6 62 8c28 2 50 26 44 58 6 4 6 12 0 14-4 6-10 4-14 8-6 4-12-2-18 2-6 4-12 2-16-2-6 4-14 4-18-2-6 2-12-2-12-8-6-2-8-8-8-10z" fill="url(#${u}s)"/>
    <g fill="${f.bits}">
      <rect x="40" y="40" width="7" height="7" rx="1.5" transform="rotate(25 43 43)"/>
      <rect x="70" y="30" width="6" height="6" rx="1.5" transform="rotate(-20 73 33)"/>
      <rect x="78" y="58" width="7" height="7" rx="1.5" transform="rotate(10 81 61)"/>
      <circle cx="56" cy="64" r="2.6"/><circle cx="30" cy="58" r="2.2"/><circle cx="90" cy="44" r="2"/>
    </g>
  </svg>`;
}

function packSVG(prod, picks = []) {
  const u = uid();
  const fl = (i) => FLAVORS[picks[i] || PACK_FLAVORS[(i * 3 + 1) % PACK_FLAVORS.length]];
  if (prod.pack.kind === "tray") {
    const pos = [[62, 92], [96, 84], [130, 84], [164, 92], [78, 120], [112, 116], [146, 120]];
    return `<svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="110" cy="176" rx="92" ry="10" fill="#5a2a40" opacity=".15"/>
      <path d="M14 120h192l-14 46q-82 14-164 0z" fill="#f4d7df"/>
      <path d="M14 120h192" stroke="#b4526b" stroke-width="3"/>
      <image href="images/logo.png" x="80" y="138" width="60" height="25"/>
      ${pos.map(([x, y], i) => `<g transform="translate(${x - 30} ${y - 46}) scale(.5)">${scoopSVG(fl(i % 4), 120).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g>`).join("")}
    </svg>`;
  }
  if (prod.pack.kind === "bucket") {
    const cols = [0, 1, 2].map(fl);
    return `<svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="110" cy="188" rx="78" ry="7" fill="#5a2a40" opacity=".15"/>
      <path d="M30 70Q110 -10 190 70" fill="none" stroke="#b48d5d" stroke-width="5"/>
      <ellipse cx="110" cy="68" rx="84" ry="18" fill="#f6e9ec"/>
      <path d="M30 68q20-14 54-14v28q-34 0-54-14z" fill="${cols[0].scoop}"/>
      <path d="M84 54h52v30h-52z" fill="${cols[1].scoop}"/>
      <path d="M136 54q34 0 54 14-20 14-54 14z" fill="${cols[2].scoop}"/>
      <path d="M26 72L42 182Q110 196 178 182L194 72Q110 92 26 72Z" fill="#f4d7df"/>
      <path d="M26 72Q110 92 194 72" fill="none" stroke="#b4526b" stroke-width="5"/>
      <image href="images/logo.png" x="58" y="104" width="104" height="44"/>
      <text x="110" y="164" text-anchor="middle" font-family="Rubik, Arial" font-size="11" letter-spacing="3" fill="#b48d5d">PARTY · 3L</text>
    </svg>`;
  }
  /* box: 6 גביעים */
  const keyAt = (i) => picks[i] || PACK_FLAVORS[(i * 3 + 1) % PACK_FLAVORS.length];
  const minis = [0, 1, 2].map((i) => {
    return `<image href="images/tubs/tub-${keyAt(i)}.webp" x="${8 + i * 64}" y="12" width="76" height="77"/>`;
  }).join("");
  return `<svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="110" cy="186" rx="92" ry="8" fill="#5a2a40" opacity=".15"/>
    ${minis}
    <path d="M14 88h192v86a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8z" fill="#f4d7df"/>
    <path d="M14 88h192l-10-14H24z" fill="#ecc4cf"/>
    <rect x="102" y="88" width="16" height="94" fill="#b4526b" opacity=".85"/>
    <path d="M110 92c-14-14-30-6-20 4 6 6 20 0 20-4zM110 92c14-14 30-6 20 4-6 6-20 0-20-4z" fill="#b4526b"/>
    <image href="images/logo.png" x="22" y="118" width="74" height="31"/>
    <text x="164" y="142" text-anchor="middle" font-family="Rubik, Arial" font-size="12" letter-spacing="2" fill="#b48d5d">6 PACK</text>
  </svg>`;
}

function productArt(prod, picks) {
  const f = FLAVORS[prod.flavor];
  if (prod.type === "family") return tubPhoto(prod.flavor, "FAMILY");
  if (prod.type === "stick") return stickSVG(f, prod);
  if (prod.type === "party") return packSVG(prod, picks);
  return tubPhoto(prod.flavor, prod.limited ? "LIMITED" : prod.sugarFree ? "NO SUGAR" : "");
}

/* =========================================================
   סל קניות – מצב
   ========================================================= */
let cart = store.get("dreamy-cart", []).filter((l) => PRODUCTS.some((x) => x.id === l.id));
let likes = store.get("dreamy-likes", {});

function saveCart() {
  store.set("dreamy-cart", cart);
  renderCart();
}

function addToCart(prod, { qty = 1, size = null, picks = [] } = {}) {
  const sizeObj = size ? SIZES[prod.type].find((s) => s.key === size) : null;
  const price = sizeObj ? sizeObj.price : prod.price;
  const key = [prod.id, size || "", picks.slice().sort().join(".")].join("|");
  const found = cart.find((l) => l.key === key);
  if (found) found.qty += qty;
  else cart.push({ key, id: prod.id, size, sizeLabel: sizeObj?.label || "", picks, price, qty });
  saveCart();
  const badge = $("#cart-count");
  badge.classList.remove("bump");
  void badge.offsetWidth;
  badge.classList.add("bump");
  toast(`${prod.name} נוסף לסל 🍨`);
}

const cartCount = () => cart.reduce((s, l) => s + l.qty, 0);
const subtotal = () => cart.reduce((s, l) => s + l.qty * l.price, 0);

function pickSummary(picks) {
  const counts = {};
  picks.forEach((k) => (counts[k] = (counts[k] || 0) + 1));
  return Object.entries(counts).map(([k, n]) => (n > 1 ? `${FLAVORS[k].name} ×${n}` : FLAVORS[k].name)).join(", ");
}

function renderCart() {
  const count = cartCount();
  const badge = $("#cart-count");
  badge.textContent = count;
  badge.hidden = count === 0;

  const body = $("#cart-items");
  const foot = $("#cart-foot");

  if (!cart.length) {
    body.innerHTML = `<div class="cart-empty"><div class="art">${scoopSVG(FLAVORS.straw, 120)}</div>
      <p>הסל עדיין ריק… אבל החלום רק מתחיל.</p>
      <a href="#shop" class="btn btn-primary btn-sm" data-close-cart>לכל הטעמים</a></div>`;
    foot.hidden = true;
    return;
  }

  foot.hidden = false;
  body.innerHTML = cart.map((l) => {
    const prod = byId(l.id);
    if (!prod) return "";
    const meta = [l.sizeLabel || prod.weight, l.picks.length ? pickSummary(l.picks) : ""].filter(Boolean).join(" · ");
    return `<div class="line" data-key="${esc(l.key)}">
      <div class="thumb" data-img="${prod.id}" aria-label="${esc(prod.name)}">${productArt(prod, l.picks)}</div>
      <div>
        <h3>${esc(prod.name)}</h3>
        <div class="meta">${esc(meta)}</div>
        <div class="stepper sm" style="margin-top:.4rem">
          <button type="button" data-act="inc" aria-label="הוספת יחידה">+</button>
          <output>${l.qty}</output>
          <button type="button" data-act="dec" aria-label="הפחתת יחידה">−</button>
        </div>
      </div>
      <div class="end">
        <span class="sum">${money(l.qty * l.price)}</span>
        <button type="button" class="remove" data-act="remove">הסרה</button>
      </div>
    </div>`;
  }).join("");
  hydrateImages(body);
  updateTotals();
}

function updateTotals() {
  const sub = subtotal();
  const pickup = $("#checkout").method.value === "pickup";
  const ship = pickup || sub >= CONFIG.freeShippingFrom ? 0 : CONFIG.shippingPrice;
  $("#cart-subtotal").textContent = money(sub);
  $("#cart-shipping").textContent = pickup ? "איסוף עצמי" : ship ? money(ship) : "חינם 🎉";
  $("#cart-total").textContent = money(sub + ship);
  const left = CONFIG.freeShippingFrom - sub;
  $("#ship-note").textContent = !pickup && left > 0 ? `עוד ${money(left)} ומקבלים משלוח חינם!` : "";
  return { sub, ship, total: sub + ship };
}

$("#cart-items").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const key = btn.closest(".line").dataset.key;
  const line = cart.find((l) => l.key === key);
  if (!line) return;
  if (btn.dataset.act === "inc") line.qty++;
  if (btn.dataset.act === "dec") line.qty--;
  if (btn.dataset.act === "remove" || line.qty < 1) cart = cart.filter((l) => l !== line);
  saveCart();
});

/* פתיחה וסגירה של הסל */
const drawer = $("#cart");
let lastFocus = null;

function openCart() {
  lastFocus = document.activeElement;
  drawer.hidden = false;
  drawer.classList.remove("is-closing");
  document.body.classList.add("no-scroll");
  $(".close-btn", drawer).focus();
}

function closeCart() {
  if (drawer.hidden || drawer.classList.contains("is-closing")) return;
  drawer.classList.add("is-closing");
  setTimeout(() => {
    drawer.hidden = true;
    drawer.classList.remove("is-closing");
    document.body.classList.remove("no-scroll");
    lastFocus?.focus?.();
  }, 230);
}

$("#cart-btn").addEventListener("click", openCart);
drawer.addEventListener("click", (e) => { if (e.target.closest("[data-close-cart]")) closeCart(); });

/* טופס הזמנה → וואטסאפ */
const form = $("#checkout");
const branchSelect = form.branch;
branchSelect.innerHTML = `<option value="">בחרו סניף לאיסוף</option>` +
  BRANCHES.map((b) => `<option>${esc(b.city)}</option>`).join("");

form.addEventListener("change", (e) => {
  if (e.target.name !== "method") return;
  const pickup = form.method.value === "pickup";
  form.address.hidden = pickup;
  branchSelect.hidden = !pickup;
  updateTotals();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const err = $("#form-error");
  const pickup = form.method.value === "pickup";
  const name = form.name.value.trim();
  const phone = form.phone.value.trim();
  if (!name || !/^[\d\-+ ]{9,}$/.test(phone)) { err.textContent = "נא למלא שם וטלפון תקין."; return; }
  if (!pickup && !form.address.value.trim()) { err.textContent = "נא למלא כתובת למשלוח."; return; }
  if (pickup && !branchSelect.value) { err.textContent = "נא לבחור סניף לאיסוף."; return; }
  err.textContent = "";

  const { ship, total } = updateTotals();
  const lines = cart.map((l) => {
    const prod = byId(l.id);
    const extra = [l.sizeLabel, l.picks.length ? pickSummary(l.picks) : ""].filter(Boolean).join(" | ");
    return `• ${prod.name}${extra ? ` (${extra})` : ""} × ${l.qty} = ${money(l.qty * l.price)}`;
  });
  const msg = [
    "שלום Dreamy! 🍨 אני רוצה להזמין:",
    "",
    ...lines,
    "",
    `משלוח: ${pickup ? "איסוף מסניף " + branchSelect.value : ship ? money(ship) : "חינם"}`,
    `סה"כ: ${money(total)}`,
    "",
    `שם: ${name}`,
    `טלפון: ${phone}`,
    pickup ? "" : `כתובת: ${form.address.value.trim()}`,
    form.notes.value.trim() ? `הערות: ${form.notes.value.trim()}` : ""
  ].filter((x, i, a) => x !== "" || a[i - 1] !== "").join("\n");

  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
});

/* =========================================================
   הודעה קופצת
   ========================================================= */
let toastTimer;
function toast(text) {
  const t = $("#toast");
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* =========================================================
   כרטיס מוצר
   ========================================================= */
function cardHTML(prod, i = 0) {
  const flags = [
    prod.isNew ? `<span class="tag">חדש!</span>` : "",
    prod.limited ? `<span class="tag">מהדורה מוגבלת</span>` : "",
    prod.sugarFree ? `<span class="tag soft">ללא סוכר</span>` : ""
  ].join("");
  const priceLabel = SIZES[prod.type] ? `<small>החל מ-</small>${money(SIZES[prod.type][0].price)}` : money(prod.price);
  const weight = SIZES[prod.type] ? SIZES[prod.type].map((s) => s.label).join(" / ") : prod.weight || "בחירת טעמים";
  return `<article class="card" style="animation-delay:${Math.min(i, 10) * 45}ms">
    <div class="card-flags">${flags}</div>
    <a href="#product/${prod.id}" class="card-art" data-img="${prod.id}" aria-label="${esc(prod.name)}">${productArt(prod)}</a>
    <h3><a href="#product/${prod.id}">${esc(prod.name)}</a></h3>
    <div class="price-row"><span class="price">${priceLabel}</span><span class="weight">${esc(weight)}</span></div>
    <p>${esc(prod.short)}</p>
    ${prod.pack || SIZES[prod.type]
      ? `<a href="#product/${prod.id}" class="btn btn-primary btn-sm btn-block">${prod.pack ? "בחירת טעמים" : "בחירת גודל"}</a>`
      : `<button type="button" class="btn btn-primary btn-sm btn-block" data-add="${prod.id}">הוספה לסל</button>`}
  </article>`;
}

document.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]");
  if (add) addToCart(byId(add.dataset.add));
});

/* =========================================================
   עמודים
   ========================================================= */
const view = $("#view");

function homeView() {
  const top = [...PRODUCTS].filter((x) => x.type === "personal").sort((a, b) => b.likes - a.likes).slice(0, 4);
  const tiles = [
    { key: "personal", label: "חלום אישי", sub: "גביעים של 250 גרם", art: tubPhoto("straw") },
    { key: "family", label: "חלום משפחתי", sub: "1 ו-2 ליטר", art: tubPhoto("choc", "FAMILY") },
    { key: "stick", label: "חלום על מקל", sub: "שלגונים וארטיקים", art: stickSVG(FLAVORS.choc, byId("choc-stick")) },
    { key: "party", label: "חלום למסיבות", sub: "מארזים, דליים ומגשים", art: packSVG(byId("party-6")) }
  ];
  return `
    <section class="hero">
      <div class="float scoop-1">${scoopSVG(FLAVORS.straw, 170)}</div>
      <div class="float scoop-2">${scoopSVG(FLAVORS.choc, 150)}</div>
      <div class="float scoop-3">${scoopSVG(FLAVORS.vanilla, 130)}</div>
      ${[[8, 18], [22, 70], [40, 12], [62, 26], [78, 62], [88, 14], [54, 80]].map(([x, y], i) =>
        `<div class="float choc" style="left:${x}%;top:${y}%;animation-delay:-${i}s;transform:rotate(${i * 25}deg)"><span></span></div>`).join("")}
      <div class="hero-content">
        <h1 class="hero-title">לא סתם גלידה. <span class="latin">DREAMY</span></h1>
        <p class="hero-sub">גלידה שהיא חלום</p>
      </div>
    </section>

    <section class="home-section">
      <div class="container">
        <p class="kicker">לא סתם גלידה. DREAMY</p>
        <p class="lead">העולם שבו חלומות מתוקים הופכים למציאות.<br>גלידות פרימיום בעבודת יד מחומרי הגלם המשובחים בעולם,<br>כדי להעניק לכם רגע של חוויה מושלמת.</p>
        <a href="#shop" class="pill">גלו את הקולקציה</a>
        <div class="cat-strip">
          ${tiles.map((t) => `<a href="#shop/${t.key}" class="cat-tile"><span class="art">${t.art}</span><strong>${t.label}</strong><small>${t.sub}</small></a>`).join("")}
        </div>
      </div>
    </section>

    <section class="home-section">
      <div class="container">
        <h2>האמנות של טעם החלומות</h2>
        <p class="text">אנחנו מאמינים שגלידה היא הרבה יותר מקינוח. היא חוויה. לכן הקמנו את Dreamy, מתוך תשוקה אמיתית לשבור את הגבולות של מה שהכרנו מגלידות.
          כל קופסה יוקרתית נארזת בקפידה, וכל טעם נרקם כיצירת אמנות קולינרית: שמנת אמיתית, פירות טריים ושוקולד משובח.</p>
        <a href="#shop" class="pill">בואו להתרגש מכל כפית</a>
      </div>
    </section>

    <section class="home-section">
      <div class="container">
        <h2>הכי אהובים עכשיו</h2>
        <div class="featured">${top.map(cardHTML).join("")}</div>
      </div>
    </section>

    <section class="home-section">
      <div class="container">
        <h2>החלומות של האנשים</h2>
        <div class="reviews">
          ${REVIEWS.map((r) => `<figure class="review">
            <span class="avatar" aria-hidden="true">${esc(r.who.replace("משפחת ", "").charAt(0))}</span>
            <span class="who">${esc(r.who)}</span>
            <span class="flavor">${esc(r.flavor)}</span>
            <blockquote>${esc(r.text)}</blockquote>
          </figure>`).join("")}
        </div>
      </div>
    </section>`;
}

/* ---------- חנות ---------- */
const filters = { dream: null, group: null, texture: null, sort: null, q: "" };

function shopView(param) {
  if (param !== undefined) {
    Object.assign(filters, { dream: DREAMS.some((d) => d.key === param) ? param : null, group: GROUPS.some((g) => g.key === param) ? param : null, texture: null, q: "" });
  }
  const sideBtn = (list, kind) => list.map((x) =>
    `<li><button type="button" data-${kind}="${x.key}" class="${filters[kind] === x.key ? "is-active" : ""}">${x.label}</button></li>`).join("");
  return `
    <div class="container shop">
      <aside class="sidebar" id="sidebar" aria-label="סינון מוצרים">
        <div class="sidebar-close"><strong>סינון</strong><button type="button" class="close-btn" id="sidebar-close" aria-label="סגירת הסינון"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
        <h3>סנן לפי:</h3>
        <div class="sort-chips">
          <button type="button" class="chip ${filters.sort?.startsWith("price") ? "is-active" : ""}" data-sort="price">מחיר${filters.sort === "price-desc" ? " ↓" : filters.sort === "price-asc" ? " ↑" : ""}</button>
          <button type="button" class="chip ${filters.texture ? "is-active" : ""}" data-sort="texture">מרקם</button>
          <button type="button" class="chip ${filters.sort === "popular" ? "is-active" : ""}" data-sort="popular">פופולארי</button>
        </div>
        <div class="texture-row ${filters.texture || filters.showTexture ? "is-open" : ""}" style="margin:-.6rem 0 1.2rem">
          ${Object.entries(TEXTURES).map(([k, v]) => `<button type="button" class="chip ${filters.texture === k ? "is-active" : ""}" data-texture="${k}">${v}</button>`).join("")}
        </div>
        <h3 class="side-title-accent">על מה אתם חולמים?</h3>
        <ul class="side-list">${sideBtn(DREAMS, "dream")}</ul>
        <h3 class="side-title-accent">טעמים</h3>
        <ul class="side-list">${sideBtn(GROUPS, "group")}</ul>
        <button type="button" class="btn btn-soft btn-sm btn-block" data-clear>ניקוי סינון</button>
      </aside>

      <section>
        <div class="shop-top">
          <div>
            <h1>החלום המתוק</h1>
            <p id="result-count"></p>
          </div>
          <input type="search" class="search" id="search" placeholder="חיפוש טעם…" value="${esc(filters.q)}" aria-label="חיפוש טעם">
        </div>
        <div class="mobile-filter" style="margin-bottom:1rem">
          <button type="button" class="btn btn-soft btn-sm" id="open-filter">סינון ומיון ☰</button>
        </div>
        <div class="grid" id="grid"></div>
      </section>
    </div>`;
}

function filtered() {
  let list = PRODUCTS.filter((x) => {
    const d = filters.dream;
    if (d === "allergen" && !x.allergenFree) return false;
    if (d === "sugarfree" && !x.sugarFree) return false;
    if (d && !["allergen", "sugarfree"].includes(d) && x.type !== d) return false;
    if (filters.group && !x.groups.includes(filters.group)) return false;
    if (filters.texture && x.texture !== filters.texture) return false;
    if (filters.q) {
      const q = filters.q.trim();
      const hay = `${x.name} ${x.short} ${(x.tags || []).join(" ")} ${FLAVORS[x.flavor].en}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });
  const priceOf = (x) => (SIZES[x.type] ? SIZES[x.type][0].price : x.price);
  if (filters.sort === "price-asc") list.sort((a, b) => priceOf(a) - priceOf(b));
  if (filters.sort === "price-desc") list.sort((a, b) => priceOf(b) - priceOf(a));
  if (filters.sort === "popular") list.sort((a, b) => b.likes + (likes[b.id] ? 1 : 0) - (a.likes + (likes[a.id] ? 1 : 0)));
  return list;
}

function renderGrid() {
  const list = filtered();
  const grid = $("#grid");
  grid.innerHTML = list.length
    ? list.map(cardHTML).join("")
    : `<div class="empty"><p>לא מצאנו חלום כזה… נסו לשנות את הסינון.</p><button type="button" class="btn btn-primary btn-sm" data-clear>הצגת כל הטעמים</button></div>`;
  $("#result-count").textContent = `${list.length} מוצרים`;
  hydrateImages(grid);
}

function bindShop() {
  renderGrid();
  const root = $(".shop");
  const sidebar = $("#sidebar");

  root.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.dream) filters.dream = filters.dream === t.dataset.dream ? null : t.dataset.dream;
    else if (t.dataset.group) filters.group = filters.group === t.dataset.group ? null : t.dataset.group;
    else if (t.dataset.texture) filters.texture = filters.texture === t.dataset.texture ? null : t.dataset.texture;
    else if (t.dataset.sort === "price") filters.sort = filters.sort === "price-asc" ? "price-desc" : filters.sort === "price-desc" ? null : "price-asc";
    else if (t.dataset.sort === "popular") filters.sort = filters.sort === "popular" ? null : "popular";
    else if (t.dataset.sort === "texture") { filters.showTexture = !filters.showTexture; if (!filters.showTexture) filters.texture = null; }
    else if (t.hasAttribute("data-clear")) Object.assign(filters, { dream: null, group: null, texture: null, sort: null, q: "", showTexture: false });
    else if (t.id === "open-filter") { sidebar.classList.add("is-open"); return; }
    else if (t.id === "sidebar-close") { sidebar.classList.remove("is-open"); return; }
    else return;

    /* עדכון המצב החזותי של הסרגל בלי לבנות מחדש את כל הדף */
    const open = sidebar.classList.contains("is-open");
    const fresh = new DOMParser().parseFromString(shopView(), "text/html").getElementById("sidebar");
    sidebar.innerHTML = fresh.innerHTML;
    sidebar.classList.toggle("is-open", open);
    if (t.hasAttribute("data-clear")) $("#search").value = "";
    renderGrid();
  });

  $("#search").addEventListener("input", (e) => {
    filters.q = e.target.value;
    renderGrid();
  });
}

/* ---------- עמוד מוצר ---------- */
function productView(id) {
  const prod = byId(id);
  if (!prod) return `<div class="container page-head"><h1>אופס…</h1><p>המוצר לא נמצא.</p><a href="#shop" class="btn btn-primary">חזרה לחנות</a></div>`;
  const f = FLAVORS[prod.flavor];
  const liked = !!likes[prod.id];
  const sizes = SIZES[prod.type];
  const related = PRODUCTS.filter((x) => x.id !== prod.id && (x.type === prod.type || x.flavor === prod.flavor)).slice(0, 4);

  return `
    <div class="container">
      <a href="#shop" class="back-link">→ חזרה לכל הטעמים</a>
      <article class="product">
        <div class="product-info">
          <h1>${esc(prod.name)}</h1>
          <div class="product-tags">
            ${(prod.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}
            <button type="button" class="tag like-btn ${liked ? "is-liked" : ""}" id="like" aria-pressed="${liked}" aria-label="אהבתי">${liked ? "♥" : "♡"} <span>${prod.likes + (liked ? 1 : 0)}</span></button>
          </div>
          <p class="product-desc">${esc(prod.long)}</p>

          ${sizes ? `<div class="option-block"><h3>גודל</h3><div class="option-row" id="sizes">
            ${sizes.map((s, i) => `<button type="button" class="choice ${i === 0 ? "is-active" : ""}" data-size="${s.key}">${s.label} · ${money(s.price)}</button>`).join("")}
          </div></div>` : ""}

          ${prod.pack ? `<div class="option-block"><h3>${prod.pack.mode === "count" ? `בחרו ${prod.pack.max} גביעים (אפשר לחזור על טעם)` : `בחרו ${prod.pack.max} טעמים`}</h3>
            <div class="flavor-pick" id="picks">
              ${PACK_FLAVORS.map((k) => `<button type="button" data-pick="${k}"><span style="display:flex;gap:.4rem;align-items:center"><span class="dot" style="background:${FLAVORS[k].scoop}"></span>${FLAVORS[k].name}</span><span class="n">0</span></button>`).join("")}
            </div>
            <p class="pick-status" id="pick-status"></p>
          </div>` : ""}

          <div class="buy-row">
            <div class="stepper" aria-label="כמות">
              <button type="button" data-q="1" aria-label="הוספה">+</button>
              <output id="qty">1</output>
              <button type="button" data-q="-1" aria-label="הפחתה">−</button>
            </div>
            <span class="info-pill" id="price-pill">${money(sizes ? sizes[0].price : prod.price)}</span>
            ${prod.weight && !sizes ? `<span class="info-pill">${esc(prod.weight)}</span>` : ""}
            <button type="button" class="btn btn-primary" id="buy">הוספה לסל</button>
          </div>

          <div class="nutri">
            <strong>כשרות:</strong> ${(prod.tags || []).includes("פרווה") ? "פרווה" : "חלבי"}
            · <strong>מרקם:</strong> ${TEXTURES[prod.texture]}
            ${prod.allergenFree ? " · <strong>ללא:</strong> אגוזים וגלוטן" : ""}
            ${prod.sugarFree ? " · <strong>ללא תוספת סוכר</strong>" : ""}
          </div>
        </div>
        <div class="product-art" id="product-art" data-img="${prod.id}" aria-label="${esc(prod.name)}">${productArt(prod)}</div>
      </article>

      <section class="related">
        <h2>אולי תחלמו גם על…</h2>
        <div class="grid">${related.map(cardHTML).join("")}</div>
      </section>
    </div>`;
}

function bindProduct(id) {
  const prod = byId(id);
  if (!prod) return;
  const sizes = SIZES[prod.type];
  let qty = 1;
  let size = sizes ? sizes[0].key : null;
  let picks = [];

  const unit = () => (sizes ? sizes.find((s) => s.key === size).price : prod.price);
  const refresh = () => {
    $("#qty").textContent = qty;
    $("#price-pill").textContent = money(unit() * qty);
    if (prod.pack) {
      const max = prod.pack.max;
      $$("#picks [data-pick]").forEach((b) => {
        const n = picks.filter((k) => k === b.dataset.pick).length;
        b.classList.toggle("has", n > 0);
        $(".n", b).textContent = prod.pack.mode === "count" ? n : "✓";
      });
      const left = max - picks.length;
      $("#pick-status").innerHTML = left > 0
        ? `נבחרו ${picks.length} מתוך ${max}. ${picks.length ? `<a data-reset>ניקוי בחירה</a>` : ""}`
        : `הבחירה הושלמה ✓ <a data-reset>ניקוי בחירה</a>`;
      $("#buy").disabled = left > 0;
      $("#buy").style.opacity = left > 0 ? ".55" : "1";
      const art = $("#product-art");
      if (!art.querySelector("img")) art.innerHTML = productArt(prod, picks);
    }
  };

  view.firstElementChild.addEventListener("click", (e) => {
    const t = e.target.closest("button, a[data-reset]");
    if (!t) return;
    if (t.dataset.q) qty = Math.max(1, Math.min(50, qty + Number(t.dataset.q)));
    else if (t.dataset.size) {
      size = t.dataset.size;
      $$("#sizes .choice").forEach((b) => b.classList.toggle("is-active", b === t));
    } else if (t.dataset.pick) {
      const k = t.dataset.pick;
      if (prod.pack.mode === "distinct" && picks.includes(k)) picks = picks.filter((x) => x !== k);
      else if (picks.length < prod.pack.max) picks.push(k);
      else toast(`אפשר לבחור עד ${prod.pack.max}`);
    } else if (t.hasAttribute("data-reset")) picks = [];
    else if (t.id === "like") {
      likes[id] = !likes[id];
      store.set("dreamy-likes", likes);
      t.classList.toggle("is-liked", likes[id]);
      t.setAttribute("aria-pressed", likes[id]);
      t.innerHTML = `${likes[id] ? "♥" : "♡"} <span>${prod.likes + (likes[id] ? 1 : 0)}</span>`;
      return;
    } else if (t.id === "buy") {
      addToCart(prod, { qty, size, picks: [...picks] });
      return;
    } else return;
    refresh();
  });

  refresh();
}

/* ---------- סניפים ---------- */
function branchesView() {
  return `
    <div class="container">
      <header class="page-head">
        <h1>הסניפים שלנו</h1>
        <p>בואו לטעום, לבחור ולהתאהב. כל הסניפים כשרים, ומגישים את כל הטעמים במקום.</p>
      </header>
      <div class="branches">
        ${BRANCHES.map((b) => `<article class="branch">
          <h2>Dreamy ${esc(b.city)}</h2>
          <p>${esc(b.address)}</p>
          <p class="hours">${esc(b.hours)}</p>
          <div class="actions">
            <a class="btn btn-primary btn-sm" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address + " " + b.city)}" target="_blank" rel="noopener">ניווט</a>
            <a class="btn btn-soft btn-sm" href="tel:${CONFIG.phone}">התקשרו</a>
          </div>
        </article>`).join("")}
      </div>
    </div>`;
}

/* ---------- מועדון VIP ---------- */
function vipView() {
  const tiers = [
    { name: "חלום מתוק", color: "linear-gradient(135deg,#e7a9b9,#b4526b)", label: "5%", text: "5% הנחה קבועה על כל הזמנה, ועדכון ראשון על טעמים חדשים." },
    { name: "חלום זהב", color: "linear-gradient(135deg,#e2c08a,#a47a44)", label: "10%", text: "10% הנחה, גביע מתנה ביום ההולדת, ומחיר מיוחד על מארזים למסיבות." },
    { name: "חלום יהלום", color: "linear-gradient(135deg,#b9a3d6,#5a3f7c)", label: "15%", text: "15% הנחה, משלוח חינם תמיד, וגישה מוקדמת למהדורות המוגבלות לפני כולם." }
  ];
  return `
    <div class="container">
      <header class="page-head">
        <h1>מועדון VIP</h1>
        <p>מצטרפים בחינם, צוברים נקודות על כל כפית ומקבלים הטבות שוות במיוחד.</p>
      </header>
      <div class="vip-wrap">
        <div class="tiers">
          ${tiers.map((t) => `<article class="tier"><span class="medal" style="background:${t.color}">${t.label}</span>
            <div><h2>${t.name}</h2><p>${t.text}</p></div></article>`).join("")}
          <article class="tier"><span class="medal" style="background:linear-gradient(135deg,#f3c4c9,#e07a9a)">+1</span>
            <div><h2>איך צוברים?</h2><p>כל 10 ש"ח של קנייה שווים נקודה. ב-50 נקודות עולים לחלום זהב, וב-150 נקודות לחלום יהלום.</p></div></article>
        </div>
        <aside class="vip-form">
          <h2>הצטרפות למועדון</h2>
          <form id="vip" novalidate>
            <input type="text" name="name" placeholder="שם מלא" autocomplete="name" required>
            <input type="tel" name="phone" placeholder="טלפון" autocomplete="tel" inputmode="tel" required>
            <input type="text" name="city" placeholder="עיר">
            <label style="font-size:.85rem;color:var(--muted)">תאריך יום הולדת (לגביע המתנה)
              <input type="date" name="birthday">
            </label>
            <p class="form-error" id="vip-error" role="alert"></p>
            <button type="submit" class="btn btn-primary btn-block">הצטרפות בוואטסאפ</button>
          </form>
        </aside>
      </div>
    </div>`;
}

function bindVip() {
  $("#vip").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    if (!f.name.value.trim() || !/^[\d\-+ ]{9,}$/.test(f.phone.value.trim())) {
      $("#vip-error").textContent = "נא למלא שם וטלפון תקין.";
      return;
    }
    $("#vip-error").textContent = "";
    const msg = ["שלום Dreamy! אני רוצה להצטרף למועדון ה-VIP ✨", `שם: ${f.name.value.trim()}`, `טלפון: ${f.phone.value.trim()}`,
      f.city.value.trim() ? `עיר: ${f.city.value.trim()}` : "", f.birthday.value ? `יום הולדת: ${f.birthday.value}` : ""].filter(Boolean).join("\n");
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  });
}

/* =========================================================
   ניתוב בין העמודים (#home, #shop, #product/..., #branches, #vip)
   ========================================================= */
function route() {
  const [page, param] = (location.hash.replace(/^#/, "") || "home").split("/");
  let html, bind;
  switch (page) {
    case "shop": html = shopView(param ?? ""); bind = bindShop; break;
    case "product": html = productView(param); bind = () => bindProduct(param); break;
    case "branches": html = branchesView(); break;
    case "vip": html = vipView(); bind = bindVip; break;
    default: html = homeView();
  }
  view.innerHTML = html;
  bind?.();
  hydrateImages(view);

  const active = page === "product" ? "shop" : ["shop", "branches", "vip"].includes(page) ? page : "home";
  $$("[data-route]").forEach((a) => {
    const on = a.dataset.route === active;
    a.classList.toggle("is-active", on);
    if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });

  setMenu(false);
  window.scrollTo({ top: 0, behavior: "instant" });
  view.focus({ preventScroll: true });
  const titles = { shop: "החלום המתוק", branches: "סניפים", vip: "מועדון VIP", product: byId(param)?.name };
  document.title = `${titles[page] ? titles[page] + " | " : ""}Dreamy – לא סתם גלידה`;
}

/* תפריט נייד */
const menuBtn = $("#menu-btn");
function setMenu(open) {
  menuBtn.setAttribute("aria-expanded", String(open));
  $("#mobile-nav").classList.toggle("is-open", open);
}
menuBtn.addEventListener("click", () => setMenu(menuBtn.getAttribute("aria-expanded") !== "true"));

/* Esc סוגר סל / סינון / תפריט */
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  closeCart();
  $("#sidebar")?.classList.remove("is-open");
  setMenu(false);
});

/* =========================================================
   הפעלה
   ========================================================= */
function init() {
  $$("[data-phone]").forEach((a) => (a.href = `tel:${CONFIG.phone}`));
  $$('[data-config="phone"]').forEach((el) => (el.textContent = CONFIG.phone));
  $("#year").textContent = new Date().getFullYear();


  window.addEventListener("hashchange", route);
  route();
  renderCart();
}

init();
