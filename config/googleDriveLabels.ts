const normalizeFieldValue = (value: unknown) => {
  if (typeof value === "string") {
    return value.trim()
  }

  if (value === null || value === undefined) {
    return ""
  }

  return String(value).trim()
}

export type GoogleDriveDocumentTypeLabelConfig = {
  labelId: string
  fieldId: string
}

export const getGoogleDriveDocumentTypeLabelConfig = (): GoogleDriveDocumentTypeLabelConfig => {
  const labelId = normalizeFieldValue(process.env.GOOGLE_DRIVE_LABEL_ID)
  const fieldId = normalizeFieldValue(process.env.GOOGLE_DRIVE_LABEL_FIELD_ID)

  if (!labelId) {
    throw new Error("Missing Google Drive environment variable: GOOGLE_DRIVE_LABEL_ID")
  }

  if (!fieldId) {
    throw new Error("Missing Google Drive environment variable: GOOGLE_DRIVE_LABEL_FIELD_ID")
  }

  return {
    labelId,
    fieldId,
  }
}
