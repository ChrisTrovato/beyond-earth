/* MERIDIAN field laboratory. Independent ES module; no dependencies. */
export function calculateEnergy({ power = 30, hours = 72, usable = 80, efficiency = 90 } = {}) {
  const delivered = power * hours;
  return { delivered, nameplate: delivered / (usable / 100 * efficiency / 100), daily: power * 24 };
}

export function calculateWater({ people = 12, stream = 20, recovery = 90 } = {}) {
  const processed = people * stream;
  const recovered = processed * recovery / 100;
  const makeup = processed - recovered;
  return { processed, recovered, makeup, logistics: makeup * 180 };
}

export function calculateCooling({ load = 100, capacity = 60, isolated = true } = {}) {
  const installed = capacity * 2;
  const available = capacity * (isolated ? 1 : 2);
  return { installed, available, margin: available - load, shed: Math.max(0, load - available) };
}

const BASELINES = {
  energy: { power: 30, hours: 72, usable: 80, efficiency: 90 },
  water: { people: 12, stream: 20, recovery: 90 },
  cooling: { load: 100, capacity: 60, isolated: true },
};

const EXPERIMENTS = {
  energy: {
    number: '01', title: 'Keep the lights on', short: 'Energy reserve',
    question: 'How much storage gets you through the interruption?',
    description: 'Power is a rate. Energy is a promise over time. Change the demand and interruption to see what the storage system must carry.',
    controls: [
      ['power', 'Reduced electrical demand', 10, 100, 5, 'kW', 'Book baseline: 30 kW. Normal average demand is 60 kW.'],
      ['hours', 'Interruption duration', 6, 168, 6, 'h', 'Book baseline: 72 hours. This is a contingency window.'],
      ['usable', 'Usable storage fraction', 50, 100, 1, '%', 'The fraction of nameplate capacity available to the scenario.'],
      ['efficiency', 'Discharge efficiency', 60, 100, 1, '%', 'Energy delivered to the load divided by energy withdrawn.'],
    ],
    link: '#read/10', chapter: '10', assumption: 'Constant demand; no charging during the interruption; fixed usable fraction and discharge efficiency. Power rating, degradation, temperature, redundancy, and reserve policy remain outside this model.',
    takeaway: 'The 72-hour case does not cover an entire lunar night. Solar nameplate power alone cannot establish continuous service at an unresolved polar site.',
  },
  water: {
    number: '02', title: 'Close part of the loop', short: 'Water recovery',
    question: 'What does a high recovery rate still leave to import?',
    description: 'Follow one defined process stream from use to recovery. A small daily gap becomes a substantial logistics commitment over six months.',
    controls: [
      ['people', 'Residents', 1, 48, 1, 'people', 'Book baseline: 12 adults in the initial M1 case.'],
      ['stream', 'Selected water stream per person', 5, 60, 1, 'kg/day', 'Book baseline: 20 kg per person per day.'],
      ['recovery', 'Process recovery', 0, 99, 1, '%', 'Book baseline: 90% recovery in this selected stream.'],
    ],
    link: '#read/8', chapter: '08', assumption: 'A steady selected process stream. Additional leaks, maintenance losses, rejected batches, storage changes, and other water uses are excluded. Recovery equipment still requires energy and maintenance.',
    takeaway: 'Recovered water and imported makeup are different quantities. A 90% recovery figure is not a claim that the whole settlement is 90% closed.',
  },
  cooling: {
    number: '03', title: 'Lose a cooling branch', short: 'Cooling capacity',
    question: 'Can you take one branch out of service?',
    description: 'Two cooling branches can support the normal example load together. Isolating one exposes a limit that the word “redundant” can hide.',
    controls: [
      ['load', 'Waste-heat load', 20, 200, 5, 'kW', 'Book baseline: a 100 kW waste-heat example.'],
      ['capacity', 'Capacity of each branch', 20, 120, 5, 'kW', 'Book baseline: 60 kW per branch at an assumed design condition.'],
    ],
    link: '#read/19', chapter: '19', assumption: 'Two equal, independently isolatable branches at their assumed design condition. Capacity is treated as fixed. Transients, thermal storage, real radiator conditions, and qualified operating limits are excluded.',
    takeaway: 'In the book case, demand must fall to 60 kW or below before one branch is isolated. Having a replacement pump does not create spare heat-rejection capacity.',
  },
};

const number = (value, decimals = 0) => new Intl.NumberFormat('en-US', {
  maximumFractionDigits: decimals, minimumFractionDigits: 0,
}).format(value);

