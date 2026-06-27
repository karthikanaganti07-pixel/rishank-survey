import React, { useState, useEffect } from 'react';
import { FaChartBar, FaCalendarCheck, FaGlobe, FaMoneyBillWave, FaTrash, FaCheck, FaExclamationTriangle, FaWhatsapp, FaMapMarkerAlt, FaSignOutAlt, FaCompass } from 'react-icons/fa';

export default function AdminDashboard({ user, onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [hoveredData, setHoveredData] = useState(null);

  const analyticsData = [
    { month: 'Jan', acres: 25, revenue: 37500, bookings: 5 },
    { month: 'Feb', acres: 48, revenue: 72000, bookings: 8 },
    { month: 'Mar', acres: 36, revenue: 54000, bookings: 6 },
    { month: 'Apr', acres: 70, revenue: 105000, bookings: 12 },
    { month: 'May', acres: 85, revenue: 127500, bookings: 15 },
    { month: 'Jun', acres: 110, revenue: 165000, bookings: 19 },
  ];

  // Dynamic statistics calculations
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    revenue: 0
  });

  const [waConfig, setWaConfig] = useState({
    provider: 'mock',
    greenApi: {
      idInstance: '',
      apiTokenInstance: ''
    }
  });

  // Load waConfig on mount
  useEffect(() => {
    const saved = localStorage.getItem('rishank_whatsapp_config');
    if (saved) {
      try {
        setWaConfig(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load WA config", e);
      }
    }
  }, []);

  const handleWaConfigChange = (field, value) => {
    const updated = { ...waConfig, [field]: value };
    setWaConfig(updated);
    localStorage.setItem('rishank_whatsapp_config', JSON.stringify(updated));
  };

  const handleWaGreenApiChange = (field, value) => {
    const updated = {
      ...waConfig,
      greenApi: {
        ...waConfig.greenApi,
        [field]: value
      }
    };
    setWaConfig(updated);
    localStorage.setItem('rishank_whatsapp_config', JSON.stringify(updated));
  };

  // Security barrier check: enforce admin mobile number restriction
  if (user.phoneNumber !== '8522075075') {
    return (
      <div className="login-screen">
        <div className="login-card glass-panel animate-fade-in" style={{ textAlign: 'center' }}>
          <FaExclamationTriangle style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '15px' }} />
          <h3>Access Restrained</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '15px 0' }}>
            The Administration Dashboard is protected. Your current credential (+91 {user.phoneNumber}) does not hold administrative access tokens.
          </p>
          <button className="btn-premium" onClick={onLogout}>Return to Security Desk</button>
        </div>
      </div>
    );
  }

  // Initializing default datasets on mount
  useEffect(() => {
    // 1. Initializing bookings database
    const savedBookings = localStorage.getItem('rishank_bookings');
    let loadedBookings = [];
    let parsedBookings = null;
    
    if (savedBookings) {
      try {
        parsedBookings = JSON.parse(savedBookings);
      } catch (e) {
        console.error("Failed to parse bookings", e);
        localStorage.removeItem('rishank_bookings');
      }
    }

    if (parsedBookings && Array.isArray(parsedBookings) && parsedBookings.length > 0) {
      loadedBookings = parsedBookings;
    } else {
      // Pre-populate with beautiful, immersive survey pins around Nalgonda, Telangana
      const defaultBookings = [
        {
          id: 'B-883492',
          name: 'Karthik Reddy',
          mobile: '9848022334',
          email: 'karthik.r@example.com',
          workType: 'Land Surveyor (RTK & DGPS)',
          acres: '2',
          estimatedPrice: 4000,
          date: '2026-06-02',
          time: '09:30',
          coordinates: { lat: 17.0683, lng: 79.2662 }, // Raghunathapalem Nalgonda
          mapLink: 'https://www.google.com/maps?q=17.0683,79.2662',
          status: 'pending',
          timestamp: new Date().toISOString()
        },
        {
          id: 'B-774092',
          name: 'Srinivas Rao',
          mobile: '9000123456',
          email: 'srinivas.rao@gmail.com',
          workType: 'Land Surveyor (RTK & DGPS)',
          acres: '5',
          estimatedPrice: 7500,
          date: '2026-05-30',
          time: '14:00',
          coordinates: { lat: 17.0583, lng: 79.2812 }, // Nalgonda Bypass Road
          mapLink: 'https://www.google.com/maps?q=17.0583,79.2812',
          status: 'confirmed',
          timestamp: new Date().toISOString()
        },
        {
          id: 'B-349811',
          name: 'Venkatesh Naik',
          mobile: '9440987654',
          email: 'vnaik@rediffmail.com',
          workType: 'Land Surveyor (RTK & DGPS)',
          acres: '1.5',
          estimatedPrice: 4000,
          date: '2026-06-05',
          time: '11:00',
          coordinates: { lat: 17.0392, lng: 79.2571 }, // Miryalaguda Road Nalgonda
          mapLink: 'https://www.google.com/maps?q=17.0392,79.2571',
          status: 'pending',
          timestamp: new Date().toISOString()
        }
      ];
      localStorage.setItem('rishank_bookings', JSON.stringify(defaultBookings));
      loadedBookings = defaultBookings;
    }
    setBookings(loadedBookings);

    // 2. Initializing services pricing list
    const savedServices = localStorage.getItem('rishank_services');
    if (savedServices) {
      try {
        setServices(JSON.parse(savedServices));
      } catch (e) {
        console.error("Failed to parse services in admin", e);
      }
    }
  }, []);

  // Update statistics dynamically when bookings change
  useEffect(() => {
    const total = bookings.length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    
    // Calculate potential revenue based on service prices
    let revenue = 0;
    bookings.forEach((booking) => {
      if (booking.status === 'confirmed') {
        if (booking.estimatedPrice) {
          revenue += booking.estimatedPrice;
        } else {
          const matchedService = services.find(s => booking.workType.includes(s.name.substring(0, 10)));
          const priceStr = matchedService ? matchedService.price : '4,000';
          const priceVal = parseInt(priceStr.replace(/,/g, ''), 10) || 4000;
          revenue += priceVal;
        }
      }
    });

    setStats({ total, confirmed, pending, revenue });
  }, [bookings, services]);



  // Approve a pending booking slot
  const handleApproveBooking = (id) => {
    const updated = bookings.map((booking) => {
      if (booking.id === id) {
        const approvedBooking = { ...booking, status: 'confirmed' };
        
        // Launch automated WhatsApp Click-to-Chat confirmation message directed to client
        const confirmText = `Hello ${booking.name}! 🛰️\n\nThis is Rishank Land Survey Solutions, Nalgonda. We are pleased to confirm your professional DGPS survey appointment for *${booking.date}* at *${booking.time}*.\n\nOur field engineers will navigate directly to your shared coordinates: ${booking.mapLink}.\n\nFor queries, dial +91 95814 21614. See you soon!`;
        const whatsappUrl = `https://api.whatsapp.com/send?phone=91${booking.mobile}&text=${encodeURIComponent(confirmText)}`;
        window.open(whatsappUrl, '_blank');

        return approvedBooking;
      }
      return booking;
    });

    setBookings(updated);
    localStorage.setItem('rishank_bookings', JSON.stringify(updated));
  };

  // Reschedule/Cancel Booking
  const handleCancelBooking = (id) => {
    const updated = bookings.map((booking) => {
      if (booking.id === id) {
        return { ...booking, status: 'cancelled' };
      }
      return booking;
    });

    setBookings(updated);
    localStorage.setItem('rishank_bookings', JSON.stringify(updated));
  };

  // Delete booking entry entirely
  const handleDeleteBooking = (id) => {
    const filtered = bookings.filter(booking => booking.id !== id);
    setBookings(filtered);
    localStorage.setItem('rishank_bookings', JSON.stringify(filtered));
  };

  // Modify Service pricing inline
  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...services];
    updatedServices[index][field] = value;
    setServices(updatedServices);
    localStorage.setItem('rishank_services', JSON.stringify(updatedServices));
  };

  return (
    <div className="admin-wrapper luxury-container">
      {/* Immersive background nodes */}
      <div className="bg-particles">
        <div className="glowing-orbs orb-gold"></div>
        <div className="glowing-orbs orb-blue"></div>
      </div>

      {/* Admin Panel Header */}
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h2 style={{ fontSize: '2.2rem' }}>
            Control <span className="gold-text">Studio</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Rishank Land Survey Solutions - Nalgonda Operations Dashboard
          </p>
        </div>
        <button 
          onClick={onLogout} 
          className="btn-secondary-luxury" 
          style={{ marginLeft: 'auto', gap: '8px' }}
        >
          <FaSignOutAlt />
          Secure Logout
        </button>
      </div>

      {/* Metrics Row */}
      <div className="admin-grid-top">
        <div className="stat-card glass-panel">
          <div className="stat-icon gold"><FaCompass /></div>
          <div>
            <div className="stat-val">{stats.total}</div>
            <div className="stat-lbl">Total Tasks</div>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon blue"><FaCalendarCheck /></div>
          <div>
            <div className="stat-val">{stats.confirmed}</div>
            <div className="stat-lbl">Confirmed</div>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon gold" style={{ background: 'rgba(255, 179, 0, 0.08)', color: '#ffb300' }}><FaGlobe /></div>
          <div>
            <div className="stat-val">{stats.pending}</div>
            <div className="stat-lbl">Pending</div>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon blue" style={{ background: 'rgba(37, 211, 102, 0.08)', color: '#25d366' }}><FaMoneyBillWave /></div>
          <div>
            <div className="stat-val">₹{stats.revenue.toLocaleString()}</div>
            <div className="stat-lbl">Active Revenue</div>
          </div>
        </div>
      </div>

      {/* Interactive Map and Active Bookings Row */}
      <div className="dashboard-map-row">
        {/* Live Booking Slots Tracker Card */}
        <div className="dashboard-card glass-panel">
          <h3 className="dashboard-card-title">
            <FaCalendarCheck style={{ color: 'var(--color-blue-neon)' }} /> Active Booking Registrations
          </h3>
          <div className="bookings-scroller">
            {bookings.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
                No active survey registrations booked in database.
              </p>
            ) : (
              bookings.map((booking) => (
                <div key={booking.id} className="booking-item">
                  <div className="booking-item-header">
                    <span className="booking-client-name">{booking.name}</span>
                    <span className={`booking-status-badge status-${booking.status}`}>
                      {booking.status}
                    </span>
                  </div>
                  
                  <div className="booking-item-detail">
                    <strong style={{ color: 'var(--text-primary)' }}>Job:</strong> {booking.workType}
                  </div>
                  <div className="booking-item-detail">
                    <strong style={{ color: 'var(--text-primary)' }}>Slot:</strong> {booking.date} at {booking.time}
                  </div>
                  <div className="booking-item-detail">
                    <strong style={{ color: 'var(--text-primary)' }}>Mobile:</strong> +91 {booking.mobile}
                  </div>
                  {booking.acres && (
                    <div className="booking-item-detail">
                      <strong style={{ color: 'var(--text-primary)' }}>Land Size:</strong> {booking.acres} Acres
                    </div>
                  )}
                  {booking.estimatedPrice && (
                    <div className="booking-item-detail">
                      <strong style={{ color: 'var(--text-primary)' }}>Est. Quote:</strong> ₹{booking.estimatedPrice.toLocaleString('en-IN')}
                    </div>
                  )}
                  <div className="booking-item-detail">
                    <strong style={{ color: 'var(--text-primary)' }}>GPS coordinates:</strong> 
                    <a href={booking.mapLink} target="_blank" rel="noreferrer" style={{ color: 'var(--color-blue-neon)', textDecoration: 'none', marginLeft: '5px' }}>
                      {booking.coordinates?.lat?.toFixed(5)}, {booking.coordinates?.lng?.toFixed(5)} ↗
                    </a>
                  </div>

                  <div className="booking-item-actions">
                    {booking.status === 'pending' && (
                      <button 
                        onClick={() => handleApproveBooking(booking.id)} 
                        className="btn-mini btn-mini-approve"
                      >
                        <FaCheck /> Confirm (WhatsApp Notification)
                      </button>
                    )}
                    {booking.status !== 'cancelled' && booking.status !== 'confirmed' && (
                      <button 
                        onClick={() => handleCancelBooking(booking.id)} 
                        className="btn-mini btn-mini-cancel"
                      >
                        Cancel
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteBooking(booking.id)} 
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: '5px', cursor: 'pointer', marginLeft: 'auto' }}
                      title="Delete log entry"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Operational Analytics Studio Card */}
        <div className="dashboard-card glass-panel" style={{ height: '480px', display: 'flex', flexDirection: 'column' }}>
          <h3 className="dashboard-card-title">
            <FaChartBar style={{ color: 'var(--color-gold-solid)' }} /> Operational Intelligence
          </h3>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '15px' }}>
            Acreage mapped vs. Projected Operations Turnover (H1 2026). Hover data nodes for geodetic details.
          </p>

          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
            <svg viewBox="0 0 500 200" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
              {/* Gridlines */}
              <line x1="50" y1="180" x2="450" y2="180" stroke="var(--border-gold-soft)" strokeWidth="1" />
              <line x1="50" y1="135" x2="450" y2="135" stroke="var(--border-gold-soft)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="50" y1="90" x2="450" y2="90" stroke="var(--border-gold-soft)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="50" y1="45" x2="450" y2="45" stroke="var(--border-gold-soft)" strokeWidth="1" strokeDasharray="3 3" />

              {/* Area Under Curve Gradient */}
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-gold-solid)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--color-gold-solid)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path 
                d="M 50,142.5 L 130,108 L 210,126 L 290,75 L 370,52.5 L 450,15 L 450,180 L 50,180 Z" 
                fill="url(#chartGrad)" 
              />

              {/* Grid Axis Labels */}
              <text x="45" y="183" fill="var(--text-muted)" fontSize="9" textAnchor="end">0 ac</text>
              <text x="45" y="138" fill="var(--text-muted)" fontSize="9" textAnchor="end">30 ac</text>
              <text x="45" y="93" fill="var(--text-muted)" fontSize="9" textAnchor="end">60 ac</text>
              <text x="45" y="48" fill="var(--text-muted)" fontSize="9" textAnchor="end">90 ac</text>

              {/* Mapped Spline Trend Line */}
              <path 
                d="M 50,142.5 L 130,108 L 210,126 L 290,75 L 370,52.5 L 450,15" 
                fill="none" 
                stroke="var(--color-gold-solid)" 
                strokeWidth="3.5"
                strokeLinecap="round"
                className="svg-chart-path"
              />

              {/* Interactive Data Points */}
              {analyticsData.map((d, i) => {
                const x = 50 + i * 80;
                const y = 180 - (d.acres * 1.5);
                return (
                  <g key={i}>
                    {/* Vertical tracking cursor line on hover */}
                    {hoveredData === i && (
                      <line 
                        x1={x} 
                        y1="15" 
                        x2={x} 
                        y2="180" 
                        stroke="var(--border-gold-glow)" 
                        strokeWidth="1" 
                        strokeDasharray="2 2" 
                      />
                    )}
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={hoveredData === i ? 8 : 4.5} 
                      fill="var(--color-gold-solid)" 
                      stroke="var(--bg-dark-deep)"
                      strokeWidth={2}
                      style={{ transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)', cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredData(i)}
                      onMouseLeave={() => setHoveredData(null)}
                    />
                    <text 
                      x={x} 
                      y="195" 
                      fill="var(--text-muted)" 
                      fontSize="10" 
                      textAnchor="middle"
                      fontWeight="500"
                      fontFamily="var(--font-tech)"
                    >
                      {d.month}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay Box */}
            <div style={{
              marginTop: '15px',
              minHeight: '56px',
              padding: '10px 14px',
              background: 'var(--bg-dark-hover)',
              border: '1px solid var(--border-gold-soft)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}>
              {hoveredData !== null ? (
                <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-tech)', display: 'flex', gap: '15px' }}>
                  <div>📅 <strong>{analyticsData[hoveredData].month} 2026</strong></div>
                  <div style={{ borderLeft: '1px solid var(--border-gold-soft)', paddingLeft: '15px' }}>🛰️ <strong>{analyticsData[hoveredData].acres} Acres</strong> mapped</div>
                  <div style={{ borderLeft: '1px solid var(--border-gold-soft)', paddingLeft: '15px' }}>💰 <strong>₹{analyticsData[hoveredData].revenue.toLocaleString('en-IN')}</strong></div>
                </div>
              ) : (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  💡 Hover over data points to examine mapped metrics
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Services pricing modification desk */}
      <div className="admin-table-card glass-panel">
        <h3 className="dashboard-card-title">
          <FaMoneyBillWave style={{ color: 'var(--color-gold-solid)' }} /> Service Catalog & Pricing Studio
        </h3>
        
        <div className="pricing-table-wrapper">
          <table className="luxury-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Service Name</th>
                <th style={{ width: '50%' }}>Description</th>
                <th style={{ width: '20%' }}>Base Price (₹)</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service, index) => (
                <tr key={service.id}>
                  <td>
                    <input
                      type="text"
                      className="table-input"
                      style={{ fontWeight: '600', color: 'var(--color-gold-light)' }}
                      value={service.name}
                      onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                    />
                  </td>
                  <td>
                    <textarea
                      className="table-input"
                      style={{ fontSize: '0.8rem', resize: 'vertical', height: '60px' }}
                      value={service.desc}
                      onChange={(e) => handleServiceChange(index, 'desc', e.target.value)}
                    />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>₹</span>
                      <input
                        type="text"
                        className="table-input"
                        style={{ textAlign: 'right', fontFamily: 'monospace' }}
                        value={service.price}
                        onChange={(e) => handleServiceChange(index, 'price', e.target.value)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp OTP API Gateway Configurator */}
      <div className="admin-table-card glass-panel" style={{ marginTop: '30px' }}>
        <h3 className="dashboard-card-title">
          <FaWhatsapp style={{ color: '#25d366' }} /> WhatsApp OTP Gateway Configurator
        </h3>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
          Select your OTP transmission provider. Toggle between local simulation (zero-cost sandbox) or real-world WhatsApp dispatches.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
          <div className="input-group">
            <label className="input-label">Select OTP Provider</label>
            <select
              className="table-input"
              style={{ padding: '10px 12px', background: '#ffffff', cursor: 'pointer', border: '1px solid rgba(139, 110, 75, 0.25)', color: '#3c3029' }}
              value={waConfig.provider}
              onChange={(e) => handleWaConfigChange('provider', e.target.value)}
            >
              <option value="mock">Simulated WhatsApp OTP (In-App Sandbox)</option>
              <option value="greenapi">Real WhatsApp OTP (via Green-API Free Tier)</option>
            </select>
          </div>

          {waConfig.provider === 'greenapi' && (
            <>
              <div className="input-group">
                <label className="input-label">Green-API idInstance</label>
                <input
                  type="text"
                  className="table-input"
                  placeholder="e.g. 1101234567"
                  value={waConfig.greenApi?.idInstance || ''}
                  onChange={(e) => handleWaGreenApiChange('idInstance', e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Green-API apiTokenInstance</label>
                <input
                  type="password"
                  className="table-input"
                  placeholder="Enter your API token key"
                  value={waConfig.greenApi?.apiTokenInstance || ''}
                  onChange={(e) => handleWaGreenApiChange('apiTokenInstance', e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {waConfig.provider === 'greenapi' && (
          <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(37, 211, 102, 0.05)', border: '1px dashed rgba(37, 211, 102, 0.25)', borderRadius: '8px' }}>
            <p style={{ fontSize: '0.8rem', color: '#25d366', lineHeight: '1.6' }}>
              <strong>🟢 Green-API Free Setup Guide:</strong><br />
              1. Sign up for a free developer account at <a href="https://green-api.com" target="_blank" rel="noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>green-api.com</a>.<br />
              2. Scan the provided QR code with your WhatsApp Web (using a secondary burner or shop phone).<br />
              3. Copy your <code>idInstance</code> and <code>apiTokenInstance</code> and paste them above.<br />
              4. Instantly send <strong>100% free automated WhatsApp messages</strong> directly to any Indian client!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
