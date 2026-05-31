type DriveListResponse = {
  files?: DriveFileMetadata[]
}

type DriveFileLabelListResponse = {
  labels?: DriveFileAppliedLabel[]
  items?: DriveFileAppliedLabel[]
  nextPageToken?: string
}

type DriveCreateFileResponse = DriveFileMetadata

type DriveModifyLabelsResponse = {
  modifiedLabels?: unknown[]
  kind?: string
}

export type DriveFileMetadata = {
  id: string
  name: string
  mimeType: string
  modifiedTime?: string
  createdTime?: string
  webViewLink?: string
  webContentLink?: string
  properties?: Record<string, string | undefined>
  appProperties?: Record<string, string | undefined>
}

export type DriveFileAppliedLabelField = {
  selection?: string[]
  text?: string[]
  integer?: string[]
  dateString?: string[]
  user?: string[]
}

export type DriveFileAppliedLabel = {
  id: string
  revisionId?: string
  kind?: string
  fields?: Record<string, DriveFileAppliedLabelField>
}

type TokenCache = {
  accessToken: string
  expiresAt: number
}

const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3"
const DRIVE_UPLOAD_API_BASE = "https://www.googleapis.com/upload/drive/v3"
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
const DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder"

let tokenCache: TokenCache | null = null

const getRequiredEnv = (name: string) => {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing Google Drive environment variable: ${name}`)
  }

  return value
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

const escapeDriveQueryValue = (value: string) => value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")

const buildQuery = (parts: string[]) => parts.join(" and ")

const getGoogleAccessToken = async (forceRefresh = false) => {
  if (tokenCache && !forceRefresh && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.accessToken
  }

  const clientId = getRequiredEnv("GOOGLE_CLIENT_ID")
  const clientSecret = getRequiredEnv("GOOGLE_CLIENT_SECRET")
  const refreshToken = getRequiredEnv("GOOGLE_REFRESH_TOKEN")

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  })

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error_description || data?.error || "Failed to authenticate with Google Drive")
  }

  const accessToken = normalizeFieldValue(data.access_token)
  const expiresIn = Number(data.expires_in || 3600)

  if (!accessToken) {
    throw new Error("Google Drive authentication did not return an access token")
  }

  tokenCache = {
    accessToken,
    expiresAt: Date.now() + Math.max(60, expiresIn - 60) * 1000,
  }

  return accessToken
}

const driveFetch = async (path: string, init?: RequestInit) => {
  let accessToken = await getGoogleAccessToken()

  const doFetch = async (token: string) => {
    return fetch(`${DRIVE_API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    })
  }

  let response = await doFetch(accessToken)

  if (response.status === 401) {
    accessToken = await getGoogleAccessToken(true)
    response = await doFetch(accessToken)
  }

  return response
}

