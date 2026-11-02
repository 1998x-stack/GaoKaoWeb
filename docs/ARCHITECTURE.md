# Architecture and content governance

## Goals

1. Preserve existing subject data without losing nested content.
2. Build a readable educational UI rather than another card-only layout.
3. Keep historical syllabi separate from current exam guidance.
4. Make every generated page link and PDF path auditable.
5. Publish only generated site assets, not development skill files.

## Data flow

Legacy subject data.js → src/model.mjs → normalized tree → JSON per subject + flattened search index → HTML templates → dist.

The model walks children recursively, assigning deterministic node IDs using subject, source section and child ordinal. All items and nested content sections are retained. Client rendering recursively handles every child level and creates text nodes rather than injecting unchecked HTML.

The catalog describes subjects and archived PDFs, but does not invent publication dates or legal applicability. All PDFs and topics are labeled historical_unverified until separately audited.

## Pages

- / : subject discovery homepage.
- /subjects/:id/ : knowledge outline, filters, expandable details, read markers.
- /search/ : static search across subjects, no backend.
- /archive/ : historical PDF index.
- /about/ : usage guidance and limitations.
- /{LegacySubject}/*.html : compatibility redirects; original PDF URLs preserved.

## UX references

- Khan Academy: course → unit → lesson discovery and quick search: https://www.khanacademy.org/
- 国家中小学智慧教育平台: resource grouping by stage, course and subject: https://basic.smartedu.cn/
- BBC Bitesize: subject → topic navigation and exam revision guides: https://www.bbc.co.uk/bitesize/

The implementation is original; no branded graphics, site designs, or course content is copied.

## Future architecture increments

### Source verification
Add official issuer, publication date, canonical URL, file SHA-256, copyright, page/section references, review status and historical applicability. Block unsupported “latest” claims.

### Structured learning
Add ExamProfile keyed by year, region and subject only for verified official sources, concept aliases, prerequisite edges and legal original practice questions.

### Evaluation
Add Chinese segmentation and retrieval benchmarks; source-grounded RAG only after evidence, privacy and versioning gates. Include independent citation-fidelity and abstention tests.

## Release checks

- All 10 original datasets parse.
- Recursive normalization retains nested children and unique identifiers.
- All generated HTML local references resolve.
- Legacy PDF assets are copied from their sources.
- PR CI successfully builds and uploads website artifact.
- Real browser keyboard/mobile E2E and PDF-official-origin checks remain outstanding independent gates.
