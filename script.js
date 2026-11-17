/* =========================================================
   צילום ניובורן – סקריפט ראשי
   ---------------------------------------------------------
   ✎ את כל הפרטים שצריך לעדכן (שם, מייל, סטים) אפשר לשנות כאן
     למעלה, בלי לגעת בשאר הקוד.

   תמונות:
   • images/work-1.jpg, images/work-2.jpg ... – תמונת הכרטיס של כל סט.
   • images/work-1-knit-teddy-pink.jpg – תמונה לשילוב מסוים
     (מספר הסט ואחריו הבחירות לפי סדר הקבוצות, מופרדות במקף).
   כל עוד הקובץ לא קיים, מוצגת המחשה מעוצבת שמתעדכנת לפי הבחירות.
   ========================================================= */

const CONFIG = {
  name: "[שם הצלמת]",
  email: "your@email.com",
  contactSubject: "תיאום צילום ניובורן",
  imageFolder: "images/",
  imageExt: ".jpg"
};

/* ---------- פלטות גוונים ---------- */
const TONES = {
  pink:  { label: "ורוד פודרה", wall: "#f7e4df", wall2: "#f0d4cd", floor: "#ead0c8", main: "#e9b9b3", deep: "#c58886", light: "#fbeeea" },
  cream: { label: "שמנת",       wall: "#f7efe4", wall2: "#efe3d2", floor: "#e7d8c3", main: "#ecdcc4", deep: "#c4a684", light: "#fcf6ee" },
  peach: { label: "אפרסק",      wall: "#faeadf", wall2: "#f3dacb", floor: "#eed3c1", main: "#f2c6ab", deep: "#d0977a", light: "#fdf1e8" },
  mint:  { label: "מנטה עדין",  wall: "#edf2ec", wall2: "#dfe9e0", floor: "#d9e3d8", main: "#cbdfd2", deep: "#8eae9c", light: "#f5f9f5" }
};

const FLOWER_COLORS = {
  pink:  { label: "ורודים", petal: "#eaa9a8", center: "#d78c88" },
  white: { label: "לבנים",  petal: "#fffaf5", center: "#e6c98f" },
  peach: { label: "אפרסק",  petal: "#f3bf9f", center: "#d99a73" }
};

