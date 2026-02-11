import { context } from 'esbuild';
import type { Plugin, BuildOptions } from 'esbuild';
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

const rewriteImportsPlugin: Plugin = {
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

const watchLoggerPlugin = (input: string, output: string): Plugin => {
  return {
    name: 'watch-logger',
    setup(build) {
      build.onEnd((result) => {
        if (result.errors.length) {
          console.error(`[build] ${input} fail`, result.errors);
        } else {
          console.log(`[build] ${input} -> ${output}`);
        }
      });
    },
  };
};

function baseOptions(
  input: string,
  output: string,
  plugins: Plugin[],
): BuildOptions {
  return {
    plugins: [rewriteImportsPlugin, ...plugins],
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
  };
}

async function runBuild(input: string, output: string, watch = false) {
  const plugins = watch ? [watchLoggerPlugin(input, output)] : [];
  const ctx = await context(baseOptions(input, output, plugins));
  if (watch) {
    await ctx.watch();
    return;
  }
  await ctx.rebuild();
  await ctx.dispose();
  console.log(`[build] ${input} -> ${output}`);
}

async function watchFromConfig(configPath: string) {
  const map: Record<string, string> = JSON.parse(
    await fs.readFile(configPath, 'utf8'),
  );

  await Promise.all(
    Object.entries(map).map(([input, output]) => runBuild(input, output, true)),
  );
}

const args = process.argv.slice(2);
const [input, output] = args.filter((a) => !a.startsWith('--'));
if (args.includes('--watch')) {
  if (!input) {
    console.error('Usage: --watch build.json');
    process.exit(1);
  }
  await watchFromConfig(input);
} else {
  await runBuild(input, output, false);
}
