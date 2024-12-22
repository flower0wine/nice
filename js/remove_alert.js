(function () {
  // 保存原始函数的引用
  const originalFunctions = {
    alert: window.alert,
    confirm: window.confirm,
    prompt: window.prompt
  };

  // 覆盖原始函数
  window.alert = function () {
    return undefined;
  };
  window.confirm = function () {
    return true;
  };
  window.prompt = function () {
    return null;
  };

  // 保存到 window 上以便后续恢复
  window.__alertFunction = originalFunctions.alert;
  window.__confirmFunction = originalFunctions.confirm;
  window.__promptFunction = originalFunctions.prompt;
})();
