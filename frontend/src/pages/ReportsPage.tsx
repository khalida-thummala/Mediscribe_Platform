import { useState } from 'react'
import ReportList from '@/components/reports/ReportList'
import { FileText, Search,  } from 'lucide-react'

export default function ReportsPage() {
  const [search, setSearch] = useState('')

  return (
    <div className="fade-in">
      {/* Page header */}
      <div className="page-header stack-on-mobile" style={{ marginBottom: 20 }}>
        <h1 className="page-title">SOAP Reports</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patients, reports…"
              className="form-control"
              style={{ paddingLeft: 32, width: '100%', minWidth: 200 }}
            />
          </div>
          {/* SOAP Standard badge */}
          <div className="desktop-only" style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'var(--teal-light)', border: '1px solid var(--teal-glow)',
            borderRadius: 10, padding: '8px 14px', fontSize: 12, color: 'var(--teal-dark)', fontWeight: 700,
            whiteSpace: 'nowrap', boxShadow: '0 2px 10px var(--teal-glow-op)'
          }}>
            <FileText size={14} />
            SOAP Standard
          </div>
        </div>
      </div>

      <ReportList search={search} />
    </div>
  )
}
