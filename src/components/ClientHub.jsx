import React, { useState, useEffect, useRef } from 'react';
import { 
  FaUser, 
  FaCompass, 
  FaMapMarkedAlt, 
  FaRegCalendarAlt, 
  FaPaperPlane, 
  FaLock, 
  FaWhatsapp, 
  FaInfoCircle, 
  FaFileContract, 
  FaRegObjectUngroup, 
  FaMap, 
  FaRulerCombined, 
  FaCheck, 
  FaPlay, 
  FaStar, 
  FaChevronRight, 
  FaGlobe, 
  FaCogs, 
  FaAward, 
  FaSearchLocation,
  FaTimes
} from 'react-icons/fa';
export default function ClientHub({ user, onLogout }) {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  // Payment Session Countdown Timer
  const [paymentTimer, setPaymentTimer] = useState(300); // 5 minutes

  useEffect(() => {
    if (!showPaymentModal) {
      setPaymentTimer(300);
      return;
    }
    const interval = setInterval(() => {
      setPaymentTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowPaymentModal(false);
          alert("Payment session expired. Please re-submit your booking request.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showPaymentModal]);

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    name: '',
    mobile: user.phoneNumber || '',
    email: '',
    workType: '',
    acres: '1',
    preferredDate: '',
    preferredTime: '10:00',
    coordinates: null,
    locationStatus: 'Not Shared'
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Compare Table toggle
  const [showCompareTable, setShowCompareTable] = useState(false);

  // UPI Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [utr, setUtr] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [pendingBookingData, setPendingBookingData] = useState(null);

  // Cost calculator based on acres:
  // 1-2 acres: Rs 4000
  // Above 2 acres: Rs 1500 per acre
  const calculateCost = (acresStr) => {
    const acres = parseFloat(acresStr);
    if (isNaN(acres) || acres <= 0) return 0;
    if (acres <= 2) {
      return 4000;
    } else {
      return acres * 1500;
    }
  };

  // Load services with fallback
  useEffect(() => {
    const savedServices = localStorage.getItem('rishank_services');
    let parsedServices = null;
    
    if (savedServices) {
      try {
        parsedServices = JSON.parse(savedServices);
        if (parsedServices.length !== 1) {
          parsedServices = null;
        }
      } catch (e) {
        console.error("Failed to parse services", e);
        localStorage.removeItem('rishank_services');
      }
    }

    if (parsedServices && Array.isArray(parsedServices) && parsedServices.length > 0) {
      setServices(parsedServices);
    } else {
      const defaultServices = [
        {
          id: 'land-surveyor',
          name: 'Land Surveyor (RTK & DGPS)',
          desc: 'High-precision cadastral boundary mapping, topographical surveys, and boundary line dispute resolution using dual-frequency RTK DGPS receivers.',
          price: '4,000'
        }
      ];
      localStorage.setItem('rishank_services', JSON.stringify(defaultServices));
      setServices(defaultServices);
    }
  }, []);


  const getServiceIcon = (id) => {
    switch (id) {
      case 'land-surveyor': return <FaCompass />;
      default: return <FaCompass />;
    }
  };

  // HTML5 Location Sharing
  const handleShareLocation = () => {
    setBookingForm(prev => ({ ...prev, locationStatus: 'Acquiring GPS...' }));

    if (!navigator.geolocation) {
      setBookingForm(prev => ({ 
        ...prev, 
        locationStatus: 'Failed (Not Supported)',
        coordinates: { lat: 17.0683, lng: 79.2662 }
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setBookingForm(prev => ({
          ...prev,
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          },
          locationStatus: 'Acquired successfully'
        }));
      },
      (error) => {
        setBookingForm(prev => ({
          ...prev,
          coordinates: { lat: 17.0683, lng: 79.2662 },
          locationStatus: 'Permission Denied (Using Nalgonda default)'
        }));
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const openBooking = (service) => {
    setSelectedService(service);
    setBookingForm(prev => ({ ...prev, workType: service.name }));
    setSuccessMsg('');
    
    setTimeout(() => {
      const bookingSec = document.getElementById('booking-section');
      if (bookingSec) {
        bookingSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Form submission handler: Triggers payment modal
  const handleBookingSubmit = (e) => {
    e.preventDefault();

    if (!bookingForm.name || !bookingForm.mobile || !bookingForm.preferredDate) {
      alert('Please fill in Name, Mobile, and Preferred Date.');
      return;
    }

    const lat = bookingForm.coordinates?.lat || 17.0683;
    const lng = bookingForm.coordinates?.lng || 79.2662;
    const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;
    const estimatedPrice = calculateCost(bookingForm.acres);

    // Save temporary booking details until payment is confirmed
    const tempBooking = {
      id: 'B-' + Math.floor(100000 + Math.random() * 900000),
      name: bookingForm.name,
      mobile: bookingForm.mobile,
      email: bookingForm.email,
      workType: bookingForm.workType,
      acres: bookingForm.acres,
      estimatedPrice,
      date: bookingForm.preferredDate,
      time: bookingForm.preferredTime,
      coordinates: { lat, lng },
      mapLink,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    setPendingBookingData(tempBooking);
    setShowPaymentModal(true);
  };

  // Confirm payment & complete booking flow
  const handleConfirmPayment = () => {
    if (!utr || utr.length !== 12 || !/^\d+$/.test(utr)) {
      setPaymentError('Please enter a valid 12-digit UPI Transaction Ref ID (digits only).');
      return;
    }

    setPaymentError('');
    setLoading(true);
    setShowPaymentModal(false);

    setTimeout(() => {
      const finalBooking = {
        ...pendingBookingData,
        utr: utr,
        advancePaid: 500,
        status: 'pending' // Admin confirms status upon verifying UTR
      };

      // 1. Write to persistent local database
      const existingBookings = JSON.parse(localStorage.getItem('rishank_bookings') || '[]');
      existingBookings.push(finalBooking);
      localStorage.setItem('rishank_bookings', JSON.stringify(existingBookings));

      // 2. Clear states
      setLoading(false);
      setSuccessMsg('Booking registered! Redirecting to WhatsApp to send receipt...');

      // 3. Construct direct WhatsApp click-to-chat URL with UTR details
      const text = `Hello Rishank Land Survey Solutions! 🛰️\n\nI have booked a professional survey slot:\n\n👤 *Client Name:* ${finalBooking.name}\n📱 *Contact:* +91 ${finalBooking.mobile}\n🛠️ *Survey Job:* ${finalBooking.workType}\n🌾 *Land Size:* ${finalBooking.acres} Acres\n💰 *Estimated Quote:* ₹${finalBooking.estimatedPrice.toLocaleString('en-IN')}\n💳 *Booking Advance (Paid):* ₹500 (Non-Refundable)\n🧾 *UPI Ref ID (UTR):* ${finalBooking.utr}\n📅 *Preferred Slot:* ${finalBooking.date} at ${finalBooking.time}\n📍 *Exact GPS Location:* ${finalBooking.mapLink}\n\nPlease verify my payment and confirm the slot. Thank you!`;
      
      const whatsappUrl = `https://api.whatsapp.com/send?phone=918522075075&text=${encodeURIComponent(text)}`;
      
      window.open(whatsappUrl, '_blank');

      setTimeout(() => {
        setSuccessMsg('');
        setUtr('');
        setPendingBookingData(null);
        setBookingForm({
          name: '',
          mobile: user.phoneNumber || '',
          email: '',
          workType: '',
          acres: '1',
          preferredDate: '',
          preferredTime: '10:00',
          coordinates: null,
          locationStatus: 'Not Shared'
        });
      }, 3500);

    }, 1500);
  };

  // UPI deep links strings
  const upiId = '8522075075@ybl';
  const upiName = 'Rishank Survey';
  const upiAmount = 500;
  const upiNote = 'Booking Advance';
  const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${upiAmount}&cu=INR&tn=${encodeURIComponent(upiNote)}`;
  
  return (
    <div className="animate-fade-in">
      {/* Immersive Particle Background */}
      <div className="bg-particles">
        <div className="glowing-orbs orb-gold"></div>
        <div className="glowing-orbs orb-blue"></div>
      </div>

      {/* Hero Wrapper: High-End Two-Column Layout */}
      <section className="hero-wrapper luxury-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
        <div className="hero-grid">
          {/* Left Column: Brand details */}
          <div className="hero-left-col">
            <div className="hero-tag">
              <FaCompass /> Precision Geomatics
            </div>
            <h1 className="hero-title" style={{ fontSize: '3.6rem', lineHeight: '1.2', marginBottom: '24px' }}>
              High-Precision <br />
              <span className="gold-text">Land Surveying</span>
            </h1>
            <p className="hero-description" style={{ marginBottom: '35px', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
              Deploying RTK DGPS, Svamitva drones, and ETS stations to deliver sub-centimeter geodetic precision across Telangana. Book slots instantly with satellite-pinned location tagging.
            </p>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <a href="#services" className="btn-premium" data-testid="explore-services-btn">
                Explore Services <FaChevronRight style={{ fontSize: '0.85rem' }} />
              </a>
              <button 
                onClick={() => openBooking({ name: 'General DGPS Land Survey' })} 
                className="btn-secondary-luxury"
                data-testid="instant-booking-btn"
              >
                Instant Booking
              </button>
            </div>
          </div>

          {/* Right Column: Immersive DGPS Rover Panel */}
          <div className="hero-image-col">
            <div className="hero-immersive-image-frame" style={{
              position: 'relative',
              maxWidth: '540px',
              width: '100%',
              borderRadius: '24px',
              overflow: 'hidden',
              border: '1px solid rgba(229, 193, 88, 0.25)',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.55), 0 0 35px rgba(229, 193, 88, 0.2)',
              transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-12px) scale(1.025)';
              e.currentTarget.style.boxShadow = '0 30px 65px rgba(0, 0, 0, 0.65), 0 0 50px rgba(229, 193, 88, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 20px 45px rgba(0, 0, 0, 0.55), 0 0 35px rgba(229, 193, 88, 0.2)';
            }}
            >
              <div className="radar-sweep"></div>
              <img 
                src="/dgps_rover_3d.png" 
                alt="Rishank Immersive GNSS Rover" 
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  display: 'block',
                  transition: 'transform 0.8s ease'
                }} 
              />
              
              {/* Dynamic HUD Overlays */}
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                background: 'rgba(7, 9, 19, 0.85)',
                backdropFilter: 'blur(8px)',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(37, 211, 102, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.75rem',
                fontWeight: '700',
                color: '#25d366',
                fontFamily: 'monospace',
                letterSpacing: '0.05em',
                zIndex: 2
              }}>
                <span className="green-ping-dot" style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#25d366',
                  display: 'inline-block',
                  boxShadow: '0 0 8px #25d366'
                }}></span>
                RTK FIXED STATUS
              </div>

              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                textAlign: 'right',
                fontSize: '0.65rem',
                color: 'rgba(248, 250, 252, 0.85)',
                fontFamily: 'monospace',
                lineHeight: '1.4',
                zIndex: 2,
                background: 'rgba(7, 9, 19, 0.65)',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div>SATELLITE: CARTOSAT-2A</div>
                <div>SENSOR: XS</div>
                <div>RESOLUTION: 0.8m</div>
              </div>

              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                right: '20px',
                background: 'rgba(7, 9, 19, 0.9)',
                backdropFilter: 'blur(10px)',
                padding: '12px 16px',
                borderRadius: '16px',
                border: '1px solid rgba(229, 193, 88, 0.3)',
                color: '#f7f3ed',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                lineHeight: '1.6',
                zIndex: 2
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e5c158', fontWeight: 'bold', marginBottom: '4px' }}>
                  <span>REGION: TELANGANA, INDIA</span>
                  <span>ALTITUDE: 154.2m</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255, 255, 255, 0.75)' }}>
                  <span>SCALE: 1:1,000</span>
                  <span>COORD: 17.0683° N, 79.2662° E</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <div className="trust-strip animate-fade-in">
        <span>👥 Trusted by 500+ landowners</span>
        <span className="trust-badge-bullet">•</span>
        <span>📜 ISO 9001:2015 Certified</span>
        <span className="trust-badge-bullet">•</span>
        <span>🛰️ Government Licensed Surveyors</span>
      </div>

      {/* Services Redesign Section with Ivory topographic mesh */}
      <section id="services" className="luxury-ivory-mesh">
        {/* Mesh Background Nodes */}
        <div className="gradient-mesh-orb-1"></div>
        <div className="gradient-mesh-orb-2"></div>
        <div className="gold-telemetry-grid"></div>

        {/* Floating Telemetry and Coordinates Decors */}
        <div className="floating-decor coord-1">17.0683° N</div>
        <div className="floating-decor coord-2">79.2662° E</div>
        <div className="floating-decor crosshair-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(184, 148, 90, 0.2)" strokeWidth="1.2">
            <circle cx="12" cy="12" r="8" />
            <line x1="12" y1="2" x2="12" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
        </div>
        <div className="floating-decor crosshair-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(184, 148, 90, 0.15)" strokeWidth="1">
            <path d="M12 2v20M2 12h20M12 6a6 6 0 100 12 6 6 0 000-12z" />
          </svg>
        </div>

        {/* Animated Satellite Ping Decors */}
        <div className="satellite-ping ping-1"></div>
        <div className="satellite-ping ping-2"></div>
        <div className="satellite-ping ping-3"></div>

        {/* Floating Testimonial Micro-card */}
        <div className="testimonial-micro-card">
          <div style={{ display: 'flex', color: '#B8945A', gap: '3px', marginBottom: '8px' }}>
            <FaStar/><FaStar/><FaStar/><FaStar/><FaStar/>
          </div>
          <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '10px' }}>
            "Sub-centimeter accuracy. Their DGPS report was approved by the revenue department in Nalgonda without any queries."
          </p>
          <strong style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontFamily: 'var(--font-tech)' }}>— Venkat Reddy, Landowner</strong>
        </div>

        <div className="luxury-container">
          <div className="section-header" style={{ position: 'relative', zIndex: 2, marginBottom: '60px' }}>
            <div className="eyebrow-text" style={{ margin: '0 auto 15px' }}>SCOPE OF EXPERTISE</div>
            <h2 className="serif-header" style={{ textAlign: 'center' }}>
              Our <em>Premium</em> Services
            </h2>
            <p className="tagline-text" style={{ textAlign: 'center' }}>Precision. Trust. Land Intelligence.</p>
          </div>

          <div className="services-grid" style={services.length === 1 ? { display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 2 } : { position: 'relative', zIndex: 2 }}>
            {services.map((service) => (
              <div key={service.id} className="glass-service-card animate-fade-up delay-1" style={services.length === 1 ? { maxWidth: '520px', width: '100%' } : {}}>
                
                {/* Most Popular Ribbon for Featured Service */}
                {service.id === 'land-surveyor' && (
                  <div className="card-ribbon">Best Choice</div>
                )}

                {/* Device/Tool Mockup at top with glow */}
                <div className="service-card-image-wrapper" style={{ position: 'relative' }}>
                  <img 
                    src="/dgps_rover_3d.png" 
                    alt={service.name} 
                    className="service-card-img" 
                  />
                  <span className="service-card-tag">
                    DGPS RTK Precision
                  </span>
                  
                  <div className="rtk-status-badge">
                    <span className="green-ping-dot"></span> RTK FIXED
                  </div>
                </div>

                <div>
                  <div className="card-icon-box-premium">
                    {getServiceIcon(service.id)}
                  </div>
                  <h3 className="card-title-tech">{service.name}</h3>
                  <p className="service-desc" style={{ marginBottom: '20px' }}>{service.desc}</p>
                  
                  {/* Feature chips */}
                  <div className="feature-chips-container">
                    <span className="feature-chip">✓ Govt-Approved</span>
                    <span className="feature-chip">✓ Sub-cm Accuracy</span>
                    <span className="feature-chip">✓ 24hr Delivery</span>
                    <span className="feature-chip">✓ Digital Report</span>
                  </div>
                </div>
                
                <div>
                  <div className="service-price-tag" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px', marginBottom: '20px' }}>
                    <div className="dotted-divider-row">
                      <span className="price-label" style={{ textTransform: 'none', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>1 - 2 Acres</span>
                      <span className="dotted-divider-line"></span>
                      <span className="price-value" style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-gold-solid)' }}>
                        <span className="currency-symbol">₹</span>4,000
                      </span>
                    </div>
                    <div className="dotted-divider-row" style={{ paddingTop: '4px' }}>
                      <span className="price-label" style={{ textTransform: 'none', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Above 2 Acres</span>
                      <span className="dotted-divider-line"></span>
                      <span className="price-value" style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-gold-solid)' }}>
                        <span className="currency-symbol">₹</span>1,500 <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ Acre</span>
                      </span>
                    </div>
                  </div>

                  <div style={{ 
                    margin: '12px 0 16px', 
                    padding: '10px 14px', 
                    background: 'rgba(184, 148, 90, 0.08)', 
                    border: '1px dashed rgba(184, 148, 90, 0.3)', 
                    borderRadius: '10px', 
                    fontSize: '0.8rem', 
                    color: '#8B6B3D',
                    textAlign: 'center',
                    lineHeight: '1.4',
                    fontFamily: 'var(--font-tech)'
                  }}>
                    🔒 <strong>₹500 Advance Payment</strong> required to book slot (Non-Refundable).
                  </div>

                  <button 
                    onClick={() => openBooking(service)} 
                    className="btn-premium-round" 
                    data-testid="book-service-now-btn"
                  >
                    Book Service Now <FaChevronRight style={{ fontSize: '0.8rem' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Stats Counter Row */}
          <div className="stats-counter-row">
            <div className="stat-counter-item">
              <span className="stat-counter-number">10,000+</span>
              <span className="stat-counter-label">Acres Surveyed</span>
            </div>
            <div className="stat-counter-item">
              <span className="stat-counter-number">99.8%</span>
              <span className="stat-counter-label">Precision Rating</span>
            </div>
            <div className="stat-counter-item">
              <span className="stat-counter-number">500+</span>
              <span className="stat-counter-label">Clients Served</span>
            </div>
            <div className="stat-counter-item">
              <span className="stat-counter-number">15+</span>
              <span className="stat-counter-label">Years Operations</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <button 
              onClick={() => setShowCompareTable(!showCompareTable)} 
              className="btn-secondary-luxury"
              style={{ fontSize: '0.9rem', padding: '0.7rem 1.8rem', textDecoration: 'none' }}
              data-testid="compare-services-btn"
            >
              📊 {showCompareTable ? 'Hide Services Grid Comparison' : 'Compare All Services Spec Sheet'}
            </button>
          </div>

          {/* Interactive Comparison Specs Sheet */}
          {showCompareTable && (
            <div className="glass-panel animate-fade-in" style={{ padding: '2rem', marginTop: '30px', overflowX: 'auto', background: 'rgba(255,255,255,0.95)' }}>
              <table className="luxury-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Geodetic System</th>
                    <th>Precision Accuracy</th>
                    <th>Govt Approval Rate</th>
                    <th>Ideal For</th>
                    <th>Lead Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>RTK DGPS Rover</strong></td>
                    <td style={{ color: '#25d366', fontWeight: '600' }}>Sub-1cm (Horizontal)</td>
                    <td>100% (Revenue Dept Approved)</td>
                    <td>Agricultural Boundariers, Partition Disagreement</td>
                    <td>24 - 48 Hours</td>
                  </tr>
                  <tr>
                    <td><strong>ETS Total Station</strong></td>
                    <td style={{ color: '#25d366', fontWeight: '600' }}>1-Arc Second Angular</td>
                    <td>100% (Building Layout designs)</td>
                    <td>Plots Division, Road contours, Layout marking</td>
                    <td>48 Hours</td>
                  </tr>
                  <tr>
                    <td><strong>UAV Survey Drone</strong></td>
                    <td style={{ color: '#25d366', fontWeight: '600' }}>2-3cm (GSD Map Scale)</td>
                    <td>98% (Svamitva Scheme Compliant)</td>
                    <td>Massive Land parcel contours, Orthomosaics</td>
                    <td>3 - 5 Days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

        </div>
      </section>

      {/* How it Works Timeline */}
      <section className="how-it-works-section">
        <div className="luxury-container">
          <div className="section-header" style={{ marginBottom: '50px' }}>
            <div className="eyebrow-text" style={{ margin: '0 auto 15px' }}>OPERATIONS FLOW</div>
            <h2 className="serif-header" style={{ textAlign: 'center', fontSize: '3rem' }}>
              How It <em>Works</em>
            </h2>
            <p className="tagline-text" style={{ textAlign: 'center' }}>Three Steps to Precision Mapping</p>
          </div>

          <div className="timeline-steps-container">
            <div className="timeline-step">
              <div className="timeline-step-icon">
                <FaRegCalendarAlt />
              </div>
              <h4 className="timeline-step-title">1. Book & Deposit</h4>
              <p className="timeline-step-desc">
                Select your service, share boundaries, pay ₹500 booking deposit to lock your geodetic survey schedule.
              </p>
            </div>

            <div className="timeline-step">
              <div className="timeline-step-icon">
                <FaCompass />
              </div>
              <h4 className="timeline-step-title">2. On-Field Survey</h4>
              <p className="timeline-step-desc">
                Field engineers navigate to your satellite coordinates, lock DGPS RTK signals, and record raw boundary coordinate phase pings.
              </p>
            </div>

            <div className="timeline-step">
              <div className="timeline-step-icon">
                <FaFileContract />
              </div>
              <h4 className="timeline-step-title">3. Geomatic Report</h4>
              <p className="timeline-step-desc">
                Download your digitized boundary maps, area calculation logs, and raw coordinate text reports ready for land registry.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Booking Form Sheet Section (Details Section) */}
      <section id="booking-section" className="services-section luxury-container" style={{ scrollMarginTop: '120px', marginTop: '60px', marginBottom: '60px' }}>
        <div className="section-header" style={{ marginBottom: '30px' }}>
          <p className="section-subtitle">Secure Your Survey</p>
          <h2 className="section-title">Schedule & Booking Details</h2>
        </div>

        <div className="glass-panel" style={{ maxWidth: '700px', margin: '0 auto', padding: '2.5rem' }}>
          <p className="modal-subtitle" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            Enter your details below to request a premium survey slot. High-precision GPS boundary tags will be linked automatically.
          </p>

          {successMsg ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="spinner" style={{ margin: '0 auto 20px', width: '50px', height: '50px' }}></div>
              <h4 style={{ color: '#25d366', fontSize: '1.2rem', marginBottom: '10px' }}>{successMsg}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Redirecting to WhatsApp to send survey location coordinates...</p>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit}>
              <div className="input-group">
                <label className="input-label">Your Full Name</label>
                <div className="input-wrapper">
                  <span className="input-icon"><FaUser /></span>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Karthik Reddy"
                    value={bookingForm.name}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, name: e.target.value }))}
                    required 
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Mobile Number</label>
                <div className="input-wrapper">
                  <span className="input-icon"><FaUser /></span>
                  <span className="phone-prefix">+91</span>
                  <input 
                    type="tel" 
                    className="input-field phone-input" 
                    placeholder="95814 21614"
                    value={bookingForm.mobile}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, mobile: e.target.value.replace(/\D/g, '') }))}
                    required 
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Email Address (Optional)</label>
                <div className="input-wrapper">
                  <span className="input-icon"><FaUser /></span>
                  <input 
                    type="email" 
                    className="input-field" 
                    placeholder="karthik@example.com"
                    value={bookingForm.email}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Type of Survey Selected</label>
                <div className="input-wrapper">
                  <span className="input-icon"><FaCompass /></span>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Select a service above or enter type of survey"
                    value={bookingForm.workType}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, workType: e.target.value }))}
                    required 
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Land Size (Acres)</label>
                <div className="input-wrapper">
                  <span className="input-icon"><FaRulerCombined /></span>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0.1"
                    className="input-field" 
                    placeholder="Enter acreage, e.g., 2.5"
                    value={bookingForm.acres}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, acres: e.target.value }))}
                    required 
                  />
                </div>
                {parseFloat(bookingForm.acres) > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', background: 'rgba(139, 110, 75, 0.05)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-gold-soft)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Estimated Cost:</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--color-gold-solid)' }}>
                        ₹{calculateCost(bookingForm.acres).toLocaleString('en-IN')} 
                        {parseFloat(bookingForm.acres) <= 2 ? ' (Flat rate)' : ` (${bookingForm.acres} Acres @ ₹1,500/Acre)`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-gold-soft)', paddingTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>Booking Advance (Required):</span>
                      <span style={{ fontWeight: '700', color: 'var(--color-gold-solid)' }}>₹500 (Non-Refundable)</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="input-group">
                  <label className="input-label">Preferred Date</label>
                  <div className="input-wrapper">
                    <span className="input-icon"><FaRegCalendarAlt /></span>
                    <input 
                      type="date" 
                      className="input-field"
                      value={bookingForm.preferredDate}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, preferredDate: e.target.value }))}
                      required 
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Preferred Time</label>
                  <div className="input-wrapper">
                    <span className="input-icon"><FaRegCalendarAlt /></span>
                    <input 
                      type="time" 
                      className="input-field"
                      value={bookingForm.preferredTime}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, preferredTime: e.target.value }))}
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* GPS Location Share Panel */}
              <div className="input-group">
                <label className="input-label">Transmit Live Boundary GPS Coordinates</label>
                <div className="location-row">
                  <button 
                    type="button" 
                    onClick={handleShareLocation}
                    className="btn-location"
                  >
                    <FaMapMarkedAlt />
                    Share My Location
                  </button>
                  <div className="location-coordinates">
                    {bookingForm.coordinates ? (
                      `${bookingForm.coordinates.lat.toFixed(6)}° N, ${bookingForm.coordinates.lng.toFixed(6)}° E`
                    ) : (
                      bookingForm.locationStatus
                    )}
                  </div>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Locks onto high-accuracy orbital GPS satellites to pinpoint boundary corners instantly.
                </p>
              </div>

              <button 
                type="submit" 
                className="btn-premium" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
                disabled={loading}
                data-testid="submit-booking-btn"
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
                    Linking Satellites...
                  </>
                ) : (
                  <>
                    <FaWhatsapp style={{ fontSize: '1.2rem' }} />
                    Proceed to Advance Payment
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* UPI QR Code Advance Payment Modal */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(7, 9, 19, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          zIndex: 2000
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%',
            maxWidth: '460px',
            background: 'white',
            padding: '2rem',
            position: 'relative',
            borderRadius: '24px',
            border: '1px solid rgba(184, 148, 90, 0.35)',
            boxShadow: 'var(--shadow-gold)'
          }}>
            <button 
              onClick={() => setShowPaymentModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              <FaTimes />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '1.8rem', color: 'var(--color-gold-solid)', marginBottom: '8px' }}>🛰️ Secure UPI Portal</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>Rishank Slot Booking Deposit</h3>
              
              <div style={{ 
                margin: '10px auto', 
                padding: '4px 12px', 
                background: 'var(--bg-error)', 
                border: '1px solid var(--border-error)', 
                borderRadius: '20px', 
                width: 'fit-content',
                fontSize: '0.8rem',
                color: 'var(--color-error)',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span className="red-ping-dot"></span>
                Session Expires: {formatTimer(paymentTimer)}
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                A non-refundable advance of <strong>₹500</strong> is required to lock your geodetic appointment.
              </p>
            </div>

            {/* Programmatic Dynamic QR Code */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
              <div style={{
                padding: '12px',
                background: 'white',
                border: '1px solid rgba(184, 148, 90, 0.2)',
                borderRadius: '16px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
              }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUri)}`}
                  alt="UPI Pay QR Code"
                  style={{ display: 'block', width: '180px', height: '180px' }}
                />
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>UPI ID:</span>
              <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--color-gold-solid)', marginTop: '2px', fontFamily: 'monospace' }}>
                {upiId}
              </strong>
            </div>

            {/* Mobile Quick Action intent links */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '25px', width: '100%' }}>
              <a 
                href={upiUri}
                className="btn-secondary-luxury"
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', padding: '10px 5px', gap: '5px' }}
              >
                📱 Pay via App
              </a>
            </div>

            {/* Transaction Reference input */}
            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label className="input-label" style={{ fontSize: '0.75rem' }}>Enter 12-Digit UPI Ref No (UTR) / Txn ID</label>
              <div className="input-wrapper">
                <span className="input-icon"><FaLock /></span>
                <input 
                  type="text" 
                  maxLength="12"
                  className="input-field" 
                  placeholder="e.g. 614002234901"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              {paymentError && (
                <p style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '6px', fontWeight: '600' }}>⚠️ {paymentError}</p>
              )}
            </div>

            <button 
              onClick={handleConfirmPayment}
              className="btn-premium"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Verify Payment & Open WhatsApp
            </button>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.72rem', 
              color: 'var(--text-muted)',
              marginTop: '15px',
              fontFamily: 'var(--font-tech)'
            }}>
              <FaLock style={{ color: 'var(--color-success)', fontSize: '0.8rem' }} />
              <span>Secure TLS 1.3 256-Bit Encrypted Transfer</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating WhatsApp CTA */}
      <a 
        href="https://api.whatsapp.com/send?phone=918522075075&text=Hello!%20I%20have%20a%20land%20surveying%20requirement.%20Please%20guide%20me." 
        target="_blank" 
        rel="noreferrer" 
        className="whatsapp-floating-cta"
      >
        <FaWhatsapp style={{ fontSize: '1.25rem' }} />
        <span>Talk to a Surveyor</span>
      </a>

    </div>
  );
}
