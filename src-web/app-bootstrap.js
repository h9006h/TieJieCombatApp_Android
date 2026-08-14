(() => {
  'use strict';

  document.documentElement.classList.add('native-app');
  const canvas = document.querySelector('#game');
  if (canvas) {
    const baseWidth = 1280;
    const baseHeight = 720;
    const viewportWidth = Math.max(1, window.innerWidth || document.documentElement.clientWidth || baseWidth);
    const viewportHeight = Math.max(1, window.innerHeight || document.documentElement.clientHeight || baseHeight);
    const aspect = viewportWidth / viewportHeight;
    const baseAspect = baseWidth / baseHeight;
    const width = aspect >= baseAspect ? Math.round(baseHeight * aspect) : baseWidth;
    const height = aspect >= baseAspect ? baseHeight : Math.round(baseWidth / aspect);
    canvas.width = width;
    canvas.height = height;
    window.TieJieViewport = Object.freeze({ width, height });
  }
  document.addEventListener('contextmenu', event => event.preventDefault());
  document.addEventListener('dragstart', event => event.preventDefault());

  const keepAwakeForTouch = event => {
    if (event.touches?.length > 1) event.preventDefault();
  };
  document.addEventListener('touchmove', keepAwakeForTouch, { passive: false });
})();
