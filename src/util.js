export function isObject (o) {
  return typeof o === 'object' && o !== null
}

export const canUseReflectConstruct =
  typeof Proxy === 'function' &&
  typeof Reflect !== 'undefined' &&
  typeof Reflect.construct === 'function'

export function createSuper (Derived, Base) {
  return canUseReflectConstruct
    ? function () {
      return Reflect.construct(Base, arguments, Derived)
    }
    : function () {
      const bindArgs = [null]
      Array.prototype.push.apply(bindArgs, arguments)
      const BoundBase = Function.prototype.bind.apply(Base, bindArgs)
      const _this = new BoundBase()
      Object.setPrototypeOf(_this, Derived.prototype)
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

export function defineField (Class, name, value) {
  Object.defineProperty(Class.prototype, name, {
    configurable: true,
    enumerable: false,
    writable: false,
    value: value
  })
}

export function defineWritableField (Class, name, value) {
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
    let keys = Object.keys(options)
    if (typeof Object.getOwnPropertySymbols === 'function') {
      keys = [...keys, ...Object.getOwnPropertySymbols(options)]
    }
    for (let i = 0; i < keys.length; ++i) {
      const name = keys[i]
      f(Class, name, options[name])
    }
  }
}

export const defineMethods = makeDefine(defineMethod)
export const defineStaticMethods = makeDefine(defineStaticMethod)
export const defineGetters = makeDefine(defineGetter)
export const defineStaticGetters = makeDefine(defineStaticGetter)
export const defineFields = makeDefine(defineField)
export const defineWritableFields = makeDefine(defineWritableField)
export const defineStaticFields = makeDefine(defineStaticField)

export function defineMembers (Class, defines, options, key) {
  let o
  if (typeof options[key] === 'function') {
    o = options[key](options)
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
