# Dependency Injection Container / plus.container

https://en.wikipedia.org/wiki/Dependency_injection

That is simple dependency injection container, it allows to keep your application simple and DRY.
Allows to manage services and inject dependencies.  [Article about this](https://medium.com/@slavahatnuke/manage-your-services-node-js-dependency-injection-4412f4f62f84)

## Simple usage


```javascript
var Container = require('plus.container');
var container = new Container();
```

## ES6
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
Behaviour with ES6 is same as ES5 "classes" you can mix ES5 and ES6 services too.

## ES6 provide/injection and custom mapping
Examples with dependency injection for ES6/ES2015

#### Dependency injection ES6.
```javascript
/// example 1 // 

container.add('a', 1);
container.add('b', 2);

container.provide('c', (({a, b}) => {
    return {
        result: a + b
    };
}));

console.log('c', container.get('c'));
console.log('c', container.c); // container.c it is alias for container.get('c')
// c { result: 3 }
// c { result: 3 }
```
When we ask `c` it means that container will inject service `a` and `b` to the `c` and we will see result.
It means `c` service will get to arguments `c(a, b)` looks cool :)

#### Dependency injection ES6 with mapping.
```javascript
// exmaple 2 with mapping
container.add('a', 1);
container.add('b', 2);
container.add('customA', 7);

let remap = {
    a: 'customA'
}

container.provide('c', (({a, b}) => {
    return {
        result: a + b
    };
}), remap);


console.log('c', container.get('c'));
console.log('c', container.c); // container.c it is alias for container.get('c')
// c { result: 9 }
// c { result: 9 }
```

It means `c` service will get to arguments `c(customA, b)` it means that we can provide custom implementation to `c` service.

### Register service and use ES5 examples
```javascript
// define your class
var MyClass = function () {}

// register in container
container.register('myService', MyClass);

var service = container.get('myService'); // get service
// service.should.be.instanceof(MyClass); 

// it equals: var service = new MyClass();
// AND: container.get('myService') === container.get('myService') // true
```

### Inject dependencies

```javascript
// define your classes
var MyClass1 = function () {}
var MyClass2 = function (myService1) {
    // myService1.should.be.instanceof(MyClass1);
}

// register in container
container.register('myService1', MyClass1);
container.register('myService2', MyClass2, ['myService1']);

var service2 = container.get('myService2');
// service2.should.be.instanceof(MyClass2);
// it equals: var service2 = new MyClass2(new MyClass1());

// AND: container.get('myService2') === container.get('myService2'); // true
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
for example this way:

```javascript
 var config = {
        db: {
            host: 'localhost'
            port: 27017
            database: 'test1'
        }
   } 
   
   container.register('config', config);
   container.register('database', require('../services/database', ['config/db']);
   
   var database = container.get('database');
   // it equals: var database = new Database(config.db);
   // it will provide to service just part of configurataion related to DB.
```

## Tags, you can find/filter services by tags
Mark your services with tags and find them. It allows to build plugins.
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
    // tag2services.length == 1, we will see Class2 instance

    var tag1_minus_tag2_services = container.find(['tag1'], ['tag2']);
    // tag1_minus_tag2_services.length == 1, we will see Class1 instance

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

    container.register('service1', Class1);
    container.register('service2', Class2);

    container.register('service3', require('../services/Service3'), ['service1']);
    container.register('service4', require('../services/Service4'), ['service1', 'service2']);

}

```

##### Usage
Your application's code.
```javascript
// app.js

// loading container from the folder, it allows to manage environments
var container = Container.load(
{
    dir: __dirname,
    env: process.env.NODE_ENV || 'dev'
});

container.get('service1') // it equals new Class1()
container.get('service2') // it equals new Class2()
container.get('service3') // it equals new Service3(new Class1())
container.get('service4') // it equals new Service4(new Class1(), new Class2())

// BUT: container.get('service4') === container.get('service4') // true // :)
```

##### Run this!
`node app.js`

This code load container.js code in this order:
- `container.js` // register common services
- `container_dev.js` // register environment depended services and you can override common services

If we use environment it looks like:
`NODE_ENV=test node app.js`

in this case it loads container in this order:
- `container.js` // register common services
- `container_test.js` // register environment (test) dependent services and you can override common services

Have a fun and manage your services!
[+1G Team](http://plus1generation.com)

### Misc

#### How to use in the browser?
 ```javascript
var container =  require('plus.container/lite').create()
 ```
 
#### Aliases 

##### Services registration
```javascript
container.register(name, definition, deps) 
container.add(name, definition, deps) /// same
```

##### Container creating
```javascript
var container = new Container();
var container = require('plus.container').create() //same
```
