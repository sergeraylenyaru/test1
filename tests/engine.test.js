const{test}=require('node:test');const assert=require('node:assert/strict');const E=require('../engine.js'),N=E.SIZE;
const stable=()=>Array.from({length:N*N},(_,i)=>E.tile((Math.floor(i/N)+i%N)%E.TYPES));
function line(b,indices,type=0){indices.forEach(i=>b[i]=E.tile(type));return b;}
test('генератор: 300 стабильных полей с доступным ходом и уникальными ID',()=>{
 for(let n=0;n<300;n++){const b=E.create();assert.equal(b.length,N*N);assert.equal(E.groups(b).length,0);assert.equal(new Set(b.map(t=>t.id)).size,b.length);const[a,c]=E.possible(b);assert.ok(E.adjacent(a,c));E.swap(b,a,c);assert.ok(E.swapPlan(b,a,c).cleared.length);}
});
test('соседство: границы, отрицательные индексы и диагонали',()=>{assert.equal(E.adjacent(6,7),false);assert.equal(E.adjacent(0,7),true);assert.equal(E.adjacent(0,8),false);assert.equal(E.adjacent(-1,0),false);assert.equal(E.adjacent(48,49),false);});
test('подсказка не изменяет поле',()=>{const b=E.create(),copy=JSON.stringify(b);E.possible(b);assert.equal(JSON.stringify(b),copy);});
test('три в ряд удаляются без спецпачки',()=>{const b=line(stable(),[0,1,2],2),p=E.plan(b);assert.equal(p.spawns.size,0);assert.ok([0,1,2].every(i=>p.cleared.includes(i)));});
test('четыре в ряд создают горизонтальную спецпачку на месте обмена',()=>{const b=line(stable(),[0,1,2,3],3),p=E.plan(b,E.groups(b),[1]);assert.equal(p.spawns.get(1).special,'row');assert.equal(p.cleared.includes(1),false);});
test('вертикальные четыре создают вертикальную спецпачку',()=>{const b=line(stable(),[0,7,14,21],3),p=E.plan(b);assert.ok([...p.spawns.values()].some(t=>t.special==='col'));});
test('пять в ряд создают призму',()=>{const b=line(stable(),[0,1,2,3,4],3),p=E.plan(b);assert.ok([...p.spawns.values()].some(t=>t.special==='color'&&t.type===-1));});
test('Т-комбинация создаёт одну взрывную спецпачку',()=>{const b=line(stable(),[1,7,8,9,15],3),p=E.plan(b);assert.equal(p.spawns.size,1);assert.equal([...p.spawns.values()][0].special,'bomb');assert.equal(p.cleared.length,4);});
test('полка запускает вертикаль и взрывную спецпачку цепочкой',()=>{const b=stable();b[0].special='row';b[3].special='col';b[24].special='bomb';const p=E.expand(b,[0]);assert.ok(p.activated.includes(3));assert.ok(p.activated.includes(24));assert.ok(p.cleared.includes(25));assert.equal(p.cleared.length,new Set(p.cleared).size);});
test('взрыв не переходит через край строки',()=>{const b=stable();b[6].special='bomb';const p=E.expand(b,[6]);assert.deepEqual(p.cleared.sort((a,b)=>a-b),[5,6,12,13]);});
test('призма + марка убирает только выбранный цвет',()=>{const b=stable();b[0]=E.tile(-1,'color');b[1]=E.tile(1);const p=E.swapPlan(b,0,1);assert.ok(p.cleared.includes(0));assert.ok(b.every((t,i)=>p.cleared.includes(i)===(i===0||t.type===1)));});
test('две призмы убирают всё поле',()=>{const b=stable();b[0]=E.tile(-1,'color');b[1]=E.tile(-1,'color');assert.equal(E.swapPlan(b,0,1).cleared.length,N*N);});
test('две спецпачки активируются без совпадений',()=>{const b=stable();b[0].special='row';b[1].special='col';const p=E.swapPlan(b,0,1);assert.ok(p.cleared.length>=N*2);});
test('падение сохраняет порядок, новые пачки приходят сверху',()=>{const b=stable(),old=[...b],p=E.collapse(b,[28,35,42]);assert.equal(p.board[42].id,old[21].id);assert.equal(p.board[35].id,old[14].id);assert.equal(p.board[28].id,old[7].id);assert.equal(p.origins.get(p.board[0].id)<0,true);assert.equal(new Set(p.board.map(t=>t.id)).size,N*N);});
test('созданная спецпачка переживает падение',()=>{const b=line(stable(),[0,1,2,3],3),plan=E.plan(b,E.groups(b),[1]);const special=plan.spawns.get(1),p=E.collapse(b,plan.cleared,plan.spawns);assert.ok(p.board.some(t=>t.id===special.id&&t.special==='row'));});
test('полные случайные партии: каскады, спецпачки и стабильность',()=>{
 for(let game=0;game<30;game++){let b=E.create();for(let turn=0;turn<26;turn++){
  const pair=E.possible(b);if(!pair){b=E.create();continue;}E.swap(b,...pair);let plan=E.swapPlan(b,...pair),chain=0;assert.ok(plan.cleared.length||plan.spawns.size);
  while(plan.cleared.length||plan.spawns.size){assert.ok(chain++<150,'каскад должен завершаться');b=E.collapse(b,plan.cleared,plan.spawns).board;assert.equal(b.length,N*N);assert.ok(b.every(t=>t&&Number.isInteger(t.id)));plan=E.plan(b);}
  assert.equal(E.groups(b).length,0);
 }}
});
