import {
  DOCUMENT_TYPE_LABEL_CHOICES,
  DOCUMENT_TYPE_BY_LABEL_CHOICE_ID,
  type DefaultDocumentType,
} from "@/config/orderDocuments"
import { getGoogleDriveDocumentTypeLabelConfig } from "@/config/googleDriveLabels"
import {
  applyDriveDocumentTypeLabel,
  deleteDriveFile,
  type DriveFileAppliedLabel,
  type DriveFileMetadata,
  getDriveRootFolderId,
  listDriveFilesInFolder,
  listDriveLabelsForFile,
  resolveDriveFolderByName,
  resolveDriveFolderChain,
  uploadDriveFileToFolder,
} from "@/services/googleDriveService"
import {
  getPurchaseOrderDetails,
  getVendorSummaryByVendorId,
} from "@/services/filemakerService"

export type UploadOrderDocumentInput = {
  vendorId: string
  poNumber: string
  documentType: string
  file: File
}

export type UploadOrderDocumentResult = {
  fileId: string
  fileName: string
  documentType: DefaultDocumentType
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

const deriveYearFromDateEntered = (dateEntered: string) => {
  const parsed = new Date(dateEntered)

  if (!Number.isNaN(parsed.getTime())) {
    return String(parsed.getFullYear())
  }

  const fallbackMatch = dateEntered.match(/(\d{4})/)
  return fallbackMatch?.[1] ?? String(new Date().getFullYear())
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

const getSelectedDocumentTypeChoiceIds = (
  labels: DriveFileAppliedLabel[],
  labelId: string,
  fieldId: string
) => {
  const matchingLabel = labels.find((label) => normalizeFieldValue(label.id) === labelId)
  const field = matchingLabel?.fields?.[fieldId]

  return (field?.selection ?? []).map((value) => normalizeFieldValue(value)).filter(Boolean)
}

const findFilesForDocumentType = async (
  files: DriveFileMetadata[],
  documentType: DefaultDocumentType,
  labelId: string,
  fieldId: string
) => {
  const filesWithLabels = await Promise.all(
    files.map(async (file) => ({
      file,
      labels: await listDriveLabelsForFile(file.id),
    }))
  )

  return filesWithLabels
    .filter(({ labels }) => {
      const selectedChoiceIds = getSelectedDocumentTypeChoiceIds(labels, labelId, fieldId)
      return selectedChoiceIds.some(
        (choiceId) => DOCUMENT_TYPE_BY_LABEL_CHOICE_ID[choiceId] === documentType
      )
    })
    .map(({ file }) => file)
}

export const uploadOrderDocument = async (
  input: UploadOrderDocumentInput
): Promise<UploadOrderDocumentResult> => {
  const documentType = normalizeFieldValue(input.documentType) as DefaultDocumentType
  const choiceId = DOCUMENT_TYPE_LABEL_CHOICES[documentType]

  if (!choiceId) {
    throw new Error(`Unsupported document type: ${input.documentType}`)
  }

  const [vendorSummary, order] = await Promise.all([
    getVendorSummaryByVendorId(input.vendorId),
    getPurchaseOrderDetails(input.vendorId, input.poNumber),
  ])

  if (!vendorSummary || !order?.header) {
    throw new Error("Unable to resolve vendor or order information for upload")
  }

  const year = deriveYearFromDateEntered(order.header.dateEntered)
  const rootFolderId = getDriveRootFolderId()
  let vendorFolderId = normalizeFieldValue(vendorSummary.driveFolderId)

  if (!vendorFolderId && rootFolderId) {
    const resolvedVendorFolder = await resolveDriveFolderByName(rootFolderId, vendorSummary.companyName)
    vendorFolderId = resolvedVendorFolder?.id || ""
  }

  if (!vendorFolderId) {
    throw new Error("Unable to resolve the vendor Drive folder")
  }

  const poVrFolderId = await resolveDriveFolderChain(vendorFolderId, [`PO VR ${year}`])

  if (!poVrFolderId) {
    throw new Error(`Unable to resolve PO VR folder for year ${year}`)
  }

  const poFolderId = await resolveDriveFolderChain(poVrFolderId, [`PO ${input.poNumber}`])

  if (!poFolderId) {
    throw new Error(`Unable to resolve PO folder for order ${input.poNumber}`)
  }

  const docsFolderId = await resolveDriveFolderChain(poFolderId, ["Docs"])

  if (!docsFolderId) {
    throw new Error(`Unable to resolve Docs folder for order ${input.poNumber}`)
  }

  const fileBytes = await input.file.arrayBuffer()
  const mimeType = input.file.type || "application/octet-stream"
  const fileName = input.file.name || `${documentType}-${Date.now()}`
  const { labelId, fieldId } = getGoogleDriveDocumentTypeLabelConfig()
  const existingFiles = await findFilesForDocumentType(
    await listDriveFilesInFolder(docsFolderId),
    documentType,
    labelId,
    fieldId
  )

  if (existingFiles.some((file) => isApproved(file))) {
    throw new Error("Approved documents are locked and cannot be replaced")
  }

  const uploadedFile = await uploadDriveFileToFolder({
    folderId: docsFolderId,
    fileName,
    mimeType,
    fileBytes,
    appProperties: {
      PortalVendorId: input.vendorId,
      PONumber: input.poNumber,
      DocumentType: documentType,
      DocumentTypeChoiceId: choiceId,
    },
    properties: {
      ImportDocName: documentType,
      IsApproved: "0",
    },
  })

  try {
    await applyDriveDocumentTypeLabel({
      fileId: uploadedFile.id,
      labelId,
      fieldId,
      choiceId,
    })
  } catch (error) {
    try {
      await deleteDriveFile(uploadedFile.id)
    } catch (cleanupError) {
      console.error("Failed to cleanup uploaded file after label error:", cleanupError)
    }

    throw error
  }

  await Promise.all(
    existingFiles.map(async (file) => {
      try {
        await deleteDriveFile(file.id)
      } catch (error) {
        console.error(`Failed to remove replaced document ${file.id}:`, error)
      }
    })
  )

  return {
    fileId: uploadedFile.id,
    fileName: uploadedFile.name,
    documentType,
  }
}
