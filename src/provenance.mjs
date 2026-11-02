import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export function sha256File(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

export function validateSourceRegistry(registry, catalog) {
  if (registry.schemaVersion !== '1.1') throw new Error('Unexpected source registry schema');
  if (!Array.isArray(registry.localDocuments) || registry.localDocuments.length !== catalog.subjects.length + 1) {
    throw new Error('Source registry does not cover all PDF documents');
  }
  const officialIds = new Set();
  for (const doc of registry.officialDocuments) {
    if (officialIds.has(doc.id)) throw new Error('Duplicate official source id: ' + doc.id);
    officialIds.add(doc.id);
    if (!/^https:\/\/gaokao\.neea\.edu\.cn\/xhtml1\/report\/19012\/\d+-1\.htm$/.test(doc.officialUrl)) {
      throw new Error('Untrusted official catalog URL: ' + doc.officialUrl);
    }
    if (doc.verification.catalogEntry !== 'verified_on_official_website' ||
        doc.verification.pdfBinary !== 'not_compared' ||
        doc.scope.applicability !== 'historical_national_reference') {
      throw new Error('Official verification/scope mismatch: ' + doc.id);
    }
  }
  const ids = new Set();
  const subjects = new Set(catalog.subjects.map(x => x.id));
  for (const doc of registry.localDocuments) {
    if (ids.has(doc.id)) throw new Error('Duplicate local source id: ' + doc.id);
    ids.add(doc.id);
    if (!officialIds.has(doc.officialCatalogContextId)) throw new Error('Invalid catalog association: ' + doc.id);
    if (doc.originVerification !== 'unverified_local_copy' || doc.officialComparison !== 'not_performed') {
      throw new Error('Local PDF was improperly promoted to verified: ' + doc.id);
    }
    if (doc.publishedAt !== null || doc.issuer !== null || doc.year !== null || doc.regions !== null) {
      throw new Error('Unsupported local PDF publication/region assertion: ' + doc.id);
    }
    if (!/^documents\/[a-z-]+\.pdf$/.test(doc.file) ||
        !/^[a-f0-9]{64}$/.test(doc.sha256) ||
        !Number.isInteger(doc.pages) || doc.pages < 1) {
      throw new Error('Invalid local PDF metadata: ' + doc.id);
    }
  }
  for (const id of subjects) {
    if (!ids.has('local-' + id)) throw new Error('No local document mapping for ' + id);
  }
  if (!ids.has('local-overview')) throw new Error('Missing overview document');
}

export function inspectLocalPdf(root, doc) {
  const file = path.join(root, doc.file);
  if (!fs.existsSync(file)) throw new Error('Missing local PDF: ' + file);
  if (sha256File(file) !== doc.sha256) {
    throw new Error('Local PDF checksum changed; manual re-verification required: ' + doc.id);
  }
  let info, raw;
  try {
    info = execFileSync('pdfinfo', [file], { encoding:'utf8', timeout:10000 });
    raw = execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', file, '-'], {
      encoding:'utf8', maxBuffer: 8*1024*1024, timeout:15000
    });
  } catch(error) {
    throw new Error('PDF inspection failed for ' + doc.id + ' (requires poppler-utils): ' + error.message);
  }
  const match = info.match(/^Pages:\s*(\d+)\s*$/m);
  const pages = match ? Number(match[1]) : 0;
  if (pages !== doc.pages) throw new Error('PDF page count mismatch: ' + doc.id);
  const chunks = raw.split('\f');
  const pageText = chunks.slice(0, pages).map(normalizeText);
  while (pageText.length < pages) pageText.push('');
  return { pageCount: pages, pages: pageText, extractablePages: pageText.filter(Boolean).length };
}

export function normalizeText(value) {
  return String(value || '').normalize('NFKC').toLocaleLowerCase('zh-CN')
    .replace(/[^\p{L}\p{N}]/gu, '');
}

export function findPageCandidates(node, pageText) {
  const phrases = [
    node.title,
    ...(node.items || []),
    ...(node.content || []).flatMap(part => [part.title, ...(part.items || [])])
  ];
  const unique = new Map();
  for (const phrase of phrases) {
    const text = normalizeText(phrase);
    if (text.length < 8 || text.length > 160) continue;
    if (!unique.has(text)) unique.set(text, phrase);
  }
  const found = [];
  for (let i=0;i<pageText.length;i++) {
    const matches = [];
    for (const [text, phrase] of unique) {
      if (pageText[i] && pageText[i].includes(text)) {
        matches.push({ phrase: String(phrase).slice(0, 60), length: text.length });
      }
    }
    if (!matches.length) continue;
    matches.sort((a,b)=>b.length - a.length);
    found.push({
      page: i+1,
      anchor: matches[0].phrase,
      anchorNormalized: normalizeText(matches[0].phrase),
      exactMatches:matches.length,
      longestAnchorLength:matches[0].length,
      matchMethod:'local_pdf_exact_normalized_text',
      reviewStatus:'unreviewed'
    });
  }
  // A high anchor length can outweigh several generic small matches. Never
  // mark these machine-generated candidates as verified or official.
  return found.sort((a,b)=>
    b.longestAnchorLength-a.longestAnchorLength ||
    b.exactMatches-a.exactMatches ||
    a.page-b.page
  ).slice(0,3);
}

export function attachProvenance(nodes, doc, pageText) {
  let nodeCount=0, matchedNodes=0, candidatePages=0;
  function visit(node) {
    nodeCount++;
    const candidates = findPageCandidates(node, pageText);
    if(candidates.length) matchedNodes++;
    candidatePages += candidates.length;
    node.provenance = {
      localDocumentId:doc.id,
      officialCatalogContextId:doc.officialCatalogContextId,
      compilationStatus:'legacy_compilation_not_officially_verified',
      locationStatus:candidates.length ? 'candidate_page_match_unreviewed' : 'no_page_match',
      pageCandidates:candidates
    };
    node.children.forEach(visit);
  }
  nodes.forEach(visit);
  return {nodeCount, matchedNodes, candidatePages};
}

export function makeProvenanceIndex(registry, auditByDoc) {
  return {
    schemaVersion:registry.schemaVersion,
    policy:registry.policy,
    officialDocuments:registry.officialDocuments,
    localDocuments:registry.localDocuments.map(doc=>({
      ...doc, pdfExtraction:auditByDoc[doc.id] || null
    })),
    otherOfficialSources:registry.otherOfficialSources
  };
}
