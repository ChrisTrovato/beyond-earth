/* An explicit teaching model. Pure calculations are exported for verification. */
export const BUILDER_CONSTANTS = Object.freeze({crew:8, solarKW:20, batteryKWh:40, usableFraction:.8, dischargeEfficiency:.9, chargeEfficiency:.9, batteryPowerKW:10, radiatorKW:20, personHeatKW:.2, maxPieces:25});
export const CATALOG = Object.freeze({
  habitat:{name:'Habitat',short:'Hab',icon:'⌂',category:'Living',mass:6,load:4,capacity:4,color:'#c5dcdf',detail:'4 berths · 4 kW demand',why:'A room also becomes an electrical and thermal load.'},
  air:{name:'Air processor',short:'Air',icon:'◉',category:'Life support',mass:2,load:3,capacity:8,color:'#8ce9e2',detail:'8 people · 3 kW demand',why:'Air processing needs both power and a way to reject heat.'},
  water:{name:'Water processor',short:'Water',icon:'≋',category:'Life support',mass:2,load:2,capacity:8,color:'#79bff2',detail:'8 people · 2 kW demand',why:'The modeled capacity must cover the arriving crew.'},
  comms:{name:'Control & radio',short:'Control',icon:'⌁',category:'Operations',mass:1,load:1,capacity:1,color:'#c9b6fb',detail:'1 control link · 1 kW demand',why:'The crew needs the control and communications service.'},
  stores:{name:'Crew stores',short:'Stores',icon:'▦',category:'Living',mass:2,load:0,capacity:8,color:'#d8ab7a',detail:'Supplies for 8 · no modeled load',why:'Food and initial supplies are imported in this exercise.'},
  solar:{name:'Solar wing',short:'Solar',icon:'▰',category:'Energy',mass:1.8,load:0,capacity:20,color:'#69cce7',detail:'20 kW at full sunlight',why:'Instantaneous generation changes with the daylight setting.'},
  battery:{name:'Battery bank',short:'Battery',icon:'▤',category:'Energy',mass:1.2,load:0,capacity:40,color:'#f6bd60',detail:'40 kWh nameplate · 10 kW limit',why:'One full bank delivers 28.8 kWh after the modeled limits.'},
  radiator:{name:'Radiator wing',short:'Radiator',icon:'▥',category:'Thermal',mass:1,load:0,capacity:20,color:'#9bd7dc',detail:'20 kW heat rejection · choose A or B',why:'A wing on an isolated cooling branch cannot reject heat.'},
  workshop:{name:'Workshop',short:'Workshop',icon:'⚙',category:'Optional work',mass:3,load:8,capacity:0,optional:true,color:'#efb86f',detail:'8 kW when operating',why:'Pause its electrical work to reduce both power demand and heat.'},
  garden:{name:'Growing room',short:'Garden',icon:'♧',category:'Optional work',mass:3,load:6,capacity:0,optional:true,color:'#a5d899',detail:'6 kW when operating',why:'This is a cultivation trial; crew food still comes from stores.'}
});
export const SCENARIOS = Object.freeze([
  {id:'firstcrew',number:'01',title:'The first crew',subtitle:'Turn delivered hardware into a working place.',hours:1,recovery:0,budget:25,crew:8,accent:'cyan',brief:'Eight people are on their way. Give them the five core services, balance the power and heat, then commission the site for one hour.',eventTitle:'Commissioning run',event:'The crew connects to the settlement. Every supporting service now has to work together.',lesson:'circuits-and-the-power-ledger',chapter:'05'},
  {id:'sunlightoutage',number:'02',title:'When the light goes out',subtitle:'Energy has to last longer than a moment.',hours:8,recovery:8,budget:32,crew:8,accent:'gold',brief:'Survive eight hours without solar generation. Then restore the full battery reserve within eight hours of sunlight. Your workshop can wait.',eventTitle:'Eight hours of darkness',event:'The arrays enter shadow. The batteries must cover every kilowatt the crew still needs.',lesson:'algebra-for-a-service-window',chapter:'10'},
  {id:'coolingfailure',number:'03',title:'The missing cooling branch',subtitle:'Two branches can still leave a difficult choice.',hours:2,recovery:0,budget:34,crew:8,accent:'lilac',brief:'Cooling branch A must be isolated for two hours. Keep the crew supported. Add capacity to branch B, pause optional work, or combine the two.',eventTitle:'Branch A is isolated',event:'A restriction has taken branch A out of service. Its installed radiators are still on the map, but their available capacity is zero.',lesson:'reliability-and-shared-failures',chapter:'11'}
]);
const KEY='beyond-earth-settlement-builder-v1';
const slots=[12,7,11,13,17,6,8,16,18,2,10,14,22,1,3,5,9,15,19,21,23,0,4,20,24];
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const scenarioFor=id=>SCENARIOS.find(s=>s.id===id)||SCENARIOS[0];
const copy=s=>({...s,pieces:s.pieces.map(p=>({...p})),event:{...s.event,history:(s.event?.history||[]).map(x=>({...x}))}});
const fmt=(n,d=1)=>Number.isFinite(n)?new Intl.NumberFormat('en-US',{maximumFractionDigits:d}).format(Math.abs(n)<1e-8?0:n):'—';
const eventEmpty=()=>({phase:'design',elapsed:0,energy:null,reason:'',history:[]});
const defaultPiece=(type,id,slot,branch='A')=>({type,id,slot,branch,enabled:true});

