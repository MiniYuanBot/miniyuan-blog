import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { parseFrontmatter, createMarkdownProcessor, rehypeHeadingIds } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { applyNotesImport, importNotes, planNotesImport } from './import-notes.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'blog-note-import-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (rel, text) => { mkdirSync(join(root, 'source', rel, '..'), { recursive: true }); writeFileSync(join(root, 'source', rel), text); };
  const config = { from: 'source', to: 'src/content/note/test/course', frontmatter: { author: 'Tester' }, lectures: { L01: { slug: 'intro' } } };
  put('index.md', '# 测试课程\n\n- [讲义](L01/index.md)');
  put('L01/index.md', '# L01 测试讲义\n\n[课程目录](../index.md)\n\n讲前导读。\n\n## 章节导航\n\n- [一](chapters/01-first.md)\n- [二](chapters/02-second.md)\n\n## 本讲小结\n\n讲后小结。');
  put('L01/chapters/01-first.md', '# 第一章\n\n[本讲目录](../index.md) · [下一节](02-second.md)\n\n## 相同标题\n\n![图](assets/Diagram.PNG)\n\n[第二章](02-second.md#相同标题)；[本节](#相同标题)；[分节](section:section-2)。\n\n第一章脚注[^1]，引用[文档][ref]。\n\n[^1]: 第一个来源。\n\n[ref]: https://example.com/one\n\n```md\n# 保持代码\n![代码](missing.png)\n[^1]\n```');
  put('L01/chapters/02-second.md', '---\ntitle: 第二章\nsection: section-2\n---\n\n# 第二章\n\n## 相同标题\n\n第二章脚注[^1]，引用[文档][ref]。\n\n[^1]: 第二个来源。\n\n[ref]: https://example.com/two');
  put('L01/assets/Diagram.PNG', 'image-bytes');
  put('questions.md', '# 思考题\n\n[课程目录](index.md)\n\n[第一节](L01/chapters/01-first.md)');
  return { root, put, config, dest: join(root, config.to) };
}

