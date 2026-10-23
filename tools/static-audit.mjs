import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
function collect(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?collect(path.join(dir,d.name)):/\.tsx?$/.test(d.name)?[path.join(dir,d.name)]:[])}
const files=[...collect('src'),...collect('tests')];
const problems=[];
for(const file of files){const code=fs.readFileSync(file,'utf8');
 const result=ts.transpileModule(code,{fileName:file,reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
 for(const d of result.diagnostics??[])problems.push(`${file}: ${ts.flattenDiagnosticMessageText(d.messageText,' ')}`);
}
for(const file of collect('src/engine')){
 const contents=fs.readFileSync(file,'utf8');
 if(/from\s+['"](?:react|remotion|@remotion\/|\.\.\/planners)/.test(contents))problems.push(`ENGINE_COUPLING ${file}`);
}
const video=JSON.parse(fs.readFileSync('examples/discuss-about.json','utf8'));
if(video.scenes.length!==6)problems.push('Expected exactly 6 demo scenes');
if(video.scenes.some(s=>!Array.isArray(s.objects)||!Array.isArray(s.techniques)))problems.push('Incomplete demo scenes');
const root=fs.readFileSync('src/renderer/VideoRenderer.tsx','utf8');
if(/scene\.id\s*===|switch\s*\(\s*scene\.id/.test(root))problems.push('Renderer has scene-specific branch');
console.log(`${problems.length?'FAIL':'PASS'} static audit: ${files.length} TypeScript files, ${video.scenes.length} scenes, ${problems.length} findings`);
for(const e of problems)console.log(e);
process.exitCode=problems.length?1:0;
