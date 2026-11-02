import fs from 'node:fs';
import vm from 'node:vm';

export function readLegacyData(file) {
  const source = fs.readFileSync(file, 'utf8');
  const result = vm.runInNewContext(source + '\nsyllabusData;', Object.create(null), { timeout: 1500 });
  if (!Array.isArray(result) || result.length === 0) {
    throw new Error('Invalid or empty syllabusData: ' + file);
  }
  return result;
}

function nonEmptyString(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Missing ' + field);
  return value.trim();
}

function normalizeNode(raw, path, seen) {
  const title = nonEmptyString(raw.title, 'title at ' + path);
  const id = path;
  if (seen.has(id)) throw new Error('Duplicate ID ' + id);
  seen.add(id);
  const items = Array.isArray(raw.items) ? raw.items.map(String) : [];
  const content = Array.isArray(raw.content) ? raw.content.map((entry) => ({
    title: nonEmptyString(entry.title, 'content title at ' + path),
    items: Array.isArray(entry.items) ? entry.items.map(String) : []
  })) : [];
  const children = Array.isArray(raw.children)
    ? raw.children.map((child, index) => normalizeNode(child, path + '--' + (index + 1), seen))
    : [];
  return {
    id, title, items, content, children,
    level: raw.level == null ? null : String(raw.level),
    footer: typeof raw.footer === 'string' ? raw.footer : '',
    category: typeof raw.category === 'string' ? raw.category : ''
  };
}

export function normalizeSyllabus(rawSections, subjectId) {
  if (!Array.isArray(rawSections) || !rawSections.length) throw new Error('Empty syllabus ' + subjectId);
  const seen = new Set();
  const roots = rawSections.map((raw, index) => {
    const originalId = raw.id && /^[a-z0-9-]+$/i.test(raw.id) ? raw.id : 'section-' + (index + 1);
    return normalizeNode(raw, subjectId + '--' + originalId, seen);
  });
  return roots;
}

export function walkNodes(nodes, visit, depth = 0, rootId = null) {
  for (const node of nodes) {
    const ancestor = rootId || node.id;
    visit(node, depth, ancestor);
    walkNodes(node.children, visit, depth + 1, ancestor);
  }
}

export function flattenSearch(subject, nodes) {
  const results = [];
  walkNodes(nodes, (node, depth, rootId) => {
    const details = [
      ...node.items,
      ...node.content.flatMap((part) => [part.title, ...part.items])
    ].join(' ');
    if (!details && !node.children.length) return;
    results.push({
      id: node.id,
      rootId,
      subjectId: subject.id,
      subjectName: subject.name,
      title: node.title,
      category: node.category,
      depth,
      excerpt: details.slice(0, 150),
      locationStatus: node.provenance?.locationStatus || 'no_page_match',
      candidatePage: node.provenance?.pageCandidates?.[0]?.page || null,
      searchText: (node.title + ' ' + details).toLocaleLowerCase('zh-CN')
    });
  });
  return results;
}

export function getCategories(nodes) {
  return [...new Set(nodes.map((node) => node.category).filter(Boolean))];
}
