export interface OcrRequest {
  fileName: string
  fileType: string
  fileSize: number
  base64Data: string
}

export interface OcrResponse {
  markdown: string
  fileName: string
  fileType: string
  processedAt: string
}
