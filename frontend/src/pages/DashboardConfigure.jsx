import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Responsive as ResponsiveGridLayout, WidthProvider } from 'react-grid-layout/legacy';

const Responsive = WidthProvider(ResponsiveGridLayout);
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter, PieChart, Pie, Cell
} from 'recharts';

const API_BASE_URL = 'http://localhost:5000/api';
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const DUMMY_DATA = [
  { name: 'A', value: 400 },
  { name: 'B', value: 300 },
  { name: 'C', value: 600 },
  { name: 'D', value: 800 },
  { name: 'E', value: 500 },
];

const WIDGET_TEMPLATES = [
  { type: 'kpi',     label: 'KPI Card',    description: 'Single metric value',  defaultW: 3,  defaultH: 2, icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { type: 'bar',     label: 'Bar Chart',   description: 'Compare categories',   defaultW: 5,  defaultH: 5, icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { type: 'line',    label: 'Line Chart',  description: 'Trends over time',     defaultW: 5,  defaultH: 5, icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
  { type: 'area',    label: 'Area Chart',  description: 'Volume trends',         defaultW: 5,  defaultH: 5, icon: 'M3 13l4-4 4 4 4-4 6 6v3H3v-5z' },
  { type: 'scatter', label: 'Scatter Plot',description: 'Data distribution',     defaultW: 5,  defaultH: 5, icon: 'M4 6h16M4 12h6m-6 6h6m6-6h.01M16 18h.01M16 12h.01' },
  { type: 'pie',     label: 'Pie Chart',   description: 'Proportions',           defaultW: 4,  defaultH: 4, icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z' },
  { type: 'table',   label: 'Data Table',  description: 'Detailed records',      defaultW: 4,  defaultH: 4, icon: 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' }
];

// Spec-exact field options
const KPI_METRICS = [
  'Customer ID', 'Customer name', 'Email id', 'Address', 'Order date',
  'Product', 'Created by', 'Status', 'Total amount', 'Unit price', 'Quantity'
];
const AXIS_OPTS   = ['Product', 'Quantity', 'Unit price', 'Total amount', 'Status', 'Created by', 'Duration'];
const PIE_DATA_OPTS = ['Product', 'Quantity', 'Unit price', 'Total amount', 'Status', 'Created by'];
const COL_OPTS    = [
  'Customer ID', 'Customer name', 'Email id', 'Phone number', 'Address',
  'Order ID', 'Order date', 'Product', 'Quantity', 'Unit price', 'Total amount',
  'Status', 'Created by'
];
const AGGREGATIONS = ['Sum', 'Average', 'Count'];

const getDefaultConfigForType = (type) => {
  switch (type) {
    case 'kpi':
      return { metric: 'Total amount', aggregation: 'Sum', format: 'Currency', precision: 0 };
    case 'table':
      return {
        columns: ['Customer name', 'Product', 'Total amount', 'Status'],
        sortBy: '', pagination: 10, fontSize: 14, headerBg: '#54bd95',
        filters: []
      };
    case 'pie':
      return { chartData: 'Product', showLegend: true };
    default:
      return { xAxis: 'Product', yAxis: 'Total amount', color: '#4f9ef8', showLabel: false };
  }
};

const renderWidgetPreview = (widget) => {
  const { type, config = {} } = widget;
  const color = config.color || '#3b82f6';

  if (type === 'kpi') {
    return (
      <div className="flex items-center justify-center h-full w-full flex-col gap-1">
        <span className="text-3xl font-black text-slate-100 opacity-90">$12,345</span>
        <span className="text-xs text-slate-500 uppercase tracking-widest">{config.metric || 'Total amount'}</span>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="w-full h-full p-3 overflow-hidden text-slate-400 text-xs font-mono">
        <div className="flex justify-between border-b border-slate-700 pb-2 mb-2 font-bold text-slate-300">
          <span>Name</span><span>Product</span><span>Total</span><span>Status</span>
        </div>
        {['Alice', 'Bob', 'Carol'].map(n => (
          <div key={n} className="flex justify-between py-1">
            <span>{n}</span><span>Fiber</span><span>$99</span><span className="text-emerald-400">Done</span>
          </div>
        ))}
      </div>
    );
  }

  const commonProps = { data: DUMMY_DATA, margin: { top: 10, right: 10, left: -20, bottom: 0 } };

  let ChartComponent;
  switch (type) {
    case 'bar':
      ChartComponent = (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
          <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} />
          <YAxis tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      ); break;
    case 'line':
      ChartComponent = (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
          <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} />
          <YAxis tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{r: 4, fill: color, strokeWidth: 0}} />
        </LineChart>
      ); break;
    case 'area':
      ChartComponent = (
        <AreaChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
          <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} />
          <YAxis tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} />
          <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.2} strokeWidth={2} />
        </AreaChart>
      ); break;
    case 'scatter':
      ChartComponent = (
        <ScatterChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 10}} />
          <YAxis dataKey="value" tick={{fill: '#64748b', fontSize: 10}} />
          <Scatter name="Data" data={DUMMY_DATA} fill={color} />
        </ScatterChart>
      ); break;
    case 'pie':
      ChartComponent = (
        <PieChart>
          <Pie data={DUMMY_DATA} cx="50%" cy="50%" labelLine={false} outerRadius={60} fill="#8884d8" dataKey="value">
            {DUMMY_DATA.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      ); break;
    default:
      ChartComponent = <div className="text-slate-500 text-xs text-center w-full mt-10">Preview not available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      {ChartComponent}
    </ResponsiveContainer>
  );
};

