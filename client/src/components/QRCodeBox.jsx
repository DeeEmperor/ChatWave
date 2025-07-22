import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import io from "socket.io-client";

const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000"); 

export default function QRCodeBox() {
  const [isConnected, setIsConnected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCode, setQrCode] = useState(null); // State for the QR code image
  const { toast } = useToast();

  const { data: qrData, refetch } = useQuery({
    queryKey: ["/api/qr"],
    refetchInterval: isConnected ? false : 3000,
    enabled: false, // Disable automatic fetching
  });

  const { data: connectionStatus } = useQuery({
    queryKey: ["/api/connection-status"],
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (connectionStatus?.connected) {
      setIsConnected(true);
    }
  }, [connectionStatus]);

  useEffect(() => {
    // Listen for QR code from the backend
    socket.on("qr", (qrImageUrl) => {
      setQrCode(qrImageUrl);
      setIsGenerating(false);
      toast({
        title: "QR Code Generated",
        description: "New QR code generated. Scan with WhatsApp to connect.",
      });
    });

    // Listen for connection status updates
    socket.on("connected", () => {
      setIsConnected(true);
      setQrCode(null); // Clear QR code when connected
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
    setIsGenerating(true);
    setQrCode(null); // Clear any existing QR code
    try {
      // Emit WebSocket event to generate a new QR code
      socket.emit("generate-new-qr");
    } catch (error) {
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
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-check-circle text-green-600 text-2xl"></i>
        </div>
        <h3 className="text-lg font-semibold text-green-900 mb-2">Connected!</h3>
        <p className="text-sm text-gray-600 mb-4">WhatsApp Web is connected and ready to send messages.</p>
        <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Online - Ready to send</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-600 mb-6">
        Generate a QR code to connect your WhatsApp account
      </p>
      <button
        onClick={handleGenerateQR}
        disabled={isGenerating}
        className="w-full bg-whatsapp hover:bg-whatsapp-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Generating...</span>
          </>
        ) : (
          <>
            <i className="fas fa-qrcode"></i>
            <span>Generate QR Code</span>
          </>
        )}
      </button>
      {qrCode && (
        <div className="mt-6">
          <img src={qrCode} alt="WhatsApp QR Code" className="mx-auto" />
        </div>
      )}
    </div>
  );
}



// import { useState, useEffect } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import { useToast } from '@/hooks/use-toast';

// export default function QRCodeBox() {
//   const [isConnected, setIsConnected] = useState(false);
//   const [isGenerating, setIsGenerating] = useState(false);
//   const { toast } = useToast();

//   const { data: qrData, refetch } = useQuery({
//     queryKey: ['/api/qr'],
//     refetchInterval: isConnected ? false : 3000,
//     enabled: false, // Disable automatic fetching
//   });

//   const { data: connectionStatus } = useQuery({
//     queryKey: ['/api/connection-status'],
//     refetchInterval: 2000,
//   });

//   useEffect(() => {
//     if (connectionStatus?.connected) {
//       setIsConnected(true);
//     }
//   }, [connectionStatus]);

//   const handleGenerateQR = async () => {
//     setIsGenerating(true);
//     try {
//       await refetch();
//       toast({
//         title: "QR Code Generated",
//         description: "New QR code generated. Scan with WhatsApp to connect.",
//       });
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: "Failed to generate QR code. Please try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   if (isConnected || qrData?.connected) {
//     return (
//       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//         <div className="flex items-center space-x-3 mb-6">
//           <div className="w-8 h-8 bg-whatsapp rounded-lg flex items-center justify-center">
//             <i className="fab fa-whatsapp text-white"></i>
//           </div>
//           <h2 className="text-lg font-semibold text-gray-900">WhatsApp Connection</h2>
//         </div>

//         <div className="text-center">
//           <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <i className="fas fa-check-circle text-green-600 text-2xl"></i>
//           </div>
//           <h3 className="text-lg font-semibold text-green-900 mb-2">Connected!</h3>
//           <p className="text-sm text-gray-600 mb-4">WhatsApp Web is connected and ready to send messages.</p>
//           <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
//             <div className="w-3 h-3 bg-green-500 rounded-full"></div>
//             <span>Online - Ready to send</span>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//       <div className="flex items-center space-x-3 mb-6">
//         <div className="w-8 h-8 bg-whatsapp rounded-lg flex items-center justify-center">
//           <i className="fab fa-whatsapp text-white"></i>
//         </div>
//         <h2 className="text-lg font-semibold text-gray-900">WhatsApp Connection</h2>
//       </div>

//       <div className="text-center">
//         {qrData && !qrData.connected ? (
//           // Show QR Code when generated
//           <>
//             <div className="bg-gray-50 rounded-lg p-6 mb-4">
//               <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
//                 <div className="text-center">
//                   <div className="grid grid-cols-8 gap-1 mb-3">
//                     {Array.from({ length: 24 }, (_, i) => (
//                       <div 
//                         key={i} 
//                         className={`w-2 h-2 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}
//                       ></div>
//                     ))}
//                   </div>
//                   <p className="text-xs text-gray-500">QR Code</p>
//                 </div>
//               </div>
//             </div>
//             <p className="text-sm text-gray-600 mb-4">Scan with WhatsApp to connect</p>
//             <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 mb-4">
//               <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
//               <span>Waiting for scan...</span>
//             </div>
//             <button
//               onClick={handleGenerateQR}
//               disabled={isGenerating}
//               className="w-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
//             >
//               {isGenerating ? (
//                 <>
//                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
//                   <span>Generating...</span>
//                 </>
//               ) : (
//                 <>
//                   <i className="fas fa-refresh"></i>
//                   <span>Generate New QR Code</span>
//                 </>
//               )}
//             </button>
//           </>
//         ) : (
//           // Show Generate Button when no QR code
//           <div className="py-8">
//             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//               <i className="fab fa-whatsapp text-gray-400 text-2xl"></i>
//             </div>
//             <h3 className="text-lg font-medium text-gray-900 mb-2">Connect WhatsApp</h3>
//             <p className="text-sm text-gray-600 mb-6">Generate a QR code to connect your WhatsApp account</p>
//             <button
//               onClick={handleGenerateQR}
//               disabled={isGenerating}
//               className="w-full bg-whatsapp hover:bg-whatsapp-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
//             >
//               {isGenerating ? (
//                 <>
//                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                   <span>Generating...</span>
//                 </>
//               ) : (
//                 <>
//                   <i className="fas fa-qrcode"></i>
//                   <span>Generate QR Code</span>
//                 </>
//               )}
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
