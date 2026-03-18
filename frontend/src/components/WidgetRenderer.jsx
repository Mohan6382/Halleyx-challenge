import React from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

function getFieldNumVal(o, field) {
  const m = { 'Quantity': o.qty, 'Unit price': o.unitprice, 'Total amount': o.qty * o.unitprice };
  return m[field] || 0;
}

function getFieldVal(o, field) {
  const m = { 'Product': o.product, 'Status': o.status, 'Created by': o.createdby,
    'Quantity': String(o.qty), 'Unit price': String(o.unitprice), 'Total amount': String(o.qty * o.unitprice),
    'Duration': o.date };
  return m[field] || field;
}

// Renders the specific contents based on type
export default function WidgetRenderer({ w, orders, isConfig = false }) {
  if (w.type === 'kpi') {
    const data = orders;
    const metric = w.config.metric || 'Total amount';
    const agg = w.config.aggregation || 'Sum';
    const fmt = w.config.format || 'Number';
    const prec = parseInt(w.config.precision) || 0;

    let vals = data.map(o => parseFloat(getFieldNumVal(o, metric)) || 0);
    if (!vals.length) vals = [0];

    let result;
    if (agg === 'Sum') result = vals.reduce((a, b) => a + b, 0);
    else if (agg === 'Average') result = vals.reduce((a, b) => a + b, 0) / vals.length;
    else result = data.length;

    const formatted = fmt === 'Currency' 
      ? '$' + result.toFixed(prec).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      : result.toFixed(prec).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return (
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
        <div className="kpi-value">{formatted}</div>
        <div className="kpi-label">{w.config.metric || ''} · {w.config.aggregation || ''}</div>
      </div>
    );
  }

  if (w.type === 'table') {
    const cols = (w.config.columns || ['Product','Total amount','Status']);
    let data = [...orders];

    if (w.config.filters && w.config.filters.length > 0) {
      data = data.filter(o => w.config.filters.every(f => {
        if (!f.field || !f.value) return true;
        const val = String(getFieldVal(o, f.field)).toLowerCase();
        return val.includes(f.value.toLowerCase());
      }));
    }

    if (w.config.sortBy) {
      data.sort((a, b) => {
        if (w.config.sortBy === 'Order date') {
          return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
        }
        const valA = String(a[cols[0] ? cols[0].replace(' ','').toLowerCase() : 'product']);
        const valB = String(b[cols[0] ? cols[0].replace(' ','').toLowerCase() : 'product']);
        if (valA < valB) return w.config.sortBy === 'Ascending' ? -1 : 1;
        if (valA > valB) return w.config.sortBy === 'Ascending' ? 1 : -1;
        return 0;
      });
    }

    const pageSize = w.config.pagination || 10;
    const slice = data.slice(0, pageSize);

    const getStatusBadge = (s) => {
      const map = { 'Pending': 'badge-pending', 'In progress': 'badge-inprogress', 'Completed': 'badge-completed' };
      return <span className={`badge ${map[s] || ''}`}>{s}</span>;
    };

    const colMap = {
      'Customer ID': o => '#' + (o._id ? o._id.substring(o._id.length - 4) : '---'),
      'Customer name': o => o.firstname + ' ' + o.lastname,
      'Email id': o => o.email,
      'Phone number': o => o.phone,
      'Address': o => o.address + ', ' + o.city,
      'Order ID': o => '#' + (o._id ? o._id.substring(o._id.length - 4) : '---'),
      'Order date': o => o.date,
      'Product': o => o.product,
      'Quantity': o => o.qty,
      'Unit price': o => '$' + Number(o.unitprice).toFixed(2),
      'Total amount': o => o.total,
      'Status': o => getStatusBadge(o.status),
      'Created by': o => o.createdby,
    };

    return (
      <div style={{ overflowX: 'auto', fontSize: `${w.config.fontSize || 14}px`, padding: '14px 16px' }}>
        <table className="widget-table">
          <thead>
            <tr>
              {cols.map(c => <th key={c} style={{background: w.config.headerBg || '#54bd95'}}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr><td colSpan={cols.length} style={{textAlign: 'center', padding: '20px'}}>No data</td></tr>
            ) : (
              slice.map(o => (
                <tr key={o._id || Math.random()}>
                  {cols.map(c => <td key={c}>{colMap[c] ? colMap[c](o) : '—'}</td>)}
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div style={{ padding: '6px 0', fontSize: '11px', color: 'var(--text3)', textAlign: 'right' }}>
          Showing {Math.min(slice.length, data.length)} of {data.length} rows
        </div>
      </div>
    );
  }

  // Charts
  if (['bar','line','pie','area','scatter'].includes(w.type)) {
    const color = w.config.color || '#4f9ef8';
    const isPie = w.type === 'pie';
    const isScatter = w.type === 'scatter';
    const isArea = w.type === 'area';
    
    // Group Data
    let labels = [], values = [];
    if (isScatter) {
      const xField = w.config.xAxis || 'Quantity';
      const yField = w.config.yAxis || 'Total amount';
      values = orders.map(o => ({
        x: parseFloat(getFieldNumVal(o, xField)) || 0,
        y: parseFloat(getFieldNumVal(o, yField)) || 0
      }));
    } else {
      const xField = isPie ? (w.config.chartData || 'Product') : (w.config.xAxis || 'Product');
      const yField = isPie ? '' : (w.config.yAxis || 'Total amount');
      const grouped = {};
      orders.forEach(o => {
        const key = getFieldVal(o, xField);
        const val = isPie ? 1 : (parseFloat(getFieldNumVal(o, yField)) || 0);
        grouped[key] = (grouped[key] || 0) + val;
      });
      labels = Object.keys(grouped);
      values = Object.values(grouped);
    }

    const gridColor = 'rgba(255,255,255,0.05)';
    const textColor = '#8b94a8';
    
    const pieColors = ['#4f9ef8','#7c5cfc','#f85c78','#34d399','#f59e0b','#e879f9','#22d3ee'];

    const chartData = {
      labels: isScatter ? undefined : labels,
      datasets: [{
        label: isPie ? undefined : (w.config.yAxis || 'Value'),
        data: values,
        backgroundColor: isPie ? pieColors : (w.type === 'bar' ? color + 'cc' : color + '33'),
        borderColor: isPie ? undefined : color,
        borderWidth: isPie ? 0 : 2,
        fill: isArea,
        tension: isArea ? 0.4 : 0.3,
        pointBackgroundColor: color,
        pointRadius: w.type === 'bar' ? 0 : (isScatter ? 5 : 3),
        borderRadius: w.type === 'bar' ? 4 : 0
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: isPie ? w.config.showLegend : false, labels: { color: textColor, font: { family: 'DM Sans', size: 11 } } },
        tooltip: { backgroundColor: '#1e2230', borderColor: '#2e3448', borderWidth: 1, titleColor: '#e8ecf4', bodyColor: '#8b94a8' }
      },
      scales: isPie ? {} : {
        x: { grid: { color: gridColor }, type: isScatter ? 'linear' : 'category', ticks: { color: textColor, font: { size: 11 } }, border: { display: false } },
        y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } }, border: { display: false } }
      }
    };

    const chartType = isArea ? 'line' : w.type;

    return (
      <div className="chart-container" style={{ padding: '14px 16px', display: 'flex', flex: 1 }}>
        <div style={{ position: 'relative', height: '100%', width: '100%', minHeight: '120px' }}>
          <Chart type={chartType} data={chartData} options={options} />
        </div>
      </div>
    );
  }

  return null;
}
