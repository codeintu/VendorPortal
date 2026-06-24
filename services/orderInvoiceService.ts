import {
  getVendorPOByNumber,
  getVendorSummaryByVendorId,
  updateVendorInvoiceNo,
} from "@/services/filemakerService"
import { getOrderDocumentsForVendor } from "@/services/orderDocumentsService"
import { getDriveFileMediaResponse, getDriveFileMetadata } from "@/services/googleDriveService"
import { getInvoiceRecipients, sendEmail } from "@/services/emailService"

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

const isClosedStatus = (status: string) => {
  const value = status.trim().toLowerCase()
  return value === "closed" || value === "voided"
}

const isAcknowledged = (value: string) => {
  const normalized = value.trim().toLowerCase()
  return normalized === "1" || normalized === "yes" || normalized === "true"
}

/**
 * Send the order's invoice document to US Spice via email, then persist the
 * vendor invoice number. Throws on any failure so the caller never reports a
 * false success.
 */
export const sendOrderInvoice = async (
  vendorId: string,
  poNumber: string,
  invoiceNo: string
): Promise<void> => {
  const invoice = invoiceNo.trim()
  if (!invoice) {
    throw new Error("Invoice number is required.")
  }

  const order = await getVendorPOByNumber(vendorId, poNumber)
  if (!order) {
    throw new Error("Order not found for this vendor.")
  }
  if (isClosedStatus(order.status)) {
    throw new Error("This order is closed and can no longer be modified.")
  }
  if (!isAcknowledged(order.vendorAcknowledged)) {
    throw new Error("Please acknowledge the order first.")
  }

  // Locate the uploaded Invoice document for this order.
  const docs = await getOrderDocumentsForVendor(vendorId, poNumber)
  const invoiceDoc = docs?.documents.find((doc) => doc.type === "Invoice")
  if (!invoiceDoc || invoiceDoc.status === "Not uploaded" || !invoiceDoc.fileId) {
    throw new Error("Please upload the Invoice document before sending the invoice.")
  }

  // Download the invoice file from Google Drive to attach it.
  const [media, metadata] = await Promise.all([
    getDriveFileMediaResponse(invoiceDoc.fileId),
    getDriveFileMetadata(invoiceDoc.fileId),
  ])
  if (!media.ok || !media.body) {
    throw new Error("Failed to download the invoice document from Drive.")
  }
  const content = Buffer.from(await media.arrayBuffer())
  const filename = metadata.name || invoiceDoc.fileName || `Invoice-${invoice}.pdf`
  const contentType = metadata.mimeType || invoiceDoc.mimeType || "application/octet-stream"

  // Vendor identity for the From display name and Reply-To.
  const vendor = await getVendorSummaryByVendorId(vendorId)
  const vendorCompany = vendor?.companyName || "Vendor"
  const vendorEmail = vendor?.primaryContactEmail || ""

  const { to, cc } = getInvoiceRecipients()
  if (to.length === 0) {
    throw new Error("No invoice recipient is configured.")
  }

  // Vendor-facing PO number for the email text (the record is still fetched/updated by internal poNumber).
  const poNumberDisplay = order.poNumberDisplay
  const subject = `Invoice ${invoice} — PO ${poNumberDisplay} — ${vendorCompany}`
  const text = [
    "Dear US Spice Mills Team,",
    "",
    `Please find attached invoice ${invoice} for purchase order ${poNumberDisplay}.`,
    "",
    "Please let us know if anything further is required.",
    "",
    "Best regards,",
    vendorCompany,
  ].join("\n")
  const html = [
    "<p>Dear US Spice Mills Team,</p>",
    `<p>Please find attached invoice <strong>${escapeHtml(invoice)}</strong> for purchase order <strong>${escapeHtml(poNumberDisplay)}</strong>.</p>`,
    "<p>Please let us know if anything further is required.</p>",
    `<p>Best regards,<br/>${escapeHtml(vendorCompany)}</p>`,
  ].join("")

  await sendEmail({
    to,
    cc,
    replyTo: vendorEmail || undefined,
    fromName: `${vendorCompany} via USSM Vendor Portal`,
    subject,
    text,
    html,
    attachments: [{ filename, content, contentType }],
  })

  // Persist the invoice number after a successful send. This is best-effort:
  // the email (the actual deliverable) has already gone out, so a transient
  // FileMaker write failure (e.g. "Record is in use by another user") must not
  // fail the whole action.
  try {
    await updateVendorInvoiceNo(vendorId, poNumber, invoice)
  } catch (persistError) {
    console.warn(
      "Invoice email sent, but failed to persist the invoice number to FileMaker:",
      persistError
    )
  }
}
