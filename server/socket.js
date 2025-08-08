import {
  makeWASocket,
  useMultiFileAuthState,
  delay,
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import fs from "fs";

let connectionState = {
  isConnected: false,
};

let whatsappSocket = null;

export function setupSocket(io) {
  let sock;

  // Export getter for connection state
  global.getWhatsAppConnectionState = () => connectionState.isConnected;
  global.getWhatsAppSocket = () => whatsappSocket;

  async function startSocket() {
    try {
      // Use temporary auth directory in production environments
      const authDir = process.env.NODE_ENV === 'production' ? `/tmp/auth-${Date.now()}` : "auth";
      
      // Clear any existing auth state first to force QR generation
      try {
        if (process.env.NODE_ENV === 'production') {
          const files = fs.readdirSync('/tmp').filter(f => f.startsWith('auth-'));
          files.forEach(file => {
            try {
              fs.rmSync(`/tmp/${file}`, { recursive: true, force: true });
            } catch (e) {
              console.log(`Failed to remove ${file}:`, e.message);
            }
          });
        } else {
          if (fs.existsSync("auth")) {
            fs.rmSync("auth", { recursive: true, force: true });
          }
        }
      } catch (error) {
        console.log("Auth cleanup (this is normal):", error.message);
      }
      
      const { state, saveCreds } = await useMultiFileAuthState(authDir);

      sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        qrTimeout: 60000, // 60 second timeout
      });

      whatsappSocket = sock; // Store reference globally
      sock.ev.on("creds.update", saveCreds);

      sock.ev.on("connection.update", async (update) => {
        const { qr, connection, lastDisconnect } = update;

        if (qr) {
          console.log("QR Code generated, emitting to clients...");
          const qrImageUrl = await QRCode.toDataURL(qr);
          console.log("QR code data URL length:", qrImageUrl.length);
          io.emit("qr", qrImageUrl);
          console.log("QR code emitted to all connected clients");
        }

        if (connection === "open") {
          console.log("✅ WhatsApp connected");
          connectionState.isConnected = true;
          io.emit("connected");
        }

        if (connection === "close") {
          console.log("❌ WhatsApp disconnected");
          connectionState.isConnected = false;
          whatsappSocket = null; // Clear socket reference
          io.emit("disconnected");

          // Don't auto-restart - let user manually generate new QR
          if (lastDisconnect?.error?.output?.statusCode !== 401) {
            console.log("Connection lost. User needs to generate new QR code.");
          }
        }
      });
    } catch (error) {
      console.error("Error starting socket:", error);
      io.emit("error", "Failed to start WhatsApp connection");
    }
  }

  io.on("connection", (socket) => {
    console.log("a user connected with id:", socket.id);
    console.log("Total connected clients:", io.engine.clientsCount);

    // Listen for "generate-new-qr" event from the frontend
    socket.on("generate-new-qr", async () => {
      console.log("Generating new QR code...");
      
      // Don't generate if already connected
      if (connectionState.isConnected) {
        console.log("Already connected to WhatsApp");
        io.emit("connected");
        return;
      }
      
      // End existing socket
      if (sock) {
        sock.end();
      }

      // Clear auth state to force new QR generation  
      try {
        const authDir = process.env.NODE_ENV === 'production' ? '/tmp' : '.';
        const authPattern = process.env.NODE_ENV === 'production' ? 'auth-*' : 'auth';
        
        if (process.env.NODE_ENV === 'production') {
          // In production, clean up temp auth directories
          const files = fs.readdirSync('/tmp').filter(f => f.startsWith('auth-'));
          files.forEach(file => {
            try {
              fs.rmSync(`/tmp/${file}`, { recursive: true, force: true });
            } catch (e) {
              console.log(`Failed to remove ${file}:`, e.message);
            }
          });
        } else {
          // In development, remove auth directory
          if (fs.existsSync("auth")) {
            fs.rmSync("auth", { recursive: true, force: true });
          }
        }
      } catch (error) {
        console.log("Error clearing auth (this is expected in production):", error);
        // In production environments like Render, file operations may fail
        // This is expected and shouldn't prevent QR generation
      }

      // Reset connection state
      connectionState.isConnected = false;
      whatsappSocket = null;

      // Start fresh socket
      await startSocket();
    });
  });

  // Don't auto-start socket - only generate QR when user requests it
}
