const E=window.MatchEngine;
const brands=[{name:'Marlboro',mark:'M',class:'marlboro'},{name:'Parliament',mark:'P',class:'parliament'},{name:'Chesterfield',mark:'C',class:'chesterfield'},{name:'L&M',mark:'L&M',class:'lm'},{name:'Bond Street',mark:'B',class:'bond'},{name:'Philip Morris',mark:'PM',class:'pm'}];
const $=id=>document.getElementById(id);
let board,score,moves,selected=null,busy=false,generation=0,best=0;
try { best=Number(localStorage.getItem('brandmatch-best'))||0; } catch {}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function render(){
  $('board').replaceChildren(...board.map((type,i)=>{
    const brand=brands[type],button=document.createElement('button');
    button.className=`tile ${brand.class}${selected===i?' selected':''}`;
    button.innerHTML=`<span class="mark">${brand.mark}</span><span class="brand-name">${brand.name}</span>`;
    button.setAttribute('aria-label',`${brand.name}, строка ${Math.floor(i/8)+1}, столбец ${i%8+1}`);
    button.setAttribute('aria-pressed',String(selected===i));button.disabled=busy||moves===0;
    button.onclick=()=>choose(i);return button;
  }));
  $('score').textContent=score.toLocaleString('ru');$('moves').textContent=moves;$('best').textContent=best.toLocaleString('ru');
}
function start(){generation++;board=E.create();score=0;moves=30;selected=null;busy=false;$('end').hidden=true;$('status').textContent='Собери три одинаковые фишки в ряд';render();}
async function choose(i){
  if(busy||!moves)return;
  if(selected===null){selected=i;render();return;}
  if(selected===i){selected=null;render();return;}
  if(!E.adjacent(selected,i)){selected=i;render();return;}
  const a=selected,run=generation;selected=null;busy=true;E.swap(board,a,i);render();
  let found=E.matches(board);
  if(!found.length){$('status').textContent='Нужен ряд из трёх. Попробуй другую пару.';await pause(230);if(run!==generation)return;E.swap(board,a,i);busy=false;render();return;}
  moves--;let chain=0;
  while(found.length){
    chain++;score+=found.length*10*chain;
    $('status').textContent=chain>1?`Каскад ×${chain}! +${found.length*10*chain} очков`:`Отлично! +${found.length*10} очков`;
    found.forEach(index=>$('board').children[index].classList.add('matched'));
    await pause(280);if(run!==generation)return;
    E.collapse(board,found);render();await pause(150);if(run!==generation)return;found=E.matches(board);
  }
  if(score>best){best=score;try{localStorage.setItem('brandmatch-best',String(best));}catch{}}
  if(moves&&!E.possible(board)){board=E.create();$('status').textContent='Нет комбинаций — поле перемешано бесплатно.';}
  busy=false;render();
  if(!moves){$('result').textContent=`Твой результат — ${score.toLocaleString('ru')} очков.`;$('end').hidden=false;}
}
$('restart').onclick=start;$('again').onclick=start;
$('hint').onclick=()=>{if(busy||!moves)return;selected=null;render();const pair=E.possible(board);if(pair){pair.forEach(i=>$('board').children[i].classList.add('hint'));$('status').textContent='Поменяй подсвеченные фишки местами';}};
start();
