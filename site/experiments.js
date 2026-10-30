/* Eight small worlds. Native SVG, ordinary mathematics, no dependencies. */
export const PHYSICS = { lunarGravity: 1.62, earthRadiusKm: 6371, earthMuKm: 398600.4418, earthGravity: 9.80665, stefanBoltzmann: 5.670374419e-8 };
const rad = degrees => degrees * Math.PI / 180;
const deg = radians => radians * 180 / Math.PI;
const fmt = (value, digits = 2) => new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(Math.abs(value) < 1e-10 ? 0 : value);
export function calculateLeverage({ force = 20, arm = 0.6 } = {}) { return { torque: force * arm }; }
export function calculateRamp({ height = 3, run = 10, mass = 100, gravity = PHYSICS.lunarGravity } = {}) {
  const length = Math.hypot(height, run), angle = Math.atan2(height, run);
  return { length, angle: deg(angle), force: mass * gravity * Math.sin(angle), weight: mass * gravity, work: mass * gravity * height };
}
export function calculateOrbit({ altitude = 400, mass = 1000 } = {}) {
  const radius = PHYSICS.earthRadiusKm + altitude;
  const speed = Math.sqrt(PHYSICS.earthMuKm / radius);
  const period = 2 * Math.PI * Math.sqrt(radius ** 3 / PHYSICS.earthMuKm);
  return { radius, speed, period, energyMJ: 0.5 * mass * (speed * 1000) ** 2 / 1e6 };
}
export function calculateRotation({ radius = 100, rpm = 3 } = {}) {
  const omega = rpm * 2 * Math.PI / 60, acceleration = omega ** 2 * radius;
  return { omega, acceleration, earthG: acceleration / PHYSICS.earthGravity, speed: omega * radius };
}
export function calculateSolar({ power = 200, angle = 30 } = {}) {
  const fraction = angle === 90 ? 0 : Math.max(0, Math.cos(rad(angle)));
  return { fraction, output: power * fraction };
}
export function calculateCooling({ area = 100, temperature = 300, emissivity = 0.9, background = 3 } = {}) {
  const factor = emissivity * PHYSICS.stefanBoltzmann * area;
  const emitted = factor * temperature ** 4, absorbed = factor * background ** 4;
  return { netKW: (emitted - absorbed) / 1000, emittedKW: emitted / 1000, absorbedKW: absorbed / 1000, celsius: temperature - 273.15 };
}
const PATTERN = [-.2, .1, 0, -.1, .2, .15, -.05, -.15, .05, 0, -.1, .2, .1, -.2, 0, .05, -.15, .15, -.05, 0];
export function calculateUncertainty({ count = 5, spread = 1, offset = 0 } = {}) {
  const samples = PATTERN.slice(0, Math.max(2, Math.min(20, count))).map(value => 10 + value * spread + offset);
  const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  const stddev = Math.sqrt(samples.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (samples.length - 1));
  return { samples, mean, stddev, min: Math.min(...samples), max: Math.max(...samples), bias: mean - 10 };
}
export function calculateRobot({ shoulder = 30, elbow = 60, forearm = .75 } = {}) {
  const a = rad(shoulder), b = rad(shoulder + elbow);
  const elbowX = Math.cos(a), elbowY = Math.sin(a);
  const x = elbowX + forearm * Math.cos(b), y = elbowY + forearm * Math.sin(b);
  return { elbowX, elbowY, x, y, reach: Math.hypot(x, y), toolAngle: shoulder + elbow };
}

