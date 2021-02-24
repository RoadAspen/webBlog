# Promise

在 Promise 之前，js 异步编程完全依赖于回调函数。Promise 是 ES6 中提出的新的一种 javascript 异步编程的解决方案。

## Promise/A+ 规范

`Promise`（承诺）表示了异步操作的最终结果，有三种状。`pending`（等待态）可转变为`fulfilled`（执行态）或`rejected`（拒绝态），这个转变过程不可逆，且只能转变为其中一个，将转变结果传入到 then 方法中。

1. `pending` 等待态，执行一个异步函数，在一段时间以后返回结果，未来可转化为 `fulfilled`或者`rejected`
2. `fulfilled` 执行态，返回一个不可变的`value`（执行成功的值），状态从 `pending`转变成 `fulfilled`, 通过 resolve 函数。
3. `rejected` 已拒绝，拒绝执行，需要返回一个不可变`reason`（拒绝原因）， 状态从 `pending`转变成 `rejected`， 通过 reject 函数。
4. `then` 方法。

## Promise 使用

```js
const request = require("request");
// 请求成功时resolve这个Promise
const request1 = function() {
	return new Promise((resolve, reject) => {
		request("https://www.baidu.com", function(error, response) {
			if (!error && response.statusCode == 200) {
				resolve("request1 success");
			} else {
				reject("状态码出问题了");
			}
		});
	});
};

// 先发起request1,
request1().then(
	(res) => {
		console.log(res);
	},
	(error) => {
		console.log(error);
	}
);
```

## then 方法

一个`Promise` 必须有一个`then`方法用来访问它的值或者拒绝原因。`then`方法接收两个参数，`onFulfilled`，`onRejected`

```js
new Promise().then(onFulfilled, onRejected);
```

### onFulfilled

如果`onFulfilled`不是函数，就必须被忽略，如果`onFulfilled`是函数。

-   当`Promise`在执行结束后必须被调用，第一个参数为`promise`的最终值`value`。
-   在`Promise`没有执行结束前不可被调用。
-   调用次数不可超过一次。即返回成功之后调用一次获取返回值。

### onRejected

如果`onRejected`不是函数，就必须被忽略，如果是函数。

-   当`Promise`被拒绝后必须被调用，第一个参数为`promise`的拒绝原因`reason`。
-   在`Promise`没有执行结束前不可被调用。
-   调用次数不可超过一次。即拒绝之后调用一次获取拒绝原因。

### 多次单独调用

同一个 Promise 完成状态转变之后，不再发生任何变化，可以多次调用 then 方法，相当于注册多个该状态下的执行函数

1. 当 `promise` 成功执行时，所有 `onFulfilled` 需按照其注册顺序依次回调.
2. 当 `promise` 被拒绝执行时，所有的 `onRejected` 需按照其注册顺序依次回调.

### 链式调用

`then` 必须返回一个新的`promise`对象.

-   如果 then 中没有执行 onFulfilled 则需要在返回的 promise 中执行
-   如果 then 中没有执行 onRejected 则需要在返回的 promise 中执行

## Promise 实现

### 创建 Promise 构造函数

构造函数 Promise 必须接受一个函数作为参数，这个函数又需要 resolve，reject 作为参数，这两个参数也为函数类型。

