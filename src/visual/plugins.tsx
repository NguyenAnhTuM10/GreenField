import React,{createContext,useContext} from 'react';
import {z} from 'zod';
import {VisualRegistry,type ObjectViewProps,type TechniqueViewProps} from './registry';

const Color=z.enum(['foreground','muted','accent','danger','success','surface','line']);
const Size=z.enum(['sm','md','lg','xl']);
export const objectSchemas={
 text:z.strictObject({text:z.string().min(1).max(500),size:Size,weight:z.enum(['normal','bold']).default('bold'),color:Color.default('foreground'),align:z.enum(['left','center','right']).default('center')}),
 image:z.strictObject({src:z.string().regex(/^\/assets\/[a-zA-Z0-9_./-]+\.(png|jpg|jpeg|webp|svg)$/).refine(p=>!p.split('/').includes('..'),'Parent traversal forbidden'),fit:z.enum(['contain','cover']).default('contain'),size:Size.default('lg')}),
 shape:z.strictObject({shape:z.enum(['circle','rect','roundedRect']),size:Size.default('md'),color:Color.default('accent'),fill:z.boolean().default(true)}),
 path:z.strictObject({symbol:z.enum(['underline','swoosh','loop','check','cross','wave','orbit']),size:Size.default('md'),color:Color.default('accent')}),
 arrow:z.strictObject({direction:z.enum(['right','left','down','up']),size:Size.default('sm'),color:Color.default('accent')}),
 group:z.strictObject({direction:z.enum(['row','column']),gap:z.number().int().min(4).max(40).default(14),outlined:z.boolean().default(false),background:z.boolean().default(false)}),
};
export const techniqueSchemas={
 draw:z.strictObject({speed:z.enum(['slow','normal','fast']).default('normal')}),
 highlight:z.strictObject({color:Color.default('accent'),variant:z.enum(['underline','ring']).default('underline')}),
 transform:z.strictObject({motion:z.enum(['pop','rise','slide']).default('pop')}),
 compare:z.strictObject({tone:z.enum(['success','danger','accent']).default('accent')}),
 count:z.strictObject({from:z.number(),to:z.number(),suffix:z.string().max(8).default('')}),
 reveal:z.strictObject({direction:z.enum(['left','right','up']).default('left')}),
};
const paths:Record<string,string>={
 underline:'M 7 50 Q 40 48 72 54 T 190 47',
 swoosh:'M 10 66 Q 60 6 112 46 T 198 18',
 loop:'M 105 15 C 12 -2 -6 95 100 94 C 208 100 218 6 105 15',
 check:'M 15 55 L 76 89 L 185 8',
 cross:'M 20 20 L 180 88 M 178 13 L 22 90',
 wave:'M 5 54 Q 30 8 54 52 T 104 52 T 154 52 T 202 52',
 orbit:'M 10 54 C 60 -2 151 -8 201 51 C 158 107 63 112 10 54',
};
const strokeContext=createContext(1);
const TextView=({props,palette,fontSize,lines}:ObjectViewProps)=>{
 const color=palette[props.color as keyof typeof palette]??palette.foreground;
 return <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:props.align==='left'?'flex-start':props.align==='right'?'flex-end':'center',color,fontSize,fontWeight:props.weight==='normal'?450:800,lineHeight:1.2,textAlign:props.align as 'left'|'right'|'center',overflow:'hidden',whiteSpace:'pre-line',wordBreak:'normal',overflowWrap:'break-word',fontFamily:'"Segoe UI",Arial,"Noto Sans",sans-serif',letterSpacing:'-.025em'}}>{(lines?.length?lines:[String(props.text)]).join('\n')}</div>;
};
const ImageView=({props}:ObjectViewProps)=><img src={String(props.src)} style={{width:'100%',height:'100%',objectFit:props.fit as 'cover'|'contain',borderRadius:14}}/>;
const ShapeView=({props,palette}:ObjectViewProps)=>{const circle=props.shape==='circle',round=props.shape==='roundedRect';return <div style={{width:'100%',height:'100%',borderRadius:circle?'50%':round?20:0,background:props.fill?palette[props.color as keyof typeof palette]:'transparent',border:`5px solid ${palette[props.color as keyof typeof palette]}`}}/>;};
const PathView=({props,palette}:ObjectViewProps)=>{const v=useContext(strokeContext);return <svg width="100%" height="100%" viewBox="0 0 210 110" preserveAspectRatio="none"><path d={paths[String(props.symbol)]} fill="none" stroke={palette[props.color as keyof typeof palette]} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" pathLength={100} strokeDasharray="100" strokeDashoffset={100*(1-v)}/></svg>;};
const ArrowView=({props,palette}:ObjectViewProps)=>{const directions:Record<string,number>={right:0,left:180,up:-90,down:90};const angle=directions[String(props.direction)]??0;const v=useContext(strokeContext);return <svg width="100%" height="100%" viewBox="0 0 130 100"><g transform={`rotate(${angle} 65 50)`}><path d="M 15 50 L 112 50 M 82 19 L 113 50 L 82 81" fill="none" stroke={palette[props.color as keyof typeof palette]} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" pathLength={100} strokeDasharray="100" strokeDashoffset={100*(1-v)}/></g></svg>;};
const GroupView=({props,palette}:ObjectViewProps)=><div style={{width:'100%',height:'100%',border:props.outlined?`2px solid ${palette.line}`:undefined,background:props.background?palette.surface:'transparent',borderRadius:25}}/>;
const progress=(frame:number,start:number,duration:number)=>Math.max(0,Math.min(1,(frame-start)/Math.max(1,duration)));
const DrawEffect=({children,...c}:TechniqueViewProps)=><strokeContext.Provider value={progress(c.frame,c.startFrame,c.durationFrames)}>{children}</strokeContext.Provider>;
const HighlightEffect=({children,...c}:TechniqueViewProps)=>{const p=progress(c.frame,c.startFrame,c.durationFrames);const color=c.palette[c.params.color as keyof typeof c.palette];return <div style={{width:'100%',height:'100%',position:'relative'}}>{children}<div style={{position:'absolute',pointerEvents:'none',left:'5%',right:'5%',bottom:'5%',height:5,borderRadius:'50%',background:color,transform:`scaleX(${p})`,transformOrigin:'left center'}}/></div>;};
const TransformEffect=({children,...c}:TechniqueViewProps)=>{const p=progress(c.frame,c.startFrame,c.durationFrames);const motion=c.params.motion;return <div style={{width:'100%',height:'100%',transform:motion==='rise'?`translateY(${Math.round((1-p)*35)}px)`:motion==='slide'?`translateX(${Math.round((1-p)*55)}px)`:`scale(${0.78+0.22*p})`,opacity:Math.min(1,0.2+0.8*p)}}>{children}</div>;};
const CompareEffect=({children,...c}:TechniqueViewProps)=>{const p=progress(c.frame,c.startFrame,c.durationFrames);return <div style={{position:'relative',width:'100%',height:'100%'}}>{children}<div style={{position:'absolute',inset:0,opacity:p,border:`3px solid ${c.palette[c.params.tone as keyof typeof c.palette]}`,borderRadius:20,pointerEvents:'none'}}/></div>;};
const CountEffect=({children,...c}:TechniqueViewProps)=>{const p=progress(c.frame,c.startFrame,c.durationFrames);const n=Number(c.params.from)+(Number(c.params.to)-Number(c.params.from))*p;return <div style={{position:'relative',height:'100%',width:'100%'}}><div style={{opacity:0}}>{children}</div><div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:60,fontWeight:800,color:c.palette.accent}}>{Math.round(n).toLocaleString('en-US')}{String(c.params.suffix)}</div></div>;};
const RevealEffect=({children,...c}:TechniqueViewProps)=>{const p=progress(c.frame,c.startFrame,c.durationFrames);const dir=c.params.direction;const clip=dir==='right'?`inset(0 ${(1-p)*100}% 0 0)`:dir==='up'?`inset(${(1-p)*100}% 0 0 0)`:`inset(0 ${(1-p)*100}% 0 0)`;return <div style={{height:'100%',width:'100%',clipPath:clip}}>{children}</div>;};
export function createDefaultRegistry(){const registry=new VisualRegistry();
 const objects={text:TextView,image:ImageView,shape:ShapeView,path:PathView,arrow:ArrowView,group:GroupView};
 for(const [id,Component] of Object.entries(objects))registry.registerObject({id,schema:objectSchemas[id as keyof typeof objectSchemas],Component});
 const techniques={draw:DrawEffect,highlight:HighlightEffect,transform:TransformEffect,compare:CompareEffect,count:CountEffect,reveal:RevealEffect};
 for(const [id,Component] of Object.entries(techniques))registry.registerTechnique({id,schema:techniqueSchemas[id as keyof typeof techniqueSchemas],Component});
 return registry;
}
