import {StudioError,type Scene,type Video,type CueValue} from '../contracts/schemas';
import type {CompiledObject,CompiledScene,CompiledTechnique,CompiledTimeline,TextMeasurer} from './types';
import {compileLayout} from './layout';
const PAUSE={none:0,think:2.5,speak:4,recall:3};
const HOLD={short:0.5,normal:1,long:2};
function estimateSpeech(text:string,language:'vi'|'en',pacing:'slow'|'normal'|'fast'){
 const wordCount=(text.match(/\S+/g)??[]).length;
 if(wordCount===0)return 0;
 const speed=(language==='vi'?3.5:2.6)*({slow:0.82,normal:1,fast:1.19}[pacing]);
 return Math.max(1.4,wordCount/speed);
}
function frames(seconds:number,fps=30){return Math.ceil(seconds*fps);}
function cueToFrame(cue:CueValue,narrationFrames:number,starts:Map<string,number>):number{
 if(cue==='onEnter')return 0;
 if(cue==='onNarrationEnd')return narrationFrames;
 const id=cue.slice('afterObject:'.length);
 const start=starts.get(id);
 if(start===undefined)throw new StudioError('CUE_UNRESOLVED',id);
 return start+16;
}
export async function compileTimeline(video:Video,measurer:TextMeasurer,audioDurationsSeconds:Record<string,number>={}):Promise<CompiledTimeline>{
 const compiled:CompiledScene[]=[];let offset=0;
 for(const scene of video.scenes){
  const layout=await compileLayout(scene,measurer);
  const provided=audioDurationsSeconds[scene.id];
  const narrationSeconds=provided??estimateSpeech(scene.narration.text,scene.narration.language,scene.pacing);
  if(!Number.isFinite(narrationSeconds)||narrationSeconds<0)throw new StudioError('INVALID_AUDIO_DURATION',scene.id);
  const narrationFrames=frames(narrationSeconds),pauseFrames=frames(PAUSE[scene.pauseIntent]),holdFrames=frames(HOLD[scene.hold]);
  const starts=new Map<string,number>();
  const objectById=new Map(scene.objects.map(o=>[o.id,o]));
  const inProgress=new Set<string>();
  function resolve(id:string):number{
   const old=starts.get(id);if(old!==undefined)return old;
   if(inProgress.has(id))throw new StudioError('CUE_CYCLE',id,scene.id);
   const obj=objectById.get(id);if(!obj)throw new StudioError('INVALID_CUE_REFERENCE',id,scene.id);
   inProgress.add(id);
   const at=obj.cue.startsWith('afterObject:')?resolve(obj.cue.slice(12))+16:cueToFrame(obj.cue,narrationFrames,starts);
   inProgress.delete(id);starts.set(id,at);return at;
  }
  for(const obj of scene.objects)resolve(obj.id);
  const objects:CompiledObject[]=layout.map(l=>({...l.source,...l.box,fontSize:l.fontSize,lines:l.lines,entranceFrame:starts.get(l.source.id)??0,enterDurationFrames:16}));
  const techniques:CompiledTechnique[]=scene.techniques.map(t=>({...t,startFrame:cueToFrame(t.cue,narrationFrames,starts),durationFrames:t.durationIntent==='interaction'?Math.max(18,pauseFrames):t.durationIntent==='narration'?Math.max(18,narrationFrames):18}));
  const lastAction=Math.max(0,...objects.map(o=>o.entranceFrame+o.enterDurationFrames),...techniques.map(t=>t.startFrame+t.durationFrames));
  const durationInFrames=Math.max(frames(2),narrationFrames+pauseFrames+holdFrames,lastAction+holdFrames);
  compiled.push({id:scene.id,beat:scene.beat,purpose:scene.purpose,layout:scene.layout,style:video.style,startFrame:offset,durationInFrames,narrationFrames,pauseFrames,holdFrames,timingProvisional:provided===undefined,audioSrc:scene.narration.audioSrc,objects,techniques});
  offset+=durationInFrames;
 }
 return {schemaVersion:'1.0',id:video.id,title:video.title,seed:video.seed,width:720,height:1280,fps:30,durationInFrames:offset,scenes:compiled};
}
