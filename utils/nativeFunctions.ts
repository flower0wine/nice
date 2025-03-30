// 生成注入代码
export function injectNativeFunctions() {
  return `
    (function() {
      if (!window.__nice__) {
        // 直接在注入的代码中获取原生函数
        const nativeFunctions = {
          console: {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
          },
          alert: window.alert,
          confirm: window.confirm,
          prompt: window.prompt,
          setTimeout: window.setTimeout,
          setInterval: window.setInterval,
          addEventListener: EventTarget.prototype.addEventListener,
          removeEventListener: EventTarget.prototype.removeEventListener
        };
        
        Object.defineProperty(window, '__nice__', {
          value: nativeFunctions,
          writable: false,
          configurable: false
        });

        // 在 DOMContentLoaded 后恢复 console 方法
        document.addEventListener('DOMContentLoaded', () => {
          window.console.log = window.__nice__.console.log;
          window.console.error = window.__nice__.console.error;
          window.console.warn = window.__nice__.console.warn;
          window.console.info = window.__nice__.console.info;
          window.__nice__.console.log('Console functions restored to native functions');
        });

        window.__nice__.console.log('Native functions preserved successfully');
      }
    })();
  `;
}
