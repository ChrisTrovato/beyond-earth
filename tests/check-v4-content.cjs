const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createModuleGraph}=require('./site-module-test-helper.cjs');
const root=path.resolve(__dirname,'../site');
const data=n=>JSON.parse(fs.readFileSync(path.join(root,'data',n),'utf8'));
const missions=[...data('missions.json'),...data('missions-expansion.json'),...data('missions-next.json')],paths=[...data('learning-paths.json'),...data('learning-paths-next.json')],chapters=data('chapters.json'),sources=data('sources.json');
const ids=new Set(missions.map(m=>m.id)),chapterIds=new Set(chapters.map(c=>c.id));
global.localStorage={getItem(){return null},setItem(){}};global.window={addEventListener(){},removeEventListener(){},dispatchEvent(){}};global.document={};global.CustomEvent=class{constructor(type,opts){this.type=type;this.detail=opts?.detail}};
class Node{constructor(){this.dataset={};this.value='';this.classList={add(){},remove(){},toggle(){}};}addEventListener(){}removeEventListener(){}setAttribute(){}querySelector(){return new Node()}querySelectorAll(){return[]}}
class Container extends Node{constructor(){super();this.innerHTML='';}}
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
(async()=>{
 const graph=createModuleGraph('v4-content-check'),{projects}=await import(graph('projects-data.js')),campus=await import(graph('campus.js')),academy=await import(graph('academy.js')),reels=await import(graph('reels.js')),flight=await import(graph('flight-deck.js'));
 assert.equal(missions.length,60);assert.equal(ids.size,60);assert.equal(projects.length,20);assert.equal(new Set(projects.map(p=>p.id)).size,20);assert.equal(paths.length,10);assert.equal(new Set(paths.map(p=>p.id)).size,10);
 const supported=new Set(['none','leverage','ramp','orbit','rotation','solar','cooling','uncertainty','robot','foundation:functions','foundation:motion','foundation:accumulation','foundation:vectors']);
 for(const m of missions){assert(supported.has(m.simulation),m.id+' simulation');assert(m.book.every(b=>chapterIds.has(b.chapter)),m.id+' book');assert(m.practice.choices.length===4);assert(m.practice.correctIndex>=0&&m.practice.correctIndex<4);assert(m.sources.length>0);assert(m.sources.every(s=>s.url.startsWith('https://')));}
 for(const p of paths)assert(p.missionIds.every(id=>ids.has(id)),p.id);
 for(const p of projects)assert(p.lessons.every(id=>ids.has(id)),p.id);
 const sourceIds=new Set(sources.map(s=>s.id));assert(chapters.every(c=>c.sourceIds.every(id=>sourceIds.has(id))));
 let projectRenderChecks=0,lessonRenderChecks=0;
 for(const p of projects){const c=new Container(),clean=campus.mountProjects(c,missions,p.id);for(const id of p.lessons)assert(c.innerHTML.includes('#lesson/'+id),p.id+' -> '+id);for(const key of ['measure','deliverable','connection','stretch'])assert(c.innerHTML.includes(esc(p[key])),p.id+' '+key);clean();projectRenderChecks++;}
 for(const m of data('missions-next.json')){const c=new Container(),clean=academy.mountMission(c,missions,m.id);for(const s of m.sources)assert(c.innerHTML.includes(esc(s.url)),m.id+' source');for(const b of m.book)assert(c.innerHTML.includes('#read/'+b.chapter),m.id+' chapter');assert(c.innerHTML.includes('Original sources & further learning'));clean();lessonRenderChecks++;}
 const hub=new Container();campus.mountLabHub(hub);const labRoutes=[...hub.innerHTML.matchAll(/href="#(foundations|playground|arcade|studio)\/([a-z-]+)"/g)].map(m=>m[1]+'/'+m[2]);assert.equal(labRoutes.length,18);assert.equal(new Set(labRoutes).size,18);
 const rs=reels.validateReels(data('reels.json')),projectIds=new Set(projects.map(p=>p.id));assert.equal(rs.length,8);for(const r of rs){assert(ids.has(r.lesson.href.split('/')[1]));assert(projectIds.has(r.project.href.split('/')[1]));}
 assert.equal(flight.LANDING_CHALLENGES.length+flight.TRANSFER_CHALLENGES.length+flight.ROBOT_TARGETS.length,9);
 assert(reels.reelEmbedURL(rs[0].youtubeId,'https://example.com').startsWith('https://www.youtube-nocookie.com/'));assert(reels.reelEmbedURL(rs[0].youtubeId,'https://example.com',true).startsWith('https://www.youtube.com/'));
 const literalIssues=[];for(const file of fs.readdirSync(root).filter(n=>n.endsWith('.js')||n.endsWith('.html'))){const s=fs.readFileSync(path.join(root,file),'utf8');for(const match of s.matchAll(/#(lesson|projects|paths|read)\/([a-z0-9-]+)(?=["'<\s])/g)){const valid=match[1]==='lesson'?ids:match[1]==='projects'?projectIds:match[1]==='paths'?new Set(paths.map(p=>p.id)):chapterIds;const routeId=match[1]==='read'?match[2].padStart(2,'0'):match[2];if(!valid.has(routeId))literalIssues.push({file,route:match[0]});}}
 const report={status:literalIssues.length?'issues':'pass',counts:{missions:missions.length,projects:projects.length,paths:paths.length,labsAndGames:labRoutes.length,arcadeGames:3,arcadeChallenges:9,designStudioLabs:3,reels:rs.length,chapters:chapters.length,bookSources:sources.length},renderChecks:{projects:projectRenderChecks,newLessons:lessonRenderChecks,sourceLinksVisible:true,projectEvidenceFieldsVisible:true},simulationValues:[...new Set(missions.map(m=>m.simulation))],allSimulationValuesSupported:true,literalRouteIssues:literalIssues,labRoutes,reelLessonProjectReferencesValid:true,reelPlayerHosts:{default:'youtube-nocookie.com',explicitFallback:'youtube.com'},newMissionsSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'data/missions-next.json'))).digest('hex')};
 assert.equal(literalIssues.length,0,JSON.stringify(literalIssues));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e.message);process.exit(1)});
