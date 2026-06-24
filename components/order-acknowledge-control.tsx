"use client"

import { useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"

export function OrderAcknowledgeControl({
  vendorId,
  poNumber,
  status,
  acknowledged,
  acknowledgedOn,
  onAcknowledged,
}: {
  vendorId: string | null
  poNumber: string
  status: string
  acknowledged: boolean
  acknowledgedOn?: string
  onAcknowledged?: () => void
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [ackDate, setAckDate] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isLocked = ["closed", "voided"].includes((status || "").trim().toLowerCase())

  const handleAcknowledge = async () => {
    if (!ackDate || !vendorId || pending) {
      return
    }

    try {
      setPending(true)
      setError(null)

      const response = await fetch("/api/orders/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "acknowledge", vendorId, poNumber, estArrivalDate: ackDate }),
      })
      const data = await response.json()

      if (response.ok && data.success) {
        setDialogOpen(false)
        setAckDate("")
        onAcknowledged?.()
        return
      }

      setError(data.error || "Failed to acknowledge order")
    } catch (acknowledgeError) {
      setError("An unexpected error occurred")
      console.error(acknowledgeError)
    } finally {
      setPending(false)
    }
  }

  if (acknowledged) {
    return (
      <div className="inline-flex items-center gap-2.5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-[14px] font-semibold text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-400">
        <CheckCircle2 className="h-5 w-5" />
        <span>
          Order Acknowledged
          {acknowledgedOn ? (
            <span className="ml-1 font-normal text-emerald-600/80 dark:text-emerald-400/80">
              · {acknowledgedOn}
            </span>
          ) : null}
        </span>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        disabled={isLocked || pending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(181,74,74,0.18)] transition-colors hover:bg-[#d36a6a] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Acknowledge Order
      </button>

      {dialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[18px] border border-border/70 bg-card p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <h4 className="text-[18px] font-semibold tracking-tight text-foreground">Acknowledge Order</h4>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              Enter the estimated ship date to acknowledge this order.
            </p>

            <div className="mt-4">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Est. Ship Date
              </label>
              <input
                type="date"
                value={ackDate}
                onChange={(event) => setAckDate(event.target.value)}
                disabled={pending}
                className={`h-11 w-full rounded-xl border border-border/70 bg-background px-4 text-[14px] outline-none transition-colors focus:border-primary disabled:opacity-60 ${
                  ackDate ? "text-foreground" : "text-muted-foreground"
                }`}
              />
            </div>

            {error ? (
              <p className="mt-2 text-[13px] font-medium text-red-600 dark:text-red-400">{error}</p>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDialogOpen(false)
                  setAckDate("")
                  setError(null)
                }}
                disabled={pending}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border/70 px-6 text-[14px] font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleAcknowledge()}
                disabled={!ackDate || pending}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(181,74,74,0.18)] transition-colors hover:bg-[#d36a6a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
