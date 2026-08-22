import { prisma } from '../lib/prisma.js';

export interface AuditEntryOptions {
  action:
    | 'COURSE_CREATED'
    | 'COURSE_UPDATED'
    | 'COURSE_DELETED'
    | 'USER_CREATED'
    | 'USER_UPDATED'
    | 'USER_DELETED'
    | 'PASSWORD_RESET'
    | 'ENROLLED'
    | 'ENROLLMENT_STATUS_CHANGED'
    | 'PAYMENT_VERIFIED'
    | 'PAYMENT_REJECTED'
    | 'COMMUNITY_ANNOUNCEMENT'
    | string;
  entityType: 'COURSE' | 'USER' | 'ENROLLMENT' | 'PAYMENT' | 'LEAD' | 'COMMUNITY';
  entityId: string;
  userId?: string | null;
  oldData?: any;
  newData?: any;
  metadata?: Record<string, any>;
}

class AuditService {
  /**
   * Automatically log a high-fidelity audit trail entry to PostgreSQL audit_logs table
   */
  async log(options: AuditEntryOptions): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: options.action,
          entityType: options.entityType,
          entityId: options.entityId,
          userId: options.userId || null,
          oldData: options.oldData ? JSON.stringify(options.oldData) : null,
          newData: options.newData ? JSON.stringify(options.newData) : null,
          metadata: options.metadata ? JSON.stringify(options.metadata) : null,
        },
      });
    } catch (err: any) {
      console.error('[AUDIT LOG ERROR] Failed to record audit log:', err.message);
    }
  }
}

export const auditService = new AuditService();
