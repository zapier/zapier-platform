(function() {
  window.addEventListener(
    "scroll",
    _.throttle(() => {
      const headerElem = document.querySelector(".docs-header");
      const tocElem = document.querySelector(".docs-toc");
      const scrollPosition = document.documentElement.scrollTop || document.body.scrollTop;
      if (scrollPosition > headerElem.offsetHeight) {
        tocElem.classList.add("docs-toc--scrolled");
      } else {
        tocElem.classList.remove("docs-toc--scrolled");
      }
    }, 75)
  );
})();
