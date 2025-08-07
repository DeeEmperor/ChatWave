import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import io from "socket.io-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QrCode, Wifi, WifiOff, RotateCcw, CheckCircle2, Loader2 } from "lucide-react";

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

export default function QRCodeBox() {
  const [isConnected, setIsConnected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
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
      <Card className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-emerald-200 shadow-lg shadow-emerald-500/20 relative overflow-hidden card-hover glow-green">
        <div className="absolute inset-0 bg-dots-pattern opacity-10"></div>
        <div className="relative z-10">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-green-800 flex items-center justify-center gap-2">
            <Wifi className="w-5 h-5" />
            WhatsApp Connected
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-green-700 mb-4">
            Your WhatsApp Web is connected and ready to send messages.
          </p>
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Online & Ready
          </Badge>
        </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border-blue-200/50 shadow-lg shadow-blue-500/10 relative overflow-hidden card-hover glow-blue">
      <div className="absolute inset-0 bg-wave-pattern opacity-5"></div>
      <div className="relative z-10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <QrCode className="w-5 h-5 text-blue-600" />
          </div>
          WhatsApp Connection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <WifiOff className="w-6 h-6 text-gray-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your WhatsApp</h3>
          <p className="text-sm text-gray-600 mb-6">
            Generate a QR code to link your WhatsApp account for bulk messaging
          </p>

          {connectionAttempts > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                Attempt #{connectionAttempts} - QR code expires in 60 seconds
              </p>
            </div>
          )}

          <Button 
            onClick={handleGenerateQR}
            disabled={isGenerating}
            className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating QR Code...
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4 mr-2" />
                Generate QR Code
              </>
            )}
          </Button>
        </div>

        {(() => {
          console.log("🖼️ QR Code render check:", { qrCode: !!qrCode, qrCodeLength: qrCode?.length });
          return qrCode;
        })() && (
          <>
            <Separator />
            <div className="text-center">
              <div className="mb-4 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <img 
                  src={qrCode} 
                  alt="WhatsApp QR Code" 
                  className="mx-auto max-w-full h-auto rounded-lg shadow-sm"
                  onLoad={() => console.log("✅ QR image loaded successfully")}
                  onError={(e) => console.error("❌ QR image failed to load:", e)}
                />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                📱 <strong>Scan with WhatsApp:</strong> Open WhatsApp → Settings → Linked Devices → Link a Device
              </p>
              <Button
                onClick={handleGenerateQR}
                variant="outline"
                size="sm"
                className="text-gray-600 border-gray-300"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Generate New Code
              </Button>
            </div>
          </>
        )}
      </CardContent>
      </div>
    </Card>
  );
}
