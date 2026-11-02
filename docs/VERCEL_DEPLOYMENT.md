# PDF verification and Vercel deployment architecture

## Root-cause assessment

V1.1 previously ran pdfinfo and pdftotext during npm run build. GitHub Actions installed poppler-utils; Vercel's standard build environment did not include this step. Without binaries a build cannot complete. Vercel logs are private, so this is a code-level compatibility risk, not a confirmed quotation of that service's failure log.

## Fix

- npm run build: portable Node.js 20+ static generation, no OS PDF dependencies. Still validates each original PDF SHA256.
- content/pdf-evidence-locations.json: deterministic evidence cache, derived from GitHub Actions run 41407658429 and pinned original PDF versions. Entries are [nodeDepthFirstOrdinal, [[pdfPage, sourcePhraseOrdinal, exactMatches],...]]. All are unreviewed machine candidates.
- npm run audit:pdf: on CI with Poppler installed, regenerate every PDF page candidate and reject any drift or source mismatch.
- vercel.json: framework Other, buildCommand npm run build, outputDirectory dist and trailingSlash true.
- GitHub Pages and CI perform source audit before verifying / publishing.

## Notes

The cache does not establish that the local PDF is identical to any official publication. Changing PDF bytes or node content requires a new audited cache. If Vercel Project Settings use a custom Root Directory, configure it to the repository root to find vercel.json. Specific Vercel project logs are still required to verify other possible causes.