/* ---------- הסטים ---------- */
const SETS = [
  {
    id: 1,
    title: "שמיכה ובלונים",
    short: "פוף רך, שמיכה עוטפת ובלונים בגוונים עדינים.",
    desc: "סט קלאסי ונעים: פוף רך שמכוסה בשמיכה עוטפת, ולידו אלמנט מתוק שמשלים את הסיפור. אפשר לבחור את סוג השמיכה, את האלמנט ואת הגוון של כל הסט.",
    details: ["מתאים לגילאי 5–14 ימים", "כ-3 שעות צילום", "כולל 2 החלפות"],
    tags: ["פוף", "בלונים", "דובון"],
    options: [
      { key: "blanket", label: "סוג השמיכה", choices: [
        { value: "jersey", label: "שמיכת טריקו" },
        { value: "knit",   label: "שמיכה סרוגה" },
        { value: "fur",    label: "פרווה רכה" }
      ]},
      { key: "element", label: "אלמנט מרכזי", choices: [
        { value: "balloons", label: "בלונים" },
        { value: "teddy",    label: "בובת דובון" },
        { value: "moon",     label: "ירח וכוכבים" }
      ]},
      { key: "tone", label: "גוון הסט", tone: true, choices: ["pink", "cream", "peach"] }
    ],
    draw: drawBlanketSet
  },
  {
    id: 2,
    title: "עץ טבעי",
    short: "קערת עץ או ארגז כפרי, פשתן וצמחייה ירוקה.",
    desc: "סט בהשראת הטבע. עץ חם, בדים טבעיים וצמחייה עדינה. סט אדמתי ושקט שמבליט את הפרטים הקטנים.",
    details: ["מתאים לגילאי 5–14 ימים", "בדים טבעיים בלבד", "צמחייה מיובשת"],
    tags: ["עץ", "פשתן", "אקליפטוס"],
    options: [
      { key: "container", label: "בסיס העץ", choices: [
        { value: "bowl",  label: "קערת עץ" },
        { value: "crate", label: "ארגז עץ" }
      ]},
      { key: "wrap", label: "בד עוטף", choices: [
        { value: "linen", label: "פשתן" },
        { value: "knit",  label: "סרוג" }
      ]},
      { key: "accent", label: "קישוט", choices: [
        { value: "leaves",  label: "עלי אקליפטוס" },
        { value: "flowers", label: "פרחים לבנים" }
      ]}
    ],
    draw: drawWoodSet
  },
  {
    id: 3,
    title: "סל נצרים",
    short: "סל קלוע ומרופד, עם קישוט תלוי או זר פרחים.",
    desc: "סל נצרים בעבודת יד עם ריפוד רך במיוחד. הסט מתאים לתמונה עליונה או צדדית ונראה טוב בכל גוון.",
    details: ["מתאים לגילאי 5–21 ימים", "ריפוד נשלף ומכובס", "צילום מלמעלה ומהצד"],
    tags: ["נצרים", "פרווה", "כוכבים"],
    options: [
      { key: "shape", label: "צורת הסל", choices: [
        { value: "round", label: "סל עגול" },
        { value: "boat",  label: "סל סירה" }
      ]},
      { key: "lining", label: "ריפוד", choices: [
        { value: "fur",   label: "פרווה לבנה" },
        { value: "satin", label: "סאטן ורוד" }
      ]},
      { key: "accent", label: "קישוט", choices: [
        { value: "stars",   label: "שרשרת כוכבים" },
        { value: "bouquet", label: "זר פרחים" }
      ]}
    ],
    draw: drawBasketSet
  },
  {
    id: 4,
    title: "ענן חלומות",
    short: "כרית ענן רכה וירח או כוכבים תלויים.",
    desc: "סט חלומי ושקט: כרית בצורת ענן, שמיכה דקה וקישוט תלוי מעל. מתאים במיוחד לתמונות שינה עמוקה.",
    details: ["מתאים לגילאי 5–14 ימים", "תאורה רכה", "גוונים פסטליים"],
    tags: ["ענן", "ירח", "פסטל"],
    options: [
      { key: "tone", label: "גוון הענן", tone: true, choices: ["pink", "cream", "mint"] },
      { key: "hang", label: "קישוט תלוי", choices: [
        { value: "moon",  label: "ירח" },
        { value: "stars", label: "כוכבים" }
      ]},
      { key: "blanket", label: "שמיכה", choices: [
        { value: "knit",   label: "סרוגה" },
        { value: "jersey", label: "טריקו" }
      ]}
    ],
    draw: drawCloudSet
  },
  {
    id: 5,
    title: "קשת פרחים",
    short: "קשת או חישוק זהוב עם פרחים מיובשים.",
    desc: "מסגרת זהובה עדינה עם פרחים מיובשים, ומתחתיה כרית רכה. הסט מתאים מאוד לתמונה בפורמט אנכי לתלייה.",
    details: ["מתאים לגילאי 5–21 ימים", "פרחים מיובשים", "מסגרת בהתאמה אישית"],
    tags: ["פרחים", "קשת", "זהב"],
    options: [
      { key: "frame", label: "מסגרת", choices: [
        { value: "arch", label: "קשת" },
        { value: "hoop", label: "חישוק עגול" }
      ]},
      { key: "flowers", label: "גוון הפרחים", flower: true, choices: ["pink", "white", "peach"] },
      { key: "wrap", label: "כרית", choices: [
        { value: "linen", label: "פשתן" },
        { value: "fur",   label: "פרווה" }
      ]}
    ],
    draw: drawFlowerSet
  },
  {
    id: 6,
    title: "פיקניק קטן",
    short: "מפה, כרית קטנה ואביזר אחד שמשלים את הסיפור.",
    desc: "סט קיצי ומתוק: מפת פיקניק, כרית רכה לתינוק ואביזר אחד לבחירתכן. מתאים במיוחד לאחים גדולים שמצטרפים לחלק מהצילום.",
    details: ["מתאים לגילאי 5–30 ימים", "אפשרות לצילום עם אחים", "אביזרים מתחלפים"],
    tags: ["פיקניק", "משבצות", "קש"],
    options: [
      { key: "cloth", label: "מפה", choices: [
        { value: "gingham", label: "משבצות" },
        { value: "linen",   label: "פשתן חלק" }
      ]},
      { key: "prop", label: "אביזר", choices: [
        { value: "basket", label: "סלסלת פיקניק" },
        { value: "hat",    label: "כובע קש" },
        { value: "vase",   label: "כד ופרחים" }
      ]},
      { key: "tone", label: "גוון", tone: true, choices: ["pink", "peach"] }
    ],
    draw: drawPicnicSet
  }
];

/* =========================================================
   כלי ציור – SVG
   ========================================================= */
let uidCounter = 0;
const uid = (p) => `${p}-${++uidCounter}`;
const f = (n) => Number(n.toFixed(1));

