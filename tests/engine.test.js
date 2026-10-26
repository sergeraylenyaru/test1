const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../engine.js');
const stable=()=>Array.from({length:64},(_,i)=>(Math.floor(i/8)+i%8)%6);
test('новые поля не имеют совпадений и содержат доступный ход',()=>{
  for(let n=0;n<200;n++) {const b=E.create();assert.equal(b.length,64);assert.equal(E.matches(b).length,0);const [a,c]=E.possible(b);assert.ok(E.adjacent(a,c));E.swap(b,a,c);assert.ok(E.matches(b).length>=3);}
});
test('границы строк не считаются соседством',()=>{assert.equal(E.adjacent(7,8),false);assert.equal(E.adjacent(0,8),true);assert.equal(E.adjacent(0,9),false);});
test('находит горизонтальные, вертикальные и длинные комбинации',()=>{
  const b=stable();[0,1,2,3,8,16].forEach(i=>b[i]=5);
  const found=E.matches(b);[0,1,2,3,8,16].forEach(i=>assert.ok(found.includes(i)));assert.equal(found.length,new Set(found).size);
});
test('не соединяет совпадения через границу строки',()=>{const b=stable();[7,8,9].forEach(i=>b[i]=4);assert.deepEqual(E.matches(b),[]);});
test('поиск подсказки сохраняет исходное поле',()=>{const b=E.create(),copy=[...b];E.possible(b);assert.deepEqual(b,copy);});
test('падение сохраняет порядок фишек и заполняет поле',()=>{
  const b=stable(),old=[...b];E.collapse(b,[40,48,56]);
  assert.equal(b[56],old[32]);assert.equal(b[48],old[24]);assert.equal(b[40],old[16]);
  assert.ok(b.every(v=>Number.isInteger(v)&&v>=0&&v<6));
});
test('случайные партии завершаются с корректными каскадами',()=>{
  for(let game=0;game<15;game++) {let b=E.create();for(let turn=0;turn<30;turn++) {
    const pair=E.possible(b);assert.ok(pair);E.swap(b,...pair);let matches=E.matches(b),chain=0;assert.ok(matches.length);
    while(matches.length){assert.ok(chain++<100);E.collapse(b,matches);matches=E.matches(b);}
    if(!E.possible(b))b=E.create();assert.equal(E.matches(b).length,0);
  }}
});