function sliderMarkup(id, control, value) {
  const [key, label, min, max, step, unit, help] = control;
  return `<div class="lab-control">
    <div class="lab-control-heading"><label for="${id}-${key}">${label}</label><output for="${id}-${key}" data-output="${key}">${number(value)} <span>${unit}</span></output></div>
    <input id="${id}-${key}" name="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" aria-describedby="${id}-${key}-help" aria-valuetext="${number(value)} ${unit}" style="--lab-range:${(value - min) / (max - min) * 100}%">
    <div class="lab-range-ends" aria-hidden="true"><span>${number(min)} ${unit}</span><span>${number(max)} ${unit}</span></div>
    <p id="${id}-${key}-help" class="lab-control-help">${help}</p>
  </div>`;
}

function stat(label, value, unit, note = '') {
  return `<div class="lab-stat"><span class="lab-stat-label">${label}</span><strong>${value}<small>${unit}</small></strong>${note ? `<span class="lab-stat-note">${note}</span>` : ''}</div>`;
}

function svgFrame(content, label, description, height = 300) {
  return `<svg class="lab-svg" viewBox="0 0 640 ${height}" role="img" aria-label="${label}"><desc>${description}</desc>${content}</svg>`;
}

function energyChart(state, result) {
  const maxY = Math.ceil((state.power * 168 / (state.usable / 100 * state.efficiency / 100)) / 1000) * 1000;
  const x = h => 60 + h / 168 * 550;
  const y = value => 232 - value / maxY * 185;
  let grid = '';
  for (let i = 0; i <= 4; i++) {
    const value = maxY * i / 4;
    grid += `<line class="lab-gridline" x1="60" x2="610" y1="${y(value)}" y2="${y(value)}"/><text class="lab-axis" x="49" y="${y(value) + 4}" text-anchor="end">${number(value)}</text>`;
  }
  for (const h of [0, 24, 72, 120, 168]) grid += `<text class="lab-axis" x="${x(h)}" y="254" text-anchor="middle">${h}</text>`;
  const end = state.power * 168 / (state.usable / 100 * state.efficiency / 100);
  return svgFrame(`<text class="lab-svg-eyebrow" x="60" y="21">REQUIRED NAMEPLATE STORAGE · kWh</text>${grid}
    <path class="lab-area" d="M60,232 L610,${y(end)} L610,232 Z"/>
    <path class="lab-chartline" d="M60,232 L610,${y(end)}"/>
    <line class="lab-markerline" x1="${x(state.hours)}" x2="${x(state.hours)}" y1="${y(result.nameplate)}" y2="232"/>
    <circle class="lab-chartpoint" cx="${x(state.hours)}" cy="${y(result.nameplate)}" r="6"/>
    <text class="lab-point-label" x="${Math.min(550, Math.max(118, x(state.hours)))}" y="${Math.max(40, y(result.nameplate) - 15)}" text-anchor="middle">${number(result.nameplate)} kWh</text>
    <text class="lab-axis-title" x="335" y="283" text-anchor="middle">Interruption duration · hours</text>`,
  'Required storage rises with interruption duration', `At ${state.power} kilowatts, ${state.hours} hours requires ${number(result.nameplate)} kilowatt-hours of nameplate storage. The line shows durations from zero to 168 hours under the selected assumptions.`);
}

function waterDiagram(state, result) {
  return svgFrame(`<path class="lab-flow" d="M184,110 H249 M439,110 H502"/><path class="lab-arrow" d="M240,104 L249,110 L240,116 M493,104 L502,110 L493,116"/>
    <rect class="lab-node" x="18" y="66" width="166" height="90" rx="13"/><text class="lab-node-label" x="101" y="95" text-anchor="middle">Selected stream</text><text class="lab-node-value" x="101" y="129" text-anchor="middle">${number(result.processed)} kg/day</text>
    <rect class="lab-node lab-node-highlight" x="249" y="66" width="190" height="90" rx="13"/><text class="lab-node-label" x="344" y="95" text-anchor="middle">Recovery process</text><text class="lab-node-value" x="344" y="129" text-anchor="middle">${state.recovery}%</text>
    <rect class="lab-node lab-node-loss" x="502" y="66" width="120" height="90" rx="13"/><text class="lab-node-label" x="562" y="95" text-anchor="middle">Unrecovered</text><text class="lab-node-value lab-orange-text" x="562" y="126" text-anchor="middle">${number(result.makeup, 1)}</text><text class="lab-node-label" x="562" y="145" text-anchor="middle">kg/day</text>
    <path class="lab-flow" d="M344,156 V221 H101 V164"/><path class="lab-arrow" d="M95,173 L101,164 L107,173"/>
    <text class="lab-return-label" x="223" y="249" text-anchor="middle">${number(result.recovered, 1)} kg/day recovered</text><text class="lab-axis" x="223" y="271" text-anchor="middle">Returned to the selected process stream</text>`,
  'Water process balance', `${number(result.processed)} kilograms per day enters the selected stream. ${number(result.recovered, 1)} kilograms is recovered and ${number(result.makeup, 1)} kilograms must be replaced before additional losses.`, 300);
}

