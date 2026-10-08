// Mobile menu
const nav = document.getElementById("nav");
const navToggle = document.getElementById("navToggle");
navToggle.addEventListener("click", () => {
  nav.classList.toggle("is-open");
  navToggle.classList.toggle("is-open");
});
nav.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    nav.classList.remove("is-open");
    navToggle.classList.remove("is-open");
  })
);

// Header shadow on scroll
const header = document.getElementById("header");
window.addEventListener("scroll", () => {
  header.classList.toggle("is-scrolled", window.scrollY > 10);
});

// Reveal on scroll + count-up stats
const counted = new WeakSet();
function countUp(el) {
  if (counted.has(el)) return;
  counted.add(el);
  const target = +el.dataset.count;
  const start = performance.now();
  const duration = 1500;
  const step = (now) => {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.floor(target * (1 - Math.pow(1 - p, 3))).toLocaleString("vi-VN");
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      entry.target.querySelectorAll("[data-count]").forEach(countUp);
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// Course filter tabs
const tabs = document.querySelectorAll(".tab");
const courses = document.querySelectorAll(".course");
tabs.forEach((tab) =>
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    const level = tab.dataset.level;
    courses.forEach((c) => {
      const show = level === "all" || c.dataset.level.split(" ").includes(level);
      c.classList.toggle("is-hidden", !show);
    });
  })
);

// Testimonial slider
const track = document.querySelector(".slider__track");
const slides = track.children;
const dotsWrap = document.getElementById("sliderDots");
let current = 0;
let timer;

function goTo(i) {
  current = (i + slides.length) % slides.length;
  track.style.transform = `translateX(-${current * 100}%)`;
  dotsWrap.querySelectorAll("button").forEach((d, idx) => d.classList.toggle("is-active", idx === current));
}
function autoplay() {
  clearInterval(timer);
  timer = setInterval(() => goTo(current + 1), 5000);
}
[...slides].forEach((_, i) => {
  const dot = document.createElement("button");
  dot.setAttribute("aria-label", `Cảm nhận ${i + 1}`);
  dot.addEventListener("click", () => { goTo(i); autoplay(); });
  dotsWrap.appendChild(dot);
});
goTo(0);
autoplay();

// Pricing buttons preselect level in form
const levelSelect = document.getElementById("levelSelect");
document.querySelectorAll("[data-pick]").forEach((btn) =>
  btn.addEventListener("click", () => { levelSelect.value = btn.dataset.pick; })
);

// Registration form → Google Sheet (xem google-apps-script.js)
const SHEET_URL = "https://script.google.com/macros/s/AKfycbz6VC-DDVq_FVjB5dp7upsdo0x84DBxGzfk0nEWqV5mbcMpxYHOzebenjjucSM5JFA0/exec"; // Link Web app của Apps Script
const form = document.getElementById("regForm");
const msg = document.getElementById("formMsg");
const submitBtn = form.querySelector('button[type="submit"]');
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.className = "form__msg";
  let valid = true;

  const parent = form.parent;
  const phone = form.phone;
  [parent, phone].forEach((f) => f.classList.remove("is-invalid"));

  if (!parent.value.trim()) { parent.classList.add("is-invalid"); valid = false; }
  const phoneDigits = phone.value.replace(/\D/g, "");
  if (!/^0\d{9}$/.test(phoneDigits)) { phone.classList.add("is-invalid"); valid = false; }

  if (!valid) {
    msg.textContent = "Vui lòng nhập họ tên và số điện thoại hợp lệ (10 số).";
    msg.classList.add("err");
    return;
  }

  const data = Object.fromEntries(new FormData(form));
  data.goal = [...form.querySelectorAll('input[name="goal"]:checked')].map((c) => c.value).join(", ");

  submitBtn.disabled = true;
  submitBtn.textContent = "Đang gửi...";
  try {
    const res = await fetch(SHEET_URL, { method: "POST", body: new URLSearchParams(data) });
    const result = await res.json();
    if (!result.ok) throw new Error(result.error);

    msg.textContent = `Cảm ơn anh/chị ${data.parent}! Trung tâm sẽ liên hệ trong 24 giờ.`;
    msg.classList.add("ok");
    form.reset();
  } catch (err) {
    console.error("Gửi đăng ký thất bại:", err);
    msg.textContent = "Gửi chưa thành công. Anh/chị vui lòng thử lại hoặc gọi/Zalo 0934 729 644.";
    msg.classList.add("err");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Gửi đăng ký";
  }
});

document.getElementById("year").textContent = new Date().getFullYear();