const TYPES = {
  leverage: { name: 'A little distance. A lot of turning.', tag: '01 / LEVERS & TORQUE', base: { force: 20, arm: .6 }, controls: [['force','Perpendicular force',5,120,1,'N'],['arm','Lever arm',.1,2,.05,'m']], challenge: 'Make 24 N·m of torque using only 12 N of force.', formula: 'τ = F × r', connection: 'A proportional relationship becomes a wrench, a door handle, or a robot joint. Doubling distance doubles torque when the force stays perpendicular.', details: 'A rigid lever with a perpendicular force applied at the marked distance from its pivot. Friction, bending, and mechanism strength are outside this simple moment balance. A force at another angle uses τ = F r sin θ.' },
  ramp: { name: 'Trade force for distance.', tag: '02 / RAMPS & WORK', base: { height: 3, run: 10, mass: 100 }, controls: [['height','Rise',.5,6,.1,'m'],['run','Horizontal run',2,20,.5,'m'],['mass','Load mass',20,250,5,'kg']], challenge: 'Keep the height fixed and double the run. Does the required work fall with the force?', formula: 'F = m g h / √(h² + d²)     W = m g h', connection: 'Geometry connects a gentler slope to a longer journey. The ideal work stays the same: a ramp changes how you deliver it.', details: 'A frictionless straight ramp on the Moon, with g = 1.62 m/s². Force is applied along the ramp to hold the load or move it at constant speed. Work here is mechanical work against gravity; friction and machine inefficiency would add to it.' },
  orbit: { name: 'Keep falling. Keep missing Earth.', tag: '03 / CIRCULAR ORBITS', base: { altitude: 400, mass: 1000 }, controls: [['altitude','Altitude above Earth',200,36000,100,'km'],['mass','Spacecraft mass',500,10000,100,'kg']], challenge: 'Double the spacecraft mass. Which orbital quantities change, and which stay the same?', formula: 'v = √(μ/r)     T = 2π √(r³/μ)', connection: 'Square roots and powers predict motion around a planet. In this model, mass changes kinetic energy; it does not change circular-orbit speed.', details: 'A two-body circular orbit around a spherical Earth. Radius r = 6,371 km + altitude; μ = 398,600.4418 km³/s². No atmosphere, thrust, oblateness, or third bodies. Kinetic energy is measured in the Earth-centered inertial frame. This is an orbit model, not a launch or mission plan.' },
  rotation: { name: 'Build a floor with a curve.', tag: '04 / ROTATION & GRAVITY', base: { radius: 100, rpm: 3 }, controls: [['radius','Habitat radius',20,500,5,'m'],['rpm','Rotation rate',.5,6,.1,'rpm']], challenge: 'Double the radius. Then lower the rotation rate to recover the original acceleration.', formula: 'a = ω²r     ω = rpm × 2π/60', connection: 'The square matters. A small change in rotation rate changes acceleration more strongly than the same percentage change in radius.', details: 'A rigid ring at constant rotation rate. The floor supplies inward centripetal acceleration; a resident interprets apparent weight toward the rim in the rotating frame. “Earth g” uses 9.80665 m/s². Human comfort, head-to-foot gradients, Coriolis effects, and structural sizing require separate analysis.' },
  solar: { name: 'Catch the light at the right angle.', tag: '05 / PROJECTION & POWER', base: { power: 200, angle: 30 }, controls: [['angle','Angle from the panel normal',0,90,1,'°'],['power','Output at normal incidence',20,500,10,'kW']], challenge: 'Find the angle that cuts the ideal output exactly in half.', formula: 'P = Pₘₐₓ cos θ', connection: 'Cosine is a projection: it tells you how much area the incoming light sees. At 90°, this ideal direct-beam contribution reaches zero.', details: 'Direct, parallel light incident on a flat panel with fixed irradiance and efficiency. Angle θ is measured from the panel normal, not from its surface. Temperature effects, shading, reflections, diffuse light, wiring, and tracking power are excluded.' },
  cooling: { name: 'Let the heat leave as light.', tag: '06 / RADIATION & FOURTH POWERS', base: { area: 100, temperature: 300, emissivity: .9, background: 3 }, controls: [['area','Radiating area',10,300,5,'m²'],['temperature','Surface temperature',250,400,5,'K'],['emissivity','Emissivity',.3,.95,.01,'']], challenge: 'At 300 K, double the area. Then raise the temperature by 20 K. Compare the effects.', formula: 'Q = ε σ A (T⁴ − Tᵦ⁴)', connection: 'Area has a linear effect; absolute temperature enters to the fourth power. The surrounding environment also radiates back.', details: 'A uniform grey diffuse surface radiating from one face to a uniform effective background with view factor 1. σ = 5.670374419 × 10⁻⁸ W m⁻² K⁻⁴. A negative result means net heat absorption. Sunlight, planetary geometry, conduction, and radiator plumbing are excluded. Background presets are illustrative environments.' },
  uncertainty: { name: 'Agreement is not always accuracy.', tag: '07 / MEASUREMENT & EVIDENCE', base: { count: 5, spread: 1, offset: 0 }, controls: [['spread','Pattern spread multiplier',.2,2,.1,'×'],['offset','Calibration offset',-1,1,.05,'mm']], challenge: 'Shift the calibration. Can the readings agree closely and still miss the 10 mm reference?', formula: 'x̄ = Σx / n     s = √[Σ(x − x̄)² / (n − 1)]', connection: 'Repeated measurements reveal variation. A shared calibration error can move every reading together while leaving their spread unchanged.', details: 'The reference is exactly 10 mm in this teaching example. Readings follow a fixed 20-value sequence, scaled and shifted by the controls; the repeat button reveals the next scripted value, not a random physical measurement. The displayed s is sample standard deviation, not a complete uncertainty budget or a confidence interval.' },
  robot: { name: 'Two angles become a place.', tag: '08 / ROBOT ARM GEOMETRY', base: { shoulder: 30, elbow: 60, forearm: .75 }, controls: [['shoulder','Shoulder angle θ₁',-150,150,5,'°'],['elbow','Relative elbow angle θ₂',-150,150,5,'°'],['forearm','Forearm length L₂',.3,1.5,.05,'m']], challenge: 'Move the tool above the shoulder using different pairs of angles. Notice how the two joints cooperate.', formula: 'x = L₁ cos θ₁ + L₂ cos(θ₁ + θ₂)\ny = L₁ sin θ₁ + L₂ sin(θ₁ + θ₂)', connection: 'Trigonometry turns joint readings into a tool position. The elbow angle is relative to the upper arm, so the angles add for the second link.', details: 'A planar two-link arm with a fixed 1 m upper arm, rigid links, and ideal joints. Angles are positive counterclockwise; the elbow angle is relative to link 1. The dotted circles show geometric radial reach, not collision-free or mechanically achievable workspace. Loads, joint stops beyond the sliders, dynamics, and collisions are excluded.' },
};
const calculations = { leverage: calculateLeverage, ramp: calculateRamp, orbit: calculateOrbit, rotation: calculateRotation, solar: calculateSolar, cooling: calculateCooling, uncertainty: calculateUncertainty, robot: calculateRobot };

