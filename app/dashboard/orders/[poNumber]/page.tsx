"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader2, LucideIcon, Package, Truck, Building2 } from "lucide-react"
import { useDashboardData } from "../../dashboard-data-context"
import { OrderDocumentsPanel } from "@/components/order-documents-panel"

type OrderDetails = {
  header: {
    poNumber: string
    orderPlacedBy: string
    dateEntered: string
    deliveredVia: string
    dateScheduled: string
    dateReceived: string
    freightType: string
    freightOnBoard: string
    vendorContractNumber: string
    shippingTo: string
    category: string
    paidType: string
    prePaidPercent: string
    companyName: string
    personName: string
    address: string
    mainPhone: string
    secondPhone: string
    paymentDate: string
    totalAmount: string
    status: string
  }
  lineItems: Array<{
    itemNo: string
    productName: string
    unitType: string
    actualPurchQty: string
    qtyReceived: string
    invoicedAmount: string
    serialNo: string
  }>
}

type DetailField = {
  label: string
  value: string
}

const EMPTY_VALUE = "--"

function formatCurrency(value: string) {
  const numericValue = Number.parseFloat(value.replace(/[^0-9.-]/g, ""))

  if (Number.isFinite(numericValue)) {
    return `$${numericValue.toFixed(2)}`
  }

  return value ? `$${value}` : EMPTY_VALUE
}

function DetailRow({ label, value }: DetailField) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="max-w-[60%] text-right text-[16px] font-semibold leading-snug text-foreground">
        {value || EMPTY_VALUE}
      </p>
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-8 w-1 rounded-full bg-primary" />
      <h3 className="text-[18px] font-semibold tracking-tight text-foreground">{title}</h3>
    </div>
  )
}

function SummaryCard({
  title,
  icon: Icon,
  fields,
}: {
  title: string
  icon: LucideIcon
  fields: DetailField[]
}) {
  return (
    <div className="rounded-[18px] border border-border/70 bg-card p-5 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <SectionTitle title={title} />
      </div>
      <div className="divide-y divide-border/70">
        {fields.map((field) => (
          <DetailRow key={field.label} label={field.label} value={field.value} />
        ))}
      </div>
    </div>
  )
}

function getLineItemKey(
  item: OrderDetails["lineItems"][number],
  index: number
) {
  return [
    item.itemNo || "no-item",
    item.productName || "no-product",
    item.unitType || "no-unit",
    item.serialNo || "no-serial",
    item.actualPurchQty || "no-qty",
    item.invoicedAmount || "no-amount",
    String(index),
  ].join("|")
}

