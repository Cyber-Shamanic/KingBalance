/* KingBalance — lightweight Markdown renderer for trusted repository documents.
   No third-party dependencies; all raw HTML is escaped. */

export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, function (c) {
    return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c];
  });
}

function safeHref(value) {
  var href = String(value).trim();
  if (/^(https?:\/\/|mailto:|#\/)/i.test(href)) return href;
  if (/^(?:docs\/|assets\/)[\w./%-]+$/i.test(href)) return href;
  if (/^(?:README|CHANGELOG|TODO|ATTRIBUTION|CONTRIBUTING)\.md$/i.test(href)) return href;
  return "";
}

function inline(raw) {
  var value = escapeHTML(raw);
  var links = [];
  value = value.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, title, href) {
    var safe = safeHref(href);
    if (!safe) return title;
    var placeholder = "KBLINKPLACEHOLDER" + links.length + "END";
    var external = /^https?:\/\//.test(safe);
    links.push('<a href="' + escapeHTML(safe) + '"' + (external ? ' target="_blank" rel="noopener noreferrer"' : "") + ">" + title + "</a>");
    return placeholder;
  });
  value = value.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  value = value.replace(/(^|[\s(])\*([^*]+)\*/g, "$1<em>$2</em>");
  var tick = String.fromCharCode(96);
  var fragments = value.split(tick);
  if (fragments.length > 1) {
    value = fragments.map(function (part, i) {
      return i % 2 ? "<code>" + part + "</code>" : part;
    }).join("");
  }
  value = value.replace(/KBLINKPLACEHOLDER(\d+)END/g, function (_, i) { return links[Number(i)] || ""; });
  return value;
}

function tableCells(line) {
  return line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map(function (cell) { return cell.trim(); });
}

function isDivider(line) {
  return /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && /---/.test(line);
}

function isBoundary(line) {
  return /^\s*(?:#{1,6}\s|[-*]\s|>\s?|---+\s*$|\d+[.)]\s|\|)/.test(line) || line.trim() === "";
}

function taskId(line, index, prefix) {
  var match = line.match(/\bKB-\d{3}\b/);
  return match ? match[0] : prefix + "-" + index;
}

export function renderMarkdown(markdown, options) {
  var opts = options || {};
  var states = opts.taskStates || {};
  var prefix = opts.checkboxPrefix || "doc";
  var lines = String(markdown || "").replace(/\r/g, "").split("\n");
  var html = [];
  var index = 0;
  var checkboxIndex = 0;

  while (index < lines.length) {
    var line = lines[index];
    if (!line.trim()) { index++; continue; }

    var heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      var level = heading[1].length;
      var label = heading[2];
      html.push("<h" + level + ">" + inline(label) + "</h" + level + ">");
      index++; continue;
    }
    if (/^\s*(?:---+|\*\*\*+)\s*$/.test(line)) {
      html.push("<hr>"); index++; continue;
    }
    if (line.trim().startsWith(String.fromCharCode(96).repeat(3))) {
      var source = [];
      index++;
      while (index < lines.length && !lines[index].trim().startsWith(String.fromCharCode(96).repeat(3))) {
        source.push(lines[index++]);
      }
      if (index < lines.length) index++;
      html.push("<pre><code>" + escapeHTML(source.join("\n")) + "</code></pre>");
      continue;
    }
    if (/^\s*>/.test(line)) {
      var quote = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) {
        quote.push(lines[index++].replace(/^\s*>\s?/, ""));
      }
      html.push("<blockquote><p>" + inline(quote.join(" ")) + "</p></blockquote>");
      continue;
    }
    if (/^\s*\|/.test(line) && index + 1 < lines.length && isDivider(lines[index + 1])) {
      var headers = tableCells(line);
      var table = '<div class="table-wrap"><table><thead><tr>';
      headers.forEach(function (cell) { table += "<th>" + inline(cell) + "</th>"; });
      table += "</tr></thead><tbody>";
      index += 2;
      while (index < lines.length && /^\s*\|/.test(lines[index])) {
        var cols = tableCells(lines[index++]);
        table += "<tr>";
        headers.forEach(function (_, col) { table += "<td>" + inline(cols[col] || "") + "</td>"; });
        table += "</tr>";
      }
      html.push(table + "</tbody></table></div>");
      continue;
    }
    if (/^\s*[-*]\s+\[[ xX]\]\s+/.test(line)) {
      var items = [];
      while (index < lines.length && /^\s*[-*]\s+\[[ xX]\]\s+/.test(lines[index])) {
        var raw = lines[index];
        var canonical = /^\s*[-*]\s+\[[xX]\]/.test(raw);
        var id = taskId(raw, checkboxIndex++, prefix);
        var isChecked = Object.prototype.hasOwnProperty.call(states, id) ? Boolean(states[id]) : canonical;
        var label = raw.replace(/^\s*[-*]\s+\[[ xX]\]\s+/, "");
        items.push('<li class="' + (isChecked ? "checked" : "") + '"><label><input type="checkbox" class="local-task-checkbox" data-task-id="' + escapeHTML(id) + '"' + (isChecked ? " checked" : "") + '><span>' + inline(label) + "</span></label></li>");
        index++;
      }
      html.push('<ul class="check-list">' + items.join("") + "</ul>");
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      var bullets = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index]) && !/^\s*[-*]\s+\[[ xX]\]\s+/.test(lines[index])) {
        bullets.push("<li>" + inline(lines[index++].replace(/^\s*[-*]\s+/, "")) + "</li>");
      }
      html.push("<ul>" + bullets.join("") + "</ul>");
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      var ordered = [];
      while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index])) {
        ordered.push("<li>" + inline(lines[index++].replace(/^\s*\d+[.)]\s+/, "")) + "</li>");
      }
      html.push("<ol>" + ordered.join("") + "</ol>");
      continue;
    }
    var paragraph = [line.trim()];
    index++;
    while (index < lines.length && !isBoundary(lines[index])) {
      paragraph.push(lines[index++].trim());
    }
    html.push("<p>" + inline(paragraph.join(" ")) + "</p>");
  }
  return html.join("\n");
}