function line(x1,y1,x2,y2,cls='exp-line',extra='') { return `<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`; }
function text(x,y,value,cls='exp-label',anchor='start') { return `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${value}</text>`; }
function arrow(x1,y1,x2,y2,cls='exp-force') {
  const angle=Math.atan2(y2-y1,x2-x1),size=10;
  return `${line(x1,y1,x2,y2,cls)}<path class="${cls}" d="M${x2-size*Math.cos(angle-.48)},${y2-size*Math.sin(angle-.48)} L${x2},${y2} L${x2-size*Math.cos(angle+.48)},${y2-size*Math.sin(angle+.48)}"/>`;
}
function arc(cx,cy,r,start,end,cls='exp-angle') {
  const p=a=>[cx+r*Math.cos(rad(a)),cy-r*Math.sin(rad(a))];
  const a=p(start),b=p(end);
  return `<path class="${cls}" d="M${a[0]},${a[1]} A${r},${r} 0 ${Math.abs(end-start)>180?1:0} ${end>start?0:1} ${b[0]},${b[1]}"/>`;
}
function svg(content,id,label) {
  return `<svg class="exp-svg" viewBox="0 0 700 420" role="img" aria-label="${label}"><defs><radialGradient id="${id}-earth"><stop offset="0" stop-color="#427a89"/><stop offset=".65" stop-color="#193f56"/><stop offset="1" stop-color="#081c2a"/></radialGradient><linearGradient id="${id}-panel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#264d59"/><stop offset="1" stop-color="#102833"/></linearGradient></defs>${content}</svg>`;
}
function drawing(type,s,r,id) {
  if(type==='leverage') {
    const pivot=160,end=pivot+s.arm*210,armY=250;
    return svg(`${text(45,48,'A FORCE. A DISTANCE. A TURN.','exp-diagram-kicker')}
      <path class="exp-support" d="M160,257 L130,310 H190 Z"/>${line(110,314,210,314,'exp-ground')}
      <rect class="exp-lever" x="130" y="239" width="${end-120}" height="22" rx="11"/><circle class="exp-joint" cx="160" cy="250" r="10"/>
      ${arrow(end,250-60-s.force*.65,end,232)}${text(Math.min(end+17,605),164-s.force*.2,`${fmt(s.force)} N`,'exp-gold-label')}
      ${line(pivot,340,end,340,'exp-dimension')}${line(pivot,330,pivot,350,'exp-dimension')}${line(end,330,end,350,'exp-dimension')}${text((pivot+end)/2,370,`${fmt(s.arm)} m`,'exp-label','middle')}
      <path class="exp-torque" d="M113,198 A72,72 0 0 1 229,270"/>${arrow(230,260,227,280,'exp-torque')}
      ${text(56,205,'τ','exp-large-symbol')}${text(125,397,'Pivot','exp-muted-label')}${text(420,395,'Force remains perpendicular','exp-muted-label')}`,
    id,`A ${s.force} newton perpendicular force acts ${s.arm} meters from the pivot, producing ${fmt(r.torque)} newton meters of torque.`);
  }
  if(type==='ramp') {
    const scale=Math.min(460/s.run,225/s.height),x=100,y=335,ex=x+s.run*scale,ey=y-s.height*scale;
    const bx=x+(ex-x)*.59,by=y+(ey-y)*.59,angle=r.angle;
    return svg(`${text(45,45,'LUNAR GRAVITY · 1.62 m/s²','exp-diagram-kicker')}
      <path class="exp-ramp-fill" d="M${x},${y} L${ex},${ey} L${ex},${y} Z"/>${line(x,y,ex,ey,'exp-ramp-edge')}${line(65,y+2,630,y+2,'exp-ground')}
      <g transform="translate(${bx},${by}) rotate(${-angle})"><rect class="exp-load" x="-29" y="-48" width="58" height="47" rx="6"/>${text(0,-19,`${s.mass} kg`,'exp-load-label','middle')}${arrow(0,-66,100,-66)}</g>
      ${text(Math.min(ex+35,620),(y+ey)/2,`${fmt(s.height)} m`,'exp-label')}${line(ex+20,ey,ex+20,y,'exp-dimension')}${line(ex+13,ey,ex+27,ey,'exp-dimension')}${line(ex+13,y,ex+27,y,'exp-dimension')}
      ${line(x,370,ex,370,'exp-dimension')}${line(x,363,x,377,'exp-dimension')}${line(ex,363,ex,377,'exp-dimension')}${text((x+ex)/2,401,`${fmt(s.run)} m horizontal run`,'exp-label','middle')}
      ${arc(x,y,75,0,angle)}${text(x+85,y-12,`${fmt(angle,1)}°`,'exp-gold-label')}`,
    id,`A ${s.mass} kilogram load travels up a frictionless lunar ramp rising ${s.height} meters over a horizontal run of ${s.run} meters. The slope is ${fmt(angle,1)} degrees.`);
  }
  if(type==='orbit') {
    const cx=334,cy=211,R=166,earth=R*PHYSICS.earthRadiusKm/r.radius;
    const px=cx+R*Math.cos(rad(32)),py=cy-R*Math.sin(rad(32));
    return svg(`${text(38,43,'CIRCULAR EARTH ORBIT','exp-diagram-kicker')}<circle class="exp-orbit-halo" cx="${cx}" cy="${cy}" r="${earth+7}"/><circle fill="url(#${id}-earth)" stroke="#75c9db" stroke-opacity=".55" cx="${cx}" cy="${cy}" r="${earth}"/>
      <ellipse class="exp-earth-latitude" cx="${cx}" cy="${cy}" rx="${earth}" ry="${earth*.32}"/><ellipse class="exp-earth-latitude" cx="${cx}" cy="${cy}" rx="${earth*.35}" ry="${earth}"/>
      <circle class="exp-orbit-path" cx="${cx}" cy="${cy}" r="${R}"/>${line(cx,cy,px,py,'exp-radius')}
      <g transform="translate(${px},${py}) rotate(58)"><rect class="exp-solar-wing" x="-33" y="-5" width="22" height="10"/><rect class="exp-solar-wing" x="11" y="-5" width="22" height="10"/><rect class="exp-spacecraft" x="-8" y="-10" width="16" height="20" rx="3"/></g>
      ${arrow(px+12,py+18,px+48,py+77,'exp-velocity')}${text(px+43,py+106,'v','exp-gold-label')}${text(cx,cy+5,'EARTH','exp-earth-name','middle')}
      ${text(40,376,`Altitude ${fmt(s.altitude)} km`,'exp-label')}${text(40,400,`Orbital radius ${fmt(r.radius)} km`,'exp-muted-label')}${text(505,365,'Gravity curves','exp-muted-label')}${text(505,387,'the path.','exp-muted-label')}`,
    id,`Circular orbit ${s.altitude} kilometers above Earth. Orbital radius is ${r.radius} kilometers. The velocity is tangent to the circular path.`);
  }
  if(type==='rotation') {
    const cx=332,cy=211,R=70+s.radius/500*100;
    let spokes='';for(let a=0;a<360;a+=45) spokes+=line(cx,cy,cx+R*Math.cos(rad(a)),cy+R*Math.sin(rad(a)),'exp-spoke');
    return svg(`${text(38,43,'THE FLOOR PUSHES INWARD','exp-diagram-kicker')}${spokes}<circle class="exp-ring-outer" cx="${cx}" cy="${cy}" r="${R}"/><circle class="exp-ring-inner" cx="${cx}" cy="${cy}" r="${R-17}"/><circle class="exp-hub" cx="${cx}" cy="${cy}" r="20"/>
      ${line(cx,cy,cx,cy+R,'exp-dimension')}${text(cx-13,cy+R*.64,`${fmt(s.radius)} m`,'exp-label','end')}
      <g transform="translate(${cx+R-4},${cy})"><circle class="exp-person" cx="-27" cy="0" r="6"/>${line(-21,0,-10,0,'exp-person-line')}${line(-10,0,0,-8,'exp-person-line')}${line(-10,0,0,8,'exp-person-line')}${line(-17,0,-12,-12,'exp-person-line')}</g>
      ${arrow(cx+R-42,cy,cx+15,cy,'exp-velocity')}${text(cx+R+18,cy+6,'Floor','exp-label')}
      ${arc(cx,cy,R+27,45,135,'exp-rotation-arc')}${arrow(cx-(R+27)*.707,cy-(R+27)*.707,cx-(R+27)*.707-8,cy-(R+27)*.707+9,'exp-rotation-arc')}
      ${text(cx,405,`${fmt(s.rpm,1)} rotations per minute`,'exp-gold-label','middle')}`,
    id,`A ring of radius ${s.radius} meters rotates at ${s.rpm} revolutions per minute. The arrow shows inward centripetal acceleration at the floor.`);
  }
  if(type==='solar') {
    const cx=435,cy=232,a=rad(s.angle),dx=-Math.sin(a)*112,dy=Math.cos(a)*112,nx=cx-Math.cos(a)*135,ny=cy-Math.sin(a)*135;
    let rays='';for(const y of [142,187,277,322]) rays+=arrow(52,y,247,y,'exp-light-ray');
    return svg(`${text(38,43,'DIRECT LIGHT MEETS A TILTED SURFACE','exp-diagram-kicker')}${rays}${arrow(52,cy,cx-10,cy,'exp-light-ray')}
      ${line(cx+dx,cy+dy,cx-dx,cy-dy,'exp-solar-panel-shadow')}${line(cx+dx,cy+dy,cx-dx,cy-dy,'exp-solar-panel')}
      ${line(cx,cy,nx,ny,'exp-normal')}${text(nx-10,ny-12,'Normal','exp-cyan-label','end')}
      ${arc(cx,cy,67,180,180-s.angle)}${text(cx-83,cy-43,`${s.angle}°`,'exp-gold-label','middle')}
      <circle class="exp-sun" cx="52" cy="232" r="24"/>${text(53,375,'INCOMING LIGHT','exp-diagram-kicker')}${text(468,369,`${fmt(r.fraction*100,1)}%`,'exp-large-cyan')}${text(468,396,'of normal-incidence output','exp-muted-label')}`,
    id,`The panel normal is ${s.angle} degrees from the incoming light direction. The cosine projection is ${fmt(r.fraction*100,1)} percent.`);
  }
  if(type==='cooling') {
    const size=95+Math.sqrt(s.area/300)*125,px=290,py=219,left=px-size*.58,top=py-size*.63,w=size*1.16,h=size*1.26;
    let grid='';for(let i=1;i<5;i++)grid+=line(left+w*i/5,top,left+w*i/5,top+h,'exp-radiator-grid');for(let i=1;i<7;i++)grid+=line(left,top+h*i/7,left+w,top+h*i/7,'exp-radiator-grid');
    let rays='';if(Math.abs(r.netKW)>.0001)for(let i=0;i<4;i++){const yy=top+h*(i+1)/5,x1=left+w+25,x2=590; rays+=r.netKW>0?arrow(x1,yy,x2,yy,'exp-thermal-ray'):arrow(x2,yy,x1,yy,'exp-thermal-ray');}
    return svg(`${text(38,43,'NET THERMAL RADIATION','exp-diagram-kicker')}<rect class="exp-radiator-glow" x="${left-10}" y="${top-10}" width="${w+20}" height="${h+20}" rx="17"/><rect class="exp-radiator" x="${left}" y="${top}" width="${w}" height="${h}" rx="8"/>${grid}${rays}
      <rect class="exp-number-scrim" x="${px-76}" y="${py-31}" width="152" height="62" rx="8"/>${text(px,py+8,`${s.temperature} K`,'exp-surface-temperature','middle')}
      ${text(px,390,`${fmt(s.area)} m² radiating face`,'exp-label','middle')}${text(525,78,`${s.background} K`,'exp-gold-label','middle')}${text(525,101,'background','exp-muted-label','middle')}${text(530,376,Math.abs(r.netKW)<.0001?'Balanced':r.netKW>0?'Heat leaves':'Heat enters','exp-gold-label','middle')}`,
    id,`A ${s.area} square meter radiating face is at ${s.temperature} kelvins, with emissivity ${s.emissivity}. The background is ${s.background} kelvins. Net heat transfer is ${fmt(r.netKW)} kilowatts outward.`);
  }
  if(type==='uncertainty') {
    const x=v=>64+(v-8.5)/3*574,base=293,mean=x(r.mean),reference=x(10),stacks=new Map();
    const dots=r.samples.map((value,index)=>{const key=Math.round(value*100),n=stacks.get(key)||0;stacks.set(key,n+1);return `<circle class="exp-sample" cx="${x(value)}" cy="${base-18-n*23}" r="7"><title>Reading ${index+1}: ${fmt(value,3)} mm</title></circle>`;}).join('');
    let ticks='';for(let value=8.5;value<=11.5;value+=.5)ticks+=line(x(value),base,x(value),base+8,'exp-axis')+text(x(value),base+31,fmt(value,1),'exp-axis-label','middle');
    return svg(`${text(38,43,'ONE REFERENCE. MANY READINGS.','exp-diagram-kicker')}${line(reference,90,reference,base,'exp-reference')}${text(reference,77,'10 mm reference','exp-cyan-label','middle')}${line(mean,122,mean,base,'exp-mean-line')}
      ${line(x(r.mean-r.stddev),120,x(r.mean+r.stddev),120,'exp-spread-line')}${line(x(r.mean-r.stddev),111,x(r.mean-r.stddev),129,'exp-spread-line')}${line(x(r.mean+r.stddev),111,x(r.mean+r.stddev),129,'exp-spread-line')}${text(mean,149,'±1 sample standard deviation','exp-small-gold','middle')}
      ${line(64,base,638,base,'exp-axis')}${dots}${ticks}${text(350,355,'Measured dimension · mm','exp-muted-label','middle')}${text(40,399,`${r.samples.length} scripted readings`,'exp-muted-label')}${text(657,399,`Mean ${fmt(r.mean,3)} mm`,'exp-gold-label','end')}`,
    id,`${r.samples.length} scripted dimension readings. Mean ${fmt(r.mean,3)} millimeters, sample standard deviation ${fmt(r.stddev,3)} millimeters. The reference is 10 millimeters.`);
  }
  const scale=60,cx=348,cy=215,ex=cx+r.elbowX*scale,ey=cy-r.elbowY*scale,tx=cx+r.x*scale,ty=cy-r.y*scale;
  return svg(`${text(38,43,'JOINT SPACE → PHYSICAL SPACE','exp-diagram-kicker')}<circle class="exp-workspace" cx="${cx}" cy="${cy}" r="${(1+s.forearm)*scale}"/><circle class="exp-workspace" cx="${cx}" cy="${cy}" r="${Math.abs(1-s.forearm)*scale}"/>
    ${arrow(105,cy,613,cy,'exp-coordinate')}${arrow(cx,389,cx,65,'exp-coordinate')}${text(626,cy+5,'x','exp-muted-label')}${text(cx+10,77,'y','exp-muted-label')}
    ${line(tx,ty,tx,cy,'exp-projection')}${line(cx,ty,tx,ty,'exp-projection')}
    ${line(cx,cy,ex,ey,'exp-arm-one')}${line(ex,ey,tx,ty,'exp-arm-two')}<circle class="exp-robot-base" cx="${cx}" cy="${cy}" r="13"/><circle class="exp-robot-joint" cx="${ex}" cy="${ey}" r="10"/>
    <g transform="translate(${tx},${ty}) rotate(${-r.toolAngle})"><path class="exp-gripper" d="M0,-13 H14 V-6 M0,13 H14 V6 M0,-13 V13"/></g>
    ${arc(cx,cy,36,0,s.shoulder)}${arc(ex,ey,29,s.shoulder,s.shoulder+s.elbow,'exp-elbow-angle')}
    <circle class="exp-tool-point" cx="${tx}" cy="${ty}" r="4"/>${text(40,367,`Upper arm 1.00 m`,'exp-muted-label')}${text(40,393,`Forearm ${fmt(s.forearm,2)} m`,'exp-muted-label')}${text(661,372,`x ${fmt(r.x,3)} m`,'exp-cyan-label','end')}${text(661,399,`y ${fmt(r.y,3)} m`,'exp-gold-label','end')}`,
  id,`A two-link arm has shoulder angle ${s.shoulder} degrees, relative elbow angle ${s.elbow} degrees, and forearm length ${s.forearm} meters. The tool is at x ${fmt(r.x,3)} and y ${fmt(r.y,3)} meters.`);
}

