import React, { useState, useEffect } from 'react'
import { useApp } from '../App.jsx'
import moment from 'moment'

function Modal({ title, children, onClose, actions }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: 16
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 14, padding: 24,
          maxWidth: 640, width: '100%', maxHeight: '90vh', overflow: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{
            border: 'none', background: 'none', fontSize: 24,
            cursor: 'pointer', color: '#6b7280', lineHeight: 1
          }}>×</button>
        </div>
        {children}
        {actions && <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>{actions}</div>}
      </div>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', placeholder, help, ...rest }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 8,
          border: '1px solid #d1d5db', fontSize: 14,
          outline: 'none', transition: 'border-color 0.15s',
          ...(type === 'datetime-local' ? { fontFamily: 'inherit' } : {}),
          ...(type === 'number' ? { fontFamily: 'monospace' } : {})
        }}
        onFocus={e => e.target.style.borderColor = '#6366f1'}
        onBlur={e => e.target.style.borderColor = '#d1d5db'}
        {...rest}
      />
      {help && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{help}</div>}
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{label}</label>
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 8,
          border: '1px solid #d1d5db', fontSize: 14, background: '#fff',
          outline: 'none'
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function ServiceForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    type: initial?.type || 'http',
    target: initial?.target || '',
    port: initial?.port || '',
    method: initial?.method || 'GET',
    expectedStatus: initial?.expectedStatus || 200,
    interval_seconds: initial?.interval_seconds || 30,
    timeout_ms: initial?.timeout_ms || 5000,
    enabled: initial?.enabled !== undefined ? initial.enabled : 1
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    const data = { ...form }
    if (data.type === 'tcp') {
      if (!data.port && !data.target.includes(':')) {
        alert('TCP类型请提供端口号')
        return
      }
    }
    data.interval_seconds = parseInt(data.interval_seconds, 10) || 30
    data.timeout_ms = parseInt(data.timeout_ms, 10) || 5000
    if (data.expectedStatus) data.expectedStatus = parseInt(data.expectedStatus, 10) || 200
    if (data.port) data.port = parseInt(data.port, 10)
    data.enabled = data.enabled ? 1 : 0
    await onSubmit(data)
  }

  return (
    <form onSubmit={submit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Input label="服务名称 *" value={form.name} onChange={v => set('name', v)} placeholder="如: 内部API网关" />
        <Select label="检测类型 *" value={form.type} onChange={v => set('type', v)} options={[
          { value: 'http', label: 'HTTP' },
          { value: 'https', label: 'HTTPS' },
          { value: 'tcp', label: 'TCP 端口' }
        ]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: form.type === 'tcp' ? '2fr 1fr' : '1fr', gap: 16 }}>
        <Input
          label="目标地址 *"
          value={form.target}
          onChange={v => set('target', v)}
          placeholder={form.type === 'tcp' ? '192.168.1.100' : 'https://api.example.com/health'}
          help={form.type === 'tcp' ? 'IP或域名，不带端口号' : '完整URL，包含路径（可选）'}
        />
        {form.type === 'tcp' && (
          <Input
            label="TCP端口 *"
            type="number"
            value={form.port}
            onChange={v => set('port', v)}
            placeholder="如: 3306"
            min="1" max="65535"
          />
        )}
      </div>

      {form.type !== 'tcp' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Select label="HTTP方法" value={form.method} onChange={v => set('method', v)} options={[
            { value: 'GET', label: 'GET' },
            { value: 'HEAD', label: 'HEAD' },
            { value: 'POST', label: 'POST' }
          ]} />
          <Input label="期望状态码" type="number" value={form.expectedStatus} onChange={v => set('expectedStatus', v)} min="100" max="599" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Input label="检测间隔（秒）" type="number" value={form.interval_seconds} onChange={v => set('interval_seconds', v)} min="5" help="最短5秒" />
        <Input label="超时时间（毫秒）" type="number" value={form.timeout_ms} onChange={v => set('timeout_ms', v)} min="500" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
        <input
          type="checkbox"
          id="enabled"
          checked={!!form.enabled}
          onChange={e => set('enabled', e.target.checked ? 1 : 0)}
          style={{ width: 18, height: 18 }}
        />
        <label htmlFor="enabled" style={{ fontSize: 14, color: '#374151' }}>启用该监控</label>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
        <button type="button" onClick={onCancel} style={{
          padding: '10px 20px', borderRadius: 8, border: '1px solid #d1d5db',
          background: '#fff', cursor: 'pointer', fontSize: 14
        }}>取消</button>
        <button type="submit" style={{
          padding: '10px 20px', borderRadius: 8, border: 'none',
          background: '#6366f1', color: '#fff', cursor: 'pointer',
          fontSize: 14, fontWeight: 600
        }}>{initial ? '保存修改' : '添加服务'}</button>
      </div>
    </form>
  )
}

