import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { UploadCloud, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  onAnalysisReady: (analysisId: string) => void
}

type UploadPhase = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error'

export default function FileUploadPanel({ onAnalysisReady }: Props) {
  const [phase, setPhase] = useState<UploadPhase>('idle')
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('file_type', file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : 'docx')
      const res = await apiClient.post('/ai-analysis/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => { if (e.total) setProgress(Math.round((e.loaded * 100) / e.total)) },
      })
      return res.data
    },
    onSuccess: async (uploadData: any) => {
      setPhase('analyzing')
      try {
        const analyzeRes = await apiClient.post(`/ai-analysis/${uploadData.analysis_id}/analyze`)
        setPhase('done')
        toast.success('AI Analysis complete!')
        onAnalysisReady(analyzeRes.data?.analysis_id || uploadData.analysis_id)
      } catch {
        setPhase('error')
        toast.error('Analysis failed')
      }
    },
    onError: () => { setPhase('error'); toast.error('Upload failed') },
  })

  const handleFile = (file: File) => {
    const MAX_MB = 50
    if (file.size > MAX_MB * 1024 * 1024) { toast.error(`File must be under ${MAX_MB} MB`); return }
    setFileName(file.name)
    setPhase('uploading')
    setProgress(0)
    uploadMut.mutate(file)
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />

      {phase === 'idle' && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          style={{
            border: '2px dashed var(--border)', borderRadius: 14, padding: '48px 32px',
            textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.background = 'var(--surface-hover)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = '' }}
        >
          <UploadCloud size={48} color="var(--teal)" style={{ marginBottom: 12, opacity: 0.7 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>Drop a file or click to upload</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Supports PDF, DOCX, JPG, PNG — up to 50 MB</div>
        </div>
      )}

      {phase === 'uploading' && (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <FileText size={36} color="var(--teal)" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-1)', marginBottom: 8 }}>{fileName}</div>
          <div style={{ background: 'var(--border)', borderRadius: 6, height: 6, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--teal)', transition: 'width 0.3s' }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Uploading… {progress}%</div>
        </div>
      )}

      {phase === 'analyzing' && (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <Loader2 size={36} color="var(--teal)" style={{ marginBottom: 12, animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-1)' }}>AI is analyzing your document…</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>This may take 15–30 seconds</div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <CheckCircle size={36} color="#0e7c4a" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0e7c4a' }}>Analysis complete!</div>
        </div>
      )}

      {phase === 'error' && (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <XCircle size={36} color="#e74c3c" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 13.5, fontWeight: 500, color: '#e74c3c', marginBottom: 12 }}>Upload or analysis failed</div>
          <button onClick={() => setPhase('idle')} style={{ padding: '8px 20px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Try Again</button>
        </div>
      )}
    </div>
  )
}
