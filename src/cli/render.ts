import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import {parseVideo,StudioError} from '../contracts/schemas';
import {createDefaultRegistry} from '../visual/plugins';
import {createChromiumMeasurer} from './chromium-measurer';
import {resolveBrowserExecutable} from './browser-path';
import {compileTimeline} from '../engine/timing';

const command=process.argv[2]??'compile';
const example=resolve(process.argv[3]??'examples/discuss-about.json');
async function audioDurations(video:ReturnType<typeof parseVideo>){
 const result:Record<string,number>={};
 for(const s of video.scenes){
  if(!s.narration.audioSrc)continue;
  const file=resolve('public',s.narration.audioSrc.slice(1));
  if(!file.startsWith(resolve('public')+requireSeparator()))throw new StudioError('INVALID_AUDIO_PATH',file);
  await access(file);
  const raw=execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',file],{encoding:'utf8'});
  const seconds=Number(raw.trim());if(!Number.isFinite(seconds))throw new StudioError('INVALID_AUDIO_DURATION',file);
  result[s.id]=seconds;
 }
 return result;
}
function requireSeparator(){return process.platform==='win32'?'\\':'/';}
async function main(){
 const start=performance.now();
 const executable=resolveBrowserExecutable();
 const video=createDefaultRegistry().validate(parseVideo(JSON.parse(await readFile(example,'utf8'))));
 const browser=await createChromiumMeasurer(executable);
 let timeline;
 try{timeline=await compileTimeline(video,browser.measurer,await audioDurations(video));}finally{await browser.close();}
 await mkdir(resolve('output'),{recursive:true});
 await writeFile(resolve('src/renderer/generated-timeline.json'),JSON.stringify(timeline,null,2));
 await writeFile(resolve('output/compiled-timeline.json'),JSON.stringify(timeline,null,2));
 console.log(`Compiled ${timeline.scenes.length} scenes, ${(timeline.durationInFrames/30).toFixed(2)}s, ${Math.round(performance.now()-start)}ms; provisional audio: ${timeline.scenes.filter(s=>s.timingProvisional).length}`);
 if(command==='compile')return;
 if(!['video','still'].includes(command))throw new StudioError('UNKNOWN_COMMAND',command);
 const {bundle}=await import('@remotion/bundler');
 const {selectComposition,renderMedia,renderStill}=await import('@remotion/renderer');
 const serveUrl=await bundle({entryPoint:resolve('src/renderer/index.tsx'),publicDir:resolve('public')});
 const composition=await selectComposition({serveUrl,id:'KnowledgeStudio',inputProps:{timeline},browserExecutable:executable});
 if(command==='still'){
  const frame=Math.min(timeline.durationInFrames-1,Math.max(0,Number(process.env.STILL_FRAME??45)));
  const file=resolve('output/still.png');
  await renderStill({composition,serveUrl,output:file,frame,inputProps:{timeline},browserExecutable:executable});
  console.log(`Still: ${file}`);
 }else{
  const file=resolve('output/discuss-about.mp4');
  await renderMedia({composition,serveUrl,codec:'h264',outputLocation:file,inputProps:{timeline},concurrency:1,browserExecutable:executable});
  console.log(`MP4: ${file}`);
 }
 console.log(`Total elapsed: ${((performance.now()-start)/1000).toFixed(1)} seconds`);
}
main().catch(e=>{console.error(e);process.exitCode=1});
