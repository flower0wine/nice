function Logger(config) {
  config = config || {};
  this.prefix = config.prefix || "[Nice Extension]";
  this.showTimestamp = config.showTimestamp || false;
}

Logger.prototype.getTimeStamp = function () {
  return this.showTimestamp ? "[" + new Date().toISOString() + "]" : "";
};

Logger.prototype.formatMessage = function (message) {
  return this.prefix + " " + this.getTimeStamp() + " " + message;
};

Logger.prototype.info = function (message) {
  var args = Array.prototype.slice.call(arguments, 1);
  console.log.apply(console, [this.formatMessage(message)].concat(args));
};

Logger.prototype.success = function (message) {
  var args = Array.prototype.slice.call(arguments, 1);

  console.log.apply(
    console,
    ["%c" + this.formatMessage(message), "color: #4caf50"].concat(args)
  );
};

Logger.prototype.warn = function (message) {
  var args = Array.prototype.slice.call(arguments, 1);
  console.warn.apply(console, [this.formatMessage(message)].concat(args));
};

Logger.prototype.error = function (message, error) {
  var args = Array.prototype.slice.call(arguments, 2);
  console.error.apply(
    console,
    [this.formatMessage(message), error].concat(args)
  );
};

Logger.prototype.debug = function (message) {
  if (process.env.NODE_ENV === "development") {
    var args = Array.prototype.slice.call(arguments, 1);
    console.debug.apply(console, [this.formatMessage(message)].concat(args));
  }
};

window.__nice_logger = new Logger();

console.info("已注入 __nice_logger");
