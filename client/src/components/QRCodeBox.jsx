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
      <Card className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 border-emerald-300 shadow-xl shadow-emerald-500/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/15"></div>
        <div className="relative z-10">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-3">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Wifi className="w-6 h-6 text-green-600" />
            WhatsApp Connected
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-green-700 mb-6 text-lg leading-relaxed">
            🎉 Your WhatsApp Web is connected and ready to send professional messages.
          </p>
          <Badge variant="outline" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-400 px-4 py-2 text-sm font-medium">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse shadow-sm"></div>
            Online & Ready
          </Badge>
        </CardContent>
        </div>
      </Card>
    );
  }

  // Mobile device warning
  if (isMobile) {
    return (
      <Card className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100 border-orange-300 shadow-xl shadow-orange-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/10"></div>
        <div className="relative z-10">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl flex items-center justify-center shadow-2xl">
              <Smartphone className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-700 to-amber-700 bg-clip-text text-transparent flex items-center justify-center gap-3">
              <Monitor className="w-6 h-6 text-orange-600" />
              Use Desktop for QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-orange-700 text-lg leading-relaxed">
              📱➡️💻 QR codes need to be scanned from a different device
            </p>
            
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">How to Connect:</h4>
              <ol className="text-blue-700 text-sm space-y-2 text-left">
                <li>1. Open this app on your desktop/laptop</li>
                <li>2. Generate the QR code there</li>
                <li>3. Scan it with this mobile device's WhatsApp</li>
              </ol>
            </div>

            <Button 
              onClick={() => {
                const currentUrl = window.location.href;
                navigator.clipboard?.writeText(currentUrl);
                toast({
                  title: "URL Copied!",
                  description: "Share this link to open on desktop",
                });
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              <ExternalLink className="w-5 h-5 mr-3" />
              <span className="font-medium">Copy Link for Desktop</span>
            </Button>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 border-blue-300 shadow-xl shadow-blue-500/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/10"></div>
      <div className="relative z-10">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-slate-800">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            WhatsApp Connection
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="mb-6 flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center shadow-md border-2 border-red-200">
              <WifiOff className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">Connect Your WhatsApp</h3>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Generate a secure QR code to link your WhatsApp account for professional bulk messaging
          </p>

          {qrCode && (
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
              <p className="text-sm text-blue-700 font-medium">
                ⏱️ QR code expires in 60 seconds
              </p>
            </div>
          )}

          <Button 
            onClick={handleGenerateQR}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                <span className="font-medium">Generating QR Code...</span>
              </>
            ) : (
              <>
                <QrCode className="w-5 h-5 mr-3" />
                <span className="font-medium">Generate QR Code</span>
              </>
            )}
          </Button>
        </div>

        {(() => {
          console.log("🖼️ QR Code render check:", { qrCode: !!qrCode, qrCodeLength: qrCode?.length });
          return qrCode;
        })() && (
          <>
            <Separator className="bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
            <div className="text-center">
              <div className="mb-6 p-6 bg-gradient-to-br from-white via-blue-50/50 to-indigo-50 rounded-2xl border-2 border-dashed border-blue-300 shadow-inner">
                <img 
                  src={qrCode} 
                  alt="WhatsApp QR Code" 
                  className="mx-auto max-w-full h-auto rounded-xl shadow-lg border-4 border-white"
                  onLoad={() => console.log("✅ QR image loaded successfully")}
                  onError={(e) => console.error("❌ QR image failed to load:", e)}
                />
              </div>
              <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg">
                <p className="text-emerald-700 font-medium flex items-center justify-center gap-2">
                  📱 <span><strong>Scan with WhatsApp:</strong> Settings → Linked Devices → Link a Device</span>
                </p>
              </div>
              <Button
                onClick={handleGenerateQR}
                variant="outline"
                size="sm"
                className="text-slate-600 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                <span className="font-medium">Generate New Code</span>
              </Button>
            </div>
          </>
        )}
      </CardContent>
      </div>
    </Card>
  );
}
