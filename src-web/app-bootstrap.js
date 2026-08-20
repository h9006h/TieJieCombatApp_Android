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
    const readViewport = () => {
      const visualViewport = window.visualViewport;
      const width = visualViewport?.width || window.innerWidth || document.documentElement.clientWidth || baseWidth;
      const height = visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || baseHeight;
      return {
        width: Math.max(1, Math.round(width)),
        height: Math.max(1, Math.round(height))
      };
    };
    const resetStability = () => {
      previousSize = '';
      stableFrames = 0;
    };
    const stopWatchingViewport = () => {
      window.removeEventListener('resize', resetStability);
      window.removeEventListener('orientationchange', resetStability);
      window.visualViewport?.removeEventListener('resize', resetStability);
    };
    const complete = (viewportWidth, viewportHeight) => {
      if (completed) return;
      completed = true;
      stopWatchingViewport();
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
      const viewport = readViewport();
      const viewportWidth = viewport.width;
      const viewportHeight = viewport.height;
      const sizeKey = `${viewportWidth}x${viewportHeight}`;
      const landscape = viewportWidth >= viewportHeight;
      stableFrames = landscape && sizeKey === previousSize ? stableFrames + 1 : landscape ? 1 : 0;
      previousSize = sizeKey;
      const elapsed = performance.now() - startedAt;
      if (stableFrames >= 12 && elapsed >= 500) {
        complete(viewportWidth, viewportHeight);
        return;
      }
      if (elapsed >= 4000) {
        complete(landscape ? viewportWidth : baseWidth, landscape ? viewportHeight : baseHeight);
        return;
      }
      requestAnimationFrame(waitForStableLandscape);
    };
    window.addEventListener('resize', resetStability);
    window.addEventListener('orientationchange', resetStability);
    window.visualViewport?.addEventListener('resize', resetStability);
    requestAnimationFrame(waitForStableLandscape);
  });
  document.addEventListener('contextmenu', event => event.preventDefault());
  document.addEventListener('dragstart', event => event.preventDefault());

  const keepAwakeForTouch = event => {
    if (event.touches?.length > 1) event.preventDefault();
  };
  document.addEventListener('touchmove', keepAwakeForTouch, { passive: false });

})();