export function createBuilderState(scenarioId='firstcrew'){
  const scenario=scenarioFor(scenarioId);
  let types=['habitat','solar'];
  if(scenario.id==='sunlightoutage')types=['habitat','habitat','air','water','comms','stores','solar','radiator','battery','workshop'];
  if(scenario.id==='coolingfailure')types=['habitat','habitat','air','water','comms','stores','solar','solar','radiator','radiator','battery','workshop','garden'];
  let radiators=0;
  return {version:1,scenarioId:scenario.id,sunlight:1,pieces:types.map((type,i)=>defaultPiece(type,`u${i+1}`,slots[i],type==='radiator'&&radiators++%2?'B':'A')),nextId:types.length+1,selectedId:null,layer:'power',event:eventEmpty()};
}

export function calculateSettlement(state,{dark=false,failedBranch=null}={}){
  const c=BUILDER_CONSTANTS,s=scenarioFor(state.scenarioId),counts=Object.fromEntries(Object.keys(CATALOG).map(k=>[k,0]));
  let mass=0,load=0,branchA=0,branchB=0;
  for(const p of state.pieces){const item=CATALOG[p.type];if(!item)continue;counts[p.type]++;mass+=item.mass;if(!item.optional||p.enabled!==false)load+=item.load;if(p.type==='radiator'){if(p.branch==='B')branchB+=c.radiatorKW;else branchA+=c.radiatorKW;}}
  const sunlight=Math.max(0,Math.min(1,Number(state.sunlight)||0));
  const generationDay=counts.solar*c.solarKW*sunlight,generation=dark?0:generationDay;
  const storageCapacity=counts.battery*c.batteryKWh*c.usableFraction;
  const stored=state.event?.energy==null?storageCapacity:Math.max(0,Math.min(storageCapacity,state.event.energy));
  const batteryPower=counts.battery*c.batteryPowerKW;
  const deficit=Math.max(0,load-generation),chargeInput=Math.min(batteryPower,Math.max(0,generation-load));
  const heat=load+s.crew*c.personHeatKW,heatCapacity=(failedBranch==='A'?0:branchA)+(failedBranch==='B'?0:branchB);
  const blackoutDelivered=load*s.hours,blackoutStored=blackoutDelivered/c.dischargeEfficiency;
  const daylightCharge=Math.min(batteryPower,Math.max(0,generationDay-load))*c.chargeEfficiency;
  return {counts,mass,load,sunlight,generation,generationDay,powerMargin:generation-load,storageCapacity,stored,delivered:stored*c.dischargeEfficiency,fullDelivered:storageCapacity*c.dischargeEfficiency,batteryPower,chargeInput,chargeStoredRate:chargeInput*c.chargeEfficiency,deficit,endurance:deficit>0?stored*c.dischargeEfficiency/deficit:Infinity,heat,heatCapacity,branchA,branchB,heatMargin:heatCapacity-heat,berths:counts.habitat*4,airCapacity:counts.air*8,waterCapacity:counts.water*8,storesCapacity:counts.stores*8,links:counts.comms,blackoutDelivered,blackoutStored,rechargeHours:daylightCharge>0?blackoutStored/daylightCharge:Infinity,daylightCharge};
}

function serviceGaps(m,s){
  const gaps=[];
  if(m.berths<s.crew)gaps.push(`${s.crew-m.berths} more berths`);
  if(m.airCapacity<s.crew)gaps.push('air-processing capacity');
  if(m.waterCapacity<s.crew)gaps.push('water-processing capacity');
  if(m.storesCapacity<s.crew)gaps.push('crew supplies');
  if(m.links<1)gaps.push('a control and radio unit');
  return gaps;
}

export function evaluateObjectives(state){
  const s=scenarioFor(state.scenarioId),m=calculateSettlement(state,{failedBranch:s.id==='coolingfailure'?'A':null}),gaps=serviceGaps(m,s);
  const checks=[
    {id:'services',title:`Support all ${s.crew} residents`,pass:!gaps.length,detail:gaps.length?`Still needed: ${gaps.join(', ')}.`:'Berths, air, water, stores, and control are present.'},
    {id:'power',title:'Balance daylight power',pass:m.generationDay+1e-7>=m.load,detail:`${fmt(m.generationDay)} kW generated / ${fmt(m.load)} kW demanded.`},
    {id:'heat',title:s.id==='coolingfailure'?'Keep heat moving with A isolated':'Give the heat a destination',pass:m.heatCapacity+1e-7>=m.heat,detail:`${fmt(m.heatCapacity)} kW available / ${fmt(m.heat)} kW to reject${s.id==='coolingfailure'?' on branch B':''}.`},
    {id:'freight',title:'Stay within the freight allowance',pass:m.mass<=s.budget+1e-7,detail:`${fmt(m.mass)} of ${s.budget} tonnes allocated.`}
  ];
  if(s.id==='sunlightoutage')checks.push(
    {id:'reserve',title:'Carry eight hours of usable energy',pass:m.fullDelivered+1e-7>=m.blackoutDelivered&&m.batteryPower+1e-7>=m.load,detail:`${fmt(m.fullDelivered)} / ${fmt(m.blackoutDelivered)} kWh delivered; ${fmt(m.batteryPower)} / ${fmt(m.load)} kW discharge power.`},
    {id:'recharge',title:'Refill in eight hours of sunlight',pass:m.rechargeHours<=s.recovery+1e-7,detail:Number.isFinite(m.rechargeHours)?`${fmt(m.rechargeHours)} sunlight hours needed after the full outage.`:'No charging surplus is available.'}
  );
  checks.push({id:'test',title:`Complete the ${s.hours+s.recovery}-hour test`,pass:state.event?.phase==='complete',detail:state.event?.phase==='complete'?'The operating sequence held together.':state.event?.phase==='failed'?state.event.reason:'A promising layout becomes evidence when you run it.'});
  return checks;
}

export function startSettlementTest(state){
  const next=copy(state),m=calculateSettlement(state);
  next.event={phase:'running',elapsed:0,energy:m.storageCapacity,reason:'',history:[{hour:0,energy:m.fullDelivered,stage:scenarioFor(state.scenarioId).id==='sunlightoutage'?'dark':'day'}]};
  return next;
}

