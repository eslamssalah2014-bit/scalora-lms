"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssignees = exports.deleteLead = exports.addLeadNote = exports.updateLead = exports.getLeadById = exports.getLeads = exports.createLead = void 0;
const zod_1 = require("zod");
const prisma_js_1 = require("../lib/prisma.js");
const leadCreateSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    phone: zod_1.z.string().optional().or(zod_1.z.literal('')),
    companyName: zod_1.z.string().optional().or(zod_1.z.literal('')),
    industry: zod_1.z.string().optional().or(zod_1.z.literal('')),
    teamSize: zod_1.z.string().optional().or(zod_1.z.literal('')),
    goalsAndBottlenecks: zod_1.z.string().optional().or(zod_1.z.literal('')),
});
const generateLeadCode = async () => {
    const count = await prisma_js_1.prisma.lead.count();
    const num = 1001 + count;
    return `SCL-${num}`;
};
const createLead = async (req, res) => {
    try {
        const validatedData = leadCreateSchema.parse(req.body);
        const leadCode = await generateLeadCode();
        const initialActivity = [
            {
                id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                type: 'LEAD_CREATED',
                description: 'Consultation request submitted from website',
                actorName: validatedData.fullName,
                createdAt: new Date().toISOString(),
            },
        ];
        const lead = await prisma_js_1.prisma.lead.create({
            data: {
                leadCode,
                fullName: validatedData.fullName.trim(),
                email: validatedData.email.trim().toLowerCase(),
                phone: validatedData.phone ? validatedData.phone.trim() : null,
                companyName: validatedData.companyName ? validatedData.companyName.trim() : null,
                industry: validatedData.industry ? validatedData.industry.trim() : null,
                teamSize: validatedData.teamSize ? validatedData.teamSize.trim() : null,
                goalsAndBottlenecks: validatedData.goalsAndBottlenecks ? validatedData.goalsAndBottlenecks.trim() : null,
                status: 'NEW',
                assignedTo: 'Unassigned',
                notes: JSON.stringify([]),
                activityLog: JSON.stringify(initialActivity),
            },
        });
        res.status(201).json({
            success: true,
            message: 'Consultation request received successfully! Our advisory team will contact you shortly.',
            lead: {
                ...lead,
                notes: [],
                activityLog: initialActivity,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: error.errors[0].message });
            return;
        }
        res.status(500).json({ success: false, message: error.message || 'Error submitting consultation request' });
    }
};
exports.createLead = createLead;
const getLeads = async (req, res) => {
    try {
        const { search, status, industry, assignedTo, sort, page = '1', limit = '50' } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (status && status !== 'ALL') {
            where.status = status;
        }
        if (industry && industry !== 'ALL') {
            where.industry = { equals: industry };
        }
        if (assignedTo && assignedTo !== 'ALL') {
            where.assignedTo = { equals: assignedTo };
        }
        if (search && typeof search === 'string' && search.trim()) {
            const q = search.trim();
            where.OR = [
                { fullName: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } },
                { companyName: { contains: q, mode: 'insensitive' } },
                { leadCode: { contains: q, mode: 'insensitive' } },
            ];
        }
        let orderBy = { createdAt: 'desc' };
        if (sort === 'oldest') {
            orderBy = { createdAt: 'asc' };
        }
        else if (sort === 'name-asc') {
            orderBy = { fullName: 'asc' };
        }
        else if (sort === 'name-desc') {
            orderBy = { fullName: 'desc' };
        }
        else if (sort === 'updated') {
            orderBy = { updatedAt: 'desc' };
        }
        const [leadsRaw, totalCount, allLeadsSummary] = await Promise.all([
            prisma_js_1.prisma.lead.findMany({
                where,
                orderBy,
                skip,
                take: limitNum,
            }),
            prisma_js_1.prisma.lead.count({ where }),
            prisma_js_1.prisma.lead.findMany({
                select: { status: true },
            }),
        ]);
        // Calculate Summary Stats
        const totalLeads = allLeadsSummary.length;
        let newLeads = 0;
        let meetingsScheduled = 0;
        let wonDeals = 0;
        let lostDeals = 0;
        for (const l of allLeadsSummary) {
            if (l.status === 'NEW')
                newLeads++;
            else if (l.status === 'MEETING_SCHEDULED')
                meetingsScheduled++;
            else if (l.status === 'WON')
                wonDeals++;
            else if (l.status === 'LOST')
                lostDeals++;
        }
        const closedDeals = wonDeals + lostDeals;
        const conversionRate = closedDeals > 0
            ? Math.round((wonDeals / closedDeals) * 100)
            : totalLeads > 0
                ? Math.round((wonDeals / totalLeads) * 100)
                : 0;
        const leads = leadsRaw.map((l) => ({
            ...l,
            notes: l.notes ? JSON.parse(l.notes) : [],
            activityLog: l.activityLog ? JSON.parse(l.activityLog) : [],
        }));
        res.json({
            success: true,
            leads,
            total: totalCount,
            page: pageNum,
            totalPages: Math.ceil(totalCount / limitNum),
            stats: {
                totalLeads,
                newLeads,
                meetingsScheduled,
                wonDeals,
                lostDeals,
                conversionRate,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching leads' });
    }
};
exports.getLeads = getLeads;
const getLeadById = async (req, res) => {
    try {
        const id = req.params.id;
        const lead = await prisma_js_1.prisma.lead.findFirst({
            where: {
                OR: [{ id }, { leadCode: id }],
            },
        });
        if (!lead) {
            res.status(404).json({ success: false, message: 'Lead not found' });
            return;
        }
        res.json({
            success: true,
            lead: {
                ...lead,
                notes: lead.notes ? JSON.parse(lead.notes) : [],
                activityLog: lead.activityLog ? JSON.parse(lead.activityLog) : [],
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching lead details' });
    }
};
exports.getLeadById = getLeadById;
const updateLead = async (req, res) => {
    try {
        const id = req.params.id;
        const { status, assignedTo, companyName, phone, industry, teamSize, goalsAndBottlenecks } = req.body;
        const existing = await prisma_js_1.prisma.lead.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, message: 'Lead not found' });
            return;
        }
        let existingActivity = [];
        try {
            existingActivity = existing.activityLog ? JSON.parse(existing.activityLog) : [];
        }
        catch {
            existingActivity = [];
        }
        const actorName = req.user?.name || 'Administrator';
        // Check status change
        if (status && status !== existing.status) {
            existingActivity.unshift({
                id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                type: 'STATUS_CHANGED',
                description: `Status changed from ${existing.status} to ${status}`,
                actorName,
                createdAt: new Date().toISOString(),
            });
        }
        // Check assignment change
        if (assignedTo !== undefined && assignedTo !== existing.assignedTo) {
            existingActivity.unshift({
                id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                type: 'ASSIGNMENT_CHANGED',
                description: `Lead assigned to ${assignedTo || 'Unassigned'}`,
                actorName,
                createdAt: new Date().toISOString(),
            });
        }
        const updated = await prisma_js_1.prisma.lead.update({
            where: { id },
            data: {
                ...(status ? { status } : {}),
                ...(assignedTo !== undefined ? { assignedTo } : {}),
                ...(companyName !== undefined ? { companyName } : {}),
                ...(phone !== undefined ? { phone } : {}),
                ...(industry !== undefined ? { industry } : {}),
                ...(teamSize !== undefined ? { teamSize } : {}),
                ...(goalsAndBottlenecks !== undefined ? { goalsAndBottlenecks } : {}),
                activityLog: JSON.stringify(existingActivity),
            },
        });
        res.json({
            success: true,
            message: 'Lead updated successfully',
            lead: {
                ...updated,
                notes: updated.notes ? JSON.parse(updated.notes) : [],
                activityLog: existingActivity,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error updating lead' });
    }
};
exports.updateLead = updateLead;
const addLeadNote = async (req, res) => {
    try {
        const id = req.params.id;
        const { text } = req.body;
        if (!text || typeof text !== 'string' || !text.trim()) {
            res.status(400).json({ success: false, message: 'Note text cannot be empty' });
            return;
        }
        const lead = await prisma_js_1.prisma.lead.findUnique({ where: { id } });
        if (!lead) {
            res.status(404).json({ success: false, message: 'Lead not found' });
            return;
        }
        let existingNotes = [];
        try {
            existingNotes = lead.notes ? JSON.parse(lead.notes) : [];
        }
        catch {
            existingNotes = [];
        }
        let existingActivity = [];
        try {
            existingActivity = lead.activityLog ? JSON.parse(lead.activityLog) : [];
        }
        catch {
            existingActivity = [];
        }
        const authorName = req.user?.name || 'Administrator';
        const newNote = {
            id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            text: text.trim(),
            authorName,
            authorId: req.user?.id || 'admin',
            createdAt: new Date().toISOString(),
        };
        existingNotes.unshift(newNote);
        existingActivity.unshift({
            id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            type: 'NOTE_ADDED',
            description: `Internal note added: "${text.trim().slice(0, 60)}${text.trim().length > 60 ? '...' : ''}"`,
            actorName: authorName,
            createdAt: new Date().toISOString(),
        });
        const updated = await prisma_js_1.prisma.lead.update({
            where: { id },
            data: {
                notes: JSON.stringify(existingNotes),
                activityLog: JSON.stringify(existingActivity),
            },
        });
        res.status(201).json({
            success: true,
            message: 'Note added successfully',
            note: newNote,
            lead: {
                ...updated,
                notes: existingNotes,
                activityLog: existingActivity,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error adding note' });
    }
};
exports.addLeadNote = addLeadNote;
const deleteLead = async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await prisma_js_1.prisma.lead.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, message: 'Lead not found' });
            return;
        }
        await prisma_js_1.prisma.lead.delete({ where: { id } });
        res.json({ success: true, message: `Lead ${existing.leadCode} deleted successfully` });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error deleting lead' });
    }
};
exports.deleteLead = deleteLead;
const getAssignees = async (_req, res) => {
    try {
        const admins = await prisma_js_1.prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true, name: true, email: true },
        });
        const defaultRoles = [
            'Unassigned',
            'Eslam Salah (Admin)',
            'Sales Manager',
            'Senior Operations Consultant',
            'Systems Architect',
            'Advisory Lead',
        ];
        const allAssignees = Array.from(new Set([...admins.map((a) => a.name), ...defaultRoles]));
        res.json({ success: true, assignees: allAssignees });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching assignees' });
    }
};
exports.getAssignees = getAssignees;
