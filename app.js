'use strict';
const E=window.MatchEngine,$=id=>document.getElementById(id),N=E.SIZE;
const brands=[
 {name:'Marlboro Ice Burst',file:'marlboro',color:'#7fc4c9',crop:[76,82,248,235]},
 {name:'Sampoerna A Mild',file:'sampoerna-mild',color:'#e7a084',crop:[105,82,189,235]},
 {name:'Sampoerna Menthol',file:'sampoerna-menthol',color:'#9dcabb',crop:[75,81,248,236]},
 {name:'Sampoerna Splash',file:'sampoerna-splash',color:'#dfc283',crop:[57,63,285,275]}
];
const titles=['Первая полка','Точный расчёт','Цепная реакция','Золотая середина','Большая перестановка','Искусство каскада','Особая коллекция','На своём месте','Полный порядок','Мастер комбинаций','Тонкая работа','Идеальный шкаф'];
const tips=['Четыре в ряд? Получится пачка, которая очистит целую полку.','Спецпачку можно совместить с другой спецпачкой — без ряда из трёх.','Призма и пачка одной марки убирают всю эту марку со шкафа.','Пачки сверху падают вниз. Планируй следующий каскад заранее.'];
const storage={get(k,f){try{return JSON.parse(localStorage.getItem(k))??f;}catch{return f;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}};
const saved=storage.get('brandmatch-cabinet',{});let unlocked=Math.max(1,Math.min(12,Number(saved.unlocked)||1)),best=Math.max(0,Number(saved.best)||Number(storage.get('brandmatch-best',0))||0),level=Math.min(unlocked,Math.max(1,Number(saved.level)||1)),sound=!!saved.sound;
let board=[],score=0,moves=0,collected=Array(E.TYPES).fill(0),selected=null,busy=false,ended=false,epoch=0,hammer=false,hammers=3,shuffles=2,config,nodes=new Map(),idleTimer,audioContext;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,reduced?Math.min(ms,20):ms));
function save(){storage.set('brandmatch-cabinet',{unlocked,best,level,sound});}
function levelConfig(n){return{target:1000+(n-1)*300,moves:26-Math.min(6,Math.floor((n-1)/2)),goals:[{type:(n-1)%E.TYPES,count:9+Math.floor(n*1.8)},{type:n%E.TYPES,count:7+Math.floor(n*1.5)}]};}
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
 $('goal-current').textContent=score.toLocaleString('ru');$('goal-total').textContent=config.target.toLocaleString('ru');$('goal-progress').style.width=`${Math.min(100,score/config.target*100)}%`;
 $('goal-check').textContent=score>=config.target?'ОЧКИ СОБРАНЫ':'В ПРОЦЕССЕ';
 [...$('stars').children].forEach((s,i)=>s.classList.toggle('lit',score>=config.target*[1,1.5,2][i]));
 for(const g of config.goals){const el=document.querySelector(`[data-goal="${g.type}"]`);if(el){el.querySelector('strong').textContent=Math.min(g.count,collected[g.type]);el.classList.toggle('done',collected[g.type]>=g.count);}}
 $('hammer-count').textContent=hammers;$('shuffle-count').textContent=shuffles;$('hammer').setAttribute('aria-pressed',String(hammer));$('board').classList.toggle('hammer-mode',hammer);
 $('hammer').disabled=busy||ended||!hammers;$('shuffle').disabled=busy||ended||!shuffles;$('hint').disabled=busy||ended;
}
function makeNode(t){
 const button=document.createElement('button');button.className='tile';button.type='button';button.dataset.id=t.id;const pack=document.createElement('span');pack.className='pack';
 if(t.type<0){pack.innerHTML='<span class="prism-face">✧<small>PRISM</small></span>';}
 else{const img=document.createElement('img');img.src=`assets/originals/${brands[t.type].file}.jpg`;img.alt='';img.draggable=false;const [x,y,w,h]=brands[t.type].crop;img.style.cssText=`width:${400/w*100}%;height:${400/h*100}%;left:${-x/w*100}%;top:${-y/h*100}%;position:absolute;max-width:none`;const face=document.createElement('span');face.className='pack-face';face.append(img);pack.append(face);}
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
 epoch++;clearTimeout(idleTimer);level=n;config=levelConfig(n);board=E.create();score=0;moves=config.moves;collected=Array(E.TYPES).fill(0);busy=false;ended=false;selected=null;hammer=false;hammers=3;shuffles=2;
 $('end-dialog').close();$('combo').className='combo';$('particles').replaceChildren();$('board').replaceChildren();nodes.clear();route();
 $('level-label').textContent=`УРОВЕНЬ ${String(n).padStart(2,'0')}`;$('level-name').textContent=titles[n-1].toUpperCase();$('cabinet-number').textContent=String(n).padStart(2,'0');$('mission-title').textContent=titles[n-1];$('tip').textContent=tips[(n-1)%tips.length];
 $('collect-goals').replaceChildren(...config.goals.map(g=>{const el=document.createElement('div');el.className='collect-goal';el.dataset.goal=g.type;el.title=`Собери ${g.count} пачек ${brands[g.type].name}`;el.innerHTML=`<span class="mini-pack" role="img" aria-label="${brands[g.type].name}" style="--pack-image:url(assets/originals/${brands[g.type].file}.jpg);--crop-w:${400/brands[g.type].crop[2]*100}%;--crop-h:${400/brands[g.type].crop[3]*100}%;--crop-x:${-brands[g.type].crop[0]/brands[g.type].crop[2]*22}px;--crop-y:${-brands[g.type].crop[1]/brands[g.type].crop[3]*30}px"></span><div><strong>0</strong><small> / ${g.count}</small></div>`;return el;}));
 render();status('Выбери пачку и соседнюю — или перетащи её');save();scheduleHint();
}
function scheduleHint(){clearTimeout(idleTimer);if(!ended)idleTimer=setTimeout(()=>{if(!busy&&!hammer&&!document.querySelector('dialog[open]'))showHint(false);},10000);}
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
  chain++;const points=(plan.cleared.length*40+plan.spawns.size*80)*Math.min(chain,8);score+=points;
  plan.cleared.forEach(i=>{const t=board[i];if(t.type>=0)collected[t.type]++;nodes.get(t.id)?.classList.add('removing');particles(i,t.type>=0?brands[t.type].color:'#f4dda1');});
  plan.activated.forEach(i=>effect(i,board[i].special));
  if(plan.activated.length){document.querySelector('.cabinet').classList.remove('shake');void $('board').offsetWidth;document.querySelector('.cabinet').classList.add('shake');beep('special');}else beep('clear',chain);
  if(chain>1)combo(chain>=4?'Вот это каскад!':'Красиво!',`КОМБО ×${chain} · +${points}`);
  else if(plan.spawns.size)combo('Особая комбинация','СПЕЦПАЧКА СОЗДАНА');
  const el=document.createElement('span'),pos=position(plan.cleared[0]??[...plan.spawns.keys()][0]);el.className='float-score';el.textContent=`+${points}`;el.style.cssText=`left:${Math.min(83,pos.x)}%;top:${pos.y}%`;transient(el);
  status(chain>1?`Каскад ×${chain}! +${points} очков`:`Комбинация! +${points} очков`);updateStats();
  await sleep(350);if(run!==epoch)return;
  const result=E.collapse(board,plan.cleared,plan.spawns);board=result.board;render(result.origins);
  await sleep(330);if(run!==epoch)return;plan=E.plan(board);
 }
 if(run!==epoch)return;
 if(score>best){best=score;save();}
 const won=score>=config.target&&config.goals.every(g=>collected[g.type]>=g.count);
 if(won||moves===0){finish(won);return;}
 if(!E.possible(board)){await reshuffle(false,run);if(run!==epoch)return;status('Ходов не осталось — шкаф перемешан бесплатно');}
 busy=false;render();scheduleHint();
}
async function move(a,b){
 if(busy||ended||!E.adjacent(a,b))return;
 clearTimeout(idleTimer);const run=epoch;selected=null;hammer=false;busy=true;E.swap(board,a,b);render();beep();await sleep(260);if(run!==epoch)return;
 const plan=E.swapPlan(board,a,b);
 if(!plan.cleared.length&&!plan.spawns.size){
  [a,b].forEach(i=>nodes.get(board[i].id)?.classList.add('bad'));beep('bad');status('Собери три одинаковые пачки. Этот обмен не тратит ход.');await sleep(180);if(run!==epoch)return;
  E.swap(board,a,b);render();await sleep(260);if(run!==epoch)return;busy=false;render();scheduleHint();return;
 }
 moves--;await resolve(plan,run);
}
async function choose(i){
 if(busy||ended)return;
 if(hammer){hammer=false;hammers--;busy=true;selected=null;render();await resolve({...E.expand(board,[i]),spawns:new Map()},epoch);return;}
 beep();if(selected===null){selected=i;render();return;}if(selected===i){selected=null;render();return;}if(!E.adjacent(selected,i)){selected=i;render();return;}await move(selected,i);
}
function finish(won){
 busy=false;ended=true;hammer=false;
 const bonus=won?moves*35:0;score+=bonus;best=Math.max(best,score);if(won)unlocked=Math.min(12,Math.max(unlocked,level+1));save();render();
 $('end-eyebrow').textContent=won?'УРОВЕНЬ ПРОЙДЕН':'ЕЩЁ ОДНА ПОПЫТКА?';$('end-title').textContent=won?'Всё на своих местах.':'Почти получилось.';
 const stars=won?[1,1.5,2].filter(n=>score>=config.target*n).length:0;$('end-stars').textContent='★'.repeat(stars)+'☆'.repeat(3-stars);
 $('end-description').textContent=won?`Отличная работа! Бонус за ${moves} оставшихся ходов: +${bonus} очков.${level===12?' Все 12 уровней пройдены!':''}`:'Ходы закончились. Попробуй создавать спецпачки и совмещать их — так цели собираются быстрее.';
 $('end-score').textContent=score.toLocaleString('ru');$('end-best').textContent=best.toLocaleString('ru');$('next-level').hidden=!won||level===12;$('replay').textContent=won?'Повторить уровень':'Попробовать ещё';
 $('end-dialog').showModal();if(won)beep('win');status(won?'Уровень пройден!':'Ходы закончились');route();
}
async function reshuffle(paid=true,run=epoch){
 if(paid&&(busy||ended||!shuffles))return;
 if(paid){shuffles--;busy=true;selected=null;hammer=false;updateStats();}
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
 const target=e.target.closest('.tile');if(!target||busy||ended||hammer)return;
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
$('hammer').onclick=()=>{if(busy||ended||!hammers)return;hammer=!hammer;selected=null;render();status(hammer?'Выбери пачку, которую хочешь убрать. Ход не тратится.':'Выбери две соседние пачки');};
$('next-level').onclick=()=>start(Math.min(12,level+1));$('replay').onclick=()=>start();
function help(){if(!$('help-dialog').open)$('help-dialog').showModal();}
$('help').onclick=help;$('guide-link').onclick=help;
$('sources-link').onclick=()=>$('sources-dialog').showModal();
document.querySelectorAll('.dialog-close,.dialog-done').forEach(button=>button.onclick=()=>button.closest('dialog').close());
function soundUI(){$('sound').setAttribute('aria-label',sound?'Выключить звук':'Включить звук');$('sound').querySelector('span').hidden=sound;}
$('sound').onclick=()=>{sound=!sound;soundUI();save();beep();};soundUI();
$('shelves').innerHTML=Array.from({length:N},(_,i)=>`<div class="shelf" style="--row:${i+1}"></div>`).join('');
$('image-credits').innerHTML='<p>Источники изображений и сведения о подготовке файлов: <a href="SOURCES.md" target="_blank" rel="noopener">SOURCES.md ↗</a></p>';
start();