function metrics(type,s,r) {
  if(type==='leverage')return {label:'Turning moment',value:fmt(r.torque),unit:'N·m',secondary:[['Force',`${fmt(s.force)} N`],['Distance',`${fmt(s.arm)} m`]],substitution:`${fmt(s.force)} N × ${fmt(s.arm)} m = ${fmt(r.torque)} N·m`};
  if(type==='ramp')return {label:'Force along ramp',value:fmt(r.force,1),unit:'N',secondary:[['Travel along ramp',`${fmt(r.length)} m`],['Work against gravity',`${fmt(r.work)} J`]],substitution:`${s.mass} × 1.62 × ${s.height} ÷ ${fmt(r.length,3)} = ${fmt(r.force,1)} N`};
  if(type==='orbit')return {label:'Circular-orbit speed',value:fmt(r.speed,3),unit:'km/s',secondary:[['Orbital period',`${fmt(r.period/60,1)} min`],['Kinetic energy',`${fmt(r.energyMJ/1000,2)} GJ`]],substitution:`√(398,600.4418 ÷ ${fmt(r.radius)}) = ${fmt(r.speed,3)} km/s`};
  if(type==='rotation')return {label:'Floor acceleration',value:fmt(r.earthG,3),unit:'Earth g',secondary:[['Acceleration',`${fmt(r.acceleration)} m/s²`],['Rim speed',`${fmt(r.speed)} m/s`]],substitution:`(${fmt(s.rpm)} × 2π ÷ 60)² × ${fmt(s.radius)} = ${fmt(r.acceleration)} m/s²`};
  if(type==='solar')return {label:'Ideal direct-beam output',value:fmt(r.output,1),unit:'kW',secondary:[['Projection',`${fmt(r.fraction*100,1)}%`],['Normal-incidence output',`${s.power} kW`]],substitution:`${s.power} × cos(${s.angle}°) = ${fmt(r.output,1)} kW`};
  if(type==='cooling')return {label:r.netKW<0?'Net heat absorbed':'Net heat rejected',value:fmt(Math.abs(r.netKW),2),unit:'kW',secondary:[['Surface temperature',`${fmt(r.celsius,1)} °C`],['Emissivity',fmt(s.emissivity,2)]],substitution:`${fmt(s.emissivity)} × σ × ${s.area} × (${s.temperature}⁴ − ${s.background}⁴) = ${fmt(r.netKW,2)} kW outward`};
  if(type==='uncertainty')return {label:'Mean reading',value:fmt(r.mean,3),unit:'mm',secondary:[['Sample standard deviation',`${fmt(r.stddev,3)} mm`],['Mean − reference',`${r.bias>1e-10?'+':''}${fmt(r.bias,3)} mm`]],substitution:`n = ${r.samples.length}; range ${fmt(r.min,3)} to ${fmt(r.max,3)} mm`};
  return {label:'Tool height · y',value:fmt(r.y,3),unit:'m',secondary:[['Horizontal position · x',`${fmt(r.x,3)} m`],['Distance from shoulder',`${fmt(r.reach,3)} m`]],substitution:`y = sin(${s.shoulder}°) + ${fmt(s.forearm)} sin(${s.shoulder+s.elbow}°) = ${fmt(r.y,3)} m`};
}

