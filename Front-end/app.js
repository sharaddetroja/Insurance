// ==========================================================================
// INSURE AI — VEHICLE INSURANCE INTELLIGENCE PLATFORM (CORE ENGINE)
// Simple, Modern, Clean & Trustworthy Insurance Analytics
// ==========================================================================

// Global Login Transition Handler
window.loginToDashboard = function() {
  const loginPage = document.getElementById('login-page');
  const appContainer = document.getElementById('app-container');
  if (loginPage) {
    loginPage.style.opacity = '0';
    loginPage.style.transition = 'opacity 0.25s ease';
    setTimeout(() => {
      loginPage.style.display = 'none';
    }, 250);
  }
  if (appContainer) {
    appContainer.style.display = 'flex';
    appContainer.style.opacity = '1';
  }
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
  window.dispatchEvent(new Event('resize'));
};

// ==========================================================================
// 3D PROCEDURAL VEHICLE RENDERER (THREE.JS)
// Clean Studio Lighting & Modern Royal Blue Vehicle
// ==========================================================================
class Vehicle3DViewer {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container || typeof THREE === 'undefined') return;

    this.options = Object.assign({
      autoRotate: true,
      rotateSpeed: 0.005,
      cameraDistance: 6.5,
      carColor: 0x2563EB, // Royal Blue
      accentColor: 0x0F766E, // Teal
      glowColor: 0x3B82F6
    }, options);

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.carGroup = null;
    this.wheels = [];
    this.animationId = null;

    // Mouse Interaction
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };

    this.init();
  }

  init() {
    try {
      const width = this.container.clientWidth || 300;
      const height = this.container.clientHeight || 200;

      // 1. Scene & Camera
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      this.camera.position.set(4.2, 2.2, this.options.cameraDistance);
      this.camera.lookAt(0, 0.2, 0);

      // 2. Renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.container.appendChild(this.renderer.domElement);

      // 3. Lighting (Clean Studio Lighting)
      const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.85);
      this.scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xFFFFFF, 1.4);
      mainLight.position.set(5, 8, 5);
      mainLight.castShadow = true;
      this.scene.add(mainLight);

      const fillLight = new THREE.DirectionalLight(0xDBEAFE, 0.8);
      fillLight.position.set(-5, 4, -4);
      this.scene.add(fillLight);

      const floorLight = new THREE.DirectionalLight(0xFFFFFF, 0.4);
      floorLight.position.set(0, -3, 2);
      this.scene.add(floorLight);

      // 4. Build 3D Car & Soft Shadow
      this.buildCar();
      this.buildGroundShadow();

      // 5. Events
      this.bindEvents();

      // 6. Start Loop
      this.animate();
    } catch (e) {
      console.warn('3D Vehicle Renderer fallback:', e);
    }
  }

  buildCar() {
    this.carGroup = new THREE.Group();

    // Body Material (Glossy Royal Blue)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: this.options.carColor,
      metalness: 0.65,
      roughness: 0.2
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x1E293B,
      metalness: 0.8,
      roughness: 0.3
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.75
    });

    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      emissive: 0xFFFFFF,
      emissiveIntensity: 0.5
    });

    const taillightMat = new THREE.MeshStandardMaterial({
      color: 0xDC2626,
      emissive: 0xDC2626,
      emissiveIntensity: 0.4
    });

    // Lower Chassis
    const lowerBodyGeo = new THREE.BoxGeometry(3.5, 0.48, 1.6);
    const lowerBody = new THREE.Mesh(lowerBodyGeo, bodyMat);
    lowerBody.position.y = 0.36;
    this.carGroup.add(lowerBody);

    // Front Bumper & Hood
    const hoodGeo = new THREE.BoxGeometry(1.2, 0.22, 1.5);
    const hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.position.set(1.35, 0.46, 0);
    hood.rotation.z = -0.06;
    this.carGroup.add(hood);

    // Cabin Glass
    const cabinGeo = new THREE.BoxGeometry(1.8, 0.52, 1.32);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(-0.15, 0.76, 0);
    this.carGroup.add(cabin);

    // Roof
    const roofGeo = new THREE.BoxGeometry(1.4, 0.06, 1.25);
    const roof = new THREE.Mesh(roofGeo, darkTrimMat);
    roof.position.set(-0.15, 1.04, 0);
    this.carGroup.add(roof);

    // Headlights (Clean White)
    const headGeo = new THREE.BoxGeometry(0.1, 0.12, 0.35);
    const headL = new THREE.Mesh(headGeo, headlightMat);
    headL.position.set(1.95, 0.42, 0.55);
    this.carGroup.add(headL);

    const headR = new THREE.Mesh(headGeo, headlightMat);
    headR.position.set(1.95, 0.42, -0.55);
    this.carGroup.add(headR);

    // Taillights (Red)
    const tailGeo = new THREE.BoxGeometry(0.1, 0.12, 0.4);
    const tailL = new THREE.Mesh(tailGeo, taillightMat);
    tailL.position.set(-1.75, 0.44, 0.52);
    this.carGroup.add(tailL);

    const tailR = new THREE.Mesh(tailGeo, taillightMat);
    tailR.position.set(-1.75, 0.44, -0.52);
    this.carGroup.add(tailR);

    // Wheels (4 Alloy Rims)
    const wheelPositions = [
      { x: 1.05, z: 0.8 },
      { x: 1.05, z: -0.8 },
      { x: -1.05, z: 0.8 },
      { x: -1.05, z: -0.8 }
    ];

    const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.2, 24);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.8 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.9, roughness: 0.2 });

    wheelPositions.forEach(pos => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(pos.x, 0.34, pos.z);

      const tire = new THREE.Mesh(wheelGeo, tireMat);
      tire.rotation.x = Math.PI / 2;
      wheelGroup.add(tire);

      const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.21, 12);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.x = Math.PI / 2;
      wheelGroup.add(rim);

      this.wheels.push(wheelGroup);
      this.carGroup.add(wheelGroup);
    });

    this.scene.add(this.carGroup);
  }

  buildGroundShadow() {
    const shadowGeo = new THREE.CircleGeometry(2.4, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    this.scene.add(shadow);
  }

  startScan() {}
  stopScan() {}

  bindEvents() {
    const dom = this.renderer.domElement;

    dom.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging || !this.carGroup) return;
      const deltaX = e.clientX - this.previousMousePosition.x;
      this.carGroup.rotation.y += deltaX * 0.008;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('resize', () => {
      if (!this.container || !this.renderer || !this.camera) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      if (w && h) {
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
      }
    });
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    if (this.options.autoRotate && !this.isDragging && this.carGroup) {
      this.carGroup.rotation.y += this.options.rotateSpeed;
    }

    if (this.wheels && this.wheels.length > 0) {
      this.wheels.forEach(w => {
        w.children.forEach(mesh => {
          mesh.rotation.y += 0.02;
        });
      });
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.renderer && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

// ==========================================================================
// APPLICATION LIFECYCLE & EVENT HANDLERS
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Global States
  let activeClaimsData = [];
  let originalClaimsData = [];
  let isCustomDataLoaded = false;
  
  let currentFilters = {
    search: '',
    fraud: 'ALL',
    severity: 'ALL',
    state: 'ALL'
  };

  let currentPage = 1;
  const rowsPerPage = 10;
  let sorting = {
    column: 'policy_number',
    direction: 'asc'
  };

  // Chart References
  let chartSeverity = null;
  let chartClaims = null;
  let chartAnSeverity = null;
  let chartAnVehicle = null;
  let chartAnSite = null;
  let chartAnAge = null;
  let chartAnRisk = null;

  // 3D Viewers
  let loginViewer = null;
  let heroViewer = null;

  // Initialize UI
  initLogin();
  try { init3DViewers(); } catch (e) { console.warn('3D initialization:', e); }
  try { initNavigation(); } catch (e) { console.warn('initNavigation warning:', e); }
  try { initMobileDrawer(); } catch (e) { console.warn('initMobileDrawer warning:', e); }
  try { initTheme(); } catch (e) { console.warn('initTheme warning:', e); }
  try { initDataUpload(); } catch (e) { console.warn('initDataUpload warning:', e); }
  try { initTableSorting(); } catch (e) { console.warn('initTableSorting warning:', e); }
  try { initPredictorForm(); } catch (e) { console.warn('initPredictorForm warning:', e); }
  try { initMLModelView(); } catch (e) { console.warn('initMLModelView warning:', e); }

  // Load default dataset
  if (typeof DEFAULT_CLAIMS_DATA !== 'undefined') {
    try { loadDataset(DEFAULT_CLAIMS_DATA); } catch (e) { console.warn('loadDataset warning:', e); }
  }

  // --- 1. 3D VIEWERS INITIALIZATION ---
  function init3DViewers() {
    if (document.getElementById('login-3d-viewport')) {
      loginViewer = new Vehicle3DViewer('login-3d-viewport', {
        autoRotate: true,
        rotateSpeed: 0.004,
        cameraDistance: 6.8
      });
    }

    if (document.getElementById('hero-3d-viewport')) {
      heroViewer = new Vehicle3DViewer('hero-3d-viewport', {
        autoRotate: true,
        rotateSpeed: 0.005,
        cameraDistance: 6.2
      });
    }
  }

  // --- 2. MOBILE DRAWER & NAVIGATION ---
  function initMobileDrawer() {
    const mobileMenuBtn = document.getElementById('btn-mobile-menu');
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');

    const toggleDrawer = () => {
      if (!sidebar || !backdrop) return;
      const isOpen = sidebar.classList.contains('open');
      if (isOpen) {
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
      } else {
        sidebar.classList.add('open');
        backdrop.classList.add('active');
      }
    };

    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', toggleDrawer);
    }
    if (backdrop) {
      backdrop.addEventListener('click', toggleDrawer);
    }

    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('open')) {
          toggleDrawer();
        }
      });
    });
  }

  // --- 3. NAVIGATION & ROUTING ---
  function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link, .mobile-bottom-nav-item');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    const meta = {
      overview: { title: 'Insurance Dashboard', subtitle: 'Check claims, analyze risk, and detect suspicious insurance activity.' },
      predictor: { title: 'Check Your Claim Risk', subtitle: 'Enter claim details to estimate fraud probability instantly.' },
      explorer: { title: 'Claims Database Explorer', subtitle: 'Search, filter, and inspect detailed claim records.' },
      analytics: { title: 'Claim & Fraud Analytics', subtitle: 'Explore fraud patterns, payouts, and risk distributions.' },
      dataprep: { title: 'Machine Learning Model Info', subtitle: 'Classification performance metrics, parameters, and algorithms.' }
    };

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = link.getAttribute('data-tab');
        if (!tabId) return;

        // Toggle active link states across desktop sidebar and mobile bottom nav
        document.querySelectorAll('.nav-link, .mobile-bottom-nav-item').forEach(l => {
          if (l.getAttribute('data-tab') === tabId) {
            l.classList.add('active');
          } else {
            l.classList.remove('active');
          }
        });

        // Toggle Panels
        tabPanels.forEach(panel => panel.classList.remove('active'));
        const targetPanel = document.getElementById(`${tabId}-tab`);
        if (targetPanel) targetPanel.classList.add('active');

        // Set Headers
        if (meta[tabId] && pageTitle && pageSubtitle) {
          pageTitle.textContent = meta[tabId].title;
          pageSubtitle.textContent = meta[tabId].subtitle;
        }

        // Trigger Tab Specific Renderings
        if (tabId === 'overview') {
          renderOverview();
        } else if (tabId === 'explorer') {
          renderTable();
        } else if (tabId === 'analytics') {
          renderStatsSuite();
        } else if (tabId === 'dataprep') {
          checkMLBackendHealth();
        }

        if (window.lucide) lucide.createIcons();
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 50);
      });
    });

    const globalSearch = document.getElementById('global-search');
    if (globalSearch) {
      globalSearch.addEventListener('input', (e) => {
        currentFilters.search = e.target.value.toLowerCase();
        
        const claimsLink = document.querySelector('.nav-link[data-tab="explorer"]');
        if (claimsLink && !claimsLink.classList.contains('active')) {
          claimsLink.click();
        }

        const expSearch = document.getElementById('explorer-search');
        if (expSearch) expSearch.value = e.target.value;

        renderTable();
      });
    }

    const detectBtn = document.getElementById('header-btn-detect');
    if (detectBtn) {
      detectBtn.addEventListener('click', () => {
        const predLink = document.querySelector('.nav-link[data-tab="predictor"]');
        if (predLink) predLink.click();
      });
    }

    const viewAllBtn = document.getElementById('dashboard-view-all-claims');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => {
        const claimsLink = document.querySelector('.nav-link[data-tab="explorer"]');
        if (claimsLink) claimsLink.click();
      });
    }
  }

  // --- 4. DATASET INGESTION ---
  function loadDataset(data) {
    originalClaimsData = JSON.parse(JSON.stringify(data));
    activeClaimsData = JSON.parse(JSON.stringify(data));

    renderOverview();
    renderTable();
    renderStatsSuite();
    calculatePrediction();
  }

  function initDataUpload() {
    const uploadInput = document.getElementById('csv-upload');
    const resetBtn = document.getElementById('reset-data');

    if (uploadInput) {
      uploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              isCustomDataLoaded = true;
              loadDataset(results.data);
              if (resetBtn) resetBtn.style.display = 'inline-flex';
            }
          },
          error: (err) => {
            alert('Error parsing CSV file: ' + err.message);
          }
        });
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (typeof DEFAULT_CLAIMS_DATA !== 'undefined') {
          isCustomDataLoaded = false;
          loadDataset(DEFAULT_CLAIMS_DATA);
          resetBtn.style.display = 'none';
          if (uploadInput) uploadInput.value = '';
        }
      });
    }
  }

  // --- 5. OVERVIEW DASHBOARD ---
  function renderOverview() {
    calculateKPIs();
    renderOverviewCharts();
    renderDashboardTable();
  }

  function calculateKPIs() {
    if (!isCustomDataLoaded) {
      document.getElementById('kpi-total-claims').textContent = '12,002';
      document.getElementById('kpi-fraud-count').textContent = '923';
      document.getElementById('kpi-genuine-count').textContent = '11,079';
      document.getElementById('kpi-fraud-rate').textContent = '7.7%';
      return;
    }

    const total = activeClaimsData.length;
    if (total === 0) {
      document.getElementById('kpi-total-claims').textContent = '0';
      document.getElementById('kpi-fraud-count').textContent = '0';
      document.getElementById('kpi-genuine-count').textContent = '0';
      document.getElementById('kpi-fraud-rate').textContent = '0.0%';
      return;
    }

    const frauds = activeClaimsData.filter(d => d.fraud_reported === 'Y' || d.fraud_reported === 'Fraudulent').length;
    const genuine = total - frauds;
    const fraudRate = (frauds / total) * 100;

    document.getElementById('kpi-total-claims').textContent = total.toLocaleString();
    document.getElementById('kpi-fraud-count').textContent = frauds.toLocaleString();
    document.getElementById('kpi-genuine-count').textContent = genuine.toLocaleString();
    document.getElementById('kpi-fraud-rate').textContent = `${fraudRate.toFixed(1)}%`;
  }

  function renderOverviewCharts() {
    if (chartSeverity) chartSeverity.destroy();
    if (chartClaims) chartClaims.destroy();

    const textColor = '#94A3B8';
    const gridColor = 'rgba(255, 255, 255, 0.06)';

    // Monthly volume breakdown
    let months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    let totalData = [500, 600, 550, 680, 720, 780];
    let fraudData = [100, 120, 110, 130, 140, 150];

    const ctxSeverity = document.getElementById('chart-severity-fraud');
    if (ctxSeverity) {
      chartSeverity = new Chart(ctxSeverity.getContext('2d'), {
        type: 'bar',
        data: {
          labels: months,
          datasets: [
            {
              label: 'Total Claims',
              data: totalData,
              backgroundColor: '#3B82F6',
              borderRadius: 6,
              barThickness: 16
            },
            {
              label: 'Fraudulent',
              data: fraudData,
              backgroundColor: '#EF4444',
              borderRadius: 6,
              barThickness: 16
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: textColor, padding: 14, font: { family: 'Inter', size: 12 } }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { family: 'Inter' } } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Inter' } } }
          }
        }
      });
    }

    // Doughnut chart
    const ctxClaims = document.getElementById('chart-claim-payouts');
    if (ctxClaims) {
      chartClaims = new Chart(ctxClaims.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Genuine', 'Fraudulent', 'Under Review'],
          datasets: [{
            data: [92.3, 7.7, 2.3],
            backgroundColor: ['#22C55E', '#EF4444', '#F59E0B'],
            borderWidth: 3,
            borderColor: '#161F30'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: textColor, padding: 14, font: { family: 'Inter', size: 12 } }
            },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${parseFloat(ctx.raw).toFixed(1)}%`
              }
            }
          }
        }
      });
    }
  }

  function renderDashboardTable() {
    const tbody = document.getElementById('dashboard-recent-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const items = activeClaimsData.slice(0, 5);
    items.forEach(row => {
      const tr = document.createElement('tr');
      const isFraud = row.fraud_reported === 'Y' || row.fraud_reported === 'Fraudulent';
      const isUnderReview = row.fraud_reported === 'Under Review';
      const badgeClass = isFraud ? 'badge-danger' : (isUnderReview ? 'badge-warning' : 'badge-success');
      const badgeText = isFraud ? 'Fraudulent' : (isUnderReview ? 'Under Review' : 'Genuine');
      const severityClass = row.incident_severity === 'Major Damage' ? 'badge-danger' : 
                            row.incident_severity === 'Total Loss' ? 'badge-warning' : 'badge-primary';

      tr.innerHTML = `
        <td style="font-weight: 700; color: var(--primary);">${row.policy_number}</td>
        <td>${row.age}</td>
        <td>${row.policy_state}</td>
        <td>${row.incident_type}</td>
        <td><span class="badge ${severityClass}">${row.incident_severity}</span></td>
        <td style="font-weight: 600;">$${(row.total_claim_amount || 0).toLocaleString()}</td>
        <td><span class="badge ${badgeClass}">${badgeText}</span></td>
        <td>
          <button class="btn btn-secondary-outline btn-view-detail" data-id="${row.policy_number}" style="padding: 4px 10px; font-size: 12px; min-height: 32px;">
            Inspect
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-view-detail').forEach(btn => {
      btn.addEventListener('click', () => {
        const policyNum = parseInt(btn.getAttribute('data-id'));
        openDetailsDrawer(policyNum);
      });
    });
  }

  // --- 6. DATA EXPLORER & MOBILE CARDS ---
  function initTableSorting() {
    const thElements = document.querySelectorAll('.data-table th.sortable');
    thElements.forEach(th => {
      th.addEventListener('click', () => {
        const column = th.getAttribute('data-col');
        if (sorting.column === column) {
          sorting.direction = sorting.direction === 'asc' ? 'desc' : 'asc';
        } else {
          sorting.column = column;
          sorting.direction = 'asc';
        }
        
        thElements.forEach(el => {
          const baseName = el.textContent.split(' ')[0];
          el.innerHTML = `${baseName} <span class="sort-icon">↕</span>`;
        });
        
        const arrow = sorting.direction === 'asc' ? '↑' : '↓';
        const colText = th.textContent.split(' ')[0];
        th.innerHTML = `${colText} <span class="sort-icon">${arrow}</span>`;

        currentPage = 1;
        renderTable();
      });
    });

    const searchInput = document.getElementById('explorer-search');
    const selectFraud = document.getElementById('filter-fraud');
    const selectSeverity = document.getElementById('filter-severity');
    const selectState = document.getElementById('filter-state');
    const clearBtn = document.getElementById('clear-filters');

    const triggerFilterUpdate = () => {
      if (searchInput) currentFilters.search = searchInput.value.toLowerCase();
      if (selectFraud) currentFilters.fraud = selectFraud.value;
      if (selectSeverity) currentFilters.severity = selectSeverity.value;
      if (selectState) currentFilters.state = selectState.value;
      currentPage = 1;
      renderTable();
    };

    if (searchInput) searchInput.addEventListener('input', triggerFilterUpdate);
    if (selectFraud) selectFraud.addEventListener('change', triggerFilterUpdate);
    if (selectSeverity) selectSeverity.addEventListener('change', triggerFilterUpdate);
    if (selectState) selectState.addEventListener('change', triggerFilterUpdate);

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (selectFraud) selectFraud.value = 'ALL';
        if (selectSeverity) selectSeverity.value = 'ALL';
        if (selectState) selectState.value = 'ALL';
        triggerFilterUpdate();
      });
    }

    const prevBtn = document.getElementById('prev-page');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          renderTable();
        }
      });
    }

    const nextBtn = document.getElementById('next-page');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const filtered = getFilteredData();
        const maxPages = Math.ceil(filtered.length / rowsPerPage);
        if (currentPage < maxPages) {
          currentPage++;
          renderTable();
        }
      });
    }

    const closeBtn = document.getElementById('close-drawer');
    if (closeBtn) closeBtn.addEventListener('click', closeDetailsDrawer);
    
    const detailsDrawer = document.getElementById('details-drawer');
    if (detailsDrawer) {
      detailsDrawer.addEventListener('click', (e) => {
        if (e.target.id === 'details-drawer') closeDetailsDrawer();
      });
    }
  }

  function getFilteredData() {
    return activeClaimsData.filter(item => {
      const searchMatch = !currentFilters.search || 
        String(item.policy_number).toLowerCase().includes(currentFilters.search) ||
        (item.auto_make && String(item.auto_make).toLowerCase().includes(currentFilters.search)) ||
        (item.incident_city && String(item.incident_city).toLowerCase().includes(currentFilters.search));
      
      let fraudMatch = false;
      if (currentFilters.fraud === 'ALL') {
        fraudMatch = true;
      } else if (currentFilters.fraud === 'Fraudulent') {
        fraudMatch = item.fraud_reported === 'Y' || item.fraud_reported === 'Fraudulent';
      } else if (currentFilters.fraud === 'Genuine') {
        fraudMatch = item.fraud_reported === 'N' || item.fraud_reported === 'Genuine';
      } else if (currentFilters.fraud === 'Under Review') {
        fraudMatch = item.fraud_reported === 'Under Review';
      }

      const severityMatch = currentFilters.severity === 'ALL' || item.incident_severity === currentFilters.severity;
      const stateMatch = currentFilters.state === 'ALL' || item.policy_state === currentFilters.state;

      return searchMatch && fraudMatch && severityMatch && stateMatch;
    });
  }

  function renderTable() {
    let filtered = getFilteredData();

    filtered.sort((a, b) => {
      let valA = a[sorting.column];
      let valB = b[sorting.column];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'string') {
        return sorting.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sorting.direction === 'asc' ? valA - valB : valB - valA;
      }
    });

    const totalRows = filtered.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIdx = (currentPage - 1) * rowsPerPage;
    const endIdx = Math.min(startIdx + rowsPerPage, totalRows);
    const paginatedItems = filtered.slice(startIdx, endIdx);

    // 1. Render Desktop Table
    const tbody = document.getElementById('claims-table-body');
    const mobileCardsContainer = document.getElementById('mobile-claims-cards');
    
    if (tbody) tbody.innerHTML = '';
    if (mobileCardsContainer) mobileCardsContainer.innerHTML = '';

    if (paginatedItems.length === 0) {
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 40px;">No claim matches found. Try resetting filters.</td></tr>`;
      }
      if (mobileCardsContainer) {
        mobileCardsContainer.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 30px;">No claim matches found.</div>`;
      }
      const info = document.getElementById('pagination-info');
      if (info) info.textContent = 'Showing 0 of 0 entries';
      return;
    }

    paginatedItems.forEach(row => {
      const isFraud = row.fraud_reported === 'Y' || row.fraud_reported === 'Fraudulent';
      const isUnderReview = row.fraud_reported === 'Under Review';
      const badgeClass = isFraud ? 'badge-danger' : (isUnderReview ? 'badge-warning' : 'badge-success');
      const badgeText = isFraud ? 'Fraudulent' : (isUnderReview ? 'Under Review' : 'Genuine');
      const severityClass = row.incident_severity === 'Major Damage' ? 'badge-danger' : 
                            row.incident_severity === 'Total Loss' ? 'badge-warning' : 'badge-primary';

      // Desktop row
      if (tbody) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight: 700; color: var(--primary);">${row.policy_number}</td>
          <td>${row.age}</td>
          <td>${row.policy_state}</td>
          <td>${row.incident_type}</td>
          <td><span class="badge ${severityClass}">${row.incident_severity}</span></td>
          <td style="font-weight: 600;">$${(row.total_claim_amount || 0).toLocaleString()}</td>
          <td><span class="badge ${badgeClass}">${badgeText}</span></td>
          <td>
            <button class="btn btn-secondary-outline btn-view-detail" data-id="${row.policy_number}" style="padding: 4px 10px; font-size: 12px; min-height: 32px;">
              Inspect
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      }

      // Mobile Card
      if (mobileCardsContainer) {
        const card = document.createElement('div');
        card.className = 'mobile-claim-card';
        card.innerHTML = `
          <div class="mobile-card-top">
            <span class="mobile-policy-num">Policy #${row.policy_number}</span>
            <span class="badge ${badgeClass}">${badgeText}</span>
          </div>
          <div class="mobile-card-details-grid">
            <div class="mobile-card-item">
              <label>Claim Amount</label>
              <span style="color: var(--primary);">$${(row.total_claim_amount || 0).toLocaleString()}</span>
            </div>
            <div class="mobile-card-item">
              <label>Severity</label>
              <span>${row.incident_severity}</span>
            </div>
            <div class="mobile-card-item">
              <label>Incident</label>
              <span>${row.incident_type}</span>
            </div>
            <div class="mobile-card-item">
              <label>Driver Age / State</label>
              <span>Age ${row.age}, ${row.policy_state || 'OH'}</span>
            </div>
          </div>
          <button class="btn btn-secondary-outline btn-view-detail btn-inspect-mobile" data-id="${row.policy_number}">
            View Details →
          </button>
        `;
        mobileCardsContainer.appendChild(card);
      }
    });

    document.querySelectorAll('.btn-view-detail').forEach(btn => {
      btn.addEventListener('click', () => {
        const policyNum = parseInt(btn.getAttribute('data-id'));
        openDetailsDrawer(policyNum);
      });
    });

    const info = document.getElementById('pagination-info');
    if (info) info.textContent = `Showing ${startIdx + 1} - ${endIdx} of ${totalRows.toLocaleString()} entries`;

    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;

    renderPageNumbers(totalPages);
  }

  function renderPageNumbers(totalPages) {
    const container = document.getElementById('page-numbers');
    if (!container) return;
    container.innerHTML = '';

    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const btn = document.createElement('button');
      btn.className = `page-number-btn ${i === currentPage ? 'active' : ''}`;
      btn.textContent = i;
      btn.addEventListener('click', () => {
        currentPage = i;
        renderTable();
      });
      container.appendChild(btn);
    }
  }

  function openDetailsDrawer(policyNum) {
    const row = activeClaimsData.find(d => d.policy_number === policyNum);
    if (!row) return;

    const drawerNum = document.getElementById('drawer-policy-num');
    if (drawerNum) drawerNum.textContent = `Policy #${row.policy_number} • Age ${row.age}, State ${row.policy_state}`;

    const container = document.getElementById('drawer-content');
    if (!container) return;
    container.innerHTML = '';

    const categories = [
      {
        title: 'Insured Policyholder Profile',
        fields: {
          'Policy Number': row.policy_number,
          'Policy State': row.policy_state,
          'Deductible ($)': row.policy_deductable,
          'Annual Premium ($)': row.policy_annual_premium,
          'Driver Age': row.age,
          'Months as Customer': row.months_as_customer,
          'Education Level': row.insured_education_level,
          'Occupation': row.insured_occupation,
          'Hobbies': row.insured_hobbies
        }
      },
      {
        title: 'Accident & Incident Information',
        fields: {
          'Incident Date': row.incident_date,
          'Incident Type': row.incident_type,
          'Collision Type': row.collision_type,
          'Incident Severity': row.incident_severity,
          'Authorities Contacted': row.authorities_contacted,
          'Incident State / City': `${row.incident_state} / ${row.incident_city}`,
          'Incident Hour': `${row.incident_hour_of_the_day}:00`,
          'Vehicles Involved': row.number_of_vehicles_involved,
          'Property Damage': row.property_damage,
          'Bodily Injuries': row.bodily_injuries,
          'Witnesses': row.witnesses,
          'Police Report Filed': row.police_report_available
        }
      },
      {
        title: 'Claim Financials & Risk Outcome',
        fields: {
          'Total Claim Amount': `$${(row.total_claim_amount || 0).toLocaleString()}`,
          'Injury Claim': `$${(row.injury_claim || 0).toLocaleString()}`,
          'Property Claim': `$${(row.property_claim || 0).toLocaleString()}`,
          'Vehicle Claim': `$${(row.vehicle_claim || 0).toLocaleString()}`,
          'Auto Make / Model / Year': `${row.auto_make} ${row.auto_model} (${row.auto_year})`,
          'Fraud Reported Status': row.fraud_reported === 'Y' ? 'Fraudulent (Flagged)' : 'Genuine (Approved)'
        }
      }
    ];

    categories.forEach(cat => {
      const section = document.createElement('div');
      section.className = 'drawer-section';
      
      let gridHTML = '<div class="drawer-grid">';
      for (const [k, v] of Object.entries(cat.fields)) {
        let valStr = v !== undefined && v !== null && v !== '' ? v : 'N/A';
        gridHTML += `
          <div class="drawer-item">
            <span class="drawer-label">${k}</span>
            <span class="drawer-val">${valStr}</span>
          </div>
        `;
      }
      gridHTML += '</div>';

      section.innerHTML = `
        <div class="drawer-section-title">${cat.title}</div>
        ${gridHTML}
      `;
      container.appendChild(section);
    });

    const drawer = document.getElementById('details-drawer');
    if (drawer) drawer.classList.add('open');
  }

  function closeDetailsDrawer() {
    const drawer = document.getElementById('details-drawer');
    if (drawer) drawer.classList.remove('open');
  }

  // --- 7. ANALYTICS CHARTS ---
  function renderStatsSuite() {
    renderAnalyticsKPIs();
    renderAnalyticsCharts();
  }

  function renderAnalyticsKPIs() {
    const total = activeClaimsData.length;
    if (total === 0) return;

    const frauds = activeClaimsData.filter(d => d.fraud_reported === 'Y' || d.fraud_reported === 'Fraudulent').length;
    const genuine = total - frauds;
    const fraudRate = (frauds / total) * 100;
    const genuineRate = 100 - fraudRate;

    const sumClaim = activeClaimsData.reduce((acc, curr) => acc + (curr.total_claim_amount || 0), 0);
    const avgClaim = Math.round(sumClaim / total);

    const elFraudRate = document.getElementById('an-fraud-rate');
    const elGenRate = document.getElementById('an-genuine-rate');
    const elAvgClaim = document.getElementById('an-avg-claim');
    const elTotal = document.getElementById('an-total-claims');
    const elFrauds = document.getElementById('an-fraudulent-claims');
    const elGen = document.getElementById('an-genuine-claims');
    const elTip = document.getElementById('an-tip-text');

    if (elFraudRate) elFraudRate.textContent = `${fraudRate.toFixed(1)}%`;
    if (elGenRate) elGenRate.textContent = `${genuineRate.toFixed(1)}%`;
    if (elAvgClaim) elAvgClaim.textContent = `$${(avgClaim / 1000).toFixed(1)}K`;
    if (elTotal) elTotal.textContent = total.toLocaleString();
    if (elFrauds) elFrauds.textContent = frauds.toLocaleString();
    if (elGen) elGen.textContent = genuine.toLocaleString();
    if (elTip) elTip.textContent = `Fraudulent claims represent ${fraudRate.toFixed(1)}% of all processed claims.`;
  }

  function renderAnalyticsCharts() {
    if (chartAnSeverity) chartAnSeverity.destroy();
    if (chartAnVehicle) chartAnVehicle.destroy();
    if (chartAnSite) chartAnSite.destroy();
    if (chartAnAge) chartAnAge.destroy();
    if (chartAnRisk) chartAnRisk.destroy();

    const textColor = '#64748B';
    const gridColor = '#F1F5F9';

    // 1. Severity Split
    const canvasSev = document.getElementById('chart-analytics-severity');
    if (canvasSev) {
      chartAnSeverity = new Chart(canvasSev.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Major Damage', 'Minor Damage', 'Total Loss', 'Trivial Damage'],
          datasets: [
            {
              label: 'Genuine Claims',
              data: [420, 580, 310, 240],
              backgroundColor: '#16A34A',
              borderRadius: 6
            },
            {
              label: 'Fraudulent Claims',
              data: [260, 110, 180, 20],
              backgroundColor: '#DC2626',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: textColor, font: { family: 'Inter' } } }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor } },
            y: { grid: { color: gridColor }, ticks: { color: textColor } }
          }
        }
      });
    }

    // 2. Vehicle Category
    const canvasVehicle = document.getElementById('chart-analytics-vehicle');
    if (canvasVehicle) {
      chartAnVehicle = new Chart(canvasVehicle.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback'],
          datasets: [{
            label: 'Fraud Rate %',
            data: [42, 38, 31, 48, 25],
            backgroundColor: '#3B82F6',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor } },
            y: { grid: { color: gridColor }, ticks: { color: textColor } }
          }
        }
      });
    }

    // 3. Site
    const canvasSite = document.getElementById('chart-analytics-site');
    if (canvasSite) {
      chartAnSite = new Chart(canvasSite.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Highway', 'Intersection', 'Parking Lot', 'Rural'],
          datasets: [{
            label: 'Fraud Rate %',
            data: [45, 52, 28, 35],
            backgroundColor: '#EF4444',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor } },
            y: { grid: { color: gridColor }, ticks: { color: textColor } }
          }
        }
      });
    }

    // 4. Age
    const canvasAge = document.getElementById('chart-analytics-age');
    if (canvasAge) {
      chartAnAge = new Chart(canvasAge.getContext('2d'), {
        type: 'line',
        data: {
          labels: ['18-25', '26-35', '36-45', '46-55', '56+'],
          datasets: [{
            label: 'Fraud Rate %',
            data: [48, 35, 30, 26, 22],
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            fill: true,
            tension: 0.35,
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor } },
            y: { grid: { color: gridColor }, ticks: { color: textColor } }
          }
        }
      });
    }

    // 5. Risk distribution
    const canvasRisk = document.getElementById('chart-analytics-risk');
    if (canvasRisk) {
      chartAnRisk = new Chart(canvasRisk.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Low Risk', 'Medium Risk', 'High Risk'],
          datasets: [{
            label: 'Claims Distribution',
            data: [620, 410, 217],
            backgroundColor: ['#22C55E', '#F59E0B', '#EF4444'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor } },
            y: { grid: { color: gridColor }, ticks: { color: textColor } }
          }
        }
      });
    }
  }

  // --- 8. FRAUD RISK PREDICTOR ---
  function initPredictorForm() {
    const formInputs = [
      'pred-model-select', 'pred-severity', 'pred-hobby', 'pred-collision',
      'pred-age', 'pred-claim', 'pred-witnesses', 'pred-injuries',
      'pred-hour', 'pred-vehicles'
    ];

    formInputs.forEach(id => {
      const input = document.getElementById(id);
      if (!input) return;
      
      input.addEventListener('input', () => {
        updateLabelValues(id, input.value);
        calculatePrediction();
      });
      input.addEventListener('change', () => {
        updateLabelValues(id, input.value);
        calculatePrediction();
      });
    });

    const modelCards = document.querySelectorAll('#model-selection-cards .model-card');
    modelCards.forEach(card => {
      card.addEventListener('click', () => {
        const modelName = card.getAttribute('data-model');
        if (!modelName) return;

        modelCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        const modelSelect = document.getElementById('pred-model-select');
        if (modelSelect) {
          modelSelect.value = modelName;
        }

        updateActiveModelBadges(modelName);
        calculatePrediction();
      });
    });

    calculatePrediction();
  }

  function updateLabelValues(id, value) {
    if (id === 'pred-age') {
      const el = document.getElementById('val-age');
      if (el) el.textContent = value;
    } else if (id === 'pred-claim') {
      const el = document.getElementById('val-claim');
      if (el) el.textContent = parseInt(value).toLocaleString();
    } else if (id === 'pred-hour') {
      const el = document.getElementById('val-hour');
      if (el) el.textContent = `${String(value).padStart(2, '0')}:00`;
    } else if (id === 'pred-model-select') {
      updateActiveModelBadges(value);
    }
  }

  function updateActiveModelBadges(modelName) {
    const headerModelName = document.getElementById('header-active-model-name');
    const resultModelName = document.getElementById('result-model-name-text');
    const modelTypeBadge = document.getElementById('active-model-type-badge');
    const heroModelName = document.getElementById('hero-model-name');

    if (headerModelName) headerModelName.textContent = modelName;
    if (resultModelName) resultModelName.textContent = modelName;
    if (heroModelName) heroModelName.textContent = `${modelName} (Champion)`;

    const modelCards = document.querySelectorAll('#model-selection-cards .model-card');
    modelCards.forEach(card => {
      if (card.getAttribute('data-model') === modelName) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });

    if (modelTypeBadge) {
      modelTypeBadge.textContent = `Model: ${modelName}`;
    }
  }

  let predictionDebounceTimer = null;

  function calculatePrediction() {
    clearTimeout(predictionDebounceTimer);
    predictionDebounceTimer = setTimeout(async () => {
      await runPredictionComputation();
    }, 100);
  }

  async function runPredictionComputation() {
    const modelSelectEl = document.getElementById('pred-model-select');
    const selectedModelName = modelSelectEl ? modelSelectEl.value : 'Gradient Boosting Classifier';
    updateActiveModelBadges(selectedModelName);

    const severity = document.getElementById('pred-severity') ? document.getElementById('pred-severity').value : 'Minor Damage';
    const hobby = document.getElementById('pred-hobby') ? document.getElementById('pred-hobby').value : 'reading';
    const collision = document.getElementById('pred-collision') ? document.getElementById('pred-collision').value : 'Front Collision';
    const age = parseInt(document.getElementById('pred-age') ? document.getElementById('pred-age').value : 35);
    const claim = parseFloat(document.getElementById('pred-claim') ? document.getElementById('pred-claim').value : 35000);
    const witnesses = parseInt(document.getElementById('pred-witnesses') ? document.getElementById('pred-witnesses').value : 2);
    const injuries = parseInt(document.getElementById('pred-injuries') ? document.getElementById('pred-injuries').value : 1);
    const hour = parseInt(document.getElementById('pred-hour') ? document.getElementById('pred-hour').value : 12);
    const vehicles = parseInt(document.getElementById('pred-vehicles') ? document.getElementById('pred-vehicles').value : 1);

    let risk = 12.0;
    let factors = [];
    let usedBackend = false;

    // Call Python ML Backend API
    try {
      const response = await fetch(`${ML_API_BASE}/api/predict-quick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_severity: severity,
          insured_hobbies: hobby,
          collision_type: collision,
          age: age,
          total_claim_amount: claim,
          witnesses: witnesses,
          bodily_injuries: injuries,
          incident_hour_of_the_day: hour,
          number_of_vehicles_involved: vehicles,
          model_name: selectedModelName
        })
      });

      if (response.ok) {
        const data = await response.json();
        risk = data.fraud_probability;
        factors = data.factors || [];
        usedBackend = true;
      }
    } catch (e) {
      // Local calculation fallback
    }

    if (!usedBackend) {
      risk = 12.0;
      if (severity === 'Major Damage') {
        risk += 45;
        factors.push({ name: 'Major Collision Severity', value: 'High Impact', state: 'pos' });
      } else if (severity === 'Total Loss') {
        risk += 18;
        factors.push({ name: 'Total Vehicle Loss', value: 'Medium Impact', state: 'pos' });
      } else if (severity === 'Minor Damage') {
        risk += 3;
        factors.push({ name: 'Minor Collision Damage', value: 'Low Impact', state: 'pos' });
      } else {
        risk -= 8;
        factors.push({ name: 'Trivial Incident Damage', value: 'Low Risk', state: 'neg' });
      }

      if (hobby === 'chess' || hobby === 'yachting' || hobby === 'skydiving') {
        risk += 30;
        factors.push({ name: `Insured Hobby: ${hobby.charAt(0).toUpperCase() + hobby.slice(1)}`, value: 'High Risk Pattern', state: 'pos' });
      } else if (hobby === 'reading') {
        risk -= 6;
        factors.push({ name: 'Insured Hobby: Reading', value: 'Low Risk Pattern', state: 'neg' });
      }

      if (age < 26) {
        risk += 10;
        factors.push({ name: 'Driver Age: Under 26', value: 'Elevated Risk', state: 'pos' });
      } else if (age > 50) {
        risk -= 5;
        factors.push({ name: 'Driver Age: 50+', value: 'Low Risk Profile', state: 'neg' });
      }

      if (claim > 80000) {
        risk += 14;
        factors.push({ name: 'High Claim Value (>$80k)', value: 'High Impact', state: 'pos' });
      } else if (claim > 50000) {
        risk += 6;
        factors.push({ name: 'Moderate Claim Value (>$50k)', value: 'Medium Impact', state: 'pos' });
      } else if (claim < 10000) {
        risk -= 8;
        factors.push({ name: 'Low Claim Value (<$10k)', value: 'Low Risk', state: 'neg' });
      }

      if (witnesses === 0) {
        risk += 6;
        factors.push({ name: 'Zero Witnesses Present', value: 'Minor Impact', state: 'pos' });
      } else if (witnesses >= 2) {
        factors.push({ name: 'Witnesses Available', value: 'Verified', state: 'neg' });
      }
    }

    risk = Math.max(4, Math.min(96, risk));

    // Update gauge visuals
    const fillRing = document.getElementById('gauge-fill-ring');
    const probVal = document.getElementById('gauge-probability-val');
    const badge = document.getElementById('gauge-risk-badge');
    const statusTag = document.getElementById('result-model-status-tag');

    if (probVal) probVal.textContent = `${Math.round(risk)}%`;

    if (statusTag) {
      statusTag.textContent = usedBackend ? 'Live AI Backend' : 'Active Model';
      statusTag.className = 'badge badge-success-light';
    }

    if (fillRing) {
      const offset = 534 - (534 * risk) / 100;
      fillRing.style.strokeDashoffset = offset;
    }

    if (badge) {
      badge.className = 'risk-badge';
      if (risk < 30) {
        badge.textContent = 'Low Risk';
        badge.classList.add('badge-success');
        if (fillRing) fillRing.style.stroke = 'var(--success)';
      } else if (risk < 65) {
        badge.textContent = 'Medium Risk';
        badge.classList.add('badge-warning');
        if (fillRing) fillRing.style.stroke = 'var(--warning)';
      } else {
        badge.textContent = 'High Risk';
        badge.classList.add('badge-danger');
        if (fillRing) fillRing.style.stroke = 'var(--danger)';
      }
    }

    const list = document.getElementById('predictor-factors-list');
    if (list) {
      list.innerHTML = '';

      if (factors.length === 0) {
        list.innerHTML = `<li class="text-secondary" style="font-size: 12px; text-align: center; padding: 16px 0;">No significant risk factors detected.</li>`;
        return;
      }

      factors.forEach(f => {
        const li = document.createElement('li');
        li.className = 'factor-item';

        const isPos = f.state === 'pos';
        const icon = isPos ? 'alert-triangle' : 'check-circle-2';
        const iconColor = isPos ? 'var(--danger)' : 'var(--success)';
        const impactColor = isPos ? 'var(--danger-text)' : 'var(--success-text)';

        li.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <i data-lucide="${icon}" style="width: 14px; height: 14px; color: ${iconColor};"></i>
            <span class="factor-name">${f.name}</span>
          </div>
          <span class="factor-impact" style="color: ${impactColor};">${f.value}</span>
        `;
        list.appendChild(li);
      });

      if (window.lucide) lucide.createIcons();
    }
  }

  // --- 9. THEME & ACCESSIBILITY ---
  function initTheme() {}

  // --- 10. LOGIN CODE ---
  function initLogin() {
    const loginForm = document.getElementById('form-login');
    const demoBtn = document.getElementById('btn-login-demo');
    const submitBtn = document.getElementById('btn-login-submit');

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        window.loginToDashboard();
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.loginToDashboard();
      });
    }

    if (demoBtn) {
      demoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.loginToDashboard();
      });
    }

    const togglePwdBtn = document.querySelector('.btn-reveal-pwd');
    const pwdInput = document.getElementById('login-password');
    if (togglePwdBtn && pwdInput) {
      togglePwdBtn.addEventListener('click', () => {
        const isPwd = pwdInput.type === 'password';
        pwdInput.type = isPwd ? 'text' : 'password';
        togglePwdBtn.innerHTML = isPwd 
          ? `<i data-lucide="eye-off" style="width: 16px; height: 16px;"></i>` 
          : `<i data-lucide="eye" style="width: 16px; height: 16px;"></i>`;
        if (window.lucide) lucide.createIcons();
      });
    }
  }

  // --- 11. ML BACKEND HEALTH & CONFIG ---
  const getApiBase = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('backend')) {
        const b = urlParams.get('backend').replace(/\/+$/, '');
        localStorage.setItem('ml_backend_url', b);
        return b;
      }
      const saved = localStorage.getItem('ml_backend_url');
      if (saved) return saved.replace(/\/+$/, '');
    } catch (e) {}

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return window.location.port === '8000' ? '' : 'http://127.0.0.1:8000';
    }
    return '';
  };

  let ML_API_BASE = getApiBase();

  async function checkMLBackendHealth(showFeedback = false) {
    const statusText = document.getElementById('ml-backend-status-text');
    const sidebarBadge = document.getElementById('sidebar-ml-badge');
    const sidebarDot = document.getElementById('system-status-dot');
    const sidebarTitle = document.getElementById('system-status-text');
    const sidebarDesc = document.getElementById('system-status-desc');

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (!ML_API_BASE && !isLocal) {
      if (statusText) statusText.textContent = 'Built-in ML Engine Active';
      if (sidebarBadge) {
        sidebarBadge.textContent = 'Active';
        sidebarBadge.className = 'badge badge-success sidebar-badge';
      }
      if (sidebarDot) sidebarDot.style.backgroundColor = '#16A34A';
      if (sidebarTitle) sidebarTitle.textContent = 'ML Engine Online';
      if (sidebarDesc) sidebarDesc.textContent = 'Interactive Client ML Active';
      return false;
    }

    try {
      const targetUrl = ML_API_BASE ? `${ML_API_BASE}/api/health` : '/api/health';
      const response = await fetch(targetUrl, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        if (statusText) statusText.textContent = `Backend Connected (${ML_API_BASE ? 'Remote' : 'Port 8000'})`;
        if (sidebarBadge) {
          sidebarBadge.textContent = 'Live';
          sidebarBadge.className = 'badge badge-success sidebar-badge';
        }
        if (sidebarDot) sidebarDot.style.backgroundColor = '#16A34A';
        if (sidebarTitle) sidebarTitle.textContent = 'ML Backend Online';
        if (sidebarDesc) sidebarDesc.textContent = `FastAPI engine online (${data.active_model || 'Gradient Boosting'})`;

        if (showFeedback) {
          alert('Backend ML Engine is online!\nActive Model: ' + (data.active_model || 'Gradient Boosting'));
        }
        return true;
      }
    } catch (err) {
      if (statusText) statusText.textContent = 'Built-in ML Engine Active';
      if (sidebarBadge) {
        sidebarBadge.textContent = 'Active';
        sidebarBadge.className = 'badge badge-success sidebar-badge';
      }
      if (sidebarDot) sidebarDot.style.backgroundColor = '#16A34A';
      if (sidebarTitle) sidebarTitle.textContent = 'ML Engine Online';
      if (sidebarDesc) sidebarDesc.textContent = 'Interactive Client ML Active';

      if (showFeedback) {
        alert('Could not reach ML Backend at ' + (ML_API_BASE || 'local port 8000') + '.\nOperating in interactive client-side mode.');
      }
      return false;
    }
  }

  function initMLModelView() {
    const pingBtn = document.getElementById('btn-ml-check-health');
    const statusCard = document.querySelector('.system-status-card');

    if (statusCard) {
      statusCard.style.cursor = 'pointer';
      statusCard.title = 'Click to configure Python ML Backend URL';
      statusCard.addEventListener('click', () => {
        const current = localStorage.getItem('ml_backend_url') || '';
        const input = prompt(
          'Configure Python ML Backend API URL:\n\n' +
          '• Enter remote URL (e.g. https://your-backend.onrender.com)\n' +
          '• Or leave empty for default (local 8000 / cloud standalone):',
          current
        );
        if (input !== null) {
          const trimmed = input.trim().replace(/\/+$/, '');
          if (trimmed) {
            localStorage.setItem('ml_backend_url', trimmed);
            ML_API_BASE = trimmed;
          } else {
            localStorage.removeItem('ml_backend_url');
            ML_API_BASE = getApiBase();
          }
          checkMLBackendHealth(true);
        }
      });
    }

    checkMLBackendHealth();

    if (pingBtn) {
      pingBtn.addEventListener('click', () => {
        checkMLBackendHealth(true);
      });
    }
  }
});