/* דפוסי בד */
function fabric(id, kind, base, deep) {
  switch (kind) {
    case "knit":
      return `<pattern id="${id}" width="18" height="14" patternUnits="userSpaceOnUse">
        <rect width="18" height="14" fill="${base}"/>
        <path d="M0 0L4.5 7L9 0M9 0L13.5 7L18 0M0 7L4.5 14L9 7M9 7L13.5 14L18 7" fill="none" stroke="${deep}" stroke-opacity=".38" stroke-width="1.6" stroke-linecap="round"/>
      </pattern>`;
    case "fur":
      return `<pattern id="${id}" width="12" height="12" patternUnits="userSpaceOnUse">
        <rect width="12" height="12" fill="${base}"/>
        <path d="M1 5q2.5-4 5 0M7 11q2.5-4 5 0" fill="none" stroke="${deep}" stroke-opacity=".3" stroke-width="1.1" stroke-linecap="round"/>
      </pattern>`;
    case "linen":
      return `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse">
        <rect width="6" height="6" fill="${base}"/>
        <path d="M0 3h6M3 0v6" stroke="${deep}" stroke-opacity=".16" stroke-width=".8"/>
      </pattern>`;
    case "gingham":
      return `<pattern id="${id}" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
        <rect width="22" height="22" fill="#fffaf6"/>
        <rect width="11" height="22" fill="${base}" fill-opacity=".7"/>
        <rect width="22" height="11" fill="${base}" fill-opacity=".7"/>
      </pattern>`;
    case "weave":
      return `<pattern id="${id}" width="16" height="12" patternUnits="userSpaceOnUse">
        <rect width="16" height="12" fill="${base}"/>
        <path d="M1 3h6M9 9h6" stroke="${deep}" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>
        <path d="M8 0v6M0 6v6M16 6v6" stroke="${deep}" stroke-opacity=".35" stroke-width="1.4"/>
      </pattern>`;
    case "wood":
      return `<pattern id="${id}" width="44" height="12" patternUnits="userSpaceOnUse">
        <rect width="44" height="12" fill="${base}"/>
        <path d="M0 3q11-2.5 22 0t22 0M0 8.5q11 2 22 0t22 0" fill="none" stroke="${deep}" stroke-opacity=".3" stroke-width=".9"/>
      </pattern>`;
    case "satin":
      return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${base}"/>
        <stop offset=".45" stop-color="#fff" stop-opacity=".9"/>
        <stop offset=".55" stop-color="${base}"/>
        <stop offset="1" stop-color="${deep}"/>
      </linearGradient>`;
    default: /* jersey */
      return `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse">
        <rect width="6" height="6" fill="${base}"/>
        <path d="M3 0v6" stroke="${deep}" stroke-opacity=".22" stroke-width=".9"/>
      </pattern>`;
  }
}

/* מסגרת הסצנה: קיר, רצפה, אור רך וטקסטורת גרעין עדינה */
function scene(u, c, defs, body, label) {
  return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label}">
    <defs>
      <linearGradient id="${u}-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${c.wall}"/><stop offset="1" stop-color="${c.wall2}"/>
      </linearGradient>
      <radialGradient id="${u}-glow" cx=".25" cy=".15" r=".9">
        <stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="${u}-shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".3"/>
        <stop offset=".55" stop-color="#fff" stop-opacity="0"/>
        <stop offset="1" stop-color="#5a3a36" stop-opacity=".14"/>
      </linearGradient>
      <filter id="${u}-soft" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="${u}-grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer><feFuncA type="table" tableValues="0 .09"/></feComponentTransfer>
      </filter>
      ${defs}
    </defs>
    <rect width="400" height="300" fill="url(#${u}-wall)"/>
    <path d="M0 214Q200 204 400 214V300H0Z" fill="${c.floor}"/>
    <rect width="400" height="300" fill="url(#${u}-glow)"/>
    ${body}
    <rect width="400" height="300" filter="url(#${u}-grain)"/>
  </svg>`;
}

const shadow = (u, cx, cy, rx, ry = 10, op = .16) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#5a3a36" opacity="${op}" filter="url(#${u}-soft)"/>`;

function starPoints(x, y, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * .45 : r;
    pts.push(`${f(x + rr * Math.cos(a))},${f(y + rr * Math.sin(a))}`);
  }
  return pts.join(" ");
}

const star = (x, y, r, col) =>
  `<polygon points="${starPoints(x, y, r)}" fill="${col}" stroke="${col}" stroke-width="1.5" stroke-linejoin="round"/>`;

function moon(u, x, y, r, col) {
  const m = `${u}-moon`;
  return `<mask id="${m}"><rect width="400" height="300" fill="#fff"/><circle cx="${x + r * .45}" cy="${y - r * .3}" r="${r * .82}" fill="#000"/></mask>
    <circle cx="${x}" cy="${y}" r="${r}" fill="${col}" mask="url(#${m})"/>`;
}

function hangingMoon(u, x, y, col) {
  return `<path d="M${x - 8} 0V${y - 22}" stroke="#bfa79c" stroke-width="1"/>
    ${moon(u, x, y, 30, col)}
    <path d="M${x - 62} 0V${y - 10}M${x + 52} 0V${y + 18}" stroke="#bfa79c" stroke-width="1"/>
    ${star(x - 62, y - 2, 9, col)}${star(x + 52, y + 26, 7, col)}`;
}

function hangingStars(xs, col) {
  const lens = [70, 110, 55, 95, 75, 120];
  return xs.map((x, i) => {
    const y = lens[i % lens.length];
    return `<path d="M${x} 0V${y - 10}" stroke="#bfa79c" stroke-width="1"/>${star(x, y, 9 + (i % 3) * 2, col)}`;
  }).join("");
}

function starGarland(x1, x2, y, sag, col) {
  const mid = (x1 + x2) / 2;
  let out = `<path d="M${x1} ${y}Q${mid} ${y + sag * 2} ${x2} ${y}" fill="none" stroke="#bfa79c" stroke-width="1.2"/>`;
  for (let i = 1; i < 8; i++) {
    const t = i / 8;
    const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mid + t * t * x2;
    const py = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * (y + sag * 2) + t * t * y;
    out += `<path d="M${f(px)} ${f(py)}v10" stroke="#bfa79c" stroke-width=".8"/>${star(px, py + 17, i % 2 ? 7 : 5.5, col)}`;
  }
  return out;
}

function balloons(x, y, cols) {
  const list = [[x - 30, y - 165, cols[0]], [x + 6, y - 190, cols[1]], [x + 34, y - 152, cols[2]]];
  const strings = list.map(([bx, by]) =>
    `<path d="M${x} ${y}Q${(bx + x) / 2 + 8} ${(by + y) / 2 + 30} ${bx} ${by + 31}" fill="none" stroke="#b9a29b" stroke-width="1"/>`).join("");
  const heads = list.map(([bx, by, col]) =>
    `<ellipse cx="${bx}" cy="${by}" rx="23" ry="28" fill="${col}"/>
     <path d="M${bx - 3.5} ${by + 32}l3.5-5 3.5 5z" fill="${col}"/>
     <ellipse cx="${bx - 8}" cy="${by - 10}" rx="5" ry="9" fill="#fff" opacity=".45" transform="rotate(-22 ${bx - 8} ${by - 10})"/>`).join("");
  return `${strings}${heads}<rect x="${x - 7}" y="${y - 2}" width="14" height="11" rx="3" fill="${cols[2]}"/>`;
}

