"use client"
import * as React from "react"
import { 
  useToast as useToastContext, 
  ToastContext,
  TOAST_LIMIT,
  TOAST_REMOVE_DELAY,
  type IToastContext,
  type ToasterToast,
  type Toast,
} from "@/hooks/use-toast"
import {
  Toast as RadixToast,
  ToastClose,
  ToastDescription,
  ToastProvider as RadixToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

// This is the state provider component that was previously in use-toast.ts
export const ToastStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToasterToast[]>([])
  const toastTimeouts = React.useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const genId = () => {
    return Math.random().toString(36).substring(2, 9);
  }

  const addToRemoveQueue = React.useCallback((toastId: string) => {
    if (toastTimeouts.current.has(toastId)) {
      return
    }

    const timeout = setTimeout(() => {
      toastTimeouts.current.delete(toastId)
      setToasts((prev) => prev.filter((t) => t.id !== toastId))
    }, TOAST_REMOVE_DELAY)

    toastTimeouts.current.set(toastId, timeout)
  }, [])

  const dismiss = React.useCallback((toastId?: string) => {
    setToasts((prev) =>
      prev.map((t) => {
        if (t.id === toastId || toastId === undefined) {
          addToRemoveQueue(t.id)
          return { ...t, open: false }
        }
        return t
      })
    )
  }, [addToRemoveQueue])

  const toast = React.useCallback((props: Toast) => {
    const id = genId();
    const newToast: ToasterToast = {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss(id)
      },
    }

    setToasts((prev) => [newToast, ...prev].slice(0, TOAST_LIMIT))

    const update = (updateProps: Partial<ToasterToast>) => {
      setToasts((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, ...updateProps } : t
        )
      )
    }

    return {
      id,
      dismiss: () => dismiss(id),
      update,
    }
  }, [dismiss])

  const contextValue: IToastContext = {
    toasts,
    toast,
    dismiss
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  )
}


// This is the component that renders the toasts to the screen.
export function Toaster() {
  const { toasts } = useToastContext()

  return (
    <RadixToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <RadixToast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </RadixToast>
        )
      })}
      <ToastViewport />
    </RadixToastProvider>
  )
}
