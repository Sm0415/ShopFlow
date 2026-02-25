/* ════════════════════════════════════════════════════════════
   ShopFlow — script.js
   ════════════════════════════════════════════════════════════

   🔧 TELEGRAM SETUP (READ THIS FIRST)
   ─────────────────────────────────────────────────────────
   STEP 1 — Create your bot:
     • Open Telegram, search @BotFather
     • Send /newbot, follow steps, copy the TOKEN it gives you
     • Paste it below as BOT_TOKEN

   STEP 2 — Get your Chat ID (where orders are sent):
     • Search @userinfobot on Telegram, send /start
     • It replies with your numeric Chat ID
     • Paste it below as ADMIN_CHAT_ID

   STEP 3 — Add your valid Customer IDs to VALID_CUSTOMER_IDS
     • Only these IDs can log in. Add/remove as needed.
     • Share IDs privately with your customers.

   ⚠️  Keep BOT_TOKEN and ADMIN_CHAT_ID private — never share
       this file publicly.
   ════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────── */
const BOT_TOKEN       = "8635213731:AAEnOLP63796MFoQB4h-sKsihOVZ5vPB7WI";   /* ← @BotFather token   */
const ADMIN_CHAT_ID   = "7282386471";     /* ← Your Telegram ID   */
/* ─────────────────────────────────────────────────────────── */

/*
   VALID CUSTOMER IDs — Admin sets these.
   Customers can only log in with an ID from this list.
   Add as many as you need. IDs are case-insensitive.
*/
const VALID_CUSTOMER_IDS = [
  "CUST-001",
  "CUST-101",
  "CUST-ADMIN",
  "CUST-DEFAULT",
  "CUST-VIP01",
  "CUST-VIP02",
  // ← Add more IDs here
];

const TELEGRAM_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

/* ════════════════════════════════════════════════════════════
   PRODUCTS  — edit freely
════════════════════════════════════════════════════════════ */
const PRODUCTS = [
  {
    id: 1,
    name: "Mini Pack",
    desc: "Small size pack – Easy to use.",
    price: 55.00,
    img: "images/mini-pack.jpg"
  },
  {
    id: 2,
    name: "Comfo Pack",
    desc: "Comfortable pack for regular.",
    price: 85.00,
    img: "images/comfo-pack.jpg"
  },
  {
    id: 3,
    name: "Big Pack - Light",
    desc: "Light strength version.",
    price: 130.00,
    img: "images/big-light.jpg"
  },
  {
    id: 4,
    name: "Big Pack - Moderate",
    desc: "Balanced moderate strength.",
    price: 180.00,
    img: "images/big-moderate.jpg"
  },
  {
    id: 5,
    name: "Big Pack - Strong & Hard",
    desc: "Maximum strength version.",
    price: 220.00,
    img: "images/big-strong.jpg"
  },
  {
    id: 6,
    name: "Roll Down",
    desc: "Smooth and easy roll down use.",
    price: 15.00,
    img: "images/roll-down.jpg"
  },
  {
    id: 7,
    name: "GF - Mix or Use",
    desc: "For mix or direct use.",
    price: 15.00,
    img: "images/gf-mix.jpg"
  },
  {
    id: 8,
    name: "AC - Mix or Use",
    desc: "Special mix formula.",
    price: 15.00,
    img: "images/ac-mix.jpg"
  },
  {
    id: 9,
    name: "Fire",
    desc: "Burn with flow.",
    price: 25.00,
    img: "images/ac-mix.jpg"
  }
];

/* ════════════════════════════════════════════════════════════
   STATE
════════════════════════════════════════════════════════════ */
let cart     = [];
let theme    = localStorage.getItem("sf-theme") || "light";
let cartOpen = false;

/* ════════════════════════════════════════════════════════════
   UTILS
════════════════════════════════════════════════════════════ */
const $  = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];
const fmt = n => "₹" + Number(n).toFixed(2);

function showPage(name) {
  $$(".page").forEach(p => p.classList.remove("active"));
  $(`#page-${name}`).classList.add("active");
  if (window.lucide) lucide.createIcons();
}

function setTheme(t) {
  theme = t;
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem("sf-theme", t);
  const icon = $("#theme-icon");
  if (icon) icon.setAttribute("data-lucide", t === "dark" ? "sun" : "moon");
  if (window.lucide) lucide.createIcons();
}

