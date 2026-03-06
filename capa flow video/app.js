/**
 * CAPA WORKFLOW - PROFESSIONAL APPLICATION
 * Enterprise-grade multi-agent orchestration visualization
 */

'use strict';

// Configuration
const CONFIG = {
  TOTAL_SLIDES: 12,
  ANIMATION_DELAYS: {
    FAST: 300,
    NORMAL: 600,
    SLOW: 1000,
    VERY_SLOW: 1500
  },
  FLOWCHART: {
    MIN_SCALE: 0.2,
    MAX_SCALE: 3,
    ZOOM_FACTOR: 1.2
  }
};

// State
const STATE = {
  busy: false,
  currentSlide: 0,
  currentStep: 0,
  maxStep: 0,
  waitingForScroll: false,
  flowchart: {
    scale: 1,
    panX: 0,
    panY: 0,
    dragging: false,
    startX: 0,
    startY: 0
  }
};

// Utility Functions
const $ = (id) => document.getElementById(id);
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Arrow SVG - Define as a simple string
const ARROW_SVG = `
  <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#db2777;stop-opacity:0.9" />
      </linearGradient>
      <filter id="arrowShadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
      </filter>
    </defs>
    <line x1="16" y1="4" x2="16" y2="30" stroke="url(#arrowGradient)" stroke-width="3.5" stroke-linecap="round" filter="url(#arrowShadow)"/>
    <path d="M 16 36 L 8 26 L 24 26 Z" fill="url(#arrowGradient)" filter="url(#arrowShadow)"/>
  </svg>
`;

// Initialize Step Dots
const initializeStepDots = () => {
  const container = $('stepDots');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < CONFIG.TOTAL_SLIDES; i++) {
    const dot = document.createElement('div');
    dot.className = 'step-dot';
    dot.id = `dot_${i}`;
    container.appendChild(dot);
  }
};

// Update Step Dots
const updateStepDots = (currentIndex) => {
  for (let i = 0; i < CONFIG.TOTAL_SLIDES; i++) {
    const dot = $(`dot_${i}`);
    if (!dot) continue;
    dot.className = 'step-dot';
    if (i < currentIndex) dot.classList.add('completed');
    if (i === currentIndex) dot.classList.add('current');
  }
  STATE.currentSlide = currentIndex;
};

// Update Status Bar
const updateStatusBar = (text, step) => {
  const statusText = $('statusText');
  const statusIndicator = $('statusIndicator');
  const statusProgressFill = $('statusProgressFill');
  const statusCount = $('statusCount');
  
  if (statusText) statusText.textContent = text;
  if (statusIndicator) statusIndicator.className = 'status-indicator running';
  if (statusProgressFill) statusProgressFill.style.width = `${(step / CONFIG.TOTAL_SLIDES) * 100}%`;
  if (statusCount) statusCount.textContent = `${step} / ${CONFIG.TOTAL_SLIDES}`;
};

// Animation Helpers
const showElement = (id) => {
  const el = $(id);
  if (el) el.classList.add('visible');
};

const activateAgent = (rowId, statusId) => {
  const row = $(rowId);
  const status = $(statusId);
  if (row) {
    row.classList.add('visible', 'active');
    row.classList.remove('completed');
  }
  if (status) {
    status.className = 'agent-status running';
    status.innerHTML = '⟳';
  }
};

const completeAgent = (rowId, statusId) => {
  const row = $(rowId);
  const status = $(statusId);
  if (row) {
    row.classList.remove('active');
    row.classList.add('completed');
  }
  if (status) {
    status.className = 'agent-status completed';
    status.innerHTML = '✓';
  }
};

const activateMultipleAgents = (agents) => {
  agents.forEach(([r, s]) => activateAgent(r, s));
};

const completeMultipleAgents = (agents) => {
  agents.forEach(([r, s]) => completeAgent(r, s));
};

// Slide Management
const setSlideContent = (html) => {
  const container = $('slideContainer');
  if (container) {
    container.innerHTML = html;
    // Don't auto-scroll - let user control scrolling
  }
};

// Helper to scroll element into view smoothly - DISABLED for user control
const scrollToElement = (elementId) => {
  // Disabled - let user scroll manually
  return;
};