```js
    // 定义一个判定参数是否为函数的方法
const isFunction = func => typeof func === "function";

// 实现一个 构造函数，这个构造函数的初始状态为 pending, 值为value，拒绝原因为 reason。
const PENDING = "pending";// 等待
const FULFILLED = "fulfilled";//完成
const REJECTED = "rejected";// 拒绝

class Mypromise {
    constructor(callback) {
        // callback 必须是一个函数
        if (!isFunction(callback)) {
            throw new Error(`${callback} is not a function`)
        }
        // Promise实例当前状态
        this._status = PENDING;
        // Promise实例 值
        this._value = null;

        // 添加fulfilled状态函数队列
        this.fulfilledQueues = [];
        // 添加rejected状态函数队列
        this.rejectedQueues = [];
        // 执行回调函数
        try {
            // 将
            callback(this.resolve.bind(this), this.reject.bind(this))
        } catch (error) {
            this.reject(error)
        }
    }
    // resolve 将 value返回，并将status从pending转变为fulfilled
    resolve(value) {
        // 只有当前状态是 Pending时执行， 状态的转变只能从pending转变为其他状态且不可逆
        if (this._status === PENDING) {
            this._status = FULFILLED;
            this._value = value;
            // 如果 resolve 执行时已经在then中注册了 fulfilled 函数
            if(this.fulfilledQueues.length > 0){// 如果已经注册回调函数
                for (const func of this.fulfilledQueues) {
                    func(this._value)
                }
            }
        }
    }

    // reject 将 reason 返回，并将status从pending转变为rejected
    reject(reason) {
        if (this._status === PENDING) {
            this._status = REJECTED
            this._value = reason
            if(this.rejectedQueues.length > 0){
                for (const func of this.rejectedQueues) {
                    func(this._value)
                }
            }
        }
    }

    // then 方法，当fulfilled 和 rejacted 不为function时，必须被忽略
    then(onfulfilled, onrejected) {
        const { _value, _status } = this;
        let res = "";
        let err = "";

        // 根据传参数是否是函数来计划接下来的操作，如果不是函数，则需要忽略,首先必须返回一个新的Mypromise。
        return new Mypromise((onfulfilledNext, onrejectedNext) => {
            const fulfilled = (value) => {
                if (!isFunction(onfulfilled)) { // 如果不是函数，则忽略，在下一次调用then时，作为参数传入进去
                    onfulfilledNext(value); // 下次 fulfilled
                } else {
                    res = onfulfilled(value); //如果是函数，则获取被刺返回值作为下一次调用then的参数
                    if (res instanceof Mypromise) {// 如果值是一个新的Mypromise，则需要确保新的Mypromise状态变化之后执行。
                        res.then(onfulfilledNext, onrejectedNext)
                    } else {
                        onfulfilledNext(res); //如果不是promise，则直接作为value传入下一次的resolve
                    }
                }
            };

            const rejected = (error => {
                if (!isFunction(onrejected)) { // 如果不是函数，则忽略，在下一次调用then时，作为参数传入进去
                    onrejectedNext(error); // 下次 rejected
                } else {
                    error = onrejected(error); //如果是函数，则获取被刺返回值作为下一次调用then的参数
                    if (error instanceof Mypromise) {// 如果值是一个新的Mypromise，则需要确保新的Mypromise状态变化之后执行。
                        error.then(onrejectedNext, onrejectedNext)
                    } else {
                        onrejectedNext(error); //如果不是promise，则直接作为value传入下一次的reject，下一个then的状态与返回的promise的状态相同
                    }
                }
            };

            switch (_status) {
                case FULFILLED:
                    fulfilled(_value);
                    break;
                case REJECTED:
                    rejected(_value);
                    break;
                case PENDING:
                    this.fulfilledQueues.push(fulfilled)
                    this.rejectedQueues.push(rejected);
                    break;
                default:
                    break;
            }
        })
    }
}
```

## 实现其他方法

### Promise.resolve

resolve 方法

```js
Mypromise.resolve = function(value) {
	return new Mypromise((resolve) => {
		resolve(value);
	});
};
```

### Promise.reject

reject 方法

```js
Mypromise.reject = function(reason) {
	return new Mypromise((resolve，reject) => {
		reject(reason);
	});
};
```

### Promise.race

race 方法,当传入的 promise 中一个 resolve 或者 reject ，该 promise 直接返回

```js
Mypromise.race = function(promises) {
	return new Mypromise((resolve，reject) => {
		for(let i =0;i<promises.length;i++){
            // 将父级的 resolve，reject传入，当传入的promise状态变化时，直接改变父级的状态
            promises[i].then(resolve,reject)
        }
	});
};
```

### Promise.all

all 方法,当所有的 promise 都 resolve 之后，返回一个由所有 resolve 结果按照顺序组成的数组。当其中一个 reject 时，即刻报错。 思路为改变 resolve 函数

```js
Mypromise.all = function(promises) {
    let arr = [];
    let index = 0;
	return new Mypromise((resolve，reject) => {
		for(let i =0;i<promises.length;i++){
            promises[i].then((value)=>{
                arr[i] = value
                index ++
                if(index === promises.length){
                    resolve(arr)
                }
            },reject)
        }
	});
};
```

### Promise.allSettled

allSettled 方法返回一个在所有给定的 promise 都已经 fulfilled 或 rejected 后的 promise，并带有一个对象数组，每个对象表示对应的 promise 结果。

```js
Mypromise.allSettled = function(promises) {
    let arr = [];
    let len = promises.length;
	return new Mypromise((resolve，reject) => {
		for(let i =0;i<len;i++){
            promises[i].then((value)=>{
                arr[i] = value
            },(error)=>{
                arr[i] = {
                    status:'rejected',
                    reason:error
                }
            }).finally(()=>{
                --len
                if(!len){
                    resolve(arr)
                }
            })
        }
	}));
};
```
