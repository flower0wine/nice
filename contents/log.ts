import log from "url:/js/log.js";

const injectScript = (file: string) => {
  const script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", file);

  (document.head || document.documentElement).insertBefore(script, null);
};

injectScript(log);
