// แปลงทุกหน้าเป็นรูปแบบ Codelab — ใช้ร่วมทุกหน้า
// แต่ละหน้าระบุตัวเองด้วย <body data-page="ชื่อไฟล์.html">
// เนื้อหาใน <main> ถูกแบ่งเป็น "ขั้นตอน" ตามหัวข้อ <h2> (ส่วนก่อน <h2> แรก = ขั้นตอนภาพรวม)

const COURSE = "Vibe Coding × SDLC";

const PAGES = [
  { group: "เริ่มต้น", items: [
    ["index.html", "ภาพรวมหลักสูตร"],
    ["setup.html", "เตรียมเครื่อง & บัญชี"],
    ["schedule.html", "ตารางเวลา"],
  ]},
  { group: "เช้า", items: [
    ["theory-1-sdlc.html", "ทฤษฎี 1 · Vibe coding กับ SDLC"],
    ["cloudflare.html", "Cloudflare ที่ใช้วันนี้"],
    ["lab-1.html", "Lab 1 · Warm-up + Starter"],
    ["theory-2-requirements.html", "ทฤษฎี 2 · Requirements & Design"],
    ["lab-2.html", "Lab 2 · SRS + Design"],
    ["brief.html", "โจทย์จากผู้ใช้"],
  ]},
  { group: "บ่าย", items: [
    ["baseline.html", "Spec Review + Baseline"],
    ["theory-3-agent-skill.html", "ทฤษฎี 3 · WBS, Agent & Skill"],
    ["lab-3.html", "Lab 3 · สร้าง MVP"],
    ["theory-4-verify-release.html", "ทฤษฎี 4 · Verify & Release"],
    ["lab-4.html", "Lab 4 · ตรวจรับ"],
  ]},
  { group: "อ้างอิง", items: [
    ["lab-install.html", "ติดตั้งห้อง Lab"],
    ["templates.html", "Templates"],
    ["commands.html", "คำสั่ง"],
  ]},
];

// ลำดับการอ่าน (ปุ่มถัดไปข้ามหน้า) = ตามตารางสอนจริง
const READING_ORDER = [
  "index.html", "setup.html", "schedule.html",
  "theory-1-sdlc.html", "cloudflare.html", "lab-1.html",
  "theory-2-requirements.html", "lab-2.html", "brief.html",
  "baseline.html", "theory-3-agent-skill.html", "lab-3.html",
  "theory-4-verify-release.html", "lab-4.html",
  "lab-install.html", "templates.html", "commands.html",
];

const titleOf = (file) => {
  for (const g of PAGES) for (const [f, t] of g.items) if (f === file) return t;
  return file;
};
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ── 1. แบ่งเนื้อหาเป็นขั้นตอน ──
function buildSections(main) {
  const sections = [];
  let cur = null;
  const start = (title) => {
    cur = document.createElement("section");
    cur.className = "cpage";
    cur.dataset.title = title;
    sections.push(cur);
  };
  const h1 = main.querySelector("h1");
  start("ภาพรวม");
  for (const node of Array.from(main.childNodes)) {
    if (node.nodeType === 1 && node.tagName === "H2") {
      if (sections.length === 1 && !cur.textContent.trim()) sections.pop(); // ไม่มีส่วนนำ
      start(node.textContent.replace(/\s+/g, " ").trim());
    }
    cur.appendChild(node);
  }
  if (h1 && sections[0].contains(h1)) sections[0].dataset.title = "ภาพรวม";
  sections.forEach((s, i) => {
    const chip = document.createElement("div");
    chip.className = "step-chip";
    chip.textContent = `ขั้นตอนที่ ${i + 1} · ${sections.length}`;
    s.prepend(chip);
    main.appendChild(s);
  });
  return sections;
}

