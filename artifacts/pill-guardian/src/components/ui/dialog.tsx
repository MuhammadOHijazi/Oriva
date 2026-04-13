import * as React from "react"
import { X } from "lucide-react"

export function Dialog({ open, onOpenChange, children }: { open: boolean, onOpenChange: (open: boolean) => void, children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
        onClick={() => onOpenChange(false)} 
      />
      <div className="relative z-50 grid w-full max-w-lg gap-4 bg-card p-8 shadow-2xl rounded-3xl border border-border animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={() => onOpenChange(false)}
          className="absolute right-6 top-6 rounded-full p-2 hover:bg-secondary text-muted-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  )
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">{children}</h2>
}
