// class Container
function Container() {
    this._new();
}

// Util
Container.extend = function (dest, src) {
    for (var i in src) dest[i] = src[i];
};

Container.create = function () {
    return new Container();
};

// class Container
Container.extend(Container.prototype, {

    _new: function () {
        this._resolved = new Container.Hash();
        this._register = new Container.Hash();
        this._dependencies = new Container.Hash();
        this._tags = new Container.Hash();
        this._parrentGetter = null;

        this._accesor = new Container.Accessor();
        this._difiners = new Container.Hash();
    },
    add: function (name, definition, dependencies) {
        return this.register(name, definition, dependencies);
    },
    provide: function (name, definition, dependencies) {
        if (Container.isFunction(definition) && Container.isPureObject(dependencies)) {
            definition.$injectMap = dependencies;
        }

        return this.register(name, definition, ['container']);
    },
    register: function (name, definition, dependencies) {
        this._define(name);

        // clean up
        this.remove(name);
        this._defineParentGetter(definition);

        if (Container.isFunction(definition)) {
            this._register.set(name, definition);
            this._dependencies.set(name, dependencies || definition.$inject);
            this._tags.set(name, definition.$tags || []);
        }
        else {
            this.set(name, definition);
        }

        // to chain
        return this;
    },
    get: function (name) {

        // return self
        if (name == 'container') return this;

        // use accessor
        if (this._accesor.isPath(name))
            return this._accesor.get(this, name);

        // if resolved return
        if (this._resolved.has(name)) return this._resolved.get(name);

        // if not registered return null
        if (!this._register.has(name)) {
            if(Container.isFunction(this._parrentGetter)) {
                return this._parrentGetter(name);
            }
            return null;
        }

        // resolve
        this.set(name, this.create(name));

        return this.get(name);
    },
    set: function (name, definition) {

        if (this._accesor.isPath(name))
            return this._accesor.set(this, name, definition);

        this._resolved.set(name, definition);
    },
    _define: function (name) {
        var container = this;

        if (Container.isFunction(Object.defineProperty) && !container._difiners.has(name)) {
            container._difiners.set(name, name);

            Object.defineProperty(container, name, {
                get: function () {
                    return container.get(name);
                }
            });
        }
    },
    _createMapInjected: function (name) {
        var _class = this._register.get(name);
        var map = _class.$injectMap || {};

        var container = this;
        var containerWrapper = {};

        container._difiners.each(function (name) {
            if (Container.isFunction(Object.defineProperty)) {
                Object.defineProperty(containerWrapper, name, {
                    get: function () {
                        var mappedName = map[name] || name;
                        return container.get(mappedName);
                    }
                });
            }
        });

        var args = [containerWrapper];
        // make creator with args
        var creator = Container.makeCreator(_class, args);

        // create
        return creator();
    },
    _createArrayInjected: function (name) {
        // get class
        var _class = this._register.get(name);

        // get names
        var $inject = this._dependencies.has(name) ? this._dependencies.get(name) : [];

        // args collection
        var args = [];

        // collect args
        for (var i = 0; i < $inject.length; i++) {
            args.push(this.get($inject[i]));
        }

        // make creator with args
        var creator = Container.makeCreator(_class, args);

        // create
        return new creator();
    },
    _setParrentGetter: function (getter) {
        this._parrentGetter = getter;
    },
    _defineParentGetter: function (definition) {
        if (Container.isContainer(definition)) {
            var container = this;
            definition._setParrentGetter(function (name) {
                return container.get(name);
            });
        }
    },
    create: function (name) {

        if (!this._register.has(name)) return null;

        // get _class
        var _class = this._register.get(name);

        // null if not a function
        if (!Container.isFunction(_class)) return null;

        if (_class.$injectMap) {
            return this._createMapInjected(name);
        } else {
            return this._createArrayInjected(name);
        }
    },
    remove: function (name) {
        this._register.remove(name);
        this._resolved.remove(name);
        this._dependencies.remove(name);
        this._tags.remove(name);
    },


    find: function (include, exclude) {

        var self = this;

        var result = [];

        this._tags.each(function (tags, name) {

            var found = true;

            Container.each(include || [], function (name) {
                if (tags.indexOf(name) < 0)
                    found = false;
            });

            Container.each(exclude || [], function (name) {
                if (tags.indexOf(name) >= 0)
                    found = false;
            });

            if (found)
                result.push(self.get(name));
        });

        return result;
    },
    merge: function (container) {
        if (container instanceof Container) {
            this._resolved.merge(container._resolved);
            this._register.merge(container._register);
            this._dependencies.merge(container._dependencies);
            this._tags.merge(container._tags);
        }
    },
    load: function (options) {
        this.merge(Container.load(options));
    }
});

