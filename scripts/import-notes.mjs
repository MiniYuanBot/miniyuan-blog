/** Convert note-buddy output into one blog-compatible Markdown file per lecture. */
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter, rehypeHeadingIds } from '@astrojs/markdown-remark';
import Slugger, { slug } from 'github-slugger';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import { visit } from 'unist-util-visit';
import { ATTACHMENT_EXT } from '../src/plugins/lib/content-index.js';

const MANIFEST = '.note-import.json';
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath);
const headingRenderer = unified().use(remarkRehype, { allowDangerousHtml: true }).use(rehypeKatex).use(rehypeHeadingIds);
const hash = (data) => createHash('sha256').update(data).digest('hex');
const slash = (path) => path.split(sep).join('/');
const key = (path) => path.toLowerCase();
const inside = (parent, child) => { const rel = relative(parent, child); return rel !== '' && !rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel); };
const textOf = (node) => node.children ? node.children.map(textOf).join('') : node.value ?? node.alt ?? '';
const kebab = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `asset-${hash(text).slice(0, 8)}`;
const decode = (text) => { try { return decodeURIComponent(text); } catch { return text; } };
const stripChapterNumber = (text) => text.replace(/^\d+[ \t]+/, '');

function chapterNumber(node) {
  let first;
  visit(node, 'text', (child) => { first ??= child; });
  const prefix = first?.value.match(/^\d+[ \t]+/);
  return prefix ? { node: first, length: prefix[0].length } : null;
}

function navigationRange(doc) {
  const at = doc.tree.children.findIndex((node) => node.type === 'heading' && /^(?:章节导航|章节目录|本讲目录|目录)$/.test(textOf(node)));
  const nav = doc.tree.children[at];
  if (!nav) return null;
  const next = doc.tree.children.slice(at + 1).find((node) => node.type === 'heading' && node.depth <= nav.depth);
  return [nav.position.start.offset, next?.position.start.offset ?? doc.body.length];
}