function teddy(x, y, col, dark, bow) {
  const light = "#f3e3d3";
  return `
    <ellipse cx="${x - 16}" cy="${y - 7}" rx="13" ry="9" fill="${col}"/>
    <ellipse cx="${x + 16}" cy="${y - 7}" rx="13" ry="9" fill="${col}"/>
    <ellipse cx="${x}" cy="${y - 32}" rx="28" ry="31" fill="${col}"/>
    <ellipse cx="${x}" cy="${y - 28}" rx="16" ry="19" fill="${light}" opacity=".55"/>
    <ellipse cx="${x - 27}" cy="${y - 40}" rx="9" ry="17" fill="${col}" transform="rotate(28 ${x - 27} ${y - 40})"/>
    <ellipse cx="${x + 27}" cy="${y - 40}" rx="9" ry="17" fill="${col}" transform="rotate(-28 ${x + 27} ${y - 40})"/>
    <circle cx="${x - 19}" cy="${y - 99}" r="10" fill="${col}"/><circle cx="${x - 19}" cy="${y - 99}" r="5" fill="${light}"/>
    <circle cx="${x + 19}" cy="${y - 99}" r="10" fill="${col}"/><circle cx="${x + 19}" cy="${y - 99}" r="5" fill="${light}"/>
    <circle cx="${x}" cy="${y - 80}" r="26" fill="${col}"/>
    <ellipse cx="${x}" cy="${y - 71}" rx="12" ry="9" fill="${light}"/>
    <ellipse cx="${x}" cy="${y - 74}" rx="4" ry="3" fill="${dark}"/>
    <path d="M${x - 4} ${y - 67}q4 3 8 0" fill="none" stroke="${dark}" stroke-width="1.3" stroke-linecap="round"/>
    <circle cx="${x - 9}" cy="${y - 85}" r="2.4" fill="${dark}"/><circle cx="${x + 9}" cy="${y - 85}" r="2.4" fill="${dark}"/>
    <path d="M${x} ${y - 55}l-14-7v14zM${x} ${y - 55}l14-7v14z" fill="${bow}"/><circle cx="${x}" cy="${y - 55}" r="3.5" fill="${bow}"/>`;
}

function flower(x, y, r, petal, center) {
  let out = "";
  for (let i = 0; i < 5; i++) {
    const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    out += `<circle cx="${f(x + Math.cos(a) * r * .58)}" cy="${f(y + Math.sin(a) * r * .58)}" r="${f(r * .52)}" fill="${petal}" stroke="#d9c2b8" stroke-opacity=".5" stroke-width=".6"/>`;
  }
  return out + `<circle cx="${x}" cy="${y}" r="${f(r * .3)}" fill="${center}"/>`;
}

function sprig(x, y, len, angle, col) {
  let leaves = "";
  for (let i = 1; i <= 5; i++) {
    const ly = y - (len * i) / 6;
    const s = 1 - i * .08;
    leaves += `<ellipse cx="${x - 9 * s}" cy="${ly}" rx="${f(9 * s)}" ry="${f(5.5 * s)}" fill="${col}" transform="rotate(-25 ${x - 9 * s} ${ly})"/>
               <ellipse cx="${x + 9 * s}" cy="${ly - 6}" rx="${f(9 * s)}" ry="${f(5.5 * s)}" fill="${col}" transform="rotate(25 ${x + 9 * s} ${ly - 6})"/>`;
  }
  return `<g transform="rotate(${angle} ${x} ${y})"><path d="M${x} ${y}V${y - len}" stroke="#8a9c84" stroke-width="1.5"/>${leaves}</g>`;
}

function flowerStem(x, y, len, angle, fc) {
  return `<g transform="rotate(${angle} ${x} ${y})">
    <path d="M${x} ${y}V${y - len}" stroke="#8a9c84" stroke-width="1.5"/>
    <ellipse cx="${x - 7}" cy="${y - len * .45}" rx="8" ry="4" fill="#a7b9a0" transform="rotate(-30 ${x - 7} ${y - len * .45})"/>
    ${flower(x, y - len, 12, fc.petal, fc.center)}</g>`;
}

/* תלולית בד – מקום המנוחה של התינוק */
function mound(x, y, w, h, fill, deep) {
  const l = x - w / 2, r = x + w / 2;
  return `<path d="M${l} ${y}Q${l + w * .05} ${y - h} ${x} ${y - h * 1.05}Q${r - w * .05} ${y - h} ${r} ${y}Q${x} ${y + 14} ${l} ${y}Z" fill="${fill}"/>
    <path d="M${l + w * .2} ${y - h * .55}Q${x - w * .1} ${y - h * .8} ${x - w * .05} ${y - h * .1}M${x + w * .15} ${y - h * .75}Q${r - w * .15} ${y - h * .6} ${r - w * .14} ${y - h * .05}" fill="none" stroke="${deep}" stroke-opacity=".28" stroke-width="2" stroke-linecap="round"/>`;
}

/* =========================================================
   הסטים – פונקציות ציור
   ========================================================= */
