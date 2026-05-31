import {
  DEFAULT_DOCUMENT_TYPES,
  DOCUMENT_TYPE_BY_LABEL_CHOICE_ID,
} from "@/config/orderDocuments"
import { getGoogleDriveDocumentTypeLabelConfig } from "@/config/googleDriveLabels"
import {
  type DriveFileAppliedLabel,
  type DriveFileMetadata,
  getDriveRootFolderId,
  listDriveFilesInFolder,
  listDriveLabelsForFile,
  resolveDriveFolderByName,
  resolveDriveFolderChain,
} from "@/services/googleDriveService"
import {
  getPurchaseOrderDetails,
  getVendorSummaryByVendorId,
} from "@/services/filemakerService"

export type OrderDocumentStatus = "Synced" | "Approved" | "Rejected"

export type OrderDocumentItem = {
  type: string
  fileId: string | null
  fileName: string | null
  mimeType: string | null
  previewUrl: string | null
  status: OrderDocumentStatus | "Not uploaded"
  locked: boolean
  importDocName: string | null
  isApproved: string | null
}

export type OrderDocumentsResponse = {
  vendor: {
    vendorId: string
    companyName: string
    driveFolderId: string
  }
  order: {
    poNumber: string
    dateEntered: string
    year: string
  }
  folders: {
    vendorFolderId: string
    poVrFolderId: string | null
    poFolderId: string | null
    docsFolderId: string | null
  }
  documents: OrderDocumentItem[]
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

const getDriveProperty = (record: { properties?: Record<string, string | undefined>; appProperties?: Record<string, string | undefined> }, key: string) => {
  return normalizeFieldValue(record.appProperties?.[key] ?? record.properties?.[key])
}

const isApproved = (record: { properties?: Record<string, string | undefined>; appProperties?: Record<string, string | undefined> }) => {
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

const deriveYearFromDateEntered = (dateEntered: string) => {
  const parsed = new Date(dateEntered)

  if (!Number.isNaN(parsed.getTime())) {
    return String(parsed.getFullYear())
  }

  const fallbackMatch = dateEntered.match(/(\d{4})/)
  return fallbackMatch?.[1] ?? String(new Date().getFullYear())
}

const buildDocumentTypeMap = async (files: DriveFileMetadata[]) => {
  const { labelId, fieldId } = getGoogleDriveDocumentTypeLabelConfig()

  const filesWithLabels = await Promise.all(
    files.map(async (file) => ({
      file,
      labels: await listDriveLabelsForFile(file.id),
    }))
  )

  const mapped = new Map<string, DriveFileMetadata>()

  for (const { file, labels } of filesWithLabels) {
    const selectedChoiceIds = getSelectedDocumentTypeChoiceIds(labels, labelId, fieldId)
    const documentType = selectedChoiceIds
      .map((choiceId) => DOCUMENT_TYPE_BY_LABEL_CHOICE_ID[choiceId] ?? "")
      .find(Boolean)

    if (!documentType || mapped.has(documentType)) {
      continue
    }

    mapped.set(documentType, file)
  }

  return mapped
}

export const getOrderDocumentsForVendor = async (vendorId: string, poNumber: string): Promise<OrderDocumentsResponse | null> => {
  const [vendorSummary, order] = await Promise.all([
    getVendorSummaryByVendorId(vendorId),
    getPurchaseOrderDetails(vendorId, poNumber),
  ])

  if (!vendorSummary || !order?.header) {
    return null
  }

  const year = deriveYearFromDateEntered(order.header.dateEntered)
  const rootFolderId = getDriveRootFolderId()
  let vendorFolderId = normalizeFieldValue(vendorSummary.driveFolderId)

  if (!vendorFolderId && rootFolderId) {
    const resolvedVendorFolder = await resolveDriveFolderByName(rootFolderId, vendorSummary.companyName)
    vendorFolderId = resolvedVendorFolder?.id || ""
  }

  const poVrFolderName = `PO VR ${year}`
  const poFolderName = `PO ${poNumber}`

  let poVrFolderId: string | null = null
  let poFolderId: string | null = null
  let docsFolderId: string | null = null
  let files: Awaited<ReturnType<typeof listDriveFilesInFolder>> = []

  if (vendorFolderId) {
    poVrFolderId = await resolveDriveFolderChain(vendorFolderId, [poVrFolderName])

    if (poVrFolderId) {
      poFolderId = await resolveDriveFolderChain(poVrFolderId, [poFolderName])

      if (poFolderId) {
        docsFolderId = await resolveDriveFolderChain(poFolderId, ["Docs"])

        if (docsFolderId) {
          files = await listDriveFilesInFolder(docsFolderId)
        }
      }
    }
  }

  const fileMap = await buildDocumentTypeMap(files)
  const defaultDocumentTypes = [...DEFAULT_DOCUMENT_TYPES]
  const customDocumentTypes = [...fileMap.keys()].filter(
    (documentType) => !defaultDocumentTypes.includes(documentType as (typeof DEFAULT_DOCUMENT_TYPES)[number])
  )
  const allDocumentTypes = [...defaultDocumentTypes, ...customDocumentTypes]

  const documents = allDocumentTypes.map((type) => {
    const file = fileMap.get(type)

    if (!file) {
      return {
        type,
        fileId: null,
        fileName: null,
        mimeType: null,
        previewUrl: null,
        status: "Not uploaded" as const,
        locked: false,
        importDocName: null,
        isApproved: null,
      }
    }

    const approved = isApproved(file)
    const status: OrderDocumentStatus = approved ? "Approved" : "Synced"

    return {
      type,
      fileId: file.id,
      fileName: file.name,
      mimeType: file.mimeType,
      previewUrl: `/api/orders/documents/${encodeURIComponent(file.id)}/preview`,
      status,
      locked: approved,
      importDocName: type,
      isApproved: getDriveProperty(file, "IsApproved") || null,
    }
  })

  return {
    vendor: {
      vendorId: vendorSummary.vendorId,
      companyName: vendorSummary.companyName,
      driveFolderId: vendorFolderId,
    },
    order: {
      poNumber: order.header.poNumber,
      dateEntered: order.header.dateEntered,
      year,
    },
    folders: {
      vendorFolderId,
      poVrFolderId,
      poFolderId,
      docsFolderId,
    },
    documents,
  }
}