// ── 2. โครงหน้า: toolbar · drawer · ปุ่มด้านล่าง ──
function buildShell(current, sections) {
  const main = document.querySelector("main");
  const toolbar = document.createElement("header");
  toolbar.id = "main-toolbar";
  toolbar.innerHTML = `
    <button class="menu-btn" id="btnToc" aria-label="เปิดรายการขั้นตอน">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/></svg>
    </button>
    <h3 class="title"><a href="index.html" class="course">${COURSE}</a><span class="course"> · </span>${esc(titleOf(current))}</h3>
    <div class="spacer"></div>
    <div class="pgnum" id="pgnum"></div>`;

  const steps = sections.map((s, i) =>
    `<a class="toc-item" data-page="${i}"><i>${i + 1}</i><span>${esc(s.dataset.title)}</span></a>`).join("");
  const pages = PAGES.map((g) => `<div class="g">${g.group}</div>` +
    g.items.map(([f, t]) => `<a href="${f}"${f === current ? ' aria-current="page"' : ""}>${esc(t)}</a>`).join("")).join("");
  const nav = document.createElement("nav");
  nav.className = "steps";
  nav.innerHTML = `
    <div class="drawer-head">ขั้นตอน</div>
    <div class="toc-scroll"><div class="toc-list">${steps}</div></div>
    <details class="course-nav"><summary>📚 ทุกหน้าของหลักสูตร</summary><div class="pages">${pages}</div></details>`;

  const overlay = document.createElement("div");
  overlay.className = "sidebar-overlay";

  const wrap = document.createElement("div");
  wrap.className = "app";
  const mainWrap = document.createElement("div");
  mainWrap.className = "cl-main";
  main.replaceWith(wrap);
  mainWrap.appendChild(main);
  wrap.append(nav, mainWrap);

  const controls = document.createElement("div");
  controls.id = "controls";
  controls.innerHTML = `<a class="navbutton prevbutton" id="navPrev" href="#"></a><a class="navbutton nextbutton" id="navNext" href="#"></a>`;

  document.body.prepend(toolbar, overlay);
  document.body.appendChild(controls);
  return { overlay };
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

document.addEventListener("DOMContentLoaded", () => {
  const current = document.body.dataset.page || location.pathname.split("/").pop() || "index.html";
  const main = document.querySelector("main");
  if (!main) return;
  addCopyButtons();
  const sections = buildSections(main);
  const { overlay } = buildShell(current, sections);
  const links = Array.from(document.querySelectorAll(".toc-item"));
  const prevBtn = document.getElementById("navPrev");
  const nextBtn = document.getElementById("navNext");
  const i = READING_ORDER.indexOf(current);
  const prevPage = i > 0 ? READING_ORDER[i - 1] : null;
  const nextPage = i >= 0 && i < READING_ORDER.length - 1 ? READING_ORDER[i + 1] : null;
  let cur = 0;

  function show(n, opts = {}) {
    n = Math.max(0, Math.min(sections.length - 1, n));
    sections.forEach((s, k) => s.classList.toggle("active", k === n));
    links.forEach((a, k) => { a.classList.toggle("active", k === n); a.classList.toggle("done", k < n); });
    cur = n;
    document.getElementById("pgnum").textContent = `ขั้นตอนที่ ${n + 1} / ${sections.length}`;

    // ปุ่มย้อน: ขั้นแรก → หน้าก่อนหน้าของหลักสูตร
    prevBtn.classList.remove("is-hidden");
    if (n > 0) { prevBtn.textContent = "ย้อนกลับ"; prevBtn.href = "#" + n; prevBtn.dataset.step = n - 1; }
    else if (prevPage) { prevBtn.textContent = "‹ " + titleOf(prevPage); prevBtn.href = prevPage; delete prevBtn.dataset.step; }
    else prevBtn.classList.add("is-hidden");

    // ปุ่มถัดไป: ขั้นสุดท้าย → หน้าถัดไปของหลักสูตร
    nextBtn.classList.remove("donebutton");
    if (n < sections.length - 1) { nextBtn.textContent = "ถัดไป"; nextBtn.href = "#" + (n + 2); nextBtn.dataset.step = n + 1; }
    else if (nextPage) { nextBtn.textContent = "ถัดไป: " + titleOf(nextPage) + " ›"; nextBtn.href = nextPage; delete nextBtn.dataset.step; }
    else { nextBtn.textContent = "เสร็จสิ้น"; nextBtn.removeAttribute("href"); nextBtn.classList.add("donebutton"); delete nextBtn.dataset.step; }

    if (opts.hash !== false) history.replaceState(null, "", "#" + (opts.anchor || n + 1));
    if (opts.target) {
      opts.target.scrollIntoView({ block: "start" });
      window.scrollBy(0, -80);
      opts.target.classList.add("flash");
      setTimeout(() => opts.target.classList.remove("flash"), 1700);
    } else window.scrollTo(0, 0);
  }

  // ไปยัง #id (เช่น lab-1.html#b) หรือ #เลขขั้นตอน
  function goHash(hash) {
    const h = decodeURIComponent((hash || "").replace(/^#/, ""));
    if (!h) return show(0, { hash: false });
    if (/^\d+$/.test(h)) return show(parseInt(h, 10) - 1, { hash: false });
    const el = document.getElementById(h);
    const k = el ? sections.findIndex((s) => s.contains(el)) : -1;
    if (k < 0) return show(0, { hash: false });
    const isHead = sections[k].querySelector("h2") === el;
    show(k, { anchor: h, target: isHead ? null : el });
  }

  for (const btn of [prevBtn, nextBtn]) btn.addEventListener("click", (e) => {
    if (btn.dataset.step === undefined) return; // ลิงก์ข้ามหน้า
    e.preventDefault();
    show(parseInt(btn.dataset.step, 10));
  });
  links.forEach((a) => a.addEventListener("click", () => {
    show(parseInt(a.dataset.page, 10));
    document.body.classList.remove("sidebar-open");
  }));
  document.getElementById("btnToc").addEventListener("click", () => document.body.classList.toggle("sidebar-open"));
  overlay.addEventListener("click", () => document.body.classList.remove("sidebar-open"));

  // ลิงก์ในหน้าเดียวกัน (#x หรือ หน้านี้.html#x) → สลับขั้นตอน
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || a.closest("#controls") || a.classList.contains("toc-item")) return;
    const href = a.getAttribute("href");
    const m = href.match(/^([^#]*)#(.+)$/);
    if (!m || (m[1] && m[1] !== current)) return;
    e.preventDefault();
    goHash("#" + m[2]);
    document.body.classList.remove("sidebar-open");
  });

  document.addEventListener("keydown", (e) => {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "ArrowRight" && cur < sections.length - 1) show(cur + 1);
    if (e.key === "ArrowLeft" && cur > 0) show(cur - 1);
    if (e.key === "Escape") document.body.classList.remove("sidebar-open");
  });
  window.addEventListener("hashchange", () => goHash(location.hash));

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  goHash(location.hash);
  // เบราว์เซอร์อาจเลื่อนไปที่ anchor เองหลังโหลดเสร็จ → จัดตำแหน่งซ้ำ
  window.addEventListener("load", () => goHash(location.hash));
});
