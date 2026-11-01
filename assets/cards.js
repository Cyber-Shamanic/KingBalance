const $ = (selector) => document.querySelector(selector);
const state = { cards: [], styles: [], current: 0, style: 1, flipped: false };
const labels = [ ["peshat", "פשט"], ["remez", "רמז"], ["drash", "דרש"], ["sod", "סוד"] ];
let toastTimer;

function say(message) {
  const el = $("#cards-toast");
  el.textContent = message;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 2500);
}

function sourceLabel(card) {
  return `פרק ${card.source.chapter} · עמ׳ ${card.source.pages} · ${card.source.section}`;
}

function flip(force) {
  state.flipped = typeof force === "boolean" ? force : !state.flipped;
  $("#card-preview").classList.toggle("flipped", state.flipped);
  $("#card-flip").setAttribute("aria-pressed", String(state.flipped));
}

function displayCard(index) {
  state.current = (index + state.cards.length) % state.cards.length;
  const card = state.cards[state.current];
  $("#selected-heading").textContent = `${card.symbol} ${card.title}`;
  $("#selected-source").textContent = sourceLabel(card);
  $("#front-id").textContent = `${String(state.current + 1).padStart(2,"0")} / 44`;
  $("#front-title").textContent = card.title;
  $("#front-quote").textContent = card.sor;
  $("#back-title").textContent = card.title;
  $("#back-quote").textContent = card.good;
  $("#front-source").textContent = sourceLabel(card);
  $("#back-source").textContent = sourceLabel(card);
  const short = $("#back-pardes");
  short.replaceChildren();
  for (const [key, label] of labels) {
    const line = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = label + ":";
    line.append(strong, document.createTextNode(card.pardes[key]));
    short.append(line);
  }
  const grid = $("#pardes-grid");
  grid.replaceChildren();
  for (const [key, label] of labels) {
    const cell = document.createElement("div");
    cell.className = "pardes-cell";
    const name = document.createElement("strong");
    name.textContent = label;
    const body = document.createElement("p");
    body.textContent = card.pardes[key];
    cell.append(name, body);
    grid.append(cell);
  }
  $("#practice-text").textContent = card.practice;
  flip(false);
  document.querySelectorAll(".mini-card").forEach((element) => {
    const selected = element.dataset.cardId === card.id;
    element.classList.toggle("selected", selected);
    element.setAttribute("aria-pressed", String(selected));
  });
}

function chooseStyle(id) {
  state.style = id;
  $("#card-preview").className = `card-preview frame-style-${id}` + (state.flipped ? " flipped" : "");
  document.querySelectorAll(".style-choice").forEach((element) => {
    const selected = Number(element.dataset.style) === id;
    element.classList.toggle("active", selected);
    element.setAttribute("aria-pressed", String(selected));
  });
  try { localStorage.setItem("kb-card-frame", String(id)); } catch (_) { /* optional preference */ }
}

function buildStyles() {
  const gallery = $("#style-gallery");
  for (const style of state.styles) {
    const button = document.createElement("button");
    button.className = `style-choice frame-style-${style.id}`;
    button.type = "button";
    button.dataset.style = style.id;
    button.title = `${style.name} · ${style.en}`;
    const swatch = document.createElement("span");
    swatch.className = "style-swatch";
    swatch.textContent = ["♛","◆","❧","✥","✣","✦","☼","◇","☾","〰","▥","⌁"][style.id - 1];
    const name = document.createElement("span");
    name.textContent = style.name;
    button.append(swatch, name);
    button.addEventListener("click", () => chooseStyle(style.id));
    gallery.append(button);
  }
  let saved = 1;
  try { saved = Number(localStorage.getItem("kb-card-frame")) || 1; } catch (_) { /* optional */ }
  chooseStyle(saved >= 1 && saved <= state.styles.length ? saved : 1);
}

function buildCollection() {
  const categories = [...new Set(state.cards.map((card) => card.category))];
  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    $("#category-filter").append(option);
  }
  renderResults();
  $("#card-search").addEventListener("input", renderResults);
  $("#category-filter").addEventListener("change", renderResults);
}

