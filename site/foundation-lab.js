/* A function, its rate, its accumulation, and a direction. No dependencies. */
const number = (value, digits = 2) => new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(Math.abs(value) < 1e-10 ? 0 : value);
const radians = degrees => degrees * Math.PI / 180;
const clean = value => Math.abs(value) < 1e-10 ? 0 : value;
export function calculateLinear({ slope = 2, intercept = 30, time = 5 } = {}) {
  return { value: slope * time + intercept, start: intercept, end: slope * 10 + intercept, change: slope * time, twoMinuteChange: slope * 2 };
}
export function calculateMotion({ a = .5, b = -2, c = 0, time = 4 } = {}) {
  const position = a * time ** 2 + b * time + c, velocity = 2 * a * time + b;
  const candidates = [c, 100 * a + 10 * b + c];
  const turningTime = a !== 0 ? -b / (2 * a) : null;
  if (turningTime !== null && turningTime > 0 && turningTime < 10) candidates.push(a * turningTime ** 2 + b * turningTime + c);
  return { position: clean(position), velocity: clean(velocity), acceleration: 2 * a, minPosition: Math.min(...candidates), maxPosition: Math.max(...candidates), turningTime };
}
export function calculateAccumulation({ power1 = 30, power2 = 60, duration1 = 2, duration2 = 1 } = {}) {
  const energy1 = power1 * duration1, energy2 = power2 * duration2, duration = duration1 + duration2;
  return { energy1, energy2, energy: energy1 + energy2, duration, averagePower: (energy1 + energy2) / duration };
}
export function calculateVectors({ magnitudeA = 3, angleA = 0, magnitudeB = 4, angleB = 90 } = {}) {
  const ax = clean(magnitudeA * Math.cos(radians(angleA))), ay = clean(magnitudeA * Math.sin(radians(angleA)));
  const bx = clean(magnitudeB * Math.cos(radians(angleB))), by = clean(magnitudeB * Math.sin(radians(angleB)));
  const x = clean(ax + bx), y = clean(ay + by), magnitude = Math.hypot(x, y);
  return { ax, ay, bx, by, x, y, magnitude, angle: magnitude < 1e-10 ? null : Math.atan2(y, x) * 180 / Math.PI };
}

