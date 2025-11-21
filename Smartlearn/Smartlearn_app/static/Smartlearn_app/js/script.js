/* ===================== THEMES ===================== */
const themes = [
  { 
    id: 'magic-glow', 
    name: 'Magic Glow ✨',
    apply: () => { 
      setVars({
        bg: '#2a1744',
        panel: 'rgba(255,255,255,0.08)',
        text: '#f8fafc',
        muted: '#e9d5ff',
        accent: '#f5d76e',
        accent2: '#f472b6',
        ring: 'rgba(245,215,110,0.35)'
      }); 
      document.getElementById('main').classList.add('magic-bg');
      spawnSparkles(document.getElementById('main'), 50);
    },
    cleanup: () => { 
      document.getElementById('main').classList.remove('magic-bg'); 
      document.querySelectorAll('#main .sparkle').forEach(e => e.remove());
    }
  },
  { 
    id: 'focus-blue', 
    name: 'Focus Blue', 
    apply: () => setVars({
      bg: '#0b1220',
      panel: '#0f172a',
      text: '#e5e7eb',
      muted: '#9ca3af',
      accent: '#60a5fa',
      accent2: '#a78bfa',
      ring: 'rgba(96,165,250,0.18)'
    }) 
  }
];

function setVars({ bg, panel, text, muted, accent, accent2, ring }) {
  const r = document.documentElement;
  if (bg) r.style.setProperty('--bg', bg);
  if (panel) r.style.setProperty('--panel', panel);
  if (text) r.style.setProperty('--text', text);
  if (muted) r.style.setProperty('--muted', muted);
  if (accent) r.style.setProperty('--accent', accent);
  if (accent2) r.style.setProperty('--accent-2', accent2);
  if (ring) r.style.setProperty('--ring', ring);
  document.getElementById('app').style.background = bg || getComputedStyle(r).getPropertyValue('--bg');
}

let currentThemeIdx = -1;
function applyTheme(idx) {
  if (currentThemeIdx >= 0 && typeof themes[currentThemeIdx].cleanup === 'function') 
    themes[currentThemeIdx].cleanup();
  currentThemeIdx = idx;
  themes[idx].apply();
  document.getElementById('themeBadge').textContent = themes[idx].name;
  document.getElementById('currentThemeName').textContent = `Current: ${themes[idx].name}`;
}

function spawnSparkles(container = document.body, count = 30) {
  container.querySelectorAll('.sparkle').forEach(el => el.remove());
  const rect = container.getBoundingClientRect();
  const width = rect.width || window.innerWidth;
  const height = rect.height || window.innerHeight;

  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'sparkle';
    s.style.left = (Math.random() * width) + 'px';
    s.style.top = (Math.random() * height) + 'px';
    s.style.animationDelay = (Math.random() * 6).toFixed(2) + 's';
    s.style.opacity = (0.4 + Math.random() * 0.8).toFixed(2);
    container.appendChild(s);
  }
}

/* ===================== DEMO CONTENT ===================== */
const demoFlashcards = [
  { q: "Newton's First Law", a: "An object remains at rest or in uniform motion unless acted on by a net external force." },
  { q: "Ohm's Law", a: "V = I × R" },
  { q: "Photosynthesis", a: "Plants convert light energy into chemical energy." }
];

const demoMCQs = [
  { q: "Which data structure works on FIFO?", opts: ["Stack", "Queue", "Tree", "Graph"], ans: 1 },
  { q: "SI unit of Force?", opts: ["Newton", "Joule", "Watt", "Pascal"], ans: 0 },
  { q: "Which planet is the Red Planet?", opts: ["Venus", "Jupiter", "Mars", "Mercury"], ans: 2 }
];

const demoKeywords = [
  { k: "Algorithm", d: "Step-by-step procedure to solve a problem." },
  { k: "Complexity", d: "Measure of time/space resources." },
  { k: "Derivative", d: "Rate of change of a function." },
  { k: "Ecosystem", d: "Community of organisms and environment." }
];

/* ===================== RENDER FUNCTIONS ===================== */
function renderFlashcards() {
  const grid = document.getElementById('flashcardGrid');
  if (!grid) return;
  grid.innerHTML = '';
  demoFlashcards.forEach(fc => {
    const wrap = document.createElement('div');
    wrap.className = 'flip card rounded-2xl p-3 flashcard';
    wrap.innerHTML = `
      <div class="flip-inner">
        <div class="face front flex-col">
          <div class="text-sm text-[var(--muted)] mb-2">Question</div>
          <div class="text-center font-medium">${fc.q}</div>
        </div>
        <div class="face back flex-col">
          <div class="text-sm text-[var(--muted)] mb-2">Answer</div>
          <div class="text-center">${fc.a}</div>
        </div>
      </div>`;
    grid.appendChild(wrap);
  });
}

