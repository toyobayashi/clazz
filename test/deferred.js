var Deferred = clazz.defineClass({
  name: 'Deferred',
  extend: Promise,
  privateFields: [
    '#methods',
    '#state'
  ],
  destructor: {
    data: function (instance, privateFields) {
      return 1
    },
    handler: function (data) {
      console.log(data)
    }
  },
  makeConstructor: function (context) {
    var _methods = context.privateFields['#methods']
    var _state = context.privateFields['#state']
    var _super = context.superConstruct

    return function () {
      var methods

      var _this = _super(function (_resolve, _reject) {
        function fulfill (value) {
          _state.set(_this, 'fulfilled')
          _resolve(value)
        }
        function reject (reason) {
          _state.set(_this, 'rejected')
          _reject(reason)
        }
        function resolve (value) {
          if (
            (typeof value === 'object' && value !== null) ||
            typeof value === 'function'
          ) {
            let then
            try {
              then = value.then
            } catch (err) {
              reject(err)
              return
            }
            if (typeof then === 'function') {
              Promise.resolve(value).then(fulfill, reject)
            } else {
              fulfill(value)
            }
          } else {
            fulfill(value)
          }
        }
        methods = {
          resolve: resolve,
          reject: reject
        }

        /* if (typeof executor === 'function') {
          try {
            executor(resolve, reject)
          } catch (err) {
            reject(err)
          }
        } */
      })

      _state.set(_this, 'pending')
      _methods.set(_this, methods)

      return _this
    }
  },
  methods: function (privateFields) {
    var _methods = privateFields['#methods']
    return {
      resolve: function resolve (value) {
        _methods.get(this).resolve(value)
      },
      reject: function reject (reason) {
        _methods.get(this).reject(reason)
      }
    }
  },
  getters: function (privateFields) {
    var _state = privateFields['#state']
    return {
      state: function () {
        return _state.get(this)
      }
    }
  },
  protoFields: function () {
    return {
      [Symbol.toStringTag]: this.name
    }
  },
  staticGetters: {
    [Symbol.species]: function () {
      return Promise
    }
  }
})