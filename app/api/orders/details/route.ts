import { NextResponse } from "next/server"
import { getPurchaseOrderDetails } from "@/services/filemakerService"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get("vendorId")
    const poNumber = searchParams.get("poNumber")

    if (!vendorId || !poNumber) {
      return NextResponse.json(
        { error: "Vendor ID and PO number are required" },
        { status: 400 }
      )
    }

    const order = await getPurchaseOrderDetails(vendorId, poNumber)

    if (!order) {
      return NextResponse.json(
        { error: "Order details not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, order }, { status: 200 })
  } catch (error: unknown) {
    console.error("Order Details API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch order details" },
      { status: 500 }
    )
  }
}
