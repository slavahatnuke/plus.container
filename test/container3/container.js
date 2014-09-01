module.exports = function (container) {

    var Class1 = function(){ return {CLASS: 1} }
    Class1.$tags = ['tag1'];

    var Class2 = function(){ return {CLASS: 2} }
    Class2.$tags = ['tag1', 'tag2'];

    container.register('class1', Class1);
    container.register('class2', Class2);
}