const STORAGE_KEY = 'beyond-earth.learning-expedition.v1';
let instanceCount = 0;

const stages = [
  {
    number: '01', date: 'FOUNDATIONS', title: 'Make the mathematics tangible.',
    label: 'FOUNDATIONS', summary: 'Turn algebra, graphs, angles, and units into tools for understanding a machine.',
    study: 'Begin at the level established by placement and prior work. A typical conceptual route is algebra, trigonometry and precalculus, then calculus. Course names and prerequisites differ by college.',
    courses: ['Algebra & functions', 'Trigonometry', 'Units & estimation'],
    build: 'Sketch a hand-operated hinge. Measure its lever arm and predict how moving the handle changes the force needed for the same turning effect.',
    gate: 'Obtain your records, establish mathematics placement, and have an adviser verify the next course and its prerequisites.',
    chapter: 23, chapterTitle: 'The mathematics inside the machine'
  },
  {
    number: '02', date: 'PREPARATION', title: 'Build a base that transfers.',
    label: 'PREPARATION', summary: 'Connect calculus, physics, chemistry, and programming through one coherent prerequisite plan.',
    study: 'The book’s October 2026 UCSD aerospace snapshot lists MATH 18; MATH 20A, 20B, 20C, 20D; CHEM 6A; and PHYS 2A, 2B, 2C, 2CL as minimum major preparation. MAE 8 is recommended. These are UCSD course identifiers, not automatic community-college equivalents.',
    courses: ['Calculus sequence', 'Linear algebra & differential equations', 'Calculus-based physics', 'Chemistry & programming'],
    build: 'Give the hinge study a free-body diagram, a prediction, repeated measurements, and an explanation of disagreement between the model and observations.',
    gate: 'Check ASSIST for the sending college, receiving university, major, and academic year. Verify the application-year requirements, course offerings, and general-education plan with an adviser.',
    chapter: 24, chapterTitle: 'A route to aerospace that survives real life'
  },
  {
    number: '03', date: 'TRANSFER', title: 'Cross the transfer gate.',
    label: 'A DECISION, NOT A GUARANTEE', summary: 'Compare actual admission options, remaining requirements, cost, and the time needed to finish.',
    study: 'Transfer timing depends on admission, completed preparation, course availability, and a sustainable workload. Keep aerospace and relevant mechanical-engineering routes in the comparison.',
    courses: ['Verified articulation', 'Remaining-degree audit', 'Term-by-term plan'],
    build: 'Package one small investigation so another person can understand the question, reproduce the measurements, and see why the design changed.',
    gate: 'Before committing to a destination, request a written review of remaining requirements and prerequisite bottlenecks. Do not infer a two-year finish from the word “transfer.”',
    chapter: 24, chapterTitle: 'Transfer plans, dependencies, and alternatives'
  },
  {
    number: '04', date: 'UPPER-DIVISION STUDY', title: 'Learn to connect the systems.',
    label: 'AEROSPACE DEPTH', summary: 'Bring structures, fluids, thermal systems, dynamics, controls, and design into the same engineering decision.',
    study: 'At the book’s research date, UCSD publishes a three-year aerospace transfer plan. The actual time to completion depends on an individual audit. One published dependency chain is MAE 143A → MAE 143B → MAE 142; future offerings must be checked.',
    courses: ['Structures & materials', 'Fluids & thermodynamics', 'Dynamics & controls', 'Engineering design'],
    build: 'Revisit the same mechanism with better models and measurement. Join a team where design reviews, manufacturing constraints, and test results influence the next revision.',
    gate: 'Confirm the actual offering pattern and prerequisites each term. Treat a shorter completion date as something to demonstrate with an approved plan.',
    chapter: 25, chapterTitle: 'A small machine, a serious idea'
  },
  {
    number: '05', date: 'After the bachelor’s', title: 'Choose the next useful problem.',
    label: 'PRACTICE & DEPTH', summary: 'Let the work you want to do guide the choice between industry, a focused master’s, and research.',
    study: 'A degree is a way to acquire particular abilities. Engineering practice builds judgment under real constraints; a master’s can deepen a defined specialty; doctoral research develops an original contribution. None is an automatic next rung.',
    courses: ['Reviewed engineering work', 'Focused technical study', 'Research apprenticeship'],
    build: 'Use project evidence and experience to name a problem you want to understand more deeply: a mechanism, a control system, a thermal interface, a manufacturing process, or a human task.',
    gate: 'Compare the actual work, mentoring, funding or cost, and time commitment. Recheck current program rules and any written offer before deciding.',
    chapter: 27, chapterTitle: 'What another degree is for'
  }
];

