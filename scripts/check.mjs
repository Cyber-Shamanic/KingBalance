import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const required = [
  "README.md", "CHANGELOG.md", "TODO.md", "ATTRIBUTION.md", "CONTRIBUTING.md",
  "GITHUB_SETUP.md", "index.html", ".nojekyll",
  "assets/style.css", "assets/app.js", "assets/markdown.js", "assets/favicon.svg",
  "docs/00-introduction.md", "docs/01-six-gates.md", "docs/02-chapters.md",
  "docs/03-sor-mera.md", "docs/04-aseh-tov.md", "docs/05-likutim.md",
  "docs/06-practice.md", "docs/07-accuracy.md", "docs/08-edition-6.md",
  "docs/09-sources.md"
];
let failures = 0;
for (const file of required) {
  if (!existsSync(join(root, file))) {
    console.error("חסר קובץ: " + file);
    failures++;
  }
}
const todo = readFileSync(join(root, "TODO.md"), "utf8");
const tasks = Array.from(todo.matchAll(/^- \[([ xX])\] (KB-\d{3})/gm));
const unique = new Set(tasks.map((match) => match[2]));
if (tasks.length !== 120 || unique.size !== 120) {
  console.error("נדרשות בדיוק 120 משימות עם מזהים ייחודיים: נמצאו " + tasks.length);
  failures++;
}
const source = readFileSync(join(root, "docs/05-likutim.md"), "utf8");
const rows = source.split("\n").filter((line) => /^\| \d{2} \|/.test(line));
if (rows.length !== 18) {
  console.error("נדרשים 18 ליקוטים: נמצאו " + rows.length);
  failures++;
}
const chapterMap = readFileSync(join(root, "docs/02-chapters.md"), "utf8");
const chapters = chapterMap.split("\n").filter((line) => /^\| \d{1,2} \|/.test(line));
if (chapters.length !== 15) {
  console.error("נדרש מיפוי של 15 פרקים: נמצאו " + chapters.length);
  failures++;
}
const prohibited = [];
function walk(dir) {
  for (const item of readdirSync(dir, { withFileTypes:true })) {
    if (item.name === ".git") continue;
    const full = join(dir, item.name);
    if (item.isDirectory()) walk(full);
    else if (item.isFile() && /\.pdf$/i.test(item.name)) prohibited.push(full);
  }
}
walk(root);
if (prohibited.length) {
  console.error("אין לכלול PDF של הספר המקורי ללא הרשאה.");
  failures++;
}
console.log("קבצי חובה: " + required.length);
console.log("משימות: " + tasks.length + " | ליקוטים: " + rows.length + " | פרקים: " + chapters.length);
if (failures) process.exit(1);
console.log("✔ בדיקת המאגר הסתיימה בהצלחה.");