function coolingDiagram(state, result) {
  const max = Math.max(state.load, result.installed, 120);
  const w = value => value / max * 365;
  return svgFrame(`<path class="lab-flow" d="M150,107 H211 V63 H263 M211,107 V148 H263"/>
    <rect class="lab-node" x="18" y="68" width="132" height="79" rx="13"/><text class="lab-node-label" x="84" y="95" text-anchor="middle">Waste heat</text><text class="lab-node-value" x="84" y="126" text-anchor="middle">${number(state.load)} kW</text>
    <rect class="lab-node lab-node-highlight" x="263" y="30" width="187" height="66" rx="11"/><text class="lab-node-label" x="356" y="55" text-anchor="middle">BRANCH A · AVAILABLE</text><text class="lab-node-value" x="356" y="80" text-anchor="middle">${state.capacity} kW</text>
    <rect class="lab-node ${state.isolated ? 'lab-node-loss' : 'lab-node-highlight'}" x="263" y="116" width="187" height="66" rx="11"/><text class="lab-node-label" x="356" y="141" text-anchor="middle">BRANCH B · ${state.isolated ? 'ISOLATED' : 'AVAILABLE'}</text><text class="lab-node-value ${state.isolated ? 'lab-orange-text' : ''}" x="356" y="166" text-anchor="middle">${state.isolated ? '0' : state.capacity} kW</text>
    <text class="lab-axis" x="480" y="77">At assumed</text><text class="lab-axis" x="480" y="95">design condition</text>
    <text class="lab-bar-label" x="18" y="227">Heat load</text><rect class="lab-bar-track" x="163" y="213" width="365" height="17" rx="4"/><rect class="lab-bar-load" x="163" y="213" width="${w(state.load)}" height="17" rx="4"/><text class="lab-bar-value" x="544" y="227">${state.load} kW</text>
    <text class="lab-bar-label" x="18" y="268">Available capacity</text><rect class="lab-bar-track" x="163" y="254" width="365" height="17" rx="4"/><rect class="lab-bar-capacity" x="163" y="254" width="${w(result.available)}" height="17" rx="4"/><text class="lab-bar-value" x="544" y="268">${result.available} kW</text>`,
  'Cooling branch capacity comparison', `The heat load is ${state.load} kilowatts. ${state.isolated ? 'Branch B is isolated.' : 'Both branches are available.'} Available capacity is ${result.available} kilowatts. Required load reduction is ${result.shed} kilowatts.`, 300);
}

