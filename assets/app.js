import { renderMarkdown, escapeHTML } from "./markdown.js";

const catalog = [
  { id:"intro", label:"מבוא — דרך המלך", icon:"👑", group:"יסודות", path:"docs/00-introduction.md" },
  { id:"gates", label:"ששת השערים", icon:"🧭", group:"יסודות", path:"docs/01-six-gates.md" },
  { id:"chapters", label:"15 הפרקים", icon:"📚", group:"יסודות", path:"docs/02-chapters.md" },
  { id:"sor", label:"סור מרע", icon:"🛡️", group:"עבודת המידות", path:"docs/03-sor-mera.md" },
  { id:"good", label:"עשה טוב", icon:"🌱", group:"עבודת המידות", path:"docs/04-aseh-tov.md" },
  { id:"likutim", label:"18 ליקוטים", icon:"💎", group:"עבודת המידות", path:"docs/05-likutim.md" },
  { id:"practice", label:"יומן המלך", icon:"📓", group:"תרגול ופיתוח", path:"docs/06-practice.md" },
  { id:"accuracy", label:"בחינת דיוק", icon:"🔬", group:"תרגול ופיתוח", path:"docs/07-accuracy.md" },
  { id:"edition", label:"אפיון מהדורה 6", icon:"🚀", group:"תרגול ופיתוח", path:"docs/08-edition-6.md" },
  { id:"sources", label:"מקורות וקרדיטים", icon:"🔗", group:"תרגול ופיתוח", path:"docs/09-sources.md" },
  { id:"todo", label:"120 משימות", icon:"☑", group:"ניהול המאגר", path:"TODO.md" },
  { id:"changes", label:"יומן גרסאות", icon:"🏷️", group:"ניהול המאגר", path:"CHANGELOG.md" },
  { id:"readme", label:"README", icon:"📘", group:"ניהול המאגר", path:"README.md" }
];

const byId = new Map(catalog.map(function (item) { return [item.id, item]; }));
const cache = new Map();
const nav = document.querySelector("#doc-nav");
const article = document.querySelector("#article-content");
const activeTitle = document.querySelector("#article-title");
const breadcrumb = document.querySelector("#breadcrumb-label");
const search = document.querySelector("#search-input");
const sidebar = document.querySelector("#sidebar");
const backdrop = document.querySelector("#mobile-backdrop");
let current = null;
let toastTimer;
let searchTimer;

