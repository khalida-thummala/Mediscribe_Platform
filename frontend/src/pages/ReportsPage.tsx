import { useState } from 'react'
import ReportList from '@/components/reports/ReportList'
import { FileText, Search, RefreshCw } from 'lucide-react'

export default function ReportsPage() {
  const [search, setSearch] = useState('')

  return (
    <div className="fade-in">
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
          SOAP Reports
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patients, reports…"
              style={{
                paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)',
                fontSize: 13, color: 'var(--text-1)', outline: 'none', width: 220,
              }}
            />
          </div>
          {/* SOAP Standard badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'var(--teal-light)', border: '1px solid var(--teal-glow)',
            borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'var(--teal-dark)', fontWeight: 600,
          }}>
            <FileText size={13} />
            SOAP Standard
          </div>
        </div>
      </div>

      <ReportList search={search} />
    </div>
  )
}
