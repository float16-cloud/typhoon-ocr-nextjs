"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, FileText, CheckCircle, Calendar, FileType } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MarkdownDisplay } from "@/components/markdown-display"
import { useFilesStore } from "@/lib/store/files-store"

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const fileId = params.fileId as string
  
  const { getFileById } = useFilesStore()
  const [fileItem, setFileItem] = useState(getFileById(fileId))

  useEffect(() => {
    const item = getFileById(fileId)
    setFileItem(item)
    
    if (!item) {
      router.push("/")
    }
  }, [fileId, getFileById, router])

  if (!fileItem) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">File not found</p>
          <Button 
            variant="outline" 
            onClick={() => router.push("/")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Upload
          </Button>
        </div>
      </div>
    )
  }

  if (fileItem.status !== 'completed' || !fileItem.result) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">
            {fileItem.status === 'processing' ? 'File is still processing...' : 'No results available'}
          </p>
          <Button 
            variant="outline" 
            onClick={() => router.push("/")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Upload
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-screen-lg mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Upload
        </Button>
      </div>

      {/* File Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <FileType className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold truncate">{fileItem.file.name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span>{(fileItem.file.size / 1024 / 1024).toFixed(2)} MB</span>
                <span>{fileItem.result.length} pages processed</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {fileItem.createdAt.toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Extracted Text</h2>
        {fileItem.result.map((pageResult) => (
          <Card key={pageResult.page}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-4 w-4" />
                หน้า {pageResult.page}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MarkdownDisplay markdown={pageResult.natural_text?.replace(/\\n/g, '\n')} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 