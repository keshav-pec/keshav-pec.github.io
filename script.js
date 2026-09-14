/* ==========================================================================
   Keshav Goyal — portfolio
   --------------------------------------------------------------------------
   Design rule: nothing runs on every scroll frame.
   • Scroll-linked visuals are CSS scroll-driven animations (compositor).
   • State changes (sticky nav, active link, back-to-top, reveals) come from
     IntersectionObserver callbacks, which fire only at thresholds.
   • The rAF loop below exists ONLY as a fallback for browsers without
     scroll-driven animations, and it writes `translate` and one custom
     property — never a layout-triggering value.
   ========================================================================== */
(() => {
  "use strict";

  const root = document.documentElement;
  const mqReduce = matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = mqReduce.matches;

  const SDT =
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("animation-timeline", "view()");

  if (!SDT) root.classList.add("no-sdt");

  /* ======================================================================
     0. THEME TOGGLE
     data-theme is already set on <html> by the inline script in <head>
     (before first paint) — this just wires up the button, persistence, and
     keeps the two theme-color <meta> tags in sync.
     ====================================================================== */
  const themeBtn = document.getElementById("theme-toggle");
  const metaTheme = document.getElementById("meta-theme-color");
  const THEME_COLOR = { light: "#eaf0f9", dark: "#05070f" };
  const mqDark = matchMedia("(prefers-color-scheme: dark)");

  const applyTheme = (theme) => {
    root.setAttribute("data-theme", theme);
    if (metaTheme) metaTheme.content = THEME_COLOR[theme];
    if (themeBtn) {
      themeBtn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
      );
    }
  };

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("theme", next);
      } catch (e) {}
      applyTheme(next);
    });
  }
  // sync the toggle's own label with whatever the inline head script decided
  applyTheme(root.getAttribute("data-theme") || "light");

  // if the user has never chosen explicitly, keep following the OS
  mqDark.addEventListener("change", (e) => {
    let stored = null;
    try {
      stored = localStorage.getItem("theme");
    } catch (err) {}
    if (!stored) applyTheme(e.matches ? "dark" : "light");
  });

  /* ======================================================================
     1. NAVIGATION
     ====================================================================== */
  const nav = document.getElementById("nav");
  const burger = document.getElementById("burger");
  const menu = document.getElementById("nav-menu");

  const scrim = document.createElement("div");
  scrim.className = "nav-scrim";
  scrim.hidden = true;
  nav.after(scrim);

  const setMenu = (open) => {
    nav.classList.toggle("is-open", open);
    scrim.classList.toggle("is-on", open);
    scrim.hidden = !open;
    document.body.classList.toggle("is-locked", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  burger.addEventListener("click", () =>
    setMenu(!nav.classList.contains("is-open")),
  );
  scrim.addEventListener("click", () => setMenu(false));
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setMenu(false);
      burger.focus();
    }
  });

  /* ---- sticky nav + back-to-top: one observer, no scroll listener ---- */
  const toTop = document.getElementById("to-top");
  const sentinel = document.getElementById("top-sentinel");

  new IntersectionObserver(
    ([entry]) => {
      const past = !entry.isIntersecting;
      nav.classList.toggle("is-stuck", past);
      toTop.classList.toggle("is-on", past);
    },
    { threshold: 0 },
  ).observe(sentinel);

  toTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  });

  /* ---- active link: observe sections, pick the topmost visible one ---- */
  const links = [...document.querySelectorAll(".nav-link")];
  const linkFor = new Map(
    links.map((a) => [a.getAttribute("href").slice(1), a]),
  );
  const sections = [...document.querySelectorAll("main section[id]")].filter(
    (s) => linkFor.has(s.id) || s.id === "home",
  );
  const visible = new Set();

  const syncActive = () => {
    let best = null;
    for (const s of sections) {
      if (visible.has(s.id) && (!best || s.offsetTop < best.offsetTop)) best = s;
    }
    const id = best ? best.id : null;
    for (const a of links) a.classList.toggle("is-active", a.dataset.id === id);
  };

  for (const a of links) a.dataset.id = a.getAttribute("href").slice(1);

  const sectionObs = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target.id);
        else visible.delete(e.target.id);
      }
      syncActive();
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
  );
  sections.forEach((s) => sectionObs.observe(s));

  /* ======================================================================
     2. REVEALS — only needed when the browser lacks scroll-driven animation
     ====================================================================== */
  if (!SDT && !reduced) {
    const revealObs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          revealObs.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    document.querySelectorAll(".reveal").forEach((el) => revealObs.observe(el));
  } else if (!SDT) {
    document
      .querySelectorAll(".reveal")
      .forEach((el) => el.classList.add("is-in"));
  }

  /* ---- reveal safety net -------------------------------------------------
     A scroll-driven reveal only plays once its element enters the viewport.
     Anything already on screen at load would therefore sit at opacity 0 until
     the user scrolls — which on a very tall viewport (or a zoomed-out window)
     means visibly blank sections. Mark those elements as already seen. Runs
     once at load and again if the window grows; O(n) over ~40 nodes. */
  if (SDT) {
    const revealEls = [...document.querySelectorAll(".reveal")];
    let seenTo = 0;

    const markSeen = () => {
      const limit = window.innerHeight;
      if (limit <= seenTo) return;
      seenTo = limit;
      for (const el of revealEls) {
        if (el.dataset.seen) continue;
        if (el.getBoundingClientRect().top + window.scrollY < limit) {
          el.dataset.seen = "1";
        }
      }
    };

    markSeen();
    let resizeTimer;
    addEventListener(
      "resize",
      () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(markSeen, 200);
      },
      { passive: true },
    );
  }

  /* ======================================================================
     3. PARALLAX FALLBACK
     Runs only without scroll-driven animations. A single rAF, scheduled by
     a passive scroll listener, writing `translate` on at most 6 elements —
     and only on the in-flow ones currently intersecting the viewport.
     ====================================================================== */
  if (!SDT && !reduced) {
    const bgLayers = [...document.querySelectorAll("[data-par-bg]")].map(
      (el) => ({ el, k: parseFloat(el.dataset.parBg) * -2.05 }),
    );
    const flowLayers = [...document.querySelectorAll(".par[data-par]")].map(
      (el) => ({
        el,
        d: parseFloat(getComputedStyle(el).getPropertyValue("--par-d")) || 28,
        on: false,
      }),
    );

    const flowObs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const rec = flowLayers.find((f) => f.el === e.target);
          if (rec) rec.on = e.isIntersecting;
        }
        schedule();
      },
      { rootMargin: "20% 0px 20% 0px" },
    );
    flowLayers.forEach((f) => flowObs.observe(f.el));

    let queued = false;

    const frame = () => {
      queued = false;
      const vh = window.innerHeight;
      const max = root.scrollHeight - vh;
      const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;

      root.style.setProperty("--p", progress.toFixed(4));

      for (const l of bgLayers) {
        l.el.style.transform = `translate3d(0,${(progress * l.k * vh).toFixed(1)}px,0)`;
      }
      for (const l of flowLayers) {
        if (!l.on) continue;
        const r = l.el.getBoundingClientRect();
        const p = (r.top + r.height / 2) / vh;
        l.el.style.translate = `0 ${((p - 0.5) * 2 * l.d).toFixed(1)}px`;
      }
    };

    function schedule() {
      if (!queued) {
        queued = true;
        requestAnimationFrame(frame);
      }
    }

    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule, { passive: true });
    frame();
  }

  /* ======================================================================
     4. AMBIENT CODE RAIN — desktop only, pure CSS animation once built
     ====================================================================== */
  const rain = document.getElementById("rain");
  if (rain && !reduced && innerWidth >= 900 && matchMedia("(hover: hover)").matches) {
    // Real (if generic) functions across the stack in the Skills section, so
    // the backdrop reads as actual programs rather than a word cloud of
    // disconnected lines — own boilerplate, not copied from any project.
    // Each block is a small, coherent, self-contained function so the rain
    // reads like someone scrolled through a real file.
    const codeBlocks = [
      [
        "async function fetchTasks(userId) {",
        "  const res = await fetch(`/api/tasks?user=${userId}`);",
        "  if (!res.ok) throw new Error(res.statusText);",
        "  return res.json();",
        "}",
      ],
      [
        "function useDebounce(value, delay) {",
        "  const [debounced, setDebounced] = useState(value);",
        "  useEffect(() => {",
        "    const t = setTimeout(() => setDebounced(value), delay);",
        "    return () => clearTimeout(t);",
        "  }, [value, delay]);",
        "  return debounced;",
        "}",
      ],
      [
        "router.get(\"/api/tasks\", async (req, res) => {",
        "  const tasks = await Task.find({ owner: req.user.id });",
        "  res.json(tasks);",
        "});",
      ],
      [
        "def train(model, data, epochs=10):",
        "    for epoch in range(epochs):",
        "        for x, y in data:",
        "            loss = model.step(x, y)",
        "    return model",
      ],
      [
        "class Retriever(BaseModel):",
        "    def query(self, text, k=5):",
        "        vector = embed(text)",
        "        return self.index.search(vector, k)",
      ],
      [
        "public class Solver {",
        "  static int[] dp = new int[100001];",
        "  static int fib(int n) {",
        "    if (n <= 1) return n;",
        "    if (dp[n] != 0) return dp[n];",
        "    return dp[n] = fib(n - 1) + fib(n - 2);",
        "  }",
        "}",
      ],
      [
        "function binarySearch(arr, target) {",
        "  let left = 0, right = arr.length - 1;",
        "  while (left <= right) {",
        "    const mid = (left + right) >> 1;",
        "    if (arr[mid] === target) return mid;",
        "    arr[mid] < target ? (left = mid + 1) : (right = mid - 1);",
        "  }",
        "  return -1;",
        "}",
      ],
      [
        "SELECT u.id, u.email, COUNT(o.id) AS orders",
        "FROM users u",
        "LEFT JOIN orders o ON o.user_id = u.id",
        "GROUP BY u.id",
        "ORDER BY orders DESC;",
      ],
      [
        "socket.on(\"connect\", () => {",
        "  const pc = new RTCPeerConnection(config);",
        "  pc.addTrack(track, stream);",
        "  channel.send(JSON.stringify({ type: \"join\" }));",
        "});",
      ],
      [
        "export default async function handler(req, res) {",
        "  const results = await index.query(vector, 5);",
        "  return NextResponse.json({ results });",
        "}",
      ],
      [
        "FROM node:20-alpine",
        "WORKDIR /app",
        "COPY package*.json ./",
        "RUN npm ci --production",
        "CMD [\"node\", \"server.js\"]",
      ],
      [
        "@app.get(\"/health\")",
        "def health_check():",
        "    if __name__ == \"__main__\":",
        "        uvicorn.run(app, host=\"0.0.0.0\")",
      ],
    ];
    // Minimal syntax colouring — keywords bold in the accent blue, string
    // literals in gold — so the rain reads like an actual editor instead of
    // a flat wall of one-tone text. `<b>`/`<i>` are just the shortest tags;
    // styled in CSS, not used for their default weight/italic.
    const KEYWORDS = new Set([
      "const", "let", "var", "async", "await", "function", "return",
      "import", "from", "export", "default", "class", "def", "public",
      "new", "for", "while", "if", "else", "in", "as", "int", "void",
      "SELECT", "FROM", "WHERE", "CREATE", "INDEX", "ON", "RUN",
    ]);
    const KW_PATTERN = new RegExp("\\b(" + [...KEYWORDS].join("|") + ")\\b", "g");
    const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const highlight = (line) =>
      escapeHtml(line)
        .replace(/"[^"]*"/g, (m) => `<i>${m}</i>`)
        .replace(KW_PATTERN, "<b>$1</b>");

    // Walk the blocks in shuffled, function-sized chunks (with a blank line
    // between) rather than picking random single lines, so the column reads
    // as scrolling through real functions instead of a shuffled word salad.
    const shuffledBlocks = () => {
      const arr = codeBlocks.slice();
      for (let i = arr.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    const buildLines = (target) => {
      const out = [];
      while (out.length < target) {
        for (const block of shuffledBlocks()) {
          out.push(...block, "");
          if (out.length >= target) break;
        }
      }
      return out.slice(0, target).map(highlight).join("\n");
    };

    const lineH = 26;
    const lines = Math.ceil(Math.max(innerHeight, 900) / lineH) + 2;
    // A single, left-aligned column, wide enough that whole lines of real
    // functions stay legible rather than being clipped after a few words.
    const half = buildLines(lines);
    const span = document.createElement("span");
    span.className = "rain-col";
    span.style.cssText = "--l:4%;--d:52s;--delay:0s";
    span.innerHTML = half + "\n" + half;
    rain.appendChild(span);
  }

  /* ======================================================================
     5. HERO TYPING — a timer, paused whenever the hero is off screen
     ====================================================================== */
  const typed = document.getElementById("typed");
  if (typed) {
    const roles = [
      "CSE @ PEC Chandigarh",
      "Full Stack Developer",
      "Competitive Programmer",
      "Open Source Contributor"
    ];

    if (reduced) {
      typed.textContent = roles[0];
    } else {
      let r = 0,
        c = 0,
        del = false,
        timer = null,
        live = true;

      const tick = () => {
        const word = roles[r];
        c += del ? -1 : 1;
        typed.textContent = word.slice(0, c);

        let wait = del ? 45 : 95;
        if (!del && c === word.length) {
          wait = 2200;
          del = true;
        } else if (del && c === 0) {
          del = false;
          r = (r + 1) % roles.length;
          wait = 350;
        }
        if (live) timer = setTimeout(tick, wait);
      };

      new IntersectionObserver(([e]) => {
        live = e.isIntersecting;
        clearTimeout(timer);
        if (live) timer = setTimeout(tick, 400);
      }).observe(document.querySelector(".hero"));
    }
  }

  /* ======================================================================
     6. CONTACT FORM — no backend on Pages, so compose a mail draft
     ====================================================================== */
  const form = document.getElementById("contact-form");
  if (form) {
    const note = document.getElementById("form-note");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;

      const d = new FormData(form);
      const body = `Name: ${d.get("name")}\nEmail: ${d.get("email")}\n\n${d.get("message")}`;
      location.href =
        "mailto:keshavpec24@gmail.com" +
        `?subject=${encodeURIComponent(d.get("subject") || "Portfolio enquiry")}` +
        `&body=${encodeURIComponent(body)}`;

      note.textContent = "Opening your mail app…";
      setTimeout(() => {
        note.textContent = "";
        form.reset();
      }, 4000);
    });
  }

  /* ======================================================================
     7. MISC
     ====================================================================== */
  document.getElementById("year").textContent = new Date().getFullYear();
})();