function nowString() {
  return new Date().toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function isValidId(id) {
  return VALID_CUSTOMER_IDS.map(v => v.toUpperCase()).includes(id.toUpperCase());
}


/* ════════════════════════════════════════════════════════════
   LOGIN  — validates against admin-defined ID list
════════════════════════════════════════════════════════════ */
(function initLogin() {
  setTheme(theme);

  // Resume session
  const saved = sessionStorage.getItem("sf-cid");
  if (saved && isValidId(saved)) {
    enterShop(saved);
    return;
  }

  showPage("login");
  if (window.lucide) lucide.createIcons();

  const form  = $("#login-form");
  const input = $("#cid-input");
  const msg   = $("#login-msg");
  const btn   = $("#login-btn");

  function setMsg(text, type) {
    msg.textContent = text;
    msg.className   = "field-msg " + type;
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const val = input.value.trim();

    if (!val) {
      setMsg("Please enter your Customer ID.", "err");
      input.classList.add("err-inp");
      input.focus();
      return;
    }

    if (!isValidId(val)) {
      setMsg("❌ Invalid Customer ID. Please contact the admin.", "err");
      input.classList.add("err-inp");
      input.focus();
      // Shake animation
      input.style.animation = "none";
      input.offsetHeight;
      input.style.animation = "shake .4s ease";
      return;
    }

    // Valid!
    setMsg("✓ Verified! Loading your shop…", "ok");
    btn.disabled = true;
    input.classList.remove("err-inp");

    setTimeout(() => {
      const canonical = VALID_CUSTOMER_IDS.find(
        v => v.toUpperCase() === val.toUpperCase()
      );
      sessionStorage.setItem("sf-cid", canonical);
      enterShop(canonical);
    }, 600);
  });

  input.addEventListener("input", () => {
    input.classList.remove("err-inp");
    setMsg("", "");
  });
})();

// Shake keyframe (injected once)
const shakeStyle = document.createElement("style");
shakeStyle.textContent = `
@keyframes shake {
  0%,100% { transform:translateX(0); }
  20%      { transform:translateX(-7px); }
  40%      { transform:translateX(7px); }
  60%      { transform:translateX(-5px); }
  80%      { transform:translateX(5px); }
}`;
document.head.appendChild(shakeStyle);


/* ════════════════════════════════════════════════════════════
   SHOP
════════════════════════════════════════════════════════════ */
function enterShop(cid) {
  showPage("shop");
  setTheme(theme);

  $("#disp-cid").textContent = cid;

  renderProducts(PRODUCTS);
  initCart();
  initSearch();
  initThemeToggle();
  initLogout();
  updateBadge();
}

