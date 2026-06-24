"use client"

import { useState } from "react"
import {
  CalendarCheck,
  CheckCircle2,
  Loader2,
  Package,
  PackageCheck,
  ShoppingCart,
  Truck,
} from "lucide-react"

export type OrderStatusFields = {
  orderPlacedOn: string
  vendorAcknowledged: string
  vendorAcknowledgedBy: string
  vendorAcknowledgedOn: string
  readyOn: string
  orderShippedDate: string
  estArrivalDate: string
  receivedDate: string
  trackingNo: string
  vendorInvoiceNo: string
}

type ActionKey =
  | "acknowledge"
  | "send-invoice"
  | "update-est-delivery"
  | "update-shipped"
  | "mark-ready"

const EMPTY_VALUE = "Pending"

function isAcknowledged(value: string) {
  const normalized = value.trim().toLowerCase()
  return normalized === "1" || normalized === "yes" || normalized === "true"
}

/**
 * Convert a FileMaker date string (M/D/YYYY, optionally with a trailing time)
 * into the YYYY-MM-DD format an HTML date input requires. Returns "" when the
 * value is empty or not parseable so the field shows its placeholder.
 */
function toIsoDate(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ""
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }

  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!match) {
    return ""
  }

  const [, month, day, year] = match
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}

function toStatusFields(order: Record<string, unknown>): OrderStatusFields {
  const read = (key: string) => {
    const value = order[key]
    return typeof value === "string" ? value : value == null ? "" : String(value)
  }

  return {
    orderPlacedOn: read("orderPlacedOn"),
    vendorAcknowledged: read("vendorAcknowledged"),
    vendorAcknowledgedBy: read("vendorAcknowledgedBy"),
    vendorAcknowledgedOn: read("vendorAcknowledgedOn"),
    readyOn: read("readyOn"),
    orderShippedDate: read("orderShippedDate"),
    // The estimated ship date is backed by the FileMaker DateScheduledArrival
    // field, which maps to `dateScheduled` on the PO record. `receivedDate` is
    // the auto-updated DateReceived field, mapped to `dateReceived`.
    estArrivalDate: read("dateScheduled") || read("estArrivalDate"),
    receivedDate: read("dateReceived") || read("receivedDate"),
    trackingNo: read("trackingNo"),
    vendorInvoiceNo: read("vendorInvoiceNo"),
  }
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="h-8 w-1 rounded-full bg-primary" />
      <h3 className="text-[18px] font-semibold tracking-tight text-foreground">{title}</h3>
    </div>
  )
}

