/* ==========================================================================
   Keshav Goyal — portfolio · moonwalk edition
   --------------------------------------------------------------------------
   The whole page is a walk across the Moon. Behind the content, a fixed
   WebGL canvas draws the lunar surface — a sphere seen from just above the
   ground, so the horizon bows down toward the edges of the screen — and
   scrolling carries you over it.

     scroll position ──► distance walked ──► craters drift by under the page
                    ├──► where you look  ──► more sky in the hero and at the end
                    └──► the bend        ──► content curls away over the top
                                             and bottom of the screen, as if
                                             the page were wrapped on the Moon

   • The terrain is procedural: one ray–sphere hit per pixel, then four
     octaves of craters (bowl, raised rim, ejecta, and the shadow each rim
     throws across its own floor) over fine regolith noise. Nothing to
     download, and it stays sharp at any screen size.
   • The ground is redrawn only when something it depends on changes, and the
     stars only tick over a few times a second while nothing moves, so a
     page at rest costs next to nothing. Layout is measured once per resize,
     never per frame; everything that moves is a transform.
   • A governor watches the frame rate while the ground is being drawn and
     trades its resolution for smoothness on machines that need it.
   • Lenis adds wheel inertia on desktop pointers only. Touch devices keep
     native scrolling, and reduced-motion visitors get a still landscape.
   ========================================================================== */
