(() => {
  'use strict';

  document.documentElement.classList.add('native-app');
  document.addEventListener('contextmenu', event => event.preventDefault());
  document.addEventListener('dragstart', event => event.preventDefault());

  const keepAwakeForTouch = event => {
    if (event.touches?.length > 1) event.preventDefault();
  };
  document.addEventListener('touchmove', keepAwakeForTouch, { passive: false });
})();