const DashboardConfigure = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [widgets, setWidgets] = useState([]);
  const [layouts, setLayouts] = useState({ lg: [], md: [], sm: [] });

  // Side panel state
  const [activeWidget, setActiveWidget] = useState(null);

  const getToken = () => localStorage.getItem('token') || '';

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/dashboard`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.data.success && res.data.data) {
        const data = res.data.data;
        setWidgets(data.widgets || []);
        if (data.layout && data.layout.lg) {
          setLayouts(data.layout);
        } else {
          const constructed = (data.widgets || []).map(w => ({
            i: w.widgetId, x: w.posX, y: w.posY, w: w.width, h: w.height
          }));
          setLayouts({ lg: constructed, md: constructed, sm: constructed });
        }
      }
    } catch (err) {
      toast.error('Failed to load dashboard config');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const currentLg = layouts.lg || [];
      const updatedWidgets = widgets.map((w, i) => {
        const li = currentLg.find(l => l.i === w.widgetId);
        let x = w.posX ?? (i * 4) % 12;
        let y = w.posY ?? Math.floor(i / 3) * 4;
        let ww = w.width  ?? 4;
        let h  = w.height ?? 4;
        if (li) {
          x  = li.x ?? x;
          y  = li.y === Infinity || li.y == null ? y : li.y;
          ww = li.w ?? ww;
          h  = li.h ?? h;
        }
        return { ...w, posX: x, posY: y, width: ww, height: h };
      });

      const safeLayouts = { lg: [], md: [], sm: [] };
      ['lg', 'md', 'sm'].forEach(bp => {
        if (layouts[bp]) {
          safeLayouts[bp] = layouts[bp].map(item => ({
            ...item,
            x: item.x ?? 0,
            y: item.y === Infinity || item.y == null ? 0 : item.y,
            w: item.w ?? 4,
            h: item.h ?? 4
          }));
        }
      });

      await axios.post(`${API_BASE_URL}/dashboard/save`, {
        widgets: updatedWidgets,
        layout: safeLayouts
      }, { headers: { 'Authorization': `Bearer ${getToken()}` } });

      toast.success('Dashboard published successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to save dashboard.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const onLayoutChange = (layout, allLayouts) => setLayouts(allLayouts);

  const onDrop = (layout, layoutItem, _event) => {
    try {
      const dataStr = _event.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const template = JSON.parse(dataStr);
      const newWidgetId = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const newWidget = {
        widgetId: newWidgetId,
        type: template.type,
        title: 'Untitled',
        description: '',
        width: template.defaultW,
        height: template.defaultH,
        posX: layoutItem.x,
        posY: layoutItem.y,
        config: getDefaultConfigForType(template.type)
      };
      setWidgets(prev => [...prev, newWidget]);
      setActiveWidget(JSON.parse(JSON.stringify(newWidget)));
    } catch (e) {
      console.error('Drop error:', e);
    }
  };

  const removeWidget = (widgetId) => {
    setWidgets(prev => prev.filter(w => w.widgetId !== widgetId));
    if (activeWidget?.widgetId === widgetId) setActiveWidget(null);
  };

  const openPanel = (widgetId) => {
    const target = widgets.find(w => w.widgetId === widgetId);
    if (target) setActiveWidget(JSON.parse(JSON.stringify(target)));
  };

  const applyConfig = () => {
    if (!activeWidget) return;
    // Apply w/h from config to layout as well
    setWidgets(prev => prev.map(w => {
      if (w.widgetId !== activeWidget.widgetId) return w;
      const updated = { ...activeWidget };
      // Sync width/height from panel size fields → grid
      if (updated._panelW) { updated.width  = updated._panelW; delete updated._panelW; }
      if (updated._panelH) { updated.height = updated._panelH; delete updated._panelH; }
      return updated;
    }));
    // Also update layouts if size changed
    const aw = activeWidget;
    if (aw._panelW || aw._panelH) {
      setLayouts(prev => {
        const newLayouts = { ...prev };
        ['lg', 'md', 'sm'].forEach(bp => {
          newLayouts[bp] = (prev[bp] || []).map(l => {
            if (l.i !== aw.widgetId) return l;
            return {
              ...l,
              w: aw._panelW || l.w,
              h: aw._panelH || l.h
            };
          });
        });
        return newLayouts;
      });
    }
    setActiveWidget(null);
  };

  const handleFieldChange = (key, value) => {
    setActiveWidget(prev => ({ ...prev, [key]: value }));
  };

  const handleConfigChange = (key, value) => {
    setActiveWidget(prev => ({
      ...prev,
      config: { ...prev.config, [key]: value }
    }));
  };

  const updateTableFilter = (idx, key, val) => {
    setActiveWidget(prev => {
      const filters = [...(prev.config.filters || [])];
      filters[idx] = { ...filters[idx], [key]: val };
      return { ...prev, config: { ...prev.config, filters } };
    });
  };

  const addTableFilter = () => {
    setActiveWidget(prev => ({
      ...prev,
      config: {
        ...prev.config,
        filters: [...(prev.config.filters || []), { field: 'Status', value: '' }]
      }
    }));
  };

  const removeTableFilter = (idx) => {
    setActiveWidget(prev => {
      const filters = [...(prev.config.filters || [])];
      filters.splice(idx, 1);
      return { ...prev, config: { ...prev.config, filters } };
    });
  };

  const toggleColumn = (col, checked) => {
    setActiveWidget(prev => {
      let cols = [...(prev.config.columns || [])];
      if (checked) { if (!cols.includes(col)) cols.push(col); }
      else { cols = cols.filter(c => c !== col); }
      return { ...prev, config: { ...prev.config, columns: cols } };
    });
  };

  /* ── CONFIG PANEL FIELDS ── */
  const renderPanelBody = () => {
    if (!activeWidget) return null;
    const { type, config } = activeWidget;

    const typeLabel = {
      kpi: 'KPI', bar: 'Bar Chart', line: 'Line Chart', area: 'Area Chart',
      scatter: 'Scatter Plot', pie: 'Pie Chart', table: 'Data Table'
    }[type] || type;

    // Determine current width/height from layouts
    const currentLg = layouts.lg || [];
    const llItem = currentLg.find(l => l.i === activeWidget.widgetId);
    const currentW = activeWidget._panelW ?? llItem?.w ?? activeWidget.width ?? 4;
    const currentH = activeWidget._panelH ?? llItem?.h ?? activeWidget.height ?? 4;

    return (
      <>
        {/* General Section */}
        <div className="panel-section">
          <div className="panel-section-title">General</div>
          <div className="form-group">
            <label className="form-label">Widget Title</label>
            <input
              type="text"
              value={activeWidget.title || ''}
              onChange={e => handleFieldChange('title', e.target.value)}
              className="form-input"
              placeholder="Untitled"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Widget Type</label>
            <input type="text" value={typeLabel} readOnly className="form-input"
              style={{ background: '#f1f5f9', cursor: 'default', color: 'var(--color-text-secondary)' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={activeWidget.description || ''}
              onChange={e => handleFieldChange('description', e.target.value)}
              className="form-textarea"
              placeholder="Optional description"
              rows={2}
            />
          </div>
        </div>

        {/* Widget Size */}
        <div className="panel-section">
          <div className="panel-section-title">Widget Size</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Width (Columns)</label>
              <input type="number" min="1" max="12"
                value={currentW}
                onChange={e => handleFieldChange('_panelW', Math.max(1, Math.min(12, Number(e.target.value))))}
                className="form-input"
              />
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3, display: 'block' }}>Value not less than 1</span>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Height (Rows)</label>
              <input type="number" min="1"
                value={currentH}
                onChange={e => handleFieldChange('_panelH', Math.max(1, Number(e.target.value)))}
                className="form-input"
              />
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3, display: 'block' }}>Value not less than 1</span>
            </div>
          </div>
        </div>

        {/* KPI Settings */}
        {type === 'kpi' && (
          <div className="panel-section">
            <div className="panel-section-title">Data Settings</div>
            <div className="form-group">
              <label className="form-label">Select Metric</label>
              <select value={config.metric || 'Total amount'} onChange={e => handleConfigChange('metric', e.target.value)} className="form-select">
                {KPI_METRICS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Aggregation</label>
              <select value={config.aggregation || 'Sum'} onChange={e => handleConfigChange('aggregation', e.target.value)} className="form-select">
                {AGGREGATIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Data Format</label>
              <select value={config.format || 'Number'} onChange={e => handleConfigChange('format', e.target.value)} className="form-select">
                <option value="Number">Number</option>
                <option value="Currency">Currency</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Decimal Precision</label>
              <input type="number" min="0" value={config.precision ?? 0}
                onChange={e => handleConfigChange('precision', Math.max(0, Number(e.target.value)))}
                className="form-input" />
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3, display: 'block' }}>Value not less than 0</span>
            </div>
          </div>
        )}

        {/* Bar / Line / Area / Scatter Chart Settings */}
        {['bar', 'line', 'area', 'scatter'].includes(type) && (
          <div className="panel-section">
            <div className="panel-section-title">Data Settings</div>
            <div className="form-group">
              <label className="form-label">X-Axis Data</label>
              <select value={config.xAxis || 'Product'} onChange={e => handleConfigChange('xAxis', e.target.value)} className="form-select">
                {AXIS_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Y-Axis Data</label>
              <select value={config.yAxis || 'Total amount'} onChange={e => handleConfigChange('yAxis', e.target.value)} className="form-select">
                {AXIS_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="panel-section-title" style={{ marginTop: 16 }}>Styling</div>
            <div className="form-group">
              <label className="form-label">Chart Color</label>
              <div className="color-picker-wrapper">
                <div className="color-swatch">
                  <input type="color" value={config.color || '#4f9ef8'}
                    onChange={e => handleConfigChange('color', e.target.value)} />
                </div>
                <input type="text" value={config.color || '#4f9ef8'}
                  onChange={e => handleConfigChange('color', e.target.value)}
                  className="form-input" placeholder="#4f9ef8" style={{ flex: 1 }} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={!!config.showLabel}
                  onChange={e => handleConfigChange('showLabel', e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--color-primary)', cursor: 'pointer' }} />
                <span className="form-label" style={{ margin: 0 }}>Show data label</span>
              </label>
            </div>
          </div>
        )}

        {/* Pie Chart Settings */}
        {type === 'pie' && (
          <div className="panel-section">
            <div className="panel-section-title">Data Settings</div>
            <div className="form-group">
              <label className="form-label">Choose chart data</label>
              <select value={config.chartData || 'Product'} onChange={e => handleConfigChange('chartData', e.target.value)} className="form-select">
                {PIE_DATA_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={!!config.showLegend}
                  onChange={e => handleConfigChange('showLegend', e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--color-primary)', cursor: 'pointer' }} />
                <span className="form-label" style={{ margin: 0 }}>Show Legend</span>
              </label>
            </div>
          </div>
        )}

        {/* Table Settings */}
        {type === 'table' && (
          <div className="panel-section">
            <div className="panel-section-title">Data Settings</div>
            <div className="form-group">
              <label className="form-label">Choose Columns</label>
              <div style={{ border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto', background: '#f8fafc' }}>
                {COL_OPTS.map(col => (
                  <label key={col} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', userSelect: 'none' }}>
                    <input type="checkbox"
                      checked={(config.columns || []).includes(col)}
                      onChange={e => toggleColumn(col, e.target.checked)}
                      style={{ width: 15, height: 15, accentColor: 'var(--color-primary)', cursor: 'pointer' }} />
                    {col}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Sort By</label>
              <select value={config.sortBy || ''} onChange={e => handleConfigChange('sortBy', e.target.value)} className="form-select">
                <option value="">None</option>
                {['Ascending', 'Descending', 'Order date'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Pagination</label>
              <select value={config.pagination || 10} onChange={e => handleConfigChange('pagination', Number(e.target.value))} className="form-select">
                {[5, 10, 15].map(n => <option key={n} value={n}>{n} rows / page</option>)}
              </select>
            </div>
            {/* Apply Filter */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none', marginBottom: 10 }}>
                <input type="checkbox"
                  checked={(config.filters || []).length > 0}
                  onChange={e => handleConfigChange('filters', e.target.checked ? [{ field: 'Status', value: '' }] : [])}
                  style={{ width: 16, height: 16, accentColor: 'var(--color-primary)', cursor: 'pointer' }} />
                <span className="form-label" style={{ margin: 0 }}>Apply Filter</span>
              </label>
              {(config.filters || []).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(config.filters || []).map((f, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6 }}>
                      <select className="form-select" value={f.field}
                        onChange={e => updateTableFilter(i, 'field', e.target.value)}>
                        {COL_OPTS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input type="text" className="form-input" value={f.value} placeholder="Value"
                        onChange={e => updateTableFilter(i, 'value', e.target.value)} />
                      <button onClick={() => removeTableFilter(i)}
                        style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '0 8px', fontWeight: 700, fontSize: 16 }}>×</button>
                    </div>
                  ))}
                  <button onClick={addTableFilter} className="btn btn-ghost"
                    style={{ fontSize: 12, padding: '6px 12px', marginTop: 4, alignSelf: 'flex-start' }}>
                    + Add Filter
                  </button>
                </div>
              )}
            </div>
            <div className="panel-section-title" style={{ marginTop: 4 }}>Styling</div>
            <div className="form-group">
              <label className="form-label">Header Background</label>
              <div className="color-picker-wrapper">
                <div className="color-swatch">
                  <input type="color" value={config.headerBg || '#54bd95'}
                    onChange={e => handleConfigChange('headerBg', e.target.value)} />
                </div>
                <input type="text" value={config.headerBg || '#54bd95'}
                  onChange={e => handleConfigChange('headerBg', e.target.value)}
                  className="form-input" placeholder="#54bd95" style={{ flex: 1 }} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Font Size (px)</label>
              <input type="number" min="12" max="18"
                value={config.fontSize || 14}
                onChange={e => handleConfigChange('fontSize', Number(e.target.value))}
                className="form-input" />
            </div>
          </div>
        )}
      </>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-slate-400 font-medium animate-pulse">Initializing Layout Builder...</p>
      </div>
    );
  }

  const currentLg = layouts.lg || [];
  const gridLg = widgets.map((w, i) => {
    const existing = currentLg.find(l => l.i === w.widgetId);
    if (existing) {
      return {
        ...existing,
        x: existing.x ?? w.posX ?? (i * 4) % 12,
        y: existing.y === Infinity || existing.y == null ? w.posY ?? Math.floor(i / 3) * 4 : existing.y,
        w: existing.w ?? w.width ?? 4,
        h: existing.h ?? w.height ?? 4
      };
    }
    return { i: w.widgetId, x: w.posX ?? (i * 4) % 12, y: w.posY ?? Math.floor(i / 3) * 4, w: w.width ?? 4, h: w.height ?? 4 };
  });

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans">

      {/* Top Navbar */}
      <nav className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-md">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <span className="bg-indigo-600 p-2 rounded-lg mr-3 shadow-lg shadow-indigo-600/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 00-1-1H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 001-1v-1z" />
              </svg>
            </span>
            Layout Builder
          </h1>
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
            Edit Mode
          </span>
        </div>

        <div className="flex space-x-4">
          <Link to="/dashboard" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg shadow-sm border border-slate-700 transition">
            Cancel
          </Link>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-600/30 transition flex items-center">
            {saving ? (
              <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            )}
            {saving ? 'Saving...' : 'Publish Dashboard'}
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">

        {/* Left Sidebar Toolbox */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-10">
          <div className="p-5 border-b border-slate-800/50 bg-slate-950/30">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Components</h2>
            <p className="text-xs text-slate-500">Drag items to the canvas</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {WIDGET_TEMPLATES.map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify(item));
                  e.currentTarget.classList.add('opacity-50', 'scale-95');
                }}
                onDragEnd={(e) => e.currentTarget.classList.remove('opacity-50', 'scale-95')}
                className="group flex items-center p-3 bg-slate-800 border-2 border-slate-700 hover:border-indigo-500 rounded-xl cursor-grab active:cursor-grabbing transition-all hover:bg-slate-750"
              >
                <div className="p-2 bg-slate-900 rounded-lg text-indigo-400 group-hover:text-indigo-300 group-hover:bg-indigo-500/10 transition-colors mr-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-200 text-sm group-hover:text-white">{item.label}</h3>
                  <p className="text-xs text-slate-500 truncate">{item.description}</p>
                </div>
                <div className="flex gap-1 ml-2">
                  <span className="text-[10px] bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded font-mono border border-slate-700/50">W{item.defaultW}</span>
                  <span className="text-[10px] bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded font-mono border border-slate-700/50">H{item.defaultH}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
              <h4 className="text-indigo-400 text-xs font-bold mb-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tip
              </h4>
              <p className="text-xs text-indigo-300/70 leading-relaxed">
                Drop components onto the grid. Click ⚙ to configure and resize.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Canvas */}
        <main className="flex-1 overflow-auto overflow-x-scroll bg-slate-950 relative">
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.1, backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '24px 24px', minWidth: 1100 }} />

          <div className="p-6 relative z-10 min-h-full" style={{ minWidth: 1100 }}>
            <Responsive
              className="layout"
              style={{ minHeight: '80vh' }}
              layouts={{ ...layouts, lg: gridLg }}
              breakpoints={{ lg: 992, md: 600, sm: 0 }}
              cols={{ lg: 12, md: 8, sm: 4 }}
              rowHeight={130}
              isDroppable={true}
              onDrop={onDrop}
              onLayoutChange={onLayoutChange}
              margin={[16, 16]}
              droppingItem={{ i: 'drop-preview', w: 4, h: 4 }}
            >
              {widgets.map((widget) => (
                <div
                  key={widget.widgetId}
                  className="relative group bg-slate-800 border-2 border-slate-700 shadow-xl rounded-2xl overflow-hidden cursor-move transition-colors hover:border-slate-500 flex flex-col"
                >
                  {/* Toolbar */}
                  <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-slate-900/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20 flex justify-between items-center px-3 pt-2">
                    <span className="text-xs font-bold text-slate-300 bg-slate-950/80 px-2 py-1 rounded backdrop-blur-sm border border-slate-700 uppercase tracking-wider">
                      {widget.type}
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onMouseDown={e => { e.stopPropagation(); openPanel(widget.widgetId); }}
                        className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition shadow-md"
                        title="Configure Widget"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button
                        onMouseDown={e => { e.stopPropagation(); removeWidget(widget.widgetId); }}
                        className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-md transition shadow-md"
                        title="Remove Widget"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="flex-1 flex flex-col p-4 overflow-hidden">
                    <div className="mb-2">
                      <h3 className="text-base font-bold text-slate-100 truncate pr-16">{widget.title || 'Untitled'}</h3>
                      {widget.description && <p className="text-xs text-slate-400 truncate">{widget.description}</p>}
                    </div>
                    <div className="flex-1 bg-slate-900 border border-slate-700/50 rounded-xl flex items-center justify-center pt-2 relative overflow-hidden pointer-events-none">
                      {renderWidgetPreview(widget)}
                    </div>
                  </div>
                </div>
              ))}
            </Responsive>

            {widgets.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center p-12 max-w-lg border-2 border-dashed border-slate-700 rounded-3xl bg-slate-900/50 backdrop-blur-md">
                  <div className="mx-auto w-20 h-20 bg-slate-800 text-slate-500 rounded-full flex items-center justify-center mb-5 border border-slate-700">
                    <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-300 mb-2">Begin Assembling</h3>
                  <p className="text-slate-500 text-sm">Drag components from the left sidebar onto this canvas to build your dashboard.</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Right Side Panel */}
      {activeWidget && (
        <>
          <div className="side-panel-overlay" onClick={() => setActiveWidget(null)} />
          <div className="side-panel">
            <div className="side-panel-header">
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 2 }}>Widget Settings</h2>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {activeWidget.type} component
                </p>
              </div>
              <button onClick={() => setActiveWidget(null)}
                className="btn btn-ghost btn-icon"
                style={{ color: 'var(--color-text-muted)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="side-panel-body">
              {renderPanelBody()}
            </div>

            <div className="side-panel-footer">
              <button onClick={() => setActiveWidget(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button onClick={applyConfig} className="btn btn-primary" style={{ flex: 2 }}>
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardConfigure;
