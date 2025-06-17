import UpdateManager from "./managers/update-manager.js";
import TestExecutionManager from "./managers/test-execution-manager.js";
import ThemeManager from "./managers/theme-manager.js";
import TestSetupManager from "./managers/test-setup-manager.js";
import TooltipManager from "./managers/tooltip-manager.js";
import WindowManager from "./managers/window-manager.js";

document.addEventListener('DOMContentLoaded', () => {
    WindowManager.init();
    TooltipManager.init();
    UpdateManager.init();
    TestExecutionManager.init();
    TestSetupManager.init();
    ThemeManager.init();

    console.log("All managers were initialized successfully.");
});