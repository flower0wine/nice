(function () {
  // 覆盖原始函数
  window.alert = window.__alertFunction;
  window.confirm = window.__confirmFunction;
  window.prompt = window.__promptFunction;
})();
