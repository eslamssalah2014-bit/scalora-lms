"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = __importDefault(require("./app.js"));
const safety_middleware_js_1 = require("./middleware/safety.middleware.js");
// Verify and enforce production database safety architecture
(0, safety_middleware_js_1.validateProductionSafety)();
const PORT = process.env.PORT || 5000;
app_js_1.default.listen(PORT, () => {
    console.log(`🚀 Scalora LMS Backend API running on http://localhost:${PORT}`);
    console.log(`✨ Health Check: http://localhost:${PORT}/api/health`);
});
