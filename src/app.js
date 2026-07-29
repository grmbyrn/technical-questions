// one section on screen at a time, driven by the URL hash
var links = document.querySelectorAll(".navlink");
var sections = document.querySelectorAll(".section");
var map = {};
links.forEach(function (l) {
  map[l.getAttribute("href").slice(1)] = l;
});
var ids = Array.prototype.map.call(sections, function (s) {
  return s.id;
});

var menubtn = document.getElementById("menubtn");
var scrim = document.getElementById("scrim");
var topbarTitle = document.getElementById("topbar-title");

function setNav(open) {
  document.body.classList.toggle("navopen", open);
  scrim.hidden = !open;
  menubtn.setAttribute("aria-expanded", open ? "true" : "false");
}

function show(id) {
  if (ids.indexOf(id) === -1) id = ids[0];
  sections.forEach(function (s) {
    s.classList.toggle("current", s.id === id);
  });
  links.forEach(function (l) {
    l.classList.remove("active");
  });
  var link = map[id];
  if (link) {
    link.classList.add("active");
    link.scrollIntoView({ block: "nearest" });
    topbarTitle.textContent = link.textContent.trim();
  }
  setNav(false);
  window.scrollTo(0, 0);
  return id;
}

function fromHash() {
  show(location.hash.slice(1));
}
window.addEventListener("hashchange", fromHash);
fromHash();

// drawer toggle (mobile)
menubtn.addEventListener("click", function () {
  setNav(!document.body.classList.contains("navopen"));
});
scrim.addEventListener("click", function () {
  setNav(false);
});
// tapping the section you're already on just closes the drawer
links.forEach(function (l) {
  l.addEventListener("click", function () {
    if (l.classList.contains("active")) setNav(false);
  });
});

// J / K or arrow keys to move between sections
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") return setNav(false);
  if (e.metaKey || e.ctrlKey || e.target.tagName === "INPUT") return;
  var i = ids.indexOf(document.querySelector(".section.current").id);
  if (e.key === "j" || (e.key === "ArrowDown" && e.shiftKey)) {
    if (i < ids.length - 1) location.hash = ids[i + 1];
  }
  if (e.key === "k" || (e.key === "ArrowUp" && e.shiftKey)) {
    if (i > 0) location.hash = ids[i - 1];
  }
});
