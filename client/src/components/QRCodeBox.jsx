import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import io from "socket.io-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QrCode, Wifi, WifiOff, RotateCcw, CheckCircle2, Loader2, Smartphone, Monitor, ExternalLink } from "lucide-react";

// Force production URL when deployed
const apiUrl = import.meta.env.VITE_API_URL || 
  (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('chat-wave'))
    ? "https://chatwave-64p3.onrender.com"
    : window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
    ? "http://localhost:5000"
    : "https://chatwave-64p3.onrender.com";

console.log("🔍 Debug info:", {
  hostname: window.location.hostname,
  origin: window.location.origin,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  finalApiUrl: apiUrl
});
console.log("🔗 Connecting to Socket.IO at:", apiUrl);

const socket = io(apiUrl, {
  transports: ['websocket', 'polling'],
  timeout: 20000,
});

// Debug Socket.IO connection
socket.on("connect", () => {
  console.log("✅ Socket.IO connected:", socket.id);
});

socket.on("disconnect", () => {
  console.log("❌ Socket.IO disconnected");
});

socket.on("connect_error", (error) => {
  console.error("❌ Socket.IO connection error:", error);
}); 

// Mobile device detection
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768);
};

export default function QRCodeBox() {
  const [isConnected, setIsConnected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();

  const { data: qrData, refetch } = useQuery({
    queryKey: ["/api/qr"],
    refetchInterval: isConnected ? false : 3000,
    enabled: false,
  });

  const { data: connectionStatus } = useQuery({
    queryKey: ["/api/connection-status"],
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (connectionStatus?.connected) {
      setIsConnected(true);
      setConnectionAttempts(0);
    }
  }, [connectionStatus]);

  useEffect(() => {
    // Check if mobile on mount and window resize
    const checkMobile = () => setIsMobile(isMobileDevice());
    checkMobile();
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    console.log("🔧 Setting up Socket.IO event listeners...");
    
    // Listen for QR code from the backend
    socket.on("qr", (qrImageUrl) => {
      console.log("📱 QR code received from backend!");
      console.log("🔍 QR data details:", {
        received: !!qrImageUrl,
        length: qrImageUrl?.length,
        type: typeof qrImageUrl,
        starts_with: qrImageUrl?.substring(0, 50)
      });
      
      setQrCode(qrImageUrl);
      setIsGenerating(false);
      setConnectionAttempts(prev => prev + 1);
      toast({
        title: "QR Code Generated",
        description: "New QR code generated. Scan with WhatsApp to connect.",
      });
    });

    // Listen for connection status updates
    socket.on("connected", () => {
      setIsConnected(true);
      setQrCode(null);
      setConnectionAttempts(0);
      toast({
        title: "Connected!",
        description: "WhatsApp Web is connected and ready to send messages.",
      });
    });

    socket.on("disconnected", () => {
      setIsConnected(false);
      toast({
        title: "Disconnected",
        description: "WhatsApp Web has been disconnected.",
        variant: "destructive",
      });
    });

    return () => {
      socket.off("qr");
      socket.off("connected");
      socket.off("disconnected");
    };
  }, [toast]);

  const handleGenerateQR = async () => {
    console.log("🔄 Generating QR code...");
    setIsGenerating(true);
    setQrCode(null);
    try {
      console.log("📤 Emitting generate-new-qr event");
      socket.emit("generate-new-qr");
    } catch (error) {
      console.error("❌ Error generating QR:", error);
      setIsGenerating(false);
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isConnected) {
    return (
      <div className="cw-qrcard-connected">
        <div className="w-3 h-3 bg-white rounded-full cw-pulse"></div>
        <Wifi size={16} />
        WhatsApp Connected
      </div>
    );
  }

  // Mobile device warning
  if (isMobile) {
    return (
      <div className="cw-qrcard">
        <div className="cw-qrcard-inner">
          <div className="cw-text-center cw-mb-lg">
            <div className="cw-flex cw-justify-center cw-mb-md">
              <div style={{ width: '60px', height: '60px', background: '#F59E0B', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Smartphone size={28} color="white" />
              </div>
            </div>
            <h3 className="cw-card-title cw-text-center">Need a Computer?</h3>
            <p style={{ color: '#69707a', marginBottom: '1.5rem' }}>
              📱 You're on your phone! QR codes need to be scanned, not viewed.
            </p>
          </div>
          
          <div style={{ padding: '16px', background: 'rgba(23, 165, 137, 0.1)', borderRadius: '10px', marginBottom: '1rem' }}>
            <h4 style={{ fontWeight: '600', color: '#17A589', marginBottom: '12px' }}>
              💡 Here's what to do:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ width: '24px', height: '24px', background: '#17A589', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>1</span>
                <span>Open this website on your computer or laptop</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ width: '24px', height: '24px', background: '#17A589', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>2</span>
                <span>Click "Generate QR Code" on the computer</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ width: '24px', height: '24px', background: '#17A589', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>3</span>
                <span>Use this phone to scan the QR code from the computer screen</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '12px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '8px', marginBottom: '1rem' }}>
            <p style={{ color: '#34D399', fontSize: '0.875rem', margin: 0 }}>
              💡 <strong>Pro Tip:</strong> Copy this link and send it to yourself to open on computer
            </p>
          </div>

          <button 
            onClick={() => {
              const currentUrl = window.location.href;
              navigator.clipboard?.writeText(currentUrl);
              toast({
                title: "Link Copied! 📋",
                description: "Now open this link on your computer",
              });
            }}
            className="cw-btn cw-btn-primary cw-btn-lg"
            style={{ width: '100%' }}
          >
            <ExternalLink size={20} />
            Copy Website Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cw-qrcard">
      <div className="cw-qrcard-inner">
        <div className="cw-card-header">
          <div className="cw-flex cw-items-center cw-gap-md">
            <div className="cw-compose-icon">
              <QrCode size={20} />
            </div>
            <div>
              <h2 className="cw-card-title">WhatsApp Connection</h2>
              <p className="cw-card-subtitle">Connect to start messaging</p>
            </div>
          </div>
        </div>
        
        <div className="cw-text-center cw-mb-lg">
          <div className="cw-flex cw-justify-center cw-mb-md">
            <div style={{ width: '60px', height: '60px', background: '#EF4444', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WifiOff size={28} color="white" />
            </div>
          </div>
          <h3 className="cw-card-title">Connect Your WhatsApp</h3>
          <p className="cw-card-subtitle cw-mb-lg">
            Link your WhatsApp to send messages to multiple contacts at once
          </p>
          
          <div style={{ padding: '16px', background: 'rgba(23, 165, 137, 0.1)', borderRadius: '10px', marginBottom: '1.5rem', textAlign: 'left' }}>
            <h4 style={{ fontWeight: '600', color: '#17A589', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📋 Simple 3-Step Process:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ width: '24px', height: '24px', background: '#17A589', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>1</span>
                <span>Click "Generate QR Code" below</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ width: '24px', height: '24px', background: '#17A589', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>2</span>
                <span>Open WhatsApp on your phone → Settings → Linked Devices</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ width: '24px', height: '24px', background: '#17A589', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>3</span>
                <span>Tap "Link a Device" and scan the QR code</span>
              </div>
            </div>
          </div>

          {qrCode && (
            <div style={{ padding: '12px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '8px', marginBottom: '1rem' }}>
              <p style={{ color: '#34D399', fontSize: '0.875rem', margin: 0, fontWeight: '500' }}>
                ⏱️ QR code expires in 60 seconds
              </p>
            </div>
          )}

          <button 
            onClick={handleGenerateQR}
            disabled={isGenerating}
            className="cw-btn cw-btn-primary cw-btn-lg"
            style={{ width: '100%' }}
          >
            {isGenerating ? (
              <>
                <div className="cw-spinner"></div>
                Generating QR Code...
              </>
            ) : (
              <>
                <QrCode size={20} />
                Generate QR Code
              </>
            )}
          </button>
        </div>

        {(() => {
          console.log("🖼️ QR Code render check:", { qrCode: !!qrCode, qrCodeLength: qrCode?.length });
          return qrCode;
        })() && (
          <div className="cw-text-center">
            <hr style={{ margin: '24px 0', border: 'none', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(23, 165, 137, 0.3), transparent)' }} />
            <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '16px', border: '2px dashed rgba(23, 165, 137, 0.3)', marginBottom: '1.5rem' }}>
              <img 
                src={qrCode} 
                alt="WhatsApp QR Code" 
                style={{ maxWidth: '100%', height: 'auto', borderRadius: '12px', border: '4px solid white', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
                onLoad={() => console.log("✅ QR image loaded successfully")}
                onError={(e) => console.error("❌ QR image failed to load:", e)}
              />
            </div>
            <div style={{ padding: '16px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '10px', marginBottom: '1rem' }}>
              <h4 style={{ fontWeight: '600', color: '#34D399', marginBottom: '8px' }}>
                📱 Ready to scan? Here's how:
              </h4>
              <div style={{ color: '#34D399', fontSize: '0.875rem' }}>
                <p style={{ margin: '4px 0' }}>1. Open WhatsApp on your phone</p>
                <p style={{ margin: '4px 0' }}>2. Go to Settings → Linked Devices</p>
                <p style={{ margin: '4px 0' }}>3. Tap "Link a Device" and scan this QR code</p>
              </div>
            </div>
            <button
              onClick={handleGenerateQR}
              className="cw-btn cw-btn-secondary"
            >
              <RotateCcw size={16} />
              Generate New Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