const projects = [
  {
    number: '01', kind: 'MECHANISMS', title: 'The hinge torque study',
    question: 'How does handle position change the force required to turn a hinge?',
    graphic: 'hinge',
    setup: 'Use a small, hand-operated, low-force tabletop model. Compare two lever-arm lengths at the same configuration, and keep the load and measurement method consistent.',
    evidence: 'A dimensioned sketch, a free-body diagram, predicted torque, repeated readings, and one justified geometry revision.',
    next: 'Add angular position measurements, then investigate friction or repeatability when the necessary coursework and equipment are available.',
    boundary: 'An educational mechanism study; no powered or flight-qualified hardware is implied.'
  },
  {
    number: '02', kind: 'DESIGN FOR MAINTENANCE', title: 'The service-bay mockup',
    question: 'Can a component be removed without blocking the passage or disturbing its neighbors?',
    graphic: 'bay',
    setup: 'Build a cardboard cabinet and removable block. Compare two access directions, using the same removal task and a clearly marked space for hands and tools.',
    evidence: 'A removal sequence, clearance measurements, observed contacts, timed trials, and photographs of the revised layout.',
    next: 'Compare what a scale model misses. Add representative mass or a larger mockup only when that change is safe and necessary to answer the question.',
    boundary: 'A study of access and task design; a scale model does not validate a real habitat workspace.'
  },
  {
    number: '03', kind: 'ROBOTICS & MEASUREMENT', title: 'The interface witness',
    question: 'Can a simple indicator distinguish complete insertion from a near miss?',
    graphic: 'interface',
    setup: 'Create a harmless, hand-operated insertion model. First test a visible witness mark or mechanical guide; add a low-energy sensor only if it answers a specific measurement question.',
    evidence: 'A definition of success, examples of partial insertion and misalignment, a results table, and an explanation of false indications.',
    next: 'After learning signals and controls, compare the measured state with the intended state and test whether a better guide reduces ambiguity.',
    boundary: 'A tabletop investigation of recognition and alignment; it does not establish safety-critical reliability.'
  }
];

const routes = [
  {
    id: 'practice', label: 'Engineering practice', short: 'WORK', title: 'Learn where the hardware meets reality.',
    intro: 'A first engineering role can turn classroom models into judgment about drawings, tests, manufacturing, interfaces, and decisions made with incomplete information.',
    fit: 'You want hands-on experience, stronger technical judgment, or a clearer view of which specialty deserves deeper study.',
    evidence: 'Look for bounded engineering responsibility, useful reviews, access to experienced colleagues, and a chance to follow work through testing or production.',
    question: 'Who will review my work, and what will I be able to explain or deliver after a year?',
    caveat: 'Job titles alone do not reveal mentoring, technical depth, or day-to-day work.',
    chapter: 26, link: 'Explore useful work across different futures',
    tags: ['Practice under constraints', 'Mentoring', 'Build a specialty']
  },
  {
    id: 'masters', label: 'Focused master’s', short: 'MS / MENG', title: 'Go deeper for a reason you can name.',
    intro: 'A master’s can address a defined technical gap. Coursework, professional projects, comprehensive exams, and thesis research offer different experiences; the degree label does not settle which one a program provides.',
    fit: 'You can identify the methods or research experience you need, and connect them to a problem you want to work on.',
    evidence: 'Compare actual courses, project or thesis access, supervision, degree requirements, total cost, and the terms of any funding.',
    question: 'What will this particular program let me do that I cannot yet do well?',
    caveat: 'A coursework master’s does not automatically provide a research apprenticeship. Check the exact pathway.',
    chapter: 27, link: 'Compare what another degree is actually for',
    tags: ['Advanced methods', 'Coursework or thesis', 'A bounded investment']
  },
  {
    id: 'doctorate', label: 'Research doctorate', short: 'PHD', title: 'Stay with a question that has no settled answer.',
    intro: 'Doctoral work develops an original contribution through sustained research. The central choice is a research problem and an advising environment, supported by a workable funding arrangement.',
    fit: 'You enjoy investigating uncertain questions, testing explanations, and revising a method over a long period—not only taking advanced classes.',
    evidence: 'Read recent work from the prospective group. Investigate adviser availability, research fit, supervision, funding terms, and what students actually do.',
    question: 'Would I still want to investigate this problem when progress becomes slow and the first approach fails?',
    caveat: 'A PhD is one route to particular kinds of work. It is not required for every ambitious engineering contribution.',
    chapter: 29, link: 'Compare laboratories and programs with purpose',
    tags: ['Original research', 'Adviser fit', 'Sustained investigation']
  }
];

