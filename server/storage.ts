import { users, messages, messageStatus, type User, type InsertUser, type Message, type InsertMessage, type MessageStatus, type InsertMessageStatus } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessage(id: number): Promise<Message | undefined>;
  getAllMessages(): Promise<Message[]>;
  updateMessage(id: number, updates: Partial<Message>): Promise<Message | undefined>;
  createMessageStatus(status: InsertMessageStatus): Promise<MessageStatus>;
  getMessageStatuses(messageId: number): Promise<MessageStatus[]>;
  updateMessageStatus(id: number, updates: Partial<MessageStatus>): Promise<MessageStatus | undefined>;
  getStatistics(): Promise<{ total: number; successful: number; failed: number; successRate: number; }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  private messageStatuses: Map<number, MessageStatus>;
  private currentUserId: number;
  private currentMessageId: number;
  private currentStatusId: number;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.messageStatuses = new Map();
    this.currentUserId = 1;
    this.currentMessageId = 1;
    this.currentStatusId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      id,
      status: "pending",
      sentCount: 0,
      failedCount: 0,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getAllMessages(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }

  async updateMessage(id: number, updates: Partial<Message>): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (message) {
      const updatedMessage = { ...message, ...updates };
      this.messages.set(id, updatedMessage);
      return updatedMessage;
    }
    return undefined;
  }

  async createMessageStatus(insertStatus: InsertMessageStatus): Promise<MessageStatus> {
    const id = this.currentStatusId++;
    const status: MessageStatus = {
      ...insertStatus,
      id,
      timestamp: new Date(),
    };
    this.messageStatuses.set(id, status);
    return status;
  }

  async getMessageStatuses(messageId: number): Promise<MessageStatus[]> {
    return Array.from(this.messageStatuses.values()).filter(
      (status) => status.messageId === messageId
    );
  }

  async updateMessageStatus(id: number, updates: Partial<MessageStatus>): Promise<MessageStatus | undefined> {
    const status = this.messageStatuses.get(id);
    if (status) {
      const updatedStatus = { ...status, ...updates };
      this.messageStatuses.set(id, updatedStatus);
      return updatedStatus;
    }
    return undefined;
  }

  async getStatistics(): Promise<{ total: number; successful: number; failed: number; successRate: number; }> {
    const allStatuses = Array.from(this.messageStatuses.values());
    const successful = allStatuses.filter(s => s.status === 'sent').length;
    const failed = allStatuses.filter(s => s.status === 'failed').length;
    const total = successful + failed; // Only count completed messages
    const successRate = total > 0 ? Math.round((successful / total) * 100 * 10) / 10 : 0;
    
    return { total, successful, failed, successRate };
  }
}

export const storage = new MemStorage();