const LABS = {
  functions: {
    number: '01', category: 'FUNCTIONS / A RULE YOU CAN SEE', title: 'Every input has a consequence.',
    intro: 'A reservoir starts with some water. A steady flow changes it. The equation, line, and tank are three views of the same story.',
    base: { slope: 2, intercept: 30, time: 5 },
    controls: [['slope','Net flow · slope m',-2,2,.1,'L/min'],['intercept','Starting amount · intercept b',20,80,5,'L'],['time','Time to inspect · t',0,10,.5,'min']],
    formula: 'V(t) = m t + b', connection: 'The slope tells you what one more minute does. The intercept tells you where the story starts.',
    prediction: 'Raise the starting amount by 10 L without changing the flow. Does the slope change?',
    reveal: 'No. Every point moves upward by 10 L, while the slope stays the same. A different starting amount does not change the rate.',
    details: 'The reservoir has a 100 L capacity and a constant net flow over the displayed 0–10 minute interval. Slider bounds keep the amount between 0 and 100 L. Positive flow fills it; negative flow drains it. This is a volume balance, not a model of pressure, pipe flow, or control hardware.',
    source: 'https://openstax.org/books/college-algebra-2e/pages/4-1-linear-functions', sourceTitle: 'OpenStax · College Algebra 2e, 4.1 Linear Functions',
  },
  motion: {
    number: '02', category: 'DERIVATIVES / CHANGE HAS A SHAPE', title: 'Three ways to see one journey.',
    intro: 'Move through one ten-second journey. The cart follows position; the slope of position gives velocity; the slope of velocity gives acceleration.',
    base: { a: .5, b: -2, c: 0, time: 4 },
    controls: [['a','Quadratic coefficient · a',-1,1,.1,'m/s²'],['b','Initial velocity · b',-4,8,.5,'m/s'],['c','Starting position · c',-10,10,1,'m'],['time','Time cursor · t',0,10,.05,'s']],
    formula: 'x(t) = a t² + b t + c\nv(t) = 2a t + b\nacceleration = 2a', connection: 'The coefficient a is half the acceleration. A negative velocity means motion toward decreasing position, not a negative amount of speed.',
    prediction: 'Add 5 m to the starting position c. What happens to velocity and acceleration?',
    reveal: 'Neither changes. The position curve shifts upward, but its slope and curvature stay the same. An offset changes where the cart is, not how it moves.',
    details: 'One-dimensional motion is prescribed by a quadratic position function for 0 ≤ t ≤ 10 seconds. Position is in meters, b is in m/s, and a is in m/s²; the physical acceleration is 2a. Graph scales adapt to the coefficients, while their shared time axis stays fixed. The amber tangent on the position plot has slope equal to instantaneous velocity. Playback is real-time and stops at 10 s; reduced-motion preference uses manual stepping.',
    source: 'https://openstax.org/books/calculus-volume-1/pages/3-4-derivatives-as-rates-of-change', sourceTitle: 'OpenStax · Calculus Volume 1, 3.4 Derivatives as Rates of Change',
  },
  accumulation: {
    number: '03', category: 'INTEGRALS / GIVE A RATE SOME TIME', title: 'The area is the amount.',
    intro: 'Two operating phases draw different amounts of power. Stretch a phase or raise its power. The colored area records the energy used.',
    base: { power1: 30, power2: 60, duration1: 2, duration2: 1 },
    controls: [['power1','Phase 01 power',0,100,5,'kW'],['duration1','Phase 01 duration',.5,6,.25,'h'],['power2','Phase 02 power',0,100,5,'kW'],['duration2','Phase 02 duration',.5,6,.25,'h']],
    formula: 'E = ∫ P(t) dt = P₁ Δt₁ + P₂ Δt₂', connection: 'A kilowatt is a rate. A kilowatt-hour is an amount. The integral connects them by accumulating power over time.',
    prediction: 'Double only the duration of phase 01. Will the total energy double?',
    reveal: 'Usually not. You add one more copy of phase 01’s energy, while phase 02 stays unchanged. Doubling both durations always doubles the total when the powers stay fixed.',
    details: 'Power is constant within each phase, with an ideal instantaneous change at their boundary. Time is measured in hours, so the graph area has units kW × h = kWh. The second graph is cumulative consumed energy, not stored battery energy. Generation, charging losses, reserve margins, and power-system sizing are outside this example.',
    source: 'https://openstax.org/books/calculus-volume-1/pages/5-2-the-definite-integral', sourceTitle: 'OpenStax · Calculus Volume 1, 5.2 The Definite Integral',
  },
  vectors: {
    number: '04', category: 'VECTORS / AMOUNT WITH A DIRECTION', title: 'Two moves. One destination.',
    intro: 'A displacement has both length and direction. Add the horizontal parts, add the vertical parts, and connect the start to the finish.',
    base: { magnitudeA: 3, angleA: 0, magnitudeB: 4, angleB: 90 },
    controls: [['magnitudeA','Vector A magnitude',0,8,.25,'m'],['angleA','Vector A angle',-180,180,5,'°'],['magnitudeB','Vector B magnitude',0,8,.25,'m'],['angleB','Vector B angle',-180,180,5,'°']],
    formula: 'Rₓ = A cos α + B cos β\nRᵧ = A sin α + B sin β\n|R| = √(Rₓ² + Rᵧ²)', connection: 'Moving an arrow without rotating or resizing it does not change the vector. That is why the tip-to-tail construction works.',
    prediction: 'Make the two vectors equally long and point them in opposite directions. What should the resultant do?',
    reveal: 'Their components cancel, so the resultant has zero length. A zero vector has no defined direction—there is no arrow to point anywhere.',
    details: 'These are planar displacements in meters. Angles are measured counterclockwise from the positive x axis. The plot uses equal horizontal and vertical scales. The resultant is a net displacement; its magnitude is generally different from the distance traveled along the two legs. Direction is reported from −180° to 180° and is undefined for a zero resultant.',
    source: 'https://openstax.org/books/precalculus-2e/pages/8-8-vectors', sourceTitle: 'OpenStax · Precalculus 2e, 8.8 Vectors',
  },
};
const CALCULATE = { functions: calculateLinear, motion: calculateMotion, accumulation: calculateAccumulation, vectors: calculateVectors };

