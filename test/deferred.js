var Deferred = clazz.defineClass({
  name: 'Deferred',
  extend: Promise,
  privateFields: [
    '#methods',
    '#state'
  ],
  destructor: {
    data: function (instance, context) {
      return context
    },
    handler: function (data) {
      console.log(data)
    }
  },
  makeConstructor: function (context, _super) {
    return function Deferred () {
      var methods

      var _this = _super(function (_resolve, _reject) {
        function fulfill (value) {
          context.setPrivate(_this, '#state', 'fulfilled')
          _resolve(value)
        }
        function reject (reason) {
          context.setPrivate(_this, '#state', 'rejected')
          _reject(reason)
        }
        function resolve (value) {
          if (
            (typeof value === 'object' && value !== null) ||
            typeof value === 'function'
          ) {
            var then
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

      context.setPrivate(_this, '#state', 'pending')
      context.setPrivate(_this, '#methods', methods)

      return _this
    }
  },
  methods: function (context) {
    return {
      resolve: function resolve (value) {
        context.getPrivate(this, '#methods').resolve(value)
      },
      reject: function reject (reason) {
        context.getPrivate(this, '#methods').reject(reason)
      }
    }
  },
  getters: function (context) {
    return {
      state: function () {
        return context.getPrivate(this, '#state')
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
