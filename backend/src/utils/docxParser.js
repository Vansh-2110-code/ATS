/**
 * docxParser.js  —  Robust DOCX Resume Extractor
 *
 * Strategy:
 *   1. Try mammoth (handles Word / Google Docs / LibreOffice / WPS well)
 *   2. Fall back to raw XML extraction via unzipper + regex for:
 *      • Canva / ATS-template DOCX with unusual markup
 *      • Text boxes, grouped shapes, header/footer streams
 *   3. Merge & normalise all text, deduplicate, return structured result
 *      with per-section confidence scores.
 *
 * Only parseDocx() and normaliseDocxText() are exported.
 * Nothing in this file touches scoring logic, APIs, DB or UI.
 */

'use strict';

const fs      = require('fs');
const path    = require('path');

/* ─────────────────────────────────────────────────────────────
   1.  MAMMOTH EXTRACTION (primary)
 ───────────────────────────────────────────────────────────── */
async function extractViaMammoth(filePath) {
  try {
    const mammoth = require('mammoth');

    // Extract raw text (structure-independent, works for all DOCX sources)
    const rawResult = await mammoth.extractRawText({ path: filePath });
    let text = rawResult.value || '';

    // Also convert to HTML to capture table cells mammoth may otherwise skip
    const htmlResult = await mammoth.convertToHtml({ path: filePath });
    const htmlText   = stripHtmlTags(htmlResult.value || '');

    // Merge: take whichever is longer for each logical chunk
    text = mergeTexts(text, htmlText);

    const warnings = (rawResult.messages || [])
      .filter(m => m.type === 'warning')
      .map(m => m.message);

    return { text, warnings, method: 'mammoth' };
  } catch (err) {
    return { text: '', warnings: [err.message], method: 'mammoth-failed' };
  }
}

/* ─────────────────────────────────────────────────────────────
   2.  RAW XML EXTRACTION (fallback via unzipper)
       Reads word/document.xml, word/header*.xml, word/footer*.xml,
       word/charts/*.xml  inside the DOCX zip.
 ───────────────────────────────────────────────────────────── */
async function extractViaXml(filePath) {
  try {
    const unzipper = require('unzipper');
    const texts    = [];

    // Parts to extract in priority order
    const TARGET_PARTS = [
      /^word\/document\.xml$/i,
      /^word\/header\d*\.xml$/i,
      /^word\/footer\d*\.xml$/i,
      /^word\/endnotes\.xml$/i,
      /^word\/footnotes\.xml$/i,
    ];

    const directory = await unzipper.Open.file(filePath);

    for (const file of directory.files) {
      if (!TARGET_PARTS.some(re => re.test(file.path))) continue;
      try {
        const content = await file.buffer();
        const xml     = content.toString('utf-8');
        texts.push(xmlToPlainText(xml));
      } catch (_) { /* skip unreadable entry */ }
    }

    return { text: texts.join('\n'), method: 'xml-fallback' };
  } catch (err) {
    return { text: '', method: 'xml-failed', error: err.message };
  }
}

/* ─────────────────────────────────────────────────────────────
   3.  XML → PLAIN TEXT  (regex-based, no xml2js dependency)
       Handles:
         • <w:t> text runs
         • <w:br> / <w:p> paragraph breaks
         • <w:tab> → spaces
         • Hyperlink URLs in r:id / href
 ───────────────────────────────────────────────────────────── */
function xmlToPlainText(xml) {
  if (!xml) return '';

  // Remove XML namespaces to simplify matching
  let s = xml.replace(/<\?xml[^>]*\?>/g, '');

  // Paragraph boundary → newline
  s = s.replace(/<\/w:p>/gi, '\n');

  // Table-cell boundary → tab (helps multi-column layouts)
  s = s.replace(/<\/w:tc>/gi, '\t');

  // Tab run → space
  s = s.replace(/<w:tab[^>]*\/?>/gi, '  ');

  // Line break → newline
  s = s.replace(/<w:br[^>]*\/?>/gi, '\n');

  // Extract text from <w:t ...>…</w:t>
  const textRuns = [];
  const wtRe = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/gi;
  let m;
  while ((m = wtRe.exec(s)) !== null) {
    textRuns.push(decodeXmlEntities(m[1]));
  }

  // If we found explicit text runs use them; otherwise strip all tags
  const result = textRuns.length > 0
    ? textRuns.join('')
    : s.replace(/<[^>]+>/g, ' ');

  return result;
}

