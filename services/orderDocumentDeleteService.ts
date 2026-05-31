import {
  deleteDriveFile,
  getDriveFileMetadata,
} from "@/services/googleDriveService"

type DeleteOrderDocumentInput = {
  vendorId: string
  poNumber: string
  fileId: string
}

const normalizeFieldValue = (value: unknown) => {
  if (typeof value === "string") {
    return value.trim()
  }

  if (value === null || value === undefined) {
    return ""
  }

  return String(value).trim()
}

const getDriveProperty = (
  record: {
    properties?: Record<string, string | undefined>
    appProperties?: Record<string, string | undefined>
  },
  key: string
) => {
  return normalizeFieldValue(record.appProperties?.[key] ?? record.properties?.[key])
}

const isApproved = (
  record: {
    properties?: Record<string, string | undefined>
    appProperties?: Record<string, string | undefined>
  }
) => {
  const value = getDriveProperty(record, "IsApproved").toLowerCase()
  return value === "1" || value === "true" || value === "yes"
}

export const deleteOrderDocument = async ({
  vendorId,
  poNumber,
  fileId,
}: DeleteOrderDocumentInput) => {
  const file = await getDriveFileMetadata(fileId)
  const fileVendorId = getDriveProperty(file, "PortalVendorId")
  const filePoNumber = getDriveProperty(file, "PONumber")

  if (fileVendorId && fileVendorId !== vendorId) {
    throw new Error("Document does not belong to this vendor")
  }

  if (filePoNumber && filePoNumber !== poNumber) {
    throw new Error("Document does not belong to this order")
  }

  if (isApproved(file)) {
    throw new Error("Approved documents are locked and cannot be deleted")
  }

  await deleteDriveFile(fileId)
}
