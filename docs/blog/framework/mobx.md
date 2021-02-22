# Mobx

> `MobX` 为现有的数据结构(如对象，数组和类实例)添加了可观察的功能。MobX 会对在执行跟踪函数期间读取的任何现有的可观察属性做出反应。

## Observable state(可观察的状态)

> 通过使用 `@observable` 装饰器(ES.Next)来给你的类属性添加注解就可以简单地完成这一切，将 任何变量变成可观察对象。

```js
import { @observable } from 'mobx'

class Person{

    id = Math.random()

    @observable age = 12;

    @observable finished = false
}
```

## Computed values(计算值)

> 在相关数据变化时自动更新的值。 通过@computed 装饰器或者利用 (extend)Observable 时调用 的 getter / setter 函数来进行使用。延迟更新，当不再使用时，会被垃圾回收。

```js
import { @observable ,@computed} from 'mobx'

class Person{

    id = Math.random()

    @observable age = 12;

    @observable finished = false

    @computed get len(){
        return this.age + 12
    }
}
```

## Reactions(反应)

> `Reactions` 和计算值很像，**但它不是产生一个新的值**，而是会产生一些副作用，比如打印到控制台、网络请求、递增地更新 React 组件树以修补 DOM、等等。 简而言之，reactions 在 响应式编程和命令式编程之间建立沟通的桥梁。

```js
import { @observable ,@computed,@action} from 'mobx'

class Person{

    id = Math.random()

    @observable age = 12;
    // 当finished 变化时，会自动更新组件
    @observable finished = false

    // 计算函数，当this.age 改变时，会自动计算新的len
    @computed get len(){
        return this.age + 12
    }

    // 执行副作用，类似于 redux-sage
    @reactions click(new_age){
        setTimeout(()=>{
            this.age = this.age + new_age
        },1000)
    }

    // 任何应用都有动作。动作时任何用来修改状态的东西
    @action getAge(){
        console.log('修改了')
    }
}
```

## Actions(动作)

> 并不需要触发事件、调用分派程序或者类似的工作。归根究底 React 组件只是状态的华丽展示，而状态的衍生由 MobX 来管理。只需要修改可观察数据就可以了。

```js
import { @observable ,@computed,@reactions} from 'mobx'

class Person{

    id = Math.random()

    @observable age = 12;
    // 当finished 变化时，会自动更新组件
    @observable finished = false

    // 计算函数，当this.age 改变时，会自动计算新的len
    @computed get len(){
        return this.age + 12
    }

    // 执行副作用，类似于 redux-sage
    @reactions click(new_age){
        setTimeout(()=>{
            // 这个操作就是 actions
            this.age = this.age + new_age
        },1000)
    }
}
```

# Mobx-react

> react 通过 mobx-react 与 mobx 结合在一起，mobx 的值全部通过 inject 的方式注入到组件中。
