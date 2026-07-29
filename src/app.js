/**
 * Loads the sidebar from manifest.json, then fetches and renders one
 * content/*.md file at a time — the section you are actually looking at.
 * No question or answer text is baked into index.html.
 */
(function () {
  var manifest = [];
  var byOrder = {};
  var cache = {};

  var main = document.getElementById("main");
  var nav = document.getElementById("nav");
  var menubtn = document.getElementById("menubtn");
  var scrim = document.getElementById("scrim");
  var topbarTitle = document.getElementById("topbar-title");

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* ---------- Markdown ----------------------------------------------------
     Mirrors scripts/lib.js:
       ##  question, trailing (E|M|H) is the difficulty
       ### follow-up
       fenced block, code kept verbatim
       anything else, a prose paragraph
  ------------------------------------------------------------------------ */
  function parseMarkdown(src) {
    var m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    var rest = m ? m[2] : src;
    var lines = rest.split("\n");
    var questions = [];
    var q = null;
    var f = null;
    var para = [];

    function flush() {
      var text = para.join(" ").replace(/\s+/g, " ").trim();
      para = [];
      if (text && q) (f ? f.body : q.body).push({ type: "p", text: text });
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var fence = line.match(/^(`{3,})\s*\w*$/);

      if (fence) {
        flush();
        var close = fence[1];
        var code = [];
        i++;
        while (i < lines.length && lines[i].replace(/\s+$/, "") !== close) {
          code.push(lines[i++]);
        }
        if (q) {
          (f ? f.body : q.body).push({
            type: "code",
            text: code.join("\n").replace(/\s+$/, ""),
          });
        }
        continue;
      }

      if (line.indexOf("## ") === 0) {
        flush();
        var t = line.slice(3).match(/^(.*?)(?:\s+\(([EMH])\))?$/);
        q = { prompt: t[1], difficulty: t[2] || null, body: [], followups: [] };
        f = null;
        questions.push(q);
        continue;
      }

      if (line.indexOf("### ") === 0) {
        flush();
        if (q) {
          f = { prompt: line.slice(4), body: [] };
          q.followups.push(f);
        }
        continue;
      }

      if (line.trim() === "") flush();
      else para.push(line.trim());
    }
    flush();
    return questions;
  }

  /* ---------- rendering --------------------------------------------------- */
  function tag(d) {
    return d ? ' <span class="tag">(' + d + ")</span>" : "";
  }

  function renderBody(body, paraClass, codeClass) {
    return body
      .map(function (b) {
        return b.type === "p"
          ? '<p class="' + paraClass + '">' + esc(b.text) + "</p>"
          : '<pre class="' +
              codeClass +
              '"><code>' +
              esc(b.text) +
              "</code></pre>";
      })
      .join("\n");
  }

  function renderAnswered(questions) {
    return questions
      .map(function (q) {
        var parts = [
          "<h3>" + esc(q.prompt) + tag(q.difficulty) + "</h3>",
          renderBody(q.body, "", ""),
        ];
        q.followups.forEach(function (f) {
          parts.push(
            '<div class="follow"><h4>' +
              esc(f.prompt) +
              "</h4>" +
              renderBody(f.body, "f", "f") +
              "</div>",
          );
        });
        return '<div class="qa">' + parts.join("\n") + "</div>";
      })
      .join("\n");
  }

  function renderQuestionsOnly(questions) {
    return (
      '<ul class="qlist">' +
      questions
        .map(function (q) {
          var flist = q.followups.length
            ? '<ul class="flist">' +
              q.followups
                .map(function (f) {
                  return "<li>" + esc(f.prompt) + "</li>";
                })
                .join("") +
              "</ul>"
            : "";
          return "<li>" + esc(q.prompt) + tag(q.difficulty) + flist + "</li>";
        })
        .join("") +
      "</ul>"
    );
  }

  function renderPager(meta) {
    var prev = byOrder[meta.order - 1];
    var next = byOrder[meta.order + 1];
    var left = prev
      ? '<a class="pn" href="#s' +
        prev.order +
        '">&larr; ' +
        esc(prev.number + ". " + prev.title) +
        "</a>"
      : '<span class="pn ghost"></span>';
    var right = next
      ? '<a class="pn" href="#s' +
        next.order +
        '">' +
        esc(next.number + ". " + next.title) +
        " &rarr;</a>"
      : '<span class="pn ghost"></span>';
    return '<div class="pager">' + left + right + "</div>";
  }

  function renderSection(meta, questions) {
    var answered = meta.status === "answered";
    return (
      '<section id="s' +
      meta.order +
      '" class="section current">' +
      '<div class="eyebrow">' +
      esc(meta.group) +
      "</div>" +
      "<h2>" +
      esc(meta.number + ". " + meta.title) +
      "</h2>" +
      (answered
        ? '<div class="badge done">Answers written</div>'
        : '<div class="badge todo">Questions only &mdash; answers not written yet</div>') +
      (answered ? renderAnswered(questions) : renderQuestionsOnly(questions)) +
      renderPager(meta) +
      "</section>"
    );
  }

  /* ---------- sidebar ----------------------------------------------------- */
  function renderNav() {
    var out = [];
    var group = null;
    manifest.forEach(function (s) {
      if (s.group !== group) {
        group = s.group;
        out.push('<div class="navgroup">' + esc(group) + "</div>");
      }
      var done = s.status === "answered";
      out.push(
        '<a class="navlink' +
          (done ? " answered" : "") +
          '" href="#s' +
          s.order +
          '" data-idx="' +
          s.order +
          '"><span class="dot' +
          (done ? " on" : "") +
          '"></span>' +
          esc(s.number + ". " + s.title) +
          "</a>",
      );
    });
    nav.innerHTML = out.join("\n");

    var done = manifest.filter(function (s) {
      return s.status === "answered";
    }).length;
    document.getElementById("pfill").style.width =
      ((done / manifest.length) * 100).toFixed(1) + "%";
    document.getElementById("pnum").textContent =
      done + " of " + manifest.length + " sections answered";
  }

  /* ---------- drawer ------------------------------------------------------ */
  function setNav(open) {
    document.body.classList.toggle("navopen", open);
    scrim.hidden = !open;
    menubtn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  /* ---------- routing ----------------------------------------------------- */
  function currentOrder() {
    var m = location.hash.match(/^#s(\d+)$/);
    var n = m ? Number(m[1]) : null;
    return byOrder[n] ? n : manifest[0].order;
  }

  function highlight(order) {
    Array.prototype.forEach.call(nav.querySelectorAll(".navlink"), function (l) {
      var on = l.getAttribute("href") === "#s" + order;
      l.classList.toggle("active", on);
      if (on) l.scrollIntoView({ block: "nearest" });
    });
  }

  function show(order) {
    var meta = byOrder[order] || manifest[0];
    highlight(meta.order);
    topbarTitle.textContent = meta.number + ". " + meta.title;
    setNav(false);
    window.scrollTo(0, 0);

    if (cache[meta.order]) {
      main.innerHTML = renderSection(meta, cache[meta.order]);
      return;
    }

    main.innerHTML =
      '<section class="section current"><p class="">Loading&hellip;</p></section>';

    fetch(meta.file)
      .then(function (r) {
        if (!r.ok) throw new Error(r.status + " " + r.statusText);
        return r.text();
      })
      .then(function (src) {
        cache[meta.order] = parseMarkdown(src);
        // ignore a response that arrived after the user navigated away
        if (currentOrder() === meta.order) {
          main.innerHTML = renderSection(meta, cache[meta.order]);
        }
      })
      .catch(function (err) {
        main.innerHTML =
          '<section class="section current"><h2>Could not load section</h2>' +
          '<p class="">' +
          esc(meta.file + " — " + err.message) +
          "</p><p class=\"\">This page loads content with fetch(), which " +
          "browsers block on file:// URLs. Serve the folder over HTTP " +
          "instead: <code>npm start</code></p></section>";
      });
  }

  function route() {
    show(currentOrder());
  }

  /* ---------- boot -------------------------------------------------------- */
  fetch("manifest.json")
    .then(function (r) {
      if (!r.ok) throw new Error(r.status + " " + r.statusText);
      return r.json();
    })
    .then(function (data) {
      manifest = data.sort(function (a, b) {
        return a.order - b.order;
      });
      manifest.forEach(function (s) {
        byOrder[s.order] = s;
      });
      renderNav();
      route();
      window.addEventListener("hashchange", route);
    })
    .catch(function (err) {
      main.innerHTML =
        '<section class="section current"><h2>Could not load manifest.json</h2>' +
        '<p class="">' +
        esc(err.message) +
        '</p><p class="">Run <code>npm run build</code>, then serve over HTTP ' +
        "with <code>npm start</code> — fetch() does not work on file:// URLs." +
        "</p></section>";
    });

  menubtn.addEventListener("click", function () {
    setNav(!document.body.classList.contains("navopen"));
  });
  scrim.addEventListener("click", function () {
    setNav(false);
  });

  // J / K or shift+arrows to move between sections, Escape closes the drawer
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") return setNav(false);
    if (e.metaKey || e.ctrlKey || e.target.tagName === "INPUT") return;
    if (!manifest.length) return;
    var i = currentOrder();
    if (e.key === "j" || (e.key === "ArrowDown" && e.shiftKey)) {
      if (byOrder[i + 1]) location.hash = "s" + (i + 1);
    }
    if (e.key === "k" || (e.key === "ArrowUp" && e.shiftKey)) {
      if (byOrder[i - 1]) location.hash = "s" + (i - 1);
    }
  });
})();