const checklist = [
  { id: 'records', title: 'Collect the starting evidence', detail: 'Gather prior coursework, placement results, and the requirements you already have in writing.' },
  { id: 'readiness', title: 'Check mathematics readiness', detail: 'Work a few algebra and trigonometry problems; record which ideas need practice.' },
  { id: 'adviser', title: 'Map the next prerequisite', detail: 'Ask an adviser to verify the next mathematics course and a realistic sequence after it.' },
  { id: 'assist', title: 'Verify one transfer agreement', detail: 'Match the sending college, destination, major, and academic year in ASSIST.' },
  { id: 'bottleneck', title: 'Find a scheduling bottleneck', detail: 'Identify one required course whose prerequisites or offering pattern could affect the plan.' },
  { id: 'sketch', title: 'Draw a small mechanism', detail: 'Choose a harmless passive model, label its dimensions, and write one testable question.' },
  { id: 'evidence', title: 'Make a repeatable record', detail: 'Record a prediction and repeated observations, then explain one change you would make.' },
  { id: 'compare', title: 'Compare two next steps', detail: 'Use one real job description and one graduate pathway to compare work, mentoring, and cost.' }
];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function arrow() {
  return '<svg class="road-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
}

function projectDrawing(kind) {
  const drawings = {
    hinge: '<path class="road-diagram-line" d="M48 114h114M66 114V53m0 38 103-45"/><circle class="road-diagram-solid" cx="66" cy="91" r="8"/><path class="road-diagram-accent" d="m169 30 0 39m-7-8 7 8 7-8M91 94a25 25 0 0 0-2-13"/><path class="road-diagram-faint" d="M77 104h92m0-26v31"/><circle class="road-diagram-mint" cx="169" cy="46" r="6"/>',
    bay: '<path class="road-diagram-line" d="M48 34h142v88H48zM48 65h142M94 34v88"/><path class="road-diagram-faint" d="M111 81h59v25h-59z"/><path class="road-diagram-mint" d="M111 89h59v25h-59z"/><path class="road-diagram-accent" d="M141 108v31m-7-8 7 8 7-8"/><path class="road-diagram-line" d="M64 47h14m36 0h51"/>',
    interface: '<path class="road-diagram-line" d="M44 48h53v64H44zM153 43h43v74h-43M153 63h-22v34h22"/><path class="road-diagram-mint" d="M97 68h38v24H97z"/><path class="road-diagram-accent" d="M157 32h17m-8-8 8 8-8 8M114 114v14"/><path class="road-diagram-faint" d="M29 80h17m147 0h18M126 49v63"/><circle class="road-diagram-solid" cx="174" cy="80" r="5"/>'
  };
  return `<svg class="road-project-drawing" viewBox="0 0 240 160" aria-hidden="true">${drawings[kind]}</svg>`;
}

function renderStage(stage, index) {
  return `<details class="road-stage" ${index === 0 ? 'open' : ''}>
    <summary class="road-stage-summary">
      <span class="road-stage-number">${stage.number}</span>
      <span class="road-stage-heading"><span class="road-stage-date">${stage.date}</span><span class="road-stage-title">${stage.title}</span><span class="road-stage-teaser">${stage.summary}</span></span>
      <span class="road-expand" aria-hidden="true"></span>
    </summary>
    <div class="road-stage-content"><span class="road-eyebrow">${stage.label}</span><p class="road-stage-study">${stage.study}</p>
      <ul class="road-pills" aria-label="Learning areas">${stage.courses.map(course => `<li>${course}</li>`).join('')}</ul>
      <div class="road-stage-pair"><div><h4>Make it concrete</h4><p>${stage.build}</p></div><div class="road-verification"><h4><span aria-hidden="true">↗</span> Before moving ahead</h4><p>${stage.gate}</p></div></div>
      <a class="road-text-link" href="#read/${stage.chapter}">Chapter ${stage.chapter} · ${stage.chapterTitle}${arrow()}</a>
    </div></details>`;
}