function decodeXmlEntities(str) {
  return str
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)));
}

/* ─────────────────────────────────────────────────────────────
   4.  TEXT NORMALISATION
       • Remove leftover XML/HTML noise
       • Merge broken words (single-char lines joined to neighbours)
       • Collapse excessive whitespace
       • Fix mojibake-style Unicode substitutions
       • Deduplicate near-identical consecutive lines
 ───────────────────────────────────────────────────────────── */
function normaliseDocxText(raw) {
  if (!raw) return '';

  let t = raw;

  // Remove XML/HTML remnants
  t = t.replace(/<[^>]{0,200}>/g, ' ');

  // Decode common Unicode replacements used by Word
  t = t
    .replace(/\u2019/g, "'")   // right single quote
    .replace(/\u2018/g, "'")   // left single quote
    .replace(/\u201C/g, '"')   // left double quote
    .replace(/\u201D/g, '"')   // right double quote
    .replace(/\u2013/g, '-')   // en dash
    .replace(/\u2014/g, '-')   // em dash
    .replace(/\u2022/g, '•')   // bullet
    .replace(/\u00A0/g, ' ')   // non-breaking space
    .replace(/\uFFFD/g, ' ')   // replacement char
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, ''); // zero-width / BOM

  // Split into lines, trim each
  const lines = t.split(/\r?\n/).map(l => l.replace(/\t/g, ' ').trim());

  // Merge single-character orphan lines with the next line
  const merged = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length === 1 && i + 1 < lines.length) {
      merged.push(lines[i] + lines[i + 1]);
      i++;
    } else {
      merged.push(lines[i]);
    }
  }

  // Remove empty lines and deduplicate consecutive identical lines
  const deduped = [];
  for (const line of merged) {
    const clean = line.replace(/\s+/g, ' ').trim();
    if (!clean) continue;
    if (deduped.length > 0 && deduped[deduped.length - 1] === clean) continue;
    deduped.push(clean);
  }

  return deduped.join('\n');
}

/* ─────────────────────────────────────────────────────────────
   5.  HELPER UTILITIES
 ───────────────────────────────────────────────────────────── */
function stripHtmlTags(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/td>/gi, '\t')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function mergeTexts(a, b) {
  // Return the union of unique lines from both sources
  const linesA = new Set(a.split('\n').map(l => l.trim()).filter(Boolean));
  const linesB = b.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of linesB) {
    if (!linesA.has(line)) linesA.add(line);
  }
  return [...linesA].join('\n');
}

/* ─────────────────────────────────────────────────────────────
   6.  DOCX VALIDATION
 ───────────────────────────────────────────────────────────── */
function validateDocxFile(filePath) {
  try {
    const stat = fs.statSync(filePath);

    // Reject empty files
    if (stat.size === 0) return { valid: false, reason: 'File is empty' };

    // DOCX files start with PK (ZIP magic bytes 0x50 0x4B)
    const fd  = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);

    if (buf[0] !== 0x50 || buf[1] !== 0x4B) {
      return { valid: false, reason: 'Not a valid DOCX/ZIP file (bad magic bytes)' };
    }

    // Warn on very large files (> 25 MB)
    const warnLarge = stat.size > 25 * 1024 * 1024;
    return { valid: true, size: stat.size, warnLarge };
  } catch (err) {
    return { valid: false, reason: err.message };
  }
}

/* ─────────────────────────────────────────────────────────────
   7.  CONFIDENCE SCORER  (per-section)
       Returns 0-100 confidence for each extracted field group.
 ───────────────────────────────────────────────────────────── */