function label(x,y,value,cls='fnd-svg-label',anchor='start') { return `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${value}</text>`; }
function line(x1,y1,x2,y2,cls='fnd-line') { return `<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`; }
function arrow(x1,y1,x2,y2,cls) {
  if(Math.hypot(x2-x1,y2-y1)<.01)return `<circle class="${cls}" cx="${x1}" cy="${y1}" r="3"/>`;
  const a=Math.atan2(y2-y1,x2-x1),d=10;
  return `${line(x1,y1,x2,y2,cls)}<path class="${cls}" d="M${x2-d*Math.cos(a-.45)},${y2-d*Math.sin(a-.45)} L${x2},${y2} L${x2-d*Math.cos(a+.45)},${y2-d*Math.sin(a+.45)}"/>`;
}
function svg(width,height,content,description) { return `<svg class="fnd-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${description}">${content}</svg>`; }
function bounds(values, minimumSpan=2) {
  let low=Math.min(0,...values),high=Math.max(0,...values);
  if(high-low<minimumSpan){const mid=(low+high)/2;low=mid-minimumSpan/2;high=mid+minimumSpan/2;}
  const span=high-low,rough=span/4,power=10**Math.floor(Math.log10(rough)),step=[1,2,2.5,5,10].find(multiplier=>multiplier*power>=rough)*power;
  return {min:Math.floor((low-span*.08)/step)*step,max:Math.ceil((high+span*.08)/step)*step,step};
}
function plot({width=700,height=300,xMax=10,yMin=0,yMax=100,yStep=25,title='A graph',xLabel='Time · min',ticks,clipId}) {
  const left=66,right=width-25,top=47,bottom=height-55;
  const x=value=>left+value/xMax*(right-left),y=value=>bottom-(value-yMin)/(yMax-yMin)*(bottom-top);
  let content=`<defs><clipPath id="${clipId}"><rect x="${left}" y="${top}" width="${right-left}" height="${bottom-top}"/></clipPath></defs>${label(left,24,title,'fnd-svg-title')}`;
  for(let value=yMin;value<=yMax+yStep*.01;value+=yStep){content+=line(left,y(value),right,y(value),'fnd-grid')+label(left-12,y(value)+5,number(value,2),'fnd-tick','end');}
  const timeTicks=ticks||Array.from({length:6},(_,index)=>xMax*index/5);
  for(const value of timeTicks)content+=line(x(value),top,x(value),bottom,'fnd-grid-vertical')+label(x(value),bottom+24,number(value,2),'fnd-tick','middle');
  if(yMin<=0&&yMax>=0)content+=line(left,y(0),right,y(0),'fnd-zero-axis');
  content+=label((left+right)/2,height-5,xLabel,'fnd-axis-title','middle');
  return {content,x,y,left,right,top,bottom,clip:`clip-path="url(#${clipId})"`};
}
function pathFor(fn,x,y,start=0,end=10,samples=80) { return Array.from({length:samples+1},(_,i)=>{const t=start+(end-start)*i/samples;return `${i?'L':'M'}${x(t)},${y(fn(t))}`;}).join(' '); }
function cursor(chart,time,value) { return `${line(chart.x(time),chart.top,chart.x(time),chart.bottom,'fnd-cursor')}<circle class="fnd-point" cx="${chart.x(time)}" cy="${chart.y(value)}" r="5.5"/>`; }