/* ── Products ──────────────────────────────────────────────── */
function renderProducts(list) {
  const grid  = $("#prod-grid");
  const empty = $("#no-results");
  const count = $("#prod-count");

  grid.innerHTML = "";

  if (!list.length) {
    empty.style.display = "flex";
    count.textContent   = "0 products";
    if (window.lucide) lucide.createIcons();
    return;
  }

  empty.style.display = "none";
  count.textContent   = `${list.length} product${list.length !== 1 ? "s" : ""}`;

  list.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "pcard";
    card.style.animationDelay = `${i * 0.045}s`;
    card.innerHTML = `
      <div class="pcard-img">
        <img src="${p.img}" alt="${p.name}" loading="lazy" />
      </div>
      <div class="pcard-body">
        <div class="pcard-name">${p.name}</div>
        <div class="pcard-desc">${p.desc}</div>
        <div class="pcard-price">${fmt(p.price)}</div>
        <div class="pcard-ctrl">
          <div class="qty-wrap">
            <button class="qbtn" data-action="dec" data-id="${p.id}">−</button>
            <input class="qty-val" type="number" min="1" max="99" value="1" data-id="${p.id}" readonly />
            <button class="qbtn" data-action="inc" data-id="${p.id}">+</button>
          </div>
          <button class="btn btn-glow btn-sm atc-btn" data-id="${p.id}">
            <span>Add</span>
            <i data-lucide="plus"></i>
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();

  // Qty buttons
  $$(".qbtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id  = Number(btn.dataset.id);
      const inp = $(`input.qty-val[data-id="${id}"]`);
      let v = parseInt(inp.value) || 1;
      if (btn.dataset.action === "inc") v = Math.min(v + 1, 99);
      if (btn.dataset.action === "dec") v = Math.max(v - 1, 1);
      inp.value = v;
    });
  });

  // Add to cart
  $$(".atc-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id  = Number(btn.dataset.id);
      const inp = $(`input.qty-val[data-id="${id}"]`);
      const qty = Math.max(1, parseInt(inp.value) || 1);
      addToCart(id, qty);
      inp.value = 1;
      // Feedback
      btn.innerHTML = `<span>Added ✓</span>`;
      btn.style.background = "var(--success)";
      setTimeout(() => {
        btn.innerHTML = `<span>Add</span><i data-lucide="plus"></i>`;
        btn.style.background = "";
        lucide.createIcons();
      }, 900);
    });
  });
}

/* ── Search ─────────────────────────────────────────────────── */
function initSearch() {
  const inp   = $("#search-input");
  const clear = $("#search-clear");

  inp.addEventListener("input", () => {
    const q = inp.value.trim().toLowerCase();
    clear.style.display = q ? "flex" : "none";
    renderProducts(q
      ? PRODUCTS.filter(p => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))
      : PRODUCTS
    );
  });

  clear.addEventListener("click", () => {
    inp.value = "";
    clear.style.display = "none";
    renderProducts(PRODUCTS);
    inp.focus();
  });
}


/* ════════════════════════════════════════════════════════════
   CART
════════════════════════════════════════════════════════════ */
function addToCart(productId, qty) {
  const product  = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  const existing = cart.find(i => i.id === productId);
  if (existing) existing.qty = Math.min(existing.qty + qty, 99);
  else cart.push({ ...product, qty });
  renderCart();
  updateBadge();
  openCart();
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  renderCart();
  updateBadge();
}

function cartTotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

function updateBadge() {
  const badge = $("#cart-badge");
  if (!badge) return;
  const n = cart.reduce((s, i) => s + i.qty, 0);
  badge.style.display = n > 0 ? "flex" : "none";
  badge.textContent   = n > 99 ? "99+" : n;
}

function renderCart() {
  const body  = $("#cp-body");
  const foot  = $("#cp-foot");
  const empty = $("#cart-empty");
  const total = $("#ctotal-val");

  $$(".citem", body).forEach(el => el.remove());

  if (!cart.length) {
    empty.style.display = "flex";
    foot.style.display  = "none";
    return;
  }

  empty.style.display = "none";
  foot.style.display  = "block";
  total.textContent   = fmt(cartTotal());

  cart.forEach(item => {
    const el = document.createElement("div");
    el.className = "citem";
    el.innerHTML = `
      <img class="citem-img" src="${item.img}" alt="${item.name}" />
      <div class="citem-info">
        <div class="citem-name">${item.name}</div>
        <div class="citem-sub">${fmt(item.price)} × ${item.qty}</div>
      </div>
      <div class="citem-total">${fmt(item.price * item.qty)}</div>
      <button class="citem-del" data-id="${item.id}" title="Remove">
        <i data-lucide="x"></i>
      </button>
    `;
    body.appendChild(el);
  });

  if (window.lucide) lucide.createIcons();

  $$(".citem-del").forEach(btn => {
    btn.addEventListener("click", () => removeFromCart(Number(btn.dataset.id)));
  });
}

function openCart() {
  $("#cart-panel").classList.add("open");
  $("#cart-mask").classList.add("on");
  cartOpen = true;
}
function closeCart() {
  $("#cart-panel").classList.remove("open");
  $("#cart-mask").classList.remove("on");
  cartOpen = false;
}

function initCart() {
  renderCart();
  $("#cart-toggle").addEventListener("click", () => cartOpen ? closeCart() : openCart());
  $("#cart-close").addEventListener("click", closeCart);
  $("#cart-mask").addEventListener("click", closeCart);
  $("#go-checkout-btn").addEventListener("click", () => {
    if (!cart.length) return;
    closeCart();
    goToCheckout();
  });
}


/* ════════════════════════════════════════════════════════════
   CHECKOUT
════════════════════════════════════════════════════════════ */
function goToCheckout() {
  showPage("checkout");

  const cid = sessionStorage.getItem("sf-cid") || "—";
  $("#co-cid-bar").textContent = cid;
  $("#co-cid").textContent     = cid;
  $("#co-time").textContent    = nowString();
  $("#co-grand").textContent   = fmt(cartTotal());

  // Render summary items
  const coItems = $("#co-items");
  coItems.innerHTML = "";
  cart.forEach(item => {
    const row = document.createElement("div");
    row.className = "co-item";
    row.innerHTML = `
      <img src="${item.img}" alt="${item.name}" />
      <div class="co-item-info">
        <div class="ci-name">${item.name}</div>
        <div class="ci-qty">Qty: ${item.qty}</div>
      </div>
      <div class="co-item-price">${fmt(item.price * item.qty)}</div>
    `;
    coItems.appendChild(row);
  });

  if (window.lucide) lucide.createIcons();

  // Clear old listeners before attaching
  const backBtn  = $("#back-btn");
  const placeBtn = $("#place-btn");
  const addrErr  = $("#addr-error");

  const newBack = backBtn.cloneNode(true);
  backBtn.parentNode.replaceChild(newBack, backBtn);
  newBack.addEventListener("click", () => showPage("shop"));

  const newPlace = placeBtn.cloneNode(true);
  placeBtn.parentNode.replaceChild(newPlace, placeBtn);

  addrErr.style.display = "none";

  newPlace.addEventListener("click", async () => {
    // Validate address fields
    const name     = $("#f-name").value.trim();
    const contact  = $("#f-contact").value.trim();
    const mobile   = $("#f-mobile").value.trim();
    const building = $("#f-building").value.trim();
    const area     = $("#f-area").value.trim();

    // Mark invalid fields
    [$("#f-name"), $("#f-contact"), $("#f-mobile"), $("#f-building")].forEach(inp => {
      inp.classList.toggle("err-inp", !inp.value.trim());
    });

    if (!name || !contact || !mobile || !building) {
      addrErr.style.display = "flex";
      if (window.lucide) lucide.createIcons();
      return;
    }

    addrErr.style.display = "none";
    await placeOrder({ name, contact, mobile, building, area });
  });
}


/* ════════════════════════════════════════════════════════════
   PLACE ORDER + TELEGRAM NOTIFICATION
════════════════════════════════════════════════════════════ */
async function placeOrder({ name, contact, mobile, building, area }) {
  const cid       = sessionStorage.getItem("sf-cid") || "Unknown";
  const orderTime = nowString();
  const total     = fmt(cartTotal());
  const lbar      = $("#lbar");
  const placeBtn  = $("#place-btn");

  // Build Telegram message
  const itemLines = cart.map(item =>
    `  • ${item.name}  ×${item.qty}  →  ${fmt(item.price * item.qty)}`
  ).join("\n");

  const message = `
🛒 *NEW ORDER — ShopFlow*
━━━━━━━━━━━━━━━━━━━━
🆔 *Customer ID:*  \`${cid}\`
📅 *Order Time:*  ${orderTime}
━━━━━━━━━━━━━━━━━━━━
👤 *Customer Name:*  ${name}
📞 *Contact / WhatsApp:*  ${contact}
📱 *Mobile Number:*  ${mobile}
🏢 *Building / Flat:*  ${building}${area ? `\n📍 *Area / Landmark:*  ${area}` : ""}
━━━━━━━━━━━━━━━━━━━━
📦 *Items Ordered:*
${itemLines}
━━━━━━━━━━━━━━━━━━━━
💰 *Grand Total:*  *${total}*
━━━━━━━━━━━━━━━━━━━━
⚡ Estimated delivery: *5–10 minutes*
✅ Please process this order immediately!
  `.trim();

  // Show loading
  lbar.style.display  = "block";
  placeBtn.disabled   = true;
  placeBtn.style.opacity = ".6";

  try {
    const res  = await fetch(TELEGRAM_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        chat_id:    ADMIN_CHAT_ID,
        text:       message,
        parse_mode: "Markdown",
      }),
    });
    const data = await res.json();
    lbar.style.display = "none";

    if (data.ok) {
      // Save order snapshot
      const orderData = { cid, name, contact, mobile, building, area, cart: [...cart], total, orderTime };
      // Clear cart
      cart = [];
      updateBadge();
      // Show thank-you page
      showThankYou(orderData);
    } else {
      const errDesc = data.description || "Unknown error";
      showError(`Telegram Error: ${errDesc}\n\nCheck BOT_TOKEN and ADMIN_CHAT_ID in script.js.`);
    }
  } catch (err) {
    lbar.style.display = "none";
    // If bot isn't configured, still show thank-you with a warning
    // (comment the next 3 lines and uncomment showError if you want strict mode)
    const orderData = { cid, name, contact, mobile, building, area, cart: [...cart], total, orderTime, offline: true };
    cart = [];
    updateBadge();
    showThankYou(orderData);
    // showError(`Network Error: ${err.message}\n\nMake sure your Telegram bot is configured correctly.`);
  }

  placeBtn.disabled = false;
  placeBtn.style.opacity = "";
}