function walk(dir, prefix = '') {
  return readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true })).flatMap((entry) => {
    if (entry.name.startsWith('.')) return [];
    const rel = posix.join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Refusing symbolic link: ${join(dir, entry.name)}`);
    return entry.isDirectory() ? walk(join(dir, entry.name), rel) : [rel];
  });
}

function readDocument(root, rel) {
  const { frontmatter, content } = parseFrontmatter(readFileSync(join(root, rel), 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n'));
  const tree = parser.parse(content);
  const h1 = tree.children.find((node) => node.type === 'heading' && node.depth === 1);
  return { rel, data: frontmatter, body: content, tree, h1, title: String(frontmatter.title ?? (h1 && textOf(h1)) ?? basename(rel, '.md')) };
}

function assertSafeDestination(root, dest) {
  const base = resolve(root, 'src/content/note');
  if (!inside(base, dest) || slash(relative(base, dest)).split('/').length < 2) {
    throw new Error(`Import destination must be a course under src/content/note/<term>/<course>: ${dest}`);
  }
  // Check existing ancestors too: a symlink must not redirect writes outside the workspace.
  for (let path = dest; inside(root, path); path = dirname(path)) {
    if (existsSync(path) && lstatSync(path).isSymbolicLink()) throw new Error(`Refusing symbolic-link destination: ${path}`);
  }
}

function metadata(doc, defaults, overrides, courseTitle, lecture, date) {
  const data = { ...defaults, ...doc?.data, ...overrides };
  const title = String(data.title ?? doc?.title ?? lecture ?? courseTitle).replace(/^L\d+\s+/i, '');
  const pubDate = data.pubDate ?? data.date ?? data.created ?? date;
  if (Number.isNaN(new Date(pubDate).valueOf())) throw new Error(`Invalid pubDate for ${doc?.rel ?? lecture}: ${pubDate}`);
  const tags = data.tags ?? [courseTitle];
  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string')) throw new Error(`tags must be an array for ${doc?.rel ?? lecture}`);
  const out = { title, excerpt: data.excerpt ?? data.description ?? data.summary ?? `${courseTitle}${lecture ? ` ${lecture}` : ''}`, pubDate: new Date(pubDate).toISOString().slice(0, 10), tags };
  for (const field of ['author', 'position', 'heroImageLight', 'heroImageDark', 'updatedDate', 'draft', 'passwordEnv']) {
    if (data[field] !== undefined) out[field] = data[field];
  }
  return `---\n${Object.entries(out).map(([name, value]) => `${name}: ${JSON.stringify(value)}`).join('\n')}\n---\n\n`;
}

/** Plan and validate every read/write before changing the destination. */
export function planNotesImport(config, { root = process.cwd() } = {}) {
  root = resolve(root);
  if (!config.from || !config.to) throw new Error('Each import needs both "from" and "to".');
  const from = config.from.startsWith('~') ? join(process.env.USERPROFILE ?? process.env.HOME ?? '', config.from.slice(1)) : config.from;
  const src = realpathSync(resolve(root, from));
  const dest = resolve(root, config.to);
  assertSafeDestination(root, dest);
  if (src === dest || inside(src, dest) || inside(dest, src)) throw new Error('Import source and destination must not overlap.');
  const sourceFiles = walk(src);
  const docs = new Map(sourceFiles.filter((rel) => /\.md$/i.test(rel)).map((rel) => [key(rel), readDocument(src, rel)]));
  const courseIndex = docs.get('index.md');
  const courseTitle = config.courseTitle ?? courseIndex?.title ?? basename(dest);
  const defaults = config.frontmatter ?? {};
  const previous = existsSync(join(dest, MANIFEST)) ? JSON.parse(readFileSync(join(dest, MANIFEST), 'utf8')) : { files: {} };
  if (previous.version !== undefined && previous.version !== 1) throw new Error(`Unsupported import manifest: ${join(dest, MANIFEST)}`);
  const outputs = new Map();
  const targets = new Map();
  const lectures = [];
  const errors = [];
  const addOutput = (rel, data) => {
    if (outputs.has(rel)) throw new Error(`Import filename collision: ${rel}`);
    outputs.set(rel, Buffer.isBuffer(data) ? data : Buffer.from(data));
  };
  const stableDate = (output, source) => {
    const priorOutput = previous.entries?.[source] ?? output;
    if (previous.dates?.[priorOutput]) return previous.dates[priorOutput];
    const file = join(dest, priorOutput);
    if (previous.files[priorOutput] && existsSync(file)) {
      const old = readFileSync(file);
      if (hash(old) !== previous.files[priorOutput]) throw new Error(`Imported file was edited locally: ${file}. Move edits to the source or import configuration before retrying.`);
      return parseFrontmatter(old.toString('utf8')).frontmatter.pubDate;
    }
    return statSync(join(src, source)).mtime.toISOString().slice(0, 10);
  };

  for (const entry of readdirSync(src, { withFileTypes: true }).filter((entry) => entry.isDirectory() && /^L\d+$/i.test(entry.name)).sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }))) {
    const lecture = entry.name;
    const number = lecture.slice(1).padStart(2, '0');
    const overrides = config.lectures?.[lecture] ?? config.lectures?.[lecture.toUpperCase()] ?? {};
    const stem = overrides.slug ?? 'lecture';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(stem)) throw new Error(`Invalid English kebab-case slug for ${lecture}: ${stem}`);
    const output = `${number}-${stem}.md`;
    if (lectures.some((item) => item.output === output)) throw new Error(`Duplicate lecture number: ${lecture}`);
    const chapters = [...docs.values()].filter((doc) => key(posix.dirname(doc.rel)) === `${key(lecture)}/chapters`).sort((a, b) => a.rel.localeCompare(b.rel, 'en', { numeric: true }));
    if (!chapters.length) throw new Error(`No chapters found in ${lecture}/chapters`);
    const index = docs.get(`${key(lecture)}/index.md`);
    const item = { lecture, output, chapters, index, overrides };
    lectures.push(item);
    if (index) targets.set(key(index.rel), { output, anchor: '', doc: index, prefix: `${key(lecture)}-overview` });
    for (const [i, doc] of chapters.entries()) {
      const section = kebab(String(doc.data.section ?? `section-${i + 1}`));
      const anchor = `${key(lecture)}-${section}`;
      targets.set(key(doc.rel), { output, anchor, doc, prefix: anchor, shift: 1, chapter: true });
    }
  }
  if (!lectures.length) throw new Error(`No Lxx/chapters directories found in ${src}`);

  for (const doc of docs.values()) {
    if (basename(doc.rel).toLowerCase() === 'index.md' || targets.has(key(doc.rel))) continue;
    if (/^L\d+\//i.test(doc.rel) || /(?:^|\/)assets\//i.test(doc.rel)) throw new Error(`Unexpected Markdown outside chapters: ${doc.rel}`);
    const output = doc.rel.split('/').map((part) => part.toLowerCase()).join('/');
    targets.set(key(doc.rel), { output, anchor: '', doc, prefix: kebab(output.replace(/\.md$/, '')) });
  }
  // An omitted course index always resolves to the site's existing Note listing.
  if (courseIndex) targets.set('index.md', { output: '/note/', anchor: '', doc: courseIndex, prefix: 'course' });

  const assets = new Map();
  for (const rel of sourceFiles.filter((rel) => ATTACHMENT_EXT.test(rel))) {
    const parts = rel.split('/');
    const lecture = /^L\d+$/i.test(parts[0]) ? parts.shift().toLowerCase() : '';
    const ext = rel.slice(rel.lastIndexOf('.')).toLowerCase();
    const name = kebab(parts.filter((part) => part.toLowerCase() !== 'assets').join('-').slice(0, -ext.length));
    const output = `assets/${lecture && !name.startsWith(`${lecture}-`) ? `${lecture}-` : ''}${name}${ext}`;
    addOutput(output, readFileSync(join(src, rel)));
    assets.set(key(rel), output);
  }

  function findSource(doc, path) {
    const clean = decode(path).replace(/\\/g, '/');
    const rel = key(posix.normalize(posix.join(posix.dirname(doc.rel), clean)));
    if (targets.has(rel) || assets.has(rel)) return rel;
    const lecture = doc.rel.split('/')[0];
    // note-buddy sometimes writes assets/x.png from chapters/, one directory too deep.
    if (/^assets\//i.test(clean) && /^L\d+$/i.test(lecture)) {
      const scoped = key(`${lecture}/${clean}`);
      if (assets.has(scoped)) return scoped;
    }
    if (!clean.includes('/')) {
      const candidates = [...targets.keys(), ...assets.keys()].filter((candidate) => {
        const note = docs.get(candidate);
        return key(basename(candidate)) === key(clean) || key(basename(candidate, '.md')) === key(clean) || note?.title === clean || note?.data.aliases?.includes(clean);
      });
      const local = candidates.filter((candidate) => candidate.startsWith(`${key(lecture)}/`));
      const hits = local.length ? local : candidates;
      if (hits.length === 1) return hits[0];
      if (hits.length > 1) throw new Error(`Ambiguous reference in ${doc.rel}: ${path}`);
    }
    return null;
  }

  // Resolve links to the headings Astro generates, including duplicate suffixes
  // and the text KaTeX contributes to headings. No HTML anchors enter the notes.
  for (const target of targets.values()) {
    target.headings = new Map();
    target.originalSlugs = new Map();
    const slugger = new Slugger();
    visit(target.doc.tree, 'heading', (node) => {
      const original = slugger.slug(textOf(node));
      target.originalSlugs.set(node, original);
      if (node === target.doc.h1 && !target.chapter) target.headings.set(original, '');
    });
  }

  function collectHeadings(doc, references, include = () => true) {
    const target = targets.get(key(doc.rel));
    if (target.chapter && !doc.h1) {
      references.push({ target, synthetic: true, node: { type: 'heading', depth: 2, children: [{ type: 'text', value: stripChapterNumber(doc.title) }] } });
    }
    visit(doc.tree, 'heading', (node) => {
      if ((node !== doc.h1 || target.chapter) && include(node)) references.push({ target, node });
    });
  }

  function assignHeadingIds(references) {
    const children = references.map(({ target, node, synthetic }) => {
      const copy = structuredClone(node);
      if (!synthetic) copy.depth = Math.min(6, copy.depth + (target.shift ?? 0));
      if (target.chapter && node === target.doc.h1) {
        const number = chapterNumber(copy);
        if (number) number.node.value = number.node.value.slice(number.length);
      }
      return copy;
    });
    const file = { data: { astro: {} } };
    headingRenderer.runSync({ type: 'root', children }, file);
    const headings = file.data.astro.headings;
    if (headings.length !== references.length) throw new Error('Cannot determine imported heading IDs.');
    references.forEach(({ target, node, synthetic }, i) => {
      const id = headings[i].slug;
      if (!synthetic) {
        target.headings.set(target.originalSlugs.get(node), id);
      }
      if (synthetic || node === target.doc.h1) target.anchor = id;
    });
  }

  for (const lecture of lectures) {
    const references = [];
    const range = lecture.index && navigationRange(lecture.index);
    if (lecture.index) {
      collectHeadings(lecture.index, references, (node) => !range || node.position.start.offset < range[0]);
      if (range) {
        const target = targets.get(key(lecture.index.rel));
        const navigation = [...target.originalSlugs.keys()].find((node) => node.position.start.offset === range[0]);
        target.headings.set(target.originalSlugs.get(navigation), '');
      }
    }
    for (const chapter of lecture.chapters) collectHeadings(chapter, references);
    if (range) collectHeadings(lecture.index, references, (node) => node.position.start.offset >= range[1]);
    assignHeadingIds(references);
  }
  for (const target of targets.values()) {
    if (target.output.startsWith('/') || /^L\d+\//i.test(target.doc.rel)) continue;
    const references = [];
    collectHeadings(target.doc, references);
    assignHeadingIds(references);
  }

  function rewriteUrl(doc, url) {
    const current = targets.get(key(doc.rel));
    if (/^section:/i.test(url)) {
      const section = decode(url.slice(8));
      const lecture = key(doc.rel.split('/')[0]);
      const hit = [...targets.values()].find((target) => key(target.doc.rel).startsWith(`${lecture}/chapters/`) && (target.doc.data.section === section || target.prefix === `${lecture}-${kebab(section)}`));
      if (hit) return `#${hit.anchor}`;
      errors.push(`${doc.rel}: unknown section "${url}"`);
      return url;
    }
    if (/^(?:[a-z][a-z0-9+.-]*:|\/)/i.test(url)) return url;
    const [pathWithQuery, fragment] = url.split('#');
    const [path, ...queryParts] = pathWithQuery.split('?');
    const query = queryParts.length ? `?${queryParts.join('?')}` : '';
    const found = path ? findSource(doc, path) : key(doc.rel);
    if (found && assets.has(found)) return posix.relative(posix.dirname(current.output), assets.get(found)) + query + (fragment ? `#${fragment}` : '');
    const target = found && targets.get(found);
    if (target) {
      const heading = fragment ? target.headings.get(decode(fragment)) ?? target.headings.get(slug(decode(fragment))) : target.anchor;
      if (fragment && heading === undefined) errors.push(`${doc.rel}: unknown heading "${url}"`);
      const route = target.output.startsWith('/') ? target.output : target.output === current.output ? '' : posix.relative(posix.dirname(current.output), target.output);
      return `${route}${query}${heading ? `#${heading}` : ''}` || '#';
    }
    errors.push(`${doc.rel}: cannot resolve "${url}"`);
    return url;
  }

  function transform(doc, { omitNavigation = true, omitH1 = false, omitRange } = {}) {
    const target = targets.get(key(doc.rel));
    const patches = [];
    const omitted = [];
    const remove = (node) => {
      let end = node.position.end.offset;
      while (doc.body[end] === '\n') end += 1;
      omitted.push([node.position.start.offset, end]);
    };
    if (omitH1 && doc.h1) remove(doc.h1);
    if (omitRange) omitted.push(omitRange);
    if (omitNavigation) {
      for (const node of doc.tree.children) {
        if (node.type !== 'paragraph') continue;
        const links = node.children.filter((child) => child.type === 'link');
        if (links.length && links.every((link) => /^(?:本讲目录|课程目录|上一节|下一节|返回目录)/.test(textOf(link))) && node.children.every((child) => child.type === 'link' || (child.type === 'text' && /^[\s·|←→]*$/.test(child.value)))) remove(node);
      }
    }
    omitted.sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < omitted.length;) {
      if (omitted[i][0] <= omitted[i - 1][1]) {
        omitted[i - 1][1] = Math.max(omitted[i - 1][1], omitted[i][1]);
        omitted.splice(i, 1);
      } else i += 1;
    }
    const skipped = (node) => omitted.some(([start, end]) => node.position.start.offset >= start && node.position.end.offset <= end);
    const patch = (start, end, value) => patches.push({ start, end, value });
    visit(doc.tree, (node) => {
      if (!node.position || skipped(node)) return;
      const start = node.position.start.offset;
      const end = node.position.end.offset;
      const raw = doc.body.slice(start, end);
      if (node.type === 'heading') {
        const depth = Math.min(6, node.depth + (target.shift ?? 0));
        const marker = raw.match(/^#{1,6}[ \t]+/);
        if (marker) {
          patch(start, start + marker[0].length, `${'#'.repeat(depth)} `);
          const number = target.chapter && node === doc.h1 && chapterNumber(node);
          if (number) patch(number.node.position.start.offset, number.node.position.start.offset + number.length, '');
        } else {
          const title = target.chapter && node === doc.h1 ? stripChapterNumber(textOf(node)) : textOf(node);
          patch(start, end, `${'#'.repeat(depth)} ${title}`);
        }
      } else if (['link', 'image', 'definition'].includes(node.type)) {
        const url = rewriteUrl(doc, node.url);
        const destination = node.type === 'definition' ? raw.match(/^\[[^\]]+\]:\s*/)?.[0].length : raw.indexOf('](', node.children?.length ? node.children.at(-1).position.end.offset - start : 0) + 2;
        if (!destination || destination < 2) throw new Error(`Cannot locate link destination in ${doc.rel}: ${raw}`);
        const tail = raw.slice(destination);
        const leading = tail.match(/^\s*/)[0].length;
        const at = destination + leading;
        let length;
        if (raw[at] === '<') length = raw.indexOf('>', at) - at + 1;
        else {
          let depth = 0;
          length = 0;
          for (const char of raw.slice(at)) {
            if ((char === ')' && depth === 0) || /\s/.test(char)) break;
            if (char === '(') depth += 1;
            if (char === ')') depth -= 1;
            length += char.length;
          }
        }
        patch(start + at, start + at + length, /\s/.test(url) ? `<${url}>` : url);
      } else if (node.type === 'text') {
        for (const match of raw.matchAll(/(!?)\[\[([^\n]+?)\]\]/g)) {
          const [path, ...alias] = match[2].split('|');
          const url = rewriteUrl(doc, path);
          const label = alias.join('|') || path;
          const value = match[1] ? `![${alias.length ? `|${label}` : ''}](${url})` : `[${label}](${url})`;
          patch(start + match.index, start + match.index + match[0].length, value);
        }
      }
      if (node.type === 'footnoteReference' || node.type === 'footnoteDefinition') {
        const label = raw.match(/^\[\^([^\]]+)\]/);
        if (label) patch(start + 2, start + label[0].length - 1, `${target.prefix}-${label[1]}`);
      }
      // Reference-style links have their own namespace in each source chapter.
      if (node.type === 'definition') {
        const label = raw.match(/^\[([^\]]+)\]/);
        if (label) patch(start + 1, start + label[0].length - 1, `${target.prefix}-${label[1]}`);
      } else if (node.type === 'linkReference' || node.type === 'imageReference') {
        const label = raw.match(/\[([^\]]*)\]$/);
        if (label) {
          const replacement = `${target.prefix}-${node.label ?? node.identifier}`;
          if (node.referenceType === 'shortcut') patch(end, end, `[${replacement}]`);
          else patch(end - label[0].length + 1, end - 1, replacement);
        }
      }
    });
    for (const [start, end] of omitted) patch(start, end, '');
    patches.sort((a, b) => b.start - a.start || b.end - a.end);
    let result = doc.body;
    let boundary = doc.body.length;
    for (const { start, end, value } of patches) {
      if (end > boundary) throw new Error(`Overlapping Markdown edits in ${doc.rel}`);
      result = result.slice(0, start) + value + result.slice(end);
      boundary = start;
    }
    result = result.trim();
    if (target.chapter && !doc.h1) result = `## ${stripChapterNumber(doc.title)}\n\n${result}`;
    return result.trim();
  }

  for (const { lecture, output, chapters, index, overrides } of lectures) {
    let intro = '';
    let tail = '';
    if (index) {
      const range = navigationRange(index);
      if (range) {
        // Transform both parts separately, keeping summary material after the chapters.
        intro = transform(index, { omitH1: true, omitRange: [range[0], index.body.length] });
        tail = transform(index, { omitH1: true, omitRange: [0, range[1]] });
      } else intro = transform(index, { omitH1: true });
    }
    const body = [intro, ...chapters.map((doc) => transform(doc)), tail].filter(Boolean).join('\n\n---\n\n');
    const date = stableDate(output, index?.rel ?? chapters[0].rel);
    addOutput(output, metadata(index, defaults, overrides, courseTitle, lecture, date) + body + '\n');
  }
  for (const target of targets.values()) {
    if (target.output.startsWith('/') || /^L\d+\//i.test(target.doc.rel)) continue;
    addOutput(target.output, metadata(target.doc, defaults, {}, courseTitle, null, stableDate(target.output, target.doc.rel)) + transform(target.doc, { omitH1: true }) + '\n');
  }
  if (errors.length) throw new Error(`Import validation failed (${errors.length}):\n${[...new Set(errors)].map((error) => `  ${error}`).join('\n')}`);

  const managed = previous.files ?? {};
  const removals = [];
  const existing = existsSync(dest) ? walk(dest) : [];
  for (const rel of existing) {
    const old = readFileSync(join(dest, rel));
    const desired = outputs.get(rel);
    const importedBefore = Object.hasOwn(managed, rel);
    const original = sourceFiles.find((source) => key(source) === key(rel));
    const isUnchangedCopy = original && old.equals(readFileSync(join(src, original)));
    if (importedBefore && hash(old) !== managed[rel] && !(desired && old.equals(desired))) throw new Error(`Imported file was edited locally: ${join(dest, rel)}. Move edits to the source or import configuration before retrying.`);
    if (desired && !importedBefore && !old.equals(desired) && !isUnchangedCopy) throw new Error(`Refusing to overwrite an existing file: ${join(dest, rel)}`);
    if (!desired && (importedBefore || isUnchangedCopy)) removals.push(rel);
    else if (!desired && (/^L\d+\//i.test(rel) || basename(rel).toLowerCase() === 'index.md')) throw new Error(`Cannot safely remove old imported content: ${join(dest, rel)}. It differs from the current source.`);
  }
  const files = Object.fromEntries([...outputs].sort(([a], [b]) => a.localeCompare(b)).map(([rel, data]) => [rel, hash(data)]));
  const entries = Object.fromEntries([...targets.values()].filter((target) => !target.output.startsWith('/')).map((target) => [target.doc.rel, target.output]));
  const dates = Object.fromEntries([...outputs].filter(([rel]) => rel.endsWith('.md')).map(([rel, data]) => [rel, parseFrontmatter(data.toString('utf8')).frontmatter.pubDate]));
  const manifest = Buffer.from(JSON.stringify({ version: 1, entries, dates, files }, null, 2) + '\n');
  const writes = [...outputs, [MANIFEST, manifest]].filter(([rel, data]) => !existsSync(join(dest, rel)) || !readFileSync(join(dest, rel)).equals(data));
  return { src, dest, lectures: lectures.length, notes: [...outputs.keys()].filter((rel) => rel.endsWith('.md')).length, assets: assets.size, writes, removals };
}

export function applyNotesImport(plan) {
  const write = ([rel, data]) => {
    const file = resolve(plan.dest, rel);
    if (!inside(plan.dest, file)) throw new Error(`Unsafe import path: ${rel}`);
    mkdirSync(dirname(file), { recursive: true });
    const temp = `${file}.import-tmp`;
    writeFileSync(temp, data);
    renameSync(temp, file);
  };
  for (const output of plan.writes.filter(([rel]) => rel !== MANIFEST)) write(output);
  const directories = new Set();
  for (const rel of plan.removals) {
    const file = resolve(plan.dest, rel);
    if (!inside(plan.dest, file)) throw new Error(`Unsafe removal path: ${rel}`);
    unlinkSync(file);
    for (let dir = dirname(file); inside(plan.dest, dir); dir = dirname(dir)) directories.add(dir);
  }
  for (const dir of [...directories].sort((a, b) => b.length - a.length)) {
    if (existsSync(dir) && readdirSync(dir).length === 0) rmdirSync(dir);
  }
  // Keep ownership of obsolete files until cleanup has actually finished.
  const manifest = plan.writes.find(([rel]) => rel === MANIFEST);
  if (manifest) write(manifest);
}

export function readImportConfig({ root = process.cwd(), configPath, fallback = [] } = {}) {
  const file = configPath ? resolve(root, configPath) : join(root, 'notes.config.json');
  if (!existsSync(file)) {
    if (configPath) throw new Error(`Import configuration not found: ${file}`);
    const legacy = join(root, 'deploy.config.json');
    return existsSync(legacy) ? JSON.parse(readFileSync(legacy, 'utf8')).importNotes ?? fallback : fallback;
  }
  const config = JSON.parse(readFileSync(file, 'utf8'));
  return config.importNotes ?? [];
}

export function importNotes(configs, { root = process.cwd(), dryRun = false } = {}) {
  if (!Array.isArray(configs)) throw new Error('importNotes must be an array.');
  const plans = configs.filter((config) => config.from && !config.from.includes('<')).map((config) => planNotesImport(config, { root }));
  for (const [i, plan] of plans.entries()) {
    if (plans.some((other, j) => j < i && (plan.dest === other.dest || inside(plan.dest, other.dest) || inside(other.dest, plan.dest)))) throw new Error(`Overlapping import destinations: ${plan.dest}`);
  }
  for (const plan of plans) {
    console.log(`[import-notes] ${dryRun ? '[dry-run] ' : ''}${slash(relative(root, plan.dest))}: ${plan.notes} notes (${plan.lectures} lectures), ${plan.assets} assets; ${plan.writes.length} writes, ${plan.removals.length} removals`);
    if (!dryRun) applyNotesImport(plan);
  }
  return plans;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    const configAt = args.indexOf('--config');
    if (configAt !== -1 && !args[configAt + 1]) throw new Error('--config needs a file path.');
    if (args.some((arg, i) => arg !== '--dry-run' && arg !== '--config' && !(configAt !== -1 && i === configAt + 1))) throw new Error('Usage: pnpm import:notes [--dry-run] [--config notes.config.json]');
    const configs = readImportConfig({ configPath: configAt === -1 ? undefined : args[configAt + 1] });
    if (!configs.length) throw new Error('No imports configured. Add importNotes to notes.config.json.');
    importNotes(configs, { dryRun: args.includes('--dry-run') });
  } catch (error) {
    console.error(`[import-notes] ${error.message}`);
    process.exitCode = 1;
  }
}
