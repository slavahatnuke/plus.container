// class Container
function Container () {
    this._new();
}

// Util
Container.extend = function (dest, src) {
    for (let i in src) {
        dest[i] = src[i];
    }
};

Container.extendMap = function (dest, src) {
    for (let [key, value] of src) {
        dest.set(key, value);
    }
};

Container.create = function () {
    return new Container();
};

// class Container
Container.extend(Container.prototype, {

    _new: function () {
        this._resolved = new Container.Hash();
        this._register = new Container.Hash();
        this._factories = new Container.Hash();
        this._dependencies = new Container.Hash();
        this._tags = new Container.Hash();
    },
    add: function (name, definition, dependencies) {
        return this.register(name, definition, dependencies);
    },
    register: function (name, definition, dependencies) {
        if (Container.isFunction(definition)) {
            this._register.set(name, definition);
            this._dependencies.set(name, dependencies || definition.$inject || []);
            this._tags.set(name, definition.$tags || []);
        }
        else {
            this.set(name, definition);
        }

        // to chain
        return this;
    },
    registerLazy: function (name, path, dependencies, tags) {
        this._dependencies.set(name, dependencies || []);
        this._tags.set(name, tags || []);
        this.set(name, path);

        // to chain
        return this;
    },
    registerLazyFactory: function (name, path, dependencies, tags) {
        this._dependencies.set(name, dependencies || []);
        this._tags.set(name, tags || []);
        this._factories.set(name, path);

        // to chain
        return this;
    },
    get: function (name) {
        // return self
        if (name === 'container') {
            return this;
        }

        // lazy registering
        if (this._resolved.has(name) || this._factories.has(name)) {
            let object = this._resolved.get(name);
            if (!object) {
                object = this._factories.get(name);
            }

            if (typeof object === 'string' && Container.isPath(object)) {
                object = require(object);
                let deps = this._dependencies.get(name);

                if (deps.length === 0 && object.$inject && object.$inject.length !== 0) {
                    deps = object.$inject;
                }

                this.remove(name);
                this.register(name, object, deps || []);
            }
        }

        // if resolved return
        if (this._resolved.has(name)) {
            return this._resolved.get(name);
        }

        // if not registered return null
        if (!this._register.has(name)) {
            return null;
        }

        // resolve
        this.set(name, this.create(name));

        return this.get(name);
    },
    set: function (name, definition) {
        this._resolved.set(name, definition);
    },
    create: function (name) {
        if (this._factories.has(name)) {
            return this._createFromFactory(name);
        }

        if (!this._register.has(name)) {
            return null;
        }

        // get _class
        let _class = this._register.get(name);

        // null if not a function
        if (!Container.isFunction(_class)) {
            return null;
        }

        return this._createArrayInjected(name);
    },
    remove: function (name) {
        this._register.remove(name);
        this._resolved.remove(name);
        this._dependencies.remove(name);
        this._tags.remove(name);
    },
    find: function (include = [], exclude = []) {
        let result = [];

        this._tags.each((tags, name) => {
            for (let tag of include) {
                if (tags.indexOf(tag) === -1) {
                    return;
                }
            }

            for (let tag of exclude) {
                if (tags.indexOf(tag) !== -1) {
                    return;
                }
            }

            result.push(this.get(name));
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
    },
    _createArrayInjected: function (name) {
        // get class
        let _class = this._register.get(name);

        // get names
        let $inject = this._dependencies.get(name) || [];

        // args collection
        let args = [];

        // collect args
        for (let injection of $inject) {
            args.push(this.get(injection));
        }

        // create
        return new _class(...args);
    },
    _createFromFactory: function (name) {
        // get class
        let _class = this._register.get(name);

        // get names
        let $inject = this._dependencies.get(name) || [];

        // args collection
        let args = [];

        // collect args
        for (let injection of $inject) {
            args.push(this.get(injection));
        }

        // create

        return _class(...args);
    },
});

// class Hash
Container.Hash = function (hash) {
    this._new(hash);
};

Container.extend(Container.Hash.prototype, {

    _new: function (hash) {
        this.hash = hash || new Map();
    },
    get: function (name) {
        return this.hash.get(name);
    },
    set: function (name, value) {
        this.hash.set(name, value);
    },
    has: function (name) {
        return this.hash.has(name);
    },
    remove: function (name) {
        this.hash.delete(name);
    },
    each: function (fn) {
        for (let [name, tags] of this.hash) {
            fn(tags, name);
        }
    },
    merge: function (hash) {
        if (hash instanceof Container.Hash)
            Container.extendMap(this.hash, hash.hash);
        return this;
    },
});

// Tools
Container.extend(Container, {
    isFunction: function (value) {
        return value instanceof Function;
    },
    isArray: function (value) {
        return Object.prototype.toString.call(value) === '[object Array]';
    },
    isPath: function (name) {
        return ('' + name).indexOf('/') >= 0;
    },
    each: function (hash, fn) {
        for (let i = 0; i < hash.length; i++) {
            fn(hash[i], i);
        }
    },
});

module.exports = Container;