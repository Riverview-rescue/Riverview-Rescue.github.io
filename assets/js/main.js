// RiverView Rescue — small progressive enhancements. The site works without this file.
(function () {
  document.documentElement.classList.add("js");

  // Mobile menu
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Fade sections in as they scroll into view
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  // "Copy" buttons next to payment handles
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var label = btn.textContent;
      var done = function () {
        btn.textContent = "Copied!";
        setTimeout(function () { btn.textContent = label; }, 1600);
      };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(btn.getAttribute("data-copy")).then(done, function () {});
      }
    });
  });

  // Share buttons: the phone's own share sheet where available, otherwise copy the link
  var shareUrl = location.origin + location.pathname.replace(/[^/]*$/, "");
  var shareText = "Riverview Rescue is Nebraska's only cow sanctuary: one woman caring for 32 rescued cows. Take a look:";
  document.querySelectorAll("[data-share-fb]").forEach(function (a) {
    a.href = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(shareUrl);
  });
  document.querySelectorAll("[data-share]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var label = btn.textContent;
      if (navigator.share) {
        navigator.share({ title: "Riverview Rescue", text: shareText, url: shareUrl }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText + " " + shareUrl).then(function () {
          btn.textContent = "Link copied!";
          setTimeout(function () { btn.textContent = label; }, 1800);
        }, function () {});
      }
    });
  });

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
