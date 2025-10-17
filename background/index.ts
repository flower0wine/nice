import { setupDnrRules } from "./dnr";
import { registerMessageHandlers } from "./messages";
import { setupWebNavigation } from "./navigation";
import { initCache, registerStorageListener } from "./storage";

// Entry: register everything synchronously at load time
setupDnrRules();
registerMessageHandlers();
registerStorageListener();
// Warm up cache before navigation injects settings
initCache();
setupWebNavigation();

