import { build } from 'esbuild';
import { gzipSync } from 'zlib';
import fs from 'fs';

const [input, output] = process.argv
  .slice(2)
  .filter((a) => !a.startsWith('--'));

const result = await build({
  entryPoints: [input],
  outfile: output,
  bundle: true,
  minify: true,
  legalComments: 'none',
  format: 'esm',
  target: 'es2020',
  loader: {
    '.tsx': 'tsx',
    '.py': 'text'
  },
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  write: output !== undefined
});

let jsCode = output ? fs.readFileSync(output) : result.outputFiles[0].contents;

if (process.argv.includes('--base64')) {
  // gzip → base64
  const gzipped = gzipSync(jsCode);
  const base64 = gzipped.toString('base64');
  // write final data URL
  jsCode = `data:application/gzip;base64,${base64}`;
}

if (output) {
  fs.writeFileSync(output, jsCode);
} else {
  process.stdout.write(jsCode);
}