function TimelineRow({
  icon: Icon,
  label,
  value,
  subtext,
  done,
}: {
  icon: typeof ShoppingCart
  label: string
  value: string
  subtext?: string
  done: boolean
}) {
  return (
    <div className="flex flex-1 items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className={
            done
              ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
              : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
          }
        >
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p
            className={
              done
                ? "text-[14px] font-semibold text-foreground"
                : "text-[14px] font-medium text-muted-foreground"
            }
          >
            {label}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={
            done
              ? "whitespace-nowrap text-[13px] font-semibold text-emerald-600 dark:text-emerald-400"
              : "whitespace-nowrap text-[13px] italic text-muted-foreground"
          }
        >
          {value || EMPTY_VALUE}
        </p>
        {subtext ? (
          <p className="whitespace-nowrap text-[12px] text-emerald-600 dark:text-emerald-400">
            {subtext}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </label>
  )
}

const inputBaseClass =
  "h-11 w-full rounded-xl border bg-background px-4 text-[14px] outline-none transition-colors placeholder:text-muted-foreground focus:border-primary disabled:opacity-60"

const primaryButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(181,74,74,0.18)] transition-colors hover:bg-[#d36a6a] disabled:cursor-not-allowed disabled:opacity-60"

// Fixed-width action button so every row's button lines up at the same length.
const actionButtonClass =
  "inline-flex h-11 w-[132px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(181,74,74,0.18)] transition-colors hover:bg-[#d36a6a] disabled:cursor-not-allowed disabled:opacity-60"

export function OrderStatusActions({
  vendorId,
  poNumber,
  orderStatus,
  initialStatus,
  onAcknowledged,
}: {
  vendorId: string | null
  poNumber: string
  orderStatus: string
  initialStatus: OrderStatusFields
  onAcknowledged?: () => void
}) {
  const [status, setStatus] = useState<OrderStatusFields>(initialStatus)
  const [pending, setPending] = useState<ActionKey | null>(null)

  const [ackDialogOpen, setAckDialogOpen] = useState(false)
  const [ackDate, setAckDate] = useState("")
  const [invoiceNo, setInvoiceNo] = useState(initialStatus.vendorInvoiceNo)
  const [estDeliveryDate, setEstDeliveryDate] = useState(toIsoDate(initialStatus.estArrivalDate))
  const [shippedDate, setShippedDate] = useState(toIsoDate(initialStatus.orderShippedDate))
  const [shippedTracking, setShippedTracking] = useState(initialStatus.trackingNo)
  const [readyDate, setReadyDate] = useState(toIsoDate(initialStatus.readyOn))
  const [invoiceSentOpen, setInvoiceSentOpen] = useState(false)
  const [sendInvoiceError, setSendInvoiceError] = useState<string | null>(null)

  // Field-level validation feedback: a red border (persists until edited) plus a
  // one-shot shake animation — no inline text.
  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>({})
  const [shakingFields, setShakingFields] = useState<Record<string, boolean>>({})

  const acknowledged = isAcknowledged(status.vendorAcknowledged)
  // Once a PO is closed (or voided) it is terminal — no vendor action is allowed.
  const isLocked = ["closed", "voided"].includes((orderStatus || "").trim().toLowerCase())

  const flagInvalid = (...fields: string[]) => {
    setInvalidFields((prev) => {
      const next = { ...prev }
      fields.forEach((field) => {
        next[field] = true
      })
      return next
    })
    setShakingFields((prev) => {
      const next = { ...prev }
      fields.forEach((field) => {
        next[field] = true
      })
      return next
    })
  }

  const clearInvalid = (field: string) => {
    setInvalidFields((prev) => (prev[field] ? { ...prev, [field]: false } : prev))
  }

  const stopShake = (field: string) => {
    setShakingFields((prev) => (prev[field] ? { ...prev, [field]: false } : prev))
  }

  const fieldClass = (field: string, options: { date?: boolean; value?: string } = {}) => {
    const { date = false, value = "" } = options
    const textColor = date ? (value ? "text-foreground" : "text-muted-foreground") : "text-foreground"
    return [
      inputBaseClass,
      invalidFields[field]
        ? "border-red-500 ring-2 ring-red-500/40 focus:border-red-500"
        : "border-border/70",
      shakingFields[field] ? "animate-shake" : "",
      textColor,
    ]
      .filter(Boolean)
      .join(" ")
  }

  const runAction = async (
    key: ActionKey,
    payload: Record<string, unknown>,
    options: { fields?: string[]; onSuccess?: (data: Record<string, unknown>) => void } = {}
  ): Promise<{ ok: boolean; error: string | null }> => {
    if (!vendorId || pending) {
      return { ok: false, error: null }
    }

    try {
      setPending(key)

      const response = await fetch("/api/orders/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, poNumber, ...payload }),
      })
      const data = await response.json()

      if (response.ok && data.success) {
        if (data.order) {
          setStatus(toStatusFields(data.order as Record<string, unknown>))
        }
        options.onSuccess?.(data as Record<string, unknown>)
        return { ok: true, error: null }
      }

      if (options.fields?.length) {
        flagInvalid(...options.fields)
      }
      return { ok: false, error: typeof data.error === "string" ? data.error : "Action failed" }
    } catch (actionError) {
      if (options.fields?.length) {
        flagInvalid(...options.fields)
      }
      console.error(actionError)
      return { ok: false, error: "An unexpected error occurred" }
    } finally {
      setPending(null)
    }
  }

  const handleAcknowledge = async () => {
    if (!ackDate) {
      flagInvalid("ackDate")
      return
    }

    const { ok } = await runAction(
      "acknowledge",
      { action: "acknowledge", estArrivalDate: ackDate },
      { fields: ["ackDate"] }
    )

    if (ok) {
      setAckDialogOpen(false)
      setAckDate("")
      onAcknowledged?.()
    }
  }

  const handleSendInvoice = async () => {
    setSendInvoiceError(null)

    if (!invoiceNo.trim()) {
      flagInvalid("invoice")
      return
    }

    const { ok, error } = await runAction(
      "send-invoice",
      { action: "send-invoice", invoiceNo },
      { fields: ["invoice"], onSuccess: () => setInvoiceSentOpen(true) }
    )

    if (!ok && error) {
      setSendInvoiceError(error)
    }
  }

  const handleUpdateEstDelivery = async () => {
    if (!estDeliveryDate) {
      flagInvalid("estDelivery")
      return
    }

    const { ok } = await runAction(
      "update-est-delivery",
      { action: "update-est-delivery", estArrivalDate: estDeliveryDate },
      { fields: ["estDelivery"] }
    )

    // Reload the parent order so the "Est. Ship Date" shown in the
    // Shipping & Delivery card stays in sync with the status timeline.
    if (ok) {
      onAcknowledged?.()
    }
  }

  const handleUpdateShipped = async () => {
    const missing: string[] = []
    if (!shippedDate) missing.push("shippedDate")
    if (!shippedTracking.trim()) missing.push("tracking")
    if (missing.length) {
      flagInvalid(...missing)
      return
    }

    await runAction(
      "update-shipped",
      { action: "update-shipped", orderShippedDate: shippedDate, trackingNo: shippedTracking },
      { fields: ["shippedDate", "tracking"] }
    )
  }

  const handleMarkReady = async () => {
    if (!readyDate) {
      flagInvalid("ready")
      return
    }

    await runAction(
      "mark-ready",
      { action: "mark-ready", readyOn: readyDate },
      { fields: ["ready"] }
    )
  }

  return (
    <section className="grid items-stretch gap-6 lg:grid-cols-2">
      {/* Status timeline */}
      <div className="flex flex-col rounded-[18px] border border-border/70 bg-card p-5 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
        <SectionTitle title="Order Status" />
        <div className="flex flex-1 flex-col justify-between divide-y divide-border/70">
          <TimelineRow
            icon={ShoppingCart}
            label="Order Placed"
            value={status.orderPlacedOn}
            done={Boolean(status.orderPlacedOn)}
          />
          <TimelineRow
            icon={CheckCircle2}
            label="Order Acknowledged"
            value={acknowledged ? status.vendorAcknowledgedOn || "Acknowledged" : ""}
            subtext={
              acknowledged && status.vendorAcknowledgedBy
                ? `by ${status.vendorAcknowledgedBy}`
                : undefined
            }
            done={acknowledged}
          />
          <TimelineRow
            icon={Package}
            label="Packed and Ready"
            value={status.readyOn}
            done={Boolean(status.readyOn)}
          />
          <TimelineRow
            icon={CalendarCheck}
            label="Estimated Ship Date"
            value={status.estArrivalDate}
            done={Boolean(status.estArrivalDate)}
          />
          <TimelineRow
            icon={Truck}
            label="Order Shipped"
            value={status.orderShippedDate}
            subtext={status.trackingNo ? `Tracking: ${status.trackingNo}` : undefined}
            done={Boolean(status.orderShippedDate)}
          />
          <TimelineRow
            icon={PackageCheck}
            label="Received Date"
            value={status.receivedDate}
            done={Boolean(status.receivedDate)}
          />
        </div>
      </div>

      {/* Vendor actions */}
      <div className="flex flex-col gap-5 rounded-[18px] border border-border/70 bg-card p-5 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
        <SectionTitle title="Vendor Actions" />

        {/* Acknowledgement */}
        {acknowledged ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-[14px] font-semibold text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            Order Acknowledged
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAckDialogOpen(true)}
            disabled={pending === "acknowledge" || isLocked}
            className={`${primaryButtonClass} w-full`}
          >
            {pending === "acknowledge" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Acknowledge Order
          </button>
        )}

        {isLocked ? (
          <div className="rounded-xl border border-border/70 bg-muted px-4 py-3 text-[13px] font-medium text-muted-foreground">
            This order is closed and can no longer be modified.
          </div>
        ) : !acknowledged ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400">
            Please acknowledge the order first to enable the actions below.
          </div>
        ) : null}

        {/* Send Invoice */}
        <div>
          <FieldLabel>Invoice No</FieldLabel>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={invoiceNo}
              onChange={(event) => {
                setInvoiceNo(event.target.value)
                clearInvalid("invoice")
                setSendInvoiceError(null)
              }}
              onAnimationEnd={() => stopShake("invoice")}
              placeholder="Enter invoice number"
              disabled={!acknowledged || isLocked || pending === "send-invoice"}
              className={fieldClass("invoice")}
            />
            <button
              type="button"
              onClick={() => void handleSendInvoice()}
              disabled={!acknowledged || isLocked || pending === "send-invoice"}
              className={actionButtonClass}
            >
              {pending === "send-invoice" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Send Invoice
            </button>
          </div>
          {sendInvoiceError ? (
            <p className="mt-2 text-[13px] font-medium text-red-600 dark:text-red-400">{sendInvoiceError}</p>
          ) : null}
        </div>

        {/* Packed & Ready */}
        <div>
          <FieldLabel>Packed &amp; Ready Date</FieldLabel>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={readyDate}
              onChange={(event) => {
                setReadyDate(event.target.value)
                clearInvalid("ready")
              }}
              onAnimationEnd={() => stopShake("ready")}
              disabled={!acknowledged || isLocked || pending === "mark-ready"}
              className={fieldClass("ready", { date: true, value: readyDate })}
            />
            <button
              type="button"
              onClick={() => void handleMarkReady()}
              disabled={!acknowledged || isLocked || pending === "mark-ready"}
              className={actionButtonClass}
            >
              {pending === "mark-ready" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Update
            </button>
          </div>
        </div>

        {/* Estimated Delivery Date — only visible once acknowledged */}
        {acknowledged ? (
          <div>
            <FieldLabel>Est. Ship Date</FieldLabel>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={estDeliveryDate}
                onChange={(event) => {
                  setEstDeliveryDate(event.target.value)
                  clearInvalid("estDelivery")
                }}
                onAnimationEnd={() => stopShake("estDelivery")}
                disabled={isLocked || pending === "update-est-delivery"}
                className={fieldClass("estDelivery", { date: true, value: estDeliveryDate })}
              />
              <button
                type="button"
                onClick={() => void handleUpdateEstDelivery()}
                disabled={isLocked || pending === "update-est-delivery"}
                className={actionButtonClass}
              >
                {pending === "update-est-delivery" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Update
              </button>
            </div>
          </div>
        ) : null}

        {/* Order Shipped Date + Tracking */}
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <FieldLabel>Order Shipped Date</FieldLabel>
              <input
                type="date"
                value={shippedDate}
                onChange={(event) => {
                  setShippedDate(event.target.value)
                  clearInvalid("shippedDate")
                }}
                onAnimationEnd={() => stopShake("shippedDate")}
                disabled={!acknowledged || isLocked || pending === "update-shipped"}
                className={fieldClass("shippedDate", { date: true, value: shippedDate })}
              />
            </div>
            <div className="flex-1">
              <FieldLabel>Tracking No</FieldLabel>
              <input
                type="text"
                value={shippedTracking}
                onChange={(event) => {
                  setShippedTracking(event.target.value)
                  clearInvalid("tracking")
                }}
                onAnimationEnd={() => stopShake("tracking")}
                placeholder="Tracking number"
                disabled={!acknowledged || isLocked || pending === "update-shipped"}
                className={fieldClass("tracking")}
              />
            </div>
            <button
              type="button"
              onClick={() => void handleUpdateShipped()}
              disabled={!acknowledged || isLocked || pending === "update-shipped"}
              className={actionButtonClass}
            >
              {pending === "update-shipped" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Order Shipped
            </button>
          </div>
        </div>
      </div>

      {/* Acknowledgement dialog */}
      {ackDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[18px] border border-border/70 bg-card p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <h4 className="text-[18px] font-semibold tracking-tight text-foreground">
              Acknowledge Order
            </h4>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              Enter the estimated ship date to acknowledge this order.
            </p>

            <div className="mt-4">
              <FieldLabel>Est. Ship Date</FieldLabel>
              <input
                type="date"
                value={ackDate}
                onChange={(event) => {
                  setAckDate(event.target.value)
                  clearInvalid("ackDate")
                }}
                onAnimationEnd={() => stopShake("ackDate")}
                disabled={pending === "acknowledge"}
                className={fieldClass("ackDate", { date: true, value: ackDate })}
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setAckDialogOpen(false)
                  setAckDate("")
                  clearInvalid("ackDate")
                }}
                disabled={pending === "acknowledge"}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border/70 px-6 text-[14px] font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleAcknowledge()}
                disabled={!ackDate || pending === "acknowledge"}
                className={primaryButtonClass}
              >
                {pending === "acknowledge" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Invoice sent confirmation dialog */}
      {invoiceSentOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-[18px] border border-border/70 bg-card p-6 text-center shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="mt-4 text-[18px] font-semibold tracking-tight text-foreground">
              Invoice Sent
            </h4>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              The invoice has been submitted successfully.
            </p>
            <button
              type="button"
              onClick={() => setInvoiceSentOpen(false)}
              className={`${primaryButtonClass} mt-6 w-full`}
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
