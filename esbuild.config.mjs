import esbuild from "esbuild"
import process from "process"
import builtins from 'builtin-modules'

const isDev = process.argv[2] === 'dev';

const ctx = await esbuild.context({
  banner: {
    js: 'Project: https://github.com/rchl-pttrsn/obsidian-jira-tracker',
  },
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: [
    'obsidian',
    'electron',
    '@codemirror/autocomplete',
    '@codemirror/closebrackets',
    '@codemirror/collab',
    '@codemirror/commands',
    '@codemirror/comment',
    '@codemirror/fold',
    '@codemirror/gutter',
    '@codemirror/highlight',
    '@codemirror/history',
    '@codemirror/language',
    '@codemirror/lint',
    '@codemirror/matchbrackets',
    '@codemirror/panel',
    '@codemirror/rangeset',
    '@codemirror/rectangular-selection',
    '@codemirror/search',
    '@codemirror/state',
    '@codemirror/stream-parser',
    '@codemirror/text',
    '@codemirror/tooltip',
    '@codemirror/view',
    ...builtins],
  format: 'cjs',
  target: 'es2020',
  logLevel: "info",
  sourcemap: isDev && 'inline',
  treeShaking: true,
  outfile: 'main.js',
}).catch(() => process.exit(1))

if (isDev) {
  await ctx.watch();
}
