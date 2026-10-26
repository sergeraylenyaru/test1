'use strict';
const E=window.MatchEngine,$=id=>document.getElementById(id),N=E.SIZE;
const P=window.Planogram,CATALOG=window.BrandCatalog;
const palette=['#e7a084','#9bbce5','#dfc283','#b8bfe1','#a1c7ad','#c9abd8'];
let brands=[],planogram,pendingSlots=new Set(),flightAnimations=new Set(),catalogDraft=new Set();
let chosenCatalog=[];
function sampleProducts(){const items=[...CATALOG];for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}return items.slice(0,E.TYPES);}

const titles=['Первая полка','Точный расчёт','Цепная реакция','Золотая середина','Большая перестановка','Искусство каскада','Особая коллекция','На своём месте','Полный порядок','Мастер комбинаций','Тонкая работа','Идеальный шкаф'];
const tips=['Четыре в ряд? Получится пачка, которая очистит целую полку.','Спецпачку можно совместить с другой спецпачкой — без ряда из трёх.','Призма и пачка одной марки убирают всю эту марку со шкафа.','Пачки сверху падают вниз. Планируй следующий каскад заранее.'];
const storage={get(k,f){try{return JSON.parse(localStorage.getItem(k))??f;}catch{return f;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}};
const saved=storage.get('brandmatch-cabinet',{});let unlocked=Math.max(1,Math.min(12,Number(saved.unlocked)||1)),best=Math.max(0,Number(saved.best)||Number(storage.get('brandmatch-best',0))||0),level=Math.min(unlocked,Math.max(1,Number(saved.level)||1)),sound=!!saved.sound;
chosenCatalog=Array.isArray(saved.chosenCatalog)?[...new Set(saved.chosenCatalog)].filter(id=>CATALOG.some(t=>t.id===id)):[];if(chosenCatalog.length!==E.TYPES)chosenCatalog=[];
let board=[],score=0,moves=0,collected=Array(E.TYPES).fill(0),selected=null,busy=false,ended=false,epoch=0,hammer=false,hammers=1,shuffles=1,bombs=0,brushes=0,targetTool=null,config,nodes=new Map(),idleTimer,audioContext;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,reduced?Math.min(ms,20):ms));
function save(){storage.set('brandmatch-cabinet',{unlocked,best,level,sound,chosenCatalog});}
function levelConfig(n){return{target:1800+(n-1)*250,moves:42-Math.min(8,n-1)};}
function beep(kind='select',chain=1){
 if(!sound)return;
 try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume();
  const notes=kind==='win'?[523,659,784,1046]:kind==='bad'?[180,145]:kind==='clear'?[330+chain*70,440+chain*70,660+chain*70]:kind==='special'?[220,440,880]:[520];
  notes.forEach((hz,i)=>{const osc=audioContext.createOscillator(),gain=audioContext.createGain(),t=audioContext.currentTime+i*.065;osc.type=kind==='bad'?'triangle':'sine';osc.frequency.setValueAtTime(hz,t);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.055,t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+.19);osc.connect(gain);gain.connect(audioContext.destination);osc.start(t);osc.stop(t+.2);});
 }catch{}
}
function status(text){$('status').textContent=text;}
function updateStats(){
 $('score').textContent=score.toLocaleString('ru');$('moves').textContent=moves;$('moves').parentElement.classList.toggle('low',moves<=5);
 $('best').textContent=`Рекорд: ${best.toLocaleString('ru')}`;$('record').textContent=best.toLocaleString('ru');
 const progress=P.progress(planogram),landed=progress.collected-pendingSlots.size;
 $('goal-current').textContent=landed;$('goal-total').textContent=progress.required;$('goal-progress').style.width=`${landed/progress.required*100}%`;
 $('goal-check').textContent=`${progress.completed} / 12 СЕКЦИЙ`;
 $('planogram-filled').textContent=`${progress.stocked+landed} / ${progress.total}`;
 [...$('stars').children].forEach((s,i)=>s.classList.toggle('lit',score>=config.target*[.6,1,1.5][i]));
 renderPlanogram();
 $('hammer-count').textContent=hammers;$('shuffle-count').textContent=shuffles;$('bomb-count').textContent=bombs;$('brush-count').textContent=brushes;
 for(const [id,count]of [['hammer',hammers],['bomb',bombs],['brush',brushes]]){$(id).setAttribute('aria-pressed',String(targetTool===id));$(id).disabled=busy||ended||!count;}
 $('board').classList.toggle('hammer-mode',!!targetTool);
 $('shuffle').disabled=busy||ended||!shuffles;$('hint').disabled=busy||ended;
}
function buildPlanogram(){
 $('planogram-grid').replaceChildren(...planogram.sections.map(goal=>{
  const card=document.createElement('div');card.className='planogram-section';card.dataset.section=goal.id;
  const heading=document.createElement('div');heading.className='planogram-section-heading';
  const label=document.createElement('span');label.textContent=brands[goal.type].name;label.title=label.textContent;
  const count=document.createElement('b');heading.append(label,count);card.append(heading);
  const shelf=document.createElement('div');shelf.className='planogram-slots';
  for(let slot=0;slot<planogram.slots;slot++){const el=document.createElement('span');el.className='planogram-slot';el.dataset.slot=slot;const img=document.createElement('img');img.src=brands[goal.type].src;img.alt='';img.draggable=false;el.append(img);shelf.append(el);}
  card.append(shelf);return card;
 }));renderPlanogram();
}
function renderPlanogram(){
 if(!planogram)return;
 for(const goal of planogram.sections){const card=$('planogram-grid').children[goal.id];if(!card)continue;
  let pending=0;
  [...card.querySelectorAll('.planogram-slot')].forEach((slot,i)=>{
   const flying=pendingSlots.has(`${goal.id}:${i}`);if(flying)pending++;
   slot.className=`planogram-slot ${i>=goal.required?'stocked':flying?'pending':i<goal.collected?'filled':'empty'}`;
  });
  const complete=goal.collected===goal.required&&!pending;card.classList.toggle('complete',complete);
  card.querySelector('b').textContent=complete?'✓':`${goal.collected-pending}/${goal.required}`;
  card.setAttribute('aria-label',`${brands[goal.type].name}: собрано ${goal.collected-pending} из ${goal.required}${complete?', секция заполнена':''}`);
 }
}
function collectToShelves(indices,run){
 const sources=new Map(indices.map(i=>[board[i].id,nodes.get(board[i].id)?.querySelector('.pack').getBoundingClientRect()]));
 const flights=P.collect(planogram,indices.map(i=>board[i]));
 if(reduced){updateStats();return Promise.resolve();}
 flights.forEach(f=>pendingSlots.add(`${f.section}:${f.slot}`));updateStats();
 return Promise.all(flights.map((f,index)=>{
  const key=`${f.section}:${f.slot}`,target=$('planogram-grid').children[f.section].querySelector(`[data-slot="${f.slot}"]`),from=sources.get(f.id),to=target.getBoundingClientRect();
  if(!from||!from.width||!to.width){pendingSlots.delete(key);updateStats();return Promise.resolve();}
  const img=document.createElement('img');img.className='shelf-fly';img.src=brands[f.type].src;img.alt='';img.style.cssText=`left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px`;$('flight-layer').append(img);
  const dx=to.left-from.left,dy=to.top-from.top,sx=to.width/from.width,sy=to.height/from.height;
  const animation=img.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx*.45}px,${dy*.45-55}px) rotate(-9deg) scale(.75)`,opacity:1,offset:.45},{transform:`translate(${dx}px,${dy}px) scale(${sx},${sy})`,opacity:1}],{duration:620,delay:Math.min(index*18,160),easing:'cubic-bezier(.25,.6,.35,1)',fill:'forwards'});
  const entry={animation,img};flightAnimations.add(entry);
  return animation.finished.catch(()=>{}).then(()=>{flightAnimations.delete(entry);img.remove();if(run!==epoch)return;pendingSlots.delete(key);updateStats();target.classList.remove('arrived');void target.offsetWidth;target.classList.add('arrived');});
 }));
}
function awardBoosters(spawns){
 const rewards=P.rewards(spawns);hammers+=rewards.hammer;bombs+=rewards.bomb;brushes+=rewards.brush;
 for(const [id,count]of [['hammer',rewards.hammer],['bomb',rewards.bomb],['brush',rewards.brush]])if(count){$(id).classList.remove('earned');void $(id).offsetWidth;$(id).classList.add('earned');}
 return Object.entries(rewards).filter(([,n])=>n).map(([id,n])=>`+${n} ${{hammer:'ТОЧНЫЙ ХОД',bomb:'ВЗРЫВ',brush:'КИСТЬ'}[id]}`).join(' · ');
}

function makeNode(t){
 const button=document.createElement('button');button.className='tile';button.type='button';button.dataset.id=t.id;const pack=document.createElement('span');pack.className='pack';
 if(t.type<0){pack.innerHTML='<span class="prism-face">✧<small>PRISM</small></span>';}
 else{const img=document.createElement('img');img.src=brands[t.type].src;img.alt='';img.draggable=false;const face=document.createElement('span');face.className='pack-face';face.append(img);pack.append(face);}

 button.append(pack);
 if(t.special){const badge=document.createElement('span');badge.className='special-badge';badge.textContent={row:'↔',col:'↕',bomb:'✹',color:'✧'}[t.special];pack.append(badge);}
 button.onclick=()=>{if(!suppressClick)choose(Number(button.dataset.index));};
 button.onkeydown=e=>{let next=Number(button.dataset.index);const steps={ArrowLeft:-1,ArrowRight:1,ArrowUp:-N,ArrowDown:N};if(e.key in steps){e.preventDefault();const j=next+steps[e.key];if(E.adjacent(next,j))nodes.get(board[j].id)?.focus();}};
 return button;
}
function render(origins){
 const ids=new Set(board.map(t=>t.id));for(const[id,node]of nodes)if(!ids.has(id)){node.remove();nodes.delete(id);}
 board.forEach((t,i)=>{
  let el=nodes.get(t.id),isNew=!el;
  if(isNew){el=makeNode(t);nodes.set(t.id,el);$('board').append(el);}
  el.dataset.index=i;el.className=`tile${selected===i?' selected':''}${t.special?' special-'+t.special:''}`;
  el.disabled=busy||ended;el.setAttribute('aria-pressed',String(selected===i));
  el.setAttribute('aria-label',`${t.type<0?'Призма':brands[t.type].name}${t.special?', спецпачка '+({row:'полка',col:'вертикаль',bomb:'взрыв',color:'цвет'}[t.special]):''}, строка ${Math.floor(i/N)+1}, столбец ${i%N+1}`);
  if(isNew&&origins){const from=origins.get(t.id)??i;el.style.setProperty('--col',from%N<0?(from%N+N):from%N);el.style.setProperty('--row',Math.floor(from/N));el.style.transition='none';void el.offsetHeight;el.style.transition='';}
  el.style.setProperty('--col',i%N);el.style.setProperty('--row',Math.floor(i/N));
 });updateStats();
}
function route(){
 $('route').replaceChildren();const first=Math.min(8,Math.max(1,level-2));for(let n=first;n<first+5;n++){
  const button=document.createElement('button');button.textContent=n<unlocked?'✓':n;button.className=n===level?'active':n<unlocked?'done':'';button.disabled=n>unlocked;button.setAttribute('aria-label',`Уровень ${n}${n>unlocked?', закрыт':''}`);button.onclick=()=>start(n);$('route').append(button);
 }
}
function start(n=level){
 epoch++;clearTimeout(idleTimer);gesture?.ghost?.remove();gesture=null;for(const f of flightAnimations){f.animation.cancel();f.img.remove();}flightAnimations.clear();pendingSlots.clear();$('flight-layer').replaceChildren();
 level=n;config=levelConfig(n);const products=chosenCatalog.length===E.TYPES?chosenCatalog.map(id=>CATALOG.find(t=>t.id===id)):sampleProducts();brands=products.map((t,i)=>({...t,color:palette[i]}));
 planogram=P.create();board=E.create();score=0;moves=config.moves;collected=Array(E.TYPES).fill(0);busy=false;ended=false;selected=null;hammer=false;targetTool=null;hammers=1;shuffles=1;bombs=0;brushes=0;
 $('end-dialog').close();$('combo').className='combo';$('particles').replaceChildren();$('board').replaceChildren();nodes.clear();route();
 $('level-label').textContent=`УРОВЕНЬ ${String(n).padStart(2,'0')}`;$('level-name').textContent=titles[n-1].toUpperCase();$('cabinet-number').textContent=String(n).padStart(2,'0');$('mission-title').textContent=titles[n-1];$('tip').textContent=tips[(n-1)%tips.length];
 buildPlanogram();
 render();status('Выбери пачку и соседнюю — или перетащи её');save();scheduleHint();
}
function scheduleHint(){clearTimeout(idleTimer);if(!ended)idleTimer=setTimeout(()=>{if(!busy&&!targetTool&&!document.querySelector('dialog[open]'))showHint(false);},10000);}
function showHint(manual=true){if(busy||ended)return;selected=null;render();const pair=E.possible(board);if(pair){pair.forEach(i=>nodes.get(board[i].id).classList.add('hint'));if(manual)status('Поменяй подсвеченные пачки местами');}}
function position(i){return{x:((i%N)+.5)/N*100,y:(Math.floor(i/N)+.5)/N*100};}
function transient(el,ms=1000){$('particles').append(el);setTimeout(()=>el.remove(),ms);}
function particles(i,color){const{x,y}=position(i);for(let p=0;p<7;p++){const el=document.createElement('i');el.className='particle';el.style.cssText=`left:${x}%;top:${y}%;--color:${color};--dx:${(Math.random()-.5)*100}px;--dy:${(Math.random()-.5)*100}px`;transient(el,750);}}
function effect(i,special){const{x,y}=position(i);if(special==='row'||special==='col'){
 const el=document.createElement('i');el.className=`beam ${special==='row'?'horizontal':'vertical'}`;el.style[special==='row'?'top':'left']=`${special==='row'?y:x}%`;transient(el,500);
 }else{const el=document.createElement('i');el.className='blast';el.style.cssText=`left:${x}%;top:${y}%;transform:translate(-50%,-50%)`;transient(el,550);}
}
function combo(text,sub){$('combo').innerHTML=`${text}<small>${sub}</small>`;$('combo').classList.remove('show');void $('combo').offsetWidth;$('combo').classList.add('show');}
async function resolve(plan,run){
 let chain=0;
 while(plan.cleared.length||plan.spawns.size){
  chain++;const earned=awardBoosters(plan.spawns),flightDone=collectToShelves(plan.cleared,run);const points=(plan.cleared.length*40+plan.spawns.size*80)*Math.min(chain,8);score+=points;
  plan.cleared.forEach(i=>{const t=board[i];if(t.type>=0)collected[t.type]++;nodes.get(t.id)?.classList.add('removing');particles(i,t.type>=0?brands[t.type].color:'#f4dda1');});
  plan.activated.forEach(i=>effect(i,board[i].special));
  if(plan.activated.length){document.querySelector('.cabinet').classList.remove('shake');void $('board').offsetWidth;document.querySelector('.cabinet').classList.add('shake');beep('special');}else beep('clear',chain);
  if(chain>1)combo(chain>=4?'Вот это каскад!':'Красиво!',`КОМБО ×${chain} · +${points}`);
  else if(plan.spawns.size)combo('Особая комбинация',earned||'СПЕЦПАЧКА СОЗДАНА');
  const el=document.createElement('span'),pos=position(plan.cleared[0]??[...plan.spawns.keys()][0]);el.className='float-score';el.textContent=`+${points}`;el.style.cssText=`left:${Math.min(83,pos.x)}%;top:${pos.y}%`;transient(el);
  status(chain>1?`Каскад ×${chain}! +${points} очков`:`Комбинация! +${points} очков`);updateStats();
  await sleep(350);if(run!==epoch)return;
  const result=E.collapse(board,plan.cleared,plan.spawns);board=result.board;render(result.origins);
  await Promise.all([sleep(330),flightDone]);if(run!==epoch)return;plan=E.plan(board);
 }
 if(run!==epoch)return;
 if(score>best){best=score;save();}
 const won=P.progress(planogram).won;
 if(won||moves===0){finish(won);return;}
 if(!E.possible(board)){await reshuffle(false,run);if(run!==epoch)return;status('Ходов не осталось — шкаф перемешан бесплатно');}
 busy=false;render();scheduleHint();
}
async function move(a,b){
 if(busy||ended||!E.adjacent(a,b))return;
 clearTimeout(idleTimer);const run=epoch;selected=null;hammer=false;targetTool=null;busy=true;E.swap(board,a,b);render();beep();await sleep(260);if(run!==epoch)return;
 const plan=E.swapPlan(board,a,b);
 if(!plan.cleared.length&&!plan.spawns.size){
  [a,b].forEach(i=>nodes.get(board[i].id)?.classList.add('bad'));beep('bad');status('Собери три одинаковые пачки. Этот обмен не тратит ход.');await sleep(180);if(run!==epoch)return;
  E.swap(board,a,b);render();await sleep(260);if(run!==epoch)return;busy=false;render();scheduleHint();return;
 }
 moves--;await resolve(plan,run);
}
async function choose(i){
 if(busy||ended)return;
 if(targetTool){const tool=targetTool;targetTool=null;hammer=false;busy=true;selected=null;
  let seeds=[i];if(tool==='hammer')hammers--;if(tool==='bomb'){bombs--;seeds=E.area(i);}if(tool==='brush'){brushes--;const type=board[i].type;seeds=board.map((t,j)=>t.type===type?j:-1).filter(j=>j>=0);}
  render();await resolve({...E.expand(board,seeds),spawns:new Map()},epoch);return;
 }
 beep();if(selected===null){selected=i;render();return;}if(selected===i){selected=null;render();return;}if(!E.adjacent(selected,i)){selected=i;render();return;}await move(selected,i);
}
function finish(won){
 busy=false;ended=true;hammer=false;targetTool=null;
 const bonus=won?moves*35:0;score+=bonus;best=Math.max(best,score);if(won)unlocked=Math.min(12,Math.max(unlocked,level+1));save();render();
 $('end-eyebrow').textContent=won?'УРОВЕНЬ ПРОЙДЕН':'ЕЩЁ ОДНА ПОПЫТКА?';$('end-title').textContent=won?'Всё на своих местах.':'Почти получилось.';
 const stars=won?Math.max(1,[.6,1,1.5].filter(n=>score>=config.target*n).length):0;$('end-stars').textContent='★'.repeat(stars)+'☆'.repeat(3-stars);
 $('end-description').textContent=won?`Отличная работа! Бонус за ${moves} оставшихся ходов: +${bonus} очков.${level===12?' Все 12 уровней пройдены!':''}`:`Заполнено ${P.progress(planogram).filled} из 72 мест. Создавай спецпачки и зарабатывай бустеры, чтобы заполнить весь шкаф.`;
 $('end-score').textContent=score.toLocaleString('ru');$('end-best').textContent=best.toLocaleString('ru');$('next-level').hidden=!won||level===12;$('replay').textContent=won?'Повторить уровень':'Попробовать ещё';
 $('end-dialog').showModal();if(won)beep('win');status(won?'Уровень пройден!':'Ходы закончились');route();
}
async function reshuffle(paid=true,run=epoch){
 if(paid&&(busy||ended||!shuffles))return;
 if(paid){shuffles--;busy=true;selected=null;hammer=false;targetTool=null;updateStats();}
 const original=[...board];let candidate;
 for(let attempt=0;attempt<150;attempt++){
  candidate=[...original];for(let i=candidate.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));E.swap(candidate,i,j);}
  if(!E.groups(candidate).length&&E.possible(candidate))break;candidate=null;
 }
 if(!candidate){candidate=E.possible(original)?original:E.create();if(candidate!==original){const specials=original.filter(t=>t.special);specials.forEach((t,i)=>{candidate[i].special=t.special;if(t.special==='color')candidate[i].type=-1;});}}
 if(run!==epoch)return;board=candidate;render();beep('special');status('Новый порядок. Те же возможности.');await sleep(350);if(run!==epoch)return;
 if(paid){busy=false;render();scheduleHint();}
}
// Mouse and touch share the same gesture path; clicks also support keyboard input.
let gesture=null,suppressClick=false;
$('board').addEventListener('pointerdown',e=>{
 const target=e.target.closest('.tile');if(!target||busy||ended||targetTool)return;
 gesture={index:Number(target.dataset.index),x:e.clientX,y:e.clientY,pointer:e.pointerId,drag:false,ghost:null};
});
window.addEventListener('pointermove',e=>{
 if(!gesture||e.pointerId!==gesture.pointer)return;
 const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
 if(!gesture.drag&&Math.hypot(dx,dy)>10){gesture.drag=true;const source=nodes.get(board[gesture.index].id).querySelector('.pack'),rect=source.getBoundingClientRect();const ghost=source.cloneNode(true);ghost.classList.add('drag-ghost');ghost.style.cssText=`position:fixed;width:${rect.width}px;height:${rect.height}px;z-index:100;pointer-events:none;opacity:.85;transform:rotate(-8deg);filter:drop-shadow(5px 10px 8px #0009)`;document.body.append(ghost);gesture.ghost=ghost;}
 if(gesture.drag){e.preventDefault();gesture.ghost.style.left=`${e.clientX-gesture.ghost.offsetWidth/2}px`;gesture.ghost.style.top=`${e.clientY-gesture.ghost.offsetHeight/2}px`;}
},{passive:false});
window.addEventListener('pointerup',e=>{
 if(!gesture||e.pointerId!==gesture.pointer)return;const g=gesture;gesture=null;g.ghost?.remove();if(!g.drag)return;suppressClick=true;setTimeout(()=>suppressClick=false,0);
 const rect=$('board').getBoundingClientRect(),col=Math.floor((e.clientX-rect.left)/rect.width*N),row=Math.floor((e.clientY-rect.top)/rect.height*N);
 if(col>=0&&col<N&&row>=0&&row<N)move(g.index,row*N+col);
});
window.addEventListener('pointercancel',()=>{gesture?.ghost?.remove();gesture=null;});
$('hint').onclick=()=>showHint();$('restart').onclick=()=>start();$('shuffle').onclick=()=>reshuffle();
for(const tool of ['hammer','bomb','brush'])$(tool).onclick=()=>{
 if(busy||ended||!({hammer:hammers,bomb:bombs,brush:brushes}[tool]))return;
 targetTool=targetTool===tool?null:tool;hammer=!!targetTool;selected=null;render();status(targetTool?{hammer:'Выбери пачку. Удаление не тратит ход.',bomb:'Выбери центр взрыва 3×3. Ход не тратится.',brush:'Выбери товар: соберём все такие пачки. Ход не тратится.'}[targetTool]:'Выбери две соседние пачки');
};
$('next-level').onclick=()=>start(Math.min(12,level+1));$('replay').onclick=()=>start();
function help(){if(!$('help-dialog').open)$('help-dialog').showModal();}
$('help').onclick=help;$('guide-link').onclick=help;
$('sources-link').onclick=()=>$('sources-dialog').showModal();
document.querySelectorAll('.dialog-close,.dialog-done').forEach(button=>button.onclick=()=>button.closest('dialog').close());
function soundUI(){$('sound').setAttribute('aria-label',sound?'Выключить звук':'Включить звук');$('sound').querySelector('span').hidden=sound;}
$('sound').onclick=()=>{sound=!sound;soundUI();save();beep();};soundUI();
$('shelves').innerHTML=Array.from({length:N},(_,i)=>`<div class="shelf" style="--row:${i+1}"></div>`).join('');
function renderCatalog(){
 const query=$('catalog-search').value.trim().toLocaleLowerCase('ru');
 $('catalog-grid').replaceChildren(...CATALOG.filter(t=>`${t.name} ${t.family}`.toLocaleLowerCase('ru').includes(query)).map(t=>{
  const button=document.createElement('button');button.className='catalog-product';button.setAttribute('aria-pressed',String(catalogDraft.has(t.id)));button.dataset.product=t.id;
  const image=document.createElement('img');image.src=t.src;image.alt='';image.loading='lazy';const label=document.createElement('span');label.textContent=t.name;const check=document.createElement('b');check.textContent=catalogDraft.has(t.id)?'✓':'+';button.append(image,label,check);
  button.onclick=()=>{if(catalogDraft.has(t.id))catalogDraft.delete(t.id);else if(catalogDraft.size<E.TYPES)catalogDraft.add(t.id);else{$('catalog-selection').textContent='Уже выбрано 6. Убери один товар, чтобы заменить.';return;}renderCatalog();};return button;
 }));
 $('catalog-selection').textContent=`Выбрано ${catalogDraft.size} из 6`;$('catalog-apply').disabled=catalogDraft.size!==E.TYPES;
}
$('catalog-open').onclick=()=>{catalogDraft=new Set(brands.map(t=>t.id));$('catalog-search').value='';renderCatalog();$('catalog-dialog').showModal();};
$('catalog-search').oninput=renderCatalog;
$('catalog-apply').onclick=()=>{if(catalogDraft.size!==E.TYPES)return;chosenCatalog=[...catalogDraft];$('catalog-dialog').close();start();};
$('catalog-random').onclick=()=>{chosenCatalog=[];$('catalog-dialog').close();start();};
$('image-credits').innerHTML='<p>Полный каталог из 58 изображений перенесён из предоставленного архива match-3-game-1.0.0. Источники и лицензия: <a href="SOURCES.md" target="_blank" rel="noopener">SOURCES.md →</a></p>';
start();
