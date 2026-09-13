/* Exact SVG diagram generation plus bounded PNG rasterization in the browser. */
(function(root){
'use strict';
const B=typeof module!=='undefined'?require('./bracket.js'):root.Bracket;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const short=(s,n=20)=>{const a=Array.from(String(s).replace(/\s+/g,' '));return a.length>n?a.slice(0,n-1).join('')+'…':a.join('');};
function layout(b){const g=B.graph(b.entries,b.k),nodes=[],byNode=new Map(),width=252,gap=52,top=126;let cursor=top;
 const visit=id=>{const m=g.byId.get(id),sources=[];if(m.round>0){m.sources.forEach(s=>{if(s.type==='match')sources.push(visit(s.id));else{const node={id:`entry-${s.id}`,entry:s.id,round:0,x:28,y:cursor+36,w:width,h:72};cursor+=96;nodes.push(node);byNode.set(node.id,node);sources.push(node);}});}
 const h=44+m.sources.length*28;let y;if(m.round===0){y=cursor+h/2;cursor+=h+24;}else y=(sources[0].y+sources.at(-1).y)/2;
 const node={id:m.id,match:m,round:m.round,x:28+m.round*(width+gap),y,w:width,h,sources};nodes.push(node);byNode.set(id,node);return node;};
 visit(g.root);return {g,nodes,byNode,width:56+g.rounds.length*(width+gap)-gap,height:Math.max(cursor+48,...nodes.map(n=>n.y+n.h/2+48))};}
function presentation(b,mode){const hidden=mode==='anonymous',initial=mode!=='current',g=B.graph(b.entries,b.k),st=B.status(b,g,initial),entries=new Map(b.entries.map((e,i)=>[e.id,{...e,display:hidden?`回答 ${String(i+1).padStart(3,'0')}`:e.name}]));return {hidden,initial,g,st,entries};}
function svgStart(w,h,title,subtitle){return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#10151f"/><g font-family="sans-serif"><text x="28" y="38" fill="#96e8c4" font-size="21" font-weight="700">${esc(short(title,Math.max(8,Math.floor((w-56)/21))))}</text><text x="28" y="65" fill="#b6c4d8" font-size="12">${esc(short(subtitle,Math.max(12,Math.floor((w-56)/12))))}</text>`;}
function card(node,p){const x=node.x,y=node.y-node.h/2,w=node.w;let s=`<rect x="${x}" y="${y}" width="${w}" height="${node.h}" rx="8" fill="#192231" stroke="#45536a"/>`;
 if(node.entry)return s+`<text x="${x+12}" y="${y+22}" font-size="11" fill="#9daec5">シード / 初戦免除</text><text x="${x+12}" y="${y+50}" font-size="14" fill="#e7ecf4">${esc(short(p.entries.get(node.entry).display,18))}</text>`;
 const m=node.match,st=p.st.states.get(m.id);s+=`<text x="${x+12}" y="${y+24}" font-size="12" fill="#96e8c4">${esc(m.id)} · ${m.sources.length}人戦</text>`;
 m.sources.forEach((src,i)=>{const rowY=y+38+i*28,id=st.slots[i],text=id?p.entries.get(id).display:`${src.id} の勝者`,won=id&&st.winner===id;
 if(won)s+=`<rect x="${x+5}" y="${rowY}" width="${w-10}" height="27" rx="4" fill="#285041"/>`;
 s+=`<text x="${x+12}" y="${rowY+19}" font-size="13" fill="${won?'#a1f1cc':'#e7ecf4'}">${won?'✓ ':''}${esc(short(text,won?16:18))}</text>`;});return s;
}
function diagram(b,title,mode='current'){const l=layout(b),p=presentation(b,mode),suffix=mode==='anonymous'?'事前公開 / 回答名・勝敗非表示':mode==='preview'?'事前公開 / 勝敗非表示':'現在の進行状況';const champion=p.st.champion?p.entries.get(p.st.champion).display:null;
 let s=svgStart(l.width,l.height,title,`${b.entries.length}回答 · 最大${b.k}人戦 · ${l.g.rounds.length}ラウンド · ${suffix}${champion?' · 優勝：'+short(champion,22):''}`);
 for(let r=0;r<l.g.rounds.length;r++)s+=`<text x="${28+r*304}" y="101" fill="#b6c4d8" font-size="14">${r===l.g.rounds.length-1?'決勝':`ラウンド ${r+1}`}</text>`;
 for(const n of l.nodes){if(!n.sources)continue;n.sources.forEach((child,i)=>{const x1=child.x+child.w,y1=child.y,x2=n.x,y2=n.y-n.h/2+52+i*28,mid=x1+26;s+=`<path d="M${x1} ${y1} H${mid} V${y2} H${x2}" fill="none" stroke="#5c708b" stroke-width="1.5"/>`;});}
 for(const n of l.nodes)s+=card(n,p);s+='</g></svg>';return {svg:s,width:l.width,height:l.height};}
function roundPages(b,title,round,mode='current'){const p=presentation(b,mode),matches=p.g.rounds[round];if(!matches)throw Error('ラウンドを選択してください。');const pages=[],perPage=8;
 for(let offset=0;offset<matches.length;offset+=perPage){const items=matches.slice(offset,offset+perPage),h=44+b.k*28,rows=Math.ceil(items.length/2),width=824,height=150+rows*(h+44);let s=svgStart(width,height,title,`${mode==='anonymous'?'事前公開 / 回答名・勝敗非表示':mode==='preview'?'事前公開 / 勝敗非表示':'現在の進行状況'} · ラウンド${round+1} · ${offset/perPage+1}/${Math.ceil(matches.length/perPage)}ページ`);
 items.forEach((m,i)=>{const y=110+Math.floor(i/2)*(h+44),node={match:m,x:28+(i%2)*394,y:y+(44+m.sources.length*28)/2,w:374,h:44+m.sources.length*28};s+=card(node,p);const parent=p.g.matches.find(other=>other.sources.some(src=>src.type==='match'&&src.id===m.id));s+=`<text x="${node.x+8}" y="${y+node.h+20}" font-size="12" fill="#aebed2">勝者 → ${parent?esc(parent.id):'優勝'}</text>`;});s+='</g></svg>';pages.push({svg:s,width,height});}
 return pages;}
async function png(art){
 // iOS canvas limits: bound both dimensions and total pixels before allocating.
 const scale=Math.min(2,8192/art.width,8192/art.height,Math.sqrt(12000000/(art.width*art.height)));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.floor(art.width*scale));canvas.height=Math.max(1,Math.floor(art.height*scale));const ctx=canvas.getContext('2d');if(!ctx)throw Error('画像の描画領域を作成できませんでした。');
 const url=URL.createObjectURL(new Blob([art.svg],{type:'image/svg+xml;charset=utf-8'}));
 try{const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('画像の描画に失敗しました。'));img.src=url;});ctx.drawImage(img,0,0,canvas.width,canvas.height);return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('PNGを生成できませんでした。')),'image/png'));}finally{URL.revokeObjectURL(url);canvas.width=1;canvas.height=1;}
}
const api={layout,diagram,roundPages,png};if(typeof module!=='undefined')module.exports=api;else root.BracketImage=api;
})(globalThis);
