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
  defineProtoFields,
  defineWritableProtoFields,
  defineMembers,
  canUseWeakMap,
  canUseDestructor,
  isObject,
  defineField
} from './util'

export { defineField }

function noop () {}

function getPrivateFields (options) {
  const isObj = isObject(options.privateFields)
  const isArr = Array.isArray(options.privateFields)
  const privates = Object.create(null)
  if (isArr || isObj) {
    if (!canUseWeakMap) {
      throw new Error('privateFields option requires WeakMap')
    }
    let keys
    if (isArr) {
      keys = options.privateFields
    } else {
      keys = Object.keys(options.privateFields)
      if (typeof Object.getOwnPropertySymbols === 'function') {
        Array.prototype.push.apply(keys, Object.getOwnPropertySymbols(options.privateFields))
      }
      for (let i = 0; i < keys.length; ++i) {
        const key = keys[i]
        if (isObject(options.privateFields[key])) {
          throw new TypeError(`Private field ${key} can not be initialized with an object`)
        }
      }
    }
    for (let i = 0; i < keys.length; ++i) {
      privates[keys[i]] = new WeakMap()
    }
  }
  return {
    privates,
    requireInit: isObj
  }
}

function checkPrivateField (privateFields, key) {
  if (!privateFields[key]) {
    throw new Error(`Private field '${key}' must be declared in privateFields option`)
  }
}

const Context = defineFunction('Context', function Context (privateFields) {
  defineField(this, 'privateFields', privateFields)
})
initializePrototype(Context)
defineMethods(Context, {
  getNewTarget (instance) {
    return Object.getPrototypeOf(instance).constructor
  },
  getPublic (instance, key) {
    return instance[key]
  },
  definePublic (instance, key, value) {
    defineField(instance, key, value)
    return this
  },
  setPublic (instance, key, value) {
    instance[key] = value
    return this
  },
  getPrivate (instance, key) {
    checkPrivateField(this.privateFields, key)
    return this.privateFields[key].get(instance)
  },
  setPrivate (instance, key, value) {
    checkPrivateField(this.privateFields, key)
    this.privateFields[key].set(instance, value)
    return this
  }
})

function initPrivateFields (options, context, instance) {
  const keys = Object.keys(context.privateFields)
  if (typeof Object.getOwnPropertySymbols === 'function') {
    Array.prototype.push.apply(keys, Object.getOwnPropertySymbols(context.privateFields))
  }
  for (let i = 0; i < keys.length; ++i) {
    const key = keys[i]
    const valueOrFactory = options.privateFields[key]
    if (typeof valueOrFactory === 'function') {
      context.privateFields[key].set(instance, valueOrFactory())
    } else {
      context.privateFields[key].set(instance, valueOrFactory)
    }
  }
}

function getConstructor (options, superConstruct, context, beforeCreate) {
  let ctor
  if (typeof options.makeConstructor === 'function') {
    const userCtor = options.makeConstructor(context, superConstruct)
    if (typeof userCtor !== 'function') {
      throw new TypeError('makeConstructor should return a constructor function')
    }
    ctor = userCtor
  } else {
    ctor = !superConstruct
      ? (beforeCreate ? function () { beforeCreate(this) } : noop)
      : function () {
        return superConstruct.apply(this, arguments)
      }
  }
  return ctor
}

function getDestructor (options) {
  let registry
  let getData
  const isObjectDestructor = isObject(options.destructor)
  const isFunctionDestructor = typeof options.destructor === 'function'
  if (isObjectDestructor || isFunctionDestructor) {
    if (canUseDestructor) {
      if (isObjectDestructor) {
        getData = typeof options.destructor.data === 'function' ? options.destructor.data : noop
        const destructor = typeof options.destructor.handler === 'function'
        if (destructor) {
          registry = new FinalizationRegistry(options.destructor.handler)
        } else {
          throw new TypeError('Invalid destructor')
        }
      } else {
        getData = noop
        registry = new FinalizationRegistry(options.destructor)
      }
    } else {
      console.warn('destructor option requires FinalizationRegistry')
    }
  }
  return {
    getData,
    registry
  }
}

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
