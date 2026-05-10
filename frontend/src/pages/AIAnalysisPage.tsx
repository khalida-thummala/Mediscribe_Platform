import { useState } from 'react'
import FileUploadPanel from '@/components/ai-analysis/FileUploadPanel'
import AnalysisResultPanel from '@/components/ai-analysis/AnalysisResultPanel'
import { BrainCircuit, Upload, Sparkles } from 'lucide-react'

export default function AIAnalysisPage() {
  const [analysisId, setAnalysisId] = useState<string | null>(null)

  return (
    <div className="fade-in">
      {/* ── Header ─────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'var(--violet-light)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'var(--violet)', fontWeight: 600,
        }}>
          <Sparkles size={13} />
          GPT-4 Enabled
        </div>
      </div>

      {/* ── Info Banner ────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed11 0%, #a855f711 100%)',
        border: '1px solid #ddd6fe', borderRadius: 12,
        padding: '14px 20px', marginBottom: 24,
        display: 'flex', alignItems: 'flex-start', gap: 14,
      }}>
        <BrainCircuit size={20} color="#7c3aed" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 13.5, color: '#5b21b6', marginBottom: 3 }}>
            How AI Analysis Works
          </div>
          <div style={{ fontSize: 12.5, color: '#7c3aed', lineHeight: 1.6 }}>
            Upload a PDF, DOCX, or image of a medical report. Our AI extracts text, generates a structured SOAP note,
            and compares it against your existing consultation notes. Supports files up to 50 MB.
          </div>
        </div>
      </div>

      {/* ── Main Content ───────────────────── */}
      <div className="grid-responsive" style={{
        display: 'grid',
        gridTemplateColumns: analysisId ? '1fr 1fr' : '1fr',
        gap: 24,
        transition: 'grid-template-columns 0.3s ease',
      }}>
        {/* Upload Panel */}
        <div className="card">
          <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: '#f5f3ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid #ddd6fe',
            }}>
              <Upload size={15} color="#7c3aed" />
            </div>
            <div>
              <h3 style={{ fontSize: 14, margin: 0, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
                Upload Document
              </h3>
              <p style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>PDF, DOCX, or image</p>
            </div>
          </div>
          <div style={{ padding: 22 }}>
            <FileUploadPanel onAnalysisReady={(id) => setAnalysisId(id)} />
          </div>
        </div>

        {/* Results Panel */}
        {analysisId && (
          <div className="card slide-in">
            <div style={{
              padding: '18px 22px 14px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: '#ecfdf5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid #a7f3d0',
                }}>
                  <BrainCircuit size={15} color="#059669" />
                </div>
                <div>
                  <h3 style={{ fontSize: 14, margin: 0, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
                    Analysis Results
                  </h3>
                  <p style={{ fontSize: 11.5, color: '#059669', marginTop: 1 }}>AI-generated SOAP note ready</p>
                </div>
              </div>
              <button
                onClick={() => setAnalysisId(null)}
                className="btn btn-sm"
                style={{ fontSize: 12 }}
              >
                ✕ Clear
              </button>
            </div>
            <div style={{ padding: 22 }}>
              <AnalysisResultPanel analysisId={analysisId} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
