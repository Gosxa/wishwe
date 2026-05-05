import './StatusCard.css'

const statusLabel = {
  checking: 'Checking...',
  online: 'Online',
  offline: 'Offline',
  error: 'Error',
}

export default function StatusCard({ apiStatus }) {
  return (
    <div className="status-card" style={{ animationDelay: '0.2s' }}>
      <p className="status-label">System Status</p>
      <div className="status-rows">
        <div className="status-row">
          <span className="status-name">EC2 Server</span>
          <span className={`status-badge online`}>Online</span>
        </div>
        <div className="status-row">
          <span className="status-name">Django API</span>
          <span className={`status-badge ${apiStatus}`}>
            <span className="status-dot" />
            {statusLabel[apiStatus]}
          </span>
        </div>
        <div className="status-row">
          <span className="status-name">PostgreSQL RDS</span>
          <span className={`status-badge online`}>Connected</span>
        </div>
        <div className="status-row">
          <span className="status-name">CI/CD Pipeline</span>
          <span className={`status-badge online`}>Ready</span>
        </div>
      </div>
    </div>
  )
}