export function advanceSettlement(state,hours=1){
  const next=copy(state);if(next.event.phase!=='running')return next;
  let remaining=Math.max(0,Math.min(24,Number(hours)||0));const s=scenarioFor(next.scenarioId),c=BUILDER_CONSTANTS,total=s.hours+s.recovery;
  const fail=reason=>{next.event.phase='failed';next.event.reason=reason;};
  while(remaining>1e-8&&next.event.phase==='running'){
    const dark=s.id==='sunlightoutage'&&next.event.elapsed<s.hours-1e-8;
    const boundary=dark?s.hours:total;
    const dt=Math.min(remaining,boundary-next.event.elapsed);
    if(dt<=1e-8)break;
    const m=calculateSettlement(next,{dark,failedBranch:s.id==='coolingfailure'?'A':null}),gaps=serviceGaps(m,s);
    if(gaps.length){fail(`The crew still needs ${gaps.join(', ')}.`);break;}
    if(m.mass>s.budget+1e-7){fail('The shipment exceeds the freight allowance. Remove or exchange hardware.');break;}
    if(m.heat>m.heatCapacity+1e-7){fail(`${fmt(m.heat-m.heatCapacity)} kW of heat has no modeled rejection path. Pause optional work or add available radiator capacity.`);break;}
    if(m.deficit>m.batteryPower+1e-7){fail(`The ${fmt(m.deficit)} kW electrical deficit exceeds the ${fmt(m.batteryPower)} kW battery discharge limit.`);break;}
    const needed=m.deficit*dt/c.dischargeEfficiency;
    if(needed>next.event.energy+1e-7){const lasted=m.deficit>0?next.event.energy*c.dischargeEfficiency/m.deficit:0;next.event.elapsed+=lasted;next.event.energy=0;next.event.history.push({hour:next.event.elapsed,energy:0,stage:dark?'dark':'day'});fail('The usable battery reserve has run out. Add delivered energy capacity or reduce demand.');break;}
    next.event.energy=Math.min(m.storageCapacity,Math.max(0,next.event.energy-needed+m.chargeStoredRate*dt));
    next.event.elapsed+=dt;remaining-=dt;
    next.event.history.push({hour:next.event.elapsed,energy:next.event.energy*c.dischargeEfficiency,stage:dark?'dark':'day'});
    if(next.event.elapsed>=total-1e-7){
      const final=calculateSettlement(next),unmet=evaluateObjectives(next).find(check=>check.id!=='test'&&!check.pass);
      if(unmet)fail(unmet.detail);
      else if(s.id==='sunlightoutage'&&next.event.energy<final.storageCapacity-1e-6)fail('The crew survived, but the batteries did not refill within the recovery window. Add charging surplus.');
      else {next.event.phase='complete';next.event.reason=s.id==='firstcrew'?'The first crew has a working place.':s.id==='sunlightoutage'?'The lights stayed on, and the reserve is ready for another interruption.':'The crew kept its services while cooling branch A remained isolated.';}
    }
  }
  next.event.history=next.event.history.slice(-50);return next;
}

function cleanStored(raw,id){
  if(!raw||raw.version!==1||!Array.isArray(raw.pieces))return createBuilderState(id);
  const next=createBuilderState(id),occupied=new Set(),ids=new Set();next.pieces=[];
  for(const p of raw.pieces.slice(0,25))if(p&&CATALOG[p.type]&&Number.isInteger(p.slot)&&p.slot>=0&&p.slot<25&&!occupied.has(p.slot)&&/^u\d+$/.test(p.id)&&!ids.has(p.id)){
    next.pieces.push(defaultPiece(p.type,p.id,p.slot,p.branch==='B'?'B':'A'));next.pieces.at(-1).enabled=CATALOG[p.type].optional?p.enabled!==false:true;occupied.add(p.slot);ids.add(p.id);
  }
  next.nextId=Math.max(0,...next.pieces.map(p=>Number(p.id.slice(1))))+1;
  next.sunlight=[.5,.75,1].includes(raw.sunlight)?raw.sunlight:1;
  next.layer=['power','heat','water'].includes(raw.layer)?raw.layer:'power';
  next.selectedId=next.pieces.some(p=>p.id===raw.selectedId)?raw.selectedId:null;
  const event=raw.event,total=scenarioFor(id).hours+scenarioFor(id).recovery;
  if(event&&['running','complete','failed'].includes(event.phase)&&Number.isFinite(event.elapsed)&&event.elapsed>=0&&event.elapsed<=total&&Number.isFinite(event.energy)&&event.energy>=0){
    next.event={phase:event.phase,elapsed:event.elapsed,energy:Math.min(event.energy,calculateSettlement(next).storageCapacity),reason:typeof event.reason==='string'?event.reason.slice(0,300):'',history:Array.isArray(event.history)?event.history.filter(h=>h&&Number.isFinite(h.hour)&&Number.isFinite(h.energy)&&h.hour>=0&&h.energy>=0).slice(-50).map(h=>({hour:h.hour,energy:h.energy,stage:h.stage==='dark'?'dark':'day'})):[]};
  }
  return next;
}

