"use client"

import {
  type ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Circle, CircleCheck, FileText, Trash2, Upload } from "lucide-react"
import { DEFAULT_DOCUMENT_TYPES } from "@/config/orderDocuments"

type DocumentStatus = "Not uploaded" | "Uploaded" | "Synced" | "Approved" | "Rejected"

type DocumentSlot = {
  type: string
  fileName: string | null
  fileType: string | null
  previewUrl: string | null
  status: DocumentStatus
  locked: boolean
  fileId: string | null
}

type RemoteDocumentSlot = {
  type: string
  fileId: string | null
  fileName: string | null
  fileType: string | null
  previewUrl: string | null
  status: DocumentStatus
  locked: boolean
}

type OrderDocumentFolders = {
  vendorFolderId: string
  poVrFolderId: string | null
  poFolderId: string | null
  docsFolderId: string | null
}

type OrderDocumentsApiResponse = {
  success: boolean
  documents?: RemoteDocumentSlot[]
  folders?: OrderDocumentFolders
  error?: string
}

type OrderDocumentsPanelProps = {
  vendorId: string | null
  poNumber: string
  disabled?: boolean
}

function createEmptySlot(type: string): DocumentSlot {
  return {
    type,
    fileName: null,
    fileType: null,
    previewUrl: null,
    status: "Not uploaded",
    locked: false,
    fileId: null,
  }
}

function isPreviewableImage(fileType: string | null) {
  return Boolean(fileType?.startsWith("image/"))
}

function createSlotsFromRemoteDocuments(documents: RemoteDocumentSlot[]) {
  const slotMap = new Map<string, DocumentSlot>()

  DEFAULT_DOCUMENT_TYPES.forEach((type) => {
    slotMap.set(type, createEmptySlot(type))
  })

  documents.forEach((document) => {
    slotMap.set(document.type, {
      type: document.type,
      fileName: document.fileName,
      fileType: document.fileType,
      previewUrl: document.previewUrl,
      status: document.status,
      locked: document.locked,
      fileId: document.fileId,
    })
  })

  return [...slotMap.values()]
}

async function fetchOrderDocuments(vendorId: string, poNumber: string) {
  const params = new URLSearchParams({
    vendorId,
    poNumber,
  })

  const response = await fetch(`/api/orders/documents?${params.toString()}`)
  const data = (await response.json()) as OrderDocumentsApiResponse

  if (response.ok && data.success) {
    return {
      documents: Array.isArray(data.documents)
        ? data.documents.map((document: RemoteDocumentSlot) => document)
        : [],
      folders: data.folders ?? null,
    }
  }

  throw new Error(data.error || "Failed to load order documents")
}

function getRowClasses(slot: DocumentSlot, isActive: boolean) {
  if (isActive) {
    return "border-primary bg-primary/10 shadow-[0_10px_24px_rgba(181,74,74,0.12)]"
  }

  if (slot.fileName) {
    return "border-primary/15 bg-primary/5"
  }

  return "border-border/70 bg-card text-muted-foreground hover:bg-muted/40"
}

function getStatusBadgeClasses(status: DocumentStatus) {
  switch (status) {
    case "Approved":
      return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-transparent dark:text-emerald-300"
    case "Rejected":
      return "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/60 dark:bg-transparent dark:text-rose-300"
    case "Synced":
      return "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/60 dark:bg-transparent dark:text-sky-300"
    default:
      return "border-border/70 bg-muted text-muted-foreground"
  }
}