let mcqIdx = 0, mcqScore = 0;
function renderMCQ() {
  const c = document.getElementById('mcqContainer'); 
  if (!c) return;
  const item = demoMCQs[mcqIdx % demoMCQs.length];
  c.innerHTML = '';

  const q = document.createElement('div');
  q.className = 'text-lg font-medium mb-2';
  q.textContent = item.q;
  c.appendChild(q);

  const list = document.createElement('div');
  list.className = 'grid md:grid-cols-2 gap-2';

  item.opts.forEach((opt, i) => {
    const b = document.createElement('button');
    b.className = 'px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-left bg-transparent mcq-option';
    b.textContent = opt;
    list.appendChild(b);
  });

  c.appendChild(list);
}

function renderKeywords() {
  const list = document.getElementById('kwList'); 
  if (!list) return; 
  list.innerHTML = '';
  demoKeywords.forEach(({ k, d }) => {
    const card = document.createElement('div'); 
    card.className = 'rounded-xl border border-white/10 p-3 bg-black/10';
    card.innerHTML = `<div class="font-medium mb-1">${k}</div><div class="text-sm text-[var(--muted)]">${d}</div>`;
    list.appendChild(card);
  });
}

function renderTest() {
  const area = document.getElementById('testArea'); 
  if (!area) return; 
  area.innerHTML = '';
  demoMCQs.forEach((it, idx) => {
    const sec = document.createElement('div'); 
    sec.className = 'rounded-xl border border-white/10 p-3 bg-black/10';

    const q = document.createElement('div'); 
    q.className = 'font-medium mb-2'; 
    q.textContent = (idx + 1) + '. ' + it.q; 
    sec.appendChild(q);

    const list = document.createElement('div'); 
    list.className = 'grid md:grid-cols-2 gap-2';

    it.opts.forEach((opt, i) => {
      const label = document.createElement('label'); 
      label.className = 'flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5 cursor-pointer';
      const input = document.createElement('input'); 
      input.type = 'radio'; input.name = 'q' + idx; input.value = i; input.className = 'accent-[var(--accent)]';
      const span = document.createElement('span'); 
      span.textContent = opt;
      label.appendChild(input); label.appendChild(span); list.appendChild(label);
    });

    sec.appendChild(list); area.appendChild(sec);
  });
}

/* ===================== STORY FUNCTION ===================== */
function conceptToStory(concept, tone) {
  if (!concept.trim()) return 'Please enter a concept to transform.';
  const base = `Let's understand *${concept}* through a short story.`;
  const styles = {
    simple: `${base} Imagine a student pushing a box. If no one else pushes or pulls, the box keeps doing what it was doing — either staying still or moving steadily.`,
    fun: `${base} Think of a lazy cat on a magic carpet. Unless a gust of wind (a force!) comes along, the cat just chills — not speeding up or slowing down.`,
    epic: `${base} In the kingdom of Motion, objects obey an ancient decree: without a mighty force, their path remains unchanged — be it stillness or steady travel.`,
    analogy: `${base} Like a train on straight tracks with the engine off — it keeps rolling at the same speed until brakes (a force) act.`
  };
  return styles[tone] || styles.simple;
}

/* ===================== INIT ===================== */
window.addEventListener('DOMContentLoaded', () => {
  applyTheme(0);
  renderFlashcards(); 
  renderMCQ(); 
  renderKeywords(); 
  renderTest();

  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");
  const searchResult = document.getElementById("searchResult");
   
    /* ===================== SIDEBAR NAVIGATION ===================== */
  const navBtns = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('main > section');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Hide all sections
      sections.forEach(sec => sec.classList.add('hidden'));

      // Remove active class from all buttons
      navBtns.forEach(b => b.classList.remove('active-nav'));

      // Show clicked section
      const target = btn.dataset.section;
      const active = document.getElementById('section-' + target);
      if (active) active.classList.remove('hidden');

      // Highlight clicked button
      btn.classList.add('active-nav');
    });
  });
  /* ===================== CENTRAL EVENT DELEGATION ===================== */
  searchResult.addEventListener("click", (e) => {
    const target = e.target;

    // Flashcard click
    if (target.closest(".flashcard")) {
      target.closest(".flashcard").classList.toggle("flipped");
    }

    // MCQ option click
    if (target.classList.contains("mcq-option")) {
      target.classList.toggle("selected");
    }

    // Slider buttons
    if (target.classList.contains("slider-prev") || target.classList.contains("slider-next")) {
      const slider = target.closest(".slider");
      if (slider) {
        const inner = slider.querySelector(".slider-inner");
        const step = slider.offsetWidth;
        inner.scrollLeft += target.classList.contains("slider-next") ? step : -step;
      }
    }
  });

  /* ===================== SEARCH AI BUTTON ===================== */
