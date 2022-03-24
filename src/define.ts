/* eslint-disable @typescript-eslint/method-signature-style */

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
  defineMembers
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

/** @public */
export type Constructor = abstract new (...args: any[]) => any

/** @public */
export interface IContext<T extends Constructor, P extends PrivateOption> {
  readonly privateFields: Record<PropertyKey, WeakMap<InstanceType<T>, any>>
  getNewTarget (instance: InstanceType<T>): T
  getPublic<K extends keyof InstanceType<T>> (instance: InstanceType<T>, key: K): InstanceType<T>[K]
  definePublic (instance: InstanceType<T>, key: keyof InstanceType<T>, value: any): this
  setPublic<K extends keyof InstanceType<T>> (instance: InstanceType<T>, key: K, value: InstanceType<T>[K]): this
  getPrivate<K extends PrivateKeys<P>> (instance: InstanceType<T>, key: K): PrivateType<P, K>
  setPrivate<K extends PrivateKeys<P>> (instance: InstanceType<T>, key: K, value: PrivateType<P, K>): this
}

/** @public */
export type IfEquals<X, Y, A=X, B=never> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? A : B

/* type WritableKeys<T> = {
  [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P>
}[keyof T] */

/** @public */
export type ReadonlyKeys<T> = {
  [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, never, P>
}[keyof T]

/** @public */
export type MethodTree<T extends Constructor> = {
  [K in keyof InstanceType<T> as InstanceType<T>[K] extends Function ? K : never]: (this: InstanceType<T>, ...args: Parameters<InstanceType<T>[K]>) => ReturnType<InstanceType<T>[K]>
}

/** @public */
export type StaticMethodTree<T extends Constructor> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K]
}

/** @public */
export type GetterTree<T extends Constructor> = {
  [P in ReadonlyKeys<InstanceType<T>>]: (this: InstanceType<T>) => InstanceType<T>[P];
}

/** @public */
export type StaticGetterTree<T extends Constructor> = {
  [P in ReadonlyKeys<T>]: () => T[P];
}

/** @public */
export type FieldTree = Record<PropertyKey, any>

/** @public */
export type TreeFactor<P extends PrivateOption, T extends Constructor, Tree extends Record<PropertyKey, any>> = (context: IContext<T, P>) => Tree

/** @public */
export type Tree<P extends PrivateOption, T extends Constructor, Tree extends Record<PropertyKey, any>> = TreeFactor<P, T, Tree> | Tree

/** @public */
export interface DestructorOption<P extends PrivateOption, T extends Constructor, Data> {
  data?: (instance: InstanceType<T>, context: IContext<T, P>) => Data
  handler: (data: Data) => void
}

/** @public */
export type Primitive = undefined | null | boolean | number | string | symbol | bigint

/** @public */
export type PrivateOption = PropertyKey[] | Record<PropertyKey, Primitive | (() => any)>

/** @public */
export type PrivateKeys<P> = P extends PropertyKey[]
  ? P[number]
  : P extends Record<PropertyKey, Primitive | (() => Primitive)>
    ? keyof P
    : never

/** @public */
export type PrivateType<P, K> = P extends PropertyKey[]
  ? any
  : P extends Record<PropertyKey, Primitive | (() => Primitive)>
    ? K extends PrivateKeys<P>
      ? P[K] extends Primitive
        ? P[K]
        : P[K] extends () => infer R
          ? R
          : never
      : never
    : never

/** @public */
export type FunctionConstructor<T extends Constructor> =
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  ((this: InstanceType<T>, ...args: ConstructorParameters<T>) => void | InstanceType<T>)

/** @public */
export interface DefineClassOptions<P extends PrivateOption, T extends Constructor, Super extends Constructor> {
  name?: string
  extend?: Super
  privateFields?: P
  destructor?: ((data: undefined) => void) | DestructorOption<P, T, any>
  makeConstructor?: (context: IContext<T, P>) => FunctionConstructor<T>
  methods?: Tree<P, T, MethodTree<T>>
  staticMethods?: Tree<P, T, StaticMethodTree<T>>
  getters?: Tree<P, T, GetterTree<T>>
  staticGetters?: Tree<P, T, StaticGetterTree<T>>
  protoFields?: Tree<P, T, FieldTree>
  writableProtoFields?: Tree<P, T, FieldTree>
  staticFields?: Tree<P, T, FieldTree>
}

/** @public */
export function defineClass<
  P extends PrivateOption,
  T extends Constructor,
  S extends Constructor = never
> (options: DefineClassOptions<P, T, S> = {}): T {
  const name = options.name ?? ''
  const Class = (function (Super) {
    'use strict'

    const { privates, requireInit } = getPrivateFields(options)
    const ctx = new Context(privates)
    const beforeCreate = requireInit
      ? function (instance: any) {
        initPrivateFields(options, ctx, instance)
      }
      : undefined

    let superConstruct
    if (Super) {
      superConstruct = createSuper(Class, Super, beforeCreate)
    }

    const ctor = getConstructor(options, superConstruct, ctx, beforeCreate)
    const { registry, getData } = getDestructor(options)

    function Class (this: any): any {
      if (!(this instanceof Class)) {
        throw new TypeError(`Class constructor ${name} cannot be invoked without 'new'`)
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
  })(options.extend) as unknown as T

  return name ? defineFunction(name, Class) : Class
}