const driveUploadFetch = async (path: string, init?: RequestInit) => {
  let accessToken = await getGoogleAccessToken()

  const doFetch = async (token: string) => {
    return fetch(`${DRIVE_UPLOAD_API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    })
  }

  let response = await doFetch(accessToken)

  if (response.status === 401) {
    accessToken = await getGoogleAccessToken(true)
    response = await doFetch(accessToken)
  }

  return response
}

const buildMultipartRelatedBody = (
  metadata: Record<string, unknown>,
  fileBytes: ArrayBuffer,
  mimeType: string
) => {
  const boundary = `drive_upload_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`
  const delimiter = `--${boundary}`
  const closeDelimiter = `--${boundary}--`
  const metadataPayload = JSON.stringify(metadata)
  const parts: Uint8Array[] = [
    Buffer.from(
      `${delimiter}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadataPayload}\r\n${delimiter}\r\nContent-Type: ${mimeType}\r\n\r\n`
    ),
    new Uint8Array(fileBytes),
    Buffer.from(`\r\n${closeDelimiter}`),
  ]

  return {
    body: Buffer.concat(parts.map((part) => Buffer.from(part))),
    contentType: `multipart/related; boundary=${boundary}`,
  }
}

export const getDriveRootFolderId = () => normalizeFieldValue(process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID)

export const listDriveFoldersByName = async (parentFolderId: string, folderName: string) => {
  const query = buildQuery([
    `'${escapeDriveQueryValue(parentFolderId)}' in parents`,
    `name = '${escapeDriveQueryValue(folderName)}'`,
    `mimeType = '${DRIVE_FOLDER_MIME_TYPE}'`,
    "trashed = false",
  ])

  const response = await driveFetch(
    `/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime,createdTime)&supportsAllDrives=true&includeItemsFromAllDrives=true&pageSize=10`,
    { method: "GET" }
  )

  const data = (await response.json()) as DriveListResponse & { error?: unknown }

  if (!response.ok) {
    throw new Error(`Google Drive folder lookup failed: ${JSON.stringify(data.error ?? data)}`)
  }

  return data.files ?? []
}

export const resolveDriveFolderByName = async (parentFolderId: string, folderName: string) => {
  const folders = await listDriveFoldersByName(parentFolderId, folderName)
  return folders[0] ?? null
}

export const resolveDriveFolderChain = async (
  rootFolderId: string,
  folderNames: string[]
) => {
  let currentFolderId = normalizeFieldValue(rootFolderId)

  if (!currentFolderId) {
    return null
  }

  for (const folderName of folderNames) {
    const folder = await resolveDriveFolderByName(currentFolderId, folderName)

    if (!folder?.id) {
      return null
    }

    currentFolderId = folder.id
  }

  return currentFolderId
}

export const listDriveFilesInFolder = async (folderId: string) => {
  const query = buildQuery([
    `'${escapeDriveQueryValue(folderId)}' in parents`,
    "trashed = false",
  ])

  const response = await driveFetch(
    `/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime,createdTime,webViewLink,webContentLink,properties,appProperties)&supportsAllDrives=true&includeItemsFromAllDrives=true&pageSize=1000`,
    { method: "GET" }
  )

  const data = (await response.json()) as DriveListResponse & { error?: unknown }

  if (!response.ok) {
    throw new Error(`Google Drive file listing failed: ${JSON.stringify(data.error ?? data)}`)
  }

  return (data.files ?? []).sort((left, right) => {
    const leftTime = left.modifiedTime || left.createdTime || ""
    const rightTime = right.modifiedTime || right.createdTime || ""
    return rightTime.localeCompare(leftTime)
  })
}

export const listDriveLabelsForFile = async (fileId: string) => {
  const response = await driveFetch(
    `/files/${encodeURIComponent(fileId)}/listLabels?maxResults=100`,
    { method: "GET" }
  )

  const data = (await response.json()) as DriveFileLabelListResponse & { error?: unknown }

  if (!response.ok) {
    throw new Error(`Google Drive file label listing failed: ${JSON.stringify(data.error ?? data)}`)
  }

  return data.labels ?? data.items ?? []
}

export const uploadDriveFileToFolder = async (options: {
  folderId: string
  fileName: string
  mimeType: string
  fileBytes: ArrayBuffer
  appProperties?: Record<string, string>
  properties?: Record<string, string>
}) => {
  const { body, contentType } = buildMultipartRelatedBody(
    {
      name: options.fileName,
      parents: [options.folderId],
      appProperties: options.appProperties,
      properties: options.properties,
    },
    options.fileBytes,
    options.mimeType || "application/octet-stream"
  )

  const response = await driveUploadFetch(
    `/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,createdTime,webViewLink,webContentLink,properties,appProperties&supportsAllDrives=true`,
    {
      method: "POST",
      headers: {
        "Content-Type": contentType,
      },
      body,
    }
  )

  const data = (await response.json()) as DriveCreateFileResponse & { error?: unknown }

  if (!response.ok) {
    throw new Error(`Google Drive file upload failed: ${JSON.stringify(data.error ?? data)}`)
  }

  return data
}

export const applyDriveDocumentTypeLabel = async (options: {
  fileId: string
  labelId: string
  fieldId: string
  choiceId: string
}) => {
  const response = await driveFetch(
    `/files/${encodeURIComponent(options.fileId)}/modifyLabels`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        labelModifications: [
          {
            labelId: options.labelId,
            fieldModifications: [
              {
                fieldId: options.fieldId,
                setSelectionValues: [options.choiceId],
              },
            ],
          },
        ],
      }),
    }
  )

  const data = (await response.json()) as DriveModifyLabelsResponse & { error?: unknown }

  if (!response.ok) {
    throw new Error(`Google Drive label update failed: ${JSON.stringify(data.error ?? data)}`)
  }

  return data
}

export const deleteDriveFile = async (fileId: string) => {
  const response = await driveFetch(
    `/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`,
    { method: "DELETE" }
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Google Drive file delete failed: ${body || response.statusText}`)
  }
}

export const getDriveFileMetadata = async (fileId: string) => {
  const response = await driveFetch(
    `/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,modifiedTime,createdTime,webViewLink,webContentLink,properties,appProperties&supportsAllDrives=true`,
    { method: "GET" }
  )

  const data = (await response.json()) as DriveFileMetadata & { error?: unknown }

  if (!response.ok) {
    throw new Error(`Google Drive metadata lookup failed: ${JSON.stringify(data.error ?? data)}`)
  }

  return data
}

export const getDriveFileMediaResponse = async (fileId: string) => {
  return driveFetch(
    `/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
    { method: "GET" }
  )
}
