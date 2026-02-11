import { build, context } from 'esbuild';
import type { Plugin, BuildOptions } from 'esbuild';
import { Project } from 'ts-morph';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

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

const rewriteImportsPlugin: Plugin = {
  name: 'rewrite-imports-to-global',
  setup(build) {
    build.onLoad({ filter: /\.[tj]sx?$/ }, async (args) => {
      const source = await fs.readFile(args.path, 'utf8');

      // re-use args.path
      let sf = project.getSourceFile(args.path);
      if (sf) {
        sf.replaceWithText(source);
      } else {
        sf = project.createSourceFile(args.path, source);
      }

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

const watchPlugin = (): Plugin => {
  const lastHash = new Map<string, string>();
  return {
    name: 'watch-logger',
    setup(build) {
      build.onEnd(async (result) => {
        if (result.errors.length) {
          console.error('[build] failed', result.errors);
          return;
        }

        const outputs = result.metafile?.outputs ?? {};

        for (const [output, meta] of Object.entries(outputs)) {
          if (!meta.entryPoint) continue;

          const buf = await fs.readFile(output);
          const hash = crypto.createHash('sha1').update(buf).digest('hex');

          if (lastHash.get(output) !== hash) {
            lastHash.set(output, hash);
            console.log(`[build] ${meta.entryPoint} -> ${output}`);
          }
        }
      });
    },
  };
};

function baseOptions(plugins: Plugin[]): BuildOptions {
  return {
    plugins: [rewriteImportsPlugin, ...plugins],
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
  };
}

const args = process.argv.slice(2);
const [input, output] = args.filter((a) => !a.startsWith('--'));
if (args.includes('--watch')) {
  if (!input) {
    console.error('Usage: --watch build.json');
    process.exit(1);
  }
  const map: Record<string, string> = JSON.parse(
    await fs.readFile(input, 'utf8'),
  );
  // Convert: input -> output.js
  // into:   output(no .js) -> input
  const entryPoints: Record<string, string> = {};

  for (const [input, output] of Object.entries(map)) {
    const outNoExt = path.resolve(output.replace(/\.[^.]+$/, ''));
    entryPoints[outNoExt] = input;
  }

  const ctx = await context({
    ...baseOptions([watchPlugin()]),
    metafile: true,
    entryPoints,
    outdir: '/',
  });

  await ctx.watch();
} else {
  const result = await build({
    ...baseOptions([]),
    entryPoints: [input],
    outfile: output,
    write: output !== undefined,
  });

  const jsCode = output
    ? await fs.readFile(output)
    : result.outputFiles![0].contents;

  if (output) {
    console.log(`[build] ${input} -> ${output}`);
    await fs.writeFile(output, jsCode);
  } else {
    process.stdout.write(jsCode);
  }
}