function drawBlanketSet(s, u) {
  const c = TONES[s.tone];
  const base = s.blanket === "fur" ? "#fdf6f2" : c.main;
  const deep = s.blanket === "fur" ? c.deep : c.deep;
  const pouf = "M50 254Q56 170 185 162Q314 170 320 254Q185 272 50 254Z";
  let el = "";
  if (s.element === "balloons") el = balloons(300, 246, [c.main, "#fff8f3", c.deep]);
  if (s.element === "teddy") el = teddy(330, 262, "#d8b896", "#6b4b3e", c.deep);
  if (s.element === "moon") el = hangingMoon(u, 300, 82, "#e7cd9b");
  const body = `
    ${shadow(u, 185, 260, 140, 12)}
    <path d="${pouf}" fill="url(#${u}-fab)"/>
    <path d="${pouf}" fill="url(#${u}-shade)"/>
    <path d="M90 210Q135 188 150 236M232 192Q275 205 280 248M70 252Q120 240 160 262" fill="none" stroke="${deep}" stroke-opacity=".3" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="185" cy="186" rx="44" ry="13" fill="#fff" opacity=".25"/>
    ${el}`;
  return scene(u, c, fabric(`${u}-fab`, s.blanket, base, deep), body, "סט שמיכה ובלונים");
}

