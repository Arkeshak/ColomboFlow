"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
// Setup a minimal express app for testing the health route
const app = (0, express_1.default)();
app.get('/health', (req, res) => res.json({ status: 'ok' }));
describe('API Endpoints', () => {
    it('should return 200 OK from /health', async () => {
        const res = await (0, supertest_1.default)(app).get('/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'ok');
    });
});
