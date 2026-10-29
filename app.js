const BUSINESS = {
  name: "СЕВЕР",
  phone: "",
  address: "",
  hours: "Ежедневно · 09:00 — 21:00",
  open: "09:00",
  close: "21:00",
  slotMinutes: 60,
  mapUrl: "",
  telegramUsername: "YOUR_TELEGRAM_USERNAME"
};

const SERVICES = [
  { id: "express", name: "Экспресс-мойка", description: "Быстро освежить кузов и стёкла.", price: 900, duration: 30 },
  { id: "care", name: "Бережный уход", description: "Тщательная мойка кузова и бережная сушка.", price: 1600, duration: 60 },
  { id: "interior", name: "Чистый салон", description: "Уборка салона и чистка стёкол.", price: 2200, duration: 90 },
  { id: "complete", name: "Полный уход", description: "Комплексный уход за кузовом и салоном.", price: 3500, duration: 120 }
];

const byId = (id) => document.getElementById(id);
const formatPrice = (value) => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
const displayName = BUSINESS.name.trim() || "АВТОМОЙКА";

document.title = `${displayName} — автомойка и детейлинг`;
document.querySelectorAll("[data-business-name]").forEach((item) => { item.textContent = displayName; });
byId("service-list").replaceChildren();
byId("service-select").replaceChildren();

const statusElement = document.querySelector("[data-open-status]");
const openingMinute = toMinutes(BUSINESS.open);
const closingMinute = toMinutes(BUSINESS.close);
const now = new Date();
const nowMinute = now.getHours() * 60 + now.getMinutes();
statusElement.textContent = nowMinute >= openingMinute && nowMinute < closingMinute
  ? `Открыты до ${BUSINESS.close}`
  : nowMinute < openingMinute
    ? `Откроемся в ${BUSINESS.open}`
    : `Завтра с ${BUSINESS.open}`;

SERVICES.forEach((service, index) => {
  const row = document.createElement("article");
  row.className = "service-row";

  const number = document.createElement("span");
  number.className = "service-index";
  number.textContent = `0${index + 1} / 04`;
  const name = document.createElement("h3");
  name.className = "service-name";
  name.textContent = service.name;
  const description = document.createElement("p");
  description.className = "service-description";
  description.textContent = service.description;
  const duration = document.createElement("span");
  duration.className = "service-duration";
  duration.textContent = `${service.duration} мин`;
  const price = document.createElement("strong");
  price.className = "service-price";
  price.append(`от ${formatPrice(service.price)}`);
  const arrow = document.createElement("span");
  arrow.className = "service-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "↗";
  row.append(number, name, description, duration, price, arrow);
  byId("service-list").append(row);

  const option = document.createElement("option");
  option.value = service.id;
  option.textContent = `${service.name} — от ${formatPrice(service.price)}`;
  byId("service-select").append(option);
});

byId("service-list").setAttribute("aria-label", "Услуги автомойки и демонстрационные цены");
document.querySelector("[data-address]").textContent = BUSINESS.address || "Добавьте адрес автомойки";
document.querySelector("[data-hours]").textContent = BUSINESS.hours;
document.querySelector("[data-hours-short]").textContent = BUSINESS.hours.replace(/^Ежедневно\s*[·—-]?\s*/i, "");

const phone = BUSINESS.phone.trim();
const phoneDigits = phone.replace(/[^\d+]/g, "");
document.querySelector("[data-phone]").textContent = phone || "Добавьте номер телефона";
if (phoneDigits.replace(/\D/g, "").length >= 7) {
  document.querySelectorAll("[data-phone-link]").forEach((link) => {
    link.href = `tel:${phoneDigits}`;
    link.hidden = false;
  });
  document.querySelector("[data-phone-link]").textContent = `Позвонить ${phone} ↗`;
  document.querySelectorAll("[data-phone-link]")[1].textContent = "Позвонить ↗";
} else {
  document.querySelectorAll("[data-phone-link]").forEach((link) => { link.hidden = true; });
}

const mapUrl = BUSINESS.mapUrl.trim();
if (mapUrl) {
  let parsedMapUrl;
  try {
    parsedMapUrl = new URL(mapUrl);
  } catch {
    parsedMapUrl = null;
  }
  if (parsedMapUrl && ["https:", "http:"].includes(parsedMapUrl.protocol)) {
    document.querySelectorAll("[data-map-link]").forEach((link) => {
      link.href = parsedMapUrl.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.hidden = false;
    });
    byId("map-copy").textContent = BUSINESS.address || "Расположение автомойки на карте";
  }
}