function drawWoodSet(s, u) {
  const c = TONES.cream;
  const wrapBase = s.wrap === "linen" ? "#efe3d1" : "#f3e7dc";
  const wrapDeep = "#b89a78";
  const defs = fabric(`${u}-wood`, "wood", "#c99c6e", "#7d5638") + fabric(`${u}-fab`, s.wrap, wrapBase, wrapDeep);
  let base;
  if (s.container === "bowl") {
    base = `
      ${shadow(u, 200, 258, 112, 11)}
      <path d="M95 182A105 78 0 0 0 305 182Z" fill="url(#${u}-wood)"/>
      <path d="M95 182A105 78 0 0 0 305 182Z" fill="url(#${u}-shade)"/>
      ${mound(200, 186, 196, 46, `url(#${u}-fab)`, wrapDeep)}
      <ellipse cx="200" cy="182" rx="105" ry="9" fill="none" stroke="#a87b52" stroke-width="5"/>
      <path d="M178 183Q186 222 206 232Q222 212 226 183Z" fill="url(#${u}-fab)"/>
      <path d="M178 183Q186 222 206 232Q222 212 226 183Z" fill="url(#${u}-shade)"/>`;
  } else {
    base = `
      ${shadow(u, 200, 260, 120, 11)}
      ${mound(200, 180, 214, 48, `url(#${u}-fab)`, wrapDeep)}
      <rect x="92" y="176" width="216" height="82" rx="4" fill="url(#${u}-wood)"/>
      <rect x="92" y="176" width="216" height="82" rx="4" fill="url(#${u}-shade)"/>
      <path d="M92 203H308M92 230H308" stroke="#7d5638" stroke-opacity=".35" stroke-width="1.5"/>
      <rect x="92" y="176" width="12" height="82" fill="#9c7049"/><rect x="296" y="176" width="12" height="82" fill="#9c7049"/>
      <path d="M150 178Q160 212 182 220Q196 200 198 178Z" fill="url(#${u}-fab)"/>`;
  }
  const fc = FLOWER_COLORS.white;
  const accent = s.accent === "leaves"
    ? sprig(72, 258, 110, -14, "#a3b8a4") + sprig(95, 258, 80, 8, "#b5c6b1") + sprig(330, 258, 105, 14, "#a3b8a4")
    : flowerStem(70, 258, 95, -12, fc) + flowerStem(92, 258, 70, 6, fc) + flowerStem(330, 258, 90, 12, fc) + flowerStem(312, 258, 62, -6, fc);
  return scene(u, c, defs, base + accent, "סט עץ טבעי");
}

function drawBasketSet(s, u) {
  const c = TONES.pink;
  const lining = s.lining === "fur"
    ? fabric(`${u}-fab`, "fur", "#fdf8f4", "#cdb4aa")
    : fabric(`${u}-fab`, "satin", c.main, c.deep);
  const defs = fabric(`${u}-weave`, "weave", "#dbb68c", "#93694a") + lining;
  let basket;
  if (s.shape === "round") {
    basket = `
      ${shadow(u, 200, 260, 112, 11)}
      ${mound(200, 180, 200, 50, `url(#${u}-fab)`, c.deep)}
      <path d="M96 178A104 82 0 0 0 304 178Z" fill="url(#${u}-weave)"/>
      <path d="M96 178A104 82 0 0 0 304 178Z" fill="url(#${u}-shade)"/>
      <ellipse cx="200" cy="178" rx="104" ry="9" fill="none" stroke="#b48a60" stroke-width="7" stroke-dasharray="7 3"/>
      <path d="M230 178Q236 210 258 218Q266 200 268 178Z" fill="url(#${u}-fab)"/>`;
  } else {
    basket = `
      ${shadow(u, 200, 258, 135, 11)}
      <path d="M88 186Q70 120 110 128M312 186Q330 120 290 128" fill="none" stroke="#b48a60" stroke-width="7" stroke-linecap="round" stroke-dasharray="7 3"/>
      ${mound(200, 188, 230, 46, `url(#${u}-fab)`, c.deep)}
      <path d="M72 184Q200 300 328 184Z" fill="url(#${u}-weave)"/>
      <path d="M72 184Q200 300 328 184Z" fill="url(#${u}-shade)"/>
      <path d="M72 184H328" stroke="#b48a60" stroke-width="7" stroke-linecap="round" stroke-dasharray="7 3"/>`;
  }
  let accent;
  if (s.accent === "stars") {
    accent = starGarland(20, 380, 30, 34, "#e3c58f");
  } else {
    const fc = FLOWER_COLORS.pink;
    accent = sprig(318, 236, 70, 30, "#a7b9a0") + flowerStem(322, 238, 64, 20, fc) + flowerStem(328, 240, 52, 40, FLOWER_COLORS.white) + flowerStem(316, 240, 40, 8, fc);
  }
  return scene(u, c, defs, basket + accent, "סט סל נצרים");
}

function drawCloudSet(s, u) {
  const c = TONES[s.tone];
  const cloudCol = c.light;
  const defs = fabric(`${u}-fab`, s.blanket, c.main, c.deep);
  const cloud = `
    ${shadow(u, 200, 258, 130, 11)}
    <g fill="${cloudCol}">
      <circle cx="130" cy="218" r="36"/><circle cx="178" cy="190" r="50"/><circle cx="238" cy="198" r="44"/>
      <circle cx="282" cy="222" r="32"/><rect x="92" y="212" width="220" height="44" rx="22"/>
    </g>
    <path d="M92 240Q200 262 312 240V234Q200 258 92 234Z" fill="${c.deep}" opacity=".12"/>
    <path d="M120 202Q200 176 286 206L278 246Q200 260 128 246Z" fill="url(#${u}-fab)"/>
    <path d="M120 202Q200 176 286 206L278 246Q200 260 128 246Z" fill="url(#${u}-shade)"/>
    <path d="M128 246Q132 266 120 276M278 246Q274 266 288 274" fill="none" stroke="${c.main}" stroke-width="8" stroke-linecap="round"/>`;
  const hang = s.hang === "moon"
    ? hangingMoon(u, 210, 78, "#e7cd9b")
    : hangingStars([70, 130, 175, 235, 285, 335], "#e3c58f");
  return scene(u, c, defs, hang + cloud, "סט ענן חלומות");
}

function drawFlowerSet(s, u) {
  const c = TONES.cream;
  const fc = FLOWER_COLORS[s.flowers];
  const defs = fabric(`${u}-fab`, s.wrap, s.wrap === "fur" ? "#fdf8f4" : "#efe2d0", "#bfa283");
  let frame, spots;
  if (s.frame === "arch") {
    frame = `<path d="M110 250V130A90 90 0 0 1 290 130V250" fill="none" stroke="#d2b07a" stroke-width="5" stroke-linecap="round"/>`;
    spots = [[110, 200, 14], [114, 176, 11], [106, 224, 12], [124, 74, 13], [140, 56, 11], [112, 98, 10], [290, 230, 12], [292, 208, 9]];
  } else {
    frame = `<circle cx="200" cy="136" r="104" fill="none" stroke="#d2b07a" stroke-width="5"/>`;
    spots = [110, 125, 140, 155, 170, 185].map((deg, i) => {
      const a = (deg * Math.PI) / 180;
      return [f(200 + 104 * Math.cos(a)), f(136 + 104 * Math.sin(a)), i % 2 ? 11 : 14];
    });
    spots.push([292, 108, 10], [300, 128, 8]);
  }
  const leaves = spots.map(([x, y], i) =>
    `<ellipse cx="${x + (i % 2 ? 10 : -10)}" cy="${y + 6}" rx="11" ry="5" fill="#a7b9a0" transform="rotate(${i % 2 ? 30 : -30} ${x} ${y})"/>`).join("");
  const blooms = spots.map(([x, y, r]) => flower(x, y, r, fc.petal, fc.center)).join("");
  const cushion = `
    ${shadow(u, 200, 258, 110, 10)}
    <path d="M100 248Q100 214 200 212Q300 214 300 248Q300 264 200 264Q100 264 100 248Z" fill="url(#${u}-fab)"/>
    <path d="M100 248Q100 214 200 212Q300 214 300 248Q300 264 200 264Q100 264 100 248Z" fill="url(#${u}-shade)"/>
    <path d="M140 228Q200 220 260 228" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>`;
  return scene(u, c, defs, frame + leaves + blooms + cushion, "סט קשת פרחים");
}

function drawPicnicSet(s, u) {
  const c = TONES[s.tone];
  const defs = fabric(`${u}-cloth`, s.cloth, s.cloth === "gingham" ? c.main : c.light, c.deep)
    + fabric(`${u}-pil`, "linen", "#fffaf5", "#c9b29f")
    + fabric(`${u}-weave`, "weave", "#dbb68c", "#93694a");
  const cloth = `
    <path d="M40 300L95 222H305L360 300Z" fill="url(#${u}-cloth)"/>
    <path d="M40 300L95 222H305L360 300Z" fill="url(#${u}-shade)"/>
    ${s.cloth === "linen" ? `<path d="M95 222H305" stroke="${c.deep}" stroke-width="2" stroke-dasharray="3 4" opacity=".5"/>` : ""}
    ${shadow(u, 180, 262, 80, 8)}
    <path d="M110 256Q106 230 120 226L240 226Q254 230 250 256Q248 268 236 268L124 268Q112 268 110 256Z" fill="url(#${u}-pil)"/>
    <path d="M110 256Q106 230 120 226L240 226Q254 230 250 256Q248 268 236 268L124 268Q112 268 110 256Z" fill="url(#${u}-shade)"/>
    <path d="M128 236H232" stroke="${c.main}" stroke-width="2" opacity=".8"/>`;
  let prop = "";
  if (s.prop === "basket") {
    prop = `${shadow(u, 306, 250, 42, 7)}
      <path d="M272 205Q306 150 340 205" fill="none" stroke="#b48a60" stroke-width="6" stroke-linecap="round"/>
      <path d="M266 204H346L338 250Q306 256 274 250Z" fill="url(#${u}-weave)"/>
      <path d="M266 204H346L338 250Q306 256 274 250Z" fill="url(#${u}-shade)"/>
      <path d="M270 210Q290 226 306 210Q322 226 342 210" fill="${c.main}" stroke="${c.deep}" stroke-width="1"/>`;
  } else if (s.prop === "hat") {
    prop = `${shadow(u, 306, 252, 52, 7)}
      <ellipse cx="306" cy="242" rx="52" ry="15" fill="#e4c793"/>
      <path d="M276 241Q276 202 306 202Q336 202 336 241Z" fill="#ecd3a3"/>
      <path d="M277 232Q306 240 335 232V240Q306 248 277 240Z" fill="${c.deep}"/>
      <path d="M262 244Q306 256 350 244" fill="none" stroke="#c9a46c" stroke-width="1" stroke-dasharray="3 3"/>
      ${flower(330, 236, 9, c.light, c.deep)}`;
  } else {
    const fc = { petal: c.main, center: c.deep };
    prop = `${shadow(u, 312, 252, 30, 6)}
      ${flowerStem(305, 200, 46, -18, fc)}${flowerStem(314, 200, 58, 4, FLOWER_COLORS.white)}${flowerStem(322, 200, 40, 22, fc)}
      <path d="M296 200H330Q328 214 336 228Q340 252 313 254Q286 252 290 228Q298 214 296 200Z" fill="#f4ede4" stroke="#d9c8b6"/>
      <path d="M292 224Q313 232 334 224" fill="none" stroke="${c.deep}" stroke-width="2" opacity=".5"/>`;
  }
  return scene(u, c, defs, cloth + prop, "סט פיקניק קטן");
}

/* =========================================================
   עזרי מצב ובחירות
   ========================================================= */
const defaultsOf = (set) =>
  Object.fromEntries(set.options.map((o) => [o.key, choiceValue(o.choices[0])]));

const choiceValue = (ch) => (typeof ch === "string" ? ch : ch.value);

function choiceLabel(opt, value) {
  if (opt.tone) return TONES[value].label;
  if (opt.flower) return `פרחים ${FLOWER_COLORS[value].label}`;
  return opt.choices.find((ch) => ch.value === value).label;
}

const selectionList = (set, sel) =>
  set.options.map((o) => ({ label: o.label, value: choiceLabel(o, sel[o.key]) }));

const imagePath = (name) => `${CONFIG.imageFolder}${name}${CONFIG.imageExt}`;

/* בדיקה האם קובץ תמונה קיים (עובד גם בפתיחה ישירה מהמחשב) */
const imageCache = new Map();
function imageExists(src) {
  if (!imageCache.has(src)) {
    imageCache.set(src, new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    }));
  }
  return imageCache.get(src);
}

function makeImg(src, alt) {
  const img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  img.loading = "lazy";
  img.decoding = "async";
  return img;
}

function mailto(subject, body = "") {
  let link = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}`;
  if (body) link += `&body=${encodeURIComponent(body)}`;
  return link;
}

/* =========================================================
   בניית הדף
   ========================================================= */
function applyConfig() {
  document.querySelectorAll("[data-config]").forEach((el) => {
    const v = CONFIG[el.dataset.config];
    if (v) el.textContent = v;
  });
  document.title = document.title.replace("[שם הצלמת]", CONFIG.name);
  const greeting = "שלום,\nאשמח לשמוע פרטים על צילום ניובורן.\n\nתאריך לידה משוער / תאריך לידה:\n";
  document.querySelectorAll("[data-mailto]").forEach((a) => {
    a.href = mailto(CONFIG.contactSubject, greeting);
  });
  document.getElementById("year").textContent = new Date().getFullYear();
}

function buildGallery() {
  const grid = document.getElementById("gallery-grid");
  const frag = document.createDocumentFragment();

  SETS.forEach((set) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "work-card";
    card.setAttribute("aria-haspopup", "dialog");
    card.setAttribute("aria-label", `${set.title} – פתיחה והתאמה אישית`);

    const media = document.createElement("div");
    media.className = "card-media";
    media.innerHTML = set.draw(defaultsOf(set), uid(`c${set.id}`)) + `<span class="card-hint">לצפייה והתאמה ←</span>`;

    const src = imagePath(`work-${set.id}`);
    imageExists(src).then((ok) => {
      if (ok) media.replaceChild(makeImg(src, set.title), media.querySelector("svg"));
    });

    const body = document.createElement("div");
    body.className = "card-body";
    body.innerHTML = `<h3>${set.title}</h3><p>${set.short}</p>
      <div class="card-tags">${set.tags.map((t) => `<span>${t}</span>`).join("")}</div>`;

    card.append(media, body);
    card.addEventListener("click", () => openModal(set, card));
    frag.append(card);
  });

  grid.append(frag);
  revealOnScroll(grid.querySelectorAll(".work-card"));
}

function buildHero() {
  const set = SETS[3]; /* ענן חלומות – קומפוזיציה מרכזית שמתאימה למסגרת הקשת */
  document.getElementById("hero-art").innerHTML = set.draw(defaultsOf(set), uid("hero"));
}

function revealOnScroll(items) {
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const i = [...items].indexOf(e.target);
        e.target.style.transitionDelay = `${(i % 3) * 90}ms`;
        e.target.classList.add("is-visible");
        e.target.addEventListener("transitionend", () => (e.target.style.transitionDelay = ""), { once: true });
        io.unobserve(e.target);
      }
    });
  }, { threshold: .15 });
  items.forEach((el) => io.observe(el));
}

