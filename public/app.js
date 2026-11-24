/* ══════════════════════════════════════════════════════════════
   app.js — پزشکت
══════════════════════════════════════════════════════════════ */

// ─── Mobile nav drawer ───────────────────────────────────────────────────────
function toggleMobileNav() {
  const overlay = document.getElementById('mobileNav');
  const hamburger = document.getElementById('hamburger');
  if (!overlay) return;
  const isOpen = overlay.classList.contains('open');
  if (isOpen) {
    overlay.classList.remove('open');
    hamburger && hamburger.classList.remove('active');
    document.body.style.overflow = '';
  } else {
    overlay.classList.add('open');
    hamburger && hamburger.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeMobileNavOutside(e) {
  // close only when clicking the dark backdrop (not the panel itself)
  if (e.target === document.getElementById('mobileNav')) {
    toggleMobileNav();
  }
}

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const overlay = document.getElementById('mobileNav');
    if (overlay && overlay.classList.contains('open')) toggleMobileNav();
  }
});

// ─── Footer collapsible columns (mobile) ─────────────────────────────────────
function toggleFooterCol(id) {
  // only act on mobile
  if (window.innerWidth > 768) return;
  const col = document.getElementById(id);
  if (!col) return;
  col.classList.toggle('open');
}

// ─── Carousel scroll ─────────────────────────────────────────────────────────
function scrollCarousel(id, dir) {
  const el = document.getElementById(id);
  if (el) el.scrollBy({ left: dir * 320, behavior: 'smooth' });
}

// ─── Doctor profile tabs ─────────────────────────────────────────────────────
function switchTab(el, name) {
  document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  const content = document.getElementById('tab-' + name);
  if (content) content.classList.add('active');
}

// ─── Day / time slot selection ───────────────────────────────────────────────
function selectDay(el) {
  document.querySelectorAll('.day-slot').forEach(d => d.classList.remove('selected'));
  el.classList.add('selected');
}
function selectTime(el) {
  if (el.classList.contains('busy')) return;
  document.querySelectorAll('.time-slot').forEach(t => t.classList.remove('selected'));
  el.classList.add('selected');
}

// ─── Booking form submit ──────────────────────────────────────────────────────
function bookAppointment(doctorId) {
  const selectedDay  = document.querySelector('.day-slot.selected');
  const selectedTime = document.querySelector('.time-slot.selected');
  const name  = document.getElementById('bookName')?.value.trim();
  const phone = document.getElementById('bookPhone')?.value.trim();

  if (!selectedDay || !selectedTime || !name || !phone) {
    showToast('لطفاً همه موارد را تکمیل کنید', 'error');
    return;
  }

  fetch('/api/appointment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      doctorId,
      name,
      phone,
      date: selectedDay.dataset.date,
      time: selectedTime.textContent.trim()
    })
  })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        showToast('نوبت شما با کد ' + data.ref + ' ثبت شد ✓', 'success');
        document.getElementById('bookingModal')?.classList.remove('open');
      } else {
        showToast(data.error || 'خطایی رخ داد', 'error');
      }
    })
    .catch(() => showToast('خطا در ارسال اطلاعات', 'error'));
}

// ─── Modal open/close ─────────────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
  document.body.style.overflow = '';
}

// ─── Toast notification ───────────────────────────────────────────────────────
function showToast(msg, type = '') {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'toast' + (type ? ' ' + type : '');
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => toast.classList.remove('show'), 3200);
}

// ─── FAQ accordion ───────────────────────────────────────────────────────────
document.addEventListener('click', e => {
  const q = e.target.closest('.faq-q');
  if (!q) return;
  const item = q.closest('.faq-item');
  if (!item) return;
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
});

// ─── Scroll-to-top button ─────────────────────────────────────────────────────
(function () {
  const isMobile = () => window.innerWidth <= 768;
  const btn = document.createElement('button');
  btn.textContent = '↑';
  btn.title = 'بازگشت به بالا';
  btn.setAttribute('aria-label', 'بازگشت به بالا');
  btn.style.cssText = [
    'position:fixed',
    'bottom:80px',   /* above bottom nav on mobile */
    'left:16px',
    'width:42px',
    'height:42px',
    'border-radius:50%',
    'background:var(--primary)',
    'color:#fff',
    'border:none',
    'font-size:19px',
    'cursor:pointer',
    'box-shadow:0 4px 16px rgba(13,191,140,.35)',
    'opacity:0',
    'transition:opacity .3s',
    'z-index:50',
  ].join(';');
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    const show = window.scrollY > 400;
    btn.style.opacity = show ? '1' : '0';
    btn.style.pointerEvents = show ? 'all' : 'none';
    // On desktop move closer to bottom corner
    btn.style.bottom = isMobile() ? '80px' : '24px';
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

// ─── Init on DOM ready ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Fade-in sections on scroll
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.section').forEach(s => {
    s.style.opacity = '0';
    s.style.transform = 'translateY(20px)';
    s.style.transition = 'opacity .45s ease, transform .45s ease';
    observer.observe(s);
  });
});
