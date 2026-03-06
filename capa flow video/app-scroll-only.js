/**
 * CAPA WORKFLOW - SCROLL-ONLY VERSION
 * All content visible, user scrolls through everything
 */

'use strict';

// Configuration
const CONFIG = {
  TOTAL_SLIDES: 12
};

// State
const STATE = {
  busy: false,
  currentSlide: 0
};

// Utility Functions
const $ = (id) => document.getElementById(id);

// Arrow SVG
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
  updateStatusBar(currentIndex);
};

// Navigate to specific slide
const goToSlide = (index) => {
  if (index < 0 || index >= CONFIG.TOTAL_SLIDES) return;
  
  const showcase = $('showcase');
  if (!showcase) return;
  
  const sections = showcase.querySelectorAll('.workflow-section');
  
  // Hide all sections
  sections.forEach(section => section.classList.remove('active'));
  
  // Show target section
  if (sections[index]) {
    sections[index].classList.add('active');
    sections[index].scrollTop = 0; // Reset scroll position
  }
  
  updateStepDots(index);
  updateNavButtons(index);
};

// Update navigation buttons state
const updateNavButtons = (currentIndex) => {
  const prevButtons = document.querySelectorAll('.prev-slide-btn');
  const nextButtons = document.querySelectorAll('.next-slide-btn');
  
  prevButtons.forEach((btn, index) => {
    if (index === currentIndex) {
      btn.disabled = currentIndex === 0;
      btn.style.display = currentIndex === 0 ? 'none' : 'inline-block';
    }
  });
  
  nextButtons.forEach((btn, index) => {
    if (index === currentIndex) {
      btn.style.display = currentIndex === CONFIG.TOTAL_SLIDES - 1 ? 'none' : 'inline-block';
    }
  });
};

// Update Status Bar
const updateStatusBar = (step) => {
  const statusText = $('statusText');
  const statusIndicator = $('statusIndicator');
  const statusProgressFill = $('statusProgressFill');
  const statusCount = $('statusCount');
  
  const statusMessages = [
    'Quality complaint received',
    'O1 · CAPA Director Agent',
    'O2 · Risk Analysis',
    'Human-in-the-loop · Checkpoint 1',
    'O3 · RCA Orchestrator',
    'O4 · Why Analysis',
    'O5 · Fishbone Analysis',
    'Human-in-the-loop · Checkpoint 2',
    'A15 · Action Planner Agent',
    'A16 · Effectiveness Agent',
    'Workflow Complete',
    'Summary'
  ];
  
  if (statusText) statusText.textContent = statusMessages[step] || 'In Progress';
  if (statusIndicator) {
    statusIndicator.className = step >= 10 ? 'status-indicator completed' : 'status-indicator running';
  }
  if (statusProgressFill) statusProgressFill.style.width = `${((step + 1) / CONFIG.TOTAL_SLIDES) * 100}%`;
  if (statusCount) statusCount.textContent = `${step + 1} / ${CONFIG.TOTAL_SLIDES}`;
};

// Main Workflow - Show all content at once
const startWorkflow = () => {
  if (STATE.busy) return;
  STATE.busy = true;
  
  const runBtn = $('runBtn');
  const mapBtn = $('mapBtn');
  const showcase = $('showcase');
  const flowchart = $('flowchart');
  const zoomControls = $('zoomControls');
  
  if (runBtn) {
    runBtn.disabled = true;
    runBtn.innerHTML = '⏳ Loading...';
  }
  if (mapBtn) mapBtn.classList.add('hidden');
  if (showcase) showcase.style.display = 'flex';
  if (flowchart) flowchart.style.display = 'none';
  if (zoomControls) zoomControls.classList.remove('visible');

  // Render all content at once
  renderAllContent();
  
  // Setup scroll listener
  if (showcase) {
    showcase.addEventListener('scroll', updateStepDots);
  }
  
  // Setup next button click handlers
  setTimeout(() => {
    const prevButtons = document.querySelectorAll('.prev-slide-btn');
    const nextButtons = document.querySelectorAll('.next-slide-btn');
    
    prevButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => goToSlide(index - 1));
    });
    
    nextButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => goToSlide(index + 1));
    });
    
    // Show first slide
    goToSlide(0);
  }, 100);
  
  if (runBtn) {
    runBtn.disabled = false;
    runBtn.innerHTML = '↻ Restart';
    runBtn.onclick = () => goToSlide(0);
  }
  
  STATE.busy = false;
};

