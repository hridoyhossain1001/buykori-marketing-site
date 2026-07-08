    // Theme Toggle
    function toggleTheme() {
      const html = document.documentElement;
      const isDark = html.classList.toggle('dark');
      localStorage.setItem('bk_theme', isDark ? 'dark' : 'light');
    }

    // Mobile Menu Toggle Functions for small screen navigation
    function toggleMobileMenu() {
      const toggle = document.getElementById('menuToggle');
      const links = document.getElementById('navLinks');
      const isOpen = links.classList.toggle('active');
      toggle.classList.toggle('active', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    function closeMobileMenu() {
      const toggle = document.getElementById('menuToggle');
      const links = document.getElementById('navLinks');
      toggle.classList.remove('active');
      links.classList.remove('active');
      document.body.style.overflow = '';
    }

    // Auth Modal
    const overlay = document.getElementById('auth-overlay');
    const modal = document.getElementById('auth-modal');
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const panelLogin = document.getElementById('panel-login');
    const panelSignup = document.getElementById('panel-signup');
    const modalTitle = document.getElementById('modal-title');
    const modalSub = document.getElementById('modal-sub');
    const authAlert = document.getElementById('auth-alert');
    const authAlertText = document.getElementById('auth-alert-text');
    const authSuccess = document.getElementById('auth-success');
    const linkToSignup = document.getElementById('link-to-signup');
    const linkToLogin = document.getElementById('link-to-login');
    const modalClose = document.getElementById('modal-close');
    let selectedSignupPlan = 'growth_trial';

    function showAlert(msg) { authAlertText.textContent = msg; authAlert.style.display = 'flex'; }
    function hideAlert() { authAlert.style.display = 'none'; }

    function activateTab(tab) {
      const isLogin = tab === 'login';
      tabLogin.classList.toggle('active', isLogin);
      tabSignup.classList.toggle('active', !isLogin);
      panelLogin.classList.toggle('active', isLogin);
      panelSignup.classList.toggle('active', !isLogin);
      authSuccess.style.display = 'none';
      modalTitle.textContent = isLogin ? 'Welcome Back' : 'Create Store Account';
      modalSub.textContent = isLogin ? 'Log in to manage your server-side event tracking.' : 'Start tracking WooCommerce server events in minutes.';
      hideAlert();
    }

    function openModal(tab = 'login', signupPlan = 'growth_trial') {
      panelLogin.reset(); panelSignup.reset();
      selectedSignupPlan = signupPlan;
      authSuccess.style.display = 'none';
      activateTab(tab);
      overlay.classList.add('active');
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      overlay.classList.remove('active');
      modal.classList.remove('active');
      document.body.style.overflow = '';
      panelLogin.reset(); panelSignup.reset();
      hideAlert();
    }

    tabLogin.addEventListener('click', () => activateTab('login'));
    tabSignup.addEventListener('click', () => activateTab('signup'));
    linkToSignup.addEventListener('click', e => { e.preventDefault(); activateTab('signup'); });
    linkToLogin.addEventListener('click', e => { e.preventDefault(); activateTab('login'); });
    modalClose.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    modal.addEventListener('click', e => e.stopPropagation());

    document.addEventListener('click', function (e) {
      const trigger = e.target.closest('[data-auth-mode]');
      if (trigger) {
        e.preventDefault();
        openModal(
          trigger.dataset.authMode === 'login' ? 'login' : 'signup',
          trigger.dataset.signupPlan || 'growth_trial'
        );
      }
    });

    function readableAuthMessage(value, fallback = 'Authentication error.') {
      if (!value) return fallback;
      if (typeof value === 'string') return value;
      if (Array.isArray(value)) {
        const messages = value.map(item => readableAuthMessage(item, '')).filter(Boolean);
        return messages.length ? messages.join(' ') : fallback;
      }
      if (typeof value === 'object') {
        for (const key of ['detail', 'message', 'error', 'msg']) {
          if (value[key]) return readableAuthMessage(value[key], fallback);
        }
        try {
          return JSON.stringify(value);
        } catch (_) {
          return fallback;
        }
      }
      return String(value);
    }

    async function submitForm(form, endpoint, payloadFn) {
      const btn = form.querySelector('.auth-submit');
      const text = btn.querySelector('.btn-text');
      const spinner = btn.querySelector('.spinner');
      btn.disabled = true; text.style.opacity = '0.5'; spinner.style.display = 'inline-block';
      hideAlert();
      try {
        const payload = payloadFn();
        const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const d = await r.json();
        if (!r.ok) throw new Error(readableAuthMessage(d));
        if (d.status === 'verify_email_required') {
          const email = d.email || payload.email || '';
          const verifyUrl = d.verifyUrl || `/client/verify-email?email=${encodeURIComponent(email)}`;
          window.location.assign(`https://api.buykori.app${verifyUrl}`);
          return;
        }
        panelLogin.style.display = 'none'; panelSignup.style.display = 'none';
        document.querySelector('.auth-tabs').style.display = 'none';
        modalTitle.style.display = 'none'; modalSub.style.display = 'none';
        authSuccess.style.display = 'flex';
        setTimeout(() => window.location.assign('https://client.buykori.app'), 1200);
      } catch (err) {
        showAlert(err.message);
        btn.disabled = false; text.style.opacity = '1'; spinner.style.display = 'none';
      }
    }

    function setSignupCodeStatus(message, isError = false) {
      const status = document.getElementById('signup-code-status');
      if (!status) return;
      status.textContent = message || '';
      status.style.color = isError ? '#b91c1c' : '#047857';
    }

    async function sendSignupCode() {
      const email = document.getElementById('signup-email').value.trim();
      if (!email) {
        showAlert('Enter your email address first.');
        return;
      }
      const btn = document.getElementById('signup-send-code');
      const text = btn.querySelector('.btn-text');
      const spinner = btn.querySelector('.spinner');
      btn.disabled = true; text.style.opacity = '0.5'; spinner.style.display = 'inline-block';
      hideAlert();
      setSignupCodeStatus('');
      try {
        const r = await fetch('/api/v1/auth/client/signup/email-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const d = await r.json();
        if (!r.ok) throw new Error(readableAuthMessage(d));
        setSignupCodeStatus(`Code sent to ${d.email || email}. Check your inbox.`);
      } catch (err) {
        setSignupCodeStatus(err.message || 'Could not send code.', true);
        showAlert(err.message || 'Could not send code.');
      } finally {
        btn.disabled = false; text.style.opacity = '1'; spinner.style.display = 'none';
      }
    }

    panelLogin.addEventListener('submit', e => {
      e.preventDefault();
      submitForm(panelLogin, '/api/v1/auth/client/login', () => ({
        email: panelLogin.querySelector('#login-email').value.trim(),
        password: panelLogin.querySelector('#login-password').value
      }));
    });

    document.getElementById('signup-send-code')?.addEventListener('click', sendSignupCode);

    panelSignup.addEventListener('submit', e => {
      e.preventDefault();
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;
      if (password !== confirmPassword) {
        showAlert("Passwords do not match.");
        return;
      }
      submitForm(panelSignup, '/api/v1/auth/client/signup', () => ({
        full_name: document.getElementById('signup-fullname').value.trim(),
        business_name: document.getElementById('signup-bizname').value.trim(),
        email: document.getElementById('signup-email').value.trim(),
        email_code: document.getElementById('signup-email-code').value.trim(),
        phone_number: document.getElementById('signup-phone').value.trim(),
        password: password,
        domain: document.getElementById('signup-domain').value.trim() || null,
        selected_plan: selectedSignupPlan
      }));
    });

    // Real-Time Dashboard Live Ticker & Interaction Simulation
    document.addEventListener('DOMContentLoaded', () => {
      const eventsEl = document.querySelector('.bk-metrics-mini .bk-metric-card:first-child strong');
      const revEl = document.querySelector('.bk-metrics-mini .bk-metric-card:last-child strong');

      if (eventsEl) {
        let count = 16928;
        setInterval(() => {
          const increment = Math.floor(Math.random() * 3) + 1; // +1 to +3 events
          count += increment;
          eventsEl.textContent = count.toLocaleString('en-US');
          
          // Flash Indigo glow indicating active server event arrival
          eventsEl.style.transition = 'color 0.2s ease';
          eventsEl.style.color = '#818cf8'; 
          setTimeout(() => {
            eventsEl.style.color = ''; 
          }, 500);
        }, 3500);
      }

      if (revEl) {
        let rev = 8742.50; // $8.7K
        setInterval(() => {
          const addRev = parseFloat((Math.random() * 18 + 4).toFixed(2)); // +$4 to +$22
          rev += addRev;
          
          // Format as $X.XXK
          revEl.textContent = '$' + (rev / 1000).toFixed(2) + 'K';
          
          // Flash Emerald Green glow indicating successful conversion payout/revenue
          revEl.style.transition = 'color 0.2s ease';
          revEl.style.color = '#34d399'; 
          setTimeout(() => {
            revEl.style.color = '';
          }, 500);
        }, 6500);
      }

      // Sidebar menu items click simulation
      const asideItems = document.querySelectorAll('.bk-aside-nav p');
      asideItems.forEach(item => {
        item.addEventListener('click', () => {
          asideItems.forEach(i => i.classList.remove('active'));
          item.classList.add('active');
        });
      });
    });

    // ─── COURIER BOOKING SIMULATION ENGINE ───
    let bookingTimeout = null;

    function simulateCourierBooking(provider) {
      // Clear any existing active timeout to prevent overlap
      if (bookingTimeout) clearTimeout(bookingTimeout);

      const steadfastBtn = document.querySelector('.steadfast-btn');
      const pathaoBtn = document.querySelector('.pathao-btn');
      const providerBadge = document.getElementById('courier-live-provider');
      const trackingIdEl = document.getElementById('courier-tracking-id');
      const statusEl = document.getElementById('courier-delivery-status');

      // Timeline nodes references
      const steps = {
        ordered: document.getElementById('step-ordered'),
        booked: document.getElementById('step-booked'),
        transit: document.getElementById('step-transit'),
        delivered: document.getElementById('step-delivered'),
      };

      // Reset all steps to baseline state
      Object.values(steps).forEach(s => {
        if (s) {
          s.classList.remove('active');
          s.classList.remove('completed');
        }
      });
      
      // Ordered is always complete when starting a new booking
      if (steps.ordered) {
        steps.ordered.classList.add('active');
      }

      // Disable action buttons during active simulation
      if (steadfastBtn) steadfastBtn.disabled = true;
      if (pathaoBtn) pathaoBtn.disabled = true;

      const activeBtn = provider === 'steadfast' ? steadfastBtn : pathaoBtn;
      const originalText = activeBtn ? activeBtn.innerHTML : '';
      if (activeBtn) {
        activeBtn.innerHTML = `<span>⏳ Booking...</span>`;
      }

      // Update provider badge
      if (providerBadge) {
        providerBadge.textContent = provider === 'steadfast' ? 'Steadfast' : 'Pathao';
        providerBadge.className = `bk-provider-badge ${provider}`;
      }

      // Update delivery status warning text
      if (statusEl) {
        statusEl.textContent = 'Submitting API Request...';
        statusEl.className = 'bk-status-text warning';
      }

      // Phase 1: Booked (Fulfillment Complete) - executes in 1 second
      bookingTimeout = setTimeout(() => {
        // Restore buttons state
        if (activeBtn) activeBtn.innerHTML = originalText;
        if (steadfastBtn) steadfastBtn.disabled = false;
        if (pathaoBtn) pathaoBtn.disabled = false;

        // Generate a mock tracking code representing active API response payload
        const trackingId = provider === 'steadfast' 
          ? 'SF' + Math.floor(100000 + Math.random() * 900000)
          : 'PT' + Math.floor(100000 + Math.random() * 900000);

        if (trackingIdEl) trackingIdEl.textContent = trackingId;
        if (statusEl) {
          statusEl.textContent = 'Booked successfully!';
          statusEl.className = 'bk-status-text success';
        }

        // Advance progress bar steps
        if (steps.ordered) {
          steps.ordered.classList.remove('active');
          steps.ordered.classList.add('completed');
        }
        if (steps.booked) {
          steps.booked.classList.add('active');
        }

        // Phase 2: In Transit - executes in 2.5 seconds total elapsed
        bookingTimeout = setTimeout(() => {
          if (statusEl) {
            statusEl.textContent = 'In Transit (Dhaka Hub)';
            statusEl.className = 'bk-status-text primary';
          }
          if (steps.booked) {
            steps.booked.classList.remove('active');
            steps.booked.classList.add('completed');
          }
          if (steps.transit) {
            steps.transit.classList.add('active');
          }

          // Phase 3: Delivered (webhook received) - executes in 4.5 seconds total elapsed
          bookingTimeout = setTimeout(() => {
            if (statusEl) {
              statusEl.textContent = 'Delivered (Received)';
              statusEl.className = 'bk-status-text success';
            }
            if (steps.transit) {
              steps.transit.classList.remove('active');
              steps.transit.classList.add('completed');
            }
            if (steps.delivered) {
              steps.delivered.classList.add('completed');
            }
          }, 2000);
        }, 1500);
      }, 1000);
    }

    // ─── INTERACTIVE EMQ CALCULATOR ENGINE ───
    function updateEMQScore() {
      const emailCb = document.getElementById('emq-param-email');
      const phoneCb = document.getElementById('emq-param-phone');
      const nameCb = document.getElementById('emq-param-name');
      const ipCb = document.getElementById('emq-param-ip');
      const geoCb = document.getElementById('emq-param-geo');
      const clicksCb = document.getElementById('emq-param-clicks');

      const progressStroke = document.getElementById('emq-progress-stroke');
      const scorePercent = document.getElementById('emq-score-percent');
      const scoreRating = document.getElementById('emq-score-rating');
      const adviceText = document.getElementById('emq-advice-text');

      if (!progressStroke || !scorePercent) return;

      let score = 0;
      if (emailCb && emailCb.checked) score += parseInt(emailCb.value);
      if (phoneCb && phoneCb.checked) score += parseInt(phoneCb.value);
      if (nameCb && nameCb.checked) score += parseInt(nameCb.value);
      if (ipCb && ipCb.checked) score += parseInt(ipCb.value);
      if (geoCb && geoCb.checked) score += parseInt(geoCb.value);
      if (clicksCb && clicksCb.checked) score += parseInt(clicksCb.value);

      // Bound score between 0 and 100 just in case
      score = Math.min(Math.max(score, 0), 100);

      // Animate SVG Stroke Offset (Dasharray is 314)
      const strokeLength = 314;
      const offset = strokeLength - (strokeLength * score / 100);
      progressStroke.style.strokeDashoffset = offset;

      // Update text percentage
      scorePercent.textContent = score + '%';

      // Update color and text based on score tier
      let ratingClass = 'warning';
      let ratingText = 'Good';
      let strokeColor = '#f59e0b'; // Default Amber
      let advice = '';

      if (score < 40) {
        ratingClass = 'danger';
        ratingText = 'Poor';
        strokeColor = '#ef4444'; // Red
        advice = 'Critical! Ad platforms cannot match conversions with such limited parameters. Your ad budget is likely being wasted due to poor tracking. <strong>AdSync</strong> can immediately double this score!';
      } else if (score < 80) {
        ratingClass = 'warning';
        ratingText = 'Good';
        strokeColor = '#f59e0b'; // Amber
        advice = 'Good quality! AdSync can boost this score to <strong>9.6/10 (Excellent)</strong> by injecting missing client IP/UA matching parameters automatically on the server side.';
      } else {
        ratingClass = 'success';
        ratingText = 'Excellent';
        strokeColor = '#34d399'; // Emerald Green
        advice = 'Excellent score! With these parameters active on <strong>AdSync</strong>, your conversions will achieve peak match quality, allowing Facebook & TikTok algorithms to optimize for highest ROAS!';
      }

      scoreRating.textContent = ratingText;
      scoreRating.className = ratingClass;
      progressStroke.style.stroke = strokeColor;
      if (adviceText) adviceText.innerHTML = advice;
    }

    // Call updateEMQScore automatically on page load to initialize the default state
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(updateEMQScore, 200);

      // ─── Scroll Reveal Observer ───
      const revealSections = document.querySelectorAll('.bk-section-wrap, .bk-cta-section');
      revealSections.forEach(s => s.classList.add('bk-reveal'));

      const staggerGrids = document.querySelectorAll('.bk-feat-grid, .bk-steps-grid, .bk-testi-grid, .bk-plan-grid');

      const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            sectionObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

      const gridObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('stagger-visible');
            gridObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

      revealSections.forEach(s => sectionObserver.observe(s));
      staggerGrids.forEach(g => gridObserver.observe(g));
    });
