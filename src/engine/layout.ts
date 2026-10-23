import {StudioError,type Scene,type SceneObject} from '../contracts/schemas';
import type {Box,TextMeasurer,TextMeasurement} from './types';

const W=720,H=1280,LEFT=54,RIGHT=666,TOP=230,BOTTOM=1070,GAP=22;
const fontSizes={sm:28,md:39,lg:57,xl:73};
export type LayoutObject={source:SceneObject;box:Box;fontSize?:number;lines?:string[]};
type Measured={obj:SceneObject;width:number;height:number;fontSize?:number;lines?:string[]};

function arrangeMembers(members:Measured[],scene:Scene,available:Box):Box[] {
 const n=members.length;if(!n)return [];
 const width=available.width,height=available.height;
 const variant=scene.layout==='diagram'?(scene.diagramVariant??'row'):scene.layout;
 const result:Box[]=[];
 if(variant==='split'||variant==='columns'){
  const cols=Math.min(2,n),colWidth=(width-GAP)/cols;
  const left=members.filter((_,i)=>i%2===0),right=members.filter((_,i)=>i%2===1);
  for(let i=0;i<n;i++){
   const col=i%2,part=col?right:left,idx=part.indexOf(members[i]);
   const total=part.reduce((s,m)=>s+m.height,0)+Math.max(0,part.length-1)*GAP;
   const y=available.y+(height-total)/2+part.slice(0,idx).reduce((s,m)=>s+m.height+GAP,0);
   result.push({x:available.x+col*(colWidth+GAP)+(colWidth-members[i].width)/2,y,width:members[i].width,height:members[i].height});
  }
 }else if(variant==='row'){
  const total=members.reduce((s,m)=>s+m.width,0)+GAP*(n-1);
  let x=available.x+(width-total)/2;
  for(const m of members){result.push({x,y:available.y+(height-m.height)/2,width:m.width,height:m.height});x+=m.width+GAP;}
 }else if(variant==='hub'){
  if(n>5)throw new StudioError('LAYOUT_UNSUPPORTED','Hub supports 1-5 root objects',scene.id);
  const center=members[0];result.push({x:available.x+(width-center.width)/2,y:available.y+(height-center.height)/2,width:center.width,height:center.height});
  const spots=[[-0.32,-0.31],[0.32,-0.31],[-0.32,0.31],[0.32,0.31]];
  for(let i=1;i<n;i++){const m=members[i],p=spots[i-1];result.push({x:available.x+width/2+p[0]*width-m.width/2,y:available.y+height/2+p[1]*height-m.height/2,width:m.width,height:m.height});}
 }else if(variant==='focus'||variant==='stack'){
  const gap=variant==='focus'?32:GAP;
  const total=members.reduce((s,m)=>s+m.height,0)+gap*(n-1);
  let y=available.y+(height-total)/2;
  for(const m of members){result.push({x:available.x+(width-m.width)/2,y,width:m.width,height:m.height});y+=m.height+gap;}
 }else throw new StudioError('LAYOUT_UNSUPPORTED',variant,scene.id);
 return result;
}

function isOverlap(a:Box,b:Box){return a.x<b.x+b.width-2&&a.x+a.width>b.x+2&&a.y<b.y+b.height-2&&a.y+a.height>b.y+2;}

