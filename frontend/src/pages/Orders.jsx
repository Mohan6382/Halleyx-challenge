import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';

const API_BASE_URL = 'http://localhost:5000/api';

const COUNTRIES = ['United States', 'Canada', 'Australia', 'Singapore', 'Hong Kong'];
const PRODUCTS = [
  'Fiber Internet 300 Mbps',
  '5G Unlimited Mobile Plan',
  'Fiber Internet 1 Gbps',
  'Business Internet 500 Mbps',
  'VoIP Corporate Package'
];
const STATUSES = ['Pending', 'In Progress', 'Completed'];
const CREATED_BY_OPTIONS = ['Mr. Michael Harris', 'Mr. Ryan Cooper', 'Ms. Olivia Carter', 'Mr. Lucas Martin'];

const initialFormState = {
  firstName: '', lastName: '', email: '', phoneNumber: '',
  streetAddress: '', city: '', state: '', postalCode: '',
  country: '', product: '', quantity: 1, unitPrice: '',
  status: 'Pending', createdBy: ''
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [activeMenu, setActiveMenu] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const menuRef = useRef(null);

  const getToken = () => localStorage.getItem('token') || '';

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/orders?dateFilter=${dateFilter}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.data.success) setOrders(res.data.data);
    } catch (err) {
      toast.error('Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [dateFilter]);

  // Close context menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setActiveMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const validateForm = () => {
    const newErrors = {};
    const required = [
      'firstName', 'lastName', 'email', 'phoneNumber',
      'streetAddress', 'city', 'state', 'postalCode',
      'country', 'product', 'quantity', 'unitPrice', 'status', 'createdBy'
    ];
    required.forEach(f => {
      if (!formData[f] && formData[f] !== 0) newErrors[f] = 'Please fill the field';
    });
    if (formData.quantity < 1) newErrors.quantity = 'Please fill the field';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const calculateTotal = () => ((Number(formData.quantity) || 0) * (Number(formData.unitPrice) || 0)).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = { ...formData, quantity: Number(formData.quantity), unitPrice: Number(formData.unitPrice) };
      if (isEditMode) {
        await axios.put(`${API_BASE_URL}/orders/${editingId}`, payload, { headers: { 'Authorization': `Bearer ${getToken()}` } });
        toast.success('Order updated successfully!');
      } else {
        await axios.post(`${API_BASE_URL}/orders`, payload, { headers: { 'Authorization': `Bearer ${getToken()}` } });
        toast.success('Order created successfully!');
      }
      closeModal();
      fetchOrders();
    } catch (err) {
      const msg = err.response?.data?.error?.[0]?.msg || 'Failed to save order.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const openCreateModal = () => {
    setFormData(initialFormState); setErrors({}); setIsEditMode(false);
    setEditingId(null); setIsModalOpen(true); setActiveMenu(null);
  };

  const openEditModal = (order) => {
    setFormData({
      firstName: order.firstName, lastName: order.lastName,
      email: order.email, phoneNumber: order.phoneNumber,
      streetAddress: order.streetAddress, city: order.city,
      state: order.state, postalCode: order.postalCode,
      country: order.country, product: order.product,
      quantity: order.quantity, unitPrice: order.unitPrice,
      status: order.status, createdBy: order.createdBy
    });
    setErrors({}); setIsEditMode(true); setEditingId(order._id);
    setIsModalOpen(true); setActiveMenu(null);
  };

  const closeModal = () => setIsModalOpen(false);

  const confirmDelete = (id) => { setDeleteConfirm({ open: true, id }); setActiveMenu(null); };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/orders/${deleteConfirm.id}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      toast.success('Order deleted.');
      fetchOrders();
    } catch (err) {
      toast.error('Failed to delete order.');
    }
    setDeleteConfirm({ open: false, id: null });
  };

  const Field = ({ name, label, type = 'text', options = null, readOnly = false, prefix = null }) => (
    <div className="form-group">
      <label className="form-label">{label} {!readOnly && <span style={{ color: 'var(--color-danger)' }}>*</span>}</label>
      {options ? (
        <select name={name} value={formData[name]} onChange={handleInputChange}
          className={`form-select ${errors[name] ? 'error' : ''}`}>
          <option value="">Select {label}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : readOnly ? (
        <div className="form-input" style={{ background: '#f1f5f9', cursor: 'not-allowed', color: 'var(--color-text-secondary)' }}>
          {prefix && <span style={{ color: 'var(--color-text-secondary)', marginRight: 4 }}>{prefix}</span>}
          {formData[name] || '—'}
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {prefix && (
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', fontWeight: 600, zIndex: 1 }}>
              {prefix}
            </span>
          )}
          <input type={type} name={name} value={formData[name]} onChange={handleInputChange}
            min={type === 'number' ? (name === 'quantity' ? 1 : 0) : undefined}
            step={name === 'unitPrice' ? '0.01' : undefined}
            className={`form-input ${errors[name] ? 'error' : ''}`}
            style={prefix ? { paddingLeft: 28 } : {}}
            placeholder={`Enter ${label}`}
          />
        </div>
      )}
      {errors[name] && <span className="form-error">{errors[name]}</span>}
    </div>
  );

  const statusBadge = (s) => {
    if (s === 'Completed') return <span className="badge badge-done">Completed</span>;
    if (s === 'In Progress') return <span className="badge badge-progress">In Progress</span>;
    return <span className="badge badge-pending">Pending</span>;
  };

  return (
    <div className="page-enter" style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 4 }}>
              Customer Orders
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              {loading ? 'Loading...' : `${orders.length} order${orders.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Date Filter */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '8px 14px', gap: 8, boxShadow: 'var(--shadow-sm)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Show data for</span>
              <select style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer' }}
                value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="last7">Last 7 Days</option>
                <option value="last30">Last 30 Days</option>
                <option value="last90">Last 90 Days</option>
              </select>
            </div>
            <button onClick={openCreateModal} className="btn btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Create Order
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="ui-card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid var(--color-border)' }}>
                {['Customer', 'Email', 'Product', 'Qty', 'Unit Price', 'Total', 'Status', 'Created By', 'Date', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} style={{ padding: '14px 16px' }}>
                        <div className="skeleton" style={{ height: 14, width: j === 0 ? 120 : j === 9 ? 24 : 80 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ padding: '64px 24px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg className="w-8 h-8" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 16 }}>No orders found</p>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Click "Create Order" to add your first order.</p>
                    </div>
                  </td>
                </tr>
              ) : orders.map(order => (
                <tr key={order._id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background var(--transition-fast)' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, fontSize: 14 }}>{order.firstName} {order.lastName}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)', fontSize: 13 }}>{order.email}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 500, fontSize: 13, maxWidth: 180 }}>{order.product}</td>
                  <td style={{ padding: '14px 16px', fontSize: 14 }}>{order.quantity}</td>
                  <td style={{ padding: '14px 16px', fontSize: 14 }}>${order.unitPrice?.toFixed(2)}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: 14 }}>${order.totalAmount?.toFixed(2)}</td>
                  <td style={{ padding: '14px 16px' }}>{statusBadge(order.status)}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)', fontSize: 13, whiteSpace: 'nowrap' }}>{order.createdBy}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--color-text-muted)', fontSize: 13, whiteSpace: 'nowrap' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', position: 'relative' }}>
                    <button onClick={() => setActiveMenu(activeMenu === order._id ? null : order._id)}
                      className="btn btn-ghost btn-icon">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    {activeMenu === order._id && (
                      <div ref={menuRef} style={{
                        position: 'absolute', right: 12, top: '100%', zIndex: 50,
                        background: '#fff', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-xl)', minWidth: 140, overflow: 'hidden'
                      }}>
                        <button onClick={() => openEditModal(order)}
                          style={{ width: '100%', padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button onClick={() => confirmDelete(order._id)}
                          style={{ width: '100%', padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fff8f8'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}
          onClick={closeModal}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', width: '100%', maxWidth: 760, boxShadow: 'var(--shadow-xl)', animation: 'dialogIn 0.25s cubic-bezier(0.34,1.56,0.64,1)', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={{ padding: '20px 28px', background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', marginBottom: 2 }}>
                  {isEditMode ? 'Edit Order' : 'Create New Order'}
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                  {isEditMode ? 'Update the order details below' : 'Fill in the customer and order information'}
                </p>
              </div>
              <button onClick={closeModal} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--radius-sm)', padding: 8, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 28, maxHeight: 'calc(90vh - 130px)', overflowY: 'auto' }}>
              {/* Customer Information */}
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }} />
                  Customer Information
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                  <Field name="firstName" label="First Name" />
                  <Field name="lastName" label="Last Name" />
                  <Field name="email" label="Email ID" type="email" />
                  <Field name="phoneNumber" label="Phone Number" type="tel" />
                  <div style={{ gridColumn: '1 / -1' }}><Field name="streetAddress" label="Street Address" /></div>
                  <Field name="city" label="City" />
                  <Field name="state" label="State / Province" />
                  <Field name="postalCode" label="Postal Code" />
                  <Field name="country" label="Country" options={COUNTRIES} />
                </div>
              </div>

              {/* Order Information */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-success)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)' }} />
                  Order Information
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                  <div style={{ gridColumn: '1 / -1' }}><Field name="product" label="Choose Product" options={PRODUCTS} /></div>
                  <Field name="quantity" label="Quantity" type="number" />
                  <Field name="unitPrice" label="Unit Price" type="number" prefix="$" />
                  <div className="form-group">
                    <label className="form-label">Total Amount</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f1f5f9', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-text-secondary)' }}>$</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 15 }}>{calculateTotal()}</span>
                    </div>
                  </div>
                  <Field name="status" label="Status" options={STATUSES} />
                  <div style={{ gridColumn: '1 / -1' }}><Field name="createdBy" label="Created By" options={CREATED_BY_OPTIONS} /></div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 24, marginTop: 12, borderTop: '1px solid var(--color-border)' }}>
                <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                      <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : null}
                  {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Submit Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        title="Delete Order?"
        message="This action cannot be undone. The order will be permanently removed."
        confirmLabel="Delete Order"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />
    </div>
  );
};

export default Orders;