function renderResults() {
  const query = $("#card-search").value.trim().toLocaleLowerCase("he");
  const category = $("#category-filter").value;
  const filtered = state.cards.filter((card) =>
    (!category || card.category === category) &&
    (!query || [card.title, card.sor, card.good, card.share, card.source.section, String(card.source.chapter), ...Object.values(card.pardes)].join(" ").toLocaleLowerCase("he").includes(query))
  );
  $("#results-count").textContent = `${filtered.length} מתוך ${state.cards.length} קלפים`;
  const grid = $("#cards-grid");
  grid.replaceChildren();
  for (const card of filtered) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mini-card";
    button.dataset.cardId = card.id;
    const id = document.createElement("span"); id.className="mini-card-id"; id.textContent=card.id;
    const title = document.createElement("span"); title.className="mini-card-title"; title.textContent=`${card.symbol} ${card.title}`;
    const phrase = document.createElement("span"); phrase.className="mini-card-phrase"; phrase.textContent=card.share;
    const source = document.createElement("span"); source.className="mini-card-source"; source.textContent=`פרק ${card.source.chapter} · עמ׳ ${card.source.pages}`;
    button.append(id,title,phrase,source);
    button.setAttribute("aria-pressed", String(state.cards[state.current]?.id === card.id));
    if (state.cards[state.current]?.id === card.id) button.classList.add("selected");
    button.addEventListener("click", () => {
      displayCard(state.cards.indexOf(card));
      $("#selected-heading").scrollIntoView({behavior:"smooth",block:"center"});
    });
    grid.append(button);
  }
}

// A date in Jerusalem yields the same daily card across all visitors in Israel.
function dailyIndex() {
  const date = new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Jerusalem",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  let hash = 2166136261;
  for (const char of date) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0) % state.cards.length;
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    say("הטקסט הועתק בהצלחה ✨");
  } catch (_) {
    const field = document.createElement("textarea");
    field.value = value;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    const ok = document.execCommand("copy");
    field.remove();
    say(ok ? "הטקסט הועתק בהצלחה ✨" : "לא ניתן להעתיק בדפדפן זה");
  }
}

async function init() {
  try {
    const [cardsResponse, stylesResponse] = await Promise.all([fetch("data/cards.json"),fetch("data/styles.json")]);
    if (!cardsResponse.ok || !stylesResponse.ok) throw new Error("קובצי מאגר חסרים");
    state.cards = (await cardsResponse.json()).cards;
    state.styles = (await stylesResponse.json()).styles;
    if (state.cards.length !== 44 || state.styles.length !== 12) throw new Error("נתוני המאגר אינם שלמים");
    buildStyles();
    buildCollection();
    displayCard(dailyIndex());
    $("#daily-pick").addEventListener("click", () => { displayCard(dailyIndex());say("נבחר הקלף של היום ☀️"); });
    $("#random-pick").addEventListener("click", () => {
      const values = new Uint32Array(1);
      crypto.getRandomValues(values);
      let index = values[0] % (state.cards.length - 1);
      if (index >= state.current) index++;
      displayCard(index);
    });
    $("#prev-card").addEventListener("click", () => displayCard(state.current - 1));
    $("#next-card").addEventListener("click", () => displayCard(state.current + 1));
    $("#card-flip").addEventListener("click", () => flip());
    $("#flip-cta").addEventListener("click", () => flip());
    $("#copy-card").addEventListener("click", () => {
      const c = state.cards[state.current];
      copyText(`${c.title} · ${c.id}\nסור מרע: ${c.sor}\nעשה טוב: ${c.good}\nפשט: ${c.pardes.peshat}\nרמז: ${c.pardes.remez}\nדרש: ${c.pardes.drash}\nסוד: ${c.pardes.sod}\nלמעשה: ${c.practice}\nמראה מקום: ${sourceLabel(c)}\nביאור עצמאי · KingBalance`);
    });
    $("#share-card").addEventListener("click", () => {
      const c = state.cards[state.current];
      copyText(`💎 ${c.share}\nKingBalance · ${c.id} · #סור_מרע_ועשה_טוב`);
    });
  } catch (error) {
    $("#selected-heading").textContent = "לא ניתן לטעון את חפיסת הקלפים";
    $("#selected-source").textContent = `${error.message}. יש לפתוח את האתר דרך GitHub Pages או שרת HTTP מקומי.`;
  }
}

init();