searchBtn?.addEventListener("click", async () => {
  const query = searchInput.value.trim();
  if (!query) {
    searchResult.innerHTML = `<div class="rounded-xl border border-white/10 p-3 bg-black/10 text-[var(--text)]">Please type a concept to search.</div>`;
    searchResult.classList.remove("opacity-0", "pointer-events-none");
    return;
  }

  searchResult.innerHTML = `<div class="rounded-xl border border-white/10 p-3 bg-black/10 text-[var(--text)]">Generating response...</div>`;
  searchResult.classList.remove("opacity-0", "pointer-events-none");

  try {
    const url = `/ai/?prompt=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const data = await res.json();

    searchResult.innerHTML = "";

    const inner = document.createElement("div");
    inner.id = "searchResultInner";
    inner.className = "p-4 overflow-auto max-h-72 text-left space-y-4";

    // Convert AI markdown to HTML
    let html = marked.parse(data.response);

    // Wrap flashcards dynamically if AI mentions "Flashcard: Question"
    html = html.replace(
      /<p>Flashcard: (.+?)<\/p>/g,
      `<div class="flashcard rounded-2xl p-3 cursor-pointer">
          <div class="flip-inner">
            <div class="face front flex flex-col">
              <div class="text-sm text-[var(--muted)] mb-2">Question</div>
              <div class="text-center font-medium">$1</div>
            </div>
            <div class="face back flex flex-col">
              <div class="text-sm text-[var(--muted)] mb-2">Answer</div>
              <div class="text-center">Answer goes here</div>
            </div>
          </div>
       </div>`
    );

    // Wrap MCQs dynamically if AI provides a list
    html = html.replace(
      /<li>(.+?)<\/li>/g,
      `<div class="mcq-option px-3 py-2 rounded-xl border border-white/10 cursor-pointer">$1</div>`
    );

    // Wrap sliders if AI provides a <div class="slider"> in response (optional)
    // Just make sure AI outputs <div class="slider-inner"> items inside
    // Event delegation will handle prev/next clicks automatically

    inner.innerHTML = html;
    searchResult.appendChild(inner);
    searchResult.scrollTop = 0;

  } catch (err) {
    console.error(err);
    searchResult.innerHTML = `<div class="rounded-xl border border-white/10 p-3 bg-black/10 text-[var(--text)]">Error generating response. Try again.</div>`;
  }
});

  /* ===================== STORY GENERATOR ===================== */
  const genStoryBtn = document.getElementById("genStory");
  const storySection = document.getElementById("section-story");
  const storyOutput = document.getElementById("storyOutput");
  const conceptInput = document.getElementById("conceptInput");

  genStoryBtn?.addEventListener("click", () => {
    const concept = conceptInput.value.trim();
    if (!concept) return;
    storySection.classList.remove("hidden");
    storyOutput.textContent = conceptToStory(concept, document.getElementById("toneSelect")?.value || "simple");
  });

  /* ===================== MCQ NEXT & TEST SUBMIT ===================== */
  document.getElementById('nextMcq')?.addEventListener('click', () => { 
    mcqIdx++; renderMCQ(); 
  });

  document.getElementById('submitTest')?.addEventListener('click', () => {
    const answers = demoMCQs.map((it, idx) => {
      const sel = document.querySelector(`input[name='q${idx}']:checked`);
      return sel ? parseInt(sel.value) : null;
    });
    let correct = 0;
    answers.forEach((a, idx) => { if (a === demoMCQs[idx].ans) correct++; });
    const pct = Math.round((correct / demoMCQs.length) * 100);
    document.getElementById('testResult').textContent = `You scored ${correct}/${demoMCQs.length} (${pct}%).`;
  });

  /* ===================== THEME SWITCH ===================== */
  document.getElementById('changeTheme')?.addEventListener('click', () => applyTheme((currentThemeIdx + 1) % themes.length));
  document.getElementById('changeThemeIcon')?.addEventListener('click', () => applyTheme((currentThemeIdx + 1) % themes.length));

});

function setVars({ bg, panel, text, muted, accent, accent2, ring }) {
  const r = document.documentElement;
  if (bg) r.style.setProperty('--bg', bg);
  if (panel) r.style.setProperty('--panel', panel);
  if (text) r.style.setProperty('--text', text);
  if (muted) r.style.setProperty('--muted', muted);
  if (accent) r.style.setProperty('--accent', accent);
  if (accent2) r.style.setProperty('--accent-2', accent2);
  if (ring) r.style.setProperty('--ring', ring);
  
  document.getElementById('app').style.background = bg || getComputedStyle(r).getPropertyValue('--bg');

  // 🔹 NEW: Force scrollbar colors to update
  const search = document.getElementById('searchResult');
  if(search){
    search.style.scrollbarColor = `${accent} ${panel}`; // Firefox
  }
}
////////////////////

const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const searchWrapper = document.getElementById("searchWrapper");
const searchHeading = document.getElementById("searchHeading");
const searchResult = document.getElementById("searchResult");

searchBtn.addEventListener("click", async () => {
  const query = searchInput.value.trim();
  if (!query) return;

  // Move search bar up and expand result
  searchWrapper.classList.add("expanded");
  searchHeading.classList.add("expanded");
  searchResult.classList.add("expanded");
  searchResult.classList.remove("opacity-0", "pointer-events-none");

  // Show loading
  searchResult.innerHTML = `<div class="rounded-xl border border-white/10 p-3 bg-black/10 text-[var(--text)]">Generating response...</div>`;

  try {
    const url = `/ai/?prompt=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const data = await res.json();

    searchResult.innerHTML = "";
    const inner = document.createElement("div");
    inner.id = "searchResultInner";
    inner.className = "p-4 overflow-auto max-h-full text-left space-y-4";
    inner.innerHTML = marked.parse(data.response);
    searchResult.appendChild(inner);

  } catch (err) {
    console.error(err);
    searchResult.innerHTML = `<div class="rounded-xl border border-white/10 p-3 bg-black/10 text-[var(--text)]">Error generating response. Try again.</div>`;
  }
});


