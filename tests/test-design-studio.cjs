const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const source=fs.readFileSync(require('node:path').resolve(__dirname,'../site/design-studio.js'),'utf8');
 const m=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
 const b=m.beamModel();near(b.shape(.5),b.deflection);near(b.shape(0),0);near(b.mass,.243);
 near(m.beamModel({depth:.012}).deflection,b.deflection/8);near(m.beamModel({length:1}).deflection,b.deflection*8);near(m.beamModel({load:0}).deflection,0);
 near(m.reliabilityModel({n:2,r:1,p:.9,common:0}).survival,.99);near(m.reliabilityModel({n:2,r:2,p:.9,common:0}).survival,.81);
 near(m.reliabilityModel({n:3,r:2,p:.5,common:0}).survival,.5);near(m.reliabilityModel({n:8,r:1,p:1,common:.2}).survival,.8);
 for(let n=1;n<=8;n++)for(let r=1;r<=n;r++)for(const p of [0,.5,.9,1]){const a=m.reliabilityModel({n,r,p,common:.02});assert.ok(a.survival>=0&&a.survival<=.98+1e-10);}
 const zero=m.controlModel({kp:0,ki:0,kd:0,disturbance:0});near(zero.final,0);
 const pOnly=m.controlModel({kp:20,ki:0,kd:8,disturbance:0,duration:60});near(pOnly.final,.8,1e-7);
 const integral=m.controlModel({kp:20,ki:5,kd:8,disturbance:2,duration:60});near(integral.final,1,1e-4);
 const sat=m.controlModel({kp:80,ki:30,kd:0,mass:.5});assert.ok(sat.points.every(p=>Number.isFinite(p.x)&&Math.abs(p.u)<=20));
 const fine=m.controlModel({dt:.005}),normal=m.controlModel();near(fine.final,normal.final,.002);
 console.log('Design studio: beam scaling, boundary values, reliability combinatorics, controller equilibrium, saturation, and time-step convergence passed.');
})().catch(e=>{console.error(e);process.exit(1);});
