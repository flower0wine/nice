(function () {
  const logger = window.__nice_logger;
  const keyboardDisabled = window.__NICE_EXTENSION_SETTINGS__?.keyboardDisabled;
  const pasteDisabled = window.__NICE_EXTENSION_SETTINGS__?.pasteDisabled;
  const contextMenuDisabled =
    window.__NICE_EXTENSION_SETTINGS__?.contextMenuDisabled;

  if (!keyboardDisabled && !pasteDisabled && !contextMenuDisabled) {
    logger.info("keyboardDisabled is false, return");
    return;
  }

  // 保存原始的事件处理函数
  const originalAddEventListener = EventTarget.prototype.addEventListener;

  window.__originalKeyboardFunctions = window.__originalKeyboardFunctions || {
    addEventListener: originalAddEventListener,
    keydownHandlers: new Map(),
    keyupHandlers: new Map(),
    keypressHandlers: new Map(),
    contextmenuHandlers: new Map(),
    pasteHandlers: new Map()
  };

  function getMap(type) {
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
      case "paste":
        map = window.__originalKeyboardFunctions.pasteHandlers;
        break;
    }
    return map;
  }

  function addHandler(element, type, listener, options) {
    const map = getMap(type);

    if (!map) {
      return;
    }

    if (!map.has(element)) {
      map.set(element, []);
    }

    map.get(element).push({ type, listener, options });
  }

  EventTarget.prototype.addEventListener = function (type, listener, options) {
    addHandler(this, type, listener, options);

    if (
      (keyboardDisabled && type === "keydown") ||
      (pasteDisabled && type === "paste") ||
      (contextMenuDisabled && type === "contextmenu")
    ) {
      return;
    }

    originalAddEventListener.call(this, type, listener, options);
  };

  function remove(type) {
    const map = getMap(type);

    map.forEach((handlers, element) => {
      handlers.forEach(({ type, listener, options }) => {
        EventTarget.prototype.removeEventListener.call(
          element,
          type,
          listener,
          options
        );
      });
    });
  }

  if (keyboardDisabled) {
    remove("keydown");
    remove("keyup");
    remove("keypress");
    logger.success("已移除 keydown, keyup, keypress 事件监听器");
  }

  if (contextMenuDisabled) {
    remove("contextmenu");
    logger.success("已移除 contextmenu 事件监听器");
  }

  if (pasteDisabled) {
    remove("paste");
    logger.success("已移除 paste 事件监听器");
  }
})();
