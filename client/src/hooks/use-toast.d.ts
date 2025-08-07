export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: any;
  variant?: "default" | "destructive";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface ToastState {
  toasts: Toast[];
}

export interface ToastActions {
  toast: (props: Omit<Toast, "id">) => {
    id: string;
    dismiss: () => void;
    update: (props: Partial<Toast>) => void;
  };
  dismiss: (toastId?: string) => void;
}

export function useToast(): ToastState & ToastActions;
export function toast(props: Omit<Toast, "id">): {
  id: string;
  dismiss: () => void;
  update: (props: Partial<Toast>) => void;
};
