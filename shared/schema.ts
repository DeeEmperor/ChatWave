import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  delay: integer("delay").notNull().default(6),
  phoneNumbers: text("phone_numbers").array().notNull(),
  status: text("status").notNull().default("pending"), // pending, sending, completed, failed
  sentCount: integer("sent_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messageStatus = pgTable("message_status", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull(),
  phoneNumber: text("phone_number").notNull(),
  status: text("status").notNull(), // pending, sent, failed
  timestamp: timestamp("timestamp").defaultNow(),
  errorMessage: text("error_message"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  delay: true,
  phoneNumbers: true,
});

export const insertMessageStatusSchema = createInsertSchema(messageStatus).pick({
  messageId: true,
  phoneNumber: true,
  status: true,
  errorMessage: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessageStatus = z.infer<typeof insertMessageStatusSchema>;
export type MessageStatus = typeof messageStatus.$inferSelect;