const position=slot=>({x:450+(slot%5-Math.floor(slot/5))*73,y:130+(slot%5+Math.floor(slot/5))*34});
const block=(top='#486875',front='#24414f',side='#18313e')=>`<path d="m-30-22 36-18 33 18-36 19Z" fill="${top}"/><path d="m3-3 36-19v27L3 23Z" fill="${front}"/><path d="m-30-22 33 19v26L-30 4Z" fill="${side}"/>`;
function hardware(type,p,off){
  const dim=off?' opacity=".45"':'';
  const bodies={
    habitat:`<path d="M-36-10v-15q0-21 18-14L29-17q17 9 11 27L7 25Z" fill="#a8bec4"/><path d="m-35-24 43 20v28L-35 5Z" fill="#526f7d"/><ellipse cx="25" cy="4" rx="17" ry="21" fill="#c6d9db" transform="rotate(18 25 4)"/><path d="m-25-17 8 4v8l-8-4m14-1 8 4v8l-8-4" fill="#f6bd60"/><path d="m19-7 10 4v21l-10-4Z" fill="#172d38"/><path d="m19-4 7 3v6l-7-3Z" fill="#e9b963"/>`,
    solar:`<path d="M-5 9v-21m29 6v22" stroke="#6b8491" stroke-width="5"/><path d="m-42-25 57-29 40 23-57 30Z" fill="#124557" stroke="#70b7c9"/><path d="m-28-32 40 23m-26-30 40 23m-26-30 40 23M-29-17l58-29M-16-9l58-29" stroke="#6bc9e6" stroke-width="1"/>`,
    battery:`${block('#8b7958','#6e5b3d','#3b3f3c')}<path d="m-21-14 16 8v8l-16-8m25 5 24-12" stroke="#f6bd60" stroke-width="3"/><path d="m10 10 4-2m6-3 4-2m6-3 4-2" stroke="#8ce9e2" stroke-width="3"/>`,
    radiator:`<path d="M-24 7v-43M19 14v-41" stroke="#637b85" stroke-width="4"/><path d="m-32-49 25-10 8 45-25 11m29-33 25-10 8 45-25 11" fill="${p.branch==='B'?'#846945':'#387381'}" stroke="${p.branch==='B'?'#e7bb70':'#8ce9e2'}"/><path d="m-29-39 25-10m-23 20 25-10m-23 20 25-10m21-2 25-10m-23 20 25-10m-23 20 25-10" stroke="#b6d7dc" opacity=".55"/><text x="-2" y="27" text-anchor="middle" fill="${p.branch==='B'?'#f6bd60':'#8ce9e2'}" font-size="10">${p.branch}</text>`,
    air:`${block()}<circle cx="-12" cy="-6" r="11" fill="#102c36" stroke="#8ce9e2" transform="skewY(25)"/><path d="m-21-15 18 9m-18-4 18 9m-18-4 18 9" stroke="#8ce9e2"/><path d="m11 2 20-10m-20 16 20-10" stroke="#a6cbd1"/>`,
    water:`${block('#476e88','#2b4c64','#253c4b')}<path d="M-21-19v-24m26 12v-24" stroke="#90c0dc" stroke-width="16"/><ellipse cx="-21" cy="-44" rx="8" ry="4" fill="#c2dfeb"/><ellipse cx="5" cy="-56" rx="8" ry="4" fill="#c2dfeb"/><path d="m-21-21 26 12 22-11" fill="none" stroke="#79bff2" stroke-width="4"/>`,
    comms:`${block('#5c657d','#343d54','#273448')}<path d="M4-5v-38" stroke="#8aacc0" stroke-width="4"/><path d="M-24-53q20 35 45 1Z" fill="#c1cdd9" stroke="#eef3f2"/><path d="m0-36 4-22 11 5" fill="none" stroke="#c9b6fb" stroke-width="2"/>`,
    stores:`${block('#9c7a54','#6a4b35','#4e3e35')}<path d="m-19-17 33 18v15m-7-46 33 18v24m-65-15 33 18" fill="none" stroke="#dbb380" stroke-width="3"/>`,
    workshop:`${block('#737d7f','#374c54','#283e48')}<path d="m-21-15 19 9v14l-19-9" fill="#d9ae68"/><path d="M18-13v-34l21 8v22" fill="none" stroke="#e7b76f" stroke-width="4"/><path d="m31-35 12 5" stroke="#263d46" stroke-width="2"/>`,
    garden:`<path d="m-35-3 32 20 41-17-32-19Z" fill="#335644"/><path d="M-35-3q-7-43 15-42 38-7 58 45L-3 17Z" fill="#466f69" stroke="#a5d899"/><path d="M-20-45q-5 28 17 62M-1-40q-5 23 18 48M-33-21l52 21" fill="none" stroke="#8bbaaa"/><path d="m-24-7 8-10 8 16m4-3 6-11 9 9" fill="none" stroke="#c0df8e" stroke-width="3"/>`
  };
  return `<g${dim}>${bodies[type]||block()}</g>`;
}

