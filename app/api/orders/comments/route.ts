import { NextResponse } from "next/server"
import { appendVendorComment } from "@/services/filemakerService"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const vendorId = typeof body.vendorId === "string" ? body.vendorId : ""
    const poNumber = typeof body.poNumber === "string" ? body.poNumber : ""
    const comment = typeof body.comment === "string" ? body.comment : ""

    if (!vendorId || !poNumber) {
      return NextResponse.json(
        { error: "Vendor ID and PO number are required" },
        { status: 400 }
      )
    }

    if (!comment.trim()) {
      return NextResponse.json(
        { error: "Comment text is required" },
        { status: 400 }
      )
    }

    const vendorComments = await appendVendorComment(vendorId, poNumber, comment)

    return NextResponse.json({ success: true, vendorComments }, { status: 200 })
  } catch (error: unknown) {
    console.error("Order Comments API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to post comment" },
      { status: 500 }
    )
  }
}
