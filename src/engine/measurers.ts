import type {TextMeasurer,TextMeasureRequest,TextMeasurement} from './types';
// Test-only deterministic fake; never use for production layout.
export const fakeMeasurer:TextMeasurer={
 async measure(r:TextMeasureRequest):Promise<TextMeasurement>{
  const charWidth=r.fontSize*0.51;
  const maxChars=Math.max(1,Math.floor(r.maxWidth/charWidth));
  const lines:string[]=[];
  for(const para of r.text.split('\n')){
   let line='';for(const word of para.split(/\s+/)){
    if(!word)continue;
    const next=line?line+' '+word:word;
    if(next.length>maxChars&&line){lines.push(line);line=word;}else line=next;
   }lines.push(line);
  }
  return {lines,width:Math.max(...lines.map(x=>x.length*charWidth),0),height:lines.length*r.fontSize*r.lineHeight};
 }
};