function renderProject(project) {
  return `<article class="road-project">
    <div class="road-project-top"><span class="road-project-number">STUDY / ${project.number}</span><span class="road-eyebrow">${project.kind}</span></div>
    ${projectDrawing(project.graphic)}<h3>${project.title}</h3><p class="road-project-question">${project.question}</p>
    <details class="road-project-details"><summary>Open the build brief<span class="road-expand" aria-hidden="true"></span></summary>
      <div class="road-project-brief"><h4>Start small</h4><p>${project.setup}</p><h4>Keep the evidence</h4><p>${project.evidence}</p><h4>Add depth later</h4><p>${project.next}</p><p class="road-project-boundary">${project.boundary}</p></div>
    </details></article>`;
}

function renderRoute(route) {
  return `<div class="road-route-intro"><span class="road-eyebrow">${route.short}</span><h3>${route.title}</h3><p>${route.intro}</p><ul class="road-pills" aria-label="Pathway characteristics">${route.tags.map(tag => `<li>${tag}</li>`).join('')}</ul></div>
    <div class="road-route-details"><div><h4>Consider it when</h4><p>${route.fit}</p></div><div><h4>Look for evidence</h4><p>${route.evidence}</p></div><div class="road-route-question"><h4>One useful question</h4><p>${route.question}</p></div><p class="road-route-caveat">${route.caveat}</p><a class="road-text-link" href="#read/${route.chapter}">${route.link}${arrow()}</a></div>`;
}

