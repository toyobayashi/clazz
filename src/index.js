/**
 * Example library
 *
 * @packageDocumentation
 */

import {
  createSuper,
  inherit,
  initializePrototype,
  defineFunction,
  defineMethods,
  defineStaticMethods,
  defineGetters,
  defineStaticGetters,
  defineStaticFields,
  defineFields,
  defineWritableFields,
  defineMembers
} from './util'

function noop () {}

/** @public */
export function defineClass (options) {
  const Class = (function (Super) {
    'use strict'

    let _super
    if (Super) {
      _super = createSuper(Class, Super)
    }

    let ctor
    if (typeof options.makeConstructor === 'function') {
      ctor = options.makeConstructor(_super)
      if (typeof ctor !== 'function') {
        throw new TypeError('makeConstructor should return a constructor function')
      }
    } else {
      ctor = !_super
        ? noop
        : function () {
          return _super.apply(this, arguments)
        }
    }

    function Class () {
      if (!(this instanceof Class)) {
        throw new TypeError(`Class constructor ${options.name} cannot be invoked without 'new'`)
      }

      const _this = ctor.apply(this, arguments) || this

      return _this
    }

    if (Super) {
      inherit(Class, Super)
    } else {
      initializePrototype(Class)
    }

    defineMembers(Class, defineMethods, options, 'methods')
    defineMembers(Class, defineStaticMethods, options, 'staticMethods')
    defineMembers(Class, defineGetters, options, 'getters')
    defineMembers(Class, defineStaticGetters, options, 'staticGetters')
    defineMembers(Class, defineFields, options, 'fields')
    defineMembers(Class, defineWritableFields, options, 'writableFields')
    defineMembers(Class, defineStaticFields, options, 'staticFields')

    return Class
  })(options.extend)

  return defineFunction(options.name, Class)
}

export const Options = defineClass({
  name: 'Options',
  makeConstructor () {
    return function (name) {
      this.name = name
    }
  },
  methods: {
    extend (Super) {
      this.extend = Super
      return this
    },
    define (options) {
      return defineClass(Object.assign(this, options))
    }
  }
})

export function clazz (name) {
  return new Options(name)
}