function linearVisual(state,result,id,compact) {
  const width=compact?420:680,height=compact?320:350;
  const p=plot({width,height,title:'Stored water · L',clipId:`${id}-linear`});
  const graph=svg(width,height,`${p.content}<path class="fnd-curve" d="${pathFor(t=>state.slope*t+state.intercept,p.x,p.y)}" ${p.clip}/>${cursor(p,state.time,result.value)}<circle class="fnd-intercept" cx="${p.x(0)}" cy="${p.y(state.intercept)}" r="5"/>`,
    `Water amount V(t)=${state.slope}t+${state.intercept} liters. At ${state.time} minutes the amount is ${number(result.value)} liters. The horizontal axis is time in minutes and the vertical axis is liters.`);
  const waterHeight=result.value*2.3;
  let tank=label(100,28,'SAME VALUE, REAL MEANING','fnd-tank-title','middle')+`<rect class="fnd-tank-outline" x="43" y="65" width="114" height="230" rx="8"/><rect class="fnd-water" x="47" y="${295-waterHeight}" width="106" height="${waterHeight}" rx="2"/>`;
  for(const amount of [0,25,50,75,100])tank+=line(159,295-amount*2.3,167,295-amount*2.3,'fnd-tank-tick')+label(175,300-amount*2.3,amount,'fnd-tank-number');
  tank+=label(100,333,`${number(result.value)} L`,'fnd-tank-value','middle');
  return `<div class="fnd-linear-stage"><div>${graph}</div><div class="fnd-tank">${svg(230,350,tank,`The 100 liter tank contains ${number(result.value)} liters.`)}</div></div>`;
}

function motionVisual(state,result,id,compact) {
  const width=compact?420:840,height=compact?215:210;
  const positionBounds=bounds([result.minPosition,result.maxPosition]), velocityBounds=bounds([state.b,20*state.a+state.b]);
  const accelerationBounds=bounds([2*state.a],2);
  const railX=value=>66+(value-positionBounds.min)/(positionBounds.max-positionBounds.min)*(width-110);
  const cartX=railX(result.position);
  let track=label(66,22,'THE CART / POSITION ALONG THE TRACK','fnd-svg-title')+line(66,82,width-44,82,'fnd-rail');
  track+=`<g transform="translate(${cartX},0)"><rect class="fnd-cart" x="-23" y="50" width="46" height="24" rx="5"/><rect class="fnd-cart-window" x="-12" y="39" width="24" height="14" rx="3"/><circle class="fnd-wheel" cx="-14" cy="77" r="6"/><circle class="fnd-wheel" cx="14" cy="77" r="6"/></g>`;
  if(Math.abs(result.velocity)>.01)track+=arrow(cartX,109,cartX+Math.max(-45,Math.min(45,result.velocity*5)),109,'fnd-vector-gold');
  track+=label(66,145,`${number(positionBounds.min)} m`,'fnd-tick')+label(width-44,145,`${number(positionBounds.max)} m`,'fnd-tick','end')+label(width/2,145,`t = ${number(state.time,2)} s`,'fnd-clock-label','middle');
  const charts=[
    ['Position · m',positionBounds,t=>state.a*t*t+state.b*t+state.c,result.position,'fnd-curve','position'],
    ['Velocity · m/s',velocityBounds,t=>2*state.a*t+state.b,result.velocity,'fnd-curve-gold','velocity'],
    ['Acceleration · m/s²',accelerationBounds,()=>2*state.a,result.acceleration,'fnd-curve-lilac','acceleration'],
  ].map(([title,range,fn,value,cls,key])=>{
    const p=plot({width,height,title,xLabel:'Time · s',yMin:range.min,yMax:range.max,yStep:range.step,clipId:`${id}-${key}`});
    let body=`${p.content}<g ${p.clip}><path class="${cls}" d="${pathFor(fn,p.x,p.y)}"/>`;
    if(key==='position')body+=`<path class="fnd-tangent" d="${pathFor(t=>result.position+result.velocity*(t-state.time),p.x,p.y,Math.max(0,state.time-1.3),Math.min(10,state.time+1.3),1)}"/>`;
    body+=`${cursor(p,state.time,value)}</g>`;
    return svg(width,height,body,`${title} versus time from zero to ten seconds. At ${number(state.time,2)} seconds the value is ${number(value,3)}. The three plots use different vertical units and a shared time axis.`);
  }).join('');
  return `<div class="fnd-motion-track">${svg(width,165,track,`The cart is at ${number(result.position)} meters with velocity ${number(result.velocity)} meters per second.`)}</div><div class="fnd-motion-charts">${charts}</div>`;
}

