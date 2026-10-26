(function(root){
'use strict';
function create({types=6,sectionCount=12,slots=6,open=50,random=Math.random}={}){
 if(!Number.isInteger(types)||types<1||!Number.isInteger(sectionCount)||sectionCount<types||!Number.isInteger(slots)||slots<1||!Number.isInteger(open)||open<sectionCount||open>sectionCount*slots)throw new RangeError('Invalid planogram dimensions');
 const base=open>=sectionCount*2?2:1;const requirements=Array(sectionCount).fill(base);let remaining=open-sectionCount*base;
 // Distribute every open facing once, with a hard upper bound per section.
 while(remaining){const eligible=requirements.map((v,i)=>v<slots?i:-1).filter(i=>i>=0);requirements[eligible[Math.floor(random()*eligible.length)]]++;remaining--;}
 const order=Array.from({length:sectionCount},(_,i)=>i%types);
 for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 return{slots,sections:order.map((type,id)=>({id,type,required:requirements[id],collected:0})),seen:new Set()};
}
function collect(state,items){
 const assigned=[];
 for(const item of items){if(!item||state.seen.has(item.id))continue;state.seen.add(item.id);if(item.type<0)continue;
  const goal=state.sections.find(g=>g.type===item.type&&g.collected<g.required);if(!goal)continue;
  const slot=goal.collected++;assigned.push({id:item.id,type:item.type,section:goal.id,slot});
 }return assigned;
}
function progress(state){
 const total=state.sections.length*state.slots,required=state.sections.reduce((n,g)=>n+g.required,0),collected=state.sections.reduce((n,g)=>n+g.collected,0),completed=state.sections.filter(g=>g.collected===g.required).length;
 return{total,required,collected,stocked:total-required,filled:total-required+collected,completed,won:completed===state.sections.length};
}
function rewards(spawns){
 const result={hammer:0,bomb:0,brush:0};for(const t of spawns.values()){if(t.special==='row'||t.special==='col')result.hammer++;if(t.special==='bomb')result.bomb++;if(t.special==='color')result.brush++;}return result;
}
const api={create,collect,progress,rewards};if(typeof module!=='undefined')module.exports=api;else root.Planogram=api;
})(typeof window!=='undefined'?window:globalThis);
