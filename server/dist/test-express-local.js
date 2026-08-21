"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = __importDefault(require("./app.js"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_1 = __importDefault(require("http"));
async function testExpressRouting() {
    const server = http_1.default.createServer(app_js_1.default);
    await new Promise((resolve) => server.listen(5099, resolve));
    const token = jsonwebtoken_1.default.sign({ id: 'cmt1qtiw60000slivnsk358be', email: 'admin@scalora.com', role: 'ADMIN' }, 'scalora_super_secret_jwt_key_2026_modern_lms');
    console.log('Testing GET http://localhost:5099/api/admin/students/cmt2orrqh00138ll7z0wadwkt...');
    const res = await fetch('http://localhost:5099/api/admin/students/cmt2orrqh00138ll7z0wadwkt', {
        headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Local Status Code:', res.status);
    console.log('Local Response Body:', await res.json());
    server.close();
}
testExpressRouting();
