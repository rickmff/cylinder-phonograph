// Builds the static site into dist/: the page and its modules. There is no bundler: the browser
// loads src/ as is, so this only copies what the site needs and leaves tests and docs behind.
import { cpSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url)), dist = join(root, 'dist');

rmSync(dist, { recursive: true, force: true });
for (const f of ['index.html', 'og.png', 'src']) cpSync(join(root, f), join(dist, f), { recursive: true });
console.log('dist/: index.html, og.png, src/');
