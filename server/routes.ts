import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema, insertMessageStatusSchema } from "./shared/schema.js";
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

// Default country code - can be made configurable
const DEFAULT_COUNTRY_CODE = '234'; // Nigeria

// Get WhatsApp connection state from socket
function isWhatsAppConnected() {
  return global.getWhatsAppConnectionState ? global.getWhatsAppConnectionState() : false;
}

// Normalize phone number for storage/display (clean format)
function normalizePhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  let cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Handle different input formats
  if (cleanNumber.startsWith('0')) {
    // Remove leading zero and add country code
    cleanNumber = DEFAULT_COUNTRY_CODE + cleanNumber.slice(1);
  } else if (cleanNumber.startsWith(DEFAULT_COUNTRY_CODE)) {
    // Already has country code, use as is
    cleanNumber = cleanNumber;
  } else if (cleanNumber.startsWith('234')) {
    // Already has country code, use as is
    cleanNumber = cleanNumber;
  } else if (cleanNumber.length === 10 || cleanNumber.length === 11) {
    // Assume domestic number without leading zero
    cleanNumber = DEFAULT_COUNTRY_CODE + cleanNumber;
  }
  
  return cleanNumber;
}

// Format phone number for WhatsApp messaging (adds @s.whatsapp.net)
function formatPhoneNumberForWhatsApp(phoneNumber: string): string {
  const normalizedNumber = normalizePhoneNumber(phoneNumber);
  return normalizedNumber + '@s.whatsapp.net';
}
let qrCodeData = "mock-qr-code-data";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get QR code for WhatsApp authentication
  app.get("/api/qr", (req, res) => {
    if (isWhatsAppConnected()) {
      return res.status(200).json({ connected: true });
    }
    
    // Generate mock QR code data - in production this would interface with WhatsApp Web API
    res.status(200).json({ 
      qrCode: qrCodeData,
      connected: false 
    });
  });

  // Check WhatsApp connection status
  app.get("/api/connection-status", (req, res) => {
    res.status(200).json({ connected: isWhatsAppConnected() });
  });

  // Mock endpoint to simulate WhatsApp connection
  app.post("/api/connect", (req, res) => {
    res.status(200).json({ connected: isWhatsAppConnected(), message: "WhatsApp connection status" });
  });

  // Create and send bulk messages
  app.post("/api/send", async (req, res) => {
    try {
      if (!isWhatsAppConnected()) {
        return res.status(400).json({ error: "WhatsApp not connected. Please scan QR code first." });
      }

      const validatedData = insertMessageSchema.parse(req.body);
      
      if (validatedData.delay < 6) {
        return res.status(400).json({ error: "Minimum delay is 6 seconds" });
      }

      if (!validatedData.phoneNumbers || validatedData.phoneNumbers.length === 0) {
        return res.status(400).json({ error: "At least one phone number is required" });
      }

      // Normalize phone numbers for storage/display
      const normalizedPhoneNumbers = validatedData.phoneNumbers.map(num => normalizePhoneNumber(num));
      
      const messageData = {
        ...validatedData,
        phoneNumbers: normalizedPhoneNumbers
      };
      
      const message = await storage.createMessage(messageData);
      
      // Create initial status entries for all phone numbers
      for (const phoneNumber of normalizedPhoneNumbers) {
        await storage.createMessageStatus({
          messageId: message.id,
          phoneNumber,
          status: "pending"
        });
      }

      // Start sending messages asynchronously
      sendMessagesWithDelay(message.id, normalizedPhoneNumbers, validatedData.delay);

      res.status(200).json({ 
        messageId: message.id,
        message: "Messages queued for sending",
        totalNumbers: normalizedPhoneNumbers.length 
      });
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  // Get message status
  app.get("/api/message/:id/status", async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const message = await storage.getMessage(messageId);
      
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      const statuses = await storage.getMessageStatuses(messageId);
      
      res.status(200).json({
        message,
        statuses,
        progress: {
          total: message.phoneNumbers.length,
          sent: message.sentCount,
          failed: message.failedCount,
          pending: message.phoneNumbers.length - message.sentCount - message.failedCount
        }
      });
    } catch (error) {
      console.error("Error getting message status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all message statuses for real-time updates
  app.get("/api/statuses", async (req, res) => {
    try {
      const messages = await storage.getAllMessages();
      const allStatuses = [];
      
      for (const message of messages) {
        const statuses = await storage.getMessageStatuses(message.id);
        allStatuses.push(...statuses);
      }
      
      res.status(200).json(allStatuses);
    } catch (error) {
      console.error("Error getting statuses:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Upload CSV file
  app.post("/api/upload", upload.single('csvFile'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // In production, parse the CSV file here
      // For now, return mock phone numbers
      const phoneNumbers = ["+1234567890", "+9876543210", "+5555555555"];
      
      res.status(200).json({ 
        phoneNumbers,
        count: phoneNumbers.length,
        message: "CSV file processed successfully" 
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "File upload failed" });
    }
  });

  // Get statistics
  app.get("/api/statistics", async (req, res) => {
    try {
      const stats = await storage.getStatistics();
      
      // Debug: Log current statistics breakdown
      console.log('📊 Statistics debug:', {
        stats,
        allMessages: await storage.getAllMessages(),
        totalStatuses: (await Promise.all(
          (await storage.getAllMessages()).map(m => storage.getMessageStatuses(m.id))
        )).flat().length
      });
      
      res.status(200).json(stats);
    } catch (error) {
      console.error("Error getting statistics:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Clear statistics
  app.post("/api/clear-statistics", async (req, res) => {
    try {
      // In production, implement proper statistics clearing
      res.status(200).json({ message: "Statistics cleared successfully" });
    } catch (error) {
      console.error("Error clearing statistics:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to send messages with delay using actual WhatsApp
async function sendMessagesWithDelay(messageId: number, phoneNumbers: string[], delay: number) {
  const message = await storage.getMessage(messageId);
  if (!message) return;

  await storage.updateMessage(messageId, { status: "sending" });

  // Get WhatsApp socket instance
  const getSocket = global.getWhatsAppSocket;
  
  for (let i = 0; i < phoneNumbers.length; i++) {
    const phoneNumber = phoneNumbers[i];
    
    // Wait for the specified delay
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, delay * 1000));
    }

    try {
      const sock = getSocket ? getSocket() : null;
      
      if (!sock) {
        throw new Error("WhatsApp socket not available");
      }

      // Format phone number for WhatsApp
      const formattedNumber = formatPhoneNumberForWhatsApp(phoneNumber);
      console.log(`📞 Formatting ${phoneNumber} → ${formattedNumber}`);

      // Send actual WhatsApp message
      await sock.sendMessage(formattedNumber, { 
        text: message.content 
      });

      console.log(`✅ Message sent to ${phoneNumber}`);

      await storage.createMessageStatus({
        messageId,
        phoneNumber,
        status: "sent"
      });
      
      const updatedMessage = await storage.getMessage(messageId);
      if (updatedMessage) {
        await storage.updateMessage(messageId, { 
          sentCount: updatedMessage.sentCount + 1 
        });
      }

    } catch (error) {
      console.error(`❌ Error sending to ${phoneNumber}:`, error);
      
      await storage.createMessageStatus({
        messageId,
        phoneNumber,
        status: "failed",
        errorMessage: error.message || "Failed to send message"
      });
      
      const updatedMessage = await storage.getMessage(messageId);
      if (updatedMessage) {
        await storage.updateMessage(messageId, { 
          failedCount: updatedMessage.failedCount + 1 
        });
      }
    }
  }

  await storage.updateMessage(messageId, { status: "completed" });
}
