# JSON.stringify

> JSON.stringify 是将 javascript 对象转换为 json 字符串，但是对 js 对象的属性 value 有要求，不同的 value 类型可能存在不同的转换结果。 **不能重复引用**

## 基础类型转换

###### **Number**

正常数字都可以转换为字符串， NaN 和 Infinity 会被转换为 null，在 数组中同样转换为 null。

```js
JSON.stringify({a:1,b:Infinity,c:NaN,arr:[NaN,1,Infinity,-Infinity]})

// 输出
"{"a":1,"b":null,"c":null,"arr":[null,1,null,null]}"
```

###### **Boolean**

true 和 false 都可以正常转换为字符串的 true 和 false

```js
JSON.stringify({a:true?true:false,b:false,arr:[1,true,false]})

// 输出
"{"a":true,"b":false,"arr":[1,true,false]}"
```

###### **String**

字符串没有问题

```js
JSON.stringify({a:"asdsd",b:"",arr:["","ass"]})

// 输出
"{"a":"asdsd","b":"","arr":["","ass"]}"
```

###### **undefined**

在 **对象中作为 value，转化为字符串时则会直接把 key,value 一起忽略**，在 **数组中则会转化为 null**

```js
    JSON.stringify({a:"asdsd",b:null,c:undefined,arr:["","ass",null,undefined]})

    // 输出， undefined 直接忽略 ， null 保存
    "{"a":"asdsd","b":null,"arr":["","ass",null,null]}"
```

###### **null**

基本不存在问题,null 还是 null

```js
    JSON.stringify({a:"asdsd",c:null,arr:["","ass",null]})

    // 输出， undefined 直接忽略,数组中会装华为null
    "{"a":"asdsd","c":null,"arr":["","ass",null,null]}"
```

###### **Symbol**

由 Symbol('str') 生成的 symbol 的值， 在 **数组中时，转换为字符串变为 null**， 在**对象中作为 key 或者 value 时，这条属性都会被忽略** 与 null 和 undefined 类似。

```js
    var sym = Symbol('sym');

    JSON.stringify({a:"asdsd",arr:["","ass",sym]})

    // error

    JSON.stringify({a:"asdsd",[sym]:1,c:sym,arr:["","ass"]})

    // 输出
    "{a:"asdsd",arr:["","ass"]"
```

###### **正则**

正则表达式会被转换为 {} 空对象

```js
JSON.stringify({a:/^asd$/,arr:["","ass",/^asd$/]})
// 输出
"{"a":{},"arr":["","ass",{}]}"
```

## 函数

###### **function**

任何的函数作为对象的 key 或者 value 调用 JSON.strifity() 时，都会忽略这条属性， 在 **数组中则会转化为 null** 与 null 和 undefined 类似。

```js

    JSON.stringify({a:"asdsd",b:function a(){console.log(1)},arr:["","ass",function a(){console.log(1)}]})


    // 输出, b 属性不存在
    "{a:"asdsd",arr:["","ass",null]"
```

## 引用类型转换

###### **Object**

> 转换之后是 json 字符串，但是内部的属性转变符合上方各类型的转换规则。

```js
    JSON.stringify({a:"asdsd",b:{a:undefined,c:null,d:NaN,e:[1,2,3]}})

    // 输出
    "{"a":"asdsd","b":{"c":null,"d":null,"e":[1,2,3]}}"
```

###### **Array**

> 转换之后是 json 字符串，但是内部的属性转变符合上方各类型的转换规则。

```js
    JSON.stringify({a:"asdsd",b:[undefined,null,NaN,false]})

    // 输出
    "{"a":"asdsd","b":[null,null,null,false]}"
```

所以使用 JSON.Parse(JSON.stringify(obj)) 不适合用来复制对象。
