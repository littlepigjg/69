import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../App.jsx'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler, BarElement
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import moment from 'moment'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, BarElement)

const STATUS_STYLES = {
  up: { bg: '#d1fae5', text: '#065f46', dot: '#10b981', label: '正常运行' },
  down: { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444', label: '服务故障' },
  maintenance: { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b', label: '维护中' },
  unknown: { bg: '#f3f4f6', text: '#4b5563', dot: '#9ca3af', label: '未知' }
}

function StatusBadge({ status, size = 'md' }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.unknown
  const sz = size === 'lg' ? 14 : size === 'sm' ? 8 : 10
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: size === 'lg' ? '8px 14px' : '4px 10px',
      borderRadius: 999, background: s.bg, color: s.text,
      fontSize: size === 'lg' ? 15 : 13, fontWeight: 500
    }}>
      <span style={{
        width: sz, height: sz, borderRadius: '50%',
        background: s.dot, boxShadow: `0 0 0 4px ${s.dot}22`
      }} />
      {s.label}
    </span>
  )
}

function ServiceCard({ service, onClick, selected }) {
  const s = STATUS_STYLES[service.summary?.status] || STATUS_STYLES.unknown
  const avail = service.summary?.availability ?? 0

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 14, padding: 20,
        border: selected ? `2px solid ${s.dot}` : '2px solid transparent',
        boxShadow: selected ? `0 4px 20px ${s.dot}33` : '0 1px 3px rgba(0,0,0,0.06)',
        cursor: 'pointer', transition: 'all 0.2s',
        minWidth: 280, flex: '1 1 320px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{service.name}</h3>
          <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>
            {service.type.toUpperCase()} · {service.target}{service.type === 'tcp' && service.port ? `:${service.port}` : ''}
          </div>
        </div>
        <StatusBadge status={service.summary?.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div style={{ background: '#f9fafb', padding: 10, borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>可用率</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: avail >= 99 ? '#059669' : avail >= 95 ? '#d97706' : '#dc2626' }}>
            {avail.toFixed(2)}%
          </div>
        </div>
        <div style={{ background: '#f9fafb', padding: 10, borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>平均响应</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#4f46e5' }}>
            {service.summary?.avgResponseTime || 0}ms
          </div>
        </div>
      </div>

      <div style={{
        height: 36, display: 'flex', borderRadius: 6, overflow: 'hidden',
        gap: 1, background: '#f3f4f6'
      }}>
        <MiniBars serviceId={service.id} />
      </div>

      {service.summary?.lastCheck && (
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 10 }}>
          上次检测: {moment(service.summary.lastCheck).fromNow()}
        </div>
      )}
    </div>
  )
}

function MiniBars({ serviceId }) {
  const [data, setData] = useState([])
  useEffect(() => {
    fetch(`/api/services/${serviceId}/trend?hours=24`)
      .then(r => r.json())
      .then(d => setData(d.data || []))
      .catch(() => {})
  }, [serviceId])

  const bars = data.length > 0 ? data : Array(48).fill(null)
  return bars.map((point, i) => {
    if (!point || point.checks === 0) return <div key={i} style={{ flex: 1, background: '#e5e7eb' }} />
    const avail = point.availability
    const color = avail >= 99 ? '#10b981' : avail >= 80 ? '#f59e0b' : '#ef4444'
    return <div key={i} style={{ flex: 1, background: color }} title={`${point.timestamp}: ${avail}%`} />
  })
}

