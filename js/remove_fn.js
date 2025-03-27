const logger = window.__nice_logger;

// 拦截动态执行的代码
function setupDynamicCodeInterception() {
  // 保存原始函数
  const originalFunction = window.Function;
  const originalFunctionConstructor = window.Function.prototype.constructor;
  const originalEval = window.eval;

  // 重写 Function 构造函数
  const newFunction = function (...args) {
    for (let i = 0; i < args.length; i++) {
      if (typeof args[i] === "string") {
        args[i] = args[i].replace(/debugger/g, "");
      }
    }

    return originalFunction.apply(this, args);
  };

  const newFunctionConstructor = function (...args) {
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "debugger") {
        args[i] = "";
      }
    }

    return originalFunctionConstructor.apply(this, args);
  };

  // 复制原始 Function 的属性
  Object.defineProperties(newFunction, {
    length: { value: originalFunction.length },
    prototype: { value: originalFunction.prototype }
  });

  Object.defineProperties(newFunctionConstructor, {
    length: { value: originalFunctionConstructor.length },
    prototype: { value: originalFunctionConstructor.prototype }
  });

  // 重写 eval
  const newEval = function (code) {
    if (typeof code === "string") {
      code = code.replace(/debugger/g, "");
    }

    return originalEval.call(window, code);
  };

  try {
    // 保存原始函数以便后续恢复
    window.__originalFunction = originalFunction;
    window.__originalFunctionConstructor = originalFunctionConstructor;
    window.__originalEval = originalEval;

    window.Function = newFunction;
    window.Function.prototype.constructor = newFunctionConstructor;
    window.eval = newEval;

    // 注入到 iframe 中
    document.querySelectorAll("iframe").forEach((iframe) => {
      try {
        const iframeWindow = iframe.contentWindow;
        if (iframeWindow) {
          Object.defineProperty(iframeWindow, "Function", {
            value: newFunction,
            writable: true,
            configurable: true
          });

          Object.defineProperty(iframeWindow, "Function", {
            value: newFunctionConstructor,
            writable: true,
            configurable: true
          });

          Object.defineProperty(iframeWindow, "eval", {
            value: newEval,
            writable: true,
            configurable: true
          });
        }
      } catch (e) {
        logger.error("无法注入到 iframe:", e);
      }
    });
  } catch (error) {
    logger.error("设置代码拦截失败:", error);
  }
}

// 监听新的 iframe
const observeIframes = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeName === "IFRAME") {
          try {
            const iframe = node;
            const iframeWindow = iframe.contentWindow;
            if (iframeWindow) {
              Object.defineProperty(iframeWindow, "Function", {
                value: window.Function,
                writable: true,
                configurable: true
              });

              Object.defineProperty(iframeWindow, "Function", {
                value: newFunctionConstructor,
                writable: true,
                configurable: true
              });

              Object.defineProperty(iframeWindow, "eval", {
                value: window.eval,
                writable: true,
                configurable: true
              });
            }
          } catch (e) {
            logger.error("无法注入到新的 iframe:", e);
          }
        }
      });
    });
  });

  observer.observe(document, {
    childList: true,
    subtree: true
  });
};

const originalSetInterval = window.setInterval;

// 存储需要恢复的函数
const storedIntervals = new Map();

setupDynamicCodeInterception();

// 重写 setInterval
window.setInterval = function (handler, timeout) {
  let handlerStr = handler.toString();

  handlerStr = handlerStr.replace(/debugger/g, "");

  return originalSetInterval.call(this, handler, timeout);
};