// Render all content in one scrollable view
const renderAllContent = () => {
  const container = $('slideContainer');
  if (!container) return;
  
  container.innerHTML = `
    <!-- SECTION 0: COMPLAINT RECEIVED -->
    <div class="workflow-section">
      <div style="text-align:center;animation:slideInUp 0.5s ease-out">
        <div style="font-size:80px;margin-bottom:24px">⚠️</div>
        <div style="font-size:12px;font-weight:800;letter-spacing:0.15em;color:#ea580c;margin-bottom:12px;text-transform:uppercase">Incoming Event</div>
        <div style="font-size:32px;font-weight:800;color:#1a1f2e;letter-spacing:-0.03em;margin-bottom:16px">Quality Complaint Received</div>
        <div style="font-size:15px;color:#64748b;line-height:1.8;margin-bottom:28px">A quality complaint has been filed and validated.<br>Initiating the CAPA multi-agent orchestration workflow.</div>
        <div style="display:inline-flex;align-items:center;gap:12px;background:linear-gradient(135deg,#fff7ed,#ffedd5);border:2px solid #fed7aa;border-radius:100px;padding:12px 28px;font-size:13px;font-weight:700;color:#ea580c;box-shadow:0 4px 16px rgba(234,88,12,0.25)">
          <div style="width:10px;height:10px;border-radius:50%;background:#ea580c"></div>
          Dispatching O1 CAPA Director Agent...
        </div>
        <div class="slide-nav-buttons"><button class="prev-slide-btn">← Previous</button><button class="next-slide-btn">Next →</button></div>
      </div>
    </div>

    <!-- SECTION 1: O1 CAPA DIRECTOR -->
    <div class="workflow-section">
      <div style="width:100%">
        <div class="slide-header">
          <div class="slide-icon color-orange">🎯</div>
          <div class="slide-info">
            <div class="slide-tag" style="color:#ea580c">Overall Orchestrator</div>
            <div class="slide-title">O1 · CAPA Director Agent</div>
          </div>
        </div>
        <div class="card">
          <div class="agent-row visible completed">
            <div class="agent-badge color-orange">O1</div>
            <div class="agent-info">
              <div class="agent-label" style="color:#ea580c">Overall Orchestrator</div>
              <div class="agent-name">CAPA Director Agent</div>
              <div class="agent-description">Receives complaint · orchestrates full CAPA workflow</div>
            </div>
            <div class="agent-status completed">✓</div>
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
        <div class="slide-nav-buttons"><button class="prev-slide-btn">? Previous</button><button class="next-slide-btn">Next ?</button></div></div>
    </div>

    <!-- SECTION 2: O2 RISK ANALYSIS -->
    <div class="workflow-section">
      <div class="slide-header">
        <div class="slide-icon color-purple">🔍</div>
        <div class="slide-info">
          <div class="slide-tag" style="color:#7c3aed">Orchestrator · O2</div>
          <div class="slide-title">Risk Analysis Agent</div>
        </div>
      </div>
      <div class="card" style="overflow:visible">
        <div class="agent-row visible completed" style="margin-bottom:20px">
          <div class="agent-badge color-purple">O2</div>
          <div class="agent-info">
            <div class="agent-label" style="color:#7c3aed">Risk Analysis Orchestrator</div>
            <div class="agent-name">Risk Analysis Agent</div>
            <div class="agent-description">Coordinates multi-stage risk assessment workflow</div>
          </div>
          <div class="agent-status completed">✓</div>
        </div>
        
        <div class="section-label" style="margin-top:24px">Stage 1 · Data Enrichment · All 4 Agents Run in Parallel</div>
        
        <div class="agent-grid" style="margin-top:16px;margin-bottom:20px">
          <div class="agent-row visible completed">
            <div class="agent-badge color-gray" style="font-size:12px">A5</div>
            <div class="agent-info">
              <div class="agent-label" style="color:#64748b">Detection Agent</div>
              <div class="agent-name">Detection Agent</div>
              <div class="agent-tags">QMS · ERP</div>
            </div>
            <div class="agent-status completed">✓</div>
          </div>
          
          <div class="agent-row visible completed">
            <div class="agent-badge color-gray" style="font-size:12px">A1</div>
            <div class="agent-info">
              <div class="agent-label" style="color:#64748b">Similar Cases</div>
              <div class="agent-name">Similar Cases Agent</div>
              <div class="agent-tags">QMS · ERP · PLM</div>
            </div>
            <div class="agent-status completed">✓</div>
          </div>
          
          <div class="agent-row visible completed">
            <div class="agent-badge color-gray" style="font-size:12px">A2</div>
            <div class="agent-info">
              <div class="agent-label" style="color:#64748b">Pattern Agent</div>
              <div class="agent-name">Pattern Agent</div>
              <div class="agent-tags">QMS · ERP</div>
            </div>
            <div class="agent-status completed">✓</div>
          </div>
          
          <div class="agent-row visible completed">
            <div class="agent-badge color-gray" style="font-size:12px">A3</div>
            <div class="agent-info">
              <div class="agent-label" style="color:#64748b">Severity Agent</div>
              <div class="agent-name">Severity Agent</div>
              <div class="agent-tags">QMS · ERP</div>
            </div>
            <div class="agent-status completed">✓</div>
          </div>
        </div>
        
        <div class="section-label" style="margin-top:24px">Stage 2 · Occurrence Scoring</div>
        
        <div class="agent-row visible completed" style="margin-top:16px;margin-bottom:16px">
          <div class="agent-badge color-red">A4</div>
          <div class="agent-info">
            <div class="agent-label" style="color:#dc2626">Occurrence Agent</div>
            <div class="agent-name">Occurrence Agent</div>
            <div class="agent-description">Consumes A1 (Similar Cases) + A2 (Pattern) enriched output</div>
            <div class="agent-tags">QMS · ERP</div>
          </div>
          <div class="agent-status completed">✓</div>
        </div>
        
        <div class="connector visible">${ARROW_SVG}</div>
        
        <div class="rpn-box visible" style="margin:16px 0">
          <div class="rpn-label">Orchestrator Computes</div>
          <div class="rpn-equation">RPN = Severity × Occurrence × Detection</div>
        </div>
        
        <div class="section-label" style="margin-top:24px">Stage 3 & 4 · Regulatory & AI Reasoning</div>
        
        <div class="agent-row visible completed" style="margin-top:16px;margin-bottom:16px">
          <div class="agent-badge color-gray">A6</div>
          <div class="agent-info">
            <div class="agent-label" style="color:#64748b">Regulatory Agent</div>
            <div class="agent-name">Regulatory Agent</div>
            <div class="agent-description">Receives all prior outputs: A1–A5, A4 Occurrence, RPN value</div>
            <div class="agent-tags">QMS · ERP</div>
          </div>
          <div class="agent-status completed">✓</div>
        </div>
        
        <div class="connector visible">${ARROW_SVG}</div>
        
        <div class="agent-row visible completed" style="margin-top:16px">
          <div class="agent-badge color-gray">A7</div>
          <div class="agent-info">
            <div class="agent-label" style="color:#64748b">AI Reasoning Agent</div>
            <div class="agent-name">AI Reasoning Agent</div>
            <div class="agent-description">Receives all outputs from A1–A6 for final risk synthesis</div>
            <div class="agent-tags">QMS · ERP</div>
          </div>
          <div class="agent-status completed">✓</div>
        </div>
        <div class="slide-nav-buttons"><button class="prev-slide-btn">? Previous</button><button class="next-slide-btn">Next ?</button></div></div>
    </div>

    <!-- SECTION 3: HUMAN CHECKPOINT 1 -->
    <div class="workflow-section">
      <div style="width:100%">
        <div class="slide-header">
          <div class="slide-icon color-purple">👤</div>
          <div class="slide-info">
            <div class="slide-tag" style="color:#7c3aed">Checkpoint 1</div>
            <div class="slide-title">Human-in-the-Loop Review</div>
          </div>
        </div>
        <div class="card">
          <div class="human-review-box visible">
            <div class="human-avatar">👤</div>
            <div class="human-name">Human Reviewer</div>
            <div class="human-description">Risk Analysis output under human review.<br>Verifying RPN values, regulatory flags, and AI reasoning<br>before proceeding to Root Cause Analysis.</div>
          </div>
        </div>
        <div class="slide-nav-buttons"><button class="prev-slide-btn">? Previous</button><button class="next-slide-btn">Next ?</button></div></div>
    </div>

    <!-- SECTION 4: O3 RCA ORCHESTRATOR -->
    <div class="workflow-section">
      <div style="width:100%">
        <div class="slide-header">
          <div class="slide-icon color-purple">🧬</div>
          <div class="slide-info">
            <div class="slide-tag" style="color:#7c3aed">Orchestrator · O3</div>
            <div class="slide-title">RCA Agent</div>
          </div>
        </div>
        <div class="card">
          <div class="agent-row visible completed">
            <div class="agent-badge color-purple">O3</div>
            <div class="agent-info">
              <div class="agent-label" style="color:#7c3aed">Root Cause Analysis Orchestrator</div>
              <div class="agent-name">RCA Agent (Root Cause Analysis Orchestrator)</div>
              <div class="agent-description">Based on company methodology</div>
            </div>
            <div class="agent-status completed">✓</div>
          </div>
          <div style="margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div style="padding:20px;background:linear-gradient(135deg,#fdf2f8,#fce7f3);border:2px solid #fbcfe8;border-radius:12px;text-align:center">
              <div style="font-size:11px;font-weight:800;color:#db2777;margin-bottom:6px">PATH A · NEXT</div>
              <div style="font-size:16px;font-weight:800;color:#1a1f2e">O4 · Why Analysis</div>
              <div style="font-size:12px;color:#94a3b8;margin-top:4px">A8 → A9 → A10 → Decision</div>
            </div>
            <div style="padding:20px;background:linear-gradient(135deg,#fdf2f8,#fce7f3);border:2px solid #fbcfe8;border-radius:12px;text-align:center">
              <div style="font-size:11px;font-weight:800;color:#db2777;margin-bottom:6px">PATH B · THEN</div>
              <div style="font-size:16px;font-weight:800;color:#1a1f2e">O5 · Fishbone</div>
              <div style="font-size:12px;color:#94a3b8;margin-top:4px">A9 → A14 → A10 → Decision</div>
            </div>
          </div>
        </div>
        <div class="slide-nav-buttons"><button class="prev-slide-btn">? Previous</button><button class="next-slide-btn">Next ?</button></div></div>
    </div>

    <!-- SECTION 5: O4 WHY ANALYSIS -->
    <div class="workflow-section">
      <div class="slide-header">
        <div class="slide-icon color-pink">❓</div>
        <div class="slide-info">
          <div class="slide-tag" style="color:#db2777">O4 · Why Analysis Orchestrator</div>
          <div class="slide-title">Why Analysis Path</div>
        </div>
      </div>
      <div class="card" style="overflow:visible">
        <div class="agent-row visible completed">
          <div class="agent-badge color-pink">O4</div>
          <div class="agent-info">
            <div class="agent-label" style="color:#db2777">Why Analysis Orchestrator</div>
            <div class="agent-name">Why Analysis Agent (Orchestrator)</div>
          </div>
          <div class="agent-status completed">✓</div>
        </div>
        
        <div class="connector visible">${ARROW_SVG}</div>
        
        <div class="agent-row visible completed">
          <div class="agent-badge color-gray" style="font-size:12px">A8</div>
          <div class="agent-info">
            <div class="agent-label" style="color:#64748b">Question Agent</div>
            <div class="agent-name">Question Agent</div>
            <div class="agent-tags">SOP · LOGS · TIMELINE</div>
          </div>
          <div class="agent-status completed">✓</div>
        </div>
        
        <div class="connector visible">${ARROW_SVG}</div>
        
        <div class="agent-row visible completed">
          <div class="agent-badge color-gray" style="font-size:12px">A9</div>
          <div class="agent-info">
            <div class="agent-label" style="color:#64748b">List of Causes</div>
            <div class="agent-name">List of Causes Agent</div>
            <div class="agent-tags">QMS · PLM</div>
          </div>
          <div class="agent-status completed">✓</div>
        </div>
        
        <div class="connector visible">${ARROW_SVG}</div>
        
        <div class="agent-row visible completed">
          <div class="agent-badge color-gray" style="font-size:12px">A10</div>
          <div class="agent-info">
            <div class="agent-label" style="color:#64748b">Validate Agent</div>
            <div class="agent-name">Validate Agent (Evidence)</div>
            <div class="agent-tags">PLM · QMS · ERP · LOGS</div>
          </div>
          <div class="agent-status completed">✓</div>
        </div>
        
        <div class="connector visible">${ARROW_SVG}</div>
        
        <div class="decision-row visible">
          <div class="decision-diamond">
            <div class="decision-text">No of Causes Matched?</div>
          </div>
        </div>
        
        <div style="font-size:11px;font-weight:800;color:#94a3b8;text-align:center;margin:12px 0 10px;letter-spacing:0.1em;text-transform:uppercase">
          Route Based on Match Count
        </div>
        
        <div class="agent-grid-3">
          <div class="branch-card visible">
            <div class="branch-label">0 Matches</div>
            <div style="font-size:12px;font-weight:800;color:#475569;margin-bottom:4px">A12</div>
            <div class="branch-value">Zero Evidence Mode</div>
          </div>
          <div class="branch-card visible">
            <div class="branch-label">1 Match</div>
            <div style="font-size:12px;font-weight:800;color:#475569;margin-bottom:4px">A11</div>
            <div class="branch-value">Loop Control Agent</div>
            <div style="font-size:10px;color:#94a3b8;margin-top:4px">QMS</div>
          </div>
          <div class="branch-card visible">
            <div class="branch-label">&gt;1 Matches</div>
            <div style="font-size:12px;font-weight:800;color:#475569;margin-bottom:4px">A13</div>
            <div class="branch-value">Ranking Agent</div>
            <div style="font-size:10px;color:#94a3b8;margin-top:4px">QMS</div>
          </div>
        </div>
        
        <div class="connector visible">${ARROW_SVG}</div>
        
        <div class="decision-row visible">
          <div class="decision-diamond">
            <div class="decision-text">RCA Identified?</div>
          </div>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
          <div class="branch-card visible" style="border-color:#86efac;background:linear-gradient(135deg,#f0fdf4,#dcfce7)">
            <div class="branch-label" style="color:#16a34a">YES → End</div>
            <div style="font-size:14px;font-weight:800;color:#16a34a">✓ RCA Complete</div>
          </div>
          <div class="branch-card visible">
            <div class="branch-label">NO</div>
            <div style="font-size:13px;font-weight:700;color:#64748b">← Loop back to A8</div>
          </div>
        </div>
        
        <div style="margin-top:20px;padding:16px;background:linear-gradient(135deg,#fdf2f8,#fce7f3);border:2px solid #fbcfe8;border-radius:12px;text-align:center">
          <div style="font-size:11px;font-weight:800;color:#db2777;margin-bottom:8px;text-transform:uppercase">Iterative Loop</div>
          <div style="font-size:13px;color:#64748b">If RCA not identified, loops back to A8 for deeper questioning</div>
        </div>
        <div class="slide-nav-buttons"><button class="prev-slide-btn">? Previous</button><button class="next-slide-btn">Next ?</button></div></div>
    </div>

    <!-- SECTION 6: O5 FISHBONE ANALYSIS -->
    <div class="workflow-section">
      <div class="slide-header">
        <div class="slide-icon color-pink">🐟</div>
        <div class="slide-info">
          <div class="slide-tag" style="color:#db2777">O5 · Fishbone Orchestrator</div>
          <div class="slide-title">Fishbone Analysis Path</div>
        </div>
      </div>
      <div class="card" style="overflow:visible">
        <div class="agent-row visible completed">
          <div class="agent-badge color-pink">O5</div>
          <div class="agent-info">
            <div class="agent-label" style="color:#db2777">Fishbone Orchestrator</div>
            <div class="agent-name">Fishbone Agent (Orchestrator)</div>
          </div>
          <div class="agent-status completed">✓</div>
        </div>
        
        <div class="connector visible">${ARROW_SVG}</div>
        
        <div class="agent-row visible completed">
          <div class="agent-badge color-gray" style="font-size:12px">A9</div>
          <div class="agent-info">
            <div class="agent-label" style="color:#64748b">List of Causes</div>
            <div class="agent-name">List of Causes Agent</div>
            <div class="agent-tags">QMS · PLM</div>
          </div>
          <div class="agent-status completed">✓</div>
        </div>
        
        <div class="connector visible">${ARROW_SVG}</div>
        
        <div class="agent-row visible completed">
          <div class="agent-badge color-gray" style="font-size:12px">A14</div>
          <div class="agent-info">
            <div class="agent-label" style="color:#64748b">Categorize Agent</div>
            <div class="agent-name">Categorize Agent</div>
            <div class="agent-description">Categorizes causes into fishbone categories</div>
          </div>
          <div class="agent-status completed">✓</div>
        </div>
        
        <div class="connector visible">${ARROW_SVG}</div>
        
        <div class="agent-row visible completed">
          <div class="agent-badge color-gray" style="font-size:12px">A10</div>
          <div class="agent-info">
            <div class="agent-label" style="color:#64748b">Validate Agent</div>
            <div class="agent-name">Validate Agent (Evidence)</div>
            <div class="agent-tags">PLM · QMS · ERP</div>
          </div>
          <div class="agent-status completed">✓</div>
        </div>
        
        <div class="connector visible">${ARROW_SVG}</div>
        
        <div class="decision-row visible">
          <div class="decision-diamond">
            <div class="decision-text">No of Causes Matched?</div>
          </div>
        </div>
        
        <div style="font-size:11px;font-weight:800;color:#94a3b8;text-align:center;margin:12px 0 10px;letter-spacing:0.1em;text-transform:uppercase">
          Route Based on Match Count
        </div>
        
        <div class="agent-grid-3">
          <div class="branch-card visible">
            <div class="branch-label">0 Matches</div>
            <div style="font-size:12px;font-weight:800;color:#475569;margin-bottom:4px">A12</div>
            <div class="branch-value">Zero Evidence Mode</div>
          </div>
          <div class="branch-card visible">
            <div class="branch-label">1 Match</div>
            <div style="font-size:12px;font-weight:800;color:#475569;margin-bottom:4px">Identified</div>
            <div class="branch-value">Single Root Cause</div>
          </div>
          <div class="branch-card visible">
            <div class="branch-label">&gt;1 Matches</div>
            <div style="font-size:12px;font-weight:800;color:#475569;margin-bottom:4px">A13</div>
            <div class="branch-value">Ranking Agent</div>
          </div>
        </div>
        
        <div class="connector visible">${ARROW_SVG}</div>
        
        <div class="agent-row visible" style="background:linear-gradient(135deg,#fdf2f8,#fce7f3);border-color:#fbcfe8;margin-top:16px">
          <div class="agent-badge color-pink" style="font-size:14px">!</div>
          <div class="agent-info">
            <div class="agent-label" style="color:#db2777">Result</div>
            <div class="agent-name">Result (AI Flagged)</div>
            <div class="agent-description">Unresolved causes flagged by AI for deeper analysis</div>
          </div>
        </div>
        
        <div class="connector visible">${ARROW_SVG}</div>
        
        <div class="agent-row visible" style="background:linear-gradient(135deg,#fdf2f8,#fce7f3);border-color:#fbcfe8;margin-top:16px">
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
        <div class="slide-nav-buttons"><button class="prev-slide-btn">? Previous</button><button class="next-slide-btn">Next ?</button></div></div>
    </div>

    <!-- SECTION 7: HUMAN CHECKPOINT 2 -->
    <div class="workflow-section">
      <div style="width:100%">
        <div class="slide-header">
          <div class="slide-icon color-purple">👤</div>
          <div class="slide-info">
            <div class="slide-tag" style="color:#7c3aed">Checkpoint 2</div>
            <div class="slide-title">Human-in-the-Loop Review</div>
          </div>
        </div>
        <div class="card">
          <div class="human-review-box visible">
            <div class="human-avatar">👤</div>
            <div class="human-name">Human Reviewer</div>
            <div class="human-description">Root Cause Analysis output under human review.<br>Verifying identified root causes and evidence<br>before proceeding to Action Planning.</div>
          </div>
        </div>
        <div class="slide-nav-buttons"><button class="prev-slide-btn">? Previous</button><button class="next-slide-btn">Next ?</button></div></div>
    </div>

    <!-- SECTION 8: A15 ACTION PLANNER -->
    <div class="workflow-section">
      <div style="width:100%">
        <div class="slide-header">
          <div class="slide-icon color-green">📋</div>
          <div class="slide-info">
            <div class="slide-tag" style="color:#16a34a">Action Planning</div>
            <div class="slide-title">A15 · Action Planner Agent</div>
          </div>
        </div>
        <div class="card">
          <div class="agent-row visible completed">
            <div class="agent-badge color-green">A15</div>
            <div class="agent-info">
              <div class="agent-label" style="color:#16a34a">Action Planner Agent</div>
              <div class="agent-name">Action Planner Agent</div>
              <div class="agent-description">Creates corrective and preventive action plans based on root causes</div>
              <div class="agent-tags">QMS</div>
            </div>
            <div class="agent-status completed">✓</div>
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
        <div class="slide-nav-buttons"><button class="prev-slide-btn">? Previous</button><button class="next-slide-btn">Next ?</button></div></div>
    </div>

    <!-- SECTION 9: A16 EFFECTIVENESS -->
    <div class="workflow-section">
      <div style="width:100%">
        <div class="slide-header">
          <div class="slide-icon color-green">✓</div>
          <div class="slide-info">
            <div class="slide-tag" style="color:#16a34a">Effectiveness Validation</div>
            <div class="slide-title">A16 · Effectiveness Agent</div>
          </div>
        </div>
        <div class="card">
          <div class="agent-row visible completed">
            <div class="agent-badge color-green">A16</div>
            <div class="agent-info">
              <div class="agent-label" style="color:#16a34a">Effectiveness Agent</div>
              <div class="agent-name">Effectiveness Agent</div>
              <div class="agent-description">Validates and monitors the effectiveness of implemented actions</div>
              <div class="agent-tags">QMS · ERP</div>
            </div>
            <div class="agent-status completed">✓</div>
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
      <button class="prev-slide-btn">? Previous</button><button class="next-slide-btn">Next ?</button></div>
    </div>

    <!-- SECTION 10: WORKFLOW COMPLETE -->
    <div class="workflow-section">
      <div style="text-align:center">
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
        <div class="slide-nav-buttons"><button class="prev-slide-btn">← Previous</button></div>
      </div>
    </div>
  `;
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initializeStepDots();
  
  const runBtn = $('runBtn');
  if (runBtn) runBtn.addEventListener('click', startWorkflow);
  
  console.log('✓ CAPA Workflow Application Initialized (Scroll-Only Mode)');
});

// Export for global access
window.CAPAWorkflow = {
  start: startWorkflow,
  state: STATE,
  config: CONFIG
};