function DetailPanel({ service, onClose }) {
  const [trend, setTrend] = useState({ data: [] })
  const [hours, setHours] = useState(24)

  useEffect(() => {
    if (!service) return
    fetch(`/api/services/${service.id}/trend?hours=${hours}`)
      .then(r => r.json())
      .then(d => setTrend(d))
  }, [service, hours])

  if (!service) return null

  const lineData = {
    labels: trend.data.map(d => moment(d.timestamp).format('MM-DD HH:mm')),
    datasets: [
      {
        label: '可用率 (%)',
        data: trend.data.map(d => d.availability),
        borderColor: '#6366f1',
        backgroundColor: '#6366f122',
        yAxisID: 'y',
        fill: true,
        tension: 0.3,
        pointRadius: 0
      },
      {
        label: '响应时间 (ms)',
        data: trend.data.map(d => d.avgResponseTime),
        borderColor: '#10b981',
        backgroundColor: '#10b981',
        yAxisID: 'y1',
        borderDash: [4, 4],
        pointRadius: 0
      }
    ]
  }

  const lineOptions = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'top' } },
    scales: {
      y: { type: 'linear', position: 'left', min: 0, max: 100, title: { display: true, text: '可用率 %' } },
      y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: '响应 ms' } }
    }
  }

  const uptimeBars = trend.data.map(d => {
    const avail = d.availability
    if (d.checks === 0) return '#e5e7eb'
    return avail >= 99 ? '#10b981' : avail >= 80 ? '#f59e0b' : '#ef4444'
  })

  const barData = {
    labels: trend.data.map(d => moment(d.timestamp).format('HH:mm')),
    datasets: [{
      data: trend.data.map(d => d.checks > 0 ? 1 : 0),
      backgroundColor: uptimeBars,
      barPercentage: 1,
      categoryPercentage: 1,
      borderWidth: 0
    }]
  }

  const barOptions = {
    plugins: { legend: { display: false }, tooltip: {
      callbacks: {
        label: (ctx) => {
          const idx = ctx.dataIndex
          const d = trend.data[idx]
          if (!d || d.checks === 0) return '无数据'
          return `可用率 ${d.availability}%, 平均 ${d.avgResponseTime}ms (${d.checks}次检测)`
        }
      }
    }},
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 12, font: { size: 10 } } },
      y: { display: false, max: 1 }
    }
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: 24,
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      marginTop: 24
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>{service.name}</h2>
          <StatusBadge status={service.summary?.status} size="lg" />
        </div>
        <button onClick={onClose} style={{
          border: 'none', background: '#f3f4f6', padding: '8px 14px',
          borderRadius: 8, cursor: 'pointer', fontSize: 14
        }}>关闭</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12, marginBottom: 24 }}>
        <StatBox label="服务类型" value={service.type.toUpperCase()} />
        <StatBox label="目标地址" value={`${service.target}${service.type === 'tcp' && service.port ? `:${service.port}` : ''}`} mono />
        <StatBox label="检测方法" value={service.type === 'tcp' ? 'TCP连接' : `${service.method} ${service.expectedStatus}`} />
        <StatBox label="检测间隔" value={`${service.interval_seconds}秒`} />
        <StatBox label="超时时间" value={`${service.timeout_ms}ms`} />
        <StatBox label="检测次数" value={`${service.summary?.successfulChecks || 0}/${service.summary?.totalChecks || 0}`} />
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        {[1, 6, 24, 72, 168].map(h => (
          <button key={h} onClick={() => setHours(h)} style={{
            padding: '6px 14px', borderRadius: 6, border: 'none',
            background: hours === h ? '#6366f1' : '#f3f4f6',
            color: hours === h ? '#fff' : '#374151',
            cursor: 'pointer', fontSize: 13
          }}>
            {h < 24 ? `${h}小时` : `${h / 24}天`}
          </button>
        ))}
      </div>

      <div style={{ height: 260, marginBottom: 20 }}>
        <Line data={lineData} options={lineOptions} />
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#374151' }}>可用率时间分布</div>
        <div style={{ height: 40 }}>
          <Bar data={barData} options={barOptions} />
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: '#6b7280' }}>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#10b981', borderRadius: 2, marginRight: 4 }} />正常 (≥99%)</span>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#f59e0b', borderRadius: 2, marginRight: 4 }} />波动 (80-99%)</span>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#ef4444', borderRadius: 2, marginRight: 4 }} />故障 (低于80%)</span>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#e5e7eb', borderRadius: 2, marginRight: 4 }} />无数据</span>
        </div>
      </div>

      {service.summary?.error_message && (
        <div style={{ marginTop: 16, padding: 12, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
          <div style={{ fontSize: 12, color: '#991b1b', fontWeight: 600, marginBottom: 4 }}>最新错误信息</div>
          <div style={{ fontSize: 13, color: '#7f1d1d', fontFamily: 'monospace' }}>{service.summary.error_message}</div>
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, mono }) {
  return (
    <div style={{ background: '#f9fafb', padding: 14, borderRadius: 10 }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600, fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{value}</div>
    </div>
  )
}

export default function StatusPage() {
  const { services, lastUpdate } = useApp()
  const [selected, setSelected] = useState(null)

  const counts = useMemo(() => {
    let up = 0, down = 0, maint = 0, unk = 0
    for (const s of services) {
      const st = s.summary?.status
      if (st === 'up') up++
      else if (st === 'down') down++
      else if (st === 'maintenance') maint++
      else unk++
    }
    return { up, down, maint, unk, total: services.length }
  }, [services])

  const selectedService = selected ? services.find(s => s.id === selected) : null

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>服务状态总览</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>
            共 <b style={{ color: '#1f2937' }}>{counts.total}</b> 个服务
            {counts.down > 0 && <span style={{ color: '#dc2626', marginLeft: 12 }}>· {counts.down} 个故障</span>}
            {counts.maint > 0 && <span style={{ color: '#d97706', marginLeft: 12 }}>· {counts.maint} 个维护中</span>}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
            <div><div style={{ fontSize: 10, color: '#6b7280' }}>正常</div><div style={{ fontWeight: 700 }}>{counts.up}</div></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
            <div><div style={{ fontSize: 10, color: '#6b7280' }}>故障</div><div style={{ fontWeight: 700, color: '#dc2626' }}>{counts.down}</div></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
            <div><div style={{ fontSize: 10, color: '#6b7280' }}>维护</div><div style={{ fontWeight: 700, color: '#d97706' }}>{counts.maint}</div></div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {services.length === 0 && (
          <div style={{
            background: '#fff', borderRadius: 14, padding: 60, textAlign: 'center',
            width: '100%', color: '#6b7280'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#1f2937' }}>暂无监控服务</div>
            <div style={{ marginBottom: 20 }}>请前往「管理配置」页面添加要监控的服务端点</div>
            <Link to="/admin" style={{
              display: 'inline-block', padding: '10px 20px',
              background: '#6366f1', color: '#fff', borderRadius: 8, fontWeight: 600
            }}>添加服务</Link>
          </div>
        )}
        {services.map(svc => (
          <ServiceCard
            key={svc.id}
            service={svc}
            selected={selected === svc.id}
            onClick={() => setSelected(selected === svc.id ? null : svc.id)}
          />
        ))}
      </div>

      <DetailPanel service={selectedService} onClose={() => setSelected(null)} />

      {lastUpdate && (
        <div style={{ textAlign: 'center', marginTop: 32, color: '#9ca3af', fontSize: 12 }}>
          数据更新于 {moment(lastUpdate).format('YYYY-MM-DD HH:mm:ss')} · 状态变化实时推送
        </div>
      )}
    </div>
  )
}
