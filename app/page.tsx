import { FileUploader } from "@/components/file-uploader"

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4 min-h-screen">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">OCR Document Processor - Typhoon</h1>
          <p className="text-muted-foreground">Upload PDF to extract text using Typhoon OCR</p>
        </div>
        <FileUploader />
      </div>
    </main>
  )
}