// --- Sidebar click fix guard ---
window.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    sidebar.style.zIndex = "9999";
    sidebar.style.pointerEvents = "auto";
  }

  // disable pointer events for blocking sections
//   const blockers = [
//     "section-search",
//     "searchResult",
//     "story-section",
//     "flashcard-section",
//     "mcq-section"
//   ];

//   blockers.forEach(id => {
//     const el = document.getElementById(id);
//     if (el) {
//       el.style.pointerEvents = "none";
//     }s
//   });
// });

// Force pointer-events on all buttons
// document.querySelectorAll('button, input, select').forEach(el => el.style.pointerEvents = 'auto');
window.addEventListener("DOMContentLoaded", () => {
  function ensureInteractiveTop() {
    document.querySelectorAll(
      '.slider, .flashcard, .flip, .mcq-option, button, input, select, .nav-btn, .toggle-pill'
    ).forEach(el => {
      try {
        el.style.pointerEvents = 'auto';
        el.style.zIndex = el.style.zIndex || '9999';
        if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      } catch (e) {}
    });

    const search = document.getElementById('searchResult');
    if (search && !search.classList.contains('expanded')) {
      search.style.display = 'none';
    } else if (search) {
      search.style.display = '';
    }
  }

  ensureInteractiveTop();
  window.addEventListener('resize', ensureInteractiveTop);
});

//////////////////////
// Patched: ensure interactive controls stay on top rather than disabling entire sections
window.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    sidebar.style.zIndex = "9999";
    sidebar.style.pointerEvents = "auto";
  }

  function ensureInteractiveTop(){
    document.querySelectorAll('.slider, .flashcard, .flip, .mcq-option, button, input, select, .nav-btn, .toggle-pill').forEach(el => {
      try {
        el.style.pointerEvents = 'auto';
        el.style.zIndex = el.style.zIndex || '9999';
        if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      } catch(e) {}
    });
    const search = document.getElementById('searchResult');
    if (search && !search.classList.contains('expanded')) {
      search.style.display = 'none';
    } else if (search) {
      search.style.display = '';
    }
  }

  ensureInteractiveTop();
  window.addEventListener('resize', ensureInteractiveTop);
});
/////////////////////////////////
// ==== CLEAN SIDEBAR CLICK FIX ====
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const openBtn = document.getElementById('sidebarToggle');
    const closeBtn = document.getElementById('sidebarClose');

    // Open the sidebar
    openBtn.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    });

    // Close the sidebar
    closeBtn.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    // Close sidebar when clicking overlay
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    // Ensure sidebar buttons are always clickable
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.style.pointerEvents = 'auto';
        btn.style.zIndex = '10000';
        if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
    });
});