export default function OrderDetailsPage() {
  const params = useParams<{ poNumber: string }>()
  const poNumber = typeof params.poNumber === "string" ? decodeURIComponent(params.poNumber) : ""
  const { vendorId } = useDashboardData()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!vendorId || !poNumber) {
      return
    }

    let isActive = true

    const loadOrder = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(
          `/api/orders/details?vendorId=${encodeURIComponent(vendorId)}&poNumber=${encodeURIComponent(poNumber)}`
        )
        const data = await response.json()

        if (!isActive) {
          return
        }

        if (response.ok && data.success) {
          setOrder(data.order as OrderDetails)
          return
        }

        setOrder(null)
        setError(data.error || "Failed to load order details")
      } catch (fetchError) {
        if (!isActive) {
          return
        }

        setOrder(null)
        setError("An unexpected error occurred")
        console.error(fetchError)
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadOrder()

    return () => {
      isActive = false
    }
  }, [vendorId, poNumber])

  const getStatusClassName = (status?: string | null) => {
    switch ((status || "").trim().toLowerCase()) {
      case "open":
        return "border-2 border-blue-300 bg-blue-50 text-blue-700 dark:border-[#63a3ff]/60 dark:bg-transparent dark:text-[#63a3ff]"
      case "ap pending":
        return "border-2 border-amber-300 bg-amber-50 text-amber-700 dark:border-[#ffb020]/60 dark:bg-transparent dark:text-[#ffb020]"
      case "closed":
        return "border-2 border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-[#34d399]/60 dark:bg-transparent dark:text-[#34d399]"
      case "voided":
        return "border-2 border-rose-300 bg-rose-50 text-rose-700 dark:border-[#ff7a7a]/60 dark:bg-transparent dark:text-[#ff7a7a]"
      default:
        return "border-2 border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-transparent dark:text-slate-400"
    }
  }

  if (isLoading && !order) {
    return (
      <section className="rounded-[24px] border border-border/70 bg-card p-8 text-center shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </section>
    )
  }

  if (error || !order) {
    return (
      <section className="rounded-[24px] border border-border/70 bg-card p-8 text-center shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
        <p className="font-medium text-destructive">{error || "Order details not found."}</p>
        <Link
          href="/dashboard/orders"
          className="mt-4 inline-flex items-center gap-2 text-sm text-primary underline hover:text-[#d36a6a]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
      </section>
    )
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to orders
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-[34px] font-bold tracking-tight text-foreground md:text-[42px]">
              Order #{order.header.poNumber}
            </h1>
            <span
              className={`inline-flex items-center rounded-full border px-4 py-1 text-[13px] font-semibold ${getStatusClassName(
                order.header.status
              )}`}
            >
              {order.header.status || EMPTY_VALUE}
            </span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
            Order Amount
          </p>
          <p className="mt-1 text-[32px] font-bold tracking-tight text-foreground md:text-[38px]">
            {order.header.totalAmount ? formatCurrency(order.header.totalAmount) : EMPTY_VALUE}
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <SummaryCard
          title="Order Details"
          icon={Package}
          fields={[
            { label: "Placed By", value: order.header.orderPlacedBy },
            { label: "Freight Type", value: order.header.freightType },
            { label: "FOB Point", value: order.header.freightOnBoard },
            { label: "Category", value: order.header.category },
          ]}
        />

        <SummaryCard
          title="Shipping & Delivery"
          icon={Truck}
          fields={[
            { label: "Est. Ship Date", value: order.header.dateScheduled },
            { label: "Method", value: order.header.deliveredVia },
            { label: "Contract Ref.", value: order.header.vendorContractNumber },
            { label: "Payment Date", value: order.header.paymentDate },
          ]}
        />

        <SummaryCard
          title="Shipment Origin"
          icon={Building2}
          fields={[
            { label: "Company Name", value: order.header.companyName },
            { label: "Person Name", value: order.header.personName },
            { label: "Address", value: order.header.address },
            { label: "Main Phone", value: order.header.mainPhone },
          ]}
        />
      </section>

      <section className="overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-[0_18px_36px_rgba(0,0,0,0.22)]">
        <div className="border-b border-border/70 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="h-8 w-1 rounded-full bg-primary" />
            <h2 className="text-[18px] font-semibold tracking-tight text-foreground">
              Line Items
            </h2>
          </div>
        </div>

        <div className="overflow-hidden hide-scrollbar">
          <table className="w-full min-w-[980px] text-left">
            <thead className="border-y border-border/70 bg-muted text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              <tr>
                <th className="px-5 py-4 md:px-7">ITEM NO</th>
                <th className="px-5 py-4">PRODUCT NAME</th>
                <th className="px-5 py-4">UNIT TYPE</th>
                <th className="px-5 py-4">ACTUAL PURCH QTY</th>
                <th className="px-5 py-4">QTY RECEIVED</th>
                <th className="px-5 py-4">INVOICED AMOUNT</th>
                <th className="px-5 py-4 md:px-7">SERIAL NO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {order.lineItems.length === 0 ? (
                <tr>
                  <td className="px-5 py-16 text-center text-muted-foreground" colSpan={7}>
                    No line items were found for this purchase order.
                  </td>
                </tr>
              ) : (
                order.lineItems.map((item, index) => (
                  <tr key={getLineItemKey(item, index)} className="transition-colors hover:bg-muted/70">
                    <td className="px-5 py-5 text-sm font-bold text-primary md:px-7">
                      {item.itemNo || EMPTY_VALUE}
                    </td>
                    <td className="px-5 py-5 text-sm font-semibold text-foreground">
                      {item.productName || EMPTY_VALUE}
                    </td>
                    <td className="px-5 py-5 text-sm text-muted-foreground">
                      {item.unitType || EMPTY_VALUE}
                    </td>
                    <td className="px-5 py-5 text-sm text-foreground">
                      {item.actualPurchQty || EMPTY_VALUE}
                    </td>
                    <td className="px-5 py-5 text-sm text-foreground">
                      {item.qtyReceived || EMPTY_VALUE}
                    </td>
                    <td className="px-5 py-5 text-sm font-semibold text-foreground">
                      {item.invoicedAmount || EMPTY_VALUE}
                    </td>
                    <td className="px-5 py-5 text-sm text-muted-foreground md:px-7">
                      {item.serialNo || EMPTY_VALUE}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <OrderDocumentsPanel vendorId={vendorId} poNumber={poNumber} />
    </div>
  )
}
