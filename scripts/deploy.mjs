/**
 * Build the site and publish `dist/` to the cloud server.
 *
 *   pnpm ship                 # import notes, build, check, upload, switch
 *   pnpm ship --skip-build    # upload the existing dist/
 *   pnpm ship --dry-run       # show what would happen, change nothing
 *   pnpm ship --rollback      # point the site back at the previous release
 *
 * (Not `pnpm deploy`: that name is a built-in pnpm command.)
 *
 * Settings live in `deploy.config.json` (gitignored; copy
 * `deploy.config.example.json`). Uses the system `ssh`, `scp` and `tar`, which
 * ship with Windows 10+, macOS and Linux.
 *
 * Releases are uploaded side by side and switched atomically with a symlink, so
 * visitors never see a half-uploaded site and a bad deploy is one command away
 * from being undone:
 *
 *   <remoteDir>/releases/20261009-021500/   one directory per deploy
 *   <remoteDir>/<liveLink> -> releases/…     what the web server serves
 *
 * `liveLink` defaults to `dist`, the directory the web server already points
 * at, so no web-server change is needed: on the first run the existing
 * directory is kept as the `00000000-legacy` release and replaced by a link.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = process.cwd();
const args = new Set(process.argv.slice(2));
const DRY = args.has('--dry-run');

const configPath = join(ROOT, 'deploy.config.json');
if (!existsSync(configPath)) {
	console.error('deploy.config.json not found — copy deploy.config.example.json and fill it in.');
	process.exit(2);
}
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const {
	host,
	user = 'root',
	port = 22,
	identityFile,
	remoteDir,
	liveLink = 'dist',
	keepReleases = 5,
	postDeploy = '',
	importNotes = [],
} = config;
for (const [key, value] of Object.entries({ host, remoteDir })) {
	if (!value || String(value).includes('<')) {
		console.error(`deploy.config.json: "${key}" is not filled in.`);
		process.exit(2);
	}
}

const step = (msg) => console.log(`\n\x1b[33m▶ ${msg}\x1b[0m`);
const expandHome = (p) => (p?.startsWith('~') ? join(process.env.HOME ?? process.env.USERPROFILE ?? '', p.slice(1)) : p);

const sshOpts = ['-p', String(port), '-o', 'BatchMode=yes'];
if (identityFile) sshOpts.push('-i', expandHome(identityFile));
const target = `${user}@${host}`;
const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

function run(cmd, cmdArgs, opts = {}) {
	console.log(`  $ ${cmd} ${cmdArgs.join(' ')}`);
	if (DRY && !opts.always) return '';
	const res = spawnSync(cmd, cmdArgs, { stdio: opts.capture ? 'pipe' : 'inherit', encoding: 'utf8', shell: opts.shell ?? false, cwd: opts.cwd ?? ROOT });
	if (res.status !== 0) {
		if (opts.capture) process.stderr.write(res.stderr ?? '');
		throw new Error(`${cmd} exited with ${res.status ?? res.error}`);
	}
	return res.stdout ?? '';
}
const ssh = (script, opts) => run('ssh', [...sshOpts, target, script], opts);

const releases = `${remoteDir}/releases`;
const current = `${remoteDir}/${liveLink}`;

try {
	if (args.has('--rollback')) {
		step('Rolling back to the previous release');
		ssh(
			`set -e; cd ${q(releases)}; now=$(readlink ${q(current)} | xargs basename); ` +
				`prev=$(ls -1 | sort | grep -B1 -x "$now" | head -n1); ` +
				`[ -n "$prev" ] && [ "$prev" != "$now" ] || { echo "no earlier release"; exit 1; }; ` +
				`ln -sfn ${q(releases)}/"$prev" ${q(current)}.tmp && mv -Tf ${q(current)}.tmp ${q(current)}; echo "now serving $prev"` +
				(postDeploy ? `; ${postDeploy}` : ''),
		);
		process.exit(0);
	}

	// Optional: pull fresh notes from note-buddy before building.
	for (const { from, to } of importNotes) {
		if (!from || from.includes('<')) continue;
		const src = resolve(expandHome(from));
		const dest = resolve(ROOT, to);
		step(`Importing notes ${src} -> ${to}`);
		if (!DRY) {
			mkdirSync(dest, { recursive: true });
			cpSync(src, dest, { recursive: true, force: true });
		}
	}

	if (!args.has('--skip-build')) {
		step('Building');
		run('pnpm', ['build'], { shell: process.platform === 'win32' });
		step('Checking internal links');
		run('node', ['scripts/check-asset-links.mjs']);
	}
	if (!existsSync(join(ROOT, 'dist', 'index.html'))) throw new Error('dist/ is empty — build first.');

	const release = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
	// Relative on purpose: Windows scp can read a drive letter (`C:`) as a host name.
	const archive = 'dist-upload.tar.gz';

	step(`Packing dist/ (${release})`);
	run('tar', ['-czf', archive, '-C', 'dist', '.']);

	step(`Uploading to ${target}:${releases}/${release}`);
	ssh(`mkdir -p ${q(`${releases}/${release}`)}`);
	run('scp', [...sshOpts.map((o) => (o === '-p' ? '-P' : o)), archive, `${target}:${remoteDir}/upload.tar.gz`]);

	step('Switching the live site');
	ssh(
		[
			'set -e',
			`tar -xzf ${q(`${remoteDir}/upload.tar.gz`)} -C ${q(`${releases}/${release}`)}`,
			`rm -f ${q(`${remoteDir}/upload.tar.gz`)}`,
			// First run: an existing plain directory at `current` is kept as a release.
			`if [ -d ${q(current)} ] && [ ! -L ${q(current)} ]; then mv ${q(current)} ${q(`${releases}/00000000-legacy`)}; fi`,
			`ln -sfn ${q(`${releases}/${release}`)} ${q(`${current}.tmp`)}`,
			`mv -Tf ${q(`${current}.tmp`)} ${q(current)}`,
			`cd ${q(releases)} && ls -1 | sort | head -n -${Number(keepReleases)} | xargs -r rm -rf`,
			postDeploy,
		]
			.filter(Boolean)
			.join(' && '),
	);
	if (!DRY) rmSync(archive, { force: true });

	console.log(`\n\x1b[32m✓ Deployed ${release}\x1b[0m  (pnpm ship --rollback to undo)`);
} catch (error) {
	console.error(`\n\x1b[31m✗ ${error.message}\x1b[0m`);
	process.exit(1);
}
