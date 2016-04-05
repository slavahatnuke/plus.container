# Dependency Injection Container / plus.container

https://en.wikipedia.org/wiki/Dependency_injection

That is simple dependency injection container, it allows to keep your application simple and DRY.
Allows to manage services and inject dependencies.

## Simple usage


```javascript
var Container = require('plus.container');
var container = new Container();
```

### Register service and use


```javascript


// define your class
var MyClass = function () {

}

// register in container
container.register('myService', MyClass);


var service = container.get('myService');
// service.should.be.instanceof(MyClass);

```

### Inject dependencies

```javascript

// define your classes
var MyClass1 = function () {

}

var MyClass2 = function (myService1) {
    // myService1.should.be.instanceof(MyClass1);
}

// register in container
container.register('myService1', MyClass1);
container.register('myService2', MyClass2, ['myService1']);


var service2 = container.get('myService2');
// service2.should.be.instanceof(MyClass2);


```

## ES6 Support

```javascript
        "use strict";

        class MyService {
            constructor(a, b) {
                this.a = a;
                this.b = b;
            }
        }

        container.register('A', 'AA');
        container.register('B', 'BB');
        container.register('myService', MyService, ['A', 'B']);

        var instance = container.get('myService');
        // instance.should.be.instanceof(MyService);
        // "AA".should.equal(instance.a);
        // "BB".should.equal(instance.b);

```

## Tags, you can find/filter services by tags

```javascript

    var Class1 = function(){ return {CLASS: 1} }
    Class1.$tags = ['tag1'];

    var Class2 = function(){ return {CLASS: 2} }
    Class2.$tags = ['tag1', 'tag2'];

    container.register('class1', Class1);
    container.register('class2', Class2);

    var tag1services = container.find(['tag1']);
    // returns array of services
    // tag1services.length == 2, we will see both of them.

    var tag2services = container.find(['tag2']);
    // tag1services.length == 1, we will see Class2 instance

    var tag1_minus_tag2_services = container.find(['tag1'], ['tag2']);
    // tag1_minus_tag2_services.length == 1, we will see Class1 instance

```
## Nested access
```javascript
   var config = {
        host: 'yyy.com',
        db: {
            host: 'localhost'
        }
   } 
   
   container.register('config', config);
   container.get('config/host'); // yyy.com
   container.get('config/db/host'); // localhost
   
   
```
## Loading services with environment


### Dir

```
.
|-- container.js
|-- container_dev.js
|-- container_prod.js
`-- container_test.js
```

```javascript

// container.js example

module.exports = function (container) {

    var Class1 = function(){  }
    var Class2 = function(){  }

    container.register('class1', Class1);
    container.register('class2', Class2);
}

```

### Usage


Your application's code.

```javascript
// app.js

// loading container from the folder, it allows to manage environments
var container = Container.load(
{
    dir: __dirname,
    env: process.env.NODE_ENV || 'dev'
});

```

Run this!

`node app.js`


This code load container.js code in this order:
- `container.js` // register common services
- `container_dev.js` // register environment depended services or you can override common services


If we use environment it looks like:

`NODE_ENV=test node app.js`

in this case it loads container in this order:
- `container.js` // register common services
- `container_test.js` // register environment dependent services or you can override common services
