import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const leadCreateSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().or(z.literal('')),
  companyName: z.string().optional().or(z.literal('')),
  industry: z.string().optional().or(z.literal('')),
  teamSize: z.string().optional().or(z.literal('')),
  goalsAndBottlenecks: z.string().optional().or(z.literal('')),
});

const generateLeadCode = async (): Promise<string> => {
  const count = await prisma.lead.count();
  const num = 1001 + count;
  return `SCL-${num}`;
};

export const createLead = async (req: Request, res: Response): Promise<void> => {
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

    const lead = await prisma.lead.create({
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
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Error submitting consultation request' });
  }
};

export const getLeads = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, status, industry, assignedTo, sort, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (industry && industry !== 'ALL') {
      where.industry = { equals: industry as string };
    }

    if (assignedTo && assignedTo !== 'ALL') {
      where.assignedTo = { equals: assignedTo as string };
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

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sort === 'name-asc') {
      orderBy = { fullName: 'asc' };
    } else if (sort === 'name-desc') {
      orderBy = { fullName: 'desc' };
    } else if (sort === 'updated') {
      orderBy = { updatedAt: 'desc' };
    }

    const [leadsRaw, totalCount, allLeadsSummary] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.lead.count({ where }),
      prisma.lead.findMany({
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
      if (l.status === 'NEW') newLeads++;
      else if (l.status === 'MEETING_SCHEDULED') meetingsScheduled++;
      else if (l.status === 'WON') wonDeals++;
      else if (l.status === 'LOST') lostDeals++;
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching leads' });
  }
};

export const getLeadById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const lead = await prisma.lead.findFirst({
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching lead details' });
  }
};

export const updateLead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status, assignedTo, companyName, phone, industry, teamSize, goalsAndBottlenecks } = req.body;

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }

    let existingActivity: any[] = [];
    try {
      existingActivity = existing.activityLog ? JSON.parse(existing.activityLog) : [];
    } catch {
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

    const updated = await prisma.lead.update({
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating lead' });
  }
};

export const addLeadNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { text } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ success: false, message: 'Note text cannot be empty' });
      return;
    }

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }

    let existingNotes: any[] = [];
    try {
      existingNotes = lead.notes ? JSON.parse(lead.notes) : [];
    } catch {
      existingNotes = [];
    }

    let existingActivity: any[] = [];
    try {
      existingActivity = lead.activityLog ? JSON.parse(lead.activityLog) : [];
    } catch {
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

    const updated = await prisma.lead.update({
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error adding note' });
  }
};

export const deleteLead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }

    await prisma.lead.delete({ where: { id } });

    res.json({ success: true, message: `Lead ${existing.leadCode} deleted successfully` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting lead' });
  }
};

export const getAssignees = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const admins = await prisma.user.findMany({
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

    const allAssignees = Array.from(
      new Set([...admins.map((a) => a.name), ...defaultRoles])
    );

    res.json({ success: true, assignees: allAssignees });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching assignees' });
  }
};