/* ════════════════════════════════════════════════════════════
   THANK YOU PAGE
════════════════════════════════════════════════════════════ */
function showThankYou({ name, cid, building, area, cart: orderedCart, total, orderTime, offline }) {
  showPage("thankyou");

  // Greeting
  const firstName = name.split(" ")[0];
  $("#ty-name").textContent = firstName;

  // Order summary rows
  const summary = $("#ty-summary");
  const itemList = orderedCart.map(i => `${i.name} ×${i.qty}`).join(", ");
  summary.innerHTML = `
    <div class="ty-row"><span>Customer ID</span><strong>${cid}</strong></div>
    <div class="ty-row"><span>Name</span><strong>${name}</strong></div>
    <div class="ty-row"><span>Deliver to</span><strong>${building}${area ? ", " + area : ""}</strong></div>
    <div class="ty-row"><span>Items</span><strong>${itemList}</strong></div>
    <div class="ty-row ty-total"><span>Total Paid</span><strong>${total}</strong></div>
    <div class="ty-row"><span>Order Time</span><strong>${orderTime}</strong></div>
    ${offline ? `<div class="ty-row" style="color:var(--warn);font-size:.78rem"><span colspan="2">⚠️ Note: Telegram notification may not have been sent. Configure bot credentials in script.js.</span></div>` : ""}
  `;

  if (window.lucide) lucide.createIcons();

  // Back to shop
  const backBtn = $("#ty-back-btn");
  const newBtn  = backBtn.cloneNode(true);
  backBtn.parentNode.replaceChild(newBtn, backBtn);
  newBtn.addEventListener("click", () => {
    showPage("shop");
    renderProducts(PRODUCTS);
    renderCart();
    if (window.lucide) lucide.createIcons();
  });

  // Confetti 🎉
  launchConfetti();
}