function loadStates() {
  try { return JSON.parse(localStorage.getItem("kb-task-states") || "{}"); }
  catch (_) { return {}; }
}
function saveStates(states) {
  try { localStorage.setItem("kb-task-states", JSON.stringify(states)); }
  catch (_) { showToast("שמירה מקומית אינה זמינה בדפדפן הזה"); }
}
function showToast(message) {
  const element = document.querySelector("#toast");
  element.textContent = message;
  element.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { element.classList.remove("visible"); }, 2600);
}
function getPath(docId) {
  return byId.has(docId) ? byId.get(docId).path : "docs/00-introduction.md";
}
async function getText(path) {
  if (cache.has(path)) return cache.get(path);
  const response = await fetch(path, { cache:"no-cache" });
  if (!response.ok) throw new Error("HTTP " + response.status);
  const text = await response.text();
  cache.set(path, text);
  return text;
}
function localRender(text, prefix) {
  return renderMarkdown(text, { checkboxPrefix:prefix, taskStates:loadStates() });
}
function setNav(items) {
  nav.replaceChildren();
  let lastGroup = "";
  items.forEach(function (item) {
    if (item.group !== lastGroup) {
      const heading = document.createElement("div");
      heading.className = "nav-group-title";
      heading.textContent = item.group;
      nav.append(heading);
      lastGroup = item.group;
    }
    const link = document.createElement("a");
    link.className = "doc-link" + (current && item.id === current.id ? " active" : "");
    link.href = "#/" + item.id;
    if (current && item.id === current.id) link.setAttribute("aria-current", "page");
    const emoji = document.createElement("span");
    emoji.className = "nav-emoji";
    emoji.textContent = item.icon;
    const title = document.createElement("span");
    title.className = "nav-title";
    title.textContent = item.label;
    link.append(emoji, title);
    link.addEventListener("click", closeSidebar);
    nav.append(link);
  });
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty-search";
    empty.textContent = "לא נמצאו מסמכים. נסה מילה אחרת.";
    nav.append(empty);
  }
}
async function navigate() {
  const id = decodeURIComponent(location.hash.replace(/^#\/?/, "")) || "intro";
  current = byId.get(id) || byId.get("intro");
  activeTitle.textContent = current.label;
  breadcrumb.textContent = current.label;
  document.title = current.label + " · KingBalance";
  article.innerHTML = '<p class="loading">טוען את ' + escapeHTML(current.label) + "...</p>";
  setNav(catalog);
  const chosenId = current.id;
  try {
    const text = await getText(current.path);
    if (current.id !== chosenId) return;
    article.innerHTML = localRender(text, chosenId);
    bindCheckboxes(article);
    document.querySelector("#article-subtitle").textContent = "המסמך המקורי של המאגר מוצג כאן בפורמט קריא ונגיש.";
  } catch (error) {
    article.innerHTML = '<h2>לא ניתן לטעון מסמך</h2><p>האתר מיועד ל־GitHub Pages או לשרת HTTP מקומי. בדוק שקובצי המאגר הועלו יחד ושלא פתחת את index.html ישירות כקובץ.</p><p class="loading">' + escapeHTML(error.message) + "</p>";
  }
  if (search.value) runSearch(search.value);
}
function bindCheckboxes(container) {
  container.querySelectorAll(".local-task-checkbox").forEach(function (checkbox) {
    checkbox.addEventListener("change", function () {
      const states = loadStates();
      states[checkbox.dataset.taskId] = checkbox.checked;
      saveStates(states);
      const item = checkbox.closest("li");
      if (item) item.classList.toggle("checked", checkbox.checked);
      document.querySelectorAll('.local-task-checkbox[data-task-id="' + CSS.escape(checkbox.dataset.taskId) + '"]').forEach(function (other) {
        if (other !== checkbox) {
          other.checked = checkbox.checked;
          const parent = other.closest("li");
          if (parent) parent.classList.toggle("checked", checkbox.checked);
        }
      });
      updateTodoProgress();
    });
  });
}
async function updateTodoProgress() {
  try {
    const text = await getText("TODO.md");
    const matches = Array.from(text.matchAll(/^- \[([ xX])\] (KB-\d{3})/gm));
    const states = loadStates();
    const completed = matches.filter(function (match) {
      return Object.prototype.hasOwnProperty.call(states, match[2]) ? Boolean(states[match[2]]) : /x/i.test(match[1]);
    }).length;
    const percent = matches.length ? Math.round(completed / matches.length * 100) : 0;
    document.querySelector("#todo-small-count").textContent = completed + "/" + matches.length;
    document.querySelector("#todo-progress-bar").style.width = percent + "%";
    document.querySelector("#todo-progress").setAttribute("aria-valuenow", String(percent));
  } catch (_) {
    document.querySelector("#todo-small-count").textContent = "לא זמין";
  }
}
function openSidebar() {
  sidebar.classList.add("open");
  backdrop.hidden = false;
  document.querySelector("#close-sidebar").focus();
}
function closeSidebar() {
  sidebar.classList.remove("open");
  backdrop.hidden = true;
}
function openDialog(id) {
  const dialog = document.getElementById(id);
  if (!dialog.open) dialog.showModal();
}
async function openMarkdownDialog(id, path, contentId, prefix) {
  const container = document.getElementById(contentId);
  container.innerHTML = '<p class="loading">טוען נתונים...</p>';
  openDialog(id);
  try {
    const text = await getText(path);
    container.innerHTML = localRender(text, prefix);
    bindCheckboxes(container);
  } catch (error) {
    container.textContent = "טעינת המסמך נכשלה: " + error.message;
  }
}
async function runSearch(query) {
  const term = String(query).trim().toLocaleLowerCase("he");
  if (!term) {
    setNav(catalog);
    document.getElementById("search-status").textContent = "";
    return;
  }
  await Promise.all(catalog.map(function (doc) { return getText(doc.path).catch(function () { return ""; }); }));
  if (search.value.trim().toLocaleLowerCase("he") !== term) return;
  const results = catalog.filter(function (doc) {
    return doc.label.toLocaleLowerCase("he").includes(term) ||
      (cache.get(doc.path) || "").toLocaleLowerCase("he").includes(term);
  });
  setNav(results);
  document.getElementById("search-status").textContent = "נמצאו " + results.length + " מסמכים.";
}

document.querySelector("#open-sidebar").addEventListener("click", openSidebar);
document.querySelector("#close-sidebar").addEventListener("click", closeSidebar);
backdrop.addEventListener("click", closeSidebar);
window.addEventListener("hashchange", navigate);
search.addEventListener("input", function () {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(function () { runSearch(search.value); }, 170);
});
document.querySelector("#version-top").addEventListener("click", function () { openMarkdownDialog("version-modal", "CHANGELOG.md", "version-content", "changelog"); });
document.querySelector("#version-sidebar").addEventListener("click", function () { openMarkdownDialog("version-modal", "CHANGELOG.md", "version-content", "changelog"); });
document.querySelector("#todo-top").addEventListener("click", function () { openMarkdownDialog("todo-modal", "TODO.md", "todo-content", "todo"); });
["about-top", "about-hero", "footer-about"].forEach(function (id) {
  document.getElementById(id).addEventListener("click", function () { openDialog("about-modal"); });
});
document.querySelectorAll("[data-close]").forEach(function (button) {
  button.addEventListener("click", function () { document.getElementById(button.dataset.close).close(); });
});
document.querySelectorAll("dialog").forEach(function (dialog) {
  dialog.addEventListener("click", function (event) { if (event.target === dialog) dialog.close(); });
});
document.querySelector("#copy-source").addEventListener("click", async function () {
  try {
    const raw = await getText(getPath(current ? current.id : "intro"));
    await navigator.clipboard.writeText(raw);
    showToast("טקסט Markdown הועתק ללוח.");
  } catch (_) {
    showToast("העתקה אינה זמינה בדפדפן הזה.");
  }
});
document.querySelector("#print-page").addEventListener("click", function () { window.print(); });
const theme = document.querySelector("#theme-toggle");
let savedTheme = "dark";
try { savedTheme = localStorage.getItem("kb-theme") || "dark"; } catch (_) {}
document.documentElement.dataset.theme = savedTheme;
theme.textContent = savedTheme === "dark" ? "☀" : "☾";
theme.addEventListener("click", function () {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  theme.textContent = next === "dark" ? "☀" : "☾";
  try { localStorage.setItem("kb-theme", next); } catch (_) {}
});
let largeText = false;
try { largeText = localStorage.getItem("kb-large-text") === "yes"; } catch (_) {}
document.documentElement.style.setProperty("--read-size", largeText ? "1.13rem" : "1rem");
document.querySelector("#font-toggle").addEventListener("click", function () {
  largeText = !largeText;
  document.documentElement.style.setProperty("--read-size", largeText ? "1.13rem" : "1rem");
  try { localStorage.setItem("kb-large-text", largeText ? "yes" : "no"); } catch (_) {}
});
setNav(catalog);
navigate();
updateTodoProgress();
