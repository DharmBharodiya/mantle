import { describe, expect, it } from 'vitest';
import { mapBounded } from '@/lib/ingestion/chunks';
describe('chunk failure atomicity',()=>{
 it('preserves the original failing section rather than a sibling cancellation',async()=>{
  const failure=new Error('invalid second extraction section');
  const controller=new AbortController();
  await expect(mapBounded([0,1],2,async index=>{
   if(index===1){controller.abort();throw failure;}
   await new Promise(resolve=>setTimeout(resolve,2));throw new Error('sibling cancelled');
  },controller.signal)).rejects.toBe(failure);
 });
 it('stops queued sections even when an operation throws a falsy value',async()=>{
  const started:number[]=[];
  await expect(mapBounded([0,1,2],1,async index=>{started.push(index);throw null;})).rejects.toBeNull();
  expect(started).toEqual([0]);
 });
});