(() => {
  "use strict";

  window.__lunar = true; // tells the inline <head> script the engine arrived

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);
  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ======================================================================
     1. THEME — night ⇄ day
     ====================================================================== */
  const themeBtn = $("#theme-toggle");
  const metaTheme = $("#meta-theme-color");
  const THEME_COLOR = { dark: "#05070d", light: "#dfe5ee" };
  let theme = root.getAttribute("data-theme") === "light" ? "light" : "dark";
  let day = theme === "light" ? 1 : 0; // eased 0–1, feeds the ground shader

  const applyTheme = (next, snap) => {
    theme = next;
    root.setAttribute("data-theme", next);
    if (metaTheme) metaTheme.content = THEME_COLOR[next];
    if (themeBtn) {
      themeBtn.setAttribute(
        "aria-label",
        next === "dark" ? "Switch to day theme" : "Switch to night theme",
      );
    }
    if (snap) day = next === "light" ? 1 : 0;
  };
  applyTheme(theme, true);

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("theme", next);
      } catch (e) {}

      // Where supported, the new sky opens as a disc growing from the toggle.
      if (reduced || typeof document.startViewTransition !== "function") {
        applyTheme(next, reduced);
        return;
      }
      const r = themeBtn.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      const vt = document.startViewTransition(() => applyTheme(next, true));
      vt.ready
        .then(() => {
          root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
            { duration: 900, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" },
          );
        })
        .catch(() => {});
    });
  }

  /* ======================================================================
     2. TEXT SPLITTING + REVEALS
     ====================================================================== */
  // Wrap every word in a clipping box so headings can rise word by word.
  // Words stay real text separated by real spaces, so this is invisible to
  // screen readers and to copy/paste.
  const splitWords = (el) => {
    let i = 0;
    const walk = (node) => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          for (const part of child.textContent.split(/(\s+)/)) {
            if (!part) continue;
            if (/^\s+$/.test(part)) {
              frag.append(" ");
              continue;
            }
            const w = document.createElement("span");
            const wi = document.createElement("span");
            w.className = "w";
            wi.className = "wi";
            wi.style.setProperty("--wi", i++);
            wi.textContent = part;
            w.append(wi);
            frag.append(w);
          }
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      }
    };
    walk(el);
  };
  $$("[data-split]").forEach(splitWords);

  const revealEls = $$(".rv, [data-split]");

  if (reduced || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        const shown = entries.filter((e) => e.isIntersecting).map((e) => e.target);
        // whatever arrives together is staggered in reading order
        shown.sort((a, b) => (a.compareDocumentPosition(b) & 4 ? -1 : 1));
        shown.forEach((el, i) => {
          const delay = Math.min(i, 7) * 85;
          el.style.setProperty("--d", delay + "ms");
          el.classList.add("in");
          io.unobserve(el);
          // once settled, hand the element back to its own hover transitions
          if (el.classList.contains("rv")) {
            setTimeout(() => {
              el.classList.remove("rv", "in");
              el.style.removeProperty("--d");
            }, delay + 1700);
          }
        });
      },
      { rootMargin: "0px 0px -7% 0px", threshold: 0.06 },
    );
    // wait a beat for the display face so the first reveal isn't a font swap
    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise((r) => setTimeout(r, 700))]).then(() => {
      revealEls.forEach((el) => io.observe(el));
    });
  }

  /* ======================================================================
     3. SMOOTH SCROLL (Lenis) + ANCHORS
     ====================================================================== */
  let lenis = null;
  if (!reduced && finePointer && typeof window.Lenis === "function") {
    try {
      lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, autoRaf: false });
    } catch (e) {
      lenis = null;
    }
  }

  const scrollToY = (top) => {
    if (lenis) lenis.scrollTo(top, { duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
  };

  const goTo = (target) => {
    const top = target.id === "home" ? 0 : target.getBoundingClientRect().top + window.scrollY;
    scrollToY(Math.max(0, top));
    // keep keyboard and screen-reader focus travelling with the scroll
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.style.outline = "none";
    target.focus({ preventScroll: true });
  };

  /* ======================================================================
     4. NAVIGATION
     ====================================================================== */
  const nav = $("#nav");
  const burger = $("#burger");
  const mainEl = $("#main");
  const outro = $("#outro");
  const toTop = $("#to-top");

  const setMenu = (open) => {
    if (nav.classList.contains("is-open") === open) return;
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("is-locked", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mainEl.inert = open;
    outro.inert = open;
    if (lenis) open ? lenis.stop() : lenis.start();
  };

  burger.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setMenu(false);
      burger.focus();
    }
  });
  matchMedia("(min-width: 941px)").addEventListener("change", (e) => e.matches && setMenu(false));

  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const id = a.getAttribute("href").slice(1);
    const target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    setMenu(false);
    goTo(target);
    try {
      history.replaceState(null, "", id === "home" ? location.pathname + location.search : "#" + id);
    } catch (err) {}
  });

  const backToStart = () => scrollToY(0);
  toTop.addEventListener("click", backToStart);
  const again = $("#again");
  if (again) again.addEventListener("click", backToStart);

  const navLinks = $$(".nav-link");
  const setActive = (id) => {
    for (const a of navLinks) {
      const on = a.getAttribute("href") === "#" + id;
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    }
  };

  /* ======================================================================
     5. THE GROUND — WebGL
     The Moon is a unit sphere; the camera hangs a little above its north
     pole and looks along −z. Walking = turning the sphere about the x axis,
     which is just an offset on one of the surface coordinates.
     ====================================================================== */
  const backdrop = $("#backdrop");

  const Ground = (() => {
    const canvas = $("#ground");

    // The sun hangs low, off to the left and a little ahead, so every crater
    // shows a lit wall on one side and a pool of shadow on the other.
    const SUN_AZ = 72 * DEG; // from straight ahead, toward the left
    const SUN_EL = 13 * DEG; // above the horizon
    const SUN = [
      -Math.cos(SUN_EL) * Math.sin(SUN_AZ),
      Math.sin(SUN_EL),
      -Math.cos(SUN_EL) * Math.cos(SUN_AZ),
    ];

    let gl = null;
    let U = {};
    let ready = false;
    let lost = false;
    let shown = false;
    let bw = 0; // backing store, device px
    let bh = 0;
    let last = null; // the state currently on screen

    const VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

    const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;      // backing store, px
uniform float uTanY;    // tan(half the vertical field of view)
uniform float uPitch;   // how far the camera looks down, radians
uniform float uAlt;     // camera height, in moon radii
uniform float uTravel;  // distance walked along the track, moon radii
uniform float uWarp;    // extra bow given to the horizon on narrow screens
uniform float uDay;     // 0 night palette · 1 day palette
uniform vec3 uSun;      // direction to the sun

// crater profile, in units of the crater's own radius
const float RIM = 0.07;  // rim height above the plain
const float DEP = 0.36;  // rim-to-floor depth

vec4 hash42(vec2 p) {
  vec4 p4 = fract(p.xyxy * vec4(0.1031, 0.1030, 0.0973, 0.1099));
  p4 += dot(p4, p4.wzxy + 33.33);
  return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}

float hash12(vec2 p) {
  vec3 p3 = fract(p.xyx * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// value noise: .x the value, .yz its gradient
vec3 vnoise(vec2 x) {
  vec2 i = floor(x);
  vec2 f = x - i;
  vec2 u = f * f * (3.0 - 2.0 * f);
  vec2 du = 6.0 * f * (1.0 - f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  float k = a - b - c + d;
  return vec3(a + (b - a) * u.x + (c - a) * u.y + k * u.x * u.y,
              du * vec2(b - a + k * u.y, c - a + k * u.x));
}

// One octave of craters on a jittered grid, at most one per cell: a parabolic
// bowl, a rim and an apron of ejecta thinning as 1/r^3. Adds to the surface
// slope, the shadow mask and the brightness of fresh ejecta.
//   thr   share of cells that hold a crater (varies smoothly with terrain)
//   fq    the ground one pixel covers, in cell units — rims and shadow edges
//         are never drawn sharper than that, so nothing stair-steps
void craters(vec2 p, float seed, float thr, float fade, float fq, vec2 sunDir, float sunTan,
             inout vec2 slope, inout float shade, inout float fresh) {
  vec2 ip = floor(p);
  vec2 fp = p - ip;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j));
      vec4 h = hash42(ip + o + seed);
      float live = fade * (1.0 - smoothstep(thr - 0.05, thr + 0.05, h.w));
      if (live <= 0.0) continue;
      float rad = 0.12 + 0.3 * h.z * h.z;       // small craters are the common ones
      vec2 q = (fp - o - h.xy) / rad;
      float r2 = dot(q, q);
      if (r2 > 4.84) continue;                   // past 2.2 radii: no influence
      float r = sqrt(r2);
      float age = fract(h.w * 53.7);             // 0 fresh … 1 worn down
      float k = mix(1.0, 0.3, age);              // old craters are shallow
      float px = fq / rad;                       // one pixel, in crater radii
      float rimW = clamp(1.5 * px, 0.03, 0.45);
      float edge = smoothstep(1.0 - rimW, 1.0 + rimW, r);
      vec2 dir = q / max(r, 1e-4);

      float ir2 = 1.0 / max(r2, 1.0);
      float inner = 2.0 * DEP * min(r, 1.0);
      float outer = -3.0 * RIM * ir2 * ir2 * (1.0 - smoothstep(1.4, 2.2, r));
      slope += live * k * mix(inner, outer, edge) * dir;

      if (edge < 1.0) {
        // does the rim stand between this point and the sun?
        float rr = min(r2, 1.0);
        float qs = dot(q, sunDir);
        float run = sqrt(max(qs * qs - rr + 1.0, 0.0)) - qs;
        float block = k * DEP * (1.0 - rr) - run * sunTan;
        float w = 0.015 + 0.6 * px;
        shade = max(shade, live * (1.0 - edge) * smoothstep(-w, w, block));
      }
      fresh += live * smoothstep(0.8, 1.0, 1.0 - age) * (1.0 - smoothstep(0.7, 2.1, r));
    }
  }
}

void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - uRes) / uRes.y;
  p.y += uWarp * p.x * p.x;

  float cp = cos(uPitch);
  float sp = sin(uPitch);
  vec3 up = vec3(0.0, cp, -sp);
  vec3 rd = normalize(vec3(0.0, -sp, -cp) + uTanY * (vec3(p.x, 0.0, 0.0) + p.y * up));

  // the limb: from up here the horizon sits at a fixed angle below level
  float h1 = 1.0 + uAlt;
  float sinDip = sqrt(1.0 - 1.0 / (h1 * h1));
  float pix = 2.0 * uTanY / uRes.y;            // radians per pixel
  float above = rd.y + sinDip;                 // > 0 where the ray clears the ground
  float cover = clamp(0.5 - above / pix, 0.0, 1.0);

  // a thin line of light along the limb, fading up into the black sky
  // (by day just the bright line: a glow would vanish into the pale sky)
  float lift = max(above, 0.0) / pix;
  float ga = 0.3 * exp(-lift / 4.0) + 0.09 * (1.0 - uDay) * exp(-lift / 70.0);
  vec4 halo = vec4(mix(vec3(0.72, 0.79, 1.0), vec3(1.0), uDay) * ga, ga);
  if (cover <= 0.0) { gl_FragColor = halo; return; }

  vec3 ro = vec3(0.0, h1, 0.0);
  float b = dot(ro, rd);
  float t = -b - sqrt(max(b * b - (h1 * h1 - 1.0), 0.0));
  vec3 n0 = normalize(ro + t * rd);

  // surface coordinates: across the track, and along it (that one walks)
  vec2 uv = vec2(asin(clamp(n0.x, -1.0, 1.0)), atan(n0.z, n0.y) + uTravel);
  vec3 ew = normalize(vec3(1.0 - n0.x * n0.x, -n0.x * n0.y, -n0.x * n0.z));
  vec3 es = normalize(vec3(0.0, -n0.z, n0.y));

  vec2 sunH = vec2(dot(uSun, ew), dot(uSun, es));
  float sunL = max(length(sunH), 1e-3);
  vec2 sunDir = sunH / sunL;
  float sunTan = dot(uSun, n0) / sunL;

  // How much ground one pixel covers. Near the horizon the ground is seen
  // almost edge-on, so a pixel smears a long way across it; detail finer
  // than this fades out, which keeps the far terrain from shimmering.
  float foot = t * pix / max(dot(-rd, n0), 0.03);

  // dark, smooth plains and bright, battered highlands
  float mare = vnoise(uv * 9.0 + 1.3).x * 0.6 + vnoise(uv * 31.0 + 7.9).x * 0.4;
  float high = smoothstep(0.28, 0.72, mare);

  vec2 slope = 0.06 * vnoise(uv * 18.0 + 3.7).yz;   // long, low swells
  float shade = 0.0;
  float fresh = 0.0;

  float f0 = 1.0 - smoothstep(0.25, 0.6, foot / 0.011);
  float f1 = 1.0 - smoothstep(0.25, 0.6, foot / 0.0039);
  float f2 = 1.0 - smoothstep(0.25, 0.6, foot / 0.0014);
  float f3 = 1.0 - smoothstep(0.25, 0.6, foot / 0.0005);
  if (f0 > 0.0) craters(uv / 0.04, 13.0, 0.5 * mix(0.6, 1.0, high), f0, foot / 0.04, sunDir, sunTan, slope, shade, fresh);
  if (f1 > 0.0) craters(uv / 0.014, 47.0, 0.6 * mix(0.3, 1.0, high), f1, foot / 0.014, sunDir, sunTan, slope, shade, fresh);
  if (f2 > 0.0) craters(uv / 0.005, 71.0, 0.68 * mix(0.25, 1.0, high), f2, foot / 0.005, sunDir, sunTan, slope, shade, fresh);
  if (f3 > 0.0) craters(uv / 0.0018, 97.0, 0.74 * mix(0.3, 1.0, high), f3, foot / 0.0018, sunDir, sunTan, slope, shade, fresh);

  // regolith grain — on a rotated lattice, so it never lines up into a grid
  float fg = 1.0 - smoothstep(0.3, 0.7, foot / 0.0004);
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  vec3 grain = vnoise(rot * uv * 1500.0 + 11.0);
  slope += fg * 0.08 * (grain.yz * rot);

  float alb = mix(0.66, 1.0, high) * (1.0 + 0.45 * fresh + fg * 0.12 * (grain.x - 0.5));

  vec3 n = normalize(n0 - slope.x * ew - slope.y * es);
  float mu0 = max(dot(n, uSun), 0.0);
  float mu = max(dot(n, -rd), 0.0);
  // Regolith throws light back the way it came (Lommel–Seeliger), which is
  // why the far ground brightens toward the horizon; blend it with Lambert.
  float lit = mix(mu0, mu0 / (mu0 + mu + 0.05), 0.5) * (1.0 - 0.93 * shade);
  float amb = 0.035 + 0.03 * dot(n, n0);
  vec3 base = vec3(0.6, 0.585, 0.56) * alb * (vec3(1.0, 0.96, 0.9) * lit + vec3(0.5, 0.6, 0.9) * amb);

  // night: a dim, moody exposure that leaves room for the text on top
  vec3 col = pow(1.0 - exp(-base * 1.05), vec3(1.0 / 2.2));
  // day: the same ground, lifted into a pale, low-contrast key
  float lum = dot(pow(1.0 - exp(-base * 2.4), vec3(1.0 / 2.2)), vec3(0.3, 0.59, 0.11));
  vec3 dayCol = mix(vec3(0.66, 0.7, 0.78), vec3(0.97, 0.955, 0.93), smoothstep(0.05, 0.85, lum));
  col = mix(col, dayCol, uDay);

  gl_FragColor = vec4(col, 1.0) * cover + halo * (1.0 - cover);
}`;

    // Shader compilation is the one expensive step in here. Every "is it done
    // yet?" query in WebGL blocks the main thread until the driver finishes —
    // so where the browser offers KHR_parallel_shader_compile we poll its
    // non-blocking flag instead, and touch nothing else until it says yes.
    const initGL = () =>
      new Promise((resolve) => {
        const fail = () => {
          gl = null;
          resolve(false);
        };
        try {
          const opts = {
            alpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            premultipliedAlpha: true,
            powerPreference: "default",
            // a software rasteriser would run this shader on the CPU and wreck
            // the frame rate — those machines keep the plain CSS ground
            failIfMajorPerformanceCaveat: true,
          };
          gl = canvas.getContext("webgl", opts) || canvas.getContext("experimental-webgl", opts);
          if (!gl) return resolve(false);

          // the terrain needs real float precision; mediump would turn it to mush
          const hp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
          if (!hp || hp.precision < 20) return fail();

          const parallel = gl.getExtension("KHR_parallel_shader_compile");
          const shader = (type, src) => {
            const sh = gl.createShader(type);
            gl.shaderSource(sh, src);
            gl.compileShader(sh);
            return sh;
          };
          const prog = gl.createProgram();
          gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
          gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
          gl.bindAttribLocation(prog, 0, "p");
          gl.linkProgram(prog);

          const finish = () => {
            try {
              if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return fail();
              gl.useProgram(prog);

              // one oversized triangle covers the canvas
              gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
              gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
              gl.enableVertexAttribArray(0);
              gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

              U = {};
              for (const name of ["uRes", "uTanY", "uPitch", "uAlt", "uTravel", "uWarp", "uDay", "uSun"]) {
                U[name] = gl.getUniformLocation(prog, name);
              }
              gl.uniform3f(U.uSun, SUN[0], SUN[1], SUN[2]);
              resolve(true);
            } catch (e) {
              fail();
            }
          };

          if (!parallel) return finish();
          const poll = () => {
            if (lost || !gl) return resolve(false);
            if (gl.getProgramParameter(prog, parallel.COMPLETION_STATUS_KHR)) finish();
            else setTimeout(poll, 40);
          };
          poll();
        } catch (e) {
          fail();
        }
      });

    const boot = async () => {
      canvas.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        lost = true;
        ready = false;
        shown = false;
        backdrop.classList.remove("has-ground");
      });
      canvas.addEventListener("webglcontextrestored", async () => {
        lost = false;
        last = null;
        ready = await initGL();
      });
      last = null;
      ready = await initGL();
    };

    // A procedural shader pays for every pixel, so the backing store is
    // capped: the ground is soft by nature and upscales without complaint.
    // `q` (1 → 0.5) is the governor's quality factor.
    const resize = (w, h, q) => {
      let k = Math.min(window.devicePixelRatio || 1, 1.5) * q;
      const budget = 1.8e6 * q * q;
      if (w * h * k * k > budget) k = Math.sqrt(budget / (w * h));
      const nw = Math.max(1, Math.round(w * k));
      const nh = Math.max(1, Math.round(h * k));
      if (nw !== bw || nh !== bh) {
        bw = nw;
        bh = nh;
        canvas.width = nw;
        canvas.height = nh;
        last = null; // resizing clears the canvas
      }
    };

    // s: { pitch, travel, tanY, alt, warp, day } — returns true if it drew
    const render = (s) => {
      if (!ready || lost || !gl) return false;
      if (
        last &&
        Math.abs(s.pitch - last.pitch) < 1e-6 &&
        Math.abs(s.travel - last.travel) < 1e-7 &&
        Math.abs(s.day - last.day) < 1e-4 &&
        s.tanY === last.tanY &&
        s.alt === last.alt &&
        s.warp === last.warp
      ) {
        return false;
      }
      last = { ...s };

      gl.viewport(0, 0, bw, bh);
      gl.uniform2f(U.uRes, bw, bh);
      gl.uniform1f(U.uTanY, s.tanY);
      gl.uniform1f(U.uPitch, s.pitch);
      gl.uniform1f(U.uAlt, s.alt);
      gl.uniform1f(U.uTravel, s.travel);
      gl.uniform1f(U.uWarp, s.warp);
      gl.uniform1f(U.uDay, s.day);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (!shown) {
        shown = true;
        backdrop.classList.add("has-ground");
      }
      return true;
    };

    return { boot, resize, render };
  })();

  /* ======================================================================
     6. STARFIELD — three parallax depths, twinkle, the odd shooting star
     The ground canvas sits on top, so stars simply set behind the horizon.
     ====================================================================== */
  const Stars = (() => {
    const canvas = $("#stars");
    const ctx = canvas.getContext("2d");
    const COLORS = ["#e6ecff", "#ffe9c6", "#b9ccff"];
    const PARALLAX = [0.025, 0.06, 0.12]; // fraction of scroll each depth moves
    const DRIFT = [3, 7, 13]; // px of counter-drift against the cursor
    let W = 0;
    let H = 0;
    let stars = [];
    let meteor = null;
    let nextMeteor = 0;

    // seeded, so the sky is the same sky after every resize
    const rng = (seed) => () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const build = (w, h, frugal) => {
      W = w;
      H = h;
      meteor = null;
      const dpr = Math.min(window.devicePixelRatio || 1, frugal ? 1 : 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const rand = rng(20261111);
      const count = clamp(Math.round((W * H) / 3000), 120, 620);
      stars = [];
      for (let i = 0; i < count; i++) {
        const roll = rand();
        const layer = roll < 0.58 ? 0 : roll < 0.88 ? 1 : 2;
        const big = rand();
        const tint = rand();
        stars.push({
          x: rand() * W,
          y: rand() * H,
          layer,
          r: layer === 0 ? 0.45 + big * 0.4 : layer === 1 ? 0.6 + big * 0.6 : 0.9 + big * big * 1.1,
          a: 0.3 + rand() * 0.7,
          tw: rand() < 0.4 ? 0.25 + rand() * 0.5 : 0.08,
          sp: 0.5 + rand() * 1.9,
          ph: rand() * TAU,
          c: tint < 0.68 ? 0 : tint < 0.88 ? 1 : 2,
        });
      }
      stars.sort((a, b) => a.c - b.c); // one fillStyle change per colour
    };

    const spawnMeteor = (t) => {
      const fromLeft = Math.random() < 0.5;
      const angle = (fromLeft ? 1 : -1) * (0.32 + Math.random() * 0.3);
      const speed = 620 + Math.random() * 420;
      meteor = {
        x: W * (fromLeft ? 0.05 + Math.random() * 0.5 : 0.45 + Math.random() * 0.5),
        y: H * (0.04 + Math.random() * 0.25),
        vx: Math.sin(angle) * speed * 1.6,
        vy: Math.cos(angle) * speed * 0.55,
        t0: t,
        dur: 0.75 + Math.random() * 0.5,
        len: 130 + Math.random() * 130,
      };
    };

    // t seconds · y scroll px · mx eased cursor −1…1 · floor: the lowest point
    // of the horizon, px — anything under it is hidden by the ground anyway.
    // Returns true while a shooting star is in flight.
    const draw = (t, y, mx, floor, still) => {
      ctx.clearRect(0, 0, W, H);
      let color = -1;

      for (const s of stars) {
        let sy = s.y - y * PARALLAX[s.layer];
        sy = ((sy % H) + H) % H;
        if (sy > floor) continue;
        const sx = s.x - mx * DRIFT[s.layer];
        const a = still ? s.a : s.a * (1 - s.tw + s.tw * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph)));
        if (s.c !== color) {
          color = s.c;
          ctx.fillStyle = COLORS[color];
        }
        ctx.globalAlpha = a;
        if (s.r < 0.9) {
          ctx.fillRect(sx - s.r, sy - s.r, s.r * 2, s.r * 2);
        } else {
          ctx.beginPath();
          ctx.arc(sx, sy, s.r, 0, TAU);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      if (still) return false;
      if (!nextMeteor) nextMeteor = t + 2.5 + Math.random() * 3;
      if (!meteor && t > nextMeteor) spawnMeteor(t);
      if (meteor) {
        const p = (t - meteor.t0) / meteor.dur;
        if (p >= 1) {
          meteor = null;
          nextMeteor = t + 5 + Math.random() * 8;
        } else {
          const hx = meteor.x + meteor.vx * p * meteor.dur;
          const hy = meteor.y + meteor.vy * p * meteor.dur;
          const v = Math.hypot(meteor.vx, meteor.vy);
          const tail = meteor.len * Math.min(1, p * 4);
          const tx = hx - (meteor.vx / v) * tail;
          const ty = hy - (meteor.vy / v) * tail;
          const env = Math.sin(Math.PI * p);
          const grad = ctx.createLinearGradient(hx, hy, tx, ty);
          grad.addColorStop(0, `rgba(255,255,255,${(0.95 * env).toFixed(3)})`);
          grad.addColorStop(0.25, `rgba(200,220,255,${(0.45 * env).toFixed(3)})`);
          grad.addColorStop(1, "rgba(200,220,255,0)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(hx, hy);
          ctx.lineTo(tx, ty);
          ctx.stroke();
        }
      }
      return !!meteor;
    };

    return { build, draw };
  })();

  /* ======================================================================
     7. THE BEND — the page wraps over the Moon's curve
     Seen from the side, the page is a strip that lies flat through the
     middle of the screen and curls away from you above and below it, like a
     label on a great wheel. Each block of content is one flat facet laid on
     that curve: it tilts back, sinks away and draws in toward the centre as
     it nears the top or bottom of the screen — and it does so in step with
     the ground turning underneath.

     The curve is tabulated once. Per frame, each block near the screen costs
     two table lookups and one transform; blocks out of sight cost nothing.
     ====================================================================== */
  const Bend = (() => {
    const SEL =
      ".hero-title, .hero-role, .hero-desc, .hero-actions, .hero-stats, .hero-visual, .sec-head, " +
      ".about-text, .about-card, .skill-card, .proj, .tl-item, .hl, .contact-info, .contact-form, " +
      ".outro-inner, .footer-inner";

    // The curve's shape, with u = distance from the middle of the screen in
    // half-screen-heights (so the top and bottom edges are at u = ∓1).
    const FLAT = 0.18; // the strip is perfectly flat out to here …
    const FULL = 1.45; // … and stops curling here, just off screen
    const TILT = 50 * DEG; // the lean reached at FULL
    const POW = 1.7; // how late the curl comes on: higher keeps more of the middle flat
    const DIST = 2.2; // the eye's distance from the page, in half-screen-heights
    const N = 104;
    const UMAX = 2.6;

    // Yt: how far down the screen the strip has got after u of page;
    // Zt: how far it has sunk away from the eye.
    const Yt = new Float32Array(N + 1);
    const Zt = new Float32Array(N + 1);
    const SPAN = 0.06; // the shortest stretch of curve a facet is fitted to
    let edge = 0; // the page distance that lands on the screen's edge once bent
    let reach = 0; // past this a block is wholly off screen, bent or not
    {
      const du = UMAX / N;
      for (let i = 0; i < N; i++) {
        const a = (i + 0.5) * du;
        const phi = TILT * Math.pow(clamp((a - FLAT) / (FULL - FLAT)), POW);
        Yt[i + 1] = Yt[i] + Math.cos(phi) * du;
        Zt[i + 1] = Zt[i] + Math.sin(phi) * du;
        const onScreen = Yt[i + 1] / (1 + Zt[i + 1] / DIST);
        if (!edge && onScreen > 1.02) edge = (i + 1) * du;
        if (!reach && onScreen > 1.12) reach = (i + 1) * du;
      }
      edge = edge || UMAX - SPAN;
      reach = reach || UMAX - SPAN;
    }

    const units = $$(SEL).map((el) => ({ el, top: 0, h: 0, cx: 0, on: false, last: "" }));
    const steps = units.filter((b) => b.el.classList.contains("tl-item")).map((b) => ({ b, f: -1 }));
    for (const b of units) b.el.classList.add("bend");

    let oY = 0;
    let oZ = 0;
    // where the point u of the page sits on the curve; k (0–1) is how much of
    // the curl applies — it eases to nothing at the very top and end of the
    // page, so the first and the last screen rest flat
    const look = (u, k) => {
      const a = Math.min(Math.abs(u), UMAX);
      const x = a * (N / UMAX);
      const i = Math.min(x | 0, N - 1);
      const f = x - i;
      const yv = Yt[i] + (Yt[i + 1] - Yt[i]) * f;
      oY = (u < 0 ? -1 : 1) * (a + (yv - a) * k);
      oZ = (Zt[i] + (Zt[i + 1] - Zt[i]) * f) * k;
    };

    // layout positions, free of any transform (offsets ignore transforms)
    const measure = () => {
      for (const b of units) {
        let x = 0;
        let y = 0;
        for (let n = b.el; n; n = n.offsetParent) {
          x += n.offsetLeft;
          y += n.offsetTop;
        }
        b.top = y;
        b.h = b.el.offsetHeight;
        b.cx = x + b.el.offsetWidth / 2;
      }
    };

    const release = (b) => {
      if (!b.on) return;
      b.on = false;
      b.last = "";
      b.el.style.transform = "";
      b.el.style.willChange = "";
    };

    const update = (y, vw, vh, max) => {
      const H = vh / 2;
      const mid = y + H;
      const d = DIST * H;
      const kTop = smooth(clamp(y / (vh * 0.7)));
      const kBot = smooth(clamp((max - y) / (vh * 0.7)));

      for (const b of units) {
        const t = (b.top - mid) / H;
        const e = t + b.h / H;
        if (e <= -reach || t >= reach || b.h === 0) {
          release(b);
          continue;
        }
        // Only the stretch that is on screen shapes the facet. So a block
        // taller than the screen lies flat while its middle is being read,
        // and one just arriving takes the lean of the curve at the edge.
        let t1 = Math.max(t, -edge);
        let e1 = Math.min(e, edge);
        if (e1 - t1 < SPAN) {
          if (t + e > 0) e1 = t1 + SPAN;
          else t1 = e1 - SPAN;
        }
        look(t1, t1 < 0 ? kTop : kBot);
        const y0 = oY;
        const z0 = oZ;
        look(e1, e1 < 0 ? kTop : kBot);
        const y1 = oY;
        const z1 = oZ;

        // the facet is the chord between those two points on the curve
        const a = -Math.atan2(z1 - z0, y1 - y0);
        const sc = (t + e) / 2; // the block's own middle
        const ym = (t1 + e1) / 2 - sc; // the chord's middle, measured from it
        const ty = ((y0 + y1) / 2 - sc - ym * Math.cos(a)) * H;
        const tz = (-(z0 + z1) / 2 - ym * Math.sin(a)) * H;

        let tf = "none";
        if (Math.abs(a) > 2e-4 || Math.abs(ty) > 0.02 || Math.abs(tz) > 0.02) {
          // perspective from the middle of the screen, not of the block
          const ox = (vw / 2 - b.cx).toFixed(1);
          const oy = (-sc * H).toFixed(1);
          tf =
            `translate3d(${ox}px,${oy}px,0) perspective(${d.toFixed(0)}px) ` +
            `translate3d(${-ox}px,${(ty - oy).toFixed(2)}px,${tz.toFixed(2)}px) rotateX(${a.toFixed(5)}rad)`;
        }
        if (!b.on) {
          b.on = true;
          b.el.style.willChange = "transform"; // one steady layer while in play
        }
        if (tf !== b.last) {
          b.last = tf;
          b.el.style.transform = tf;
        }
      }
    };

    // the lit part of the timeline's line, one stretch per entry
    const walkLine = (y, vh) => {
      for (let i = 0; i < steps.length - 1; i++) {
        const s = steps[i];
        const len = Math.max(1, steps[i + 1].b.top - s.b.top);
        const f = Math.round(clamp((y + vh * 0.62 - (s.b.top + 37)) / len) * 500) / 500;
        if (f !== s.f) {
          s.f = f;
          s.b.el.style.setProperty("--f", f);
        }
      }
    };

    return { measure, update, walkLine };
  })();

  /* ======================================================================
     8. MEASURE — all layout reads happen here, once per resize
     ====================================================================== */
  const navFill = $(".nav-progress i");
  const glow = $("#cursor-glow");
  const navSections = $$("main section[id]");

  const M = {
    vw: 0,
    vh: 0,
    max: 1,
    tops: [],
    endStart: 1, // scroll offset at which the outro starts to come into view
    skyW: 0,
    skyH: 0,
    dip: 0.24, // how far below level the horizon lies, radians
    cam: { tanY: 0.466, alt: 0.03, warp: 0 },
    // where the horizon sits, as a fraction of the screen height from the top
    hz: { hero: 0.79, walk: 0.63, end: 0.76 },
    sag: 0, // how far the horizon drops from the middle of the screen to its edge, px
    walkK: 0, // moon radii walked per px scrolled
  };

  // camera pitch that puts the horizon `frac` of the way down the screen
  const pitchFor = (frac) => M.dip + Math.atan((1 - 2 * frac) * M.cam.tanY);

  const measure = () => {
    const sy = window.scrollY;
    const vw = root.clientWidth;
    const vh = window.innerHeight;
    M.vw = vw;
    M.vh = vh;
    M.max = Math.max(1, root.scrollHeight - vh);

    M.tops = navSections.map((el) => ({ id: el.id, top: el.getBoundingClientRect().top + sy }));

    Bend.measure();
    M.endStart = clamp(outro.getBoundingClientRect().top + sy - vh, 0, M.max - 1);

    // ---- the camera over the ground ----
    const bw = backdrop.clientWidth;
    const bh = Math.max(1, backdrop.clientHeight);
    const aspect = bw / bh;
    const narrow = aspect < 1;
    const tanY = Math.tan((narrow ? 29 : 25) * DEG);
    const alt = 0.03;
    M.dip = Math.acos(1 / (1 + alt));
    // The true curvature at this height sags the horizon by `sag` px at the
    // screen's edge. That reads beautifully on a wide screen but is barely
    // there on a phone, so narrow screens get a little extra bow.
    const sag = (Math.sin(2 * M.dip) / 8) * aspect * aspect * tanY * bh;
    const want = clamp(bw * 0.066, 24, 104);
    M.sag = want;
    M.cam = { tanY, alt, warp: Math.max(0, want - sag) / (aspect * aspect * bh * 0.5) };
    M.hz = narrow ? { hero: 0.83, walk: 0.72, end: 0.78 } : { hero: 0.79, walk: 0.63, end: 0.76 };
    // On screen the horizon is (very nearly) an arc of this radius; the CSS
    // stand-in ground and the reading veil are drawn on the same circle.
    backdrop.style.setProperty("--rc", Math.round((bw * bw) / (8 * want)) + "px");
    // walking pace: the nearest ground drifts at about half the page's speed
    const below = pitchFor(M.hz.walk) + Math.atan(tanY);
    M.walkK = (0.52 * ((2 * tanY) / bh) * alt) / Math.pow(Math.sin(below), 2);

    Ground.resize(bw, bh, quality);

    // The star canvas ignores the small height changes a mobile URL bar makes.
    const frugal = quality < 0.7;
    if (bw !== M.skyW || Math.abs(bh - M.skyH) > 140 || frugal !== M.skyFrugal) {
      M.skyW = bw;
      M.skyH = bh;
      M.skyFrugal = frugal;
      Stars.build(bw, bh, frugal);
      starsDirty = true;
    }
    layoutDirty = true;
  };

  /* ======================================================================
     9. THE LOOP
     ====================================================================== */
  let needMeasure = true;
  let layoutDirty = true; // positions were re-measured: re-lay the bend
  let starsDirty = true;
  let starsAt = 0; // when the sky was last drawn
  let meteorLive = false;
  // The governor: `quality` scales the ground's resolution. It only ever
  // steps down, and only while the ground is actually being redrawn.
  let quality = 1;
  const gov = { last: 0, n: 0, sum: 0, idleN: 0, idleSum: 0, period: 1000 / 60, before: 0, done: false };
  let ptrX = 0; // cursor, −1…1 across the screen
  let easeX = 0;
  let glowX = 0;
  let glowY = 0;
  let glowTX = 0;
  let glowTY = 0;
  let lastActive = null;
  let lastStuck = null;
  let lastY = -1;
  let lastFrac = -1;
  let lastTheme = theme;
  let drewLast = false;
  const t0 = performance.now();

  addEventListener("resize", () => (needMeasure = true), { passive: true });
  if ("ResizeObserver" in window) {
    // fonts and lazy images change the page height after first measure
    new ResizeObserver(() => (needMeasure = true)).observe(document.body);
  }
  addEventListener("load", () => (needMeasure = true));

  if (finePointer && !reduced) {
    addEventListener(
      "pointermove",
      (e) => {
        ptrX = (e.clientX / M.vw) * 2 - 1;
        glowTX = e.clientX;
        glowTY = e.clientY;
        if (!glow.classList.contains("is-on")) {
          glowX = glowTX;
          glowY = glowTY;
          glow.classList.add("is-on");
        }
      },
      { passive: true },
    );
    root.addEventListener("mouseleave", () => glow.classList.remove("is-on"));
  }

  const frame = (now) => {
    if (lenis) lenis.raf(now);

    // The governor. Frames in which nothing heavy was drawn tell us the
    // display's own rhythm (60 Hz, 120 Hz …); if frames that redraw the
    // ground run well behind it, the ground gives up some resolution.
    const dt = now - gov.last;
    gov.last = now;
    // (the first seconds are left out: the page is still settling then)
    if (dt > 0 && dt < 120 && !document.hidden && now - t0 > 2500) {
      if (drewLast && !gov.done) {
        gov.n++;
        gov.sum += dt;
        if (gov.n === 36) {
          const avg = gov.sum / gov.n;
          gov.n = gov.sum = 0;
          if (gov.before && avg > gov.before * 0.92) {
            // the last step bought nothing: the ground isn't what is slow
            // here, so give the resolution back and stop adjusting
            quality = Math.min(1, quality / 0.8);
            gov.done = true;
            needMeasure = true;
          } else if (avg > gov.period * 1.32 && quality > 0.5) {
            gov.before = avg;
            quality = Math.max(0.5, quality * 0.8);
            needMeasure = true;
          } else {
            gov.before = 0;
          }
        }
      } else if (!drewLast) {
        gov.idleN++;
        gov.idleSum += dt;
        if (gov.idleN === 24) {
          gov.period = clamp(Math.min(gov.period, gov.idleSum / gov.idleN), 1000 / 144, 1000 / 60);
          gov.idleN = gov.idleSum = 0;
        }
      }
    }

    if (needMeasure) {
      needMeasure = false;
      measure();
    }

    const t = (now - t0) / 1000;
    const y = window.scrollY;
    const { vh } = M;
    const scrolled = y !== lastY;
    const moved = scrolled || layoutDirty;
    lastY = y;
    layoutDirty = false;

    /* ---- eased inputs ---- */
    easeX += (ptrX - easeX) * 0.045;
    const dayTarget = theme === "light" ? 1 : 0;
    day += (dayTarget - day) * 0.09;
    if (Math.abs(dayTarget - day) < 0.002) day = dayTarget;

    /* ---- the walk ---- */
    // look out to the horizon in the hero, down at the path while reading,
    // and back up at the sky as the page ends (a still view holds the first)
    let frac = M.hz.hero;
    if (!reduced) {
      const leave = smooth(clamp(y / (vh * 0.9)));
      const arrive = smooth(clamp((y - M.endStart) / Math.max(1, M.max - M.endStart)));
      frac = lerp(lerp(M.hz.hero, M.hz.walk, leave), M.hz.end, arrive);
    }
    drewLast = Ground.render({
      pitch: pitchFor(frac),
      travel: reduced ? 0 : y * M.walkK,
      tanY: M.cam.tanY,
      alt: M.cam.alt,
      warp: M.cam.warp,
      day,
    });
    // the CSS stand-in ground and the reading veil follow the same horizon
    if (Math.abs(frac - lastFrac) > 0.0005) {
      lastFrac = frac;
      backdrop.style.setProperty("--horizon", (frac * 100).toFixed(2) + "%");
    }

    /* ---- the bend ---- */
    if (moved) {
      if (!reduced) Bend.update(y, M.vw, vh, M.max);
      Bend.walkLine(y, vh);
    }

    /* ---- stars ---- */
    // Every frame while something moves; otherwise the twinkle is refreshed
    // about fifteen times a second, which the eye can't tell from sixty.
    if (day < 0.999) {
      const floor = frac * M.skyH + M.sag + 6;
      if (!reduced) {
        const drifting = Math.abs(ptrX - easeX) > 0.004;
        if (moved || starsDirty || drifting || meteorLive || lastTheme !== theme || now - starsAt > 64) {
          meteorLive = Stars.draw(t, y, easeX, floor, false);
          starsAt = now;
          starsDirty = false;
        }
      } else if (starsDirty || moved || lastTheme !== theme) {
        Stars.draw(0, 0, 0, floor, true);
        starsDirty = false;
      }
    }
    lastTheme = theme;

    /* ---- cursor glow ---- */
    if (finePointer && !reduced && (Math.abs(glowTX - glowX) > 0.05 || Math.abs(glowTY - glowY) > 0.05)) {
      glowX += (glowTX - glowX) * 0.12;
      glowY += (glowTY - glowY) * 0.12;
      glow.style.transform = `translate3d(${glowX.toFixed(1)}px,${glowY.toFixed(1)}px,0)`;
    }

    /* ---- indicators (only touched when something changed) ---- */
    if (scrolled) {
      navFill.style.transform = `scaleX(${clamp(y / M.max).toFixed(4)})`;

      const stuck = y > 10;
      if (stuck !== lastStuck) {
        lastStuck = stuck;
        nav.classList.toggle("is-stuck", stuck);
      }
      toTop.classList.toggle("is-on", y > vh * 0.6);

      let active = null;
      for (const s of M.tops) if (s.top <= y + vh * 0.42) active = s.id;
      if (active !== lastActive) {
        lastActive = active;
        setActive(active);
      }
    }

    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);

  // WebGL starts only after the page has painted and the browser is idle, so
  // shader compilation never competes with the first render of the content.
  // Until then (or on machines without fast WebGL) the CSS ground stands in.
  const startGround = () => {
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 120));
    idle(() => Ground.boot(), { timeout: 1500 });
  };
  if (document.readyState === "complete") startGround();
  else addEventListener("load", startGround, { once: true });

  /* ======================================================================
     10. HERO — rotating role, counting stats
     ====================================================================== */
  // the rocket and its asteroids stop animating once the hero is off screen
  const heroEl = $(".hero");
  if (heroEl && "IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => heroEl.classList.toggle("is-away", !e.isIntersecting)).observe(heroEl);
  }

  const role = $("#role");
  if (role && !reduced && typeof role.animate === "function") {
    const roles = [
      "Full Stack Developer",
      "Competitive Programmer",
      "Open Source Contributor",
      "CSE @ PEC Chandigarh",
    ];
    let i = 0;
    let live = true;
    let timer = null;
    const ease = "cubic-bezier(0.16, 1, 0.3, 1)";

    const next = () => {
      if (!live || document.hidden) return;
      role
        .animate(
          [
            { transform: "translateY(0)", opacity: 1 },
            { transform: "translateY(-70%)", opacity: 0 },
          ],
          { duration: 380, easing: "cubic-bezier(0.7, 0, 0.84, 0)", fill: "forwards" },
        )
        .finished.then((anim) => {
          i = (i + 1) % roles.length;
          role.textContent = roles[i];
          anim.cancel();
          role.animate(
            [
              { transform: "translateY(70%)", opacity: 0 },
              { transform: "translateY(0)", opacity: 1 },
            ],
            { duration: 650, easing: ease },
          );
        })
        .catch(() => {});
    };

    new IntersectionObserver(([e]) => {
      live = e.isIntersecting;
      clearInterval(timer);
      if (live) timer = setInterval(next, 2800);
    }).observe($(".hero"));
  }

  const countUp = (el, delay) => {
    const end = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const dur = 1500;
    let start = null;
    el.textContent = (0).toFixed(decimals) + suffix;
    const step = (now) => {
      if (start === null) start = now + delay;
      const p = clamp((now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = (end * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // the stats fade in under CSS at about half a second; count up as they arrive
  if (!reduced && window.scrollY < innerHeight) {
    $$(".hero-stats [data-count]").forEach((dt, i) => countUp(dt, 450 + i * 120));
  }

  /* ======================================================================
     11. CARDS — a lit edge that tracks the cursor
     ====================================================================== */
  if (finePointer) {
    document.addEventListener(
      "pointermove",
      (e) => {
        const card = e.target.closest && e.target.closest(".card");
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left).toFixed(0) + "px");
        card.style.setProperty("--my", (e.clientY - r.top).toFixed(0) + "px");
      },
      { passive: true },
    );
  }

  /* ======================================================================
     12. CONTACT FORM — no backend on Pages, so compose a mail draft
     ====================================================================== */
  const form = $("#contact-form");
  if (form) {
    const note = $("#form-note");
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

  $("#year").textContent = new Date().getFullYear();
})();
