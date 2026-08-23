"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.realtimeService = void 0;
class RealtimeService {
    clients = new Map();
    /**
     * Register a new SSE client connection
     */
    addClient(userId, res) {
        const client = {
            userId,
            res,
            connectedAt: new Date(),
        };
        if (!this.clients.has(userId)) {
            this.clients.set(userId, new Set());
            // Broadcast user online status
            this.broadcastPresence(userId, true);
        }
        this.clients.get(userId).add(client);
        // Send initial connected handshake
        this.sendToClient(res, 'connected', {
            userId,
            timestamp: new Date().toISOString(),
        });
        return client;
    }
    /**
     * Remove an SSE client connection on disconnect
     */
    removeClient(userId, client) {
        const userClients = this.clients.get(userId);
        if (userClients) {
            userClients.delete(client);
            if (userClients.size === 0) {
                this.clients.delete(userId);
                // Broadcast user offline status
                this.broadcastPresence(userId, false);
            }
        }
    }
    /**
     * Check if a user is currently online
     */
    isUserOnline(userId) {
        const userClients = this.clients.get(userId);
        return Boolean(userClients && userClients.size > 0);
    }
    /**
     * Get all currently online user IDs
     */
    getOnlineUsers() {
        return Array.from(this.clients.keys());
    }
    /**
     * Send an SSE event to a specific user across all their open devices/tabs
     */
    sendToUser(userId, event, data) {
        const userClients = this.clients.get(userId);
        if (!userClients || userClients.size === 0)
            return;
        userClients.forEach((client) => {
            this.sendToClient(client.res, event, data);
        });
    }
    /**
     * Broadcast an SSE event to all connected clients
     */
    broadcastToAll(event, data) {
        this.clients.forEach((userClients) => {
            userClients.forEach((client) => {
                this.sendToClient(client.res, event, data);
            });
        });
    }
    /**
     * Broadcast online presence status to all connected clients
     */
    broadcastPresence(userId, isOnline) {
        this.broadcastToAll('presence', {
            userId,
            isOnline,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Helper to write formatted SSE data
     */
    sendToClient(res, event, data) {
        try {
            res.write(`event: ${event}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        }
        catch (err) {
            // Connection might have closed abruptly
        }
    }
    /**
     * Heartbeat to prevent timeouts through proxies and firewalls
     */
    sendHeartbeat() {
        this.clients.forEach((userClients) => {
            userClients.forEach((client) => {
                try {
                    client.res.write(': heartbeat\n\n');
                }
                catch {
                    // Ignore
                }
            });
        });
    }
}
exports.realtimeService = new RealtimeService();
// Send periodic heartbeat every 20 seconds
setInterval(() => {
    exports.realtimeService.sendHeartbeat();
}, 20000);
