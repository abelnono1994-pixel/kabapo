"use client"

import * as React from "react"
import type { ToastActionElement, ToastProps } from "@/components/ui/toast"

export const TOAST_LIMIT = 1
export const TOAST_REMOVE_DELAY = 1000000

export type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

export type Toast = Omit<ToasterToast, "id">

export interface IToastContext {
  toasts: ToasterToast[]
  toast: (props: Toast) => { id: string; dismiss: () => void; update: (props: Partial<ToasterToast>) => void; }
  dismiss: (toastId?: string) => void
}

export const ToastContext = React.createContext<IToastContext | undefined>(undefined)

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastStateProvider")
  }
  return context
}
