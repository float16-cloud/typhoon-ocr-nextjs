import { create } from 'zustand'
import type { PageOcrResponse } from '@/app/api/ocr/route'

export interface FileItem {
  id: string
  file: File
  status: 'pending' | 'processing' | 'completed' | 'error'
  result?: PageOcrResponse[]
  error?: string
  processingStatus?: string
  createdAt: Date
}

interface FilesStore {
  files: FileItem[]
  selectedFileId: string | null
  
  // Actions
  addFiles: (files: File[]) => FileItem[]
  updateFileStatus: (fileId: string, updates: Partial<FileItem>) => void
  removeFile: (fileId: string) => void
  setSelectedFile: (fileId: string | null) => void
  getFileById: (fileId: string) => FileItem | undefined
  getCompletedFiles: () => FileItem[]
  clearAllFiles: () => void
}

export const useFilesStore = create<FilesStore>((set, get) => ({
  files: [],
  selectedFileId: null,

  addFiles: (newFiles: File[]) => {
    const fileItems = newFiles.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending' as const,
      createdAt: new Date(),
    }))
    
    set(state => ({
      files: [...state.files, ...fileItems]
    }))
    
    return fileItems
  },

  updateFileStatus: (fileId: string, updates: Partial<FileItem>) => {
    set(state => ({
      files: state.files.map(f => 
        f.id === fileId ? { ...f, ...updates } : f
      )
    }))
  },

  removeFile: (fileId: string) => {
    set(state => ({
      files: state.files.filter(f => f.id !== fileId),
      selectedFileId: state.selectedFileId === fileId ? null : state.selectedFileId
    }))
  },

  setSelectedFile: (fileId: string | null) => {
    set({ selectedFileId: fileId })
  },

  getFileById: (fileId: string) => {
    return get().files.find(f => f.id === fileId)
  },

  getCompletedFiles: () => {
    return get().files.filter(f => f.status === 'completed')
  },

  clearAllFiles: () => {
    set({ files: [], selectedFileId: null })
  },
})) 