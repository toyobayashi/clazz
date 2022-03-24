import {
  canUseWeakMap,
  canUseDestructor,
  isObject,
  keys
} from './util'

function noop () {}

export function getPrivateFields (options) {
  const isObj = isObject(options.privateFields)
  const isArr = Array.isArray(options.privateFields)
  const privates = Object.create(null)
  if (isArr || isObj) {
    if (!canUseWeakMap) {
      throw new Error('privateFields option requires WeakMap')
    }
    let fields
    if (isArr) {
      fields = options.privateFields
    } else {
      fields = keys(options.privateFields)
      for (let i = 0; i < fields.length; ++i) {
        const key = fields[i]
        if (isObject(options.privateFields[key])) {
          throw new TypeError(`Private field ${key} can not be initialized with an object`)
        }
      }
    }
    for (let i = 0; i < fields.length; ++i) {
      privates[fields[i]] = new WeakMap()
    }
  }
  return {
    privates,
    requireInit: isObj
  }
}

export function initPrivateFields (options, context, instance) {
  const fields = keys(context.privateFields)
  for (let i = 0; i < fields.length; ++i) {
    const key = fields[i]
    const valueOrFactory = options.privateFields[key]
    if (typeof valueOrFactory === 'function') {
      context.privateFields[key].set(instance, valueOrFactory())
    } else {
      context.privateFields[key].set(instance, valueOrFactory)
    }
  }
}

export function getConstructor (options, superConstruct, context, beforeCreate) {
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

export function getDestructor (options) {
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