function MaintenanceForm({ initial, services, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    service_id: initial?.service_id ?? '',
    name: initial?.name || '',
    description: initial?.description || '',
    start_time: initial?.start_time ? moment(initial.start_time).format('YYYY-MM-DDTHH:mm') : moment().format('YYYY-MM-DDTHH:mm'),
    end_time: initial?.end_time ? moment(initial.end_time).format('YYYY-MM-DDTHH:mm') : moment().add(1, 'hour').format('YYYY-MM-DDTHH:mm'),
    active: initial?.active !== undefined ? initial.active : 1
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    const data = { ...form }
    data.service_id = data.service_id === '' ? null : parseInt(data.service_id, 10)
    data.start_time = moment(data.start_time).toISOString()
    data.end_time = moment(data.end_time).toISOString()
    data.active = data.active ? 1 : 0
    if (moment(data.end_time) <= moment(data.start_time)) {
      alert('结束时间必须晚于开始时间')
      return
    }
    await onSubmit(data)
  }

  const applyPreset = (minutes) => {
    set('start_time', moment().format('YYYY-MM-DDTHH:mm'))
    set('end_time', moment().add(minutes, 'minutes').format('YYYY-MM-DDTHH:mm'))
  }

  return (
    <form onSubmit={submit}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center' }}>快捷设置:</span>
        {[30, 60, 120, 360, 1440].map(m => (
          <button key={m} type="button" onClick={() => applyPreset(m)} style={{
            padding: '4px 12px', fontSize: 12, borderRadius: 6,
            border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer'
          }}>
            {m < 60 ? `${m}分钟` : m < 1440 ? `${m / 60}小时` : '1天'}
          </button>
        ))}
      </div>

      <Select label="应用服务" value={form.service_id === null ? '' : form.service_id} onChange={v => set('service_id', v)} options={[
        { value: '', label: '全部服务（全局维护）' },
        ...services.map(s => ({ value: s.id, label: s.name }))
      ]} />

      <Input label="维护窗口名称 *" value={form.name} onChange={v => set('name', v)} placeholder="如: 数据库升级维护" />
      <Input label="维护说明" value={form.description} onChange={v => set('description', v)} placeholder="描述维护的原因和影响" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Input label="开始时间 *" type="datetime-local" value={form.start_time} onChange={v => set('start_time', v)} />
        <Input label="结束时间 *" type="datetime-local" value={form.end_time} onChange={v => set('end_time', v)} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
        <input
          type="checkbox" id="active"
          checked={!!form.active}
          onChange={e => set('active', e.target.checked ? 1 : 0)}
          style={{ width: 18, height: 18 }}
        />
        <label htmlFor="active" style={{ fontSize: 14 }}>立即生效</label>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
        <button type="button" onClick={onCancel} style={{
          padding: '10px 20px', borderRadius: 8, border: '1px solid #d1d5db',
          background: '#fff', cursor: 'pointer', fontSize: 14
        }}>取消</button>
        <button type="submit" style={{
          padding: '10px 20px', borderRadius: 8, border: 'none',
          background: '#6366f1', color: '#fff', cursor: 'pointer',
          fontSize: 14, fontWeight: 600
        }}>{initial ? '保存修改' : '创建维护窗口'}</button>
      </div>
    </form>
  )
}

function Tab({ active, label, onClick, badge }) {
  return (
    <button onClick={onClick} style={{
      padding: '12px 20px', fontSize: 14, fontWeight: 600,
      border: 'none', background: 'none', cursor: 'pointer',
      borderBottom: active ? '3px solid #6366f1' : '3px solid transparent',
      color: active ? '#4f46e5' : '#6b7280'
    }}>
      {label}
      {badge !== undefined && (
        <span style={{
          marginLeft: 8, padding: '2px 8px',
          background: active ? '#e0e7ff' : '#f3f4f6',
          borderRadius: 999, fontSize: 12
        }}>{badge}</span>
      )}
    </button>
  )
}

