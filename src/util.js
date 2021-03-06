export function isObject (o) {
  return typeof o === 'object' && o !== null
}

export function keys (o) {
  const result = Object.keys(o)
  if (typeof Object.getOwnPropertySymbols === 'function') {
    Array.prototype.push.apply(result, Object.getOwnPropertySymbols(o))
  }
  return result
}

export const canUseReflectConstruct =
  typeof Proxy === 'function' &&
  typeof Reflect !== 'undefined' &&
  typeof Reflect.construct === 'function'

export const canUseWeakMap = typeof WeakMap === 'function'
export const canUseDestructor = typeof FinalizationRegistry === 'function'

export function createSuper (Derived, Base, beforeCreate) {
  return canUseReflectConstruct
    ? function () {
      const _this = Reflect.construct(Base, arguments, Derived)
      if (beforeCreate) {
        beforeCreate(_this)
      }
      return _this
    }
    : function () {
      const bindArgs = [null]
      Array.prototype.push.apply(bindArgs, arguments)
      const BoundBase = Function.prototype.bind.apply(Base, bindArgs)
      const _this = new BoundBase()
      Object.setPrototypeOf(_this, Derived.prototype)
      if (beforeCreate) {
        beforeCreate(_this)
      }
      return _this
    }
}

export function initializePrototype (Class) {
  Object.defineProperty(Class, 'prototype', {
    configurable: false,
    enumerable: false,
    writable: false
  })
  Object.defineProperty(Class.prototype, 'constructor', {
    configurable: true,
    writable: true,
    enumerable: false,
    value: Class
  })
}

export function inherit (Derived, Base) {
  initializePrototype(Derived)
  Object.setPrototypeOf(Derived, Base)
  Object.setPrototypeOf(Derived.prototype, Base.prototype)
}

export function defineFunction (name, fn) {
  return Object.defineProperty(fn, 'name', {
    configurable: true,
    writable: false,
    enumerable: false,
    value: name
  })
}

/**
 * @template T
 * @param {T} instance
 * @param {PropertyKey} name
 * @param {any} value
 * @returns {T}
 * @public
 */
export function defineField (instance, name, value) {
  return Object.defineProperty(instance, name, {
    configurable: true,
    enumerable: true,
    writable: true,
    value: value
  })
}

export function defineMethod (Class, name, fn) {
  Object.defineProperty(Class.prototype, name, {
    configurable: true,
    writable: true,
    enumerable: false,
    value: defineFunction(name, function () {
      'use strict'
      if (this && !(this instanceof Class)) {
        throw new TypeError(`${name} is not a constructor`)
      }
      return fn.apply(this, arguments)
    })
  })
}

export function defineStaticMethod (Class, name, fn) {
  Object.defineProperty(Class, name, {
    configurable: true,
    writable: true,
    enumerable: false,
    value: defineFunction(name, function () {
      'use strict'
      if (this && !(this instanceof Class.constructor)) {
        throw new TypeError(`${name} is not a constructor`)
      }
      return fn.apply(this, arguments)
    })
  })
}

export function defineGetter (Class, name, fn) {
  Object.defineProperty(Class.prototype, name, {
    configurable: true,
    enumerable: false,
    get: defineFunction(name, fn)
  })
}

export function defineStaticGetter (Class, name, fn) {
  Object.defineProperty(Class, name, {
    configurable: true,
    enumerable: false,
    get: defineFunction(name, fn)
  })
}

export function defineStaticField (Class, name, value) {
  Object.defineProperty(Class, name, {
    configurable: true,
    writable: true,
    enumerable: true,
    value: value
  })
}

export function defineProtoField (Class, name, value) {
  Object.defineProperty(Class.prototype, name, {
    configurable: true,
    enumerable: false,
    writable: false,
    value: value
  })
}

export function defineWritableProtoField (Class, name, value) {
  Object.defineProperty(Class.prototype, name, {
    configurable: true,
    enumerable: false,
    writable: true,
    value: value
  })
}

function makeDefine (f) {
  return function (Class, options) {
    options = options || {}
    const k = keys(options)
    for (let i = 0; i < k.length; ++i) {
      const name = k[i]
      f(Class, name, options[name])
    }
  }
}

export const defineMethods = makeDefine(defineMethod)
export const defineStaticMethods = makeDefine(defineStaticMethod)
export const defineGetters = makeDefine(defineGetter)
export const defineStaticGetters = makeDefine(defineStaticGetter)
export const defineProtoFields = makeDefine(defineProtoField)
export const defineWritableProtoFields = makeDefine(defineWritableProtoField)
export const defineStaticFields = makeDefine(defineStaticField)

export function defineMembers (Class, defines, options, key, arg0) {
  let o
  if (typeof options[key] === 'function') {
    o = options[key](arg0)
  } else {
    o = options[key]
  }
  if (isObject(o)) {
    defines(Class, o)
  } else {
    if (o) {
      throw new TypeError(`Invalid options: "${key}"`)
    }
  }
}
