import {describe,it,expect} from 'vitest';
import {parseVideo,StudioError} from '../src/contracts/schemas';
const basic=()=>({schemaVersion:'1.0',id:'demo',title:'Demo',style:'whiteboard',scenes:[{
 id:'s1',beat:'hook',purpose:'test',narration:{text:'Hi',language:'en'},layout:'stack',
 objects:[{id:'a',kind:'text',role:'primary',props:{text:'Hello',size:'md'}}],
 techniques:[],relations:[]}]});
describe('video contract',()=>{
 it('parses a valid video and defaults',()=>{const a=parseVideo(basic());expect(a.fps).toBe(30);expect(a.scenes[0].objects[0].cue).toBe('onEnter')});
 it('rejects unsupported schema version and extra keys',()=>{
   expect(()=>parseVideo({...basic(),schemaVersion:'2.0'})).toThrow();
   expect(()=>parseVideo({...basic(),unexpected:true})).toThrow();
 });
 it('rejects invalid references',()=>{
   const a=basic();a.scenes[0].relations.push({from:'a',to:'missing',kind:'above'} as never);
   expect(()=>parseVideo(a)).toThrow(/INVALID_RELATION_REFERENCE/);
 });
 it('detects ordering cycles',()=>{
   const a=basic(); a.scenes[0].objects.push({id:'b',kind:'text',role:'support',props:{text:'other',size:'sm'}} as never);
   a.scenes[0].relations.push({from:'a',to:'b',kind:'above'} as never,{from:'b',to:'a',kind:'above'} as never);
   expect(()=>parseVideo(a)).toThrow(/LAYOUT_CYCLE/);
 });
 it('rejects invalid cue syntax',()=>{
   const a=basic();a.scenes[0].objects[0]={...a.scenes[0].objects[0],...{cue:'at:0.5'}};
   expect(()=>parseVideo(a)).toThrow();
 });
});