export default function AdminPage() {
  const { services, fetchServices } = useApp()
  const [tab, setTab] = useState('services')
  const [showServiceForm, setShowServiceForm] = useState(null)
  const [showMaintForm, setShowMaintForm] = useState(null)
  const [maintenance, setMaintenance] = useState([])
  const [toast, setToast] = useState(null)

  const loadMaintenance = async () => {
    try {
      const res = await fetch('/api/maintenance')
      setMaintenance(await res.json())
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    loadMaintenance()
  }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleCreateService = async (data) => {
    try {
      const res = await fetch('/api/services', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error((await res.json()).error || '创建失败')
      await fetchServices()
      setShowServiceForm(null)
      showToast('服务已添加')
    } catch (e) {
      alert(e.message)
    }
  }

  const handleUpdateService = async (id, data) => {
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error((await res.json()).error || '更新失败')
      await fetchServices()
      setShowServiceForm(null)
      showToast('服务已更新')
    } catch (e) {
      alert(e.message)
    }
  }

  const handleDeleteService = async (svc) => {
    if (!confirm(`确定删除服务「${svc.name}」？此操作不可恢复。`)) return
    try {
      await fetch(`/api/services/${svc.id}`, { method: 'DELETE' })
      await fetchServices()
      showToast('服务已删除')
    } catch (e) {
      alert(e.message)
    }
  }

  const handleTriggerCheck = async (svc) => {
    try {
      await fetch(`/api/services/${svc.id}/check`, { method: 'POST' })
      showToast(`已触发「${svc.name}」检测`)
      setTimeout(fetchServices, 2000)
    } catch (e) {
      alert(e.message)
    }
  }

  const handleToggleEnabled = async (svc) => {
    try {
      await fetch(`/api/services/${svc.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: svc.enabled ? 0 : 1 })
      })
      await fetchServices()
      showToast(svc.enabled ? '已停止监控' : '已开始监控')
    } catch (e) {
      alert(e.message)
    }
  }

  const handleQuickMaintenance = async (svc, minutes) => {
    try {
      const res = await fetch('/api/maintenance/quick', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: svc.id, minutes })
      })
      if (!res.ok) throw new Error((await res.json()).error || '创建失败')
      await loadMaintenance()
      await fetchServices()
      showToast(`已设置 ${minutes} 分钟维护窗口`)
    } catch (e) {
      alert(e.message)
    }
  }

  const handleCreateMaint = async (data) => {
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error((await res.json()).error || '创建失败')
      await loadMaintenance()
      await fetchServices()
      setShowMaintForm(null)
      showToast('维护窗口已创建')
    } catch (e) {
      alert(e.message)
    }
  }

  const handleUpdateMaint = async (id, data) => {
    try {
      const res = await fetch(`/api/maintenance/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error((await res.json()).error || '更新失败')
      await loadMaintenance()
      await fetchServices()
      setShowMaintForm(null)
      showToast('维护窗口已更新')
    } catch (e) {
      alert(e.message)
    }
  }

  const handleDeleteMaint = async (m) => {
    if (!confirm(`确定删除维护窗口「${m.name}」？`)) return
    try {
      await fetch(`/api/maintenance/${m.id}`, { method: 'DELETE' })
      await loadMaintenance()
      await fetchServices()
      showToast('维护窗口已删除')
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: 80, right: 24, zIndex: 2000,
          padding: '12px 20px', borderRadius: 10,
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff', fontWeight: 600, fontSize: 14,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
        }}>{toast.msg}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800 }}>管理配置</h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>管理监控服务端点和维护窗口配置</p>
        </div>
        <button
          onClick={() => tab === 'services' ? setShowServiceForm({ mode: 'create' }) : setShowMaintForm({ mode: 'create' })}
          style={{
            padding: '12px 22px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(99,102,241,0.35)'
          }}>
          + {tab === 'services' ? '添加监控服务' : '创建维护窗口'}
        </button>
      </div>

      <div style={{ borderBottom: '1px solid #e5e7eb', marginTop: 16, marginBottom: 24 }}>
        <Tab active={tab === 'services'} label="服务管理" badge={services.length} onClick={() => setTab('services')} />
        <Tab active={tab === 'maintenance'} label="维护窗口" badge={maintenance.length} onClick={() => setTab('maintenance')} />
      </div>

      {tab === 'services' && (
        <div>
          {services.length === 0 && (
            <div style={{
              background: '#fff', borderRadius: 14, padding: 60, textAlign: 'center',
              color: '#6b7280', border: '2px dashed #e5e7eb'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔧</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#1f2937' }}>还没有配置任何服务</div>
              <div>点击右上角「添加监控服务」按钮开始配置</div>
            </div>
          )}

          <div style={{ display: 'grid', gap: 12 }}>
            {services.map(svc => {
              const statusColor = {
                up: '#10b981', down: '#ef4444', maintenance: '#f59e0b', unknown: '#9ca3af'
              }[svc.summary?.status] || '#9ca3af'

              return (
                <div key={svc.id} style={{
                  background: '#fff', borderRadius: 12, padding: 18,
                  border: '1px solid #e5e7eb', display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto', gap: 16,
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 12,
                    background: `${statusColor}15`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, position: 'relative'
                  }}>
                    {svc.type === 'tcp' ? '🔌' : svc.type === 'https' ? '🔒' : '🌐'}
                    <span style={{
                      position: 'absolute', bottom: 2, right: 2,
                      width: 12, height: 12, borderRadius: '50%',
                      background: statusColor, border: '2px solid #fff'
                    }} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600 }}>{svc.name}</h3>
                      {!svc.enabled && (
                        <span style={{
                          padding: '2px 8px', fontSize: 11, borderRadius: 4,
                          background: '#e5e7eb', color: '#4b5563', fontWeight: 500
                        }}>已停用</span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 12, color: '#6b7280', fontFamily: 'monospace',
                      display: 'flex', flexWrap: 'wrap', gap: 12
                    }}>
                      <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{svc.type}</span>
                      <span>→</span>
                      <span>{svc.target}{svc.type === 'tcp' && svc.port ? `:${svc.port}` : ''}</span>
                      {svc.type !== 'tcp' && <span>[{svc.method} / {svc.expectedStatus}]</span>}
                      <span style={{ color: '#9ca3af' }}>· 每{svc.interval_seconds}s · 超时{svc.timeout_ms}ms</span>
                    </div>
                    {svc.summary?.status && (
                      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: '#6b7280' }}>
                        <span>可用率: <b style={{ color: '#1f2937' }}>{(svc.summary.availability || 0).toFixed(2)}%</b></span>
                        <span>响应: <b style={{ color: '#4f46e5' }}>{svc.summary.avgResponseTime || 0}ms</b></span>
                        {svc.summary.error_message && (
                          <span style={{ color: '#dc2626' }}>错误: {svc.summary.error_message}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button
                      title="立即检测"
                      onClick={() => handleTriggerCheck(svc)}
                      style={btnIcon('⟳')}
                    />
                    <button
                      title={svc.enabled ? '停用监控' : '启用监控'}
                      onClick={() => handleToggleEnabled(svc)}
                      style={btnIcon(svc.enabled ? '⏸' : '▶')}
                    />
                    <div style={{ position: 'relative' }}>
                      <button style={{ ...btnIcon('⚑'), background: '#fff7ed', color: '#c2410c' }} title="维护"
                        onClick={e => {
                          const menu = e.currentTarget.nextSibling
                          menu.style.display = menu.style.display === 'none' ? 'block' : 'none'
                        }}
                      />
                      <div style={{
                        display: 'none', position: 'absolute', right: 0, top: '110%',
                        background: '#fff', borderRadius: 10, padding: 6,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #e5e7eb',
                        zIndex: 10, minWidth: 140
                      }}>
                        {[15, 30, 60, 240].map(m => (
                          <button key={m}
                            onClick={() => { handleQuickMaintenance(svc, m); document.querySelectorAll('[style*="display: none"]').forEach(e => { if (e.style.display !== 'none' && e !== document.body) e.style.display = 'none' }) }}
                            style={{
                              display: 'block', width: '100%', textAlign: 'left',
                              padding: '8px 12px', border: 'none', background: 'none',
                              cursor: 'pointer', borderRadius: 6, fontSize: 13
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >{m < 60 ? `${m}分钟` : `${m / 60}小时`}</button>
                        ))}
                      </div>
                    </div>
                    <button
                      title="编辑"
                      onClick={() => setShowServiceForm({ mode: 'edit', data: svc })}
                      style={{ ...btnIcon('✎'), background: '#eff6ff', color: '#2563eb' }}
                    />
                    <button
                      title="删除"
                      onClick={() => handleDeleteService(svc)}
                      style={{ ...btnIcon('✕'), background: '#fef2f2', color: '#dc2626' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'maintenance' && (
        <div>
          {maintenance.length === 0 && (
            <div style={{
              background: '#fff', borderRadius: 14, padding: 60, textAlign: 'center',
              color: '#6b7280', border: '2px dashed #e5e7eb'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🕐</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#1f2937' }}>暂无维护窗口</div>
              <div>创建维护窗口以在指定时间段内忽略服务故障</div>
            </div>
          )}

          <div style={{ display: 'grid', gap: 12 }}>
            {maintenance.map(m => {
              const now = moment()
              const start = moment(m.start_time)
              const end = moment(m.end_time)
              const isActive = m.active && now >= start && now <= end
              const isPast = now > end
              const isFuture = now < start
              const svc = services.find(s => s.id === m.service_id)

              const status = isActive ? { label: '进行中', color: '#10b981', bg: '#d1fae5' }
                : isFuture ? { label: '即将开始', color: '#2563eb', bg: '#dbeafe' }
                : isPast ? { label: '已结束', color: '#6b7280', bg: '#f3f4f6' }
                : { label: '已停用', color: '#9ca3af', bg: '#f3f4f6' }

              return (
                <div key={m.id} style={{
                  background: '#fff', borderRadius: 12, padding: 18,
                  border: '1px solid #e5e7eb', display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto', gap: 16,
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 12,
                    background: `${status.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22
                  }}>⚙</div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600 }}>{m.name}</h3>
                      <span style={{
                        padding: '3px 10px', fontSize: 11, borderRadius: 999,
                        background: status.bg, color: status.color, fontWeight: 600
                      }}>{status.label}</span>
                      {svc && (
                        <span style={{
                          padding: '3px 10px', fontSize: 11, borderRadius: 6,
                          background: '#f3f4f6', color: '#4b5563'
                        }}>{svc.name}</span>
                      )}
                      {!svc && (
                        <span style={{
                          padding: '3px 10px', fontSize: 11, borderRadius: 6,
                          background: '#ede9fe', color: '#6d28d9'
                        }}>全部服务</span>
                      )}
                    </div>
                    {m.description && <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{m.description}</div>}
                    <div style={{ fontSize: 12, color: '#4b5563', fontFamily: 'monospace' }}>
                      🕐 {start.format('YYYY-MM-DD HH:mm')} → {end.format('YYYY-MM-DD HH:mm')}
                      <span style={{ color: '#9ca3af', marginLeft: 12 }}>
                        (共 {Math.round(end.diff(start, 'minutes'))} 分钟)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      title="编辑"
                      onClick={() => setShowMaintForm({ mode: 'edit', data: m })}
                      style={{ ...btnIcon('✎'), background: '#eff6ff', color: '#2563eb' }}
                    />
                    <button
                      title={m.active ? '停用' : '启用'}
                      onClick={() => handleUpdateMaint(m.id, { active: m.active ? 0 : 1 })}
                      style={{ ...btnIcon(m.active ? '⏸' : '▶') }}
                    />
                    <button
                      title="删除"
                      onClick={() => handleDeleteMaint(m)}
                      style={{ ...btnIcon('✕'), background: '#fef2f2', color: '#dc2626' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showServiceForm && (
        <Modal
          title={showServiceForm.mode === 'create' ? '添加监控服务' : '编辑服务配置'}
          onClose={() => setShowServiceForm(null)}
        >
          <ServiceForm
            initial={showServiceForm.data}
            onSubmit={showServiceForm.mode === 'create'
              ? handleCreateService
              : (data) => handleUpdateService(showServiceForm.data.id, data)
            }
            onCancel={() => setShowServiceForm(null)}
          />
        </Modal>
      )}

      {showMaintForm && (
        <Modal
          title={showMaintForm.mode === 'create' ? '创建维护窗口' : '编辑维护窗口'}
          onClose={() => setShowMaintForm(null)}
        >
          <MaintenanceForm
            initial={showMaintForm.data}
            services={services}
            onSubmit={showMaintForm.mode === 'create'
              ? handleCreateMaint
              : (data) => handleUpdateMaint(showMaintForm.data.id, data)
            }
            onCancel={() => setShowMaintForm(null)}
          />
        </Modal>
      )}
    </div>
  )
}

function btnIcon(icon) {
  return {
    width: 36, height: 36, borderRadius: 8, border: 'none',
    background: '#f3f4f6', cursor: 'pointer', fontSize: 16,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s'
  }
}
