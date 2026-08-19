(() => {
  'use strict';

  document.documentElement.classList.add('native-app');
  const canvas = document.querySelector('#game');
  window.TieJieViewportReady = new Promise(resolve => {
    const baseWidth = 1280;
    const baseHeight = 720;
    const startedAt = performance.now();
    let previousSize = '';
    let stableFrames = 0;
    let completed = false;
    const complete = (viewportWidth, viewportHeight) => {
      if (completed) return;
      completed = true;
      const aspect = viewportWidth / viewportHeight;
      const baseAspect = baseWidth / baseHeight;
      const width = aspect >= baseAspect ? Math.round(baseHeight * aspect) : baseWidth;
      const height = aspect >= baseAspect ? baseHeight : Math.round(baseWidth / aspect);
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
      window.TieJieViewport = Object.freeze({ width, height });
      resolve(window.TieJieViewport);
    };
    const waitForStableLandscape = () => {
      const viewportWidth = Math.max(1, Math.round(window.innerWidth || document.documentElement.clientWidth || baseWidth));
      const viewportHeight = Math.max(1, Math.round(window.innerHeight || document.documentElement.clientHeight || baseHeight));
      const sizeKey = `${viewportWidth}x${viewportHeight}`;
      const landscape = viewportWidth >= viewportHeight;
      stableFrames = landscape && sizeKey === previousSize ? stableFrames + 1 : landscape ? 1 : 0;
      previousSize = sizeKey;
      const elapsed = performance.now() - startedAt;
      if (stableFrames >= 6 && elapsed >= 250) {
        complete(viewportWidth, viewportHeight);
        return;
      }
      if (elapsed >= 4000) {
        complete(landscape ? viewportWidth : baseWidth, landscape ? viewportHeight : baseHeight);
        return;
      }
      requestAnimationFrame(waitForStableLandscape);
    };
    requestAnimationFrame(waitForStableLandscape);
  });
  document.addEventListener('contextmenu', event => event.preventDefault());
  document.addEventListener('dragstart', event => event.preventDefault());

  const keepAwakeForTouch = event => {
    if (event.touches?.length > 1) event.preventDefault();
  };
  document.addEventListener('touchmove', keepAwakeForTouch, { passive: false });

})();
