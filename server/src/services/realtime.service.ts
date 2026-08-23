import { Response } from 'express';

interface ConnectedClient {
  userId: string;
  res: Response;
  connectedAt: Date;
}

class RealtimeService {
  private clients: Map<string, Set<ConnectedClient>> = new Map();

  /**
   * Register a new SSE client connection
   */
  public addClient(userId: string, res: Response): ConnectedClient {
    const client: ConnectedClient = {
      userId,
      res,
      connectedAt: new Date(),
    };

    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
      // Broadcast user online status
      this.broadcastPresence(userId, true);
    }

    this.clients.get(userId)!.add(client);

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
  public removeClient(userId: string, client: ConnectedClient): void {
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
  public isUserOnline(userId: string): boolean {
    const userClients = this.clients.get(userId);
    return Boolean(userClients && userClients.size > 0);
  }

  /**
   * Get all currently online user IDs
   */
  public getOnlineUsers(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Send an SSE event to a specific user across all their open devices/tabs
   */
  public sendToUser(userId: string, event: string, data: any): void {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) return;

    userClients.forEach((client) => {
      this.sendToClient(client.res, event, data);
    });
  }

  /**
   * Broadcast an SSE event to all connected clients
   */
  public broadcastToAll(event: string, data: any): void {
    this.clients.forEach((userClients) => {
      userClients.forEach((client) => {
        this.sendToClient(client.res, event, data);
      });
    });
  }

  /**
   * Broadcast online presence status to all connected clients
   */
  public broadcastPresence(userId: string, isOnline: boolean): void {
    this.broadcastToAll('presence', {
      userId,
      isOnline,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Helper to write formatted SSE data
   */
  private sendToClient(res: Response, event: string, data: any): void {
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      // Connection might have closed abruptly
    }
  }

  /**
   * Heartbeat to prevent timeouts through proxies and firewalls
   */
  public sendHeartbeat(): void {
    this.clients.forEach((userClients) => {
      userClients.forEach((client) => {
        try {
          client.res.write(': heartbeat\n\n');
        } catch {
          // Ignore
        }
      });
    });
  }
}

export const realtimeService = new RealtimeService();

// Send periodic heartbeat every 20 seconds
setInterval(() => {
  realtimeService.sendHeartbeat();
}, 20000);
