# Promise/A+ 规范
> `Promise`表示了异步操作的最终结果，有三种状态，`pending`可转变为`fulfilled`或`rejected`，这个转变过程不可逆，且只能转变为其中一个。
1. `pending` 等待中，未来可转化为 `fulfilled`或者`rejected`
2. `fulfilled` 已履行 需要返回一个不可变`value`，状态从 `pending`转变成 `fulfilled`
3. `rejected` 已拒绝，需要返回一个不可变`reason`， 状态从 `pending`转变成 `rejected`

#### Promise例子
```js
    const request = require("request");

    // 我们先用Promise包装下三个网络请求
    // 请求成功时resolve这个Promise
    const request1 = function() {
      const promise = new Promise((resolve) => {
        request('https://www.baidu.com', function (error, response) {
          if (!error && response.statusCode == 200) {
            resolve('request1 success');
          }
        });
      });
    
      return promise;
    }
    
    const request2 = function() {
      const promise = new Promise((resolve) => {
        request('https://www.baidu.com', function (error, response) {
          if (!error && response.statusCode == 200) {
            resolve('request2 success');
          }
        });
      });
    
      return promise;
    }
    
    const request3 = function() {
      const promise = new Promise((resolve) => {
        request('https://www.baidu.com', function (error, response) {
          if (!error && response.statusCode == 200) {
            resolve('request3 success');
          }
        });
      });
    
      return promise;
    }
    
    
    // 先发起request1，等他resolve后再发起request2，
    // 然后是request3
    request1().then((data) => {
      console.log(data);
      return request2();
    })
    .then((data) => {
      console.log(data);
      return request3();
    })
    .then((data) => {
      console.log(data);
    })

```

```
graph LR
A[pending]-->|"resolve(value)"| B(fulfilled)
A-->|"reject(reason)"| C(rejected)
```

### then方法
> 一个`Promise` 必须有一个`then`方法用来访问它的值或者拒绝原因。`then`方法有两个参数，`onFulfilled`，`onRejected`

```js
    Promise.then(onFulfilled,onRejected)
```

##### `onFulfilled`
> 如果`onFulfilled`不是函数，就必须被忽略，如果`onFulfilled`是函数。
- 当`Promise`在执行结束后必须被调用，第一个参数为`promise`的最终值`value`。
- 在`Promise`没有执行结束前不可被调用。
- 调用次数不可超过一次。即返回成功之后调用一次获取返回值。

##### `onRejected`
> 如果`onRejected`不是函数，就必须被忽略，如果是函数。   
- 当`Promise`被拒绝后必须被调用，第一个参数为`promise`的拒绝原因`reason`。
- 在`Promise`没有执行结束前不可被调用。
- 调用次数不可超过一次。即拒绝之后调用一次获取拒绝原因。

##### 多次调用
> `then` 方法可以被同一个 `promise` 调用多次.

1. 当 `promise` 成功执行时，所有 `onFulfilled` 需按照其注册顺序依次回调.  
2. 当 `promise` 被拒绝执行时，所有的 `onRejected` 需按照其注册顺序依次回调.

##### 返回
> `then` 必须返回一个`promise`对象.  
- 如果then中没有执行onFulfilled 则需要在返回的promise中执行
- 如果then中没有执行onRejected 则需要在返回的promise中执行

## Promise实现

> 基本的prmise使用

```js
    new Promise((resolve,reject){
        setTimeout(()=>{
            resolve("Fulfilled")
        },5000)
    })
```
>构造函数Promise必须接受一个函数作为参数，这个函数又需要resolve，reject作为参数，这两个参数也为函数类型。

```js
    // 定义一个判定参数是否为函数的方法
const isFunction = func => typeof func === "function";
interface Windows extends Window {
    Npromise?: any
}
// 实现一个 构造函数，这个构造函数的初始状态为 pending, 值为value，拒绝原因为 reason。
const PENDING = "pending";// 等待
const FULFILLED = "fulfilled";//完成
const REJECTED = "rejected";// 拒绝

class Npromise {
    _status: string;
    _value: any;
    fulfilledQueues: any[];
    rejectedQueues: any[];
    constructor(callback: (resolve: any, reject: any) => void) {
        if (!isFunction(callback)) {
            throw new Error(`${callback} is not a function`)
        }
        // 状态
        this._status = PENDING;
        // 值
        this._value = null;

        // 添加成功函数队列
        this.fulfilledQueues = [];
        // 添加拒绝函数队列
        this.rejectedQueues = [];
        // 执行回调函数
        try {
            callback(this.resolve.bind(this), this.reject.bind(this))
        } catch (error) {
            this.reject(error)
        }
    }
    // resolve 将 value返回，并将status从pending转变为fulfilled
    resolve(value: any) {
        if (this._status === PENDING) {
            this._status = FULFILLED;
            this._value = value;
            if(this.fulfilledQueues.length>0){// 如果已经注册回调函数
                for (const func of this.fulfilledQueues) {
                    func(this._value)
                }
            }
        }
    }

    // reject 将 reason 返回，并将status从pending转变为rejected
    reject(reason: any) {
        if (this._status === PENDING) {
            this._status = REJECTED
            this._value = reason
            if(this.rejectedQueues.length>0){
                for (const func of this.rejectedQueues) {
                    func(this._value)
                }
            }
        }
    }

    // then 方法，当fulfilled 和 rejacted 不为function时，必须被忽略
    then(onfulfilled: any, onrejected: any) {
        const { _value, _status } = this;
        let res: any = "";
        let err: any = "";

        // 根据传参数是否是函数来计划接下来的操作，如果不是函数，则需要忽略,首先必须返回一个新的Npromise。
        return new Npromise((onfulfilledNext: any, onrejectedNext: any) => {
            const fulfilled = (value: any) => {
                if (!isFunction(onfulfilled)) { // 如果不是函数，则忽略，在下一次调用then时，作为参数传入进去
                    onfulfilledNext(value); // 下次 fulfilled
                } else {
                    res = onfulfilled(value); //如果是函数，则获取被刺返回值作为下一次调用then的参数
                    if (res instanceof Npromise) {// 如果值是一个新的Npromise，则需要确保新的Npromise状态变化之后执行。
                        res.then(onfulfilledNext, onrejectedNext)
                    } else {
                        onfulfilledNext(res); //如果不是promise，则直接作为value传入下一次的resolve
                    }
                }
            };

            const rejected = (error: any) => {
                if (!isFunction(onrejected)) { // 如果不是函数，则忽略，在下一次调用then时，作为参数传入进去
                    onrejectedNext(error); // 下次 rejected
                } else {
                    error = onrejected(error); //如果是函数，则获取被刺返回值作为下一次调用then的参数
                    if (error instanceof Npromise) {// 如果值是一个新的Npromise，则需要确保新的Npromise状态变化之后执行。
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
(window as Windows).Npromise = Npromise;
export default Npromise
```