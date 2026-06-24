"use client"

import { useEffect, useMemo, useState } from "react"
import { FileText, Loader2, Printer } from "lucide-react"

type SpecSheetParameter = {
  parameterName: string
  parameterValue: string
  minValue: string
  maxValue: string
  unit: string
  methodReference: string
}

type SpecSheetItem = {
  itemNo: string
  productName: string
  specSheetId: string
  specSheetName: string
  approved: boolean
  parameters: SpecSheetParameter[]
}

type SpecSheetsApiResponse = {
  success: boolean
  specSheets?: SpecSheetItem[]
  error?: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function printSpecSheet(item: SpecSheetItem) {
  const title = item.specSheetName || item.itemNo || "Specification Sheet"
  const rows = item.parameters
    .map(
      (parameter) => `
        <tr>
          <td>${escapeHtml(parameter.parameterName)}</td>
          <td>${escapeHtml(parameter.parameterValue)}</td>
          <td>${escapeHtml(parameter.minValue)}</td>
          <td>${escapeHtml(parameter.maxValue)}</td>
          <td>${escapeHtml(parameter.unit)}</td>
          <td>${escapeHtml(parameter.methodReference)}</td>
        </tr>`
    )
    .join("")

  const printWindow = window.open("", "_blank", "width=900,height=700")
  if (!printWindow) {
    return
  }

  printWindow.document.write(`<!doctype html>
    <html>
      <head>
        <title>Specification Sheet - ${escapeHtml(title)}</title>
        <style>
          * { font-family: Arial, Helvetica, sans-serif; }
          body { margin: 24px; color: #0f172a; }
          h1 { font-size: 18px; margin: 0 0 4px; }
          p.sub { margin: 0 0 16px; color: #64748b; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
          th { text-transform: uppercase; letter-spacing: 0.06em; font-size: 11px; color: #64748b; }
          td:first-child { font-weight: 700; }
        </style>
      </head>
      <body>
        <h1>Specification Sheet</h1>
        <p class="sub">${escapeHtml(title)}${item.productName ? ` — ${escapeHtml(item.productName)}` : ""}</p>
        <table>
          <thead>
            <tr>
              <th>Analyte</th>
              <th>Result</th>
              <th>Min. Value</th>
              <th>Max. Value</th>
              <th>Units</th>
              <th>Method Reference</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>`)

  printWindow.document.close()
  printWindow.focus()
  // Close the print window once the print/save dialog is dismissed so it does
  // not linger as a blank about:blank tab.
  printWindow.onafterprint = () => printWindow.close()
  printWindow.print()
}

function MessageBox({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "error" }) {
  return (
    <div className="flex h-full min-h-[260px] w-full items-center justify-center rounded-[20px] border border-border/70 bg-muted/30 px-6 py-10 text-center">
      <p className={`text-sm ${tone === "error" ? "text-destructive" : "text-muted-foreground"}`}>{children}</p>
    </div>
  )
}

export function OrderSpecSheets({
  vendorId,
  poNumber,
}: {
  vendorId: string | null
  poNumber: string
}) {
  const [items, setItems] = useState<SpecSheetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!vendorId || !poNumber) {
      return
    }

    let isActive = true

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({ vendorId, poNumber })
        const response = await fetch(`/api/orders/spec-sheets?${params.toString()}`)
        const data = (await response.json()) as SpecSheetsApiResponse

        if (!isActive) {
          return
        }

        if (response.ok && data.success) {
          setItems(Array.isArray(data.specSheets) ? data.specSheets : [])
          return
        }

        setError(data.error || "Failed to load specification sheets")
      } catch (loadError) {
        if (!isActive) {
          return
        }
        setError("An unexpected error occurred")
        console.error(loadError)
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [vendorId, poNumber])

  const sheets = useMemo(() => items.filter((item) => item.specSheetId), [items])

  // Auto-select the first spec sheet (and keep a valid selection if the list changes).
  useEffect(() => {
    if (sheets.length === 0) {
      setSelectedId(null)
      return
    }

    setSelectedId((current) =>
      current && sheets.some((sheet) => sheet.specSheetId === current)
        ? current
        : sheets[0].specSheetId
    )
  }, [sheets])

  const selected = sheets.find((sheet) => sheet.specSheetId === selectedId) ?? null

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-[20px] border border-border/70 bg-muted/40 px-4 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-[14px]">Loading specification sheets...</span>
      </div>
    )
  }

  if (error) {
    return (
      <p className="rounded-[20px] border border-border/70 bg-muted/40 px-4 py-10 text-center text-[14px] text-destructive">
        {error}
      </p>
    )
  }

  if (sheets.length === 0) {
    return (
      <p className="rounded-[20px] border border-border/70 bg-muted/40 px-4 py-10 text-center text-[14px] text-muted-foreground">
        No specification sheets are available for this order.
      </p>
    )
  }

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="flex flex-col overflow-hidden rounded-[20px] border border-border/70 bg-muted/40">
        <div className="border-b border-border/70 px-4 py-4">
          <p className="text-sm font-semibold text-foreground">Specification Sheets</p>
          <p className="text-xs text-muted-foreground">Select an item to view its spec sheet.</p>
        </div>

        <div className="max-h-[760px] overflow-y-auto p-3 hide-scrollbar">
          <div className="space-y-2">
            {sheets.map((sheet) => {
              const isActive = sheet.specSheetId === selectedId
              return (
                <button
                  key={sheet.specSheetId}
                  type="button"
                  onClick={() => setSelectedId(sheet.specSheetId)}
                  className={`flex w-full items-center justify-between gap-3 rounded-[16px] border px-4 py-3 text-left transition-colors ${
                    isActive
                      ? "border-primary bg-primary/10 shadow-[0_10px_24px_rgba(181,74,74,0.12)]"
                      : "border-border/70 bg-card hover:bg-muted/40"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <FileText
                        className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/60"}`}
                      />
                      <p className="truncate text-sm font-semibold text-foreground">
                        {sheet.specSheetName || sheet.itemNo || "Specification Sheet"}
                      </p>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {sheet.productName || sheet.itemNo}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </aside>

      <main className="flex h-full min-h-0 flex-col rounded-[20px] border border-border/70 bg-card p-4 md:p-5">
        {selected ? (
          <>
            <div className="flex flex-col gap-3 pb-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-[22px] font-semibold tracking-tight text-foreground">
                    {selected.specSheetName || selected.itemNo}
                  </h3>
                </div>
                {selected.productName ? (
                  <p className="text-sm text-muted-foreground">{selected.productName}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => printSpecSheet(selected)}
                disabled={selected.parameters.length === 0}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(181,74,74,0.18)] transition-colors hover:bg-[#d36a6a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto rounded-[20px] border border-border/70 bg-muted/20">
              {selected.parameters.length === 0 ? (
                <p className="py-12 text-center text-[14px] text-muted-foreground">
                  No quality parameters were found for this specification sheet.
                </p>
              ) : (
                <table className="w-full min-w-[640px] text-left">
                  <thead className="border-b border-border/70 bg-muted/40 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Analyte</th>
                      <th className="px-4 py-3">Result</th>
                      <th className="px-4 py-3">Min. Value</th>
                      <th className="px-4 py-3">Max. Value</th>
                      <th className="px-4 py-3">Units</th>
                      <th className="px-4 py-3">Method Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {selected.parameters.map((parameter, index) => (
                      <tr key={`${parameter.parameterName}-${index}`}>
                        <td className="px-4 py-3 text-[14px] font-bold text-foreground">
                          {parameter.parameterName || "—"}
                        </td>
                        <td className="px-4 py-3 text-[14px] font-semibold text-foreground">
                          {parameter.parameterValue || "—"}
                        </td>
                        <td className="px-4 py-3 text-[14px] text-muted-foreground">
                          {parameter.minValue || "—"}
                        </td>
                        <td className="px-4 py-3 text-[14px] text-muted-foreground">
                          {parameter.maxValue || "—"}
                        </td>
                        <td className="px-4 py-3 text-[14px] font-semibold text-foreground">
                          {parameter.unit || "—"}
                        </td>
                        <td className="px-4 py-3 text-[14px] text-muted-foreground">
                          {parameter.methodReference || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <MessageBox>Select a specification sheet to view its details.</MessageBox>
        )}
      </main>
    </div>
  )
}
