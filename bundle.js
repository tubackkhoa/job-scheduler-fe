import { build } from 'esbuild';

const [input, output] = process.argv.slice(2);

await build({
  entryPoints: [input],
  outfile: output,
  bundle: true,
  minify: true,
  legalComments: 'none',
  format: 'esm',
  target: 'es2020',
  external: ['react-dom', '@rjsf/*', '@mui/*'],
  loader: {
    '.tsx': 'tsx'
  },
  jsx: 'transform',
  jsxFactory: 'React.createElement'
});
