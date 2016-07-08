
var Container = require('./modules/Container');
var Loader = require('./modules/Loader');

Container.extend(Container, {
    load: function (options) {
        return new Loader(options).load();
    }
});

module.exports = Container;
