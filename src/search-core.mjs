// Deterministic, browser-native Chinese search: Intl.Segmenter + Han n-grams + BM25.
const HAN = /\p{Script=Han}/u;
const SEGMENTER = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter('zh-Hans', { granularity:'word' }) : null;

export function normalized(value) {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase('zh-CN').trim();
}
function addNgrams(text, out, sizes) {
  for (const size of sizes) {
    if (text.length < size) continue;
    for (let i=0; i<=text.length-size; i++) out.push(text.slice(i,i+size));
  }
}
export function tokenize(input) {
  const source = normalized(input);
  const out = [];
  if (SEGMENTER) {
    for (const part of SEGMENTER.segment(source)) {
      const token = part.segment.trim();
      if (!part.isWordLike || !token) continue;
      if (token.length > 1 || !HAN.test(token)) out.push(token);
    }
  } else {
    for (const part of source.match(/[\p{L}\p{N}]+/gu) || []) {
      if (part.length>1 || !HAN.test(part)) out.push(part);
    }
  }
  for (const match of source.matchAll(/\p{Script=Han}+/gu)) {
    addNgrams(match[0], out, [2,3]);
  }
  // Punctuation-delimited English tokens are already provided by Segmenter.
  return out.filter(token => token.length > 1 && token.length <= 48);
}
function frequency(words) {
  const freq = new Map();
  for (const word of words) freq.set(word,(freq.get(word)||0)+1);
  return freq;
}
function countTerms(fields) {
  const weighted = [];
  for (const [value,weight] of fields) {
    const freq=frequency(tokenize(value));
    for (const [key,n] of freq) weighted.push([key,n*weight]);
  }
  const result = new Map();
  for (const [key,n] of weighted) result.set(key,(result.get(key)||0)+n);
  return result;
}
export function createSearchEngine(docs) {
  const records = docs.map((doc,index)=>{
    const fields = [
      [doc.title,5],
      [doc.subjectName,1.7],
      [doc.excerpt || '',1],
      [doc.category || '',1.5]
    ];
    const tf=countTerms(fields);
    const length=[...tf.values()].reduce((a,b)=>a+b,0) || 1;
    return {doc,index,tf,length,title:normalized(doc.title),body:normalized(doc.searchText||doc.excerpt||''),subject:normalized(doc.subjectName)};
  });
  const df=new Map();
  for(const row of records) for(const term of row.tf.keys()) df.set(term,(df.get(term)||0)+1);
  const avg=records.length ? records.reduce((n,r)=>n+r.length,0)/records.length:1;
  const totalRecords=records.length;
  return {
    size:totalRecords,
    search(query,{subjectId='all',limit=80}={}){
      const phrase=normalized(query);
      if(!phrase) return {total:0,results:[]};
      const terms=[...new Set(tokenize(phrase))];
      if(!terms.length) return {total:0,results:[]};
      const chunks=phrase.split(/\s+/).filter(Boolean);
      const results=[];
      const k1=1.2,b=.68;
      for(const row of records) {
        if(subjectId!=='all' && row.doc.subjectId!==subjectId) continue;
        const found=terms.filter(term=>row.tf.has(term));
        if(!found.length) continue;
        // Require a meaningful fraction of terms (n-grams make unseen Chinese words searchable).
        const coverage=found.length / terms.length;
        const exactPhrase=row.title.includes(phrase) || row.body.includes(phrase);
        const wordsMatched=chunks.filter(chunk=>row.title.includes(chunk)||row.body.includes(chunk)||row.subject.includes(chunk));
        if(!exactPhrase && coverage<.49 && wordsMatched.length!==chunks.length) continue;
        let score=0;
        for (const term of found) {
          const n=row.tf.get(term);
          const idf=Math.log(1+(totalRecords-(df.get(term)||0)+.5)/((df.get(term)||0)+.5));
          score+=idf*(n*(k1+1))/(n+k1*(1-b+b*row.length/avg));
        }
        score *= .75+.25*coverage;
        if(row.title===phrase) score+=45;
        else if(row.title.includes(phrase)) score+=18;
        if(row.body.includes(phrase)) score+=3;
        if(row.subject.includes(phrase)) score+=2;
        results.push({doc:row.doc,score:Number(score.toFixed(4)),coverage});
      }
      results.sort((a,b)=>b.score-a.score || a.doc.subjectId.localeCompare(b.doc.subjectId) || a.doc.id.localeCompare(b.doc.id));
      return {total:results.length,results:results.slice(0,Math.max(0,limit))};
    }
  };
}
