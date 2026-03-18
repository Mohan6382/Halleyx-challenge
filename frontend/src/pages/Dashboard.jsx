import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Responsive as ResponsiveGridLayout, WidthProvider } from 'react-grid-layout/legacy';

const Responsive = WidthProvider(ResponsiveGridLayout);
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter, PieChart, Pie, Cell
} from 'recharts';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const API_BASE_URL = 'http://localhost:5000/api';
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

// Map spec display-name metric → actual MongoDB field name
const METRIC_FIELD_MAP = {
  'Customer ID':    '_id',
  'Customer name':  'firstName',
  'Email id':       'email',
  'Address':        'streetAddress',
  'Order date':     'createdAt',
  'Product':        'product',
  'Created by':     'createdBy',
  'Status':         'status',
  'Total amount':   'totalAmount',
  'Unit price':     'unitPrice',
  'Quantity':       'quantity',
};

// Map spec display-name axis field → actual MongoDB field name
const AXIS_FIELD_MAP = {
  'Product':       'product',
  'Quantity':      'quantity',
  'Unit price':    'unitPrice',
  'Total amount':  'totalAmount',
  'Status':        'status',
  'Created by':    'createdBy',
  'Duration':      'city', // fallback
};

// Map spec display-name column → actual MongoDB field name
const COL_FIELD_MAP = {
  'Customer ID':   '_id',
  'Customer name': 'firstName',
  'Email id':      'email',
  'Phone number':  'phoneNumber',
  'Address':       'streetAddress',
  'Order ID':      '_id',
  'Order date':    'createdAt',
  'Product':       'product',
  'Quantity':      'quantity',
  'Unit price':    'unitPrice',
  'Total amount':  'totalAmount',
  'Status':        'status',
  'Created by':    'createdBy',
};

