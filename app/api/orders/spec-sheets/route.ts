import { NextResponse } from "next/server"
import { getOrderSpecSheets, getVendorPOByNumber } from "@/services/filemakerService"

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

    // Confirm the PO belongs to this vendor before returning its spec sheets.
    const order = await getVendorPOByNumber(vendorId, poNumber)
    if (!order) {
      return NextResponse.json(
        { error: "Order not found for this vendor." },
        { status: 404 }
      )
    }

    const specSheets = await getOrderSpecSheets(poNumber)

    return NextResponse.json({ success: true, specSheets }, { status: 200 })
  } catch (error: unknown) {
    console.error("Order Spec Sheets API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch specification sheets" },
      { status: 500 }
    )
  }
}