test('merges chapters, supplies frontmatter, relocates assets and preserves code', async (t) => {
  const { root, config, dest } = fixture(t);
  applyNotesImport(planNotesImport(config, { root }));
  assert.deepEqual(readdirSync(dest).sort(), ['.note-import.json', '01-intro.md', 'assets', 'questions.md']);
  assert.deepEqual(readdirSync(join(dest, 'assets')), ['l01-diagram.png']);
  const result = readFileSync(join(dest, '01-intro.md'), 'utf8');
  const { frontmatter, content } = parseFrontmatter(result);
  assert.equal(frontmatter.title, '测试讲义');
  assert.equal(frontmatter.author, 'Tester');
  assert.deepEqual(frontmatter.tags, ['测试课程']);
  assert.match(frontmatter.pubDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(content.indexOf('讲前导读') < content.indexOf('## 第一章'));
  assert.ok(content.indexOf('## 第二章') < content.indexOf('讲后小结'));
  assert.match(result, /!\[图\]\(assets\/l01-diagram.png\)/);
  assert.match(result, /\[第二章\]\(#相同标题-1\)/);
  assert.match(result, /\[本节\]\(#相同标题\)/);
  assert.match(result, /\[分节\]\(#第二章\)/);
  assert.doesNotMatch(result, /<a\s+id=|^## \d+\s/m);
  assert.doesNotMatch(result, /\[本讲目录\]|章节导航/);
  assert.match(result, /```md\n# 保持代码\n!\[代码\]\(missing.png\)\n\[\^1\]\n```/);
  const rendered = await (await createMarkdownProcessor({ syntaxHighlight: false })).render(content);
  assert.ok(rendered.code.includes(`href="#${encodeURIComponent('相同标题')}-1"`));
  assert.match(rendered.code, /id="相同标题-1"/);
  assert.match(rendered.code, /href="https:\/\/example.com\/one"/);
  assert.match(rendered.code, /href="https:\/\/example.com\/two"/);
  assert.match(rendered.code, /第一个来源/);
  assert.match(rendered.code, /第二个来源/);
  assert.match(readFileSync(join(dest, 'questions.md'), 'utf8'), /\(01-intro.md#第一章\)/);
});

test('imports are repeatable, retain dates and remove only obsolete managed files', (t) => {
  const { root, put, config, dest } = fixture(t);
  config.lectures.L01.pubDate = '2020-01-02';
  applyNotesImport(planNotesImport(config, { root }));
  const file = join(dest, '01-intro.md');
  const before = statSync(file).mtimeMs;
  assert.equal(planNotesImport(config, { root }).writes.length, 0);
  applyNotesImport(planNotesImport(config, { root }));
  assert.equal(statSync(file).mtimeMs, before);
  const date = parseFrontmatter(readFileSync(file, 'utf8')).frontmatter.pubDate;
  put('L01/index.md', '# L01 更新标题\n\n更新导读。');
  delete config.lectures.L01.pubDate;
  writeFileSync(join(dest, 'manual.md'), '# 手写内容');
  config.lectures.L01.slug = 'updated';
  applyNotesImport(planNotesImport(config, { root }));
  assert.equal(existsSync(file), false);
  assert.equal(readFileSync(join(dest, 'manual.md'), 'utf8'), '# 手写内容');
  assert.equal(parseFrontmatter(readFileSync(join(dest, '01-updated.md'), 'utf8')).frontmatter.pubDate, date);
});

test('dry-run leaves files untouched; a bad course prevents all imports', (t) => {
  const { root, put, config, dest } = fixture(t);
  importNotes([config], { root, dryRun: true });
  assert.equal(existsSync(dest), false);
  assert.throws(() => importNotes([config, { ...config, from: 'absent' }], { root }), /ENOENT/);
  assert.equal(existsSync(dest), false);
  put('L01/chapters/02-second.md', '# 二\n\n![缺失](../assets/absent.png)');
  assert.throws(() => planNotesImport(config, { root }), /cannot resolve/);
  assert.equal(existsSync(dest), false);
});

test('migrates an unchanged raw copy but refuses to overwrite local edits or other courses', (t) => {
  const { root, config, dest } = fixture(t);
  mkdirSync(join(dest, 'L01/chapters'), { recursive: true });
  const rel = 'L01/chapters/01-first.md';
  writeFileSync(join(dest, rel), readFileSync(join(root, 'source', rel)));
  applyNotesImport(planNotesImport(config, { root }));
  assert.equal(existsSync(join(dest, 'L01')), false);
  writeFileSync(join(dest, '01-intro.md'), 'local edits');
  assert.throws(() => planNotesImport(config, { root }), /edited locally/);
  assert.throws(() => planNotesImport({ ...config, to: '..' }, { root }), /must be a course/);
});

test('converts Obsidian links and embedded assets within their lecture', (t) => {
  const { root, put, config, dest } = fixture(t);
  put('L01/chapters/01-first.md', '# 第一章\n\n[[02-second#相同标题|下一章]]\n\n![[Diagram.PNG|300]]');
  applyNotesImport(planNotesImport(config, { root }));
  const result = readFileSync(join(dest, '01-intro.md'), 'utf8');
  assert.match(result, /\[下一章\]\(#相同标题\)/);
  assert.match(result, /!\[\|300\]\(assets\/l01-diagram.png\)/);
});

test('rejects colliding assets and detects edits even when only the date was changed', (t) => {
  const { root, put, config, dest } = fixture(t);
  applyNotesImport(planNotesImport(config, { root }));
  const file = join(dest, '01-intro.md');
  const original = readFileSync(file, 'utf8');
  writeFileSync(file, original.replace(/pubDate: "[^"]+"/, 'pubDate: "2000-01-01"'));
  assert.throws(() => planNotesImport(config, { root }), /edited locally/);
  writeFileSync(file, original);
  put('L01/assets/a b.png', 'first-image');
  put('L01/assets/a-b.png', 'different-image');
  assert.throws(() => planNotesImport(config, { root }), /filename collision/);
});

test('can resume a partially written import while the manifest still owns old files', (t) => {
  const { root, put, config, dest } = fixture(t);
  applyNotesImport(planNotesImport(config, { root }));
  put('L01/index.md', '# L01 新标题\n\n新导读。');
  const pending = planNotesImport(config, { root });
  for (const [rel, data] of pending.writes.filter(([rel]) => rel.endsWith('.md'))) writeFileSync(join(dest, rel), data);
  applyNotesImport(planNotesImport(config, { root }));
  assert.equal(planNotesImport(config, { root }).writes.length, 0);
});

test('natural anchors match the site for duplicate headings, inline code and math', async (t) => {
  const { root, put, config, dest } = fixture(t);
  put('L01/index.md', '# L01 测试讲义\n\n## 相同标题\n\n导读。\n\n## 章节导航\n\n- [一](chapters/01-first.md)\n\n## 相同标题\n\n小结。');
  put('L01/chapters/01-first.md', '# **01 第一章**\n\n## 相同标题\n\n## 复杂 `x_y` 与 $x^2$\n\n[本标题](#复杂-x_y-与-x2)；[章标题](#01-第一章)；[讲义顶部](../index.md#l01-测试讲义)。');
  applyNotesImport(planNotesImport(config, { root }));
  const result = readFileSync(join(dest, '01-intro.md'), 'utf8');
  assert.match(result, /## \*\*第一章\*\*/);
  assert.match(result, /\[章标题\]\(#第一章\)/);
  assert.match(result, /\[讲义顶部\]\(#\)/);
  assert.doesNotMatch(result, /<a\s+id=/);
  const renderer = await createMarkdownProcessor({ syntaxHighlight: false, remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex, rehypeHeadingIds] });
  const { code } = await renderer.render(parseFrontmatter(result).content);
  const ids = new Set([...code.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  for (const [, encoded] of code.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(decodeURIComponent(encoded)), encoded);
  assert.ok(ids.has('相同标题-3'));
});

test('omits source callouts and citation footnotes, including inline markers', async (t) => {
  const { root, put, config, dest } = fixture(t);
  put('L01/index.md', '# L01 测试讲义\n\n导读[^intro]。\n\n> [!info]- 来源\n> - [课件](../../input/L01.pdf)\n> - ![审计图片](missing.png)\n\n[^intro]: L01.pdf：PDF p.1');
  put('L01/chapters/01-first.md', [
    '# 01 第一章',
    '',
    '正文[^s1p59]与第二处[^s1p59]，转写稿[^s2b13]，未定义的来源[^s9p99]。',
    '',
    '行尾引用   [^s1p59] [^s2b13]',
    '',
    '显式换行 [^s1p59]  ',
    '下一行',
    '',
    '普通脚注[^explanation]。',
    '',
    '> [!info]- 来源',
    '> - L02.pdf：PDF p.59–65',
    '> - L02.docx：DOCX body 491–564',
    '',
    '> [!note] 补充解释：示例 FSM 与数据通路的 MIPS 来源',
    '> 这段说明应保留。',
    '',
    '[^s1p59]: L02.pdf-PDF p.59',
    '[^s2b13]: L02.docx-DOCX body 491-525',
    '    附加来源说明。',
    '[^explanation]: 有意义的补充解释。',
    '[^unused]: L02.pdf-PDF p.65',
    '',
    '行内示例：`[^s1p59]`；转义示例：\\[^s1p59]。',
    '',
    '```md',
    '> [!info]- 来源',
    '> - L02.pdf：PDF p.59',
    '[^s1p59]: L02.pdf-PDF p.59',
    '代码中的标记[^s1p59]',
    '```',
  ].join('\n'));
  put('questions.md', '# 思考题\n\n题目[^source]。\n\n> [!info]+ Sources\n> - L01.pdf\n\n[^source]: L01.pdf-PDF p.2');
  applyNotesImport(planNotesImport(config, { root }));
  const result = readFileSync(join(dest, '01-intro.md'), 'utf8');
  assert.match(result, /导读。/);
  assert.match(result, /正文与第二处，转写稿，未定义的来源。/);
  assert.match(result, /^行尾引用$/m);
  assert.match(result, /显式换行  \n下一行/);
  assert.match(result, /MIPS 来源\n> 这段说明应保留/);
  assert.match(result, /\[\^l01-section-1-explanation\]: 有意义的补充解释/);
  assert.doesNotMatch(result, /\[\^l01-section-1-(?:s1p59|s2b13|unused)\]|附加来源说明|missing.png|input\/L01.pdf/);
  assert.match(result, /`\[\^s1p59\]`；转义示例：\\\[\^s1p59\]/);
  assert.match(result, /```md\n> \[!info\]- 来源\n> - L02.pdf：PDF p.59\n\[\^s1p59\]: L02.pdf-PDF p.59\n代码中的标记\[\^s1p59\]\n```/);
  const rendered = await (await createMarkdownProcessor({ syntaxHighlight: false })).render(parseFrontmatter(result).content);
  assert.doesNotMatch(rendered.code, /href="#user-content-fn-l01-section-1-s/);
  const questions = readFileSync(join(dest, 'questions.md'), 'utf8');
  assert.match(questions, /题目。/);
  assert.doesNotMatch(questions, /Sources|\[\^/);
  assert.equal(planNotesImport(config, { root }).writes.length, 0);
});

test('omits uncertainty sections with children while preserving following sections and code examples', (t) => {
  const { root, put, config, dest } = fixture(t);
  const index = '# L01 测试讲义\n\n导读保留。\n\n## 不确定事项\n\n未核实内容。\n\n### 待核实细节\n\n![不用解析的图](missing.png)\n\n## 本讲小结\n\n小结保留。';
  const chapter = [
    '# 第一章',
    '',
    '正文保留；“不确定事项”只是这里的一段文字。',
    '',
    '## **不确定事项**',
    '',
    '章节审计信息。',
    '',
    '### 内部子节',
    '',
    '[不用解析的链接](missing.md)',
    '',
    '## 保留章节',
    '',
    '后续内容。',
    '',
    '```md',
    '## 不确定事项',
    '代码示例保持原样。',
    '```',
    '',
    '### 不确定事项：',
    '',
    '结尾审计信息。',
  ].join('\n');
  put('L01/index.md', index);
  put('L01/chapters/01-first.md', chapter);
  put('questions.md', '# 思考题\n\n## 第一组\n\n题目保留。\n\n### 不确定事项\n\n题目审计信息。\n\n#### 详细记录\n\n子节审计信息。\n\n## 第二组\n\n下一组题目保留。');
  applyNotesImport(planNotesImport(config, { root }));
  const result = readFileSync(join(dest, '01-intro.md'), 'utf8');
  assert.match(result, /导读保留。/);
  assert.match(result, /“不确定事项”只是这里的一段文字/);
  assert.match(result, /### 保留章节\n\n后续内容。/);
  assert.match(result, /## 本讲小结\n\n小结保留。/);
  assert.match(result, /```md\n## 不确定事项\n代码示例保持原样。\n```/);
  assert.doesNotMatch(result, /未核实内容|待核实细节|章节审计信息|内部子节|结尾审计信息|missing\.(?:png|md)/);
  const questions = readFileSync(join(dest, 'questions.md'), 'utf8');
  assert.match(questions, /题目保留。/);
  assert.match(questions, /## 第二组\n\n下一组题目保留。/);
  assert.doesNotMatch(questions, /不确定事项|审计信息|详细记录/);
  assert.equal(readFileSync(join(root, 'source/L01/index.md'), 'utf8'), index);
  assert.equal(readFileSync(join(root, 'source/L01/chapters/01-first.md'), 'utf8'), chapter);
  assert.equal(planNotesImport(config, { root }).writes.length, 0);
});
