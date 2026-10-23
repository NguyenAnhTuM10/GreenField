import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {parseVideo} from '../src/contracts/schemas';
import {createDefaultRegistry} from '../src/visual/plugins';
import {compileTimeline} from '../src/engine/timing';
import {fakeMeasurer} from '../src/engine/measurers';
const sample=JSON.parse(readFileSync(new URL('../examples/discuss-about.json',import.meta.url),'utf8'));
describe('six-scene acceptance demo',()=>{
 it('validates all six scenes through the same registry',()=>{
  const v=parseVideo(sample);expect(v.scenes.map(s=>s.id)).toEqual(['hook','predict','correction','build_sentence','variations','recall']);
  expect(()=>createDefaultRegistry().validate(v)).not.toThrow();
 });
 it('compiles all six scenes without special-case scene logic',async()=>{
  const t=await compileTimeline(parseVideo(sample),fakeMeasurer);
  expect(t.scenes).toHaveLength(6);
  expect(t.durationInFrames).toBeGreaterThan(200);
  expect(t.scenes.every(s=>s.durationInFrames>0)).toBe(true);
 });
});