export async function compileLayout(scene:Scene, measurer:TextMeasurer):Promise<LayoutObject[]> {
 const byId=new Map(scene.objects.map(o=>[o.id,o]));
 const children=new Map<string,SceneObject[]>();
 for(const obj of scene.objects)if(obj.parentId)children.set(obj.parentId,[...(children.get(obj.parentId)??[]),obj]);
 const roots=scene.objects.filter(o=>!o.parentId);
 const MAX_WIDTH=(scene.layout==='split'||scene.diagramVariant==='columns')?258:560;
 const measured=new Map<string,Measured>();
 async function measure(obj:SceneObject,limit:number):Promise<Measured>{
  const p=obj.props,sz=String(p.size??'md') as keyof typeof fontSizes;
  if(obj.kind==='text'){
   const base=fontSizes[sz]??39,txt=String(p.text);let last:TextMeasurement|undefined;
   for(let f=base;f>=24;f-=2){
    const m=await measurer.measure({text:txt,fontSize:f,fontFamily:'Segoe UI, Arial, Noto Sans, sans-serif',weight:p.weight==='normal'?400:800,maxWidth:limit,lineHeight:1.22});
    last=m;
    if(m.height<=220 && m.width<=limit+0.5){return {obj,width:Math.min(limit,Math.max(80,m.width+4)),height:Math.ceil(m.height+7),fontSize:f,lines:m.lines};}
   }
   throw new StudioError('TEXT_OVERFLOW',`Text cannot fit: ${txt.slice(0,65)}`,`${scene.id}.${obj.id}`);
  }
  if(obj.kind==='group'){
    const kids=children.get(obj.id)??[];
    const gap=Number(p.gap??14),horizontal=p.direction==='row';
    const mKids:Measured[]=[];
    for(const k of kids)mKids.push(await measure(k,horizontal?Math.min(235,limit/Math.max(1,kids.length)):limit-38));
    let width=horizontal?mKids.reduce((s,m)=>s+m.width,0)+gap*Math.max(0,kids.length-1)+30:Math.max(90,...mKids.map(m=>m.width))+30;
    let height=horizontal?Math.max(65,...mKids.map(m=>m.height))+30:mKids.reduce((s,m)=>s+m.height,0)+gap*Math.max(0,kids.length-1)+30;
    if(!kids.length){width=180;height=85;}
    const result={obj,width,height};measured.set(obj.id,result);return result;
  }
  const scale={sm:0.55,md:0.8,lg:1,xl:1.18}[sz]??0.8;
  const dimensions=obj.kind==='image'?[270,225]:obj.kind==='path'?[215,105]:obj.kind==='arrow'?[115,85]:[145,145];
  const width=dimensions[0]*scale,height=dimensions[1]*scale;
  return {obj,width,height};
 }
 const rootsMeasured:Measured[]=[];
 for(const root of roots){const m=await measure(root,MAX_WIDTH);measured.set(root.id,m);rootsMeasured.push(m);}
 // Order only when consistent with selected layout strategy.
 for(const r of scene.relations){
  if(r.kind==='inside'){
   const child=byId.get(r.from),parent=byId.get(r.to);
   if(child?.parentId!==parent?.id || parent?.kind!=='group')throw new StudioError('UNSUPPORTED_LAYOUT_RELATION',`inside ${r.from} -> ${r.to}`,scene.id);
  }
  if(r.kind==='groupWith'){
   const a=byId.get(r.from),b=byId.get(r.to);
   if(!a?.parentId||a.parentId!==b?.parentId)throw new StudioError('UNSUPPORTED_LAYOUT_RELATION','groupWith requires a shared parent group',scene.id);
  }
  if(r.kind==='annotates')throw new StudioError('UNSUPPORTED_LAYOUT_RELATION','annotates anchors are not implemented in stage 1',scene.id);
 }
 for(const obj of scene.objects)if(obj.kind==='group'&&obj.parentId)throw new StudioError('UNSUPPORTED_NESTED_GROUP',obj.id,scene.id);
 const ordering=scene.relations.filter(r=>['above','below','beside'].includes(r.kind));
 for(const r of ordering){
  if(scene.layout==='stack' && r.kind==='beside') throw new StudioError('UNSUPPORTED_LAYOUT_RELATION',r.kind,scene.id);
  if(scene.layout==='split' && r.kind!=='beside') throw new StudioError('UNSUPPORTED_LAYOUT_RELATION',r.kind,scene.id);
  if(scene.layout==='focus' && r.kind==='beside') throw new StudioError('UNSUPPORTED_LAYOUT_RELATION',r.kind,scene.id);
 }
 // Root ordering in stack uses above/below edges and stable topological sorting.
 if(scene.layout==='stack' || scene.layout==='focus'){
  const order=new Map(rootsMeasured.map((m,i)=>[m.obj.id,i]));
  const edges=ordering.filter(r=>r.kind!=='beside').map(r=>r.kind==='below'?[r.to,r.from]:[r.from,r.to]);
  const indegree=new Map(rootsMeasured.map(m=>[m.obj.id,0]));
  for(const [a,b] of edges)if(indegree.has(a)&&indegree.has(b))indegree.set(b,(indegree.get(b)??0)+1);
  const result:Measured[]=[];const remain=[...rootsMeasured];
  while(remain.length){const eligible=remain.filter(m=>indegree.get(m.obj.id)===0).sort((a,b)=>(order.get(a.obj.id)??0)-(order.get(b.obj.id)??0));
   if(!eligible.length)throw new StudioError('LAYOUT_CYCLE',scene.id);
   const m=eligible[0];result.push(m);remain.splice(remain.indexOf(m),1);
   for(const [a,b] of edges)if(a===m.obj.id&&indegree.has(b))indegree.set(b,(indegree.get(b)??0)-1);
  }
  rootsMeasured.splice(0,rootsMeasured.length,...result);
 }
 const placements=arrangeMembers(rootsMeasured,scene,{x:LEFT,y:TOP,width:RIGHT-LEFT,height:BOTTOM-TOP});
 const layout:LayoutObject[]=[];
 const placedRoots=new Map(rootsMeasured.map((m,i)=>[m.obj.id,placements[i]]));
 for(const r of ordering){
   const a=placedRoots.get(r.from),b=placedRoots.get(r.to);
   if(!a||!b)continue;
   if(r.kind==='above' && a.y+a.height>b.y+1)throw new StudioError('UNSATISFIED_LAYOUT_RELATION',`above ${r.from} -> ${r.to}`,scene.id);
   if(r.kind==='below' && b.y+b.height>a.y+1)throw new StudioError('UNSATISFIED_LAYOUT_RELATION',`below ${r.from} -> ${r.to}`,scene.id);
   if(r.kind==='beside' && a.x+a.width>b.x+1)throw new StudioError('UNSATISFIED_LAYOUT_RELATION',`beside ${r.from} -> ${r.to}`,scene.id);
 }

 function place(measuredObj:Measured,box:Box){
  if(box.x<LEFT-1||box.y<TOP-1||box.x+box.width>RIGHT+1||box.y+box.height>BOTTOM+1)throw new StudioError('LAYOUT_OVERFLOW',measuredObj.obj.id,scene.id);
  layout.push({source:measuredObj.obj,box,fontSize:measuredObj.fontSize,lines:measuredObj.lines});
 }
 for(let i=0;i<rootsMeasured.length;i++){
  const root=rootsMeasured[i],box=placements[i];place(root,box);
  if(root.obj.kind==='group'){
    const kids=children.get(root.obj.id)??[],gap=Number(root.obj.props.gap??14),horizontal=root.obj.props.direction==='row';
    let x=box.x+15,y=box.y+15;
    for(const kid of kids){
      const m=await measure(kid,horizontal?220:Math.max(90,box.width-30));
      measured.set(kid.id,m);const cb={x,y,width:m.width,height:m.height};
      place(m,cb);if(horizontal)x+=m.width+gap;else y+=m.height+gap;
    }
  }
 }
 // Roots must never overlap, except diagram hub intentional relationships (only siblings).
 if(scene.layout!=='diagram')for(let i=0;i<placements.length;i++)for(let j=i+1;j<placements.length;j++)if(isOverlap(placements[i],placements[j]))throw new StudioError('OBJECT_COLLISION',`${rootsMeasured[i].obj.id} x ${rootsMeasured[j].obj.id}`,scene.id);
 return layout;
}
