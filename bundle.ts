import { build } from 'esbuild';
import type { Plugin } from 'esbuild';
import { Project } from 'ts-morph';
import fs from 'fs/promises';

const IMPORT_REWRITE_MAP: Record<string, string> = {
  react: 'React',
  'react-router-dom': 'RouterDom',
  '@mui/material': 'Mui',
  'lightweight-charts': 'LightweightChart',
};

const project = new Project({
  useInMemoryFileSystem: true,
  skipAddingFilesFromTsConfig: true,
});

export const rewriteImportsPlugin: Plugin = {
  name: 'rewrite-imports-to-global',
  setup(build) {
    build.onLoad({ filter: /\.[tj]sx?$/ }, async (args) => {
      const source = await fs.readFile(args.path, 'utf8');
      const sf = project.createSourceFile(args.path, source, {
        overwrite: true,
      });

      sf.getImportDeclarations().forEach((imp) => {
        const moduleName = imp.getModuleSpecifierValue();
        const targetObj = IMPORT_REWRITE_MAP[moduleName];
        if (!targetObj) return;

        const namedImports = imp.getNamedImports();
        if (!namedImports.length) return;

        const bindings = namedImports
          .map((n) =>
            n.getAliasNode()
              ? `${n.getName()}: ${n.getAliasNode()!.getText()}`
              : n.getName(),
          )
          .join(', ');

        imp.replaceWithText(`const { ${bindings} } = ${targetObj};`);
      });

      return {
        contents: sf.getFullText(),
        loader: args.path.endsWith('x') ? 'tsx' : 'ts',
      };
    });
  },
};

const [input, output] = process.argv
  .slice(2)
  .filter((a) => !a.startsWith('--'));

const result = await build({
  plugins: [rewriteImportsPlugin],
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
  ? await fs.readFile(output)
  : result.outputFiles![0].contents;

if (output) {
  await fs.writeFile(output, jsCode);
} else {
  process.stdout.write(jsCode);
}