function controlMarkup(control,state,id) {
  const [key,label,min,max,step,unit]=control,value=state[key];
  return `<div class="exp-control"><div class="exp-control-label"><label for="${id}-${key}">${label}</label><output data-value="${key}" for="${id}-${key}">${fmt(value,2)}<span>${unit}</span></output></div><input id="${id}-${key}" name="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" aria-valuetext="${fmt(value,2)} ${unit}" style="--exp-fill:${(value-min)/(max-min)*100}%"><div class="exp-range-labels" aria-hidden="true"><span>${min}${unit?' '+unit:''}</span><span>${max}${unit?' '+unit:''}</span></div></div>`;
}

let mounted=0;
export function mountExperiment(container,type) {
  if(!TYPES[type])throw new RangeError(`Unknown experiment: ${type}`);
  if(!container||typeof container.replaceChildren!=='function')throw new TypeError('A DOM container is required.');
  const config=TYPES[type],id=`experiment-${type}-${++mounted}`;
  let state={...config.base},timer;
  const root=document.createElement('section');root.className=`exp-shell exp-${type}`;root.setAttribute('aria-labelledby',`${id}-title`);
  root.innerHTML=`<header class="exp-heading"><div><p class="exp-kicker">${config.tag}</p><h3 id="${id}-title">${config.name}</h3></div><button class="exp-reset" type="button" data-reset aria-label="Reset ${type} experiment">↺ <span>Reset</span></button></header><p class="exp-challenge"><span aria-hidden="true">↗</span><strong>Try this</strong> ${config.challenge}</p><div class="exp-stage"><div class="exp-figure"></div><div class="exp-readout"></div></div><div class="exp-controls" style="--exp-control-count:${config.controls.length}">${config.controls.map(control=>controlMarkup(control,state,id)).join('')}</div><div class="exp-extra"></div><div class="exp-explanation"><div class="exp-equation"><span>The relationship</span><p>${config.formula.replaceAll('\n','<br>')}</p><output class="exp-substitution"></output></div><p class="exp-connection">${config.connection}</p></div><details class="exp-details"><summary>Model details <span aria-hidden="true">+</span></summary><p>${config.details}</p></details><span class="exp-sr-only" aria-live="polite" aria-atomic="true"></span>`;
  container.replaceChildren(root);
  const figure=root.querySelector('.exp-figure'),readout=root.querySelector('.exp-readout'),extra=root.querySelector('.exp-extra'),substitution=root.querySelector('.exp-substitution'),live=root.querySelector('.exp-sr-only');
  function render(announce=true) {
    const result=calculations[type](state),m=metrics(type,state,result);
    figure.innerHTML=drawing(type,state,result,id);
    readout.innerHTML=`<p class="exp-result-label">${m.label}</p><div class="exp-result-number">${m.value}<span>${m.unit}</span></div><dl>${m.secondary.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
    substitution.textContent=m.substitution;
    if(type==='cooling')extra.innerHTML=`<fieldset class="exp-background"><legend>Radiative background</legend>${[[3,'Cold space'],[200,'Cool environment'],[300,'Warm environment']].map(([value,label])=>`<label><input type="radio" name="${id}-background" value="${value}" ${state.background===value?'checked':''}><span>${label}<small>${value} K</small></span></label>`).join('')}</fieldset>`;
    if(type==='uncertainty')extra.innerHTML=`<div class="exp-repeat-row"><button type="button" class="exp-repeat" data-repeat ${state.count>=20?'disabled':''}>${state.count>=20?'All 20 readings shown':'＋ Reveal the next reading'}</button><span>${state.count} / 20 scripted measurements</span></div>`;
    if(announce){clearTimeout(timer);timer=setTimeout(()=>{live.textContent=`${m.label}: ${m.value} ${m.unit}. ${m.secondary.map(item=>item.join(': ')).join('. ')}.`;},180);}
  }
  function updateControls() {
    for(const control of config.controls){const[key,label,min,max,step,unit]=control,input=root.querySelector(`input[name="${key}"]`),value=state[key];input.value=value;input.setAttribute('aria-valuetext',`${fmt(value,2)} ${unit}`);input.style.setProperty('--exp-fill',`${(value-control[2])/(control[3]-control[2])*100}%`);root.querySelector(`[data-value="${key}"]`).innerHTML=`${fmt(value,2)}<span>${unit}</span>`;}
  }
  function input(event){const target=event.target;if(!target.matches('input[type="range"]'))return;state[target.name]=Number(target.value);updateControls();render();}
  function change(event){if(event.target.matches('input[type="radio"]')){state.background=Number(event.target.value);render();const radio=root.querySelector(`input[type="radio"][value="${state.background}"]`);radio?.focus({preventScroll:true});}}
  function click(event){if(event.target.closest('[data-reset]')){state={...config.base};updateControls();render();}if(event.target.closest('[data-repeat]')&&state.count<20){state.count++;render();const target=root.querySelector(state.count>=20?'[data-reset]':'[data-repeat]');target?.focus({preventScroll:true});}}
  root.addEventListener('input',input);root.addEventListener('change',change);root.addEventListener('click',click);render(false);
  return()=>{clearTimeout(timer);root.removeEventListener('input',input);root.removeEventListener('change',change);root.removeEventListener('click',click);root.remove();};
}