// Wait for user to scroll down to continue
const waitForUserScroll = () => {
  return new Promise((resolve) => {
    STATE.waitingForScroll = true;
    
    // Create a visible continue button overlay
    const continueOverlay = document.createElement('div');
    continueOverlay.id = 'continueOverlay';
    continueOverlay.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #7c3aed, #db2777);
      color: white;
      padding: 16px 32px;
      border-radius: 50px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 8px 32px rgba(124, 58, 237, 0.4);
      animation: bounce 1s infinite;
      user-select: none;
    `;
    continueOverlay.innerHTML = '👇 Click to Continue or Scroll Down';
    document.body.appendChild(continueOverlay);
    
    // Update status text
    const statusText = $('statusText');
    if (statusText) {
      statusText.innerHTML = '⏸ <span style="animation: blink 1s infinite;">Waiting for user action...</span>';
    }
    
    const showcase = $('showcase');
    let resolved = false;
    
    const cleanup = () => {
      if (resolved) return;
      resolved = true;
      STATE.waitingForScroll = false;
      
      // Remove overlay
      if (continueOverlay && continueOverlay.parentNode) {
        continueOverlay.remove();
      }
      
      // Remove event listeners
      if (showcase) {
        showcase.removeEventListener('scroll', scrollHandler);
        showcase.removeEventListener('wheel', wheelHandler);
      }
      continueOverlay.removeEventListener('click', clickHandler);
      document.removeEventListener('keydown', keyHandler);
      
      if (statusText) {
        statusText.textContent = '▶ Continuing...';
      }
      
      setTimeout(resolve, 200);
    };
    
    const scrollHandler = () => {
      if (!showcase) return;
      const scrollTop = showcase.scrollTop;
      // Any scroll movement
      if (scrollTop > 10) {
        cleanup();
      }
    };
    
    const wheelHandler = (e) => {
      // Any wheel movement downward
      if (e.deltaY > 0) {
        cleanup();
      }
    };
    
    const clickHandler = () => {
      cleanup();
    };
    
    const keyHandler = (e) => {
      // Space, Enter, or Arrow Down
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        cleanup();
      }
    };
    
    // Add all event listeners
    if (showcase) {
      showcase.addEventListener('scroll', scrollHandler);
      showcase.addEventListener('wheel', wheelHandler);
    }
    continueOverlay.addEventListener('click', clickHandler);
    document.addEventListener('keydown', keyHandler);
  });
};

// Main Workflow Execution
const startWorkflow = async () => {
  if (STATE.busy) return;
  STATE.busy = true;
  
  const runBtn = $('runBtn');
  const mapBtn = $('mapBtn');
  const showcase = $('showcase');
  const flowchart = $('flowchart');
  const zoomControls = $('zoomControls');
  
  if (runBtn) {
    runBtn.disabled = true;
    runBtn.innerHTML = '⏳ Running...';
  }
  if (mapBtn) mapBtn.classList.add('hidden');
  if (showcase) showcase.style.display = 'flex';
  if (flowchart) flowchart.style.display = 'none';
  if (zoomControls) zoomControls.classList.remove('visible');

  // Initialize with first slide
  STATE.currentSlide = 0;
  await renderSlide(0);
  
  // Setup scroll-based navigation
  setupScrollNavigation();
  
  if (runBtn) {
    runBtn.disabled = false;
    runBtn.innerHTML = '▶ Run Simulation';
  }
  
  STATE.busy = false;
};

// Render specific slide
const renderSlide = async (slideIndex) => {
  STATE.currentSlide = slideIndex;
  updateStepDots(slideIndex);
  
  // Don't auto-scroll to top - let user control scrolling
  
  switch(slideIndex) {
    case 0:
      await renderSlide0();
      break;
    case 1:
      await renderSlide1();
      break;
    case 2:
      await renderSlide2();
      break;
    case 3:
      await renderSlide3();
      break;
    case 4:
      await renderSlide4();
      break;
    case 5:
      await renderSlide5();
      break;
    case 6:
      await renderSlide6();
      break;
    case 7:
      await renderSlide7();
      break;
    case 8:
      await renderSlide8();
      break;
    case 9:
      await renderSlide9();
      break;
    case 10:
      await renderSlide10();
      break;
    case 11:
      await renderSlide11();
      break;
  }
};

// Setup scroll-based navigation
const setupScrollNavigation = () => {
  let scrollTimeout;
  let isScrolling = false;
  
  const showcase = $('showcase');
  if (!showcase) return;
  
  const handleWheel = (e) => {
    if (isScrolling) return;
    
    e.preventDefault();
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (e.deltaY > 0) {
        // Scroll down - next slide
        if (STATE.currentSlide < CONFIG.TOTAL_SLIDES - 1) {
          isScrolling = true;
          renderSlide(STATE.currentSlide + 1).then(() => {
            setTimeout(() => { isScrolling = false; }, 500);
          });
        }
      } else if (e.deltaY < 0) {
        // Scroll up - previous slide
        if (STATE.currentSlide > 0) {
          isScrolling = true;
          renderSlide(STATE.currentSlide - 1).then(() => {
            setTimeout(() => { isScrolling = false; }, 500);
          });
        }
      }
    }, 50);
  };
  
  showcase.addEventListener('wheel', handleWheel, { passive: false });
};

// SLIDE 0: COMPLAINT RECEIVED
const renderSlide0 = async () => {
  updateStatusBar('Quality complaint received', 1);
  setSlideContent(`
    <div style="text-align:center;padding:32px 0;animation:slideInUp 0.5s ease-out">
      <div style="font-size:80px;margin-bottom:24px">⚠️</div>
      <div style="font-size:12px;font-weight:800;letter-spacing:0.15em;color:#ea580c;margin-bottom:12px;text-transform:uppercase">Incoming Event</div>
      <div style="font-size:32px;font-weight:800;color:#1a1f2e;letter-spacing:-0.03em;margin-bottom:16px">Quality Complaint Received</div>
      <div style="font-size:15px;color:#64748b;line-height:1.8;margin-bottom:28px">A quality complaint has been filed and validated.<br>Initiating the CAPA multi-agent orchestration workflow.</div>
      <div style="display:inline-flex;align-items:center;gap:12px;background:linear-gradient(135deg,#fff7ed,#ffedd5);border:2px solid #fed7aa;border-radius:100px;padding:12px 28px;font-size:13px;font-weight:700;color:#ea580c;box-shadow:0 4px 16px rgba(234,88,12,0.25)">
        <div style="width:10px;height:10px;border-radius:50%;background:#ea580c;animation:blink 1s infinite"></div>
        Dispatching O1 CAPA Director Agent...
      </div>
    </div>
  `);
};

// SLIDE 1: O1 CAPA DIRECTOR
const renderSlide1 = async () => {
  updateStatusBar('O1 · CAPA Director Agent', 2);
  setSlideContent(`
    <div class="slide-header">
      <div class="slide-icon color-orange">🎯</div>
      <div class="slide-info">
        <div class="slide-tag" style="color:#ea580c">Overall Orchestrator</div>
        <div class="slide-title">O1 · CAPA Director Agent</div>
      </div>
    </div>
    <div class="card">
      <div class="agent-row" id="o1Row">
        <div class="agent-badge color-orange">O1</div>
        <div class="agent-info">
          <div class="agent-label" style="color:#ea580c">Overall Orchestrator</div>
          <div class="agent-name">CAPA Director Agent</div>
          <div class="agent-description">Receives complaint · orchestrates full CAPA workflow</div>
        </div>
        <div class="agent-status" id="o1Status"></div>
      </div>
      <div style="margin-top:20px;padding:20px;background:linear-gradient(135deg,#f8fafc,#f1f5f9);border-radius:12px;border:2px solid #e2e8f0">
        <div style="font-size:11px;font-weight:800;color:#7c3aed;letter-spacing:0.12em;margin-bottom:12px;text-transform:uppercase">Dispatches To</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <span style="background:linear-gradient(135deg,#ede9fe,#ddd6fe);border:2px solid #c4b5fd;border-radius:10px;padding:8px 16px;font-size:12px;font-weight:700;color:#7c3aed">O2 · Risk Analysis</span>
          <span style="background:linear-gradient(135deg,#ede9fe,#ddd6fe);border:2px solid #c4b5fd;border-radius:10px;padding:8px 16px;font-size:12px;font-weight:700;color:#7c3aed">O3 · RCA</span>
          <span style="background:linear-gradient(135deg,#f8fafc,#f1f5f9);border:2px solid #e2e8f0;border-radius:10px;padding:8px 16px;font-size:12px;font-weight:700;color:#475569">A15 · Action Planner</span>
          <span style="background:linear-gradient(135deg,#f8fafc,#f1f5f9);border:2px solid #e2e8f0;border-radius:10px;padding:8px 16px;font-size:12px;font-weight:700;color:#475569">A16 · Effectiveness</span>
        </div>
      </div>
    </div>
  `);
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  activateAgent('o1Row', 'o1Status');
  await delay(CONFIG.ANIMATION_DELAYS.VERY_SLOW);
  completeAgent('o1Row', 'o1Status');
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  await waitForUserScroll();

  // SLIDE 2: O2 RISK ANALYSIS - WITH ALL AGENTS VISIBLE
  updateStepDots(2);
  updateStatusBar('O2 · Risk Analysis — Multi-stage parallel execution', 3);
  setSlideContent(`
    <div class="slide-header">
      <div class="slide-icon color-purple">🔍</div>
      <div class="slide-info">
        <div class="slide-tag" style="color:#7c3aed">Orchestrator · O2</div>
        <div class="slide-title">Risk Analysis Agent</div>
      </div>
    </div>
    <div class="card" style="overflow:visible">
      <div class="agent-row" id="o2Row" style="margin-bottom:20px">
        <div class="agent-badge color-purple">O2</div>
        <div class="agent-info">
          <div class="agent-label" style="color:#7c3aed">Risk Analysis Orchestrator</div>
          <div class="agent-name">Risk Analysis Agent</div>
          <div class="agent-description">Coordinates multi-stage risk assessment workflow</div>
        </div>
        <div class="agent-status" id="o2Status"></div>
      </div>
      
      <div class="section-label" style="margin-top:24px">Stage 1 · Data Enrichment · All 4 Agents Run in Parallel</div>
      
      <div class="agent-grid" style="margin-top:16px;margin-bottom:20px">
        <div class="agent-row" id="a5Row">
          <div class="agent-badge color-gray" style="font-size:12px">A5</div>
          <div class="agent-info">
            <div class="agent-label" style="color:#64748b">Detection Agent</div>
            <div class="agent-name">Detection Agent</div>
            <div class="agent-tags">QMS · ERP</div>
          </div>
          <div class="agent-status" id="a5Status"></div>
        </div>
        
        <div class="agent-row" id="a1Row">
          <div class="agent-badge color-gray" style="font-size:12px">A1</div>
          <div class="agent-info">
            <div class="agent-label" style="color:#64748b">Similar Cases</div>
            <div class="agent-name">Similar Cases Agent</div>
            <div class="agent-tags">QMS · ERP · PLM</div>
          </div>
          <div class="agent-status" id="a1Status"></div>
        </div>
        
        <div class="agent-row" id="a2Row">
          <div class="agent-badge color-gray" style="font-size:12px">A2</div>
          <div class="agent-info">
            <div class="agent-label" style="color:#64748b">Pattern Agent</div>
            <div class="agent-name">Pattern Agent</div>
            <div class="agent-tags">QMS · ERP</div>
          </div>
          <div class="agent-status" id="a2Status"></div>
        </div>
        
        <div class="agent-row" id="a3Row">
          <div class="agent-badge color-gray" style="font-size:12px">A3</div>
          <div class="agent-info">
            <div class="agent-label" style="color:#64748b">Severity Agent</div>
            <div class="agent-name">Severity Agent</div>
            <div class="agent-tags">QMS · ERP</div>
          </div>
          <div class="agent-status" id="a3Status"></div>
        </div>
      </div>
      
      <div class="section-label" style="margin-top:24px">Stage 2 · Occurrence Scoring</div>
      
      <div class="agent-row" id="a4Row" style="margin-top:16px;margin-bottom:16px">
        <div class="agent-badge color-red">A4</div>
        <div class="agent-info">
          <div class="agent-label" style="color:#dc2626">Occurrence Agent</div>
          <div class="agent-name">Occurrence Agent</div>
          <div class="agent-description">Consumes A1 (Similar Cases) + A2 (Pattern) enriched output</div>
          <div class="agent-tags">QMS · ERP</div>
        </div>
        <div class="agent-status" id="a4Status"></div>
      </div>
      
      <div class="connector" id="connRpn">${ARROW_SVG}</div>
      
      <div class="rpn-box" id="rpnBox" style="margin:16px 0">
        <div class="rpn-label">Orchestrator Computes</div>
        <div class="rpn-equation">RPN = Severity × Occurrence × Detection</div>
      </div>
      
      <div class="section-label" style="margin-top:24px">Stage 3 & 4 · Regulatory & AI Reasoning</div>
      
      <div class="agent-row" id="a6Row" style="margin-top:16px;margin-bottom:16px">
        <div class="agent-badge color-gray">A6</div>
        <div class="agent-info">
          <div class="agent-label" style="color:#64748b">Regulatory Agent</div>
          <div class="agent-name">Regulatory Agent</div>
          <div class="agent-description">Receives all prior outputs: A1–A5, A4 Occurrence, RPN value</div>
          <div class="agent-tags">QMS · ERP</div>
        </div>
        <div class="agent-status" id="a6Status"></div>
      </div>
      
      <div class="connector" id="connA7">${ARROW_SVG}</div>
      
      <div class="agent-row" id="a7Row" style="margin-top:16px">
        <div class="agent-badge color-gray">A7</div>
        <div class="agent-info">
          <div class="agent-label" style="color:#64748b">AI Reasoning Agent</div>
          <div class="agent-name">AI Reasoning Agent</div>
          <div class="agent-description">Receives all outputs from A1–A6 for final risk synthesis</div>
          <div class="agent-tags">QMS · ERP</div>
        </div>
        <div class="agent-status" id="a7Status"></div>
      </div>
    </div>
  `);
  
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  activateAgent('o2Row', 'o2Status');
  await delay(CONFIG.ANIMATION_DELAYS.SLOW);
  completeAgent('o2Row', 'o2Status');
  
  await delay(CONFIG.ANIMATION_DELAYS.FAST);
  
  // Scroll to show Stage 1 agents
  setTimeout(() => scrollToElement('a5Row'), 100);
  
  activateMultipleAgents([
    ['a5Row', 'a5Status'],
    ['a1Row', 'a1Status'],
    ['a2Row', 'a2Status'],
    ['a3Row', 'a3Status']
  ]);
  
  await delay(CONFIG.ANIMATION_DELAYS.VERY_SLOW + 500);
  completeMultipleAgents([
    ['a5Row', 'a5Status'],
    ['a1Row', 'a1Status'],
    ['a2Row', 'a2Status'],
    ['a3Row', 'a3Status']
  ]);
  
  await delay(CONFIG.ANIMATION_DELAYS.FAST);
  
  // Scroll to show Stage 2
  setTimeout(() => scrollToElement('a4Row'), 100);
  
  activateAgent('a4Row', 'a4Status');
  await delay(CONFIG.ANIMATION_DELAYS.SLOW + 300);
  completeAgent('a4Row', 'a4Status');
  
  showElement('connRpn');
  await delay(CONFIG.ANIMATION_DELAYS.FAST);
  
  // Scroll to show RPN
  setTimeout(() => scrollToElement('rpnBox'), 100);
  
  const rpnBox = $('rpnBox');
  if (rpnBox) {
    rpnBox.classList.add('visible');
    await delay(CONFIG.ANIMATION_DELAYS.FAST);
    rpnBox.classList.add('active');
    await delay(CONFIG.ANIMATION_DELAYS.SLOW);
    rpnBox.classList.remove('active');
  }
  
  showElement('connA7');
  await delay(CONFIG.ANIMATION_DELAYS.FAST);
  
  // Scroll to show Stage 3 & 4
  setTimeout(() => scrollToElement('a6Row'), 100);
  
  activateAgent('a6Row', 'a6Status');
  await delay(CONFIG.ANIMATION_DELAYS.SLOW + 300);
  completeAgent('a6Row', 'a6Status');
  
  await delay(CONFIG.ANIMATION_DELAYS.FAST);
  
  setTimeout(() => scrollToElement('a7Row'), 100);
  
  activateAgent('a7Row', 'a7Status');
  await delay(CONFIG.ANIMATION_DELAYS.SLOW + 300);
  completeAgent('a7Row', 'a7Status');
  
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  await waitForUserScroll();

  // SLIDE 3: HUMAN-IN-THE-LOOP CHECKPOINT 1
  updateStepDots(3);
  updateStatusBar('Human-in-the-loop · Checkpoint 1', 4);
  setSlideContent(`
    <div class="slide-header">
      <div class="slide-icon color-purple">👤</div>
      <div class="slide-info">
        <div class="slide-tag" style="color:#7c3aed">Checkpoint 1</div>
        <div class="slide-title">Human-in-the-Loop Review</div>
      </div>
    </div>
    <div class="card">
      <div class="human-review-box" id="humanBox">
        <div class="human-avatar">👤</div>
        <div class="human-name">Human Reviewer</div>
        <div class="human-description">Risk Analysis output under human review.<br>Verifying RPN values, regulatory flags, and AI reasoning<br>before proceeding to Root Cause Analysis.</div>
      </div>
    </div>
  `);
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  const humanBox = $('humanBox');
  if (humanBox) {
    humanBox.classList.add('visible');
    await delay(CONFIG.ANIMATION_DELAYS.FAST);
    humanBox.classList.add('active');
    await delay(2500);
    humanBox.classList.remove('active');
  }
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  await waitForUserScroll();

  // SLIDE 4: O3 RCA ORCHESTRATOR
  updateStepDots(4);
  updateStatusBar('O3 · RCA Orchestrator', 5);
  setSlideContent(`
    <div class="slide-header">
      <div class="slide-icon color-purple">🧬</div>
      <div class="slide-info">
        <div class="slide-tag" style="color:#7c3aed">Orchestrator · O3</div>
        <div class="slide-title">RCA Agent</div>
      </div>
    </div>
    <div class="card">
      <div class="agent-row" id="o3Row">
        <div class="agent-badge color-purple">O3</div>
        <div class="agent-info">
          <div class="agent-label" style="color:#7c3aed">Root Cause Analysis Orchestrator</div>
          <div class="agent-name">RCA Agent (Root Cause Analysis Orchestrator)</div>
          <div class="agent-description">Based on company methodology</div>
        </div>
        <div class="agent-status" id="o3Status"></div>
      </div>
      <div style="margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div style="padding:20px;background:linear-gradient(135deg,#fdf2f8,#fce7f3);border:2px solid #fbcfe8;border-radius:12px;text-align:center">
          <div style="font-size:11px;font-weight:800;color:#db2777;margin-bottom:6px">PATH A · NEXT SLIDE</div>
          <div style="font-size:16px;font-weight:800;color:#1a1f2e">O4 · Why Analysis</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:4px">A8 → A9 → A10 → Decision</div>
        </div>
        <div style="padding:20px;background:linear-gradient(135deg,#fdf2f8,#fce7f3);border:2px solid #fbcfe8;border-radius:12px;text-align:center">
          <div style="font-size:11px;font-weight:800;color:#db2777;margin-bottom:6px">PATH B · THEN SHOWN</div>
          <div style="font-size:16px;font-weight:800;color:#1a1f2e">O5 · Fishbone</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:4px">A9 → A14 → A10 → Decision</div>
        </div>
      </div>
    </div>
  `);
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  activateAgent('o3Row', 'o3Status');
  await delay(CONFIG.ANIMATION_DELAYS.VERY_SLOW);
  completeAgent('o3Row', 'o3Status');
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  await waitForUserScroll();

  // SLIDE 5: O4 WHY ANALYSIS - COMPLETE WITH DECISIONS
  updateStepDots(5);
  updateStatusBar('O4 · Why Analysis — step by step', 6);
  setSlideContent(`
    <div class="slide-header">
      <div class="slide-icon color-pink">❓</div>
      <div class="slide-info">
        <div class="slide-tag" style="color:#db2777">O4 · Why Analysis Orchestrator</div>
        <div class="slide-title">Why Analysis Path</div>
      </div>
    </div>
    <div class="card" style="overflow:visible">
      <div class="agent-row" id="o4Row">
        <div class="agent-badge color-pink">O4</div>
        <div class="agent-info">
          <div class="agent-label" style="color:#db2777">Why Analysis Orchestrator</div>
          <div class="agent-name">Why Analysis Agent (Orchestrator)</div>
        </div>
        <div class="agent-status" id="o4Status"></div>
      </div>
      
      <div class="connector" id="connA8">${ARROW_SVG}</div>
      
      <div class="agent-row" id="a8Row">
        <div class="agent-badge color-gray" style="font-size:12px">A8</div>
        <div class="agent-info">
          <div class="agent-label" style="color:#64748b">Question Agent</div>
          <div class="agent-name">Question Agent</div>
          <div class="agent-tags">SOP · LOGS · TIMELINE</div>
        </div>
        <div class="agent-status" id="a8Status"></div>
      </div>
      
      <div class="connector" id="connA9w">${ARROW_SVG}</div>
      
      <div class="agent-row" id="a9wRow">
        <div class="agent-badge color-gray" style="font-size:12px">A9</div>
        <div class="agent-info">
          <div class="agent-label" style="color:#64748b">List of Causes</div>
          <div class="agent-name">List of Causes Agent</div>
          <div class="agent-tags">QMS · PLM</div>
        </div>
        <div class="agent-status" id="a9wStatus"></div>
      </div>
      
      <div class="connector" id="connA10w">${ARROW_SVG}</div>
      
      <div class="agent-row" id="a10wRow">
        <div class="agent-badge color-gray" style="font-size:12px">A10</div>
        <div class="agent-info">
          <div class="agent-label" style="color:#64748b">Validate Agent</div>
          <div class="agent-name">Validate Agent (Evidence)</div>
          <div class="agent-tags">PLM · QMS · ERP · LOGS</div>
        </div>
        <div class="agent-status" id="a10wStatus"></div>
      </div>
      
      <div class="connector" id="connD1">${ARROW_SVG}</div>
      
      <div class="decision-row" id="d1Row">
        <div class="decision-diamond">
          <div class="decision-text">No of Causes Matched?</div>
        </div>
      </div>
      
      <div style="font-size:11px;font-weight:800;color:#94a3b8;text-align:center;margin:12px 0 10px;letter-spacing:0.1em;text-transform:uppercase">
        Route Based on Match Count
      </div>
      
      <div class="agent-grid-3">
        <div class="branch-card" id="bc12w">
          <div class="branch-label">0 Matches</div>
          <div style="font-size:12px;font-weight:800;color:#475569;margin-bottom:4px">A12</div>
          <div class="branch-value">Zero Evidence Mode</div>
        </div>
        <div class="branch-card" id="bc11w">
          <div class="branch-label">1 Match</div>
          <div style="font-size:12px;font-weight:800;color:#475569;margin-bottom:4px">A11</div>
          <div class="branch-value">Loop Control Agent</div>
          <div style="font-size:10px;color:#94a3b8;margin-top:4px">QMS</div>
        </div>
        <div class="branch-card" id="bc13w">
          <div class="branch-label">&gt;1 Matches</div>
          <div style="font-size:12px;font-weight:800;color:#475569;margin-bottom:4px">A13</div>
          <div class="branch-value">Ranking Agent</div>
          <div style="font-size:10px;color:#94a3b8;margin-top:4px">QMS</div>
        </div>
      </div>
      
      <div class="connector" id="connDrca">${ARROW_SVG}</div>
      
      <div class="decision-row" id="dRcaRow">
        <div class="decision-diamond">
          <div class="decision-text">RCA Identified?</div>
        </div>
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
        <div class="branch-card" id="bcYes" style="border-color:#86efac;background:linear-gradient(135deg,#f0fdf4,#dcfce7)">
          <div class="branch-label" style="color:#16a34a">YES → End</div>
          <div style="font-size:14px;font-weight:800;color:#16a34a">✓ RCA Complete</div>
        </div>
        <div class="branch-card" id="bcNo">
          <div class="branch-label">NO</div>
          <div style="font-size:13px;font-weight:700;color:#64748b">← Loop back to A8</div>
        </div>
      </div>
      
      <div style="margin-top:20px;padding:16px;background:linear-gradient(135deg,#fdf2f8,#fce7f3);border:2px solid #fbcfe8;border-radius:12px;text-align:center">
        <div style="font-size:11px;font-weight:800;color:#db2777;margin-bottom:8px;text-transform:uppercase">Iterative Loop</div>
        <div style="font-size:13px;color:#64748b">If RCA not identified, loops back to A8 for deeper questioning</div>
      </div>
    </div>
  `);
  
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  activateAgent('o4Row', 'o4Status');
  await delay(CONFIG.ANIMATION_DELAYS.SLOW);
  completeAgent('o4Row', 'o4Status');
  
  showElement('connA8');
  await delay(CONFIG.ANIMATION_DELAYS.FAST);
  setTimeout(() => scrollToElement('a8Row'), 100);
  activateAgent('a8Row', 'a8Status');
  await delay(CONFIG.ANIMATION_DELAYS.SLOW + 200);
  completeAgent('a8Row', 'a8Status');
  
  showElement('connA9w');
  await delay(CONFIG.ANIMATION_DELAYS.FAST);
  setTimeout(() => scrollToElement('a9wRow'), 100);
  activateAgent('a9wRow', 'a9wStatus');
  await delay(CONFIG.ANIMATION_DELAYS.SLOW + 200);
  completeAgent('a9wRow', 'a9wStatus');
  
  showElement('connA10w');
  await delay(CONFIG.ANIMATION_DELAYS.FAST);
  setTimeout(() => scrollToElement('a10wRow'), 100);
  activateAgent('a10wRow', 'a10wStatus');
  await delay(CONFIG.ANIMATION_DELAYS.SLOW + 200);
  completeAgent('a10wRow', 'a10wStatus');
  
  showElement('connD1');
  await delay(CONFIG.ANIMATION_DELAYS.FAST);
  setTimeout(() => scrollToElement('d1Row'), 100);
  showElement('d1Row');
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  
  showElement('bc12w');
  await delay(150);
  showElement('bc11w');
  await delay(150);
  showElement('bc13w');
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  
  showElement('connDrca');
  await delay(CONFIG.ANIMATION_DELAYS.FAST);
  setTimeout(() => scrollToElement('dRcaRow'), 100);
  showElement('dRcaRow');
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  
  showElement('bcYes');
  await delay(150);
  showElement('bcNo');
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  await waitForUserScroll();

  // SLIDE 6: O5 FISHBONE ANALYSIS - COMPLETE
  updateStepDots(6);
  updateStatusBar('O5 · Fishbone Analysis — step by step', 7);
  setSlideContent(`
    <div class="slide-header">
      <div class="slide-icon color-pink">🐟</div>
      <div class="slide-info">
        <div class="slide-tag" style="color:#db2777">O5 · Fishbone Orchestrator</div>
        <div class="slide-title">Fishbone Analysis Path</div>
      </div>
    </div>
    <div class="card" style="overflow:visible">
      <div class="agent-row" id="o5Row">
        <div class="agent-badge color-pink">O5</div>
        <div class="agent-info">
          <div class="agent-label" style="color:#db2777">Fishbone Orchestrator</div>
          <div class="agent-name">Fishbone Agent (Orchestrator)</div>
        </div>
        <div class="agent-status" id="o5Status"></div>
      </div>
      
      <div class="connector" id="connA9f">${ARROW_SVG}</div>
      
      <div class="agent-row" id="a9fRow">
        <div class="agent-badge color-gray" style="font-size:12px">A9</div>
        <div class="agent-info">
          <div class="agent-label" style="color:#64748b">List of Causes</div>
          <div class="agent-name">List of Causes Agent</div>
          <div class="agent-tags">QMS · PLM</div>
        </div>
        <div class="agent-status" id="a9fStatus"></div>
      </div>
      
      <div class="connector" id="connA14">${ARROW_SVG}</div>
      
      <div class="agent-row" id="a14Row">
        <div class="agent-badge color-gray" style="font-size:12px">A14</div>
        <div class="agent-info">
          <div class="agent-label" style="color:#64748b">Categorize Agent</div>
          <div class="agent-name">Categorize Agent</div>
          <div class="agent-description">Categorizes causes into fishbone categories</div>
        </div>
        <div class="agent-status" id="a14Status"></div>
      </div>
      
      <div class="connector" id="connA10f">${ARROW_SVG}</div>
      
      <div class="agent-row" id="a10fRow">
        <div class="agent-badge color-gray" style="font-size:12px">A10</div>
        <div class="agent-info">
          <div class="agent-label" style="color:#64748b">Validate Agent</div>
          <div class="agent-name">Validate Agent (Evidence)</div>
          <div class="agent-tags">PLM · QMS · ERP</div>
        </div>
        <div class="agent-status" id="a10fStatus"></div>
      </div>
      
      <div class="connector" id="connD2">${ARROW_SVG}</div>
      
      <div class="decision-row" id="d2Row">
        <div class="decision-diamond">
          <div class="decision-text">No of Causes Matched?</div>
        </div>
      </div>
      
      <div style="font-size:11px;font-weight:800;color:#94a3b8;text-align:center;margin:12px 0 10px;letter-spacing:0.1em;text-transform:uppercase">
        Route Based on Match Count
      </div>
      
      <div class="agent-grid-3">
        <div class="branch-card" id="bc12f">
          <div class="branch-label">0 Matches</div>
          <div style="font-size:12px;font-weight:800;color:#475569;margin-bottom:4px">A12</div>
          <div class="branch-value">Zero Evidence Mode</div>
        </div>
        <div class="branch-card" id="bc11f">
          <div class="branch-label">1 Match</div>
          <div style="font-size:12px;font-weight:800;color:#475569;margin-bottom:4px">Identified</div>
          <div class="branch-value">Single Root Cause</div>
        </div>
        <div class="branch-card" id="bc13f">
          <div class="branch-label">&gt;1 Matches</div>
          <div style="font-size:12px;font-weight:800;color:#475569;margin-bottom:4px">A13</div>
          <div class="branch-value">Ranking Agent</div>
        </div>
      </div>
      
      <div class="connector" id="connRf">${ARROW_SVG}</div>
      
      <div class="agent-row" id="rfRow" style="background:linear-gradient(135deg,#fdf2f8,#fce7f3);border-color:#fbcfe8;margin-top:16px">
        <div class="agent-badge color-pink" style="font-size:14px">!</div>
        <div class="agent-info">
          <div class="agent-label" style="color:#db2777">Result</div>
          <div class="agent-name">Result (AI Flagged)</div>
          <div class="agent-description">Unresolved causes flagged by AI for deeper analysis</div>
        </div>
      </div>
      
      <div class="connector" id="connO4lp">${ARROW_SVG}</div>
      
      <div class="agent-row" id="o4lpRow" style="background:linear-gradient(135deg,#fdf2f8,#fce7f3);border-color:#fbcfe8;margin-top:16px">
        <div class="agent-badge color-pink">O4</div>
        <div class="agent-info">
          <div class="agent-label" style="color:#db2777">Loop Back → Why Analysis</div>
          <div class="agent-name">O4 · Why Analysis Agent (Orchestrator)</div>
          <div class="agent-description">Fishbone result feeds back into Why Analysis for deeper drill-down</div>
        </div>
      </div>
      
      <div style="margin-top:20px;padding:16px;background:linear-gradient(135deg,#fdf2f8,#fce7f3);border:2px solid #fbcfe8;border-radius:12px;text-align:center">
        <div style="font-size:11px;font-weight:800;color:#db2777;margin-bottom:8px;text-transform:uppercase">Iterative Process</div>
        <div style="font-size:13px;color:#64748b">O4 and O5 work together iteratively until root cause is identified</div>
      </div>
    </div>
  `);
  
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  activateAgent('o5Row', 'o5Status');
  await delay(CONFIG.ANIMATION_DELAYS.SLOW);
  completeAgent('o5Row', 'o5Status');
  
  showElement('connA9f');
  await delay(CONFIG.ANIMATION_DELAYS.FAST);
  setTimeout(() => scrollToElement('a9fRow'), 100);
  activateAgent('a9fRow', 'a9fStatus');
  await delay(CONFIG.ANIMATION_DELAYS.SLOW + 200);
  completeAgent('a9fRow', 'a9fStatus');
  
  showElement('connA14');
  await delay(CONFIG.ANIMATION_DELAYS.FAST);
  setTimeout(() => scrollToElement('a14Row'), 100);
  activateAgent('a14Row', 'a14Status');
  await delay(CONFIG.ANIMATION_DELAYS.SLOW + 200);
  completeAgent('a14Row', 'a14Status');
  
  showElement('connA10f');
  await delay(CONFIG.ANIMATION_DELAYS.FAST);
  setTimeout(() => scrollToElement('a10fRow'), 100);
  activateAgent('a10fRow', 'a10fStatus');
  await delay(CONFIG.ANIMATION_DELAYS.SLOW + 200);
  completeAgent('a10fRow', 'a10fStatus');
  
  showElement('connD2');
  await delay(CONFIG.ANIMATION_DELAYS.FAST);
  setTimeout(() => scrollToElement('d2Row'), 100);
  showElement('d2Row');
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  
  showElement('bc12f');
  await delay(150);
  showElement('bc11f');
  await delay(150);
  showElement('bc13f');
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  
  showElement('connRf');
  await delay(CONFIG.ANIMATION_DELAYS.FAST);
  setTimeout(() => scrollToElement('rfRow'), 100);
  showElement('rfRow');
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  
  showElement('connO4lp');
  await delay(CONFIG.ANIMATION_DELAYS.FAST);
  setTimeout(() => scrollToElement('o4lpRow'), 100);
  showElement('o4lpRow');
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  await waitForUserScroll();

  // SLIDE 7: HUMAN CHECKPOINT 2
  updateStepDots(7);
  updateStatusBar('Human-in-the-loop · Checkpoint 2', 8);
  setSlideContent(`
    <div class="slide-header">
      <div class="slide-icon color-purple">👤</div>
      <div class="slide-info">
        <div class="slide-tag" style="color:#7c3aed">Checkpoint 2</div>
        <div class="slide-title">Human-in-the-Loop Review</div>
      </div>
    </div>
    <div class="card">
      <div class="human-review-box" id="humanBox2">
        <div class="human-avatar">👤</div>
        <div class="human-name">Human Reviewer</div>
        <div class="human-description">Root Cause Analysis output under human review.<br>Verifying identified root causes and evidence<br>before proceeding to Action Planning.</div>
      </div>
    </div>
  `);
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  const humanBox2 = $('humanBox2');
  if (humanBox2) {
    humanBox2.classList.add('visible');
    await delay(CONFIG.ANIMATION_DELAYS.FAST);
    humanBox2.classList.add('active');
    await delay(2500);
    humanBox2.classList.remove('active');
  }
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  await waitForUserScroll();

  // SLIDE 8: A15 ACTION PLANNER
  updateStepDots(8);
  updateStatusBar('A15 · Action Planner Agent', 9);
  setSlideContent(`
    <div class="slide-header">
      <div class="slide-icon color-green">📋</div>
      <div class="slide-info">
        <div class="slide-tag" style="color:#16a34a">Action Planning</div>
        <div class="slide-title">A15 · Action Planner Agent</div>
      </div>
    </div>
    <div class="card">
      <div class="agent-row" id="a15Row">
        <div class="agent-badge color-green">A15</div>
        <div class="agent-info">
          <div class="agent-label" style="color:#16a34a">Action Planner Agent</div>
          <div class="agent-name">Action Planner Agent</div>
          <div class="agent-description">Creates corrective and preventive action plans based on root causes</div>
          <div class="agent-tags">QMS</div>
        </div>
        <div class="agent-status" id="a15Status"></div>
      </div>
      <div style="margin-top:20px;padding:20px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #86efac;border-radius:12px">
        <div style="font-size:11px;font-weight:800;color:#16a34a;margin-bottom:12px">ACTION PLAN COMPONENTS</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div style="background:white;border:1px solid #86efac;border-radius:8px;padding:12px">
            <div style="font-size:11px;font-weight:700;color:#16a34a;margin-bottom:4px">Corrective Actions</div>
            <div style="font-size:12px;color:#64748b">Immediate fixes</div>
          </div>
          <div style="background:white;border:1px solid #86efac;border-radius:8px;padding:12px">
            <div style="font-size:11px;font-weight:700;color:#16a34a;margin-bottom:4px">Preventive Actions</div>
            <div style="font-size:12px;color:#64748b">Long-term measures</div>
          </div>
        </div>
      </div>
    </div>
  `);
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  activateAgent('a15Row', 'a15Status');
  await delay(CONFIG.ANIMATION_DELAYS.VERY_SLOW);
  completeAgent('a15Row', 'a15Status');
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  await waitForUserScroll();

  // SLIDE 9: A16 EFFECTIVENESS
  updateStepDots(9);
  updateStatusBar('A16 · Effectiveness Agent', 10);
  setSlideContent(`
    <div class="slide-header">
      <div class="slide-icon color-green">✓</div>
      <div class="slide-info">
        <div class="slide-tag" style="color:#16a34a">Effectiveness Validation</div>
        <div class="slide-title">A16 · Effectiveness Agent</div>
      </div>
    </div>
    <div class="card">
      <div class="agent-row" id="a16Row">
        <div class="agent-badge color-green">A16</div>
        <div class="agent-info">
          <div class="agent-label" style="color:#16a34a">Effectiveness Agent</div>
          <div class="agent-name">Effectiveness Agent</div>
          <div class="agent-description">Validates and monitors the effectiveness of implemented actions</div>
          <div class="agent-tags">QMS · ERP</div>
        </div>
        <div class="agent-status" id="a16Status"></div>
      </div>
      <div style="margin-top:20px;padding:20px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #86efac;border-radius:12px">
        <div style="font-size:11px;font-weight:800;color:#16a34a;margin-bottom:12px">EFFECTIVENESS MONITORING</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
          <div style="background:white;border:1px solid #86efac;border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:24px;margin-bottom:4px">📊</div>
            <div style="font-size:11px;font-weight:700;color:#16a34a">KPI Tracking</div>
          </div>
          <div style="background:white;border:1px solid #86efac;border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:24px;margin-bottom:4px">🔍</div>
            <div style="font-size:11px;font-weight:700;color:#16a34a">Verification</div>
          </div>
          <div style="background:white;border:1px solid #86efac;border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:24px;margin-bottom:4px">📈</div>
            <div style="font-size:11px;font-weight:700;color:#16a34a">Reporting</div>
          </div>
        </div>
      </div>
    </div>
  `);
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  activateAgent('a16Row', 'a16Status');
  await delay(CONFIG.ANIMATION_DELAYS.VERY_SLOW);
  completeAgent('a16Row', 'a16Status');
  await delay(CONFIG.ANIMATION_DELAYS.NORMAL);
  await waitForUserScroll();

  // WORKFLOW COMPLETE
  updateStepDots(11);
  updateStatusBar('✓ Workflow Complete', 12);
  const statusIndicator = $('statusIndicator');
  if (statusIndicator) statusIndicator.className = 'status-indicator completed';
  
  setSlideContent(`
    <div style="text-align:center;padding:48px 0">
      <div style="font-size:96px;margin-bottom:24px">✓</div>
      <div style="font-size:12px;font-weight:800;letter-spacing:0.15em;color:#16a34a;margin-bottom:12px;text-transform:uppercase">Workflow Complete</div>
      <div style="font-size:32px;font-weight:800;color:#1a1f2e;letter-spacing:-0.03em;margin-bottom:16px">CAPA Process Finished</div>
      <div style="font-size:15px;color:#64748b;line-height:1.8;margin-bottom:28px">All agents have completed their tasks successfully.<br>The CAPA workflow orchestration is complete.</div>
      <div style="display:flex;gap:12px;justify-content:center;margin-top:32px">
        <div style="background:linear-gradient(135deg,#ede9fe,#ddd6fe);border:2px solid #c4b5fd;border-radius:12px;padding:16px 24px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:#7c3aed">12</div>
          <div style="font-size:11px;font-weight:700;color:#7c3aed">Steps Completed</div>
        </div>
        <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #86efac;border-radius:12px;padding:16px 24px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:#16a34a">16</div>
          <div style="font-size:11px;font-weight:700;color:#16a34a">Agents Executed</div>
        </div>
      </div>
    </div>
  `);
  
  if (runBtn) {
    runBtn.disabled = false;
    runBtn.innerHTML = '▶ Run Simulation';
  }
  if (mapBtn) mapBtn.classList.remove('hidden');
  STATE.busy = false;
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initializeStepDots();
  
  const runBtn = $('runBtn');
  if (runBtn) runBtn.addEventListener('click', startWorkflow);
  
  console.log('✓ CAPA Workflow Application Initialized');
  console.log('💡 Tip: Scroll down to continue through each step');
});

// Export for global access
window.CAPAWorkflow = {
  start: startWorkflow,
  state: STATE,
  config: CONFIG
};
