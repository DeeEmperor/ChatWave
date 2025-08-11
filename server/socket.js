import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
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

  let currentAuthDir = null;

  async function startSocket() {
    try {
      // Use a stable, persistent auth directory in all environments
      const authDir = process.env.WA_AUTH_DIR || "auth";
      currentAuthDir = authDir;

      const { state, saveCreds } = await useMultiFileAuthState(authDir);

      const { version } = await fetchLatestBaileysVersion();
      console.log("Using Baileys version:", version);

      sock = makeWASocket({
        version,
        auth: state,
        // Identify consistently like a desktop browser
        browser: ["Desktop", "Chrome", "120.0.0"],
        // printQRInTerminal is deprecated; we emit QR via connection.update
        qrTimeout: 60000,
        markOnlineOnConnect: false,
        syncFullHistory: false,
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
          // Generate crisp SVG and send as data URL to avoid raster scaling issues
          const svg = await QRCode.toString(qr, {
            type: "svg",
            errorCorrectionLevel: "M",
            margin: 4,
            width: 320,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });
          const qrImageUrl = `data:image/svg+xml;base64,${Buffer.from(
            svg
          ).toString("base64")}`;
          console.log("Emitting QR payload as SVG object", {
            len: qrImageUrl.length,
          });
          io.emit("qr", {
            format: "svg",
            width: 320,
            margin: 4,
            dataUrl: qrImageUrl,
          });
        }

        if (connection === "open") {
          console.log("✅ WhatsApp connected successfully");
          console.log("🔄 Waiting 8 seconds for connection to stabilize...");

          // Slightly longer stabilization to match terminal behavior
          setTimeout(() => {
            connectionState.isConnected = true;
            io.emit("connected");
            console.log("🎉 Connection stabilized and ready!");
          }, 8000);
        }

        if (connection === "close") {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const shouldReconnect = statusCode !== 403;
          console.log("❌ WhatsApp disconnected", {
            shouldReconnect,
            statusCode,
          });

          connectionState.isConnected = false;
          whatsappSocket = null;
          io.emit("disconnected");

          // If unauthorized/expired (401/403), wipe creds and force a fresh QR next time
          if (statusCode === 401 || statusCode === 403) {
            try {
              if (currentAuthDir && fs.existsSync(currentAuthDir)) {
                fs.rmSync(currentAuthDir, { recursive: true, force: true });
                console.log("🧹 Cleared auth directory due to", statusCode);
              }
            } catch (e) {
              console.log("Error clearing auth after close:", e?.message);
            }
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

      // Force fresh QR: clear auth to avoid 401 loops on stale creds
      try {
        if (currentAuthDir && fs.existsSync(currentAuthDir)) {
          fs.rmSync(currentAuthDir, { recursive: true, force: true });
          console.log("🧹 Cleared auth directory for fresh QR");
        }
      } catch (e) {
        console.log("Error clearing auth on generate:", e?.message);
      }

      connectionState.isConnected = false;
      whatsappSocket = null;

      // Start (or restart) socket
      await startSocket();
    });
  });

  // Don't auto-start socket - only generate QR when user requests it
}
