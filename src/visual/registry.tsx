import React from 'react';
import {z} from 'zod';
import {StudioError, type Video} from '../contracts/schemas';

export type Palette = {background:string;foreground:string;muted:string;accent:string;danger:string;success:string;surface:string;line:string};
export const palettes: Record<'whiteboard'|'darkEditorial',Palette>={
 whiteboard:{background:'#f6f2e9',foreground:'#182c3a',muted:'#566571',accent:'#138b81',danger:'#c64d4d',success:'#16885d',surface:'#ffffff',line:'#ced1ca'},
 darkEditorial:{background:'#0c1726',foreground:'#f1f7fa',muted:'#b1c8d1',accent:'#44dfbd',danger:'#ff7b82',success:'#7be5b8',surface:'#1c3041',line:'#466174'},
};
export type ObjectViewProps={props:Record<string,unknown>;palette:Palette;size:{width:number;height:number};fontSize?:number;lines?:string[]};
export type TechniqueViewProps={params:Record<string,unknown>;palette:Palette;frame:number;startFrame:number;durationFrames:number;children:React.ReactNode};
export type ObjectPlugin={id:string;schema:z.ZodTypeAny;Component:React.ComponentType<ObjectViewProps>};
export type TechniquePlugin={id:string;schema:z.ZodTypeAny;Component:React.ComponentType<TechniqueViewProps>};

export class VisualRegistry {
 private objects=new Map<string,ObjectPlugin>(); private techniques=new Map<string,TechniquePlugin>();
 registerObject(plugin:ObjectPlugin){if(this.objects.has(plugin.id))throw new StudioError('DUPLICATE_PLUGIN',plugin.id);this.objects.set(plugin.id,plugin);return this;}
 registerTechnique(plugin:TechniquePlugin){if(this.techniques.has(plugin.id))throw new StudioError('DUPLICATE_PLUGIN',plugin.id);this.techniques.set(plugin.id,plugin);return this;}
 getObject(id:string){const p=this.objects.get(id);if(!p)throw new StudioError('UNKNOWN_OBJECT_KIND',id);return p;}
 getTechnique(id:string){const p=this.techniques.get(id);if(!p)throw new StudioError('UNKNOWN_TECHNIQUE_KIND',id);return p;}
 validate(video:Video): Video {
  return {...video,scenes:video.scenes.map(scene=>({
   ...scene,
   objects:scene.objects.map(obj=>{
    const parsed=this.getObject(obj.kind).schema.safeParse(obj.props);
    if(!parsed.success)throw new StudioError('INVALID_OBJECT_PROPS',parsed.error.issues.map(i=>i.path.join('.')+': '+i.message).join('; '),`${scene.id}.${obj.id}`);
    return {...obj,props:parsed.data as Record<string,unknown>};
   }),
   techniques:scene.techniques.map(tech=>{
    const parsed=this.getTechnique(tech.kind).schema.safeParse(tech.params);
    if(!parsed.success)throw new StudioError('INVALID_TECHNIQUE_PARAMS',parsed.error.issues.map(i=>i.path.join('.')+': '+i.message).join('; '),`${scene.id}.${tech.id}`);
    return {...tech,params:parsed.data as Record<string,unknown>};
   }),
  }))};
 }

 objectKinds(){return [...this.objects.keys()];}
 techniqueKinds(){return [...this.techniques.keys()];}
}
