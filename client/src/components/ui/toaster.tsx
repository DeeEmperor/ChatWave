import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, AlertCircle, XCircle, Info, QrCode, Wifi } from "lucide-react"

const getToastIcon = (variant: string, title: string) => {
  // Special icons for specific titles
  if (title?.includes("QR Code")) return <QrCode className="h-5 w-5" />
  if (title?.includes("Connected")) return <Wifi className="h-5 w-5" />
  
  // Default icons by variant
  switch (variant) {
    case "success":
      return <CheckCircle2 className="h-5 w-5" />
    case "destructive":
      return <XCircle className="h-5 w-5" />
    case "warning":
      return <AlertCircle className="h-5 w-5" />
    case "info":
      return <Info className="h-5 w-5" />
    default:
      return <Info className="h-5 w-5" />
  }
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant = "default", ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="relative">
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 mt-0.5 ${variant === 'success' ? 'animate-pulse' : ''}`}>
                  {getToastIcon(variant, title)}
                </div>
                <div className="flex-1 min-w-0">
                  {title && (
                    <ToastTitle className="text-sm font-semibold leading-tight">
                      {title}
                    </ToastTitle>
                  )}
                  {description && (
                    <ToastDescription className="text-sm mt-1 opacity-90 leading-relaxed">
                      {description}
                    </ToastDescription>
                  )}
                </div>
              </div>
              {/* Auto-dismiss progress bar */}
              <div className="absolute bottom-0 left-0 h-1 bg-current/20 rounded-full overflow-hidden w-full">
                <div 
                  className="h-full bg-current/50 rounded-full transition-all duration-[5000ms] ease-linear" 
                  style={{ width: '0%', animation: 'toast-progress 5s linear forwards' }}
                />
              </div>
            </div>
            {action}
            <ToastClose />
            <style jsx>{`
              @keyframes toast-progress {
                from { width: 100%; }
                to { width: 0%; }
              }
            `}</style>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