/* =========================================================
   חלונית מוגדלת + מנגנון ההתאמה
   ========================================================= */
const modal = document.getElementById("modal");
const ui = {
  visual: document.getElementById("modal-visual"),
  badge: document.getElementById("modal-badge"),
  eyebrow: document.getElementById("modal-eyebrow"),
  title: document.getElementById("modal-title"),
  desc: document.getElementById("modal-desc"),
  details: document.getElementById("modal-details"),
  groups: document.getElementById("customizer-groups"),
  selection: document.getElementById("selection-text"),
  cta: document.getElementById("modal-cta"),
  reset: document.getElementById("modal-reset")
};

const state = { set: null, sel: null, opener: null, renderToken: 0 };

function openModal(set, opener) {
  state.set = set;
  state.sel = defaultsOf(set);
  state.opener = opener;

  ui.eyebrow.textContent = `סט מס' ${set.id}`;
  ui.title.textContent = set.title;
  ui.desc.textContent = set.desc;
  ui.details.innerHTML = set.details.map((d) => `<li>${d}</li>`).join("");
  buildCustomizer(set);
  update(false);

  modal.hidden = false;
  modal.classList.remove("is-closing");
  document.body.classList.add("no-scroll");
  modal.querySelector(".modal-body").scrollTop = 0;
  modal.querySelector(".modal-close").focus();
}

