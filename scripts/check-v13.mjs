import fs from 'node:fs';
import { validateRegistry } from '../src/resources/rights-policy.mjs';
const registry=JSON.parse(fs.readFileSync('content/v1.3/source-candidates.json','utf8'));
const report=validateRegistry(registry);
if(report.records!==5 || report.published!==0 || report.externallyLinked!==5){
 throw new Error('V1.3 source seed is not link-only design data');
}
for(const r of registry.resources){
 if(!['moe.gov.cn','shmeea.edu.cn','neea.edu.cn'].some(host=>{
  const h=new URL(r.sourceUrl).hostname;
  return h===host || h.endsWith('.'+host);
 }))throw new Error('Candidate sources must be official, verified domains: '+r.id);
}
console.log('V1.3 resource governance contract passed:',JSON.stringify(report));
