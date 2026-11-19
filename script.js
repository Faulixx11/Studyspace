const PRODUCTS = {
  tee: { id: "tee", name: "The Essential Tee", detail: "Heavy cotton · Off-white", price: 39, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80" },
  hoodie: { id: "hoodie", name: "The Daily Hoodie", detail: "Brushed fleece · Stone", price: 89, image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=400&q=80" },
  trouser: { id: "trouser", name: "The Relaxed Trouser", detail: "Relaxed fit · Sand", price: 79, image: "https://images.unsplash.com/photo-1506629905607-d9d3c5f9a4c4?auto=format&fit=crop&w=400&q=80" },
  overshirt: { id: "overshirt", name: "The Everyday Overshirt", detail: "Structured cotton · Ecru", price: 99, image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=80" }
};

const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const bagCount = document.getElementById("bagCount");
const bagDrawer = document.getElementById("bagDrawer");
const bagOverlay = document.getElementById("bagOverlay");
const bagItems = document.getElementById("bagItems");
const drawerCount = document.getElementById("drawerCount");
const bagSubtotal = document.getElementById("bagSubtotal");
const toast = document.getElementById("toast");
let bag = readBag();
let previousFocus = null;
let toastTimer;

function readBag() {
  try {
    const stored = JSON.parse(localStorage.getItem("studio01-bag") || "{}");
    return stored && typeof stored === "object" ? stored : {};
  } catch {
    return {};
  }
}

function saveBag() {
  try { localStorage.setItem("studio01-bag", JSON.stringify(bag)); } catch { /* local storage may be unavailable */ }
}

function itemCount() {
  return Object.values(bag).reduce((sum, qty) => sum + qty, 0);
}

function subtotal() {
  return Object.entries(bag).reduce((sum, entry) => {
    const product = PRODUCTS[entry[0]];
    return product ? sum + product.price * entry[1] : sum;
  }, 0);
}

function updateBag() {
  const count = itemCount();
  bagCount.textContent = String(count);
  drawerCount.textContent = "(" + count + ")";
  bagSubtotal.textContent = euro.format(subtotal());
  bagItems.replaceChildren();

  const entries = Object.entries(bag).filter(([id, qty]) => PRODUCTS[id] && qty > 0);
  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "empty-bag";
    empty.textContent = "Dein Bag ist noch leer.";
    bagItems.append(empty);
    return;
  }

  entries.forEach(([id, qty]) => {
    const product = PRODUCTS[id];
    const row = document.createElement("article");
    row.className = "bag-line";

    const image = document.createElement("img");
    image.src = product.image;
    image.alt = "";
    image.loading = "lazy";

    const details = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = product.name;
    const detail = document.createElement("p");
    detail.textContent = product.detail;
    const quantity = document.createElement("div");
    quantity.className = "bag-quantity";

    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.setAttribute("aria-label", product.name + " Menge reduzieren");
    minus.dataset.qty = id;
    minus.dataset.change = "-1";

    const number = document.createElement("span");
    number.textContent = String(qty);

    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.setAttribute("aria-label", product.name + " Menge erhöhen");
    plus.dataset.qty = id;
    plus.dataset.change = "1";

    quantity.append(minus, number, plus);
    details.append(title, detail, quantity);

    const price = document.createElement("span");
    price.className = "bag-line-price";
    price.textContent = euro.format(product.price * qty);
    row.append(image, details, price);
    bagItems.append(row);
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2300);
}

function openBag() {
  previousFocus = document.activeElement;
  bagDrawer.hidden = false;
  bagOverlay.hidden = false;
  document.body.classList.add("drawer-open");
  document.getElementById("closeBag").focus();
}

function closeBag() {
  bagDrawer.hidden = true;
  bagOverlay.hidden = true;
  document.body.classList.remove("drawer-open");
  if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
}

document.querySelectorAll("[data-add]").forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.dataset.add;
    if (!PRODUCTS[id]) return;
    bag[id] = (bag[id] || 0) + 1;
    saveBag();
    updateBag();
    showToast(PRODUCTS[id].name + " hinzugefügt");
    button.classList.add("is-added");
    const label = button.innerHTML;
    button.innerHTML = "HINZUGEFÜGT <span>✓</span>";
    window.setTimeout(() => {
      button.innerHTML = label;
      button.classList.remove("is-added");
    }, 1200);
  });
});

document.getElementById("openBag").addEventListener("click", openBag);
document.getElementById("closeBag").addEventListener("click", closeBag);
bagOverlay.addEventListener("click", closeBag);
bagItems.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-qty]");
  if (!button) return;
  const id = button.dataset.qty;
  bag[id] = (bag[id] || 0) + Number(button.dataset.change);
  if (bag[id] <= 0) delete bag[id];
  saveBag();
  updateBag();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !bagDrawer.hidden) closeBag();
});

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll(".product-card").forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
    });
  });
});

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
menuToggle.addEventListener("click", () => {
  const expanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!expanded));
  menuToggle.setAttribute("aria-label", expanded ? "Menü öffnen" : "Menü schließen");
  mainNav.classList.toggle("is-open", !expanded);
});
mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Menü öffnen");
  });
});

document.getElementById("newsletterForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.getElementById("emailInput");
  if (!email.checkValidity()) {
    email.reportValidity();
    return;
  }
  showToast("Demo: Newsletter ist noch nicht verbunden.");
  document.getElementById("formNote").textContent = "Danke! Für echte Anmeldungen muss noch ein Newsletter-Dienst verbunden werden.";
  email.value = "";
});

document.getElementById("checkoutButton").addEventListener("click", () => {
  showToast("Der Checkout ist in diesem Entwurf noch nicht angebunden.");
});

updateBag();