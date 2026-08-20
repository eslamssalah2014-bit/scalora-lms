"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
async function createSheriefSherief() {
    const email = 'sherief.sherief@example.com';
    const name = 'Sherief Sherief';
    const password = await bcryptjs_1.default.hash('Student123!', 10);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log('Sherief Sherief already exists in Supabase:', existing);
        return;
    }
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password,
            role: 'STUDENT',
        },
    });
    console.log('✅ Successfully created Sherief Sherief in Supabase PostgreSQL:');
    console.log(JSON.stringify(user, null, 2));
    await prisma.$disconnect();
}
createSheriefSherief();
