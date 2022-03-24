import { defineClass } from '..'

test('new', () => {
  const X = defineClass()
  expect(() => {
    // @ts-expect-error
    X()
  }).toThrow(TypeError)
})

test('prototype', () => {
  const X = defineClass()
  const prototypeDesc = Object.getOwnPropertyDescriptor(X, 'prototype')!
  expect(prototypeDesc.configurable).toBe(false)
  expect(prototypeDesc.enumerable).toBe(false)
  expect(prototypeDesc.writable).toBe(false)

  const constructorDesc = Object.getOwnPropertyDescriptor(X.prototype, 'constructor')
  expect(constructorDesc).toEqual({
    configurable: true,
    enumerable: false,
    writable: true,
    value: X
  })
})

declare class _X {
  static f (): void
  f (): void
}

test('methods', () => {
  const X = defineClass<never, typeof _X>({
    methods: {
      f () {}
    },
    staticMethods: {
      f () {}
    }
  })

  expect(Object.getOwnPropertyDescriptor(X, 'f')).toMatchObject({
    configurable: true,
    enumerable: false,
    writable: true
  })

  expect(Object.getOwnPropertyDescriptor(X.prototype, 'f')).toMatchObject({
    configurable: true,
    enumerable: false,
    writable: true
  })
})
