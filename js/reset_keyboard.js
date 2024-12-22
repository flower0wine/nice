(function () {
  const logger = window.__nice_logger;

  if (window.__originalKeyboardFunctions) {
    // 恢复原始的事件监听器
    EventTarget.prototype.addEventListener =
      window.__originalKeyboardFunctions.addEventListener;

    function reset(type) {
      let map;
      switch (type) {
        case "keydown":
          map = window.__originalKeyboardFunctions.keydownHandlers;
          break;
        case "keyup":
          map = window.__originalKeyboardFunctions.keyupHandlers;
          break;
        case "keypress":
          map = window.__originalKeyboardFunctions.keypressHandlers;
          break;
        case "contextmenu":
          map = window.__originalKeyboardFunctions.contextmenuHandlers;
          break;
      }

      map.forEach((handlers, element) => {
        handlers.forEach(({ type, listener, options }) => {
          EventTarget.prototype.addEventListener.call(
            element,
            type,
            listener,
            options
          );
        });
      });
    }

    reset("keydown");
    reset("keyup");
    reset("keypress");
    reset("contextmenu");

    logger.success("已恢复 keydown, keyup, keypress, contextmenu 事件监听器");
  }
})();
