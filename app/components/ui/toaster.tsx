"use client"

import * as React from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

function safeNode(node: React.ReactNode): React.ReactNode {
  if (node === null || node === undefined) return null;
  if (typeof node === 'string' || typeof node === 'number' || React.isValidElement(node)) return node;
  if (Array.isArray(node)) return node.map((n, i) => <React.Fragment key={i}>{safeNode(n)}</React.Fragment>);
  if (typeof node === 'object') {
    const obj = node as unknown as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    try {
      return JSON.stringify(node);
    } catch {
      return 'Something went wrong';
    }
  }
  return String(node);
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title ? <ToastTitle>{safeNode(title)}</ToastTitle> : null}
              {description ? (
                <ToastDescription>{safeNode(description)}</ToastDescription>
              ) : null}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

