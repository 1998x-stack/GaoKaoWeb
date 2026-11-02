(() => {
  const key = 'gaokao:theme:v1';
  const root = document.documentElement;
  try {
    const selected = localStorage.getItem(key);
    if (selected === 'dark' || selected === 'light') root.dataset.theme = selected;
  } catch {}
  const themeBtn = document.querySelector('[data-theme-toggle]');
  if (themeBtn) themeBtn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem(key, next); } catch {}
  });
  const menu = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('#site-nav');
  if (menu && nav) {
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    });
  }
  const homeFilters = [...document.querySelectorAll('[data-home-filter]')];
  if (homeFilters.length) {
    const tiles = [...document.querySelectorAll('[data-subject-group]')];
    homeFilters.forEach(button => button.addEventListener('click', () => {
      const value = button.dataset.homeFilter;
      homeFilters.forEach(filter => {
        const active = filter === button;
        filter.classList.toggle('active', active);
        filter.setAttribute('aria-pressed', String(active));
      });
      tiles.forEach(tile => {
        tile.hidden = value !== 'all' && tile.dataset.subjectGroup !== value;
      });
    }));
  }
  document.addEventListener('keydown', event => {
    if (event.key !== '/' || event.altKey || event.metaKey || event.ctrlKey) return;
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('input,textarea,select,[contenteditable]')) return;
    const field = document.querySelector('#global-query,#home-query,#subject-search');
    if (field) { event.preventDefault(); field.focus(); }
  });
})();
