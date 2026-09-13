(function(root){
'use strict';
const B=typeof module!=='undefined'?require('./bracket.js'):root.Bracket;
function appearances(b){const g=B.graph(b.entries,b.k),out=[];for(const m of g.matches)for(const s of m.sources)if(s.type==='entry')out.push({id:s.id,match:m.id});return out;}
function arrange(entries,k,rules=[],random=B.secureRandom){
 if(!rules.length)return B.shuffle(entries,random);
 const ids=new Set(entries.map(e=>e.id)),edges=new Map(entries.map(e=>[e.id,[]])),parents=new Map(entries.map(e=>[e.id,[]]));
 for(const r of rules){if(!ids.has(r.before)||!ids.has(r.after))throw Error('順序指定の回答が参加対象にありません。指定を見直してください。');if(r.before===r.after)throw Error('同じ回答を前後に指定できません。');if(!edges.get(r.before).includes(r.after)){edges.get(r.before).push(r.after);parents.get(r.after).push(r.before);}}
 const degree=new Map([...parents].map(([id,list])=>[id,list.length])),queue=[...ids].filter(id=>degree.get(id)===0);let visited=0;for(let i=0;i<queue.length;i++){visited++;for(const next of edges.get(queue[i])){degree.set(next,degree.get(next)-1);if(degree.get(next)===0)queue.push(next);}}if(visited!==entries.length)throw Error('順序指定が循環しています。A→B→Aなどの指定を解消してください。');
 const skeleton=B.create(entries,k),g=B.graph(entries,k),slots=appearances(skeleton),ancestors=new Map(g.matches.map(m=>[m.id,new Set(B.descendants(g,m.id))]));
 const conflict=(a,b)=>a===b||ancestors.get(a).has(b)||ancestors.get(b).has(a);
 if(!slots.some(a=>slots.some(b=>!conflict(a.match,b.match))))throw Error('この構成では初登場の対戦を分けられません。参加数を増やすか、1戦の人数を減らしてください。');
 for(let attempt=0;attempt<500;attempt++){
 const remaining=new Set(ids),placed=new Map(),assignment=new Map();let failed=false;
 for(const slot of slots){const candidates=[...remaining].filter(id=>parents.get(id).every(p=>placed.has(p)&&!conflict(placed.get(p),slot.match)));if(!candidates.length){failed=true;break;}const pick=candidates[Math.floor(random()*candidates.length)];placed.set(pick,slot.match);assignment.set(slot.id,pick);remaining.delete(pick);}
 if(!failed){const byId=new Map(entries.map(e=>[e.id,e]));return entries.map(e=>byId.get(assignment.get(e.id)));}
 }
 throw Error('指定条件を満たす抽選が見つかりませんでした。再度抽選するか、順序指定・1戦の人数を見直してください。');
}
const api={appearances,arrange};if(typeof module!=='undefined')module.exports=api;else root.EntryOrder=api;
})(globalThis);