export function OrderDocumentsPanel({ vendorId, poNumber, disabled = false }: OrderDocumentsPanelProps) {
  const [slots, setSlots] = useState<DocumentSlot[]>(
    DEFAULT_DOCUMENT_TYPES.map((type) => createEmptySlot(type))
  )
  const [selectedType, setSelectedType] = useState<string>(DEFAULT_DOCUMENT_TYPES[0])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [documentsError, setDocumentsError] = useState<string | null>(null)
  const [folders, setFolders] = useState<OrderDocumentFolders | null>(null)
  const slotsRef = useRef(slots)
  const fetchRequestRef = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    slotsRef.current = slots
  }, [slots])

  useEffect(() => {
    return () => {
      slotsRef.current.forEach((slot) => {
        if (slot.previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(slot.previewUrl)
        }
      })
    }
  }, [])

  useEffect(() => {
    if (!vendorId || !poNumber) {
      return
    }

    let isActive = true
    const requestId = ++fetchRequestRef.current

    const loadDocuments = async () => {
      try {
        setDocumentsLoading(true)
        setDocumentsError(null)

        const { documents: remoteDocuments, folders: remoteFolders } = await fetchOrderDocuments(vendorId, poNumber)

        if (!isActive || requestId !== fetchRequestRef.current) {
          return
        }

        setFolders(remoteFolders)
        setSlots((currentSlots) => {
          currentSlots.forEach((slot) => {
            if (slot.previewUrl?.startsWith("blob:")) {
              URL.revokeObjectURL(slot.previewUrl)
            }
          })

          return createSlotsFromRemoteDocuments(remoteDocuments)
        })
      } catch (error) {
        if (!isActive || requestId !== fetchRequestRef.current) {
          return
        }

        setDocumentsError("An unexpected error occurred while loading order documents")
        setFolders(null)
        console.error(error)
      } finally {
        if (isActive && requestId === fetchRequestRef.current) {
          setDocumentsLoading(false)
        }
      }
    }

    void loadDocuments()

    return () => {
      isActive = false
    }
  }, [vendorId, poNumber])

  useEffect(() => {
    const prefetchLinks = slots
      .filter((slot) => slot.fileId && slot.previewUrl)
      .map((slot) => {
        const link = document.createElement("link")
        link.rel = "prefetch"
        link.href = slot.previewUrl as string
        link.as = "document"
        document.head.appendChild(link)

        return link
      })

    return () => {
      prefetchLinks.forEach((link) => link.remove())
    }
  }, [slots])

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.type === selectedType) ?? null,
    [selectedType, slots]
  )

  const uploadedCount = slots.filter((slot) => Boolean(slot.fileName)).length
  const approvedCount = slots.filter((slot) => slot.status === "Approved").length

  const selectedPreview = selectedSlot?.previewUrl
  const selectedLabel = selectedSlot?.fileName || "No document uploaded"
  const selectedStatus = selectedSlot?.status ?? "Not uploaded"
  const showRemotePreview = Boolean(selectedPreview && selectedSlot?.fileId)
  const hasPoDriveFolder = Boolean(folders?.poFolderId && folders?.docsFolderId)
  const uploadDisabled = disabled || !selectedSlot || selectedSlot.locked || uploading || documentsLoading || !hasPoDriveFolder
  const deleteDisabled = disabled || !selectedSlot?.fileId || selectedSlot.locked || deleting || documentsLoading

  const openFilePicker = () => {
    if (uploadDisabled) {
      return
    }

    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file || !vendorId || !poNumber) {
      return
    }

    if (selectedSlot?.locked) {
      setDocumentsError("Approved documents are locked.")
      return
    }

    try {
      setUploading(true)
      setDocumentsError(null)

      const formData = new FormData()
      formData.append("vendorId", vendorId)
      formData.append("poNumber", poNumber)
      formData.append("documentType", selectedType)
      formData.append("file", file)

      const response = await fetch("/api/orders/documents/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to upload order document")
      }

      const { documents: remoteDocuments, folders: remoteFolders } = await fetchOrderDocuments(vendorId, poNumber)
      setFolders(remoteFolders)

      setSlots((currentSlots) => {
        currentSlots.forEach((slot) => {
          if (slot.previewUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(slot.previewUrl)
          }
        })

        return createSlotsFromRemoteDocuments(remoteDocuments)
      })
    } catch (error) {
      setDocumentsError(error instanceof Error ? error.message : "Failed to upload order document")
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async () => {
    if (!vendorId || !poNumber || !selectedSlot?.fileId || deleteDisabled) {
      return
    }

    try {
      setDeleting(true)
      setDocumentsError(null)

      const response = await fetch("/api/orders/documents/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorId,
          poNumber,
          fileId: selectedSlot.fileId,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete order document")
      }

      const { documents: remoteDocuments, folders: remoteFolders } = await fetchOrderDocuments(vendorId, poNumber)
      setFolders(remoteFolders)

      setSlots((currentSlots) => {
        currentSlots.forEach((slot) => {
          if (slot.previewUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(slot.previewUrl)
          }
        })

        return createSlotsFromRemoteDocuments(remoteDocuments)
      })
    } catch (error) {
      setDocumentsError(error instanceof Error ? error.message : "Failed to delete order document")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          {uploadedCount} Uploaded
        </span>
        <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-500/60 dark:bg-transparent dark:text-emerald-300">
          {approvedCount} Approved
        </span>
      </div>
      {documentsError ? (
        <p className="text-sm text-destructive">{documentsError}</p>
      ) : null}

      <div className="grid items-stretch gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="flex flex-col overflow-hidden rounded-[20px] border border-border/70 bg-muted/40">
          <div className="border-b border-border/70 px-4 py-4">
            <p className="text-sm font-semibold text-foreground">Document Types</p>
            <p className="text-xs text-muted-foreground">
              Select a type to preview its file.
            </p>
          </div>

          <div className="max-h-[760px] overflow-y-auto p-3 pb-5 hide-scrollbar">
            <div className="space-y-2">
              {slots.map((slot) => {
                const isActive = slot.type === selectedType

                return (
                  <button
                    key={slot.type}
                    type="button"
                    onClick={() => setSelectedType(slot.type)}
                    className={`flex w-full items-center justify-between gap-3 rounded-[16px] border px-4 py-3 text-left transition-colors ${getRowClasses(
                      slot,
                      isActive
                    )}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <FileText
                          className={`h-4 w-4 shrink-0 ${slot.fileName ? "text-primary" : "text-muted-foreground/60"}`}
                        />
                        <p
                          className={`truncate text-sm font-semibold ${
                            slot.fileName ? "text-foreground" : "text-muted-foreground/70"
                          }`}
                        >
                          {slot.type}
                        </p>
                      </div>
                      <p
                        className={`mt-1 truncate text-xs ${
                          slot.fileName ? "text-muted-foreground" : "text-muted-foreground/60"
                        }`}
                      >
                        {slot.fileName || "No file uploaded"}
                      </p>
                    </div>

                    <div className="flex h-5 w-5 items-center justify-center">
                      {slot.status === "Approved" ? (
                        <CircleCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/60" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        <main className="flex h-full min-h-0 flex-col rounded-[20px] border border-border/70 bg-card p-4 md:p-5">
          <div className="flex flex-col gap-3 pb-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h3 className="text-[22px] font-semibold tracking-tight text-foreground">
                  {selectedType}
                </h3>
                {selectedStatus !== "Not uploaded" ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getStatusBadgeClasses(
                      selectedStatus
                    )}`}
                  >
                    <CircleCheck className="h-3.5 w-3.5" />
                    {selectedStatus}
                  </span>
                ) : null}
              </div>
              {selectedPreview ? (
                <p className="text-sm text-muted-foreground">
                  Preview the uploaded file for {selectedType}.
                </p>
              ) : null}
              
            </div>
            {selectedPreview && !selectedSlot?.locked ? (
              <div className="flex items-center gap-2 self-start">
                <button
                  type="button"
                  onClick={openFilePicker}
                  disabled={uploadDisabled}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a84141] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Replace File"}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteFile}
                  disabled={deleteDisabled}
                  className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/40 dark:bg-transparent dark:text-rose-300 dark:hover:bg-rose-500/10"
                  aria-label={`Delete ${selectedType}`}
                  title={deleting ? "Deleting..." : "Delete file"}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden rounded-[20px] border border-border/70 bg-muted/30">
            {selectedPreview ? (
              isPreviewableImage(selectedSlot?.fileType) && !showRemotePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedPreview}
                  alt={selectedLabel}
                  className="h-full w-full object-contain bg-white"
                />
              ) : (
                <iframe
                  src={selectedPreview}
                  title={selectedLabel}
                  className="h-full w-full bg-white"
                />
              )
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 py-10 text-center">
                {documentsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading order documents...</p>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={openFilePicker}
                      disabled={uploadDisabled}
                      className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`Upload ${selectedType}`}
                    >
                      <Upload className="h-6 w-6" />
                    </button>
                    <p className="text-sm font-semibold text-foreground">
                      {uploading ? "Uploading..." : "No document uploaded"}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
    </div>
  )
}