function closeModal() {
  if (modal.hidden || modal.classList.contains("is-closing")) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const done = () => {
    modal.hidden = true;
    modal.classList.remove("is-closing");
    document.body.classList.remove("no-scroll");
    state.opener?.focus();
  };
  if (reduce) return done();
  modal.classList.add("is-closing");
  setTimeout(done, 240);
}

function buildCustomizer(set) {
  ui.groups.innerHTML = set.options.map((opt) => {
    const chips = opt.choices.map((ch) => {
      const value = choiceValue(ch);
      let swatch = "";
      if (opt.tone) swatch = `<i class="swatch" style="background:${TONES[value].main}"></i>`;
      if (opt.flower) swatch = `<i class="swatch" style="background:${FLOWER_COLORS[value].petal}"></i>`;
      const label = opt.tone ? TONES[value].label : opt.flower ? FLOWER_COLORS[value].label : ch.label;
      return `<label class="chip">
          <input type="radio" name="opt-${opt.key}" value="${value}" ${state.sel[opt.key] === value ? "checked" : ""}>
          <span>${swatch}${label}</span>
        </label>`;
    }).join("");
    return `<fieldset class="option-group"><legend>${opt.label}</legend><div class="option-choices">${chips}</div></fieldset>`;
  }).join("");
}

ui.groups.addEventListener("change", (e) => {
  const input = e.target;
  if (input.type !== "radio") return;
  state.sel[input.name.replace("opt-", "")] = input.value;
  update(true);
});

ui.reset.addEventListener("click", () => {
  state.sel = defaultsOf(state.set);
  buildCustomizer(state.set);
  update(true);
});

/* עדכון התצוגה בזמן אמת */
function update(animate) {
  const { set, sel } = state;
  const token = ++state.renderToken;
  const list = selectionList(set, sel);

  ui.selection.textContent = list.map((x) => x.value).join(" · ");
  renderVisual(set.draw(sel, uid(`m${set.id}`)), animate);
  ui.badge.textContent = `המחשת הסט לפי הבחירות שלך: ${list.map((x) => x.value).join(", ")}`;

  const body = `שלום,\nאהבתי את הסט "${set.title}" ואשמח לתאם צילום.\n\nהבחירות שלי:\n`
    + list.map((x) => `• ${x.label}: ${x.value}`).join("\n")
    + "\n\nתאריך לידה משוער / תאריך לידה:\n";
  ui.cta.href = mailto(`בקשה לסט: ${set.title}`, body);

  /* תמונה אמיתית: קודם לשילוב המדויק, ואם זו בחירת ברירת המחדל – תמונת הכרטיס */
  const isDefault = Object.entries(defaultsOf(set)).every(([k, v]) => sel[k] === v);
  const variant = imagePath(`work-${set.id}-${set.options.map((o) => sel[o.key]).join("-")}`);
  const candidates = [variant, ...(isDefault ? [imagePath(`work-${set.id}`)] : [])];

  (async () => {
    for (const src of candidates) {
      if (await imageExists(src)) {
        if (token !== state.renderToken) return;
        renderVisual(makeImg(src, `${set.title}: ${ui.selection.textContent}`), false);
        ui.badge.textContent = `צילום מתוך הסט: ${list.map((x) => x.value).join(", ")}`;
        return;
      }
    }
  })();
}

function renderVisual(content, animate) {
  if (typeof content === "string") ui.visual.innerHTML = content;
  else ui.visual.replaceChildren(content);
  if (animate) {
    ui.visual.classList.remove("is-updating");
    void ui.visual.offsetWidth;
    ui.visual.classList.add("is-updating");
  }
}

/* סגירה: כפתור, רקע, Esc + שמירת פוקוס בתוך החלונית */
modal.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (modal.hidden) return;
  if (e.key === "Escape") {
    e.preventDefault();
    closeModal();
    return;
  }
  if (e.key === "Tab") {
    const focusables = [...modal.querySelectorAll("button, a[href], input:checked, input:not([type=radio])")]
      .filter((el) => !el.disabled && el.offsetParent !== null);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* =========================================================
   תפריט עליון
   ========================================================= */
function initHeader() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 20);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "סגירת תפריט" : "פתיחת תפריט");
    nav.classList.toggle("is-open", open);
    header.classList.toggle("menu-open", open);
  };

  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  window.addEventListener("resize", () => { if (window.innerWidth > 760) setMenu(false); });
}

/* ---------- הפעלה ---------- */
applyConfig();
buildHero();
buildGallery();
initHeader();