export function mountRoadmap(container) {
  if (!container || typeof container.replaceChildren !== 'function') {
    throw new TypeError('mountRoadmap requires a DOM container.');
  }
  const uid = `road-${++instanceCount}`;
  const validIds = new Set(checklist.map(item => item.id));
  let checked = new Set();
  let storageAvailable = true;
  let selectedRoute = 0;
  let disposed = false;
  const listeners = [];

  function readProgress(raw) {
    const parsed = JSON.parse(raw || 'null');
    return new Set(parsed && parsed.version === 1 && Array.isArray(parsed.checked)
      ? parsed.checked.filter(id => typeof id === 'string' && validIds.has(id)) : []);
  }

  try { checked = readProgress(window.localStorage.getItem(STORAGE_KEY)); }
  catch { storageAvailable = false; }

  const root = document.createElement('section');
  root.className = 'road-expedition';
  root.setAttribute('aria-labelledby', `${uid}-title`);
  root.innerHTML = `
    <header class="road-hero">
      <div class="road-hero-copy"><p class="road-eyebrow"><span class="road-status-dot" aria-hidden="true"></span> A LEARNING EXPEDITION</p><h1 id="${uid}-title">A future you can<br><em>start building.</em></h1><p class="road-hero-description">Follow the mathematics into a mechanism. Follow the mechanism into a system. Build the skills to help make somewhere to live.</p>
        <nav class="road-local-nav" aria-label="Learning expedition sections"><a href="#${uid}-timeline">The route <span aria-hidden="true">↓</span></a><a href="#${uid}-projects">Build studies <span aria-hidden="true">↓</span></a><a href="#${uid}-checklist">Your next steps <span aria-hidden="true">↓</span></a></nav>
      </div>
      <aside class="road-scenario" aria-label="Planning scenario"><div class="road-scenario-top"><span class="road-eyebrow">ONE POSSIBLE ROUTE</span><span class="road-scenario-orbit" aria-hidden="true">↗</span></div><div class="road-scenario-years"><div><strong>01</strong><span>foundations</span></div><span class="road-year-connector" aria-hidden="true"></span><div><strong>02</strong><span>transfer preparation</span></div><span class="road-year-connector" aria-hidden="true"></span><div><strong>03</strong><span>degree requirements</span></div></div><p>A planning model, not an admissions guarantee or an individual degree audit. Placement, completed prerequisites, admission, and course availability set the actual pace.</p><p class="road-snapshot">Academic information: book snapshot, October 2026.</p></aside>
    </header>

    <section class="road-timeline-section" id="${uid}-timeline" aria-labelledby="${uid}-timeline-title"><div class="road-section-heading"><div><p class="road-eyebrow">01 / THE ROUTE</p><h2 id="${uid}-timeline-title">Earn the next capability.</h2><p>Each stage has something to learn, something to make, and something to verify.</p></div><button class="road-button road-expand-all" type="button">Open all stages</button></div><div class="road-timeline">${stages.map(renderStage).join('')}</div><div class="road-source-note"><span aria-hidden="true">↗</span><p>Before choosing courses, verify the current plan with <a href="https://assist.org/" target="_blank" rel="noopener noreferrer">ASSIST<span class="road-sr-only"> (opens in a new tab)</span></a>, the destination department, and an adviser. <a href="#read/24">Chapter 24</a> explains the transfer assumptions and their limits.</p></div></section>

    <section class="road-project-section" id="${uid}-projects" aria-labelledby="${uid}-projects-title"><div class="road-section-heading"><div><p class="road-eyebrow">02 / THE BUILD STUDIES</p><h2 id="${uid}-projects-title">Small enough to finish.<br>Deep enough to teach.</h2><p>A useful project has a question, a prediction, evidence, and a revision. Complexity can come later.</p></div><a class="road-text-link" href="#read/25">Read the portfolio chapter${arrow()}</a></div><div class="road-project-grid">${projects.map(renderProject).join('')}</div><div class="road-evidence-strip"><span class="road-eyebrow">KEEP THE CHAIN VISIBLE</span><ol><li>Question</li><li>Prediction</li><li>Measurement</li><li>Revision</li><li>Explanation</li></ol></div></section>

    <section class="road-choice-section" aria-labelledby="${uid}-choice-title"><div class="road-section-heading"><div><p class="road-eyebrow">03 / AFTER THE DEGREE</p><h2 id="${uid}-choice-title">Choose the work.<br>Then choose the path.</h2><p>Compare what each route develops. Prestige alone cannot answer this decision.</p></div></div><div class="road-tabs" role="tablist" aria-label="Compare paths after a bachelor’s degree">${routes.map((route, index) => `<button type="button" role="tab" class="road-tab" id="${uid}-tab-${route.id}" aria-selected="${index === 0}" aria-controls="${uid}-route-panel" tabindex="${index === 0 ? 0 : -1}" data-road-route="${index}"><span class="road-tab-number">0${index + 1}</span>${route.label}<span aria-hidden="true">↗</span></button>`).join('')}</div><div class="road-route-panel" role="tabpanel" id="${uid}-route-panel" aria-labelledby="${uid}-tab-practice" tabindex="0">${renderRoute(routes[0])}</div><p class="road-choice-footnote">These are decision lenses, not rankings or current admissions advice. <a href="#read/28">Explore specialties in Chapter 28</a> and <a href="#read/30">build a workable decision in Chapter 30</a>.</p></section>

    <section class="road-checklist-section" id="${uid}-checklist" aria-labelledby="${uid}-checklist-title"><div class="road-checklist-intro"><p class="road-eyebrow">04 / THE NEXT REAL STEP</p><h2 id="${uid}-checklist-title">Make the unknowns<br><em>smaller.</em></h2><p>Eight useful actions to turn a distant ambition into evidence you can work with. Check them when you have done them.</p><div class="road-progress-summary"><strong class="road-progress-count">0<span> / 8</span></strong><span>actions checked</span></div><div class="road-progress-track" role="progressbar" aria-label="Planning actions checked" aria-valuemin="0" aria-valuemax="8" aria-valuenow="0"><span class="road-progress-fill"></span></div><p class="road-storage-note"></p><button type="button" class="road-reset">Clear checklist</button><p class="road-sr-only road-progress-live" role="status" aria-live="polite" aria-atomic="true"></p></div><div class="road-checklist-items">${checklist.map((item, index) => `<label class="road-check-item" for="${uid}-check-${item.id}"><input type="checkbox" id="${uid}-check-${item.id}" data-road-check="${item.id}"><span class="road-check-box" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="m4 10 4 4 8-8"/></svg></span><span class="road-check-copy"><span class="road-check-title"><span class="road-check-index">0${index + 1}</span>${escapeHtml(item.title)}</span><span class="road-check-detail">${escapeHtml(item.detail)}</span></span></label>`).join('')}</div></section>
    <footer class="road-closing"><p>The destination is large.<br><em>The next experiment can be small.</em></p><a class="road-button road-button-dark" href="#read/23">Begin with the foundations${arrow()}</a></footer>`;
  container.replaceChildren(root);

  const tabs = [...root.querySelectorAll('[data-road-route]')];
  const panel = root.querySelector('.road-route-panel');
  const inputs = [...root.querySelectorAll('[data-road-check]')];
  const timeline = [...root.querySelectorAll('.road-stage')];
  const expandButton = root.querySelector('.road-expand-all');
  const resetButton = root.querySelector('.road-reset');
  const live = root.querySelector('.road-progress-live');

  function listen(target, event, handler) {
    target.addEventListener(event, handler);
    listeners.push(() => target.removeEventListener(event, handler));
  }

  function updateProgress(announcement = '') {
    inputs.forEach(input => {
      input.checked = checked.has(input.dataset.roadCheck);
      input.closest('.road-check-item').classList.toggle('road-is-checked', input.checked);
    });
    const count = checked.size;
    root.querySelector('.road-progress-count').innerHTML = `${count}<span> / ${checklist.length}</span>`;
    root.querySelector('.road-progress-track').setAttribute('aria-valuenow', String(count));
    root.querySelector('.road-progress-track').setAttribute('aria-valuetext', `${count} of ${checklist.length} planning actions checked`);
    root.querySelector('.road-progress-fill').style.width = `${count / checklist.length * 100}%`;
    root.querySelector('.road-storage-note').textContent = storageAvailable
      ? 'Saved only in this browser. No account, submission, or credential is created.'
      : 'Browser storage is unavailable. Progress stays here until you leave or reload this page.';
    resetButton.disabled = count === 0;
    if (announcement) live.textContent = `${announcement} ${count} of ${checklist.length} actions checked.`;
  }

  function saveProgress() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, checked: [...checked] }));
      storageAvailable = true;
    } catch { storageAvailable = false; }
  }

  function chooseRoute(index, moveFocus = false) {
    selectedRoute = index;
    tabs.forEach((tab, tabIndex) => {
      tab.setAttribute('aria-selected', String(tabIndex === selectedRoute));
      tab.tabIndex = tabIndex === selectedRoute ? 0 : -1;
    });
    panel.innerHTML = renderRoute(routes[index]);
    panel.setAttribute('aria-labelledby', `${uid}-tab-${routes[index].id}`);
    if (moveFocus) tabs[index].focus();
  }

  tabs.forEach((tab, index) => {
    listen(tab, 'click', () => chooseRoute(index));
    listen(tab, 'keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (selectedRoute + 1) % routes.length;
      if (event.key === 'ArrowLeft') next = (selectedRoute + routes.length - 1) % routes.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = routes.length - 1;
      if (next !== undefined) { event.preventDefault(); chooseRoute(next, true); }
    });
  });

  inputs.forEach(input => listen(input, 'change', () => {
    if (input.checked) checked.add(input.dataset.roadCheck);
    else checked.delete(input.dataset.roadCheck);
    saveProgress();
    updateProgress('Progress updated.');
  }));

  listen(resetButton, 'click', () => {
    checked.clear();
    saveProgress();
    updateProgress('Checklist cleared.');
    inputs[0].focus();
  });

  function updateExpandButton() {
    if (!disposed) expandButton.textContent = timeline.every(stage => stage.open) ? 'Close all stages' : 'Open all stages';
  }
  timeline.forEach(stage => listen(stage, 'toggle', updateExpandButton));
  listen(expandButton, 'click', () => {
    const open = !timeline.every(stage => stage.open);
    timeline.forEach(stage => { stage.open = open; });
    updateExpandButton();
  });

  // Scroll within this component without changing the book reader's hash route.
  root.querySelectorAll('.road-local-nav a').forEach(anchor => listen(anchor, 'click', event => {
    const target = root.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    const heading = target.querySelector('h2');
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }));

  listen(window, 'storage', event => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    try {
      checked = readProgress(event.key === null ? null : event.newValue);
      updateProgress('Progress updated from this browser.');
    } catch { /* Ignore malformed data from another tab; retain usable local state. */ }
  });

  updateProgress();
  return () => { disposed = true; listeners.forEach(remove => remove()); };
}
