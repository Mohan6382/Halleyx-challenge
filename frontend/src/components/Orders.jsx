import React, { useState } from 'react';
import api from '../api';

export default function Orders({ orders, fetchOrders, showToast }) {
  const [editingOrder, setEditingOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const openOrderModal = (order = null) => {
    setEditingOrder(order);
    setErrors({});
    if (order) {
      setFormData({ ...order });
    } else {
      setFormData({
        firstname: '', lastname: '', email: '', phone: '', address: '',
        city: '', state: '', postal: '', country: '', product: '',
        qty: 1, unitprice: 0, status: 'Pending', createdby: ''
      });
    }
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: false }));
  };

  const submitOrder = async () => {
    const reqFields = ['firstname','lastname','email','phone','address','city','state','postal','country','product','qty','unitprice','status','createdby'];
    const newErrs = {};
    let ok = true;
    reqFields.forEach(f => {
      const val = formData[f];
      if (val === undefined || val === null || val === '') {
        newErrs[f] = true;
        ok = false;
      }
    });

    if (formData.qty < 1) { newErrs.qty = true; ok = false; }

    if (!ok) {
      setErrors(newErrs);
      return;
    }

    try {
      if (editingOrder) {
        await api.put(`/orders/${editingOrder._id}`, formData);
        showToast('Order updated successfully', 'success');
      } else {
        await api.post('/orders', formData);
        showToast('Order created successfully', 'success');
      }
      setShowModal(false);
      fetchOrders();
    } catch (err) {
      showToast('Error saving order', 'error');
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      await api.delete(`/orders/${id}`);
      showToast('Order deleted', 'info');
      fetchOrders();
    } catch (err) {
      showToast('Error deleting order', 'error');
    }
  };

  const getStatusBadge = (s) => {
    const map = { 'Pending': 'badge-pending', 'In progress': 'badge-inprogress', 'Completed': 'badge-completed' };
    return <span className={`badge ${map[s] || ''}`}>{s}</span>;
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="orders-toolbar">
        <span className="dash-title">Customer Orders</span>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => openOrderModal()}>+ Create Order</button>
      </div>
      
      <div className="orders-content">
        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No orders yet</div>
            <div className="empty-sub">Click "Create Order" to add your first customer order.</div>
          </div>
        ) : (
          <div className="data-table-wrap">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th><th>Email</th><th>Phone</th><th>City</th><th>Country</th>
                    <th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th>
                    <th>Status</th><th>Created By</th><th>Date</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o._id}>
                      <td><strong>{o.firstname} {o.lastname}</strong></td>
                      <td>{o.email}</td><td>{o.phone}</td><td>{o.city}</td><td>{o.country}</td>
                      <td>{o.product}</td><td>{o.qty}</td><td>${Number(o.unitprice).toFixed(2)}</td>
                      <td><strong>{o.total}</strong></td>
                      <td>{getStatusBadge(o.status)}</td><td>{o.createdby}</td>
                      <td><span style={{color: 'var(--text2)', fontSize: '12px'}}>{o.date}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="action-btn" onClick={() => openOrderModal(o)} title="Edit">✎</button>
                          <button className="action-btn del" onClick={() => deleteOrder(o._id)} title="Delete">🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className={`modal-backdrop ${showModal ? 'open' : ''}`} onClick={(e) => { if(e.target===e.currentTarget) setShowModal(false); }}>
        <div className="modal">
          <div className="modal-header">
            <span className="modal-title">{editingOrder ? 'Edit Order' : 'Create Order'}</span>
            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
          </div>
          <div className="modal-body">
            <div className="form-group-header">👤 Customer Information</div>
            <div className="grid-2">
              <div className="form-row">
                <label>First Name <span className="req">*</span></label>
                <input type="text" name="firstname" value={formData.firstname || ''} onChange={handleChange} placeholder="John" />
                {errors.firstname && <span className="error-msg show">Please fill the field</span>}
              </div>
              <div className="form-row">
                <label>Last Name <span className="req">*</span></label>
                <input type="text" name="lastname" value={formData.lastname || ''} onChange={handleChange} placeholder="Doe" />
                {errors.lastname && <span className="error-msg show">Please fill the field</span>}
              </div>
              <div className="form-row">
                <label>Email ID <span className="req">*</span></label>
                <input type="email" name="email" value={formData.email || ''} onChange={handleChange} placeholder="john@example.com" />
                {errors.email && <span className="error-msg show">Please fill the field</span>}
              </div>
              <div className="form-row">
                <label>Phone Number <span className="req">*</span></label>
                <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="+1 555 000 0000" />
                {errors.phone && <span className="error-msg show">Please fill the field</span>}
              </div>
            </div>
            <div className="form-row">
              <label>Street Address <span className="req">*</span></label>
              <input type="text" name="address" value={formData.address || ''} onChange={handleChange} placeholder="123 Main Street" />
              {errors.address && <span className="error-msg show">Please fill the field</span>}
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label>City <span className="req">*</span></label>
                <input type="text" name="city" value={formData.city || ''} onChange={handleChange} placeholder="New York" />
                {errors.city && <span className="error-msg show">Please fill the field</span>}
              </div>
              <div className="form-row">
                <label>State / Province <span className="req">*</span></label>
                <input type="text" name="state" value={formData.state || ''} onChange={handleChange} placeholder="NY" />
                {errors.state && <span className="error-msg show">Please fill the field</span>}
              </div>
              <div className="form-row">
                <label>Postal Code <span className="req">*</span></label>
                <input type="text" name="postal" value={formData.postal || ''} onChange={handleChange} placeholder="10001" />
                {errors.postal && <span className="error-msg show">Please fill the field</span>}
              </div>
              <div className="form-row">
                <label>Country <span className="req">*</span></label>
                <div className="select-wrap" style={{width:'100%'}}>
                  <select name="country" style={{width:'100%'}} value={formData.country || ''} onChange={handleChange}>
                    <option value="">Select Country</option>
                    <option>United States</option><option>Canada</option>
                    <option>Australia</option><option>Singapore</option><option>Hong Kong</option>
                  </select>
                </div>
                {errors.country && <span className="error-msg show">Please fill the field</span>}
              </div>
            </div>

            <div className="form-group-header">📦 Order Information</div>
            <div className="grid-2">
              <div className="form-row" style={{gridColumn: '1/-1'}}>
                <label>Choose Product <span className="req">*</span></label>
                <div className="select-wrap" style={{width:'100%'}}>
                  <select name="product" style={{width:'100%'}} value={formData.product || ''} onChange={handleChange}>
                    <option value="">Select Product</option>
                    <option>Fiber Internet 300 Mbps</option>
                    <option>5G Unlimited Mobile Plan</option>
                    <option>Fiber Internet 1 Gbps</option>
                    <option>Business Internet 500 Mbps</option>
                    <option>VoIP Corporate Package</option>
                  </select>
                </div>
                {errors.product && <span className="error-msg show">Please fill the field</span>}
              </div>
              <div className="form-row">
                <label>Quantity <span className="req">*</span></label>
                <input type="number" name="qty" min="1" value={formData.qty || 1} onChange={handleChange} />
                {errors.qty && <span className="error-msg show">Please fill the field</span>}
              </div>
              <div className="form-row">
                <label>Unit Price <span className="req">*</span></label>
                <div style={{position:'relative'}}>
                  <span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'var(--text2)'}}>$</span>
                  <input type="number" name="unitprice" placeholder="0.00" style={{paddingLeft:'22px'}} value={formData.unitprice || 0} onChange={handleChange} />
                </div>
                {errors.unitprice && <span className="error-msg show">Please fill the field</span>}
              </div>
              <div className="form-row">
                <label>Total Amount</label>
                <input type="text" readOnly className="readonly" placeholder="$0.00" value={`$${((formData.qty || 0) * (formData.unitprice || 0)).toFixed(2)}`} />
              </div>
              <div className="form-row">
                <label>Status <span className="req">*</span></label>
                <div className="select-wrap" style={{width:'100%'}}>
                  <select name="status" style={{width:'100%'}} value={formData.status || 'Pending'} onChange={handleChange}>
                    <option value="Pending">Pending</option>
                    <option value="In progress">In progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                {errors.status && <span className="error-msg show">Please fill the field</span>}
              </div>
              <div className="form-row">
                <label>Created By <span className="req">*</span></label>
                <div className="select-wrap" style={{width:'100%'}}>
                  <select name="createdby" style={{width:'100%'}} value={formData.createdby || ''} onChange={handleChange}>
                    <option value="">Select</option>
                    <option>Mr. Michael Harris</option>
                    <option>Mr. Ryan Cooper</option>
                    <option>Ms. Olivia Carter</option>
                    <option>Mr. Lucas Martin</option>
                  </select>
                </div>
                {errors.createdby && <span className="error-msg show">Please fill the field</span>}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitOrder}>Submit Order</button>
          </div>
        </div>
      </div>
    </div>
  );
}
