# new 做了什么？

> 正常使用 

```javascript
    function People(name){
        this.name = name;
    }
    People.prototype.sayHello = function(){
        console.log(`${this.name} ,你好！`)
    }
    const people1 = new People("RoadAspen");
```
在这里使用了 new将People这个构造函数创建了一个对象。

> new 操作符实际上执行了以下步骤

```javascript
    //先创建一个对象
    var obj = {};
    // 将obj的原型对象指向 People的prototype，可以访问People的原型sayHello方法
    // 这样obj就可以访问到 People的原型方法
    obj.__proto__ = People.prototype;
    // 执行people的构造函数，并将this指向obj
    var res = People.call(obj,"RoadAspen");
    // 返回 res
    return typeof res === "object" ? res: obj;
```