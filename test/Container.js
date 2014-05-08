describe('Container', function () {

    var container, Container = require('../src/Container');
    require('chai').should();

    beforeEach(function () {
        container = new Container();
    });

    it('should allow to register class: container.register("myService", function MyClass(){})', function () {
        var MyClass = function () {
            
        }
        container.register('myService', MyClass);
    });

    it('should allow to get instance: container.get("myService") // return new MyClass()', function () {

        var MyClass = function () {

        }

        container.register('myService', MyClass);
        var instance = container.get('myService');

        instance.should.be.instanceof(MyClass)
    });

    it('should return single instance: container.get("myService") === container.get("myService")', function () {

        var MyClass = function () {

        }

        container.register('myService', MyClass);

        var instance = container.get('myService');
        var instance2 = container.get('myService');

        instance.should.equal(instance2);
    });

    it('should allow to register value: container.register("myValue", "value")', function () {

        container.register('myValue', 'value');
        var instance = container.get('myValue');

        instance.should.equal('value');

    });

    it('should allow to get value: container.get("myValue")', function () {

        var complexValue = ['complex', 'value'];

        container.register('myValue', complexValue);
        var instance = container.get('myValue');

        instance.should.equal(complexValue);

    });

    it('should allow to register class with dependencies: container.register("myService", function MyClass(){}, ["dep1", "dep2"])', function () {

        // dep1
        var MyClass1 = function () {
            this.name = "MyClass1"
        }

        // dep2
        var myConfig = {my: 'config'};


        var MyClass2 = function (dep1, dep2) {
            this.dep1 = dep1;
            this.dep2 = dep2;
        }

        container.register('myService1', MyClass1);

        container.register('myConfig', myConfig);

        container.register('myService2', MyClass2, ['myService1', 'myConfig']);

    });

    it('should allow to get instance: container.get("myService") // return new MyClass(aDep1, aDep2)', function () {

        // dep1
        var MyClass1 = function () {
            this.name = "MyClass1"
        }

        // dep2
        var myConfig = {my: 'config'};


        var MyClass2 = function (dep1, dep2) {
            this.dep1 = dep1;
            this.dep2 = dep2;
        }

        container.register('myService1', MyClass1);

        container.register('myConfig', myConfig);

        container.register('myService2', MyClass2, ['myService1', 'myConfig']);

        var instance = container.get('myService2');

        instance.dep1.should.be.instanceof(MyClass1);
        instance.dep1.name.should.equal('MyClass1');

        instance.dep2.should.equal(myConfig);

    });

    it('should allow to register class with default dependencies: function MyClass(){}; MyClass.$inject = ["dep1", "dep2"]; container.register("myService", myService)', function () {
        // dep1
        var MyClass1 = function () {
            this.name = "MyClass1"
        }

        // dep2
        var myConfig = {my: 'config'};


        var MyClass2 = function (dep1, dep2) {
            this.dep1 = dep1;
            this.dep2 = dep2;
        }

        MyClass2.$inject = ['myService1', 'myConfig'];

        container.register('myService1', MyClass1);

        container.register('myConfig', myConfig);

        container.register('myService2', MyClass2); // there dependencies from $inject

    });

    it('should allow to get instance: container.get("myService") // return new MyClass(aDep1, aDep2)', function () {
        // dep1
        var MyClass1 = function () {
            this.name = "MyClass1"
        }

        // dep2
        var myConfig = {my: 'config'};


        var MyClass2 = function (dep1, dep2) {
            this.dep1 = dep1;
            this.dep2 = dep2;
        }

        MyClass2.$inject = ['myService1', 'myConfig'];

        container.register('myService1', MyClass1);

        container.register('myConfig', myConfig);

        container.register('myService2', MyClass2);

        var instance = container.get('myService2');

        instance.dep1.should.be.instanceof(MyClass1);
        instance.dep1.name.should.equal('MyClass1');

        instance.dep2.should.equal(myConfig);
    });

    it('should allow to register class factory: container.register("myServiceFactory", function MyClassFactory(){ return function MyClass(){} })', function () {

        var MyClass = function () {

        };

        function MyClassFactory() {
            return  MyClass
        }


        container.register('myServiceFactory', MyClassFactory);

        var instance = container.get('myServiceFactory');

        instance.should.equal(MyClass);

    });


    it('should allow to register object factory: container.register("myObjectFactory", function myObjectFactory(){ return { "key1": "value1" } })', function () {
        var MyClass = function () {

        };

        function MyObjectFactory() {
            return new MyClass()
        }


        container.register('myObjectFactory', MyObjectFactory);

        var instance = container.get('myObjectFactory');

        instance.should.be.instanceof(MyClass);
    });

    it('should allow to set value hard: container.set("myDependency", {my: "custom object"})', function () {
        var object = {my: "custom object"};
        container.set('myDependency', object);

        container.get('myDependency').should.equal(object);
    });

    it('should allow to remove definition hard: container.remove("myService") // container.get("myService") -> null', function () {

        var MyClass = function () {

        }

        container.register('myService', MyClass);

        var instance = container.get('myService');
        instance.should.be.instanceof(MyClass)


        container.remove('myService');

        var instance = container.get('myService');
        (instance === null).should.be.true;

    });

    it('should allow to create unique instance : container.create("myService") // always new instance', function () {

        var MyClass = function () {

        }

        container.register('myService', MyClass);

        var instance = container.create('myService');
        var instance2 = container.create('myService');

        instance.should.be.instanceof(MyClass);
        instance2.should.be.instanceof(MyClass);

        instance.should.not.equal(instance2);

    });

    it('should allow to get container in dependencies', function () {
        var container2 = container.get('container');
        container2.should.equal(container);
    })

    it('should return null if service not registered', function () {
        var instance = container.get('myService');
        (instance === null).should.be.true;

        var instance = container.create('myService');
        (instance === null).should.be.true;
    })

    it('should not create instance if service is not a function and return null', function () {
        container.register('myService', 'not a function');

        var instance = container.create('myService');
        (instance === null).should.be.true;
    })

});