function accumulationVisual(state,result,id,compact) {
  const width=compact?420:840,height=compact?300:320;
  const p=plot({width,height,xMax:result.duration,title:'Power · kW',xLabel:'Time · h',ticks:[0,state.duration1,result.duration],clipId:`${id}-power`});
  let body=`${p.content}<rect class="fnd-energy-area-one" x="${p.x(0)}" y="${p.y(state.power1)}" width="${p.x(state.duration1)-p.x(0)}" height="${p.y(0)-p.y(state.power1)}"/><rect class="fnd-energy-area-two" x="${p.x(state.duration1)}" y="${p.y(state.power2)}" width="${p.x(result.duration)-p.x(state.duration1)}" height="${p.y(0)-p.y(state.power2)}"/>`;
  body+=line(p.x(0),p.y(state.power1),p.x(state.duration1),p.y(state.power1),'fnd-curve')+line(p.x(state.duration1),p.y(state.power1),p.x(state.duration1),p.y(state.power2),'fnd-phase-step')+line(p.x(state.duration1),p.y(state.power2),p.x(result.duration),p.y(state.power2),'fnd-curve-gold');
  const range=bounds([0,result.energy],10);
  const q=plot({width,height:compact?250:240,xMax:result.duration,title:'Accumulated energy · kWh',xLabel:'Time · h',yMin:0,yMax:range.max,yStep:range.step,ticks:[0,state.duration1,result.duration],clipId:`${id}-energy`});
  const accumulation=`${q.content}${line(q.x(0),q.y(0),q.x(state.duration1),q.y(result.energy1),'fnd-curve')}${line(q.x(state.duration1),q.y(result.energy1),q.x(result.duration),q.y(result.energy),'fnd-curve-gold')}<circle class="fnd-point" cx="${q.x(result.duration)}" cy="${q.y(result.energy)}" r="5.5"/>`;
  return `<div>${svg(width,height,body,`Phase one draws ${state.power1} kilowatts for ${state.duration1} hours, using ${result.energy1} kilowatt-hours. Phase two draws ${state.power2} kilowatts for ${state.duration2} hours, using ${result.energy2} kilowatt-hours.`)}</div><div class="fnd-phase-key"><span><i></i>Phase 01: ${number(result.energy1)} kWh</span><b>+</b><span><i></i>Phase 02: ${number(result.energy2)} kWh</span></div><div>${svg(width,compact?250:240,accumulation,`Cumulative consumed energy rises from zero to ${result.energy1} kilowatt-hours at ${state.duration1} hours, then to ${result.energy} kilowatt-hours at ${result.duration} hours. Its slope equals power.`)}</div>`;
}

