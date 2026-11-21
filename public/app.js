// ─── Carousel scroll ─────────────────────────────────────────────────────────
function scrollCarousel(id, dir) {
  const el = document.getElementById(id);
  if (el) el.scrollBy({ left: dir * 360, behavior: "smooth" });
}

// ─── Hero search ──────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const heroSearch = document.getElementById("heroSearch");
  if (heroSearch) {
    heroSearch.addEventListener("submit", e => {
      e.preventDefault();
      const q = document.getElementById("heroQ").value.trim();
      if (q) window.location.href = "/doctors?q=" + encodeURIComponent(q);
    });
  }

  // Animate hero stats
  animateCounters();

  // Intersection observer for fade-in sections
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".section").forEach(s => {
    s.style.opacity = "0";
    s.style.transform = "translateY(24px)";
    s.style.transition = "opacity .5s ease, transform .5s ease";
    observer.observe(s);
  });
});

// ─── Animate number counters ─────────────────────────────────────────────────
function animateCounters() {
  document.querySelectorAll(".hero-stat strong").forEach(el => {
    const text = el.textContent.replace(/[^0-9]/g, "");
    if (!text) return;
    const target = parseInt(text);
    const prefix = el.textContent.replace(/[0-9,،]/g, "").trim();
    let current = 0;
    const step = Math.ceil(target / 60);
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = "+" + current.toLocaleString("fa-IR");
      if (current >= target) clearInterval(interval);
    }, 25);
  });
}

// ─── Scroll-to-top button ─────────────────────────────────────────────────────
(function () {
  const btn = document.createElement("button");
  btn.textContent = "↑";
  btn.title = "بازگشت به بالا";
  btn.style.cssText = "position:fixed;bottom:24px;left:24px;width:44px;height:44px;border-radius:50%;background:var(--blue);color:#fff;border:none;font-size:20px;cursor:pointer;box-shadow:0 4px 16px rgba(35,104,232,.3);opacity:0;transition:opacity .3s;z-index:50;";
  document.body.appendChild(btn);
  window.addEventListener("scroll", () => {
    btn.style.opacity = window.scrollY > 400 ? "1" : "0";
    btn.style.pointerEvents = window.scrollY > 400 ? "all" : "none";
  });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
})();
