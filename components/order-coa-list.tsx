"use client"

import { useState } from "react"
import { FileCheck2, FileText } from "lucide-react"

export type CoaLineItem = {
  itemNo: string
  productName: string
}

export function OrderCoaList({ lineItems }: { lineItems: CoaLineItem[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (lineItems.length === 0) {
    return (
      <p className="rounded-[20px] border border-border/70 bg-muted/40 px-4 py-10 text-center text-[14px] text-muted-foreground">
        No line items were found for this purchase order.
      </p>
    )
  }

  const selected = lineItems[selectedIndex] ?? lineItems[0]

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="flex flex-col overflow-hidden rounded-[20px] border border-border/70 bg-muted/40">
        <div className="border-b border-border/70 px-4 py-4">
          <p className="text-sm font-semibold text-foreground">Items</p>
          <p className="text-xs text-muted-foreground">Select an item to view its COA.</p>
        </div>

        <div className="max-h-[760px] overflow-y-auto p-3 hide-scrollbar">
          <div className="space-y-2">
            {lineItems.map((item, index) => {
              const isActive = index === selectedIndex
              return (
                <button
                  key={`${item.itemNo || "item"}-${index}`}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
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
                        {item.itemNo || "—"}
                      </p>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {item.productName || "—"}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </aside>

      <main className="flex h-full min-h-0 flex-col rounded-[20px] border border-border/70 bg-card p-4 md:p-5">
        <div className="flex flex-col gap-1 pb-4">
          <h3 className="text-[22px] font-semibold tracking-tight text-foreground">
            {selected.itemNo || "—"}
          </h3>
          {selected.productName ? (
            <p className="text-sm text-muted-foreground">{selected.productName}</p>
          ) : null}
        </div>

        <div className="flex min-h-[260px] flex-1 flex-col items-center justify-center gap-4 rounded-[20px] border border-border/70 bg-muted/30 px-6 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground">
            <FileCheck2 className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">No COA uploaded</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Certificates of Analysis will sync from Google Drive.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
