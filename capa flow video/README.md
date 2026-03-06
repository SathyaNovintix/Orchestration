# CAPA Workflow - Multi-Agent Orchestration

Professional visualization of CAPA (Corrective and Preventive Action) workflow with multi-agent orchestration system.

## Features

- 🎯 12-step workflow visualization
- 🔄 5 orchestrators (O1-O5) coordinating 16 specialized agents (A1-A16)
- 📊 Interactive scroll-based navigation
- 👤 Human-in-the-loop checkpoints
- 🎨 Professional gradient design with smooth animations

## Navigation

- **Scroll Down**: Move to next slide
- **Scroll Up**: Move to previous slide
- Click "Run Simulation" to start

## Workflow Steps

1. Quality Complaint Received
2. O1 - CAPA Director Agent
3. O2 - Risk Analysis (with A1-A7 agents)
4. Human Checkpoint 1
5. O3 - RCA Orchestrator
6. O4 - Why Analysis (with A8-A13 agents)
7. O5 - Fishbone Analysis (with A9, A10, A14 agents)
8. Human Checkpoint 2
9. A15 - Action Planner
10. A16 - Effectiveness Agent
11. Workflow Summary
12. Workflow Complete

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

### Render

1. Create a new Static Site
2. Connect your repository
3. Build command: (leave empty)
4. Publish directory: `.`

## Local Development

Open `index.html` in your browser or run:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`

## Technologies

- Pure HTML5, CSS3, JavaScript (ES6+)
- No frameworks or dependencies
- Responsive design
- Modern gradient aesthetics
