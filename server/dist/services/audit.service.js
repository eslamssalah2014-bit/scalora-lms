"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = void 0;
const prisma_js_1 = require("../lib/prisma.js");
class AuditService {
    /**
     * Automatically log a high-fidelity audit trail entry to PostgreSQL audit_logs table
     */
    async log(options) {
        try {
            await prisma_js_1.prisma.auditLog.create({
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
        }
        catch (err) {
            console.error('[AUDIT LOG ERROR] Failed to record audit log:', err.message);
        }
    }
}
exports.auditService = new AuditService();
