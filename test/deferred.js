var Deferred = clazz.clazz('Deferred').extend(Promise).define({
  privates: {
    methods: new WeakMap(),
    state: new WeakMap()
  },
  makeConstructor: function (_super) {
    var _methods = this.privates.methods
    var _state = this.privates.state

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
  methods: function () {
    var _methods = this.privates.methods
    return {
      resolve: function resolve (value) {
        _methods.get(this).resolve(value)
      },
      reject: function reject (reason) {
        _methods.get(this).reject(reason)
      }
    }
  },
  getters: function () {
    var _state = this.privates.state
    return {
      state: function () {
        return _state.get(this)
      }
    }
  },
  fields: function () {
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