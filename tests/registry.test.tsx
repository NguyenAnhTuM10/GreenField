import React from 'react';
import {describe,it,expect} from 'vitest';
import {z} from 'zod';
import {VisualRegistry} from '../src/visual/registry';
import {createDefaultRegistry} from '../src/visual/plugins';
import {parseVideo} from '../src/contracts/schemas';
import {compileTimeline} from '../src/engine/timing';
import {fakeMeasurer} from '../src/engine/measurers';
const video=parseVideo({schemaVersion:'1.0',id:'video',title:'A',style:'whiteboard',scenes:[{id:'s1',beat:'explain',purpose:'demo',narration:{text:'',language:'vi'},layout:'focus',objects:[{id:'a',kind:'text',role:'primary',props:{text:'Hello',size:'lg'}}],relations:[],techniques:[{id:'custom1',kind:'twinkle',targetIds:['a'],params:{strength:3}}]}]});
describe('registry',()=>{
 it('rejects unregistered plugin',()=>expect(()=>createDefaultRegistry().validate(video)).toThrow(/UNKNOWN_TECHNIQUE_KIND/));
 it('accepts and compiles fake technique without changing engine or renderer',async()=>{
  const reg=createDefaultRegistry();
  reg.registerTechnique({id:'twinkle',schema:z.strictObject({strength:z.number().min(1).max(5)}),Component:({children})=><>{children}</>});
  const validated=reg.validate(video);
  const compiled=await compileTimeline(validated,fakeMeasurer);
  expect(compiled.scenes[0].techniques[0].kind).toBe('twinkle');
  expect(reg.getTechnique('twinkle').Component).toBeDefined();
 });
 it('blocks unvalidated technique parameter',()=>{
  const reg=createDefaultRegistry();reg.registerTechnique({id:'twinkle',schema:z.strictObject({strength:z.number().max(5)}),Component:({children})=><>{children}</>});
  const input=structuredClone(video);input.scenes[0].techniques[0].params={strength:99};
  expect(()=>reg.validate(input)).toThrow(/INVALID_TECHNIQUE_PARAMS/);
 });
});
