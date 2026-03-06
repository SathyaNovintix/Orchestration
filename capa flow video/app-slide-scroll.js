/**
 * CAPA WORKFLOW - SLIDE-BY-SLIDE SCROLL VERSION
 * One section at a time, scroll to reveal next
 */

'use strict';

// Configuration
const CONFIG = {
  TOTAL_SLIDES: 12
};

// State
const STATE = {
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

// Navigate to specific slide
const goToSlide = (index) => {
  if (index < 0 || index >= CONFIG.TOTAL_SLIDES) return;
  
  const showcase = $('showcase');
  if (!showcase) return;
  
  const sections = showcase.querySelectorAll('.workflow-section');
  if (sections[index]) {
    sections[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
    updateStepDots(index);
  }
};

// Handle scroll events
const handleScroll = () => {
  const showcase = $('showcase');
  if (!showcase) return;
  
  const sections = showcase.querySelectorAll('.workflow-section');
  const scrollTop = showcase.scrollTop;
  
  let currentIndex = 0;
  sections.forEach((section, index) => {
    const sectionTop = section.offsetTop;
    if (scrollTop >= sectionTop - 100) {
      currentIndex = index;
    }
  });
  
  if (currentIndex !== STATE.currentSlide) {
    updateStepDots(currentIndex);
  }
};

// Main Workflow - Show all content
const startWorkflow = () => {
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

  renderAllContent();
  
  if (showcase) {
    showcase.addEventListener('scroll', handleScroll);
    // Scroll to top
    showcase.scrollTop = 0;
  }
  
  updateStepDots(0);
  
  if (runBtn) {
    runBtn.disabled = false;
    runBtn.innerHTML = '↻ Restart';
    runBtn.onclick = () => goToSlide(0);
  }
};

// Render all slides
const renderAllContent = () => {
  const container = $('slideContainer');
  if (!container) return;
  
  container.innerHTML = `
