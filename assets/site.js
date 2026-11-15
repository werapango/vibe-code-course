// เมนู + ปุ่มคัดลอก + ก่อนหน้า/ถัดไป — ใช้ร่วมทุกหน้า
// แต่ละหน้าระบุตัวเองด้วย <body data-page="ชื่อไฟล์.html">

const PAGES = [
  { group: "เริ่มต้น", items: [
    ["index.html", "ภาพรวม"],
    ["setup.html", "เตรียมเครื่อง & บัญชี"],
    ["schedule.html", "ตารางเวลา"],
  ]},
  { group: "เช้า", items: [
    ["theory-1-sdlc.html", "ทฤษฎี 1"],
    ["lab-1.html", "Lab 1"],
    ["theory-2-requirements.html", "ทฤษฎี 2"],
    ["lab-2.html", "Lab 2"],
    ["brief.html", "โจทย์"],
  ]},
  { group: "บ่าย", items: [
    ["baseline.html", "Baseline"],
    ["theory-3-agent-skill.html", "ทฤษฎี 3"],
    ["lab-3.html", "Lab 3"],
    ["theory-4-verify-release.html", "ทฤษฎี 4"],
    ["lab-4.html", "Lab 4"],
  ]},
  { group: "อ้างอิง", items: [
    ["templates.html", "Templates"],
    ["commands.html", "คำสั่ง"],
  ]},
];

// ลำดับการอ่าน (ใช้ทำปุ่มก่อนหน้า/ถัดไป) = ตามตารางสอนจริง
const READING_ORDER = [
  "index.html", "setup.html", "schedule.html",
  "theory-1-sdlc.html", "lab-1.html",
  "theory-2-requirements.html", "lab-2.html", "brief.html",
  "baseline.html", "theory-3-agent-skill.html", "lab-3.html",
  "theory-4-verify-release.html", "lab-4.html",
  "templates.html", "commands.html",
];

const titleOf = (file) => {
  for (const g of PAGES) for (const [f, t] of g.items) if (f === file) return t;
  return file;
};

function buildHeader(current) {
  const header = document.createElement("header");
  header.className = "site-header";
  const groups = PAGES.map((g) => `
    <div class="group"><span class="group-label">${g.group}</span>
      ${g.items.map(([f, t]) => `<a href="${f}"${f === current ? ' aria-current="page"' : ""}>${t}</a>`).join("")}
    </div>`).join("");
  header.innerHTML = `
    <div class="bar">
      <a class="brand" href="index.html">Vibe Coding <span>×</span> SDLC</a>
      <button class="nav-toggle" aria-label="เมนู">☰ เมนู</button>
      <nav id="site-nav">${groups}</nav>
      <button class="theme-btn" title="สลับโหมดสว่าง/มืด">◐</button>
    </div>`;
  document.body.prepend(header);
  header.querySelector(".nav-toggle").addEventListener("click", () =>
    header.querySelector("#site-nav").classList.toggle("open"));
  header.querySelector(".theme-btn").addEventListener("click", () => {
    const root = document.documentElement;
    const dark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch {}
  });
}

function buildPager(current) {
  const i = READING_ORDER.indexOf(current);
  if (i < 0) return;
  const prev = READING_ORDER[i - 1], next = READING_ORDER[i + 1];
  const nav = document.createElement("nav");
  nav.className = "pager";
  nav.innerHTML =
    (prev ? `<a class="prev" href="${prev}"><small>← ก่อนหน้า</small>${titleOf(prev)}</a>` : "") +
    (next ? `<a class="next" href="${next}"><small>ถัดไป →</small>${titleOf(next)}</a>` : "");
  document.querySelector("main")?.appendChild(nav);
}

function addCopyButtons() {
  document.querySelectorAll("pre").forEach((pre) => {
    if (pre.dataset.nocopy !== undefined) return;
    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.type = "button";
    btn.textContent = "คัดลอก";
    btn.addEventListener("click", async () => {
      const text = pre.querySelector("code")?.innerText ?? pre.innerText;
      try {
        await navigator.clipboard.writeText(text.replace(/\n$/, ""));
        btn.textContent = "คัดลอกแล้ว ✓";
      } catch { btn.textContent = "คัดลอกไม่ได้"; }
      setTimeout(() => (btn.textContent = "คัดลอก"), 1500);
    });
    pre.appendChild(btn);
  });
}

try {
  const saved = localStorage.getItem("theme");
  if (saved) document.documentElement.dataset.theme = saved;
} catch {}

document.addEventListener("DOMContentLoaded", () => {
  const current = document.body.dataset.page || location.pathname.split("/").pop() || "index.html";
  buildHeader(current);
  buildPager(current);
  addCopyButtons();
});
