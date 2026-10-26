(function(root){
'use strict';
const SIZE=7,TYPES=6;let serial=0;
const tile=(type=Math.floor(Math.random()*TYPES),special=null)=>({id:++serial,type,special});
const adjacent=(a,b)=>a>=0&&b>=0&&a<SIZE*SIZE&&b<SIZE*SIZE&&Math.abs(Math.floor(a/SIZE)-Math.floor(b/SIZE))+Math.abs(a%SIZE-b%SIZE)===1;
const swap=(b,a,c)=>{[b[a],b[c]]=[b[c],b[a]];};
function groups(b){
 const result=[];
 for(const axis of ['row','col'])for(let line=0;line<SIZE;line++){
  let run=[];
  const finish=()=>{if(run.length>=3)result.push({axis,cells:run});run=[];};
  for(let pos=0;pos<SIZE;pos++){
   const i=axis==='row'?line*SIZE+pos:pos*SIZE+line;
   if(!b[i]||b[i].type<0){finish();continue;}
   if(run.length&&b[run[0]].type!==b[i].type)finish();run.push(i);
  }finish();
 }return result;
}
function possible(b){
 for(let i=0;i<b.length;i++)for(const j of [i+1,i+SIZE]){
  if(!adjacent(i,j))continue;
  if(b[i].special==='color'||b[j].special==='color'||(b[i].special&&b[j].special))return[i,j];
  swap(b,i,j);const ok=groups(b).length>0;swap(b,i,j);if(ok)return[i,j];
 }return null;
}
function create(){
 let b;
 do{b=[];for(let i=0;i<SIZE*SIZE;i++){
  let t;do{t=Math.floor(Math.random()*TYPES);}while((i%SIZE>=2&&b[i-1].type===t&&b[i-2].type===t)||(i>=SIZE*2&&b[i-SIZE].type===t&&b[i-SIZE*2].type===t));b.push(tile(t));
 }}while(!possible(b));return b;
}
function area(i,radius=1){const a=[];for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(Math.abs(r-Math.floor(i/SIZE))<=radius&&Math.abs(c-i%SIZE)<=radius)a.push(r*SIZE+c);return a;}
function cross(i,width=0){return Array.from({length:SIZE*SIZE},(_,j)=>j).filter(j=>Math.abs(Math.floor(j/SIZE)-Math.floor(i/SIZE))<=width||Math.abs(j%SIZE-i%SIZE)<=width);}
function expand(b,initial,protectedCells=[],colorTargets=new Map()){
 const protectedSet=new Set(protectedCells),cleared=new Set(),queue=[...initial],activated=[];
 while(queue.length){const i=queue.shift();if(i<0||i>=b.length||cleared.has(i)||protectedSet.has(i))continue;cleared.add(i);
  const t=b[i];if(!t?.special)continue;activated.push(i);
  if(t.special==='row')queue.push(...Array.from({length:SIZE},(_,c)=>Math.floor(i/SIZE)*SIZE+c));
  if(t.special==='col')queue.push(...Array.from({length:SIZE},(_,r)=>r*SIZE+i%SIZE));
  if(t.special==='bomb')queue.push(...area(i));
  if(t.special==='color'){
   const counts=Array(TYPES).fill(0);b.forEach(x=>{if(x.type>=0)counts[x.type]++;});const most=colorTargets.has(i)?colorTargets.get(i):counts.indexOf(Math.max(...counts));b.forEach((x,j)=>{if(x.type===most)queue.push(j);});
  }
 }return{cleared:[...cleared],activated};
}
function plan(b,gs=groups(b),preferred=[]){
 const seeds=new Set(gs.flatMap(g=>g.cells)),spawns=new Map(),consumed=new Set();
 // A crossing run creates one wrapped bomb instead of two striped packs.
 for(let a=0;a<gs.length;a++)for(let c=a+1;c<gs.length;c++){
  if(gs[a].axis===gs[c].axis)continue;const center=gs[a].cells.find(i=>gs[c].cells.includes(i));
  if(center!==undefined){const cells=[...gs[a].cells,...gs[c].cells];const at=preferred.find(i=>cells.includes(i))??center;spawns.set(at,tile(b[at].type,'bomb'));cells.forEach(i=>consumed.add(i));}
 }
 for(const g of [...gs].sort((a,c)=>c.cells.length-a.cells.length)){
  if(g.cells.some(i=>consumed.has(i))||g.cells.length<4)continue;
  const at=preferred.find(i=>g.cells.includes(i))??g.cells[Math.floor(g.cells.length/2)];
  const special=g.cells.length>=5?'color':g.axis;
  spawns.set(at,tile(special==='color'?-1:b[at].type,special));g.cells.forEach(i=>consumed.add(i));
 }
 const result=expand(b,[...seeds],[...spawns.keys()]);return{...result,spawns};
}
// Called after the two packs have exchanged positions.
function swapPlan(b,a,c){
 const x=b[a],y=b[c];
 if(x.special==='color'||y.special==='color'){
  const rainbow=x.special==='color'?a:c,other=rainbow===a?c:a;const seeds=[a,c];
  if(b[other].special==='color')seeds.push(...b.map((_,i)=>i));
  else b.forEach((t,i)=>{if(t.type===b[other].type){seeds.push(i);if(b[other].special&&i!==other)t.special=b[other].special;}});
  return{...expand(b,seeds,[],new Map([[rainbow,b[other].type]])),spawns:new Map()};
 }
 if(x.special&&y.special){
  let seeds=[a,c];
  if(x.special==='bomb'&&y.special==='bomb')seeds.push(...area(a,2),...area(c,2));
  else if(x.special==='bomb'||y.special==='bomb')seeds.push(...cross(c,1));
  else seeds.push(...cross(a),...cross(c));
  return{...expand(b,seeds),spawns:new Map()};
 }
 return plan(b,groups(b),[c,a]);
}
function collapse(b,cleared,spawns=new Map()){
 const removed=new Set(cleared),next=Array(b.length),origins=new Map();
 for(const [i,t]of spawns)b[i]=t;
 for(let col=0;col<SIZE;col++){
  const kept=[];for(let row=SIZE-1;row>=0;row--){const i=row*SIZE+col;if(!removed.has(i)||spawns.has(i))kept.push({t:b[i],from:i});}
  let spawned=0;for(let row=SIZE-1;row>=0;row--){const i=row*SIZE+col;const item=kept.shift();next[i]=item?item.t:tile();origins.set(next[i].id,item?item.from:-(++spawned)*SIZE+col);}
 }return{board:next,origins};
}
const E={SIZE,TYPES,tile,adjacent,swap,groups,possible,create,area,cross,expand,plan,swapPlan,collapse};
if(typeof module!=='undefined')module.exports=E;else root.MatchEngine=E;
})(typeof window!=='undefined'?window:globalThis);