const dateInput = byId("booking-date");
const timeSelect = byId("booking-time");
const currentDate = new Date();
const today = new Date(currentDate.getTime() - currentDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
dateInput.min = today;

function toMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function populateSlots() {
  timeSelect.replaceChildren();
  if (!dateInput.value) {
    timeSelect.add(new Option("Сначала выберите дату", ""));
    return;
  }

  const start = toMinutes(BUSINESS.open);
  const end = toMinutes(BUSINESS.close);
  const step = Number.isFinite(BUSINESS.slotMinutes) ? Math.max(15, BUSINESS.slotMinutes) : 60;
  const selectedService = SERVICES.find((service) => service.id === byId("service-select").value);
  const duration = selectedService?.duration ?? 0;
  const isToday = dateInput.value === today;
  const clock = new Date();
  const nowMinutes = clock.getHours() * 60 + clock.getMinutes();
  let available = 0;

  for (let minute = start; minute + duration <= end; minute += step) {
    if (isToday && minute <= nowMinutes) continue;
    const label = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
    timeSelect.add(new Option(label, label));
    available++;
  }

  if (!available) timeSelect.add(new Option("Нет доступного времени — выберите другой день", ""));
}
dateInput.addEventListener("change", populateSlots);
byId("service-select").addEventListener("change", populateSlots);

byId("booking-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const selectedService = SERVICES.find((service) => service.id === formData.get("service"));
  const name = String(formData.get("name")).trim();
  const phoneValue = String(formData.get("phone")).trim();
  const result = byId("form-result");

  if (!selectedService || name.length < 2 || !/^[+()\d\s-]{7,24}$/.test(phoneValue)) {
    result.textContent = "Проверьте имя и телефон. Для номера допустимы цифры, пробелы, скобки и знак +.";
    result.hidden = false;
    return;
  }

  const visitDate = new Date(`${formData.get("date")}T12:00:00`).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const telegramUsername = BUSINESS.telegramUsername.trim().replace(/^@/, "");
  if (!/^[A-Za-z0-9_]{5,32}$/.test(telegramUsername) || telegramUsername === "YOUR_TELEGRAM_USERNAME") {
    result.textContent = "Сначала укажите Telegram username владельца в BUSINESS.telegramUsername в файле app.js.";
    result.hidden = false;
    return;
  }

  result.replaceChildren();
  const heading = document.createElement("strong");
  heading.textContent = "Черновик подготовлен — запись ещё не создана.";
  const summary = document.createElement("p");
  summary.textContent = `Telegram откроется с черновиком заявки. Проверьте его и нажмите «Отправить» — только тогда сообщение будет отправлено владельцу. Сайт не сохраняет данные; запись не подтверждена.`;
  const telegramLink = document.createElement("a");
  telegramLink.className = "button button-lime";
  telegramLink.href = `https://t.me/${telegramUsername}?text=${encodeURIComponent([
    `Заявка на запись в ${displayName}`,
    `Услуга: ${selectedService.name}`,
    `Дата: ${visitDate}`,
    `Время: ${formData.get("time")}`,
    `Имя: ${name}`,
    `Телефон: ${phoneValue}`
  ].join("\n"))}`;
  telegramLink.target = "_blank";
  telegramLink.rel = "noopener noreferrer";
  telegramLink.textContent = "Открыть Telegram с черновиком";
  result.append(heading, summary, telegramLink);
  result.hidden = false;
  window.open(telegramLink.href, "_blank", "noopener,noreferrer");
});

let installPrompt = null;
const installButton = byId("install-button");
const installHelp = byId("install-help");
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
});
window.addEventListener("appinstalled", () => {
  installPrompt = null;
  installButton.textContent = "Приложение установлено";
  installButton.disabled = true;
});
installButton.addEventListener("click", async () => {
  if (installPrompt) {
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    return;
  }

  installHelp.textContent = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    ? "В Safari нажмите «Поделиться», затем выберите «На экран Домой»."
    : "Откройте меню браузера и выберите «Установить приложение» или «Добавить на главный экран». Для установки нужен HTTPS или localhost.";
  installHelp.hidden = false;
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!prefersReducedMotion && "IntersectionObserver" in window) {
  const revealItems = document.querySelectorAll(".section-label, .principle, .service-row, .booking-form, .map-card, .install");
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  document.documentElement.classList.add("reveal-ready");
  revealItems.forEach((item) => {
    item.classList.add("reveal");
    revealObserver.observe(item);
  });
}

const mobileBookingCta = document.querySelector(".mobile-booking-cta");
const bookingForm = byId("booking-form");
const hero = document.querySelector(".hero");
if ("IntersectionObserver" in window && mobileBookingCta && bookingForm && hero) {
  let bookingFormIsVisible = false;
  let heroIsVisible = true;
  const updateMobileCta = () => {
    const formHasFocus = bookingForm.contains(document.activeElement);
    const shouldHide = !heroIsVisible || bookingFormIsVisible || formHasFocus;
    mobileBookingCta.classList.toggle("is-hidden", shouldHide);
    mobileBookingCta.setAttribute("aria-hidden", String(shouldHide));
    mobileBookingCta.tabIndex = shouldHide ? -1 : 0;
  };
  const heroObserver = new IntersectionObserver(([entry]) => {
    heroIsVisible = entry.isIntersecting && entry.intersectionRatio >= 0.15;
    updateMobileCta();
  }, { threshold: [0, 0.15] });
  heroObserver.observe(hero);
  const bookingObserver = new IntersectionObserver(([entry]) => {
    bookingFormIsVisible = entry.isIntersecting;
    updateMobileCta();
  }, { threshold: 0.18 });
  bookingObserver.observe(bookingForm);
  bookingForm.addEventListener("focusin", updateMobileCta);
  bookingForm.addEventListener("focusout", () => requestAnimationFrame(updateMobileCta));
}

if ("serviceWorker" in navigator && ["https:", "http:"].includes(location.protocol) && location.hostname !== "") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.error("Не удалось зарегистрировать service worker:", error);
    });
  });
}