function boardSVG(state,m,night,failedBranch,instance){
  const ordered=[...state.pieces].sort((a,b)=>position(a.slot).y-position(b.slot).y),map=new Map(state.pieces.map(p=>[p.slot,p]));
  let grid='';for(let i=0;i<25;i++){const {x,y}=position(i);grid+=`<path d="M${x-65} ${y}l65-30 65 30-65 30Z" class="sb-ground-cell ${map.has(i)?'occupied':''}"/>`;}
  const hubs=state.pieces.filter(p=>state.layer==='power'?['solar','battery'].includes(p.type):state.layer==='heat'?p.type==='radiator'&&p.branch!==failedBranch:p.type==='water');
  const loads=state.pieces.filter(p=>state.layer==='water'?['habitat','garden'].includes(p.type):CATALOG[p.type].load>0&&p.enabled!==false);
  const lines=hubs.length?loads.map((p,i)=>{const a=position(p.slot),b=position(hubs[i%hubs.length].slot);return `<path d="M${a.x} ${a.y+14}L${b.x} ${a.y+14}L${b.x} ${b.y+14}" class="sb-network sb-${state.layer}"/>`;}).join(''):'';
  const modules=ordered.map(p=>{const {x,y}=position(p.slot),item=CATALOG[p.type],off=p.enabled===false||(p.type==='radiator'&&p.branch===failedBranch)||(p.type==='solar'&&night),selected=p.id===state.selectedId;return `<g transform="translate(${x} ${y})" class="sb-module ${selected?'selected':''} ${off?'offline':''}" role="button" tabindex="0" data-action="select" data-id="${p.id}" data-focus="map-${p.id}" aria-label="Select ${safe(item.name)}${p.type==='radiator'?', branch '+p.branch:''}${off?', inactive':''}"><title>${safe(item.name)}${p.type==='radiator'?' · branch '+p.branch:''}</title><ellipse cx="0" cy="15" rx="44" ry="18" fill="#000" opacity=".27"/><path d="m-48 9 48-23 48 23-48 23Z" class="sb-selection"/>${hardware(p.type,p,off)}${off?'<circle cx="32" cy="-38" r="8" fill="#10222c" stroke="#f6bd60"/><path d="M28-38h8" stroke="#f6bd60" stroke-width="2"/>':''}</g>`;}).join('');
  return `<svg viewBox="0 0 900 535" class="sb-board-svg ${night?'night':'day'}" role="group" aria-label="Lunar worksite with ${state.pieces.length} modules. Select a module to inspect it; the inventory below provides the same controls."><defs><linearGradient id="${instance}-sky" x2="0" y2="1"><stop stop-color="${night?'#06111f':'#132c38'}"/><stop offset="1" stop-color="#152d36"/></linearGradient><radialGradient id="${instance}-glow"><stop stop-color="#8ce9e2" stop-opacity=".17"/><stop offset="1" stop-color="#8ce9e2" stop-opacity="0"/></radialGradient></defs><rect width="900" height="535" fill="url(#${instance}-sky)"/><ellipse cx="450" cy="340" rx="390" ry="200" fill="url(#${instance}-glow)"/><g fill="#c5e7ed" opacity=".5"><circle cx="70" cy="60" r="1"/><circle cx="220" cy="38" r="1.2"/><circle cx="430" cy="43" r="1"/><circle cx="582" cy="59" r="1.5"/><circle cx="775" cy="34" r="1"/><circle cx="843" cy="119" r="1"/></g><circle cx="${night?760:110}" cy="77" r="25" fill="${night?'#182e3e':'#f2d49a'}"/><path d="M0 226 72 191 123 207 207 166 276 209 365 173 482 211 598 164 710 202 820 157 900 204V535H0Z" fill="#233943" opacity=".65"/><path d="M0 252 111 225 220 257 345 219 470 251 609 221 711 248 842 217 900 249V535H0Z" fill="#1b3039"/><path d="M450 79 853 270 450 465 47 270Z" fill="#2d4247" stroke="#597079" stroke-opacity=".6"/><path d="m47 270 403 195 403-195v15L450 481 47 285Z" fill="#162a32"/>${grid}${lines}${modules}<g fill="#8ba5ac" font-family="ui-monospace,monospace" font-size="10" letter-spacing="2"><text x="32" y="505">MERIDIAN / TRAINING WORKSITE</text><text x="868" y="505" text-anchor="end">${night?'SHADOW':'DAYLIGHT'} · ${state.pieces.length}/25 MODULES</text></g></svg>`;
}

function reserveChart(state,m,s){
  const hist=state.event.history||[],total=s.hours+s.recovery,max=Math.max(m.fullDelivered,1),points=hist.map(h=>`${12+h.hour/total*276},${76-h.energy/max*62}`).join(' ');
  return `<svg viewBox="0 0 300 94" role="img" aria-label="Battery energy history: ${fmt(m.delivered)} kilowatt-hours currently deliverable." class="sb-reserve-chart"><path d="M12 14V76H288" fill="none" stroke="#6d939c55"/>${s.recovery?`<rect x="12" y="14" width="${276*s.hours/total}" height="62" fill="#486cbd17"/><path d="M${12+276*s.hours/total} 14V76" stroke="#f6bd6060" stroke-dasharray="3 4"/>`:''}${hist.length?`<polyline points="${points}" fill="none" stroke="#f6bd60" stroke-width="2.5"/>`:`<path d="M12 14H288" stroke="#f6bd6040" stroke-dasharray="3 5"/>`}<text x="12" y="91">0 h</text><text x="288" y="91" text-anchor="end">${total} h</text></svg>`;
}

