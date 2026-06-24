import { NextResponse } from "next/server"
import {
  acknowledgeOrder,
  getVendorPORecordByNumber,
  markOrderReady,
  updateEstArrivalDate,
  updateOrderShipped,
} from "@/services/filemakerService"
import { getOrderDocumentsForVendor } from "@/services/orderDocumentsService"
import { sendOrderInvoice } from "@/services/orderInvoiceService"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const action = typeof body.action === "string" ? body.action : ""
    const vendorId = typeof body.vendorId === "string" ? body.vendorId : ""
    const poNumber = typeof body.poNumber === "string" ? body.poNumber : ""

    if (!vendorId || !poNumber) {
      return NextResponse.json(
        { error: "Vendor ID and PO number are required" },
        { status: 400 }
      )
    }

    switch (action) {
      case "acknowledge": {
        const order = await acknowledgeOrder(vendorId, poNumber, body.estArrivalDate)
        return NextResponse.json({ success: true, order }, { status: 200 })
      }

      case "update-est-delivery": {
        const order = await updateEstArrivalDate(vendorId, poNumber, body.estArrivalDate)
        return NextResponse.json({ success: true, order }, { status: 200 })
      }

      case "update-shipped": {
        const order = await updateOrderShipped(
          vendorId,
          poNumber,
          body.orderShippedDate,
          body.trackingNo
        )
        return NextResponse.json({ success: true, order }, { status: 200 })
      }

      case "mark-ready": {
        const order = await markOrderReady(vendorId, poNumber, body.readyOn)
        return NextResponse.json({ success: true, order }, { status: 200 })
      }

      case "send-invoice": {
        const invoiceNo = typeof body.invoiceNo === "string" ? body.invoiceNo : ""

        if (!invoiceNo.trim()) {
          return NextResponse.json(
            { error: "Invoice number is required" },
            { status: 400 }
          )
        }

        // Gate on acknowledgement before the heavier ISF/Drive lookup.
        const found = await getVendorPORecordByNumber(vendorId, poNumber)
        if (!found) {
          return NextResponse.json(
            { error: "Order not found for this vendor." },
            { status: 404 }
          )
        }

        const orderStatus = found.record.status.trim().toLowerCase()
        if (orderStatus === "closed" || orderStatus === "voided") {
          return NextResponse.json(
            { error: "This order is closed and can no longer be modified." },
            { status: 409 }
          )
        }

        const acknowledged = found.record.vendorAcknowledged.trim().toLowerCase()
        if (acknowledged !== "1" && acknowledged !== "yes" && acknowledged !== "true") {
          return NextResponse.json(
            { error: "Please acknowledge the order first." },
            { status: 409 }
          )
        }

        // Require both the ISF and the Invoice documents to exist in the
        // order's document section before the invoice can be sent.
        const docs = await getOrderDocumentsForVendor(vendorId, poNumber)
        const hasDocument = (type: string) => {
          const doc = docs?.documents.find((item) => item.type === type)
          return Boolean(doc && doc.status !== "Not uploaded")
        }

        const missingDocs: string[] = []
        if (!hasDocument("ISF Document")) {
          missingDocs.push("ISF")
        }
        if (!hasDocument("Invoice")) {
          missingDocs.push("Invoice")
        }

        if (missingDocs.length > 0) {
          return NextResponse.json(
            {
              error: `Please upload the ${missingDocs.join(" and ")} document${
                missingDocs.length > 1 ? "s" : ""
              } before sending the invoice.`,
            },
            { status: 400 }
          )
        }

        await sendOrderInvoice(vendorId, poNumber, invoiceNo)
        const order = await getVendorPORecordByNumber(vendorId, poNumber)
        return NextResponse.json(
          { success: true, order: order?.record, message: "Invoice sent" },
          { status: 200 }
        )
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error("Order Actions API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to perform order action" },
      { status: 500 }
    )
  }
}