function resultMarkup(key, state) {
  if (key === 'energy') {
    const result = calculateEnergy(state);
    return `<div class="lab-result-heading"><span class="lab-eyebrow">The capacity requirement</span><div class="lab-big-number">${number(result.nameplate)}<span>kWh</span></div><p>Nameplate storage for this scenario</p></div>
      <div class="lab-stats">${stat('Delivered to the load', number(result.delivered), 'kWh')}${stat('Energy per day', number(result.daily), 'kWh/day')}</div>
      <div class="lab-chart">${energyChart(state, result)}</div>
      <div class="lab-equation"><span>Follow the arithmetic</span><p>E<sub>nameplate</sub> = P × t ÷ (u × η)</p><code>${state.power} × ${state.hours} ÷ (${(state.usable / 100).toFixed(2)} × ${(state.efficiency / 100).toFixed(2)}) = ${number(result.nameplate)} kWh</code></div>`;
  }
  if (key === 'water') {
    const result = calculateWater(state);
    return `<div class="lab-result-heading"><span class="lab-eyebrow">The daily gap</span><div class="lab-big-number">${number(result.makeup, 1)}<span>kg/day</span></div><p>Makeup water before additional losses</p></div>
      <div class="lab-stats">${stat('180-day planning interval', number(result.logistics), 'kg', 'Hypothetical six-month logistics horizon')}${stat('Recovered each day', number(result.recovered, 1), 'kg/day')}</div>
      <div class="lab-chart">${waterDiagram(state, result)}</div>
      <div class="lab-equation"><span>Follow the arithmetic</span><p>Makeup = residents × stream × (1 − recovery)</p><code>${state.people} × ${state.stream} × (1 − ${(state.recovery / 100).toFixed(2)}) = ${number(result.makeup, 1)} kg/day</code></div>`;
  }
  const result = calculateCooling(state);
  return `<div class="lab-result-heading ${result.shed ? 'lab-result-constrained' : ''}"><span class="lab-eyebrow">${result.shed ? 'A capacity constraint' : 'Capacity in this model'}</span><div class="lab-big-number">${number(result.shed)}<span>kW</span></div><p>Minimum heat-load reduction required</p></div>
    <div class="lab-stats">${stat('Available capacity', number(result.available), 'kW', state.isolated ? 'One branch remains available' : 'Two branches available')}${stat(result.margin < 0 ? 'Capacity shortfall' : 'Capacity margin', number(Math.abs(result.margin)), 'kW')}</div>
    <div class="lab-chart">${coolingDiagram(state, result)}</div>
    <div class="lab-equation"><span>Follow the arithmetic</span><p>Reduction = max(0, load − available capacity)</p><code>max(0, ${state.load} − ${result.available}) = ${result.shed} kW</code></div>
    <p class="lab-state-note ${result.shed ? 'lab-state-warning' : ''}">${result.shed ? `Reduce heat load by at least ${result.shed} kW${state.isolated ? ' before isolating branch B' : ' to fit the combined capacity'}.` : 'Nominal capacity covers the selected load.'}</p>`;
}

let instanceCount = 0;

