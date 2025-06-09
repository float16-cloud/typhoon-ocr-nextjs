"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import axios from "axios"
import { Upload, FileType, AlertCircle, FileText, CheckCircle, Clock, XCircle, Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { useFilesStore, type FileItem } from "@/lib/store/files-store"
import type { PageOcrResponse } from "@/app/api/ocr/route"

const PATH_OCR = "/api/ocr"

export function FileUploader() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  
  const { files, addFiles, updateFileStatus, removeFile } = useFilesStore()

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
    },
    onDrop: (acceptedFiles) => {
      const newFileItems = addFiles(acceptedFiles)
      setError(null)
      
      // Start processing each file after state update
      setTimeout(() => {
        newFileItems.forEach(fileItem => {
          processFile(fileItem.id, fileItem.file)
        })
      }, 100)
    },
    onDropRejected: () => {
      setError("Please upload PDF files only.")
    },
  })

  const processFile = async (fileId: string, file: File) => {
    console.log(`Starting processing for file: ${file.name} (ID: ${fileId})`)

    try {
      console.log("Step 1: Setting processing status")
      updateFileStatus(fileId, { status: 'processing', processingStatus: "Converting file to base64..." })

      console.log("Step 2: Converting file to base64")
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          const base64Data = result.split(",")[1]
          console.log("Base64 conversion completed")
          resolve(base64Data)
        }
        reader.onerror = (error) => {
          console.error("FileReader error:", error)
          reject(error)
        }
        reader.readAsDataURL(file)
      })

      console.log("Step 3: Updating progress")
      updateFileStatus(fileId, { processingStatus: "Processing with OCR API..." })

      console.log("Step 4: Sending to OCR API")
      // Send file data to OCR API
      const response = await axios.post(PATH_OCR, {
        base64Data: base64,
      }, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("OCR API response status:", response.status)
      
      console.log("Step 5: Parsing response")
      updateFileStatus(fileId, { processingStatus: "Finalizing results..." })

      console.log("OCR API response data:", response.data)
      
      const { pages, total_pages } = response.data
      
      console.log("Step 6: Completing processing")
      updateFileStatus(fileId, { 
        status: 'completed', 
        result: pages,
        processingStatus: `Successfully processed ${total_pages} pages!`
      })

    } catch (err) {
      console.error("Error in processFile:", err)
      const errorMessage = axios.isAxiosError(err) 
        ? `OCR processing failed: ${err.response?.status} ${err.response?.statusText || err.message}`
        : err instanceof Error ? err.message : "An unknown error occurred"
      
      updateFileStatus(fileId, { 
        status: 'error', 
        error: errorMessage
      })
    }
  }

  const handleViewResults = (fileId: string) => {
    router.push(`/results/${fileId}`)
  }

  const getStatusIcon = (status: FileItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive ? "border-primary bg-muted" : "border-muted-foreground/25 hover:border-primary/50",
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-4">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isDragActive ? "Drop the files here" : "Drag & drop PDF files here"}
                </p>
                <p className="text-sm text-muted-foreground">
                  You can upload multiple PDF files at once
                </p>
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
                Select Files
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Processing Queue ({files.length} files)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className="p-4 border rounded-lg transition-colors border-muted-foreground/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <FileType className="h-5 w-5 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{fileItem.file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(fileItem.status)}
                        <span className="text-sm capitalize">{fileItem.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {fileItem.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewResults(fileItem.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile(fileItem.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {fileItem.status === 'processing' && (
                    <div className="mt-3">
                      {fileItem.processingStatus && (
                        <p className="text-sm text-muted-foreground">{fileItem.processingStatus}</p>
                      )}
                    </div>
                  )}
                  
                  {fileItem.status === 'error' && fileItem.error && (
                    <div className="mt-2">
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">{fileItem.error}</AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