/* ─── Confetti ───────────────────────────────────────────── */
function launchConfetti() {
  const wrap   = $("#confetti-wrap");
  wrap.innerHTML = "";
  const colors = ["#4361ee","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f472b6"];
  const shapes = ["circle","square"];

  for (let i = 0; i < 90; i++) {
    const el = document.createElement("div");
    el.className = "conf-piece";

    const color  = colors[Math.floor(Math.random() * colors.length)];
    const size   = Math.random() * 8 + 6;
    const left   = Math.random() * 100;
    const delay  = Math.random() * 2.5;
    const dur    = Math.random() * 2 + 2.5;
    const isCirc = shapes[Math.floor(Math.random() * 2)] === "circle";

    el.style.cssText = `
      background:${color};
      width:${size}px; height:${size}px;
      left:${left}%;
      border-radius:${isCirc ? "50%" : "2px"};
      animation-duration:${dur}s;
      animation-delay:${delay}s;
      opacity:0.85;
    `;
    wrap.appendChild(el);
  }

  // Clean up after 6s
  setTimeout(() => { wrap.innerHTML = ""; }, 6000);
}


/* ════════════════════════════════════════════════════════════
   ERROR TOAST (simple)
════════════════════════════════════════════════════════════ */
function showError(msg) {
  alert("⚠️ " + msg);
}


/* ════════════════════════════════════════════════════════════
   THEME TOGGLE
════════════════════════════════════════════════════════════ */
function initThemeToggle() {
  setTheme(theme);
  const btn = $("#theme-toggle");
  if (btn) btn.addEventListener("click", () => setTheme(theme === "dark" ? "light" : "dark"));
}


/* ════════════════════════════════════════════════════════════
   LOGOUT
════════════════════════════════════════════════════════════ */
function initLogout() {
  const btn = $("#logout-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (!confirm("Log out of ShopFlow?")) return;
    sessionStorage.removeItem("sf-cid");
    cart = [];
    showPage("login");
    if (window.lucide) lucide.createIcons();
  });
}


/* ════════════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  setTheme(theme);
  if (window.lucide) lucide.createIcons();
});