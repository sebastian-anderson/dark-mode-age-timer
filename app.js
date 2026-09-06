$(document).ready(function () {
  // ---- Vertical nudge (per-display centering) ----
  // Read ?nudge=-100 from the URL and shift the timer vertically.
  // Negative moves it UP, positive moves it DOWN. Useful when one
  // display (e.g. a laptop) centers differently than the others:
  // point that display's Plash URL at ?dob=...&nudge=-100 and leave
  // your other monitors at the plain URL.
  (function applyNudge() {
    const p = new URLSearchParams(location.search);
    const raw = p.get("nudge");
    if (raw === null) return;
    const px = parseFloat(raw);
    if (Number.isFinite(px)) {
      document.documentElement.style.setProperty("--nudge", px + "px");
    }
  })();

  // ---- Helpers ----
  function parseISODateOnly(s) {
    // Accepts YYYY-MM-DD (avoids timezone surprises)
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    if (!m) return null;
    const y = +m[1], mo = +m[2], d = +m[3];
    const dt = new Date(y, mo - 1, d);
    return (dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d) ? dt : null;
  }

  function readDOBFromURL() {
    const p = new URLSearchParams(location.search);
    const s = (p.get("dob") || "").trim();           // e.g. ?dob=2005-09-14
    return parseISODateOnly(s);
  }

  // ---- Storage ----
  function save(dob) {
    const t = dob && dob.getTime();
    if (!Number.isFinite(t)) return false;           // reject invalid
    localStorage.setItem("dob", String(t));
    return true;
  }

  function load() {
    // 1) Prefer URL param if provided
    const urlDOB = readDOBFromURL();
    if (urlDOB) return urlDOB;

    // 2) Fallback to localStorage
    const raw = localStorage.getItem("dob");
    if (!raw) return -1;
    const ts = parseInt(raw, 10);
    if (!Number.isFinite(ts)) {
      // Clean up bad value like "NaN"
      localStorage.removeItem("dob");
      return -1;
    }
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) {
      localStorage.removeItem("dob");
      return -1;
    }
    return d;
  }

  // ---- Rendering ----
  function getAge(dob) {
    if (!(dob instanceof Date) || Number.isNaN(dob.getTime())) {
      return { year: "—", ms: "000000000" };
    }
    const now = Date.now();
    const duration = now - dob.getTime();
    if (!Number.isFinite(duration) || duration < 0) {
      return { year: "—", ms: "000000000" };
    }
    const years = duration / 31556900000; // average year length
    const parts = years.toFixed(9).split(".");
    return { year: parts[0], ms: parts[1] || "000000000" };
  }

  function renderAgeLoop(dob) {
    $("#choose").css("display", "none");
    $("#timer").css("display", "block");

    function tick() {
      const age = getAge(dob);
      $("#age").html(age.year + "<sup>." + age.ms + "</sup>");
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function renderChoose() {
    $("#choose").css("display", "block");
    $("#timer").css("display", "none");
  }

  // ---- Events ----
  $("#submit").on("click", function (e) {
    e.preventDefault();
    const input = $("#dob-input").val();         // expects YYYY-MM-DD
    const dob = parseISODateOnly(input) || new Date(input); // last-chance parse

    if (!dob || Number.isNaN(dob.getTime())) {
      // keep the chooser visible; do not save
      return;
    }
    if (save(dob)) {
      renderAgeLoop(dob);
    }
  });

  // ---- Bootstrap ----
  (function main() {
    const dob = load();
    if (dob !== -1) {
      renderAgeLoop(dob);
    } else {
      renderChoose();
    }
  })();
});
