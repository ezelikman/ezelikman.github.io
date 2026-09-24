// Enhance the native disclosures with a shared, exclusive section switcher.
(() => {
  const explorer = document.querySelector('.section-explorer');
  if (!explorer) return;
  const sections = [...explorer.querySelectorAll(':scope > details')];
  const controls = document.createElement('div');
  controls.className = 'section-switcher';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Background sections');
  const panels = document.createElement('div');
  panels.className = 'section-panels';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = null;
  let animation = null;

  let transition = 0;

  function showActive() {
    sections.forEach((item) => { item.open = item === active; });
  }

  function cancelAnimation() {
    if (animation) {
      animation.cancel();
      animation = null;
    }
  }

  function settle() {
    transition += 1;
    cancelAnimation();
    showActive();
    panels.style.removeProperty('height');
    panels.style.removeProperty('opacity');
    panels.removeAttribute('data-animating');
  }

  const buttons = sections.map((section, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = `section-toggle-${index}`;
    button.textContent = section.querySelector('summary').textContent.trim();
    section.id = `section-panel-${index}`;
    section.setAttribute('aria-labelledby', button.id);
    button.setAttribute('aria-controls', section.id);
    button.setAttribute('aria-expanded', 'false');
    section.open = false;
    section.removeAttribute('name');
    button.addEventListener('click', () => select(section));
    controls.append(button);
    panels.append(section);
    return button;
  });

  async function select(section) {
    const startHeight = panels.getBoundingClientRect().height;
    const startOpacity = getComputedStyle(panels).opacity;
    const token = ++transition;
    cancelAnimation();
    active = active === section ? null : section;
    buttons.forEach((button, index) => {
      button.setAttribute('aria-expanded', String(sections[index] === active));
    });

    if (reducedMotion.matches || typeof panels.animate !== 'function') {
      settle();
      return;
    }

    panels.style.height = `${startHeight}px`;
    panels.style.opacity = startOpacity;
    panels.dataset.animating = 'true';
    try {
      // Fade the outgoing content before replacing it, without moving the page.
      if (startHeight > 0 && Number(startOpacity) > 0) {
        animation = panels.animate(
          [{ opacity: startOpacity }, { opacity: 0 }],
          { duration: 90, easing: 'ease-out', fill: 'forwards' }
        );
        await animation.finished;
        if (token !== transition) return;
      }
      panels.style.opacity = '0';
      cancelAnimation();
      showActive();
      panels.style.removeProperty('height');
      const endHeight = panels.getBoundingClientRect().height;
      panels.style.height = `${startHeight}px`;
      animation = panels.animate(
        [{ height: `${startHeight}px`, opacity: 0 },
         { height: `${endHeight}px`, opacity: active ? 1 : 0 }],
        { duration: active ? 260 : 190, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
      );
      await animation.finished;
      if (token === transition) settle();
    } catch (error) {
      // A newer click or resize cancels this transition and owns the final state.
      if (token === transition) settle();
    }
  }

  explorer.append(controls, panels);
  explorer.classList.add('section-switcher-enabled');
  window.addEventListener('resize', settle);
  reducedMotion.addEventListener('change', settle);
})();
