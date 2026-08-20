"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteModule = exports.updateModule = exports.createModule = void 0;
const zod_1 = require("zod");
const prisma_js_1 = require("../lib/prisma.js");
const moduleSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, 'Module title must be at least 2 characters'),
    order: zod_1.z.number().optional().default(0),
    courseId: zod_1.z.string().min(1, 'Course ID is required'),
});
const createModule = async (req, res) => {
    try {
        const validatedData = moduleSchema.parse(req.body);
        const course = await prisma_js_1.prisma.course.findUnique({ where: { id: validatedData.courseId } });
        if (!course) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }
        let order = validatedData.order;
        if (order === 0) {
            const highestModule = await prisma_js_1.prisma.module.findFirst({
                where: { courseId: validatedData.courseId },
                orderBy: { order: 'desc' },
            });
            order = (highestModule?.order ?? -1) + 1;
        }
        const moduleItem = await prisma_js_1.prisma.module.create({
            data: {
                title: validatedData.title,
                order,
                courseId: validatedData.courseId,
            },
            include: {
                lessons: true,
            },
        });
        res.status(201).json({ success: true, message: 'Module created successfully', module: moduleItem });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: error.errors[0].message });
            return;
        }
        res.status(500).json({ success: false, message: error.message || 'Error creating module' });
    }
};
exports.createModule = createModule;
const updateModule = async (req, res) => {
    try {
        const id = req.params.id;
        const { title, order } = req.body;
        const existing = await prisma_js_1.prisma.module.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, message: 'Module not found' });
            return;
        }
        const updated = await prisma_js_1.prisma.module.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(order !== undefined && { order }),
            },
            include: {
                lessons: true,
            },
        });
        res.json({ success: true, message: 'Module updated successfully', module: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error updating module' });
    }
};
exports.updateModule = updateModule;
const deleteModule = async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await prisma_js_1.prisma.module.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, message: 'Module not found' });
            return;
        }
        await prisma_js_1.prisma.module.delete({ where: { id } });
        res.json({ success: true, message: 'Module deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error deleting module' });
    }
};
exports.deleteModule = deleteModule;
