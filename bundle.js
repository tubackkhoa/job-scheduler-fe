import { transform } from 'esbuild';
import fs from 'fs';

const [input, output] = process.argv.slice(2);

const { code } = await transform(fs.readFileSync(input), {
  loader: 'tsx',
  format: 'esm',
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  target: 'es2020'
});

const final = code.replace(/^(import .*?;\s*\n)+/, '');

fs.writeFileSync(output, final);
