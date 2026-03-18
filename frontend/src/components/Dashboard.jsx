import React, { useState, useMemo } from 'react';
import WidgetRenderer from './WidgetRenderer';

export default function Dashboard({ orders, widgets, onConfigure }) {
  const [dateFilter, setDateFilter] = useState('all');

  const filteredOrders = useMemo(() => {
    if (dateFilter === 'all') return orders;
    const now = new Date();
    const days = parseInt(dateFilter);
    return orders.filter(o => {
      const d = new Date(o.date || o.createdAt);
      const diff = (now - d) / (1000 * 60 * 60 * 24);
      return dateFilter === 'today' ? diff < 1 : diff <= days;
    });
  }, [orders, dateFilter]);

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="dash-toolbar">
        <span className="dash-title">Dashboard</span>
        <div className="filter-group">
          <span className="filter-label">Show data for</span>
          <div className="select-wrap">
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
        </div>
        <button className="btn btn-outline" style={{ marginLeft: 'auto' }} onClick={onConfigure}>⚙ Configure Dashboard</button>
      </div>

      {widgets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">No widgets configured</div>
          <div className="empty-sub">Build your personalized dashboard by adding charts, KPIs, and tables to visualize your data.</div>
          <button className="btn btn-primary" onClick={onConfigure}>⚙ Configure Dashboard</button>
        </div>
      ) : (
        <div className="canvas-wrap">
          <div className="canvas-grid">
            {widgets.map(w => (
              <div key={w.id} className="widget-card" style={{ '--widget-w': Math.min(w.w, 12), '--widget-h': Math.max(1, Math.min(w.h, 8)), minHeight: `${Math.max(1, Math.min(w.h, 8)) * 60}px` }}>
                <div className="card-header">
                  <span className="card-title">{w.title || 'Untitled'}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                    {{ bar: 'Bar Chart', line: 'Line Chart', pie: 'Pie Chart', area: 'Area Chart', scatter: 'Scatter Plot', table: 'Table', kpi: 'KPI' }[w.type]}
                  </span>
                </div>
                {w.desc && <div className="card-desc">{w.desc}</div>}
                <div className="card-body" style={{ padding: 0 }}>
                  <WidgetRenderer w={w} orders={filteredOrders} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
