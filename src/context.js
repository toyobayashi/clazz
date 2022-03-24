import {
  initializePrototype,
  defineFunction,
  defineMethods,
  defineField
} from './util'

function checkPrivateField (privateFields, key) {
  if (!privateFields[key]) {
    throw new Error(`Private field '${key}' must be declared in privateFields option`)
  }
}

export const Context = defineFunction('Context', function Context (privateFields) {
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
