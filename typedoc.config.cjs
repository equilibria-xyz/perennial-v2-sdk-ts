/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  entryPoints: [
    'src/Perennial/index.ts',
    'src/lib/markets/index.ts',
    'src/lib/vaults/index.ts',
    'src/lib/contracts.ts',
    'src/lib/operators.ts',
  ],
  out: 'docs',
  internalModule: 'Definitions',
  plugin: 'typedoc-plugin-missing-exports',
}
