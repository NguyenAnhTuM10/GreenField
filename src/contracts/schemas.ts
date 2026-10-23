import {z} from 'zod';

export const Id = z.string().regex(/^[a-z][a-z0-9_-]{0,80}$/);
export const Cue = z.union([
  z.literal('onEnter'), z.literal('onNarrationEnd'),
  z.string().regex(/^afterObject:[a-z][a-z0-9_-]{0,80}$/),
]);
export const jsonValue: z.ZodType<unknown> = z.json();
export const Props = z.record(z.string(), jsonValue);

export const ObjectSchema = z.strictObject({
  id: Id,
  kind: z.string().min(1),
  role: z.enum(['primary','support','annotation','decoration']),
  parentId: Id.optional(),
  cue: Cue.default('onEnter'),
  props: Props,
});
export const TechniqueSchema = z.strictObject({
  id: Id,
  kind: z.string().min(1),
  targetIds: z.array(Id).min(1),
  cue: Cue.default('onEnter'),
  durationIntent: z.enum(['entrance','interaction','narration']).default('entrance'),
  params: Props,
});
export const RelationSchema = z.strictObject({
  from: Id, to: Id,
  kind: z.enum(['above','below','beside','inside','annotates','groupWith']),
});
export const SceneSchema = z.strictObject({
  id: Id,
  beat: z.enum(['hook','explain','engage']),
  purpose: z.string().min(1),
  narration: z.strictObject({
    text: z.string(),
    language: z.enum(['vi','en']),
    audioSrc: z.string().regex(/^\/audio\/[\w./-]+\.(wav|mp3|m4a)$/i).optional(),
  }),
  pacing: z.enum(['slow','normal','fast']).default('normal'),
  pauseIntent: z.enum(['none','think','speak','recall']).default('none'),
  hold: z.enum(['short','normal','long']).default('normal'),
  layout: z.enum(['focus','stack','split','diagram']),
  diagramVariant: z.enum(['row','hub','columns']).optional(),
  objects: z.array(ObjectSchema).min(1).max(24),
  relations: z.array(RelationSchema).default([]),
  techniques: z.array(TechniqueSchema).default([]),
});
export const VideoSchema = z.strictObject({
  schemaVersion: z.literal('1.0'),
  id: Id,
  title: z.string().min(1),
  style: z.enum(['whiteboard','darkEditorial']),
  width: z.literal(720).default(720),
  height: z.literal(1280).default(1280),
  fps: z.literal(30).default(30),
  seed: z.number().int().default(1),
  scenes: z.array(SceneSchema).min(1),
});
export type Video = z.infer<typeof VideoSchema>;
export type Scene = Video['scenes'][number];
export type SceneObject = Scene['objects'][number];
export type Technique = Scene['techniques'][number];
export type CueValue = z.infer<typeof Cue>;

export class StudioError extends Error {
  constructor(public code: string, message: string, public path?: string) {
    super(`${code}: ${message}${path ? ` (${path})` : ''}`);
    this.name = 'StudioError';
  }
}

export function validateReferences(video: Video): void {
  const sceneIds = new Set<string>();
  for (const scene of video.scenes) {
    if (sceneIds.has(scene.id)) throw new StudioError('DUPLICATE_ID',scene.id);
    sceneIds.add(scene.id);
    const ids = new Set<string>();
    for (const obj of scene.objects) {
      if (ids.has(obj.id)) throw new StudioError('DUPLICATE_ID',obj.id,scene.id);
      ids.add(obj.id);
    }
    const objectIds = new Set(ids);
    const root = (id: string) => objectIds.has(id);
    const groups = new Map(scene.objects.filter(o=>o.kind==='group').map(o=>[o.id,o]));
    for (const obj of scene.objects) {
      if (obj.parentId && !groups.has(obj.parentId)) throw new StudioError('INVALID_PARENT',obj.parentId,`${scene.id}.${obj.id}`);
      if (obj.parentId===obj.id) throw new StudioError('LAYOUT_CYCLE',obj.id);
      const visited = new Set([obj.id]); let node = obj;
      while (node.parentId) {
        if (visited.has(node.parentId)) throw new StudioError('LAYOUT_CYCLE',obj.id);
        visited.add(node.parentId);
        const next = scene.objects.find(o=>o.id===node.parentId);
        if (!next) break;
        node = next;
      }
    }
    for (const r of scene.relations) {
      if (!root(r.from)||!root(r.to)) throw new StudioError('INVALID_RELATION_REFERENCE',`${r.from} -> ${r.to}`,scene.id);
      if (r.from===r.to) throw new StudioError('LAYOUT_CYCLE',r.from,scene.id);
    }
    // Reject contradictory or cyclic ordering relations; diagram connector relations do not impose order.
    const directed = new Map<string,string[]>();
    for (const r of scene.relations.filter(r=>['above','below','beside'].includes(r.kind))) {
      const a=r.kind==='below'?r.to:r.from, b=r.kind==='below'?r.from:r.to;
      directed.set(a,[...(directed.get(a)??[]),b]);
    }
    const visited = new Set<string>(), active = new Set<string>();
    const visit=(id:string)=>{if(active.has(id))throw new StudioError('LAYOUT_CYCLE',id,scene.id);if(visited.has(id))return;active.add(id);for(const n of directed.get(id)??[])visit(n);active.delete(id);visited.add(id);};
    for(const id of ids)visit(id);
    for (const tech of scene.techniques) {
      if (ids.has(tech.id)) throw new StudioError('DUPLICATE_ID',tech.id,scene.id);
      ids.add(tech.id);
      if (tech.targetIds.some(id=>!root(id))) throw new StudioError('INVALID_TECHNIQUE_TARGET',tech.id,scene.id);
    }
    for (const item of [...scene.objects,...scene.techniques]) {
      const cue=item.cue;
      if (cue.startsWith('afterObject:') && !root(cue.slice('afterObject:'.length))) throw new StudioError('INVALID_CUE_REFERENCE',cue,scene.id);
      if (item.id===cue.slice('afterObject:'.length)) throw new StudioError('CUE_CYCLE',item.id,scene.id);
    }
  }
}

export function parseVideo(input: unknown): Video {
  const video=VideoSchema.parse(input);
  validateReferences(video);
  return video;
}
