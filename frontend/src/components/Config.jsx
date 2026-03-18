import React, { useState } from 'react';
import WidgetRenderer from './WidgetRenderer';

export default function Config({ widgets: initialWidgets, onSave, onBack }) {
  const [widgets, setWidgets] = useState([...initialWidgets]);
  const [dragType, setDragType] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeWidgetId, setActiveWidgetId] = useState(null);

  const activeWidget = widgets.find(w => w.id === activeWidgetId) || null;

  const onDragStart = (e, type) => {
    setDragType(type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const onDragLeave = (e) => {
    setIsDragOver(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!dragType) return;

    const defaults = {
      bar: { title: 'Bar Chart', w: 5, h: 5, config: { xAxis: 'Product', yAxis: 'Total amount', color: '#4f9ef8', showLabel: false } },
      line: { title: 'Line Chart', w: 5, h: 5, config: { xAxis: 'Product', yAxis: 'Total amount', color: '#7c5cfc', showLabel: false } },
      pie: { title: 'Pie Chart', w: 4, h: 4, config: { chartData: 'Product', showLegend: true } },
      area: { title: 'Area Chart', w: 5, h: 5, config: { xAxis: 'Product', yAxis: 'Total amount', color: '#34d399', showLabel: false } },
      scatter: { title: 'Scatter Plot', w: 5, h: 5, config: { xAxis: 'Quantity', yAxis: 'Total amount', color: '#f59e0b', showLabel: false } },
      table: { title: 'Orders Table', w: 4, h: 4, config: { columns: ['Customer name','Product','Total amount','Status'], sortBy: '', pagination: 10, fontSize: 14, headerBg: '#54bd95', filters: [] } },
      kpi: { title: 'KPI Value', w: 2, h: 2, config: { metric: 'Total amount', aggregation: 'Sum', format: 'Currency', precision: 0 } }
    };

    const d = defaults[dragType];
    const newWidget = {
      id: Date.now(), // Unique temporary ID
      type: dragType,
      title: d.title,
      desc: '',
      w: d.w,
      h: d.h,
      config: { ...d.config }
    };
    
    setWidgets(prev => [...prev, newWidget]);
    setActiveWidgetId(newWidget.id);
    setDragType(null);
  };

  const updateWidget = (id, key, val) => {
    setWidgets(prev => prev.map(w => {
      if (w.id !== id) return w;
      let newVal = val;
      if (key === 'w') newVal = Math.max(1, Math.min(12, parseInt(val) || 1));
      if (key === 'h') newVal = Math.max(1, parseInt(val) || 1);
      return { ...w, [key]: newVal };
    }));
  };

  const updateConfig = (id, key, val) => {
    setWidgets(prev => prev.map(w => {
      if (w.id !== id) return w;
      return { ...w, config: { ...w.config, [key]: val } };
    }));
  };

  const deleteWidget = (id) => {
    if(!window.confirm("Remove this widget?")) return;
    setWidgets(prev => prev.filter(w => w.id !== id));
    if (activeWidgetId === id) setActiveWidgetId(null);
  };

  const toggleColumn = (id, col, checked) => {
    setWidgets(prev => prev.map(w => {
      if (w.id !== id) return w;
      let cols = [...(w.config.columns || [])];
      if (checked) { if (!cols.includes(col)) cols.push(col); }
      else { cols = cols.filter(c => c !== col); }
      return { ...w, config: { ...w.config, columns: cols } };
    }));
  };

  const updateTableFilter = (id, idx, key, val) => {
    setWidgets(prev => prev.map(w => {
      if (w.id !== id) return w;
      const filters = [...(w.config.filters || [])];
      filters[idx] = { ...filters[idx], [key]: val };
      return { ...w, config: { ...w.config, filters } };
    }));
  };

  const addTableFilter = (id) => {
    setWidgets(prev => prev.map(w => {
      if (w.id !== id) return w;
      return { ...w, config: { ...w.config, filters: [...(w.config.filters || []), { field: 'Status', value: '' }] } };
    }));
  };

  const removeTableFilter = (id, idx) => {
    setWidgets(prev => prev.map(w => {
      if (w.id !== id) return w;
      const filters = [...(w.config.filters || [])];
      filters.splice(idx, 1);
      return { ...w, config: { ...w.config, filters } };
    }));
  };

  const axisOpts = ['Product','Quantity','Unit price','Total amount','Status','Created by','Duration'];
  const metricOpts = ['Customer ID','Customer name','Email id','Address','Order date','Product','Created by','Status','Total amount','Unit price','Quantity'];
  const colOpts = ['Customer ID','Customer name','Email id','Phone number','Address','Order ID','Order date','Product','Quantity','Unit price','Total amount','Status','Created by'];

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="config-toolbar">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <span className="config-info">Drag widgets from the sidebar onto the canvas &nbsp;·&nbsp; <strong>{widgets.length} widgets</strong></span>
        <button className="btn btn-success" style={{ marginLeft: 'auto' }} onClick={() => onSave(widgets)}>💾 Save Configuration</button>
      </div>

      <div className="config-layout">
        {/* Sidebar */}
        <div className="config-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label"><span>📈</span> Charts</div>
            <div className="widget-item" draggable onDragStart={(e) => onDragStart(e, 'bar')}>
              <span className="wi-icon wi-bar">▊</span> Bar Chart
            </div>
            <div className="widget-item" draggable onDragStart={(e) => onDragStart(e, 'line')}>
              <span className="wi-icon wi-line">〜</span> Line Chart
            </div>
            <div className="widget-item" draggable onDragStart={(e) => onDragStart(e, 'pie')}>
              <span className="wi-icon wi-pie">◔</span> Pie Chart
            </div>
            <div className="widget-item" draggable onDragStart={(e) => onDragStart(e, 'area')}>
              <span className="wi-icon wi-area">∧</span> Area Chart
            </div>
            <div className="widget-item" draggable onDragStart={(e) => onDragStart(e, 'scatter')}>
              <span className="wi-icon wi-scatter">⁘</span> Scatter Plot
            </div>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label"><span>⊞</span> Tables</div>
            <div className="widget-item" draggable onDragStart={(e) => onDragStart(e, 'table')}>
              <span className="wi-icon wi-table">⊞</span> Table
            </div>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label"><span>◈</span> KPIs</div>
            <div className="widget-item" draggable onDragStart={(e) => onDragStart(e, 'kpi')}>
              <span className="wi-icon wi-kpi">◈</span> KPI Value
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="config-canvas-wrap" onDragOver={onDragOver} onDrop={onDrop} onDragLeave={onDragLeave}>
          <div className={`config-canvas ${isDragOver ? 'drag-over' : ''}`}>
            {widgets.length === 0 ? (
              <div className="drop-placeholder" style={{ display: 'flex' }}>
                ✦ Drop widgets here to build your dashboard
              </div>
            ) : (
              widgets.map(w => (
                <div key={`cfg-widget-${w.id}`} className="widget-card" style={{ gridColumn: `span ${Math.min(w.w, 12)}`, gridRow: `span ${Math.max(1, Math.min(w.h, 6))}`, minHeight: `${w.h * 60}px` }}>
                  <div className="card-hover-actions">
                    <div className="icon-btn" onClick={() => setActiveWidgetId(w.id)} title="Settings">⚙</div>
                    <div className="icon-btn danger" onClick={() => deleteWidget(w.id)} title="Delete">✕</div>
                  </div>
                  <div className="card-header">
                    <span className="card-title">{w.title || 'Untitled'}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                      {{ bar: 'Bar Chart', line: 'Line Chart', pie: 'Pie Chart', area: 'Area Chart', scatter: 'Scatter Plot', table: 'Table', kpi: 'KPI' }[w.type]}
                    </span>
                  </div>
                  {w.desc && <div className="card-desc">{w.desc}</div>}
                  <div className="card-body" style={{ padding: 0 }}>
                    <WidgetRenderer w={w} orders={[]} isConfig={true} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Settings Panel */}
        <div className={`settings-panel ${activeWidget ? 'open' : ''}`}>
          <div className="panel-header">
            <span className="panel-title">Widget Settings</span>
            <button className="icon-btn" onClick={() => setActiveWidgetId(null)}>✕</button>
          </div>
          <div className="panel-body">
            {activeWidget && (
              <>
                <div className="form-section">
                  <div className="form-section-title">General</div>
                  <div className="form-row">
                    <label>Widget Title</label>
                    <input type="text" value={activeWidget.title || ''} onChange={(e) => updateWidget(activeWidget.id, 'title', e.target.value)} />
                  </div>
                  <div className="form-row">
                    <label>Description</label>
                    <textarea value={activeWidget.desc || ''} onChange={(e) => updateWidget(activeWidget.id, 'desc', e.target.value)} />
                  </div>
                </div>
                
                <div className="form-section">
                  <div className="form-section-title">Widget Size</div>
                  <div className="form-row-inline">
                    <div className="form-row">
                      <label>Width (Cols)</label>
                      <input type="number" min="1" max="12" value={activeWidget.w || 5} onChange={(e) => updateWidget(activeWidget.id, 'w', e.target.value)} />
                    </div>
                    <div className="form-row">
                      <label>Height (Rows)</label>
                      <input type="number" min="1" max="10" value={activeWidget.h || 5} onChange={(e) => updateWidget(activeWidget.id, 'h', e.target.value)} />
                    </div>
                  </div>
                </div>

                {activeWidget.type === 'kpi' && (
                  <div className="form-section">
                    <div className="form-section-title">Data Settings</div>
                    <div className="form-row">
                      <label>Select Metric</label>
                      <select className="select" value={activeWidget.config.metric || ''} onChange={(e) => updateConfig(activeWidget.id, 'metric', e.target.value)}>
                        {metricOpts.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="form-row">
                      <label>Aggregation</label>
                      <select className="select" value={activeWidget.config.aggregation || 'Sum'} onChange={(e) => updateConfig(activeWidget.id, 'aggregation', e.target.value)}>
                        {['Sum', 'Average', 'Count'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="form-row">
                      <label>Data Format</label>
                      <select className="select" value={activeWidget.config.format || 'Number'} onChange={(e) => updateConfig(activeWidget.id, 'format', e.target.value)}>
                        {['Number', 'Currency'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {['bar','line','area','scatter'].includes(activeWidget.type) && (
                  <div className="form-section">
                    <div className="form-section-title">Data Settings</div>
                    <div className="form-row">
                      <label>X-Axis Data</label>
                      <select className="select" value={activeWidget.config.xAxis || 'Product'} onChange={(e) => updateConfig(activeWidget.id, 'xAxis', e.target.value)}>
                        {axisOpts.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="form-row">
                      <label>Y-Axis Data</label>
                      <select className="select" value={activeWidget.config.yAxis || 'Total amount'} onChange={(e) => updateConfig(activeWidget.id, 'yAxis', e.target.value)}>
                        {axisOpts.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="form-row" style={{ marginTop: '10px' }}>
                      <label>Chart Color</label>
                      <div className="hex-input-group">
                        <input type="color" value={activeWidget.config.color || '#4f9ef8'} onChange={(e) => updateConfig(activeWidget.id, 'color', e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

                {activeWidget.type === 'pie' && (
                  <div className="form-section">
                    <div className="form-section-title">Data Settings</div>
                    <div className="form-row">
                      <label>Chart Data</label>
                      <select className="select" value={activeWidget.config.chartData || 'Product'} onChange={(e) => updateConfig(activeWidget.id, 'chartData', e.target.value)}>
                        {['Product','Quantity','Unit price','Total amount','Status','Created by'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="checkbox-row" style={{ marginTop: '10px' }}>
                      <input type="checkbox" id="showLeg" checked={activeWidget.config.showLegend || false} onChange={(e) => updateConfig(activeWidget.id, 'showLegend', e.target.checked)} />
                      <label htmlFor="showLeg">Show Legend</label>
                    </div>
                  </div>
                )}

                {activeWidget.type === 'table' && (
                  <div className="form-section">
                    <div className="form-section-title">Data Settings</div>
                    <div className="form-row">
                      <label>Choose Columns</label>
                      <div className="multiselect-wrap">
                        {colOpts.map(c => (
                          <div key={c} className="ms-item">
                            <input type="checkbox" id={`col-${c}`} checked={(activeWidget.config.columns || []).includes(c)} onChange={(e) => toggleColumn(activeWidget.id, c, e.target.checked)} />
                            <label htmlFor={`col-${c}`}>{c}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="form-row" style={{ marginTop: '10px' }}>
                      <label>Sort By</label>
                      <select className="select" value={activeWidget.config.sortBy || ''} onChange={(e) => updateConfig(activeWidget.id, 'sortBy', e.target.value)}>
                        <option value="">None</option>
                        {['Ascending','Descending','Order date'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="form-row" style={{ marginTop: '10px' }}>
                      <label>Pagination</label>
                      <select className="select" value={activeWidget.config.pagination || 10} onChange={(e) => updateConfig(activeWidget.id, 'pagination', Number(e.target.value))}>
                        {[5, 10, 15].map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="checkbox-row" style={{ marginTop: '10px' }}>
                      <input type="checkbox" id="showFilt" checked={(activeWidget.config.filters && activeWidget.config.filters.length > 0) || false} onChange={(e) => {
                        if (e.target.checked) {
                          updateConfig(activeWidget.id, 'filters', [{field: 'Status', value: ''}]);
                        } else {
                          updateConfig(activeWidget.id, 'filters', []);
                        }
                      }} />
                      <label htmlFor="showFilt">Apply Filter</label>
                    </div>
                    {(activeWidget.config.filters && activeWidget.config.filters.length > 0) && (
                      <div className="filter-builder" style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {activeWidget.config.filters.map((f, i) => (
                          <div key={i} className="filter-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) auto', gap: '6px' }}>
                            <select className="select" value={f.field} onChange={(e) => updateTableFilter(activeWidget.id, i, 'field', e.target.value)} style={{width:'100%', minWidth:'0'}}>
                              {colOpts.map(c => <option key={c}>{c}</option>)}
                            </select>
                            <input type="text" value={f.value} placeholder="Value" onChange={(e) => updateTableFilter(activeWidget.id, i, 'value', e.target.value)} style={{width:'100%', padding:'7px', minWidth:'0'}} />
                            <button className="btn btn-xs danger" style={{background: 'rgba(248,92,120,.1)', color: 'var(--accent3)', borderColor: 'var(--accent3)'}} onClick={() => removeTableFilter(activeWidget.id, i)}>✕</button>
                          </div>
                        ))}
                        <button className="btn btn-ghost btn-sm" onClick={() => addTableFilter(activeWidget.id)}>+ Add Filter</button>
                      </div>
                    )}
                    <div className="form-row" style={{ marginTop: '10px' }}>
                      <label>Header Background</label>
                      <input type="color" className="select" value={activeWidget.config.headerBg || '#54bd95'} onChange={(e) => updateConfig(activeWidget.id, 'headerBg', e.target.value)} />
                    </div>
                  </div>
                )}

                <button className="btn btn-danger btn-sm" onClick={() => deleteWidget(activeWidget.id)} style={{ marginTop: '10px' }}>🗑 Remove Widget</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
