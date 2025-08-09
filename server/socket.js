import { makeWASocket, useMultiFileAuthState } from "@whiskeysockets/baileys";
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
      const authDir =
        process.env.NODE_ENV === "production"
          ? `/tmp/auth-${Date.now()}`
          : "auth";

      const { state, saveCreds } = await useMultiFileAuthState(authDir);

      sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        qrTimeout: 60000,
      });

      whatsappSocket = sock; // Store reference globally
      sock.ev.on("creds.update", saveCreds);

      sock.ev.on("connection.update", async (update) => {
        const { qr, connection, lastDisconnect } = update;

        console.log("Connection update:", {
          connection,
          errorCode: lastDisconnect?.error?.output?.statusCode,
        });

        if (qr) {
          console.log("📱 QR Code generated");
          const qrImageUrl = await QRCode.toDataURL(qr);
          io.emit("qr", qrImageUrl);
        }

        if (connection === "open") {
          console.log("✅ WhatsApp connected successfully");
          console.log("🔄 Waiting 5 seconds for connection to stabilize...");

          // Add stabilization delay like the working terminal version
          setTimeout(() => {
            connectionState.isConnected = true;
            io.emit("connected");
            console.log("🎉 Connection stabilized and ready!");
          }, 5000); // 5 second delay for stabilization
        }

        if (connection === "close") {
          const shouldReconnect =
            lastDisconnect?.error?.output?.statusCode !== 403;
          console.log("❌ WhatsApp disconnected", {
            shouldReconnect,
            statusCode: lastDisconnect?.error?.output?.statusCode,
          });

          connectionState.isConnected = false;
          whatsappSocket = null;
          io.emit("disconnected");
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

      // Clear any existing auth directory
      try {
        if (fs.existsSync("auth")) {
          fs.rmSync("auth", { recursive: true, force: true });
          console.log("Cleared existing auth directory");
        }
      } catch (error) {
        console.log("Error clearing auth:", error.message);
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
