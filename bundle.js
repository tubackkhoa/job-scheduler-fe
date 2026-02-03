import { build } from 'esbuild';
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
    '.py': 'text',
  },
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  write: output !== undefined,
});

const jsCode = output
  ? fs.readFileSync(output)
  : result.outputFiles[0].contents;

if (output) {
  fs.writeFileSync(output, jsCode);
} else {
  process.stdout.write(jsCode);
}