const Dashboard = () => {
  const [config, setConfig]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [widgetData, setWidgetData] = useState({});
  const [ordersData, setOrdersData] = useState([]);
  // Per-table-widget pagination state
  const [tablePage, setTablePage]   = useState({});

  const getToken = () => localStorage.getItem('token') || '';

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/dashboard`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.data.success && res.data.data.widgets.length > 0) {
        setConfig(res.data.data);
      } else {
        setConfig(null);
      }
    } catch (err) {
      toast.error('Error fetching dashboard config');
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchWidgetData = async (widget) => {
    if (widget.type === 'kpi') {
      try {
        const rawMetric = widget.config?.metric || 'Total amount';
        const field = METRIC_FIELD_MAP[rawMetric] || rawMetric;
        const rawAgg = (widget.config?.aggregation || 'Sum').toLowerCase();
        const payload = { metric: field, aggregation: rawAgg, dateFilter };
        const res = await axios.post(`${API_BASE_URL}/widgets/data`, payload, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        setWidgetData(prev => ({ ...prev, [widget.widgetId]: res.data.data.value }));
      } catch (err) {
        console.error(`KPI data error for ${widget.widgetId}:`, err);
      }
    }
  };

  const fetchAllOrders = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/orders?dateFilter=${dateFilter}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.data.success) setOrdersData(res.data.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  useEffect(() => {
    if (config?.widgets) {
      fetchAllOrders();
      config.widgets.forEach(w => fetchWidgetData(w));
    }
  }, [config, dateFilter]);

  /* ── DATA TRANSFORMS ── */

  const getChartData = (widget) => {
    const rawX = widget.config?.xAxis || 'Product';
    const rawY = widget.config?.yAxis || 'Total amount';
    const xField = AXIS_FIELD_MAP[rawX] || rawX.toLowerCase();
    const yField = AXIS_FIELD_MAP[rawY] || rawY.toLowerCase();
    const aggregation = (widget.config?.aggregation || 'sum').toLowerCase();

    const grouped = ordersData.reduce((acc, order) => {
      const key = order[xField] || 'Unknown';
      const val = Number(order[yField]) || 0;
      if (!acc[key]) acc[key] = { name: key, value: 0, count: 0 };
      if (aggregation === 'sum') acc[key].value += val;
      else if (aggregation === 'count') acc[key].value += 1;
      acc[key].count += 1;
      return acc;
    }, {});

    let result = Object.values(grouped);
    if (aggregation === 'average') {
      result = result.map(item => ({ name: item.name, value: Number((item.value / item.count).toFixed(2)) }));
    }
    return result;
  };

  const getPieData = (widget) => {
    const rawField = widget.config?.chartData || 'Product';
    const field = AXIS_FIELD_MAP[rawField] || rawField.toLowerCase();

    const grouped = ordersData.reduce((acc, order) => {
      const key = order[field] || 'Unknown';
      if (!acc[key]) acc[key] = { name: key, value: 0 };
      acc[key].value += 1;
      return acc;
    }, {});

    return Object.values(grouped);
  };

  const getTableData = (widget) => {
    const { sortBy = '', filters = [] } = widget.config || {};
    let data = [...ordersData];

    // Apply filters
    if (filters && filters.length > 0) {
      data = data.filter(order => {
        return filters.every(f => {
          if (!f.value) return true;
          const field = COL_FIELD_MAP[f.field] || f.field.toLowerCase();
          const orderVal = String(order[field] || '').toLowerCase();
          return orderVal.includes(f.value.toLowerCase());
        });
      });
    }

    // Apply sort
    if (sortBy === 'Ascending') {
      data.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
    } else if (sortBy === 'Descending') {
      data.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    } else if (sortBy === 'Order date') {
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return data;
  };

  /* ── RENDERERS ── */

  const renderKPI = (widget) => {
    const val = widgetData[widget.widgetId];
    const { format = 'Number', precision = 0 } = widget.config || {};
    let displayValue = '—';
    if (val !== undefined) {
      const num = Number(val);
      if (format === 'Currency') {
        displayValue = `$${num.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision })}`;
      } else {
        displayValue = num.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision });
      }
    }

    return (
      <div className="flex-grow flex flex-col items-center justify-center gap-1">
        <span className="text-5xl font-black text-slate-800 tracking-tight">
          {val === undefined ? (
            <span className="skeleton" style={{ display: 'inline-block', width: 120, height: 48, borderRadius: 8 }} />
          ) : displayValue}
        </span>
        <span className="text-xs text-slate-400 uppercase tracking-widest mt-1">
          {widget.config?.metric || 'Total amount'}
        </span>
      </div>
    );
  };

  const renderChart = (widget) => {
    const { type } = widget;
    const isPie = type === 'pie';
    const data = isPie ? getPieData(widget) : getChartData(widget);
    const { color = '#4f9ef8', showLabel = false, showLegend = true } = widget.config || {};

    if (data.length === 0) {
      return (
        <div className="flex-grow flex items-center justify-center text-slate-400 text-sm">
          No data available
        </div>
      );
    }

    const commonProps = { data, margin: { top: 20, right: 30, left: 20, bottom: 5 } };

    let ChartComponent;
    switch (type) {
      case 'bar':
        ChartComponent = (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="name" tick={{fill: '#64748B', fontSize: 12}} axisLine={false} tickLine={false} />
            <YAxis tick={{fill: '#64748B', fontSize: 12}} axisLine={false} tickLine={false} />
            <RechartsTooltip cursor={{fill: '#F1F5F9'}} contentStyle={{borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0/0.1)'}} />
            {showLegend && <Legend />}
            <Bar dataKey="value" fill={color} radius={[4,4,0,0]} label={showLabel ? { position:'top', fill:'#475569', fontSize:11 } : false} />
          </BarChart>
        ); break;
      case 'line':
        ChartComponent = (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="name" tick={{fill: '#64748B', fontSize: 12}} axisLine={false} tickLine={false} />
            <YAxis tick={{fill: '#64748B', fontSize: 12}} axisLine={false} tickLine={false} />
            <RechartsTooltip contentStyle={{borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0/0.1)'}} />
            {showLegend && <Legend />}
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{r:4, strokeWidth:2}} activeDot={{r:6}} label={showLabel ? { position:'top' } : false} />
          </LineChart>
        ); break;
      case 'area':
        ChartComponent = (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="name" tick={{fill: '#64748B', fontSize: 12}} axisLine={false} tickLine={false} />
            <YAxis tick={{fill: '#64748B', fontSize: 12}} axisLine={false} tickLine={false} />
            <RechartsTooltip contentStyle={{borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0/0.1)'}} />
            {showLegend && <Legend />}
            <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.2} strokeWidth={2} />
          </AreaChart>
        ); break;
      case 'scatter':
        ChartComponent = (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="name" tick={{fill: '#64748B', fontSize: 12}} />
            <YAxis dataKey="value" tick={{fill: '#64748B', fontSize: 12}} />
            <RechartsTooltip cursor={{strokeDasharray:'3 3'}} contentStyle={{borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0/0.1)'}} />
            {showLegend && <Legend />}
            <Scatter name="Data" data={data} fill={color} />
          </ScatterChart>
        ); break;
      case 'pie':
        ChartComponent = (
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={80} dataKey="value"
              label={showLabel ? ({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%` : false}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <RechartsTooltip contentStyle={{borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0/0.1)'}} />
            {(widget.config?.showLegend !== false) && <Legend />}
          </PieChart>
        ); break;
      default:
        ChartComponent = <div>Unknown type</div>;
    }

    return (
      <div className="flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {ChartComponent}
        </ResponsiveContainer>
      </div>
    );
  };

  const renderTable = (widget) => {
    const { columns = ['Customer name', 'Product', 'Total amount', 'Status'], headerBg = '#54bd95', fontSize = 14, pagination = 10 } = widget.config || {};
    const allData = getTableData(widget);
    const widgetId = widget.widgetId;
    const currentPage = tablePage[widgetId] || 0;
    const pageSize = Number(pagination) || 10;
    const totalPages = Math.max(1, Math.ceil(allData.length / pageSize));
    const pageData = allData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

    const setPage = (p) => setTablePage(prev => ({ ...prev, [widgetId]: p }));

    const formatCell = (colName, order) => {
      const field = COL_FIELD_MAP[colName] || colName.toLowerCase();
      const val = order[field];
      if (colName === 'Total amount' || colName === 'Unit price') return `$${Number(val||0).toFixed(2)}`;
      if (colName === 'Order date') return val ? new Date(val).toLocaleDateString() : '—';
      if (colName === 'Customer name') return `${order.firstName || ''} ${order.lastName || ''}`.trim();
      if (colName === 'Address') return `${order.streetAddress || ''}, ${order.city || ''}`.replace(/^, |, $/, '');
      return val || '—';
    };

    return (
      <div className="flex-grow flex flex-col overflow-hidden">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse" style={{ fontSize: `${fontSize}px` }}>
            <thead>
              <tr style={{ backgroundColor: headerBg }}>
                {columns.map(col => (
                  <th key={col} className="px-3 py-2.5 font-semibold text-white border-b border-black/10" style={{ whiteSpace: 'nowrap', fontSize: `${Math.max(11, fontSize-1)}px` }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-6 text-center text-slate-400">No data available</td>
                </tr>
              ) : pageData.map((order, idx) => (
                <tr key={order._id || idx} className="hover:bg-slate-50 transition-colors">
                  {columns.map(col => (
                    <td key={`${order._id}-${col}`} className="px-3 py-2 text-slate-700" style={{ whiteSpace: 'nowrap' }}>
                      {formatCell(col, order)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 bg-slate-50" style={{ flexShrink: 0 }}>
            <span className="text-xs text-slate-400">
              Page {currentPage + 1} of {totalPages} · {allData.length} rows
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-2 py-1 text-xs rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >‹ Prev</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(0, Math.min(totalPages - 5, currentPage - 2)) + i;
                return (
                  <button key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-2.5 py-1 text-xs rounded border transition ${pageNum === currentPage ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                    {pageNum + 1}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
                className="px-2 py-1 text-xs rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >Next ›</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderWidget = (widget) => {
    switch (widget.type) {
      case 'kpi':    return renderKPI(widget);
      case 'table':  return renderTable(widget);
      case 'bar': case 'line': case 'area': case 'scatter': case 'pie':
        return renderChart(widget);
      default: return <div>Unsupported Widget</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
        <p className="text-slate-500 font-semibold animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8">
      <div className="max-w-[1600px] mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h1>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
              <span className="text-sm font-medium text-slate-500 mr-3">Show data for</span>
              <select
                className="text-sm font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer border-none"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="last7">Last 7 Days</option>
                <option value="last30">Last 30 Days</option>
                <option value="last90">Last 90 Days</option>
              </select>
            </div>

            <Link to="/dashboard/configure"
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-5 rounded-lg shadow-md transition-all flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configure Dashboard
            </Link>
          </div>
        </div>

        {/* Grid */}
        {!config ? (
          <div className="flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm py-32 px-4 mt-8">
            <div className="h-24 w-24 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">No Dashboard Configured</h2>
            <p className="text-slate-500 mb-8 max-w-md text-center">
              Your personalized dashboard hasn't been set up yet. Build one by adding charts, tables, and KPIs.
            </p>
            <Link to="/dashboard/configure"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-1">
              Configure Dashboard Now
            </Link>
          </div>
        ) : (
          <Responsive
            className="layout -mx-2"
            layouts={{
              lg: config.layout?.lg || [],
              md: config.layout?.md || [],
              sm: config.layout?.sm || []
            }}
            breakpoints={{ lg: 1200, md: 768, sm: 480 }}
            cols={{ lg: 12, md: 8, sm: 4 }}
            rowHeight={120}
            isDraggable={true}
            isResizable={true}
            draggableHandle=".widget-header"
            margin={[16, 16]}
            onLayoutChange={() => {}}
          >
            {config.widgets.map((widget) => {
              const lgLayout = config.layout?.lg?.find(l => l.i === widget.widgetId);
              const gridProps = lgLayout
                ? lgLayout
                : { x: widget.posX, y: widget.posY, w: widget.width, h: widget.height };

              return (
                <div key={widget.widgetId}
                  data-grid={{ ...gridProps, i: widget.widgetId }}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden dashboard-widget">
                  <div className="widget-header cursor-move bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between" style={{ flexShrink: 0 }}>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700">{widget.title}</h3>
                      {widget.description && <p className="text-xs text-slate-400">{widget.description}</p>}
                    </div>
                    <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9h8M8 15h8" />
                    </svg>
                  </div>
                  <div className="flex-grow p-4 min-h-0 flex flex-col overflow-hidden">
                    {renderWidget(widget)}
                  </div>
                </div>
              );
            })}
          </Responsive>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
