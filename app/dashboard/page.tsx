"use client"

import { ArrowUpRight, FileText, Package, ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useDashboardData } from "./dashboard-data-context"
import DashboardLoadingSkeleton from "./dashboard-loading-skeleton"

const EMPTY_VALUE = "--"

export default function DashboardPage() {
  const { summary, summaryLoading, summaryError } = useDashboardData()
  const router = useRouter()
  const [salesView, setSalesView] = useState<"monthly" | "yearly">("monthly")
  const error = summaryError
  const isLoading = summaryLoading

  const metrics = [
    {
      label: "Active Orders",
      value: String(summary?.counts.activeOrders ?? 0),
      detail: "Open vendor orders",
      icon: ShoppingCart,
      iconClassName: "bg-primary/10 text-primary",
      detailClassName: "text-emerald-600 dark:text-emerald-400",
      trending: true,
    },
    {
      label: "Pending Invoices",
      value: String(summary?.counts.pendingInvoices ?? 0),
      detail: "Awaiting payment",
      icon: FileText,
      iconClassName: "bg-amber-500/10 text-amber-600 dark:text-[#ffb020]",
      detailClassName: "text-muted-foreground",
      trending: false,
    },
    {
      label: "Closed Orders",
      value: String(summary?.counts.closedOrders ?? 0),
      detail: "Completed deliveries",
      icon: Package,
      iconClassName: "bg-sky-500/10 text-sky-600 dark:text-[#4f8df7]",
      detailClassName: "text-muted-foreground",
      trending: false,
    },
  ]

  const recentOrders = summary?.recentOrders ?? []
  const salesData = summary?.sales[salesView] ?? []
  const totalSales = salesData.reduce((total, point) => total + point.total, 0)

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

  if (isLoading && !summary) {
    return <DashboardLoadingSkeleton />
  }

  return (
    <>
      <section className="space-y-2">
        <h1 className="text-[30px] font-bold tracking-tight text-foreground md:text-[38px]">
          Welcome back!
        </h1>
        <p className="max-w-2xl text-[15px] text-muted-foreground md:text-base">
          Here&apos;s what&apos;s happening with your vendor account today.
        </p>
      </section>

      {error ? (
        <section className="rounded-[24px] border border-border/70 bg-card p-8 text-center shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
          <p className="font-medium text-[#ff7a7a]">{error}</p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-3">
            {metrics.map(
              ({
                label,
                value,
                detail,
                icon: Icon,
                iconClassName,
                detailClassName,
                trending,
              }) => (
                <article
                  key={label}
                  className="rounded-[24px] border border-border/70 bg-card p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
                >
                  <div className="mb-7 flex items-start justify-between gap-6">
                    <p className="text-base font-medium text-muted-foreground">{label}</p>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-[18px] ${iconClassName}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-[34px] font-bold tracking-tight text-foreground">{value}</span>
                    <span
                      className={`flex items-center gap-1 text-[15px] font-semibold ${detailClassName}`}
                    >
                      {trending ? <ArrowUpRight className="h-3.5 w-3.5" /> : null}
                      {detail}
                    </span>
                  </div>
                </article>
              )
            )}
          </section>

          <section className="rounded-[24px] border border-border/70 bg-card p-5 shadow-[0_18px_40px_rgba(0,0,0,0.16)] md:p-7">
            <div className="mb-7 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">
                  Sales Overview
                </p>
                <h2 className="text-[28px] font-bold tracking-tight text-foreground">
                  {formatCurrency(totalSales)}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Total PO value shown for the selected {salesView} view.
                </p>
              </div>

              <div className="flex w-fit rounded-full bg-muted p-1">
                {(["monthly", "yearly"] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setSalesView(view)}
                    className={
                      salesView === view
                        ? "rounded-full bg-card px-4 py-2 text-sm font-bold text-primary shadow-sm"
                        : "rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                    }
                  >
                    {view === "monthly" ? "Monthly" : "Yearly"}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[320px] rounded-[22px] border border-border/70 bg-background/45 p-4">
              {salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData} margin={{ top: 12, right: 18, left: 4, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontWeight: 600 }}
                      tickFormatter={(value) => compactCurrency(Number(value))}
                      width={72}
                    />
                    <Tooltip
                      cursor={{ stroke: "var(--primary)", strokeDasharray: "4 4" }}
                      formatter={(value) => [formatCurrency(Number(value)), "Sales"]}
                      labelClassName="font-bold text-foreground"
                      contentStyle={{
                        borderRadius: 16,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="var(--primary)"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "var(--primary)", strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "var(--primary)", stroke: "var(--card)", strokeWidth: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                  No sales data found yet.
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-[19px] font-bold tracking-tight text-foreground">
                Recent Orders
              </h2>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
              <div className="overflow-x-hidden">
                <table className="w-full min-w-[1200px] text-left">
                  <thead className="border-b border-border/70 bg-muted text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                    <tr>
                      <th className="px-5 py-4 md:px-7">PO NUMBER</th>
                      <th className="px-5 py-4">DATE ENTERED</th>
                      <th className="px-5 py-4">EST. SHIP DATE</th>
                      <th className="px-5 py-4">DATE RECEIVED</th>
                      <th className="px-5 py-4">PAYMENT DATE</th>
                      <th className="px-5 py-4">TOTAL AMOUNT</th>
                      <th className="px-5 py-4 md:px-7">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {recentOrders.map((order, index) => {
                      const rowKey = order.poNumber || `${order.dateEntered}-${index}`
                      const orderHref = order.poNumber
                        ? `/dashboard/orders/${encodeURIComponent(order.poNumber)}`
                        : null

                      return (
                        <tr
                          key={rowKey}
                          className={`${orderHref ? "cursor-pointer" : ""} transition-colors hover:bg-muted/70`}
                          role={orderHref ? "link" : undefined}
                          tabIndex={orderHref ? 0 : undefined}
                          onClick={() => {
                            if (orderHref) {
                              router.push(orderHref)
                            }
                          }}
                          onKeyDown={(event) => {
                            if (orderHref && (event.key === "Enter" || event.key === " ")) {
                              event.preventDefault()
                              router.push(orderHref)
                            }
                          }}
                        >
                          <td className="px-5 py-5 text-[16px] font-bold text-primary md:px-7">
                            {order.poNumber || EMPTY_VALUE}
                          </td>
                          <td className="px-5 py-5 text-[15px] text-foreground">
                            {order.dateEntered || EMPTY_VALUE}
                          </td>
                          <td className="px-5 py-5 text-[15px] text-muted-foreground whitespace-nowrap">
                            {order.dateScheduled || EMPTY_VALUE}
                          </td>
                          <td className="px-5 py-5 text-[15px] text-muted-foreground whitespace-nowrap">
                            {order.dateReceived || EMPTY_VALUE}
                          </td>
                          <td className="px-5 py-5 text-[15px] text-muted-foreground whitespace-nowrap">
                            {order.paymentDate || EMPTY_VALUE}
                          </td>
                          <td className="px-5 py-5 text-[16px] font-bold text-foreground whitespace-nowrap">
                            {order.totalAmount || EMPTY_VALUE}
                          </td>
                          <td className="px-5 py-5 md:px-7">
                            <span
                              className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${getStatusClassName(order.status)}`}
                            >
                              {order.status || EMPTY_VALUE}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                    {recentOrders.length === 0 ? (
                      <tr>
                        <td className="px-5 py-16 text-center text-muted-foreground" colSpan={7}>
                          No recent orders found.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

function compactCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}
