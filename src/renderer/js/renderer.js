import UpdateManager from "./managers/update-manager.js";
import TestRunManager from "./managers/test-run-manager.js";
import ThemeManager from "./managers/theme-manager.js";
import TestUIManager from "./managers/test-ui-manager.js";
import TooltipManager from "./managers/tooltip-manager.js";
import WindowManager from "./managers/window-manager.js";

document.addEventListener('DOMContentLoaded', () => {
    WindowManager.init();
    TooltipManager.init();
    UpdateManager.init();
    TestRunManager.init();
    TestUIManager.init();
    ThemeManager.init();

    console.log("All managers were initialized successfully.");
});