import {describe,it,expect} from 'vitest';
import {parseVideo} from '../src/contracts/schemas';
import {compileTimeline} from '../src/engine/timing';
import {fakeMeasurer} from '../src/engine/measurers';
const scene=(text:string,layout='stack')=>({id:'s1',beat:'explain',purpose:'demo',layout,narration:{text:'Read this sentence now',language:'en'},pauseIntent:'think',hold:'short',objects:[{id:'a',kind:'text',role:'primary',props:{text,size:'lg'}},{id:'b',kind:'text',role:'support',cue:'afterObject:a',props:{text:'Second line',size:'sm'}}],techniques:[{id:'t',kind:'highlight',targetIds:['b'],cue:'onNarrationEnd',params:{}}]});
const vid=(s:ReturnType<typeof scene>)=>parseVideo({schemaVersion:'1.0',id:'v',title:'a',style:'whiteboard',scenes:[s]});
describe('compile timing and layout',()=>{
 it('wraps long text into multiple lines',async()=>{
  const t=await compileTimeline(vid(scene('This is a longer sentence that definitely should be split into multiple lines for the reader')),fakeMeasurer);
  expect((t.scenes[0].objects[0].lines??[]).length).toBeGreaterThan(1);
 });
 it('throws TEXT_OVERFLOW for an unreasonable unbroken string',async()=>{
  await expect(compileTimeline(vid(scene('x'.repeat(1000))),fakeMeasurer)).rejects.toThrow(/TEXT_OVERFLOW/);
 });
 it('compiles cue to frames and includes pause',async()=>{
  const t=await compileTimeline(vid(scene('Hello')),fakeMeasurer,{'s1':3});
  const s=t.scenes[0];
  expect(s.narrationFrames).toBe(90);expect(s.pauseFrames).toBe(75);expect(s.timingProvisional).toBe(false);
  expect(s.objects.find(o=>o.id==='b')?.entranceFrame).toBe(16);
  expect(s.techniques[0].startFrame).toBe(90);
 });
 it('rejects unsupported relation without inventing layout',async()=>{
  const s=scene('Hello');s.objects[1].cue='onEnter';(s as any).relations=[{from:'a',to:'b',kind:'beside'}];
  await expect(compileTimeline(vid(s),fakeMeasurer)).rejects.toThrow(/UNSUPPORTED_LAYOUT_RELATION/);
 });
 it('produces identical compiled timeline from identical inputs and matches snapshot',async()=>{
  const input=vid(scene('Hello again'));
  const a=await compileTimeline(input,fakeMeasurer);
  const b=await compileTimeline(input,fakeMeasurer);
  expect(a).toEqual(b);
  expect(a.scenes.map(s=>({id:s.id,duration:s.durationInFrames,boxes:s.objects.map(o=>({id:o.id,x:o.x,y:o.y,width:o.width,height:o.height}))}))).toMatchSnapshot();
 });
});
