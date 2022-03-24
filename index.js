'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/clazz.cjs.min.js')
} else {
  module.exports = require('./dist/clazz.cjs.js')
}