function vectorsVisual(state,result,id,compact,layout) {
  const width=compact?420:840,height=compact?410:490,side=Math.min(width-120,height-100),cx=width/2,cy=height/2;
  const bound=Math.max(2,Math.ceil(Math.max(Math.abs(result.ax),Math.abs(result.ay),Math.abs(result.bx),Math.abs(result.by),Math.abs(result.x),Math.abs(result.y))*1.2));
  const scale=side/(2*bound),x=value=>cx+value*scale,y=value=>cy-value*scale;
  let body=label(32,25,'ADD COMPONENTS. CONNECT THE START TO THE FINISH.','fnd-svg-title');
  for(let i=-2;i<=2;i++){const value=bound*i/2;body+=line(x(value),cy-side/2,x(value),cy+side/2,'fnd-grid')+line(cx-side/2,y(value),cx+side/2,y(value),'fnd-grid');if(i!==0)body+=label(x(value),cy+side/2+24,number(value,1),'fnd-tick','middle')+label(cx-side/2-12,y(value)+5,number(value,1),'fnd-tick','end');}
  body+=arrow(cx-side/2,cy,cx+side/2,cy,'fnd-axis-arrow')+arrow(cx,cy+side/2,cx,cy-side/2,'fnd-axis-arrow')+label(cx+side/2+12,cy+5,'x','fnd-svg-label')+label(cx+10,cy-side/2-8,'y','fnd-svg-label');
  body+=line(x(result.x),y(result.y),x(result.x),cy,'fnd-component')+line(cx,y(result.y),x(result.x),y(result.y),'fnd-component');
  body+=arrow(cx,cy,x(result.ax),y(result.ay),'fnd-vector-cyan');
  if(layout==='tail')body+=arrow(cx,cy,x(result.bx),y(result.by),'fnd-vector-gold')+line(x(result.ax),y(result.ay),x(result.x),y(result.y),'fnd-vector-copy')+line(x(result.bx),y(result.by),x(result.x),y(result.y),'fnd-vector-copy');
  else body+=arrow(x(result.ax),y(result.ay),x(result.x),y(result.y),'fnd-vector-gold');
  body+=arrow(cx,cy,x(result.x),y(result.y),'fnd-vector-result');
  body+=`<circle class="fnd-origin" cx="${cx}" cy="${cy}" r="4"/>`;
  if(result.magnitude<1e-10)body+=label(cx+13,cy-17,'Zero resultant','fnd-lilac-label');
  body+=label(width/2,height-10,'Equal axis scales · displacement in meters','fnd-axis-title','middle');
  return svg(width,height,body,`Vector A is (${number(result.ax,3)}, ${number(result.ay,3)}) meters. Vector B is (${number(result.bx,3)}, ${number(result.by,3)}) meters. Their resultant is (${number(result.x,3)}, ${number(result.y,3)}) meters, with magnitude ${number(result.magnitude,3)} meters. Shown ${layout==='tail'?'tail to tail with a parallelogram':'tip to tail'}.`);
}

