import type {Video,SceneObject,Technique} from '../contracts/schemas';
export type Box={x:number;y:number;width:number;height:number};
export type TextMeasureRequest={text:string;fontSize:number;fontFamily:string;weight:number;maxWidth:number;lineHeight:number};
export type TextMeasurement={lines:string[];width:number;height:number};
export type TextMeasurer={measure(request:TextMeasureRequest):Promise<TextMeasurement>};
export type CompiledObject=SceneObject&Box&{fontSize?:number;lines?:string[];entranceFrame:number;enterDurationFrames:number};
export type CompiledTechnique=Technique&{startFrame:number;durationFrames:number};
export type CompiledScene={
 id:string;beat:string;purpose:string;layout:string;style:Video['style'];
 startFrame:number;durationInFrames:number;narrationFrames:number;pauseFrames:number;holdFrames:number;
 timingProvisional:boolean; audioSrc?:string;objects:CompiledObject[];techniques:CompiledTechnique[];
};
export type CompiledTimeline={schemaVersion:'1.0';id:string;title:string;seed:number;width:720;height:1280;fps:30;durationInFrames:number;scenes:CompiledScene[]};
