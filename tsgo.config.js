const path = require('path')

module.exports = {
  entry: path.join(__dirname, './lib/esm/index.js'),
  output: {
    doc: false
  },
  rollupGlobals: {},
  bundleOnly: [
    { type: 'umd', minify: false },
    { type: 'umd', minify: true },
    { type: 'cjs', minify: false, resolveOnly: [/^(?!(tslib)).*?$/] },
    { type: 'cjs', minify: true, resolveOnly: [/^(?!(tslib)).*?$/] },
    { type: 'esm-bundler', minify: false, resolveOnly: [/^(?!(tslib)).*?$/] },
    { type: 'esm-browser', minify: false },
    { type: 'esm-browser', minify: true }
  ],
  pureClass: true,
  bundleDefine: {
    __VERSION__: JSON.stringify(require('./package.json').version)
  }
}
