/**
 * Create class without class and extends keywords but with destructor
 * Extending built-in class also works in TypeScript ES5 target
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
  defineProtoFields,
  defineWritableProtoFields,
  defineMembers,
  defineField
} from './util'

import {
  Context
} from './context'

import {
  getPrivateFields,
  initPrivateFields,
  getConstructor,
  getDestructor
} from './class'

export { defineField }

/** @public */
export function defineClass (options) {
  const Class = (function (Super) {
    'use strict'

    const { privates, requireInit } = getPrivateFields(options)
    const ctx = new Context(privates)
    const beforeCreate = requireInit
      ? function (instance) {
        initPrivateFields(options, ctx, instance)
      }
      : undefined

    let superConstruct
    if (Super) {
      superConstruct = createSuper(Class, Super, beforeCreate)
    }

    const ctor = getConstructor(options, superConstruct, ctx, beforeCreate)
    const { registry, getData } = getDestructor(options)

    function Class () {
      if (!(this instanceof Class)) {
        throw new TypeError(`Class constructor ${options.name} cannot be invoked without 'new'`)
      }

      const _this = ctor.apply(this, arguments) || this

      if (registry) {
        registry.register(_this, getData(_this, ctx))
      }

      return _this
    }

    if (Super) {
      inherit(Class, Super)
    } else {
      initializePrototype(Class)
    }

    defineMembers(Class, defineMethods, options, 'methods', ctx)
    defineMembers(Class, defineStaticMethods, options, 'staticMethods')
    defineMembers(Class, defineGetters, options, 'getters', ctx)
    defineMembers(Class, defineStaticGetters, options, 'staticGetters')
    defineMembers(Class, defineProtoFields, options, 'protoFields', ctx)
    defineMembers(Class, defineWritableProtoFields, options, 'writableProtoFields', ctx)
    defineMembers(Class, defineStaticFields, options, 'staticFields')

    return Class
  })(options.extend)

  return defineFunction(options.name, Class)
}