let mountCount=0;
export function mountBuilder(container,{missions=[]}={}){
  if(!container||typeof container.replaceChildren!=='function')throw new TypeError('A DOM container is required.');
  const root=document.createElement('div');root.className='sb-app';root.innerHTML='<div class="sb-content"></div><p class="sb-live" role="status" aria-live="polite" aria-atomic="true"></p>';container.replaceChildren(root);
  const content=root.querySelector('.sb-content'),live=root.querySelector('.sb-live'),instance=`sb-${++mountCount}`;let saved={},active='firstcrew',timer=null,disposed=false,saveAvailable=true;
  try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');if(raw&&raw.version===1){active=SCENARIOS.some(s=>s.id===raw.active)?raw.active:active;saved=raw.scenarios&&typeof raw.scenarios==='object'?raw.scenarios:{};}}catch{saveAvailable=false;}
  let state=cleanStored(saved[active],active);
  function persist(){saved[active]=state;try{localStorage.setItem(KEY,JSON.stringify({version:1,active,scenarios:saved}));saveAvailable=true;}catch{saveAvailable=false;}}
  function stop(){if(timer){clearInterval(timer);timer=null;}}
  function announce(message){live.textContent=message;}
  function invalidate(){if(state.event.phase!=='running')state.event=eventEmpty();}
  function environment(){const s=scenarioFor(active),operating=state.event.phase!=='design';return {dark:active==='sunlightoutage'&&operating&&state.event.elapsed<s.hours-1e-7,failedBranch:active==='coolingfailure'&&operating?'A':null};}
  function render(message=''){
    if(disposed)return;const focused=root.contains(document.activeElement)?document.activeElement?.getAttribute('data-focus'):null;
    const s=scenarioFor(active),env=environment(),m=calculateSettlement(state,env),checks=evaluateObjectives(state),ready=checks.filter(c=>c.id!=='test').every(c=>c.pass),running=state.event.phase==='running',finished=state.event.phase==='complete',selected=state.pieces.find(p=>p.id===state.selectedId),selectedItem=selected?CATALOG[selected.type]:null;
    const total=s.hours+s.recovery,progress=Math.min(100,state.event.elapsed/total*100),stage=state.event.phase==='design'?'PLANNING':finished?'TEST COMPLETE':state.event.phase==='failed'?'A LIMIT FOUND':env.dark?'SHADOW WINDOW':active==='sunlightoutage'?'SUNLIGHT / RECOVERY':active==='coolingfailure'?'BRANCH A ISOLATED':'COMMISSIONING';
    const status=state.event.phase==='design'?(ready?'The balances close. Put the operating sequence to the test.':'Add the missing services, then follow the power and heat.'):state.event.reason||(env.dark?'The arrays are dark. Watch the delivered energy fall.':active==='sunlightoutage'?'Sunlight has returned. Surplus power is rebuilding the reserve.':s.event);
    const lesson=missions.some(x=>x.id===s.lesson)?`#lesson/${s.lesson}`:'#learn';
    content.innerHTML=`<section class="sb-heading"><div><span class="sb-eyebrow">THE SETTLEMENT WORKSHOP / PUT THE CONNECTIONS TO WORK</span><h1>Build a place<br><em>that works.</em></h1><p>A room is only the beginning. Bring the crew’s services together, then find out what happens when the conditions change.</p></div><a class="sb-back" href="#learn">← Return to the expedition</a></section>
    <nav class="sb-challenges" aria-label="Choose a construction challenge">${SCENARIOS.map(x=>`<button data-action="scenario" data-id="${x.id}" data-focus="scenario-${x.id}" aria-pressed="${active===x.id}"><span>${x.number}</span><div><strong>${x.title}</strong><small>${x.subtitle}</small></div><b aria-hidden="true">${active===x.id?'●':'↗'}</b></button>`).join('')}</nav>
    <section class="sb-brief"><div><span class="sb-eyebrow">YOUR BRIEF / ${s.crew} RESIDENTS · ${s.budget} TONNES · ${total} HOURS</span><p>${s.brief}</p></div><button class="sb-reset" data-action="reset" data-focus="reset" ${running?'disabled':''}>↺ Reset this challenge</button></section>
    <div class="sb-workbench"><div class="sb-site"><div class="sb-board-toolbar"><span class="sb-eyebrow">THE WORKSITE</span><div role="group" aria-label="Show service connections">${['power','heat','water'].map(layer=>`<button data-action="layer" data-id="${layer}" data-focus="layer-${layer}" aria-pressed="${state.layer===layer}">${layer}</button>`).join('')}</div><label>Sunlight <select aria-label="Available daylight generation" data-change="sunlight" data-focus="sunlight" ${running?'disabled':''}><option value="1" ${state.sunlight===1?'selected':''}>100%</option><option value="0.75" ${state.sunlight===.75?'selected':''}>75%</option><option value="0.5" ${state.sunlight===.5?'selected':''}>50%</option></select></label></div>
    <div class="sb-board">${boardSVG(state,m,env.dark,env.failedBranch,instance)}<div class="sb-board-badge"><i class="${env.dark?'night':''}"></i>${env.dark?'SOLAR OUTPUT 0 kW':`${fmt(m.generation)} kW FROM THE ARRAYS`}</div></div>
    <div class="sb-inspector ${selected?'has-selection':''}">${selected?`<div><span class="sb-eyebrow">SELECTED / ${safe(selected.id.toUpperCase())}${selected.type==='radiator'?' · BRANCH '+selected.branch:''}</span><strong>${safe(selectedItem.name)}</strong><p>${safe(selectedItem.why)}</p></div><div class="sb-inspector-actions">${selectedItem.optional?`<button data-action="toggle" data-id="${selected.id}" data-focus="toggle-selected" aria-pressed="${selected.enabled}">${selected.enabled?'Pause work':'Resume work'}</button>`:''}<button data-action="remove" data-id="${selected.id}" data-focus="remove-selected" ${running?'disabled':''}>Remove module</button></div>`:'<span class="sb-inspector-marker">＋</span><div><strong>Every piece changes the whole.</strong><p>Select a module on the map or in the inventory. Add hardware from the catalog below.</p></div>'}</div>
    <div class="sb-test ${finished?'complete':''} ${state.event.phase==='failed'?'failed':''}"><div class="sb-test-heading"><span class="sb-eyebrow">${stage}</span><span>HOUR ${fmt(state.event.elapsed)} / ${total}</span></div><h2>${finished?'A place that holds together.':state.event.phase==='failed'?'Now you know what to change.':s.eventTitle}</h2><p>${safe(status)}</p><div class="sb-test-track"><span style="width:${progress}%"></span></div><div class="sb-test-actions">${state.event.phase==='design'?`<button class="sb-primary" data-action="begin" data-focus="begin">Begin the test <span>→</span></button><span class="sb-readiness ${ready?'ready':''}">${ready?'All design checks pass':'You can test now to expose the first limit'}</span>`:running?`<button class="sb-primary" data-action="step" data-focus="step">Advance 1 hour <span>→</span></button><button data-action="auto" data-focus="auto" aria-pressed="${!!timer}">${timer?'Ⅱ Pause':'▶ Run sequence'}</button><button data-action="edit" data-focus="edit">Back to planning</button>`:`<button class="sb-primary" data-action="edit" data-focus="edit">${finished?'Try another design':'Revise the design'} <span>→</span></button><a href="${lesson}">Follow the idea into a lesson ↗</a>`}</div></div></div>
    <aside class="sb-instruments" aria-label="Live engineering balances"><div class="sb-metric-grid"><div class="sb-metric ${m.powerMargin<0?'warning':''}"><span>POWER SUPPLY / DEMAND</span><strong>${fmt(m.generation)} <small>/ ${fmt(m.load)} kW</small></strong><p>${m.powerMargin>=0?`${fmt(m.powerMargin)} kW surplus`:`${fmt(-m.powerMargin)} kW supplied from reserve`}</p></div><div class="sb-metric ${m.heatMargin<0?'warning':''}"><span>HEAT CAPACITY / LOAD</span><strong>${fmt(m.heatCapacity)} <small>/ ${fmt(m.heat)} kW</small></strong><p>${m.heatMargin>=0?`${fmt(m.heatMargin)} kW remaining capacity`:`${fmt(-m.heatMargin)} kW without a rejection path`}</p></div><div class="sb-metric"><span>DELIVERABLE RESERVE</span><strong>${fmt(m.delivered)} <small>kWh</small></strong><p>${fmt(m.batteryPower)} kW maximum discharge</p></div><div class="sb-metric ${m.mass>s.budget?'warning':''}"><span>FREIGHT USED / ALLOWANCE</span><strong>${fmt(m.mass)} <small>/ ${s.budget} t</small></strong><p>${state.pieces.length} installed modules</p></div></div><div class="sb-reserve"><div><span class="sb-eyebrow">THE ENERGY HISTORY</span><span>${fmt(m.delivered)} / ${fmt(m.fullDelivered)} kWh</span></div>${reserveChart(state,m,s)}<p>${active==='sunlightoutage'?'Darkness uses the reserve. Returning sunlight must rebuild it.':'A battery stores energy; it cannot remove a heat bottleneck.'}</p></div><section class="sb-objectives"><h2>The checks that matter.</h2><p>Each result comes from your installed hardware.</p><ul>${checks.map(check=>`<li class="${check.pass?'pass':'pending'}"><span aria-label="${check.pass?'Passed':'Not yet met'}">${check.pass?'✓':'○'}</span><div><strong>${check.title}</strong><small>${safe(check.detail)}</small></div></li>`).join('')}</ul></section><p class="sb-save-status">${saveAvailable?'● Worksite saved on this device':'○ Worksite kept for this visit'}</p></aside></div>
    <section class="sb-catalog"><div class="sb-section-heading"><div><span class="sb-eyebrow">THE BUILD PIECES</span><h2>What does the place need next?</h2></div><p>${running?'Hardware changes wait until planning. Optional workshop and growing-room work can still be paused.':'Add a module. Watch the balances move. Freight includes installed hardware even when it is switched off.'}</p></div><div class="sb-catalog-grid">${Object.entries(CATALOG).map(([type,item])=>`<article class="sb-piece-card" style="--piece-color:${item.color}"><div class="sb-piece-top"><span class="sb-piece-icon" aria-hidden="true">${item.icon}</span><span>${m.counts[type]} ON SITE</span></div><h3>${item.name}</h3><p>${item.detail}</p><div class="sb-piece-bottom"><span>${fmt(item.mass)} t</span>${type==='radiator'?`<div><button data-action="add" data-id="${type}" data-branch="A" data-focus="add-${type}-A" aria-label="Add radiator to branch A" ${running||state.pieces.length>=25?'disabled':''}>＋ A</button><button data-action="add" data-id="${type}" data-branch="B" data-focus="add-${type}-B" aria-label="Add radiator to branch B" ${running||state.pieces.length>=25?'disabled':''}>＋ B</button></div>`:`<button data-action="add" data-id="${type}" data-focus="add-${type}" aria-label="Add ${item.name}" ${running||state.pieces.length>=25?'disabled':''}>Add ＋</button>`}</div></article>`).join('')}</div></section>
    <section class="sb-inventory"><div class="sb-section-heading"><div><span class="sb-eyebrow">YOUR INSTALLED HARDWARE</span><h2>Keep the inventory visible.</h2></div><span>${state.pieces.length} / 25 worksite positions</span></div><div class="sb-inventory-list">${state.pieces.length?state.pieces.map(p=>{const item=CATALOG[p.type],off=p.enabled===false||(p.type==='radiator'&&p.branch===env.failedBranch);return `<div class="sb-inventory-row ${p.id===state.selectedId?'selected':''}"><button class="sb-inventory-name" data-action="select" data-id="${p.id}" data-focus="inventory-${p.id}"><i style="background:${item.color}"></i><span>${item.name}${p.type==='radiator'?' '+p.branch:''}<small>${p.id.toUpperCase()} · ${fmt(item.mass)} t${off?' · inactive':''}</small></span></button><div>${item.optional?`<button class="sb-switch" data-action="toggle" data-id="${p.id}" data-focus="toggle-${p.id}" aria-pressed="${p.enabled}" aria-label="${p.enabled?'Pause':'Resume'} ${item.name}">${p.enabled?'ON':'OFF'}</button>`:''}<button class="sb-remove" data-action="remove" data-id="${p.id}" data-focus="remove-${p.id}" aria-label="Remove ${item.name} ${p.id}" ${running?'disabled':''}>×</button></div></div>`;}).join(''):'<p class="sb-empty">A clear site. Choose your first piece from the catalog.</p>'}</div></section>
    <section class="sb-learning"><div><span class="sb-eyebrow">TAKE THE CONNECTION WITH YOU</span><h2>A successful layout is a reason<br>to ask a better question.</h2><p>Which limit arrived first? What changed when you added a room? What did you have to stop doing when one service disappeared?</p><div><a href="${lesson}">Explore the related lesson ↗</a><a href="#read/${s.chapter}">Go deeper in chapter ${s.chapter} ↗</a><a href="#playground/cooling">Investigate heat rejection ↗</a></div></div><details class="sb-model"><summary>Inside the model <span>＋</span></summary><p>This is a separate, authored learning case for eight people. Module ratings, freight masses, and event durations are selected inputs. They do not resize the book’s 12-person reference settlement or qualify real hardware.</p><dl><dt>Electrical load</dt><dd>4 × habitats + 3 × air processors + 2 × water processors + controls + 8 × active workshops + 6 × active growing rooms, in kW.</dd><dt>Solar generation</dt><dd>20 × wings × selected daylight fraction, in kW. Zero during the eight-hour shadow event. The daylight fraction is constant within each simulated phase.</dd><dt>Stored and delivered energy</dt><dd>Each bank has 40 kWh nameplate, of which 80% is usable. Discharge efficiency is 90%, so a full bank delivers 28.8 kWh. Charging efficiency is 90%. Charge and discharge input/output limits are 10 kW per bank.</dd><dt>State update</dt><dd>Stored usable energy decreases by deficit × hours / 0.90, or increases by min(solar surplus, charging limit) × hours × 0.90. It cannot exceed 32 kWh per bank. New tests start with full batteries; reserve restoration is part of the outage test.</dd><dt>Heat rejection</dt><dd>Heat load = electrical demand + 0.2 kW × 8 residents. Each active radiator rejects 20 kW at the assumed design condition. Isolating A removes every radiator on A from available capacity. The exercise assumes every modeled electrical load dissipates inside the selected thermal boundary.</dd><dt>What the test leaves out</dt><dd>Real life-support chemistry, water inventory, fire and pressure qualification, radiation, environmental thermal variation, energy transients, degradation, wiring, battery temperature, launch limits, and complete mass and logistics budgets. The diagram locates modules for readability; drawn lines are service relationships, not installation routes. Thermal overload stops the test immediately rather than modeling temperature or medical outcomes.</dd></dl><p>Optional growing rooms are research loads. Supplies remain imported. An inactive module still counts toward freight. All scenario objectives can be met using the catalog; there is no hidden score.</p></details></section>`;
    if(focused){const target=[...content.querySelectorAll('[data-focus]')].find(node=>node.dataset.focus===focused);target?.focus({preventScroll:true});}
    if(message)announce(message);
  }
  function step(){const previous=state.event.elapsed;state=advanceSettlement(state,1);if(state.event.phase!=='running')stop();persist();render(state.event.phase==='failed'?state.event.reason:state.event.phase==='complete'?state.event.reason:`Advanced from hour ${fmt(previous)} to ${fmt(state.event.elapsed)}. ${fmt(calculateSettlement(state).delivered)} kilowatt-hours remain deliverable.`);}
  function click(ev){const target=ev.target.closest('[data-action]');if(!target||!root.contains(target)||target.disabled)return;const action=target.dataset.action,id=target.dataset.id;
    if(action==='scenario'){stop();persist();active=scenarioFor(id).id;state=cleanStored(saved[active],active);persist();render(`${scenarioFor(active).title} loaded.`);return;}
    if(action==='layer'){state.layer=id;persist();render();return;}
    if(action==='select'){state.selectedId=state.selectedId===id?null:id;persist();render();return;}
    if(action==='begin'){state=startSettlementTest(state);persist();render(scenarioFor(active).event+' Advance one hour when you are ready.');return;}
    if(action==='step'){step();return;}
    if(action==='auto'){if(timer)stop();else timer=setInterval(step,1100);render(timer?'Sequence running. Use Pause to inspect the worksite.':'Sequence paused.');return;}
    if(action==='edit'){stop();state.event=eventEmpty();persist();render('Returned to planning. The next test will begin with a full battery reserve.');return;}
    if(action==='toggle'){const piece=state.pieces.find(p=>p.id===id);if(piece&&CATALOG[piece.type]?.optional){piece.enabled=!piece.enabled;invalidate();persist();render(`${CATALOG[piece.type].name} ${piece.enabled?'resumed':'paused'}.`);}return;}
    if(state.event.phase==='running')return;
    if(action==='reset'){state=createBuilderState(active);persist();render('This challenge has been reset to its starting hardware.');return;}
    if(action==='add'&&CATALOG[id]&&state.pieces.length<25){const slot=slots.find(slot=>!state.pieces.some(p=>p.slot===slot)),piece=defaultPiece(id,`u${state.nextId++}`,slot,target.dataset.branch||'A');state.pieces.push(piece);state.selectedId=piece.id;invalidate();persist();render(`${CATALOG[id].name} added${id==='radiator'?' to branch '+piece.branch:''}.`);return;}
    if(action==='remove'){const piece=state.pieces.find(p=>p.id===id);state.pieces=state.pieces.filter(p=>p.id!==id);if(state.selectedId===id)state.selectedId=null;invalidate();persist();render(piece?`${CATALOG[piece.type].name} removed.`:'Module removed.');}
  }
  function keydown(ev){if(ev.target.matches('g[data-action="select"]')&&(ev.key==='Enter'||ev.key===' ')){ev.preventDefault();ev.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}}
  function change(ev){if(ev.target.matches('[data-change="sunlight"]')&&state.event.phase!=='running'){state.sunlight=Number(ev.target.value);invalidate();persist();render(`Daylight generation set to ${Math.round(state.sunlight*100)} percent.`);}}
  root.addEventListener('click',click);root.addEventListener('keydown',keydown);root.addEventListener('change',change);render();
  return()=>{disposed=true;stop();persist();root.removeEventListener('click',click);root.removeEventListener('keydown',keydown);root.removeEventListener('change',change);root.remove();};
}
