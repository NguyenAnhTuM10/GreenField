import type {TextMeasurer,TextMeasureRequest} from '../engine/types';
import {resolveBrowserExecutable} from './browser-path';
export async function createChromiumMeasurer(executablePath?:string){
 // Dynamic import keeps the engine free from browser dependencies.
 const {chromium}=await import('playwright-core');
 const browser=await chromium.launch({headless:true,executablePath:resolveBrowserExecutable(executablePath),args:['--no-sandbox']});
 const page=await browser.newPage();
 const measure:TextMeasurer={
  async measure(r){
   return await page.evaluate(async (a:TextMeasureRequest)=>{
    await document.fonts.ready;
    const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('Canvas context unavailable');
    ctx.font=`${a.weight} ${a.fontSize}px ${a.fontFamily}`;
    const lines:string[]=[];
    for(const para of a.text.split('\n')){
      let line='';
      for(const word of para.split(/\s+/)){
        if(!word)continue;
        const candidate=line?line+' '+word:word;
        if(ctx.measureText(candidate).width>a.maxWidth && line){lines.push(line);line=word;}else line=candidate;
        // Oversize words are reported as width overflow so the compiler can try smaller font sizes.
      }
      lines.push(line);
    }
    return {lines,width:Math.max(0,...lines.map(s=>ctx.measureText(s).width)),height:lines.length*a.fontSize*a.lineHeight};
   },r);
  }
 };
 return {measurer:measure,close:()=>browser.close()};
}