function controlMarkup(control,state,id) {
  const [key,title,min,max,step,unit]=control;
  return `<div class="fnd-control"><div><label for="${id}-${key}">${title}</label><output data-value="${key}" for="${id}-${key}">${number(state[key])}<span>${unit}</span></output></div><input type="range" id="${id}-${key}" name="${key}" min="${min}" max="${max}" step="${step}" value="${state[key]}" aria-valuetext="${number(state[key])} ${unit}" style="--fnd-fill:${(state[key]-min)/(max-min)*100}%"><p class="fnd-range-labels" aria-hidden="true"><span>${min} ${unit}</span><span>${max} ${unit}</span></p></div>`;
}
function metrics(type,state,result) {
  if(type==='functions')return [['Water at this time',number(result.value),'L'],['Rate of change',`${state.slope>0?'+':''}${number(state.slope)}`,'L/min'],['At the start',number(result.start),'L']];
  if(type==='motion')return [['Position',number(result.position),'m'],['Velocity',number(result.velocity),'m/s'],['Acceleration',number(result.acceleration),'m/s²']];
  if(type==='accumulation')return [['Total consumed energy',number(result.energy),'kWh'],['Total duration',number(result.duration),'h'],['Average power',number(result.averagePower),'kW']];
  return [['Resultant magnitude',number(result.magnitude,3),'m'],['Horizontal / vertical',`${number(result.x)} / ${number(result.y)}`,'m'],['Direction from +x',result.angle===null?'Undefined':number(result.angle,1),result.angle===null?'zero vector':'°']];
}
const RENDERERS={functions:linearVisual,motion:motionVisual,accumulation:accumulationVisual,vectors:vectorsVisual};
let instances=0;
export function mountFoundation(container,type='functions') {
  if(!LABS[type])throw new RangeError(`Unknown foundation: ${type}`);
  if(!container||typeof container.replaceChildren!=='function')throw new TypeError('A DOM container is required.');
  const config=LABS[type],id=`foundation-${type}-${++instances}`;
  let state={...config.base},layout='tip',playing=false,frame=0,startStamp=0,startTime=0,lastFrame=0,liveTimer,disposed=false;
  const media=typeof window.matchMedia==='function'?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
  const root=document.createElement('section');root.className=`fnd-shell fnd-${type}`;root.setAttribute('aria-labelledby',`${id}-title`);
  root.innerHTML=`<header class="fnd-header"><div><p class="fnd-kicker">${config.category}</p><h2 id="${id}-title">${config.title}</h2><p class="fnd-intro">${config.intro}</p></div><button type="button" class="fnd-reset" data-reset>↺ <span>Reset</span></button></header><div class="fnd-metrics"></div><div class="fnd-toolbar"></div><div class="fnd-stage"></div><div class="fnd-controls" style="--fnd-columns:${config.controls.length}">${config.controls.map(control=>controlMarkup(control,state,id)).join('')}</div><div class="fnd-understanding"><div><span class="fnd-kicker">THE RELATIONSHIP</span><p class="fnd-formula">${config.formula.replaceAll('\n','<br>')}</p></div><p class="fnd-connection">${config.connection}</p></div><div class="fnd-prediction"><div><span class="fnd-kicker">PREDICT BEFORE YOU MOVE</span><p>${config.prediction}</p></div><button type="button" data-reveal aria-expanded="false" aria-controls="${id}-reveal">Reveal the reasoning <span aria-hidden="true">↗</span></button><p id="${id}-reveal" class="fnd-reveal" hidden>${config.reveal}</p></div><details class="fnd-details"><summary>Model details & further learning <span aria-hidden="true">+</span></summary><p>${config.details}</p><p>Explore the mathematics in <a href="${config.source}" target="_blank" rel="noopener noreferrer">${config.sourceTitle} ↗</a>. The interactive examples and diagrams here are original.</p></details><div class="fnd-live" role="status" aria-live="polite" aria-atomic="true"></div>`;
  container.replaceChildren(root);
  const stage=root.querySelector('.fnd-stage'),metricNode=root.querySelector('.fnd-metrics'),toolbar=root.querySelector('.fnd-toolbar'),live=root.querySelector('.fnd-live');
  let compact=root.clientWidth<620;
  function updateToolbar() {
    const focused=document.activeElement;
    const focusSelector=focused&&toolbar.contains(focused)?focused.hasAttribute('data-play')?'[data-play]':focused.hasAttribute('data-step')?'[data-step]':focused.dataset.layout?`[data-layout="${focused.dataset.layout}"]`:null:null;
    if(type==='motion')toolbar.innerHTML=`<div class="fnd-play-controls"><button type="button" data-play ${media?.matches?'disabled':''} aria-pressed="${playing}">${playing?'Ⅱ Pause motion':'▶ Play motion'}</button><button type="button" data-step>Step +1 s</button><span>${media?.matches?'Reduced motion is on. Step through the journey.':'One second on the clock = one second in the model.'}</span></div>`;
    if(type==='vectors')toolbar.innerHTML=`<div class="fnd-vector-controls"><div role="group" aria-label="Vector arrangement"><button type="button" data-layout="tip" aria-pressed="${layout==='tip'}">Tip to tail</button><button type="button" data-layout="tail" aria-pressed="${layout==='tail'}">Tail to tail</button></div><div class="fnd-legend"><span><i></i>A</span><span><i></i>B</span><span><i></i>Resultant R</span></div></div>`;
    if(focusSelector){let next=toolbar.querySelector(focusSelector);if(next?.disabled)next=toolbar.querySelector('[data-step]');next?.focus({preventScroll:true});}
  }
  function updateControls() {
    for(const [key,,min,max,,unit] of config.controls){const input=root.querySelector(`input[name="${key}"]`);input.value=state[key];input.setAttribute('aria-valuetext',`${number(state[key])} ${unit}`);input.style.setProperty('--fnd-fill',`${(state[key]-min)/(max-min)*100}%`);root.querySelector(`[data-value="${key}"]`).innerHTML=`${number(state[key])}<span>${unit}</span>`;}
  }
  function render(announce=true) {
    if(disposed)return;
    const result=CALCULATE[type](state),values=metrics(type,state,result);
    metricNode.innerHTML=values.map(([title,value,unit])=>`<div><span>${title}</span><strong>${value}<small>${unit}</small></strong></div>`).join('');
    stage.innerHTML=RENDERERS[type](state,result,id,compact,layout);
    if(announce){clearTimeout(liveTimer);liveTimer=setTimeout(()=>{if(!disposed)live.textContent=values.map(([title,value,unit])=>`${title}: ${value} ${unit}`).join('. ');},180);}
  }
  function pause(announce=false) { playing=false;cancelAnimationFrame(frame);frame=0;updateToolbar();if(announce)render(true); }
  function animate(stamp) {
    if(!playing||disposed)return;
    state.time=Math.min(10,startTime+(stamp-startStamp)/1000);
    if(stamp-lastFrame>=32||state.time>=10){lastFrame=stamp;updateControls();render(false);}
    if(state.time>=10){pause(true);return;}
    frame=requestAnimationFrame(animate);
  }
  function click(event) {
    if(event.target.closest('[data-reset]')){pause();state={...config.base};layout='tip';updateControls();updateToolbar();const reveal=root.querySelector('.fnd-reveal');reveal.hidden=true;root.querySelector('[data-reveal]').setAttribute('aria-expanded','false');render();}
    if(event.target.closest('[data-play]')){if(media?.matches)return;if(playing)pause(true);else{if(state.time>=10)state.time=0;playing=true;startTime=state.time;startStamp=performance.now();lastFrame=0;updateToolbar();frame=requestAnimationFrame(animate);}root.querySelector('[data-play]')?.focus({preventScroll:true});}
    if(event.target.closest('[data-step]')){pause();state.time=state.time>=10?0:Math.min(10,state.time+1);updateControls();render();root.querySelector('[data-step]')?.focus({preventScroll:true});}
    const arrangement=event.target.closest('[data-layout]');if(arrangement){layout=arrangement.dataset.layout;updateToolbar();render();root.querySelector(`[data-layout="${layout}"]`)?.focus({preventScroll:true});}
    const revealButton=event.target.closest('[data-reveal]');if(revealButton){const reveal=root.querySelector('.fnd-reveal');reveal.hidden=!reveal.hidden;revealButton.setAttribute('aria-expanded',String(!reveal.hidden));}
  }
  function input(event) { const target=event.target;if(!target.matches('input[type="range"]'))return;pause();state[target.name]=Number(target.value);updateControls();render(); }
  function preferenceChanged(){if(media?.matches)pause(true);else updateToolbar();}
  function visibilityChanged(){if(document.hidden&&playing)pause(true);}
  root.addEventListener('click',click);root.addEventListener('input',input);document.addEventListener('visibilitychange',visibilityChanged);media?.addEventListener?.('change',preferenceChanged);
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(()=>{const next=root.clientWidth<620;if(next!==compact){compact=next;render(false);}}):null;
  observer?.observe(root);updateToolbar();render(false);
  return()=>{disposed=true;cancelAnimationFrame(frame);clearTimeout(liveTimer);observer?.disconnect();root.removeEventListener('click',click);root.removeEventListener('input',input);document.removeEventListener('visibilitychange',visibilityChanged);media?.removeEventListener?.('change',preferenceChanged);root.remove();};
}