/** Mount into an empty element. Returns a function that removes listeners and content. */
export function mountLab(container) {
  if (!container || typeof container.replaceChildren !== 'function') throw new TypeError('mountLab requires a DOM element.');
  const id = `meridian-lab-${++instanceCount}`;
  const state = Object.fromEntries(Object.entries(BASELINES).map(([key, value]) => [key, { ...value }]));
  let selected = 'energy';
  let announcementTimer;
  const root = document.createElement('section');
  root.className = 'lab-shell';
  root.setAttribute('aria-labelledby', `${id}-title`);
  root.innerHTML = `<header class="lab-header"><div><p class="lab-eyebrow"><span class="lab-status-dot" aria-hidden="true"></span>MERIDIAN / FIELD LABORATORY</p><h1 id="${id}-title">Make the numbers<br><em>mean something.</em></h1><p class="lab-intro">A settlement is a set of relationships. Change one assumption. Watch the consequences travel.</p></div><div class="lab-case-stamp"><span>REFERENCE CASE</span><strong>M1</strong><p>12 residents<br>Lunar south-polar vicinity<br>Fictional teaching model</p></div></header>
    <div class="lab-experiments" role="tablist" aria-label="Engineering experiments">${Object.entries(EXPERIMENTS).map(([key, experiment]) => `<button class="lab-experiment" type="button" id="${id}-tab-${key}" role="tab" aria-selected="${key === selected}" aria-controls="${id}-panel" tabindex="${key === selected ? 0 : -1}" data-experiment="${key}"><span class="lab-experiment-number">${experiment.number}</span><span><small>${experiment.short}</small><strong>${experiment.title}</strong></span><span class="lab-experiment-arrow" aria-hidden="true">↗</span></button>`).join('')}</div>
    <div id="${id}-panel" class="lab-panel" role="tabpanel" aria-labelledby="${id}-tab-energy"></div>
    <div class="lab-live-region" aria-live="polite" aria-atomic="true"></div>
    <footer class="lab-footer"><span>Explore an assumption. Keep its boundary visible.</span><span>Companion to <i>Building a Civilization Beyond Earth</i></span></footer>`;
  container.replaceChildren(root);
  const panel = root.querySelector('.lab-panel');
  const live = root.querySelector('.lab-live-region');

  function announce() {
    clearTimeout(announcementTimer);
    announcementTimer = setTimeout(() => {
      const s = state[selected];
      if (selected === 'energy') live.textContent = `${number(calculateEnergy(s).nameplate)} kilowatt-hours of nameplate storage required.`;
      else if (selected === 'water') live.textContent = `${number(calculateWater(s).makeup, 1)} kilograms of makeup water per day before additional losses.`;
      else live.textContent = `${calculateCooling(s).shed} kilowatts of heat-load reduction required.`;
    }, 180);
  }

  function refreshResult() {
    panel.querySelector('.lab-results').innerHTML = resultMarkup(selected, state[selected]);
    announce();
  }

  function renderPanel() {
    const experiment = EXPERIMENTS[selected];
    panel.setAttribute('aria-labelledby', `${id}-tab-${selected}`);
    panel.innerHTML = `<div class="lab-workbench"><div class="lab-inputs"><div class="lab-input-title"><span class="lab-eyebrow">EXPERIMENT ${experiment.number}</span><button type="button" class="lab-reset" data-reset>↺ Reset baseline</button></div><h3>${experiment.question}</h3><p class="lab-description">${experiment.description}</p>
      <div class="lab-controls">${experiment.controls.map(control => sliderMarkup(id, control, state[selected][control[0]])).join('')}</div>
      ${selected === 'cooling' ? `<button type="button" class="lab-isolation" role="switch" aria-checked="${state.cooling.isolated}" data-isolation><span><strong>Isolate branch B</strong><small>Remove one branch from the capacity balance</small></span><span class="lab-switch-track" aria-hidden="true"><span></span></span></button>` : ''}
      <div class="lab-book-note"><span class="lab-note-mark" aria-hidden="true">↳</span><div><strong>Read the system behind the number.</strong><a href="${experiment.link}">Chapter ${experiment.chapter} <span aria-hidden="true">↗</span></a></div></div>
      </div><div class="lab-results" aria-label="Calculated results">${resultMarkup(selected, state[selected])}</div></div>
      <div class="lab-boundaries"><div><span class="lab-eyebrow">THE ENGINEERING CONSEQUENCE</span><p>${experiment.takeaway}</p></div><details><summary>Model details & assumptions</summary><p>${experiment.assumption}</p><p>MERIDIAN uses hypothetical inputs to explore relationships. Results are rounded. The capacity balance does not specify operating procedures.</p></details></div>`;
  }

  function selectExperiment(key, focus = false) {
    selected = key;
    root.querySelectorAll('[data-experiment]').forEach(button => {
      const active = button.dataset.experiment === selected;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && focus) button.focus();
    });
    renderPanel();
    announce();
  }

  function handleClick(event) {
    const tab = event.target.closest('[data-experiment]');
    if (tab && root.contains(tab)) selectExperiment(tab.dataset.experiment);
    if (event.target.closest('[data-reset]')) {
      state[selected] = { ...BASELINES[selected] };
      renderPanel();
      panel.querySelector('[data-reset]').focus({ preventScroll: true });
      announce();
    }
    const isolation = event.target.closest('[data-isolation]');
    if (isolation) {
      state.cooling.isolated = !state.cooling.isolated;
      isolation.setAttribute('aria-checked', String(state.cooling.isolated));
      refreshResult();
    }
  }

  function handleInput(event) {
    const input = event.target;
    if (!input.matches('input[type="range"]')) return;
    const control = EXPERIMENTS[selected].controls.find(item => item[0] === input.name);
    if (!control) return;
    const value = Number(input.value);
    state[selected][input.name] = value;
    const unit = control[5];
    panel.querySelector(`[data-output="${input.name}"]`).innerHTML = `${number(value)} <span>${unit}</span>`;
    input.setAttribute('aria-valuetext', `${number(value)} ${unit}`);
    input.style.setProperty('--lab-range', `${(value - control[2]) / (control[3] - control[2]) * 100}%`);
    refreshResult();
  }

  function handleKeydown(event) {
    const tab = event.target.closest('[data-experiment]');
    if (!tab) return;
    const keys = Object.keys(EXPERIMENTS);
    let next;
    if (event.key === 'ArrowRight') next = (keys.indexOf(selected) + 1) % keys.length;
    if (event.key === 'ArrowLeft') next = (keys.indexOf(selected) + keys.length - 1) % keys.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = keys.length - 1;
    if (next !== undefined) { event.preventDefault(); selectExperiment(keys[next], true); }
  }

  root.addEventListener('click', handleClick);
  root.addEventListener('input', handleInput);
  root.addEventListener('keydown', handleKeydown);
  renderPanel();
  return () => {
    clearTimeout(announcementTimer);
    root.removeEventListener('click', handleClick);
    root.removeEventListener('input', handleInput);
    root.removeEventListener('keydown', handleKeydown);
    root.remove();
  };
}
