"use client"

import { useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileType, AlertCircle, FileText, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MarkdownDisplay } from "@/components/markdown-display"
import { cn } from "@/lib/utils"
import type { PageOcrResponse } from "@/app/api/ocr/route"

const PATH_OCR = "/api/ocr"

export function FileUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ocrResults, setOcrResults] = useState<PageOcrResponse[] | null>(null)
  const [processingStatus, setProcessingStatus] = useState<string>("")

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0])
        setError(null)
        setOcrResults(null)
        setProcessingStatus("")
      }
    },
    onDropRejected: () => {
      setError("Please upload a PDF file only.")
    },
  })

  const handleUpload = async () => {
    if (!file) return

    try {
      setIsProcessing(true)
      setError(null)
      setProcessingStatus("Converting file to base64...")

      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
          const base64Data = result.split(",")[1]
          resolve(base64Data)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      setProcessingStatus("Processing with OCR API...")

      // Send file data to OCR API
      const response = await fetch(PATH_OCR, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // fileName: file.name,
          // fileType: file.type,
          // fileSize: file.size,
          base64Data: base64,
        }),
      })

      if (!response.ok) {
        throw new Error("OCR processing failed")
      }

      const { pages, total_pages } = await response.json()
      setProcessingStatus(`Successfully processed ${total_pages} pages!`)
      
      // Small delay to show success message
      setTimeout(() => {
        setOcrResults(pages)
        setIsProcessing(false)
        setProcessingStatus("")
      }, 1000)

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      setIsProcessing(false)
      setProcessingStatus("")
    }
  }

  const handleReset = () => {
    setFile(null)
    setOcrResults(null)
    setError(null)
    setProcessingStatus("")
  }

  const getFileIcon = () => {
    if (!file) return null
    return <FileType className="h-6 w-6 text-primary" />
  }

  return (
    <div className="space-y-6">
      {!ocrResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
                isDragActive ? "border-primary bg-muted" : "border-muted-foreground/25 hover:border-primary/50",
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center space-y-4">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {isDragActive ? "Drop the file here" : "Drag & drop a file here"}
                  </p>
                  <p className="text-sm text-muted-foreground">Supports PDF files only</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    const input = document.querySelector('input[type="file"]')
                    if (input) (input as HTMLInputElement).click()
                  }}
                >
                  Select File
                </Button>
              </div>
            </div>

            {file && (
              <div className="mt-4 p-4 border rounded-md flex items-center justify-between bg-muted/50">
                <div className="flex items-center space-x-3">
                  {getFileIcon()}
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleReset} disabled={isProcessing}>
                    Remove
                  </Button>
                  <Button size="sm" onClick={handleUpload} disabled={isProcessing}>
                    {isProcessing ? "Processing..." : "Process"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-3 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <div className="text-center">
                <p className="text-lg font-medium">Processing document with OCR...</p>
                {processingStatus && (
                  <p className="text-sm text-muted-foreground mt-1">{processingStatus}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {ocrResults && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h2 className="text-xl font-semibold">Extracted Text ({ocrResults.length} pages)</h2>
            </div>
            <Button variant="outline" onClick={handleReset}>
              Process Another Document
            </Button>
          </div>
          
          <div className="space-y-4">
            {ocrResults.map((pageResult) => (
              <Card key={pageResult.page}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-4 w-4" />
                    Page {pageResult.page}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MarkdownDisplay markdown={pageResult.natural_text} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