// class Hash
Container.Hash = function (hash) {
    this._new(hash);
};

Container.extend(Container.Hash.prototype, {

    _new: function (hash) {
        this.hash = hash || {};
    },
    get: function (name) {
        return this.has(name) ? this.hash[name] : null;
    },
    set: function (name, value) {
        this.hash[name] = value;
    },
    has: function (name) {
        return this.hash[name] != undefined;
    },
    remove: function (name) {
        return this.has(name) && delete this.hash[name];
    },
    each: function (fn) {
        for (var i in this.hash)
            fn(this.hash[i], i);
    },
    merge: function (hash) {
        if (hash instanceof Container.Hash)
            Container.extend(this.hash, hash.hash);
    }
});


// Tools
Container.extend(Container, {
    isFunction: function (value) {
        return value instanceof Function;
    },
    isClass: function (value) {
        return typeof value === 'function' && /^\s*class\s+/.test(value.toString());
    },
    isArray: function (value) {
        return Object.prototype.toString.call(value) === '[object Array]';
    },
    isPureObject: function (value) {
        return Container.isObject(value)
            && !Container.isArray(value)
            && !Container.isFunction(value);
    },
    isObject: function (value) {
        return value instanceof Object;
    },
    isContainer: function (value) {
        return value instanceof Container;
    },
    each: function (hash, fn) {
        if (Container.isArray(hash)) {
            for (var i = 0; i < hash.length; i++)
                fn(hash[i], i);
        }
        else {
            new Container.Hash(hash).each(fn);
        }
    },
    makeCreator: function (_class, _args) {
        if (Container.isClass(_class)) {

            var bind = function () {

                var a = _args
                    .map(function (value, idx) {
                        return '_args[' + idx + ']';
                    })
                    .join(', ');

                return eval('new _class(' + a + ')');
            };

            return bind;

        } else {
            function bind() {
                return _class.apply(this, _args);
            }

            bind.prototype = _class.prototype;

            return bind;
        }
    },
    bind: function (_class, args) {

        function bind() {
            return _class.apply(this, args);
        }

        bind.prototype = _class.prototype;

        return bind;
    }
});


// Accessor
Container.Accessor = function () {
    this.separator = '/';

    this.getters = [function (context, name) {
        var method = name;
        if (Container.isFunction(context[method])) {
            return context[method].call(context);
        }
    }, function (context, name) {
        var method = 'get' + name.charAt(0).toUpperCase() + name.slice(1);
        if (Container.isFunction(context[method])) {
            return context[method].call(context);
        }
    }, function (context, name) {
        var method = 'get';
        if (Container.isFunction(context[method])) {
            return context[method].call(context, name);
        }
    }, function (context, name) {
        if (context[name]) {
            return context[name];
        }
    }];

    this.setters = [function (context, name, value) {
        var method = name;
        if (Container.isFunction(context[method])) {
            context[method].call(context, value);
            return true;
        }
    }, function (context, name, value) {
        var method = 'set' + name.charAt(0).toUpperCase() + name.slice(1);
        if (Container.isFunction(context[method])) {
            context[method].call(context, value);
            return true;
        }
    }, function (context, name, value) {
        var method = 'set';
        if (Container.isFunction(context[method])) {
            context[method].call(context, name, value);
            return true;
        }
    }, function (context, name, value) {
        context[name] = value;
        return true;
    }];

    this._new();
};

Container.extend(Container.Accessor.prototype, {
    _new: function () {

    },
    isPath: function (name) {
        return ('' + name).indexOf(this.separator) >= 0;
    },
    get: function (context, name) {

        if (Container.isObject(context)) {

            var names = Container.isArray(name) ? name.slice() : name.split(this.separator);

            if (names.length) {

                var name = names.shift();

                var result = undefined;

                Container.each(this.getters, function (getter) {
                    if (result == undefined)
                        result = getter(context, name);
                });

                if (Container.isObject(result) && names.length)
                    return this.get(result, names);

                return result;
            }
        }

        return undefined;
    },
    set: function (context, name, value) {

        if (Container.isObject(context)) {

            var names = Container.isArray(name) ? name.slice() : name.split(this.separator);
            var name = names.pop();
            var result = this.get(context, names);


            var done = false;

            if (Container.isObject(result)) {
                Container.each(this.setters, function (setter) {
                    if (!done && setter(result, name, value)) {
                        done = true;
                    }
                });
            }
            else {
                // can not set
            }

        }
    }
});

module.exports = Container;