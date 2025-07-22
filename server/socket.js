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
      const { state, saveCreds } = await useMultiFileAuthState("auth");

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
          console.log("QR Code generated");
          const qrImageUrl = await QRCode.toDataURL(qr);
          io.emit("qr", qrImageUrl);
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

          // Auto-restart if connection closes unexpectedly
          if (lastDisconnect?.error?.output?.statusCode !== 401) {
            console.log("Attempting to reconnect...");
            setTimeout(() => startSocket(), 2000);
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

    // Listen for "generate-new-qr" event from the frontend
    socket.on("generate-new-qr", async () => {
      console.log("Generating new QR code...");
      // End existing socket
      if (sock) {
        sock.end();
      }

      // Clear auth state to force new QR generation
      try {
        if (fs.existsSync("auth")) {
          fs.rmSync("auth", { recursive: true, force: true });
        }
      } catch (error) {
        console.log("Error clearing auth:", error);
      }

      // Start fresh socket
      await startSocket();
    });
  });

  startSocket();
}
