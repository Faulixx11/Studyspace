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
// Extended shop interactions: variants, favorites, search, info modals and demo checkout.
const SHOP_PRODUCTS={tee:{name:"The Essential Tee",detail:"Heavy cotton · Off-white",description:"Ein vielseitiges Essential mit cleanem Schnitt und weichem Griff – der unkomplizierte Begleiter für jeden Tag.",price:39,image:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",sizes:["XS","S","M","L","XL"],colors:[["Off-white","#e9e5dc"],["Black","#222222"],["Grey","#96958f"]]},hoodie:{name:"The Daily Hoodie",detail:"Brushed fleece · Stone",description:"Relaxed und weich, mit ruhiger Silhouette – ein cozy Layer für jeden Tag.",price:89,image:"https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85",sizes:["XS","S","M","L","XL"],colors:[["Stone","#c9c2b5"],["Black","#222"],["Grey","#96958f"]]},trouser:{name:"The Relaxed Trouser",detail:"Relaxed fit · Sand",description:"Eine entspannte Passform mit klarer Linie, einfach kombinierbar.",price:79,image:"https://images.unsplash.com/photo-1506629905607-d9d3c5f9a4c4?auto=format&fit=crop&w=900&q=85",sizes:["XS","S","M","L","XL"],colors:[["Sand","#c8bba5"],["Black","#222"]]},overshirt:{name:"The Everyday Overshirt",detail:"Structured cotton · Ecru",description:"Ein Layering-Piece mit strukturierter Optik, offen oder geschlossen getragen.",price:99,image:"https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=85",sizes:["XS","S","M","L","XL"],colors:[["Ecru","#e5dfd2"],["Olive","#6d705e"],["Black","#222"]]}};
const SHOP_EURO=new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR",maximumFractionDigits:0});
let shopWish=(()=>{try{return JSON.parse(localStorage.getItem("studio01-wishlist")||"[]")}catch{return[]}})(),shopVariants=(()=>{try{return JSON.parse(localStorage.getItem("studio01-variants")||"{}")}catch{return{}}})(),shopActive=null,shopSize="",shopColor="",shopFilter="all",shopSearch="",shopSort="featured",shopStep=0,shopPrevious=null,shopToastTimer;
function shopToast(m){toast.textContent=m;toast.classList.add("is-visible");clearTimeout(shopToastTimer);shopToastTimer=setTimeout(()=>toast.classList.remove("is-visible"),2300)}
function shopOpen(panel){shopPrevious=document.activeElement;bagOverlay.hidden=true;overlay.hidden=false;panel.hidden=false;document.body.classList.add("drawer-open");panel.querySelector("button,input")?.focus()}
function shopClose(){[bagDrawer,productModal,sizeModal,searchModal,checkoutModal,infoModal,wishlistDrawer].forEach(p=>p.hidden=true);bagOverlay.hidden=true;overlay.hidden=true;document.body.classList.remove("drawer-open");if(shopPrevious?.focus)shopPrevious.focus()}
overlay.addEventListener("click",shopClose);document.querySelectorAll("[data-close-modal]").forEach(b=>b.addEventListener("click",shopClose));document.querySelectorAll(".close-drawer").forEach(b=>b.addEventListener("click",shopClose));document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!overlay.hidden)shopClose()});
function shopToggleWish(id){shopWish=shopWish.includes(id)?shopWish.filter(x=>x!==id):shopWish.concat(id);try{localStorage.setItem("studio01-wishlist",JSON.stringify(shopWish))}catch{};document.querySelectorAll("[data-wish]").forEach(b=>b.classList.toggle("is-active",shopWish.includes(b.dataset.wish)));$("wishlistCount").textContent=shopWish.length;$("modalWishlist").classList.toggle("is-active",shopWish.includes(id));shopRenderWish();shopToast(shopWish.includes(id)?"Favorit gespeichert":"Favorit entfernt")}
function shopRenderWish(){const box=$("wishlistItems");box.replaceChildren();if(!shopWish.length){box.innerHTML='<p class="empty-state">Noch nichts gespeichert.</p>';return}shopWish.forEach(id=>{const p=SHOP_PRODUCTS[id];if(!p)return;const row=document.createElement("article");row.className="bag-line";const im=document.createElement("img");im.src=p.image;im.alt="";const info=document.createElement("div");const name=document.createElement("h3");name.textContent=p.name;const price=document.createElement("p");price.textContent=SHOP_EURO.format(p.price);const btn=document.createElement("button");btn.className="text-button";btn.textContent="Details ansehen";btn.addEventListener("click",()=>{shopClose();shopShowProduct(id)});const remove=document.createElement("button");remove.className="text-button";remove.textContent="Entfernen";remove.addEventListener("click",()=>shopToggleWish(id));info.append(name,price,btn,remove);row.append(im,info);box.append(row)})}
$("wishlistOpen").addEventListener("click",()=>{shopRenderWish();shopOpen(wishlistDrawer)});$("closeWishlist").addEventListener("click",shopClose);$("clearWishlist").addEventListener("click",()=>{shopWish=[];try{localStorage.setItem("studio01-wishlist","[]")}catch{};shopRenderWish();$("wishlistCount").textContent="0";document.querySelectorAll("[data-wish]").forEach(b=>b.classList.remove("is-active"));shopToast("Favoriten geleert")});document.querySelectorAll(".product-card").forEach(card=>{const id=card.querySelector("[data-add]")?.dataset.add;if(!id)return;const heart=document.createElement("button");heart.className="wishlist-toggle"+(shopWish.includes(id)?" is-active":"");heart.textContent="♡";heart.setAttribute("aria-label","Zu Favoriten");heart.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();shopToggleWish(id)});card.querySelector(".product-image").append(heart);const quick=card.querySelector("[data-add]");quick.textContent="QUICK VIEW";quick.insertAdjacentHTML("beforeend"," <span>↗</span>");const open=()=>shopShowProduct(id);card.querySelector(".product-image").addEventListener("click",e=>{e.preventDefault();open()});quick.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();open()},true)});
function shopShowProduct(id){shopActive=id;const p=SHOP_PRODUCTS[id];shopSize="";shopColor=p.colors[0][0];$("modalProductImage").src=p.image;$("modalProductImage").alt=p.name;$("modalProductTitle").textContent=p.name;$("modalProductPrice").textContent=SHOP_EURO.format(p.price);$("modalProductDescription").textContent=p.description;$("selectedColorName").textContent=shopColor;$("sizeError").hidden=true;shopRenderOptions();$("modalWishlist").classList.toggle("is-active",shopWish.includes(id));shopOpen(productModal)}
function shopRenderOptions(){const p=SHOP_PRODUCTS[shopActive];const colors=$("colorOptions");colors.replaceChildren();p.colors.forEach(([name,hex])=>{const b=document.createElement("button");b.className="color-chip"+(name===shopColor?" selected":"");b.style.background=hex;b.title=name;b.setAttribute("aria-label",name);b.addEventListener("click",()=>{shopColor=name;$("selectedColorName").textContent=name;shopRenderOptions()});colors.append(b)});const sizes=$("sizeOptions");sizes.replaceChildren();p.sizes.forEach(s=>{const b=document.createElement("button");b.className="size-button"+(s===shopSize?" selected":"");b.textContent=s;b.addEventListener("click",()=>{shopSize=s;$("sizeError").hidden=true;shopRenderOptions()});sizes.append(b)})}
$("modalWishlist").addEventListener("click",()=>shopToggleWish(shopActive));$("sizeGuideOpen").addEventListener("click",()=>shopOpen(sizeModal));$("modalAddToBag").addEventListener("click",()=>{if(!shopSize){$("sizeError").hidden=false;return}const key=shopActive+"|"+shopSize+"|"+shopColor;shopVariants[key]=(shopVariants[key]||0)+1;try{localStorage.setItem("studio01-variants",JSON.stringify(shopVariants))}catch{};bag[shopActive]=(bag[shopActive]||0)+1;saveBag();shopRenderCart();shopToast(SHOP_PRODUCTS[shopActive].name+" hinzugefügt");shopClose()});
function shopRenderCart(){const box=$("bagItems");box.replaceChildren();const entries=Object.entries(shopVariants);if(!entries.length){box.innerHTML='<p class="empty-bag">Dein Bag ist noch leer.</p>'}let count=0,total=0;entries.forEach(([key,qty])=>{const [id,size,color]=key.split("|"),p=SHOP_PRODUCTS[id];if(!p)return;count+=qty;total+=p.price*qty;const row=document.createElement("article");row.className="bag-line";const im=document.createElement("img");im.src=p.image;im.alt="";const details=document.createElement("div");const title=document.createElement("h3");title.textContent=p.name;const desc=document.createElement("p");desc.textContent=color+" · Größe "+size;const controls=document.createElement("div");controls.className="bag-quantity";const minus=document.createElement("button");minus.textContent="−";minus.dataset.variant=key;minus.dataset-change="-1";const n=document.createElement("span");n.textContent=qty;const plus=document.createElement("button");plus.textContent="+";plus.dataset.variant=key;plus.dataset.change="1";const del=document.createElement("button");del.className="remove-line";del.textContent="Entfernen";del.dataset.deleteVariant=key;controls.append(minus,n,plus,del);details.append(title,desc,controls);const price=document.createElement("span");price.className="bag-line-price";price.textContent=SHOP_EURO.format(p.price*qty);row.append(im,details,price);box.append(row)});$("bagCount").textContent=count;$("drawerCount").textContent="("+count+")";$("bagSubtotal").textContent=SHOP_EURO.format(total);const remain=Math.max(0,100-total);$("shippingMessage").textContent=remain?"Noch "+SHOP_EURO.format(remain)+" bis zum kostenlosen Versand.":"Kostenloser Versand erreicht!";$("shippingProgress").style.width=Math.min(100,total/100*100)+"%"}
$("bagItems").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;if(b.dataset.deleteVariant){delete shopVariants[b.dataset.deleteVariant]}else if(b.dataset.variant){shopVariants[b.dataset.variant]=(shopVariants[b.dataset.variant]||0)+Number(b.dataset.change);if(shopVariants[b.dataset.variant]<=0)delete shopVariants[b.dataset.variant]}else return;try{localStorage.setItem("studio01-variants",JSON.stringify(shopVariants))}catch{};bag={};Object.keys(shopVariants).forEach(k=>{const id=k.split("|")[0];bag[id]=(bag[id]||0)+shopVariants[k]});saveBag();shopRenderCart()});
$("openBag").addEventListener("click",()=>{shopRenderCart();shopOpen(bagDrawer)});$("closeBag").addEventListener("click",shopClose);$("bagOverlay").addEventListener("click",shopClose);
$("searchOpen").addEventListener("click",()=>{shopOpen(searchModal);$("searchInput").value=shopSearch;$("searchInput").focus()});$("searchInput").addEventListener("input",e=>{shopSearch=e.target.value.toLowerCase();shopApplyFilters()});$("searchApply").addEventListener("click",()=>{shopClose();document.querySelector("#collection").scrollIntoView({behavior:"smooth"})});
document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{shopFilter=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>{x.classList.toggle("is-active",x===b);x.setAttribute("aria-pressed",String(x===b))});shopApplyFilters()}));$("sortSelect").addEventListener("change",e=>{shopSort=e.target.value;shopApplyFilters()});
function shopApplyFilters(){const cards=[...document.querySelectorAll(".product-card")];cards.forEach(card=>{const id=card.querySelector("[data-add]")?.dataset.add,p=SHOP_PRODUCTS[id],category=card.dataset.category;const text=(p.name+" "+p.detail+" "+category).toLowerCase();card.dataset.visible=String((shopFilter==="all"||category===shopFilter)&&text.includes(shopSearch))});const sorter={"featured":()=>0,"price-low":(a,b)=>SHOP_PRODUCTS[a.querySelector("[data-add]").dataset.add].price-SHOP_PRODUCTS[b.querySelector("[data-add]").dataset.add].price,"price-high":(a,b)=>SHOP_PRODUCTS[b.querySelector("[data-add]").dataset.add].price-SHOP_PRODUCTS[a.querySelector("[data-add]").dataset.add].price,"name":(a,b)=>SHOP_PRODUCTS[a.querySelector("[data-add]").dataset.add].name.localeCompare(SHOP_PRODUCTS[b.querySelector("[data-add]").dataset.add].name)};cards.sort(sorter[shopSort]||sorter.featured).forEach(c=>$("productGrid").append(c));cards.forEach(c=>c.hidden=c.dataset.visible!=="true");const n=cards.filter(c=>c.dataset.visible==="true").length;$("resultCount").textContent=n+" Produkte";$("noResults").hidden=n>0}
const infoCopy={shipping:["Versand & Rückgabe","Versandkosten, Lieferzeiten und Rückgaberegeln sind noch nicht festgelegt. Diese Demo enthält keine echten Bestellungen."],contact:["Kontakt","Die offizielle Kontaktadresse ist noch nicht eingerichtet. Bitte vor Veröffentlichung ersetzen."],imprint:["Impressum","Dieser Platzhalter muss vor einer Veröffentlichung durch vollständige Anbieterinformationen ersetzt werden."],privacy:["Datenschutz","Vor Veröffentlichung muss eine Datenschutzerklärung erstellt werden, die tatsächlich eingesetzte Dienste und Datenverarbeitung beschreibt."],terms:["AGB","Dieser Platzhalter ist keine vollständige AGB oder Rechtsberatung. Vor einem Shopstart rechtlich prüfen lassen."]};document.querySelectorAll("[data-info]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();const [title,text]=infoCopy[a.dataset.info]||["Info","Noch nicht eingerichtet."];$("infoTitle").textContent=title;$("infoContent").textContent=text;shopOpen(infoModal)}));document.querySelectorAll(".placeholder-link").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();shopToast("Social-Media-Link noch nicht eingerichtet")}));
function shopCheckoutSummary(){const box=$("checkoutSummary");box.replaceChildren();Object.entries(shopVariants).forEach(([key,qty])=>{const [id,size,color]=key.split("|"),p=SHOP_PRODUCTS[id];const row=document.createElement("div");row.className="checkout-summary-row";const l=document.createElement("span");l.textContent=p.name+" · "+color+" · "+size+" × "+qty;const r=document.createElement("span");r.textContent=SHOP_EURO.format(p.price*qty);row.append(l,r);box.append(row)});const total=document.createElement("div");total.className="checkout-summary-row";const l=document.createElement("strong");l.textContent="Summe (Demo)";const r=document.createElement("strong");r.textContent=SHOP_EURO.format(Object.entries(shopVariants).reduce((sum,[key,q])=>sum+SHOP_PRODUCTS[key.split("|")[0]].price*q,0));total.append(l,r);box.append(total)}
function shopCheckoutRender(){document.querySelectorAll(".step-dot").forEach((s,i)=>s.classList.toggle("active",i===shopStep));$("checkoutBack").hidden=shopStep===0;if(shopStep===0){$("checkoutStepContent").innerHTML='<p class="small-note">Überprüfe deine Auswahl. Das ist nur eine Simulation.</p>';$("checkoutNext").textContent="DEMO FORTSETZEN"}else if(shopStep===1){$("checkoutStepContent").innerHTML='<form class="checkout-fields" id="demoShippingForm"><label>Vorname<input name="first" required placeholder="Vorname"></label><label>Nachname<input name="last" required placeholder="Nachname"></label><label>E-Mail<input type="email" name="email" required placeholder="name@example.com"></label><label>Adresse<input name="address" required placeholder="Straße, Hausnummer"></label><label>PLZ / Ort<input name="city" required placeholder="PLZ, Ort"></label></form><p class="small-note">Demo: Keine echten persönlichen Daten eingeben. Es wird nichts übertragen oder gespeichert.</p>';$("checkoutNext").textContent="ABSCHLIESSEN"}else{$("checkoutStepContent").innerHTML='<div class="success-message"><h3>Demo beendet.</h3><p>Es wurde keine Bestellung angelegt oder Zahlung ausgeführt.</p></div>';$("checkoutNext").textContent="SCHLIESSEN"}}
$("checkoutButton").addEventListener("click",()=>{if(!Object.keys(shopVariants).length){shopToast("Dein Warenkorb ist leer.");return}shopStep=0;shopCheckoutSummary();shopCheckoutRender();shopOpen(checkoutModal)});$("checkoutNext").addEventListener("click",()=>{if(shopStep===0){shopStep=1;shopCheckoutRender();return}if(shopStep===1){const f=$("demoShippingForm");if(!f.reportValidity())return;shopStep=2;shopCheckoutRender();shopVariants={};bag={};try{localStorage.setItem("studio01-variants","{}")}catch{};saveBag();shopRenderCart();return}shopClose()});$("checkoutBack").addEventListener("click",()=>{shopStep=Math.max(0,shopStep-1);shopCheckoutRender()});
const cookiePref="studio01-cookie-choice";if(!localStorage.getItem(cookiePref))$("cookieBanner").hidden=false;$("cookieAccept").addEventListener("click",()=>{localStorage.setItem(cookiePref,"ok");$("cookieBanner").hidden=true});$("cookieDismiss").addEventListener("click",()=>{localStorage.setItem(cookiePref,"necessary");$("cookieBanner").hidden=true});
const newsletterOld=$("newsletterForm");const newsletterClean=newsletterOld.cloneNode(true);newsletterOld.replaceWith(newsletterClean);newsletterClean.addEventListener("submit",e=>{e.preventDefault();const email=$("emailInput");if(!email.checkValidity()){email.reportValidity();return}shopToast("Newsletter-Demo: noch nicht verbunden.");$("formNote").textContent="Danke! Das Formular überträgt keine Daten.";email.value=""});
shopRenderCart();shopRenderWish();$("wishlistCount").textContent=shopWish.length;document.querySelectorAll("[data-wish]").forEach(b=>b.classList.toggle("is-active",shopWish.includes(b.dataset.wish)));
// Extended shop interactions: variants, favorites, search, info modals and demo checkout.
const SHOP_PRODUCTS={tee:{name:"The Essential Tee",detail:"Heavy cotton · Off-white",description:"Ein vielseitiges Essential mit cleanem Schnitt und weichem Griff – der unkomplizierte Begleiter für jeden Tag.",price:39,image:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",sizes:["XS","S","M","L","XL"],colors:[["Off-white","#e9e5dc"],["Black","#222222"],["Grey","#96958f"]]},hoodie:{name:"The Daily Hoodie",detail:"Brushed fleece · Stone",description:"Relaxed und weich, mit ruhiger Silhouette – ein cozy Layer für jeden Tag.",price:89,image:"https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85",sizes:["XS","S","M","L","XL"],colors:[["Stone","#c9c2b5"],["Black","#222"],["Grey","#96958f"]]},trouser:{name:"The Relaxed Trouser",detail:"Relaxed fit · Sand",description:"Eine entspannte Passform mit klarer Linie, einfach kombinierbar.",price:79,image:"https://images.unsplash.com/photo-1506629905607-d9d3c5f9a4c4?auto=format&fit=crop&w=900&q=85",sizes:["XS","S","M","L","XL"],colors:[["Sand","#c8bba5"],["Black","#222"]]},overshirt:{name:"The Everyday Overshirt",detail:"Structured cotton · Ecru",description:"Ein Layering-Piece mit strukturierter Optik, offen oder geschlossen getragen.",price:99,image:"https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=85",sizes:["XS","S","M","L","XL"],colors:[["Ecru","#e5dfd2"],["Olive","#6d705e"],["Black","#222"]]}};
const SHOP_EURO=new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR",maximumFractionDigits:0});
let shopWish=(()=>{try{return JSON.parse(localStorage.getItem("studio01-wishlist")||"[]")}catch{return[]}})(),shopVariants=(()=>{try{return JSON.parse(localStorage.getItem("studio01-variants")||"{}")}catch{return{}})(),shopActive=null,shopSize="",shopColor="",shopFilter="all",shopSearch="",shopSort="featured",shopStep=0,shopPrevious=null,shopToastTimer;
function shopToast(m){toast.textContent=m;toast.classList.add("is-visible");clearTimeout(shopToastTimer);shopToastTimer=setTimeout(()=>toast.classList.remove("is-visible"),2300)}
function shopOpen(panel){shopPrevious=document.activeElement;overlay.hidden=false;panel.hidden=false;document.body.classList.add("drawer-open");panel.querySelector("button,input")?.focus()}
function shopClose(){[bagDrawer,productModal,sizeModal,searchModal,checkoutModal,infoModal,wishlistDrawer].forEach(p=>p.hidden=true);overlay.hidden=true;document.body.classList.remove("drawer-open");if(shopPrevious?.focus)shopPrevious.focus()}
overlay.addEventListener("click",shopClose);document.querySelectorAll("[data-close-modal]").forEach(b=>b.addEventListener("click",shopClose));document.querySelectorAll(".close-drawer").forEach(b=>b.addEventListener("click",shopClose));document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!overlay.hidden)shopClose()});
function shopToggleWish(id){shopWish=shopWish.includes(id)?shopWish.filter(x=>x!==id):shopWish.concat(id);try{localStorage.setItem("studio01-wishlist",JSON.stringify(shopWish))}catch{};document.querySelectorAll("[data-wish]").forEach(b=>b.classList.toggle("is-active",shopWish.includes(b.dataset.wish)));$("wishlistCount").textContent=shopWish.length;$("modalWishlist").classList.toggle("is-active",shopWish.includes(id));shopRenderWish();shopToast(shopWish.includes(id)?"Favorit gespeichert":"Favorit entfernt")}
function shopRenderWish(){const box=$("wishlistItems");box.replaceChildren();if(!shopWish.length){box.innerHTML='<p class="empty-state">Noch nichts gespeichert.</p>';return}shopWish.forEach(id=>{const p=SHOP_PRODUCTS[id];if(!p)return;const row=document.createElement("article");row.className="bag-line";const im=document.createElement("img");im.src=p.image;im.alt="";const info=document.createElement("div");const name=document.createElement("h3");name.textContent=p.name;const price=document.createElement("p");price.textContent=SHOP_EURO.format(p.price);const btn=document.createElement("button");btn.className="text-button";btn.textContent="Details ansehen";btn.addEventListener("click",()=>{shopClose();shopShowProduct(id)});const remove=document.createElement("button");remove.className="text-button";remove.textContent="Entfernen";remove.addEventListener("click",()=>shopToggleWish(id));info.append(name,price,btn,remove);row.append(im,info);box.append(row)})}
$("wishlistOpen").addEventListener("click",()=>{shopRenderWish();shopOpen(wishlistDrawer)});document.querySelectorAll(".product-card").forEach(card=>{const id=card.querySelector("[data-add]")?.dataset.add;if(!id)return;const heart=document.createElement("button");heart.className="wishlist-toggle"+(shopWish.includes(id)?" is-active":"");heart.textContent="♡";heart.setAttribute("aria-label","Zu Favoriten");heart.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();shopToggleWish(id)});card.querySelector(".product-image").append(heart);const quick=card.querySelector("[data-add]");quick.textContent="QUICK VIEW";quick.insertAdjacentHTML("beforeend"," <span>↗</span>");const open=()=>shopShowProduct(id);card.querySelector(".product-image").addEventListener("click",e=>{e.preventDefault();open()});quick.addEventListener("click",e=>{e.preventDefault();open()})});
function shopShowProduct(id){shopActive=id;const p=SHOP_PRODUCTS[id];shopSize="";shopColor=p.colors[0][0];$("modalProductImage").src=p.image;$("modalProductImage").alt=p.name;$("modalProductTitle").textContent=p.name;$("modalProductPrice").textContent=SHOP_EURO.format(p.price);$("modalProductDescription").textContent=p.description;$("selectedColorName").textContent=shopColor;$("sizeError").hidden=true;shopRenderOptions();$("modalWishlist").classList.toggle("is-active",shopWish.includes(id));shopOpen(productModal)}
function shopRenderOptions(){const p=SHOP_PRODUCTS[shopActive];const colors=$("colorOptions");colors.replaceChildren();p.colors.forEach(([name,hex])=>{const b=document.createElement("button");b.className="color-chip"+(name===shopColor?" selected":"");b.style.background=hex;b.title=name;b.setAttribute("aria-label",name);b.addEventListener("click",()=>{shopColor=name;$("selectedColorName").textContent=name;shopRenderOptions()});colors.append(b)});const sizes=$("sizeOptions");sizes.replaceChildren();p.sizes.forEach(s=>{const b=document.createElement("button");b.className="size-button"+(s===shopSize?" selected":"");b.textContent=s;b.addEventListener("click",()=>{shopSize=s;$("sizeError").hidden=true;shopRenderOptions()});sizes.append(b)})}
$("modalWishlist").addEventListener("click",()=>shopToggleWish(shopActive));$("sizeGuideOpen").addEventListener("click",()=>shopOpen(sizeModal));$("modalAddToBag").addEventListener("click",()=>{if(!shopSize){$("sizeError").hidden=false;return}const key=shopActive+"|"+shopSize+"|"+shopColor;shopVariants[key]=(shopVariants[key]||0)+1;try{localStorage.setItem("studio01-variants",JSON.stringify(shopVariants))}catch{};bag[shopActive]=(bag[shopActive]||0)+1;saveBag();shopRenderCart();shopToast(SHOP_PRODUCTS[shopActive].name+" hinzugefügt");shopClose()});
function shopRenderCart(){const box=$("bagItems");box.replaceChildren();const entries=Object.entries(shopVariants);if(!entries.length){box.innerHTML='<p class="empty-bag">Dein Bag ist noch leer.</p>'}let count=0,total=0;entries.forEach(([key,qty])=>{const [id,size,color]=key.split("|"),p=SHOP_PRODUCTS[id];if(!p)return;count+=qty;total+=p.price*qty;const row=document.createElement("article");row.className="bag-line";const im=document.createElement("img");im.src=p.image;im.alt="";const details=document.createElement("div");const title=document.createElement("h3");title.textContent=p.name;const desc=document.createElement("p");desc.textContent=color+" · Größe "+size;const controls=document.createElement("div");controls.className="bag-quantity";const minus=document.createElement("button");minus.textContent="−";minus.dataset.variant=key;minus.dataset-change="-1";const n=document.createElement("span");n.textContent=qty;const plus=document.createElement("button");plus.textContent="+";plus.dataset.variant=key;plus.dataset.change="1";const del=document.createElement("button");del.className="remove-line";del.textContent="Entfernen";del.dataset.deleteVariant=key;controls.append(minus,n,plus,del);details.append(title,desc,controls);const price=document.createElement("span");price.className="bag-line-price";price.textContent=SHOP_EURO.format(p.price*qty);row.append(im,details,price);box.append(row)});$("bagCount").textContent=count;$("drawerCount").textContent="("+count+")";$("bagSubtotal").textContent=SHOP_EURO.format(total);const remain=Math.max(0,100-total);$("shippingMessage").textContent=remain?"Noch "+SHOP_EURO.format(remain)+" bis zum kostenlosen Versand.":"Kostenloser Versand erreicht!";$("shippingProgress").style.width=Math.min(100,total/100*100)+"%"}
$("bagItems").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;if(b.dataset.deleteVariant){delete shopVariants[b.dataset.deleteVariant]}else if(b.dataset.variant){shopVariants[b.dataset.variant]=(shopVariants[b.dataset.variant]||0)+Number(b.dataset.change);if(shopVariants[b.dataset.variant]<=0)delete shopVariants[b.dataset.variant]}else return;try{localStorage.setItem("studio01-variants",JSON.stringify(shopVariants))}catch{};bag={};Object.keys(shopVariants).forEach(k=>{const id=k.split("|")[0];bag[id]=(bag[id]||0)+shopVariants[k]});saveBag();shopRenderCart()});
$("openBag").addEventListener("click",()=>{shopRenderCart();shopOpen(bagDrawer)});$("closeBag").addEventListener("click",shopClose);$("bagOverlay").addEventListener("click",shopClose);
$("searchOpen").addEventListener("click",()=>{shopOpen(searchModal);$("searchInput").value=shopSearch;$("searchInput").focus()});$("searchInput").addEventListener("input",e=>{shopSearch=e.target.value.toLowerCase();shopApplyFilters()});$("searchApply").addEventListener("click",()=>{shopClose();document.querySelector("#collection").scrollIntoView({behavior:"smooth"})});
document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{shopFilter=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>{x.classList.toggle("is-active",x===b);x.setAttribute("aria-pressed",String(x===b))});shopApplyFilters()}));$("sortSelect").addEventListener("change",e=>{shopSort=e.target.value;shopApplyFilters()});
function shopApplyFilters(){const cards=[...document.querySelectorAll(".product-card")];cards.forEach(card=>{const id=card.querySelector("[data-add]")?.dataset.add,p=SHOP_PRODUCTS[id],category=card.dataset.category;const text=(p.name+" "+p.detail+" "+category).toLowerCase();card.dataset.visible=String((shopFilter==="all"||category===shopFilter)&&text.includes(shopSearch)});const sorter={"featured":()=>0,"price-low":(a,b)=>SHOP_PRODUCTS[a.querySelector("[data-add]").dataset.add].price-SHOP_PRODUCTS[b.querySelector("[data-add]").dataset.add].price,"price-high":(a,b)=>SHOP_PRODUCTS[b.querySelector("[data-add]").dataset.add].price-SHOP_PRODUCTS[a.querySelector("[data-add]").dataset.add].price,"name":(a,b)=>SHOP_PRODUCTS[a.querySelector("[data-add]").dataset.add].name.localeCompare(SHOP_PRODUCTS[b.querySelector("[data-add]").dataset.add].name)};cards.sort(sorter[shopSort]).forEach(c=>$("productGrid").append(c));cards.forEach(c=>c.hidden=c.dataset.visible!=="true");const n=cards.filter(c=>c.dataset.visible==="true").length;$("resultCount").textContent=n+" Produkte";$("noResults").hidden=n>0}
const infoCopy={shipping:["Versand & Rückgabe","Versandkosten, Lieferzeiten und Rückgaberegeln sind noch nicht festgelegt. Diese Demo enthält keine echten Bestellungen."],contact:["Kontakt","Die offizielle Kontaktadresse ist noch nicht eingerichtet. Bitte vor Veröffentlichung ersetzen."],imprint:["Impressum","Dieser Platzhalter muss vor einer Veröffentlichung durch vollständige Anbieterinformationen ersetzt werden."],privacy:["Datenschutz","Vor Veröffentlichung muss eine Datenschutzerklärung erstellt werden, die tatsächlich eingesetzte Dienste und Datenverarbeitung beschreibt."],terms:["AGB","Dieser Platzhalter ist keine vollständige AGB oder Rechtsberatung. Vor einem Shopstart rechtlich prüfen lassen."]};document.querySelectorAll("[data-info]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();const [title,text]=infoCopy[a.dataset.info]||["Info","Noch nicht eingerichtet."];$("infoTitle").textContent=title;$("infoContent").textContent=text;shopOpen(infoModal)}));document.querySelectorAll(".placeholder-link").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();shopToast("Social-Media-Link noch nicht eingerichtet")}));
function shopCheckoutSummary(){const box=$("checkoutSummary");box.replaceChildren();Object.entries(shopVariants).forEach(([key,qty])=>{const [id,size,color]=key.split("|"),p=SHOP_PRODUCTS[id];const row=document.createElement("div");row.className="checkout-summary-row";const l=document.createElement("span");l.textContent=p.name+" · "+color+" · "+size+" × "+qty;const r=document.createElement("span");r.textContent=SHOP_EURO.format(p.price*qty);row.append(l,r);box.append(row)});const total=document.createElement("div");total.className="checkout-summary-row";const l=document.createElement("strong");l.textContent="Summe (Demo)";const r=document.createElement("strong");r.textContent=SHOP_EURO.format(Object.entries(shopVariants).reduce((sum,[key,q])=>sum+SHOP_PRODUCTS[key.split("|")[0]].price*q,0));total.append(l,r);box.append(total)}
function shopCheckoutRender(){document.querySelectorAll(".step-dot").forEach((s,i)=>s.classList.toggle("active",i===shopStep));$("checkoutBack").hidden=shopStep===0;if(shopStep===0){$("checkoutStepContent").innerHTML='<p class="small-note">Überprüfe deine Auswahl. Das ist nur eine Simulation.</p>';$("checkoutNext").textContent="DEMO FORTSETZEN"}else if(shopStep===1){$("checkoutStepContent").innerHTML='<form class="checkout-fields" id="demoShippingForm"><label>Vorname<input name="first" required placeholder="Vorname"></label><label>Nachname<input name="last" required placeholder="Nachname"></label><label>E-Mail<input type="email" name="email" required placeholder="name@example.com"></label><label>Adresse<input name="address" required placeholder="Straße, Hausnummer"></label><label>PLZ / Ort<input name="city" required placeholder="PLZ, Ort"></label></form><p class="small-note">Demo: Keine echten persönlichen Daten eingeben. Es wird nichts übertragen oder gespeichert.</p>';$("checkoutNext").textContent="ABSCHLIESSEN"}else{$("checkoutStepContent").innerHTML='<div class="success-message"><h3>Demo beendet.</h3><p>Es wurde keine Bestellung angelegt oder Zahlung ausgeführt.</p></div>';$("checkoutNext").textContent="SCHLIESSEN"}}
$("checkoutButton").addEventListener("click",()=>{if(!Object.keys(shopVariants).length){shopToast("Dein Warenkorb ist leer.");return}shopStep=0;shopCheckoutSummary();shopCheckoutRender();shopOpen(checkoutModal)});$("checkoutNext").addEventListener("click",()=>{if(shopStep===0){shopStep=1;shopCheckoutRender();return}if(shopStep===1){const f=$("demoShippingForm");if(!f.reportValidity())return;shopStep=2;shopCheckoutRender();shopVariants={};bag={};try{localStorage.setItem("studio01-variants","{}")}catch{};saveBag();shopRenderCart();return}shopClose()});$("checkoutBack").addEventListener("click",()=>{shopStep=Math.max(0,shopStep-1);shopCheckoutRender()});
const cookiePref="studio01-cookie-choice";if(!localStorage.getItem(cookiePref))$("cookieBanner").hidden=false;$("cookieAccept").addEventListener("click",()=>{localStorage.setItem(cookiePref,"ok");$("cookieBanner").hidden=true});$("cookieDismiss").addEventListener("click",()=>{localStorage.setItem(cookiePref,"necessary");$("cookieBanner").hidden=true});
$("newsletterForm").addEventListener("submit",e=>{e.preventDefault();const email=$("emailInput");if(!email.checkValidity()){email.reportValidity();return}shopToast("Newsletter-Demo: noch nicht verbunden.");$("formNote").textContent="Danke! Das Formular überträgt keine Daten.";email.value=""});
shopRenderCart();shopRenderWish();$("wishlistCount").textContent=shopWish.length;document.querySelectorAll("[data-wish]").forEach(b=>b.classList.toggle("is-active",shopWish.includes(b.dataset.wish)));