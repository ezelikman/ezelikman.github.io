// Enhance native details while retaining its no-JavaScript and keyboard behavior.
(() => {
  document.querySelectorAll('.collapsible-section').forEach(enhanceDisclosure);

  function enhanceDisclosure(details) {
    if (typeof details.animate !== 'function') return;

    const summary = details.querySelector('summary');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animation = null;
    let expanded = details.open;

    function reflectState() {
      details.dataset.expanded = String(expanded);
      summary.setAttribute('aria-expanded', String(expanded));
    }

    function settle() {
      if (animation) {
        animation.onfinish = null;
        animation.cancel();
        animation = null;
      }
      details.open = expanded;
      details.removeAttribute('data-animating');
      reflectState();
    }

    reflectState();
    summary.addEventListener('click', (event) => {
      event.preventDefault();
      const startHeight = details.getBoundingClientRect().height;
      expanded = !expanded;
      reflectState();

      if (reducedMotion.matches) {
        settle();
        return;
      }

      if (animation) {
        animation.onfinish = null;
        animation.cancel();
      }

      // Measure the natural destination; keep the content rendered during closing.
      details.open = expanded;
      const endHeight = details.getBoundingClientRect().height;
      details.open = true;
      details.dataset.animating = 'true';

      animation = details.animate(
        [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
        { duration: expanded ? 320 : 240, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
      animation.onfinish = settle;
    });

    // Restore intrinsic sizing if layout or motion preferences change mid-transition.
    window.addEventListener('resize', settle);
    reducedMotion.addEventListener('change', settle);
    details.addEventListener('toggle', () => {
      if (!animation) {
        expanded = details.open;
        reflectState();
      }
    });
  }
})();