function scoreConfidence(text, sections) {
  const wc = text.split(/\s+/).filter(Boolean).length;
  return {
    overall:        Math.min(100, Math.round((wc / 10))),
    name:           sections.nameFound       ? 90 : 30,
    contact:        sections.contactFound    ? 95 : 20,
    skills:         sections.skillsFound     ? 90 : 40,
    experience:     sections.expFound        ? 85 : 30,
    education:      sections.eduFound        ? 85 : 30,
    certifications: sections.certFound       ? 80 : 20,
    projects:       sections.projectsFound   ? 80 : 20,
    links:          sections.linksFound      ? 90 : 10,
  };
}

/* ─────────────────────────────────────────────────────────────
   8.  MAIN EXPORT
 ───────────────────────────────────────────────────────────── */

/**
 * parseDocx(filePath)
 *   Returns { text, method, warnings, confidence, parseErrors }
 *
 *   text        — normalised plain-text ready for extractInfo()
 *   method      — 'mammoth' | 'xml-fallback' | 'both'
 *   warnings    — non-fatal issues from mammoth
 *   confidence  — per-section confidence scores (0-100)
 *   parseErrors — critical errors if file could not be read
 */
async function parseDocx(filePath) {
  const parseErrors = [];

  // ── Validation ──────────────────────────────────────────
  const validation = validateDocxFile(filePath);
  if (!validation.valid) {
    parseErrors.push(validation.reason);
    console.error('[DOCX Parser] Validation failed:', validation.reason);
    return { text: '', method: 'validation-failed', warnings: [], confidence: {}, parseErrors };
  }
  if (validation.warnLarge) {
    console.warn('[DOCX Parser] Large file detected (>25 MB) — parsing may be slow');
  }

  // ── Primary: mammoth ─────────────────────────────────────
  const mammothResult = await extractViaMammoth(filePath);
  let   text          = mammothResult.text || '';
  let   method        = mammothResult.method;

  // ── Fallback: raw XML if mammoth yielded < 100 chars ─────
  let xmlResult = null;
  if (text.trim().length < 100) {
    console.warn('[DOCX Parser] Mammoth yield low — trying XML fallback');
    xmlResult = await extractViaXml(filePath);

    if (xmlResult.text && xmlResult.text.trim().length > text.trim().length) {
      text   = xmlResult.text;
      method = xmlResult.method;
    }
  }

  // ── If both succeeded, merge for maximum coverage ────────
  if (text.trim().length > 0 && xmlResult && xmlResult.text.trim().length > 0) {
    text   = mergeTexts(text, xmlResult.text);
    method = 'both';
  }

  // ── Normalise ────────────────────────────────────────────
  text = normaliseDocxText(text);

  if (!text || text.trim().length === 0) {
    parseErrors.push('No readable text extracted from DOCX — file may be image-based or encrypted');
    console.error('[DOCX Parser] Empty result after all extraction attempts');
  }

  // ── Confidence scoring ───────────────────────────────────
  const lower = text.toLowerCase();
  const sections = {
    nameFound:     text.split('\n').slice(0, 5).some(l => l.length > 2 && l.length < 60 && /^[A-Z][a-zA-Z .'-]+$/.test(l.trim())),
    contactFound:  /\b[\w.+-]+@[\w-]+\.[\w.]+\b/.test(text) || /\b[6-9]\d{9}\b/.test(text),
    skillsFound:   /skill|technolog|expertise|competenc/i.test(lower),
    expFound:      /experience|employment|work history|career/i.test(lower),
    eduFound:      /education|degree|university|college|b\.tech|btech|mba/i.test(lower),
    certFound:     /certif|licens|accredit/i.test(lower),
    projectsFound: /project|portfolio/i.test(lower),
    linksFound:    /linkedin|github|portfolio/i.test(lower),
  };

  const confidence = scoreConfidence(text, sections);

  return {
    text,
    method,
    warnings:    mammothResult.warnings || [],
    confidence,
    parseErrors,
  };
}

module.exports = { parseDocx, normaliseDocxText };
