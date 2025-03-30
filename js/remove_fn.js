const logger = window.__nice_logger;

function processDebuggerString(str) {
  // 1. 作为对象的键
  str = str.replace(/([{,]\s*)"debugger"(\s*:)/g, '$1"_debugger_"$2');
  str = str.replace(/([{,]\s*)'debugger'(\s*:)/g, "$1'_debugger_'$2");
  str = str.replace(/([{,]\s*)debugger(\s*:)/g, "$1_debugger_$2");

  // 2. 作为变量名
  str = str.replace(/\bvar\s+debugger\b/g, "var _debugger_");
  str = str.replace(/\blet\s+debugger\b/g, "let _debugger_");
  str = str.replace(/\bconst\s+debugger\b/g, "const _debugger_");

  // 3. 作为函数参数名
  str = str.replace(
    /\b(function\s*\([^)]*)\bdebugger\b([^)]*\))/g,
    "$1_debugger_$2"
  );
  str = str.replace(/\b(=>\s*\([^)]*)\bdebugger\b([^)]*\))/g, "$1_debugger_$2");

  // 4. 作为属性访问
  str = str.replace(/\.(debugger)\b/g, "._debugger_");
  str = str.replace(/\['debugger'\]/g, "['_debugger_']");
  str = str.replace(/\["debugger"\]/g, '["_debugger_"]');

  // 5. 作为字符串内容
  str = str.replace(/'debugger'/g, "'_debugger_'");
  str = str.replace(/"debugger"/g, '"_debugger_"');

  // 6. 最后处理独立的 debugger 语句
  str = str.replace(/\bdebugger\b/g, "");

  return str;
}

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
        args[i] = processDebuggerString(args[i]);
      }
    }

    return originalFunction.apply(this, args);
  };

  const newFunctionConstructor = function (...args) {
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "debugger") {
        args[i] = processDebuggerString(args[i]);
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
      code = processDebuggerString(code);
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

  handlerStr = processDebuggerString(handlerStr);

  return originalSetInterval.call(this, handler, timeout);
};
