import React from 'react';
import {AbsoluteFill,Sequence,useCurrentFrame,staticFile,Audio} from 'remotion';
import {createDefaultRegistry} from '../visual/plugins';
import {palettes} from '../visual/registry';
import type {CompiledObject,CompiledScene,CompiledTimeline} from '../engine/types';
const registry=createDefaultRegistry();

const ObjectLayer:React.FC<{obj:CompiledObject;scene:CompiledScene;frame:number}> = ({obj,scene,frame})=>{
 if(frame<obj.entranceFrame)return null;
 const palette=palettes[scene.style];
 const plugin=registry.getObject(obj.kind);
 const Component=plugin.Component;
 const props=obj.kind==='image'?{...obj.props,src:staticFile(String(obj.props.src).replace(/^\//,''))}:obj.props;
 let content:React.ReactNode=<Component props={props} palette={palette} size={{width:obj.width,height:obj.height}} fontSize={obj.fontSize} lines={obj.lines}/>;
 const effects=scene.techniques.filter(t=>t.targetIds.includes(obj.id));
 for(const effect of effects){const Effect=registry.getTechnique(effect.kind).Component;
  content=<Effect key={effect.id} params={effect.params} palette={palette} frame={frame} startFrame={effect.startFrame} durationFrames={effect.durationFrames}>{content}</Effect>;
 }
 const entrance=Math.max(0,Math.min(1,(frame-obj.entranceFrame)/14));
 return <div style={{position:'absolute',left:obj.x,top:obj.y,width:obj.width,height:obj.height,opacity:entrance,zIndex:obj.kind==='group'?0:obj.role==='decoration'?1:2}}>{content}</div>;
};
const SceneLayer:React.FC<{scene:CompiledScene}> = ({scene})=>{
 const frame=useCurrentFrame(),palette=palettes[scene.style];
 return <AbsoluteFill style={{background:palette.background,overflow:'hidden',fontFamily:'"Segoe UI",Arial,"Noto Sans",sans-serif'}}>
  <div style={{position:'absolute',left:53,top:62,right:53,display:'flex',alignItems:'center',gap:14,color:palette.muted,fontWeight:800,fontSize:22,letterSpacing:1.4}}>
   <span style={{width:12,height:12,background:palette.accent,borderRadius:'50%'}}/>
   KNOWLEDGE STUDIO
  </div>
  <div style={{position:'absolute',left:53,right:53,top:124,height:2,background:palette.line}}/>
  {scene.objects.map(obj=><ObjectLayer key={obj.id} obj={obj} scene={scene} frame={frame}/>)}
  {scene.audioSrc?<Audio src={staticFile(scene.audioSrc.replace(/^\//,''))}/>:null}
  <div style={{position:'absolute',left:53,right:53,bottom:88,height:5,borderRadius:3,background:palette.line}}>
   <div style={{width:`${Math.min(100,frame/Math.max(1,scene.durationInFrames-1)*100)}%`,height:5,background:palette.accent,borderRadius:3}}/>
  </div>
  <div style={{position:'absolute',left:53,bottom:117,fontSize:18,fontWeight:700,color:palette.muted,textTransform:'uppercase'}}>{scene.beat} / {scene.purpose.slice(0,36)}</div>
 </AbsoluteFill>;
};
export const VideoRenderer:React.FC<{timeline:CompiledTimeline}>=({timeline})=>{
 return <AbsoluteFill>
  {timeline.scenes.map(scene=><Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationInFrames}><SceneLayer scene={scene}/></Sequence>)}
 </AbsoluteFill>;
};
