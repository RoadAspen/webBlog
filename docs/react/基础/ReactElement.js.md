# ReactElement.js

ReactElement.js 文件一共暴露了几个方法：

```js
import {
  createElement as createElementProd,
  createFactory as createFactoryProd,
  cloneElement as cloneElementProd,
  isValidElement,
} from "./ReactElement";
```

## createElement

```js
export function createElement(type, config, children) {
  let propName;

  // Reserved names are extracted
  const props = {};

  let key = null;
  let ref = null;
  let self = null;
  let source = null;

  if (config != null) {
    if (hasValidRef(config)) {
      ref = config.ref;

      if (__DEV__) {
        warnIfStringRefCannotBeAutoConverted(config);
      }
    }
    if (hasValidKey(config)) {
      if (__DEV__) {
        checkKeyStringCoercion(config.key);
      }
      key = "" + config.key;
    }

    self = config.__self === undefined ? null : config.__self;
    source = config.__source === undefined ? null : config.__source;
    // 这里遍历了config，并且检查了config属性是否合法
    for (propName in config) {
      if (
        hasOwnProperty.call(config, propName) &&
        !RESERVED_PROPS.hasOwnProperty(propName)
      ) {
        props[propName] = config[propName];
      }
    }
  }

  // Children can be more than one argument, and those are transferred onto
  // createElement 可以接受很多参数，N-2 就是子元素 的个数
  const childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    const childArray = Array(childrenLength);
    for (let i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    if (__DEV__) {
      if (Object.freeze) {
        Object.freeze(childArray);
      }
    }
    props.children = childArray;
  }

  // 这里使用了默认的props
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }
  // 最终返回了 ReactElement 方法
  return ReactElement(
    type,
    key,
    ref,
    self,
    source,
    ReactCurrentOwner.current,
    props
  );
}
```

createElement 方法在内部对 type，config 和 children 做了一系列的检测处理，最后返回了一个 ReactElement 方法创建 ReactElement。

## ReactElement

```js
function ReactElement(type, key, ref, self, source, owner, props) {
  const element = {
    // 这个标签允许我们唯一地将其标识为React元素
    $$typeof: REACT_ELEMENT_TYPE,

    // Built-in properties that belong on the element
    type: type,
    key: key,
    ref: ref,
    props: props,

    // Record the component responsible for creating this element.
    _owner: owner,
  };

  return element;
}
```

可以看到，ReactElement 直接返回了一个 element 的对象。

## cloneElement

```js
export function cloneElement(element, config, children) {
  // 和createElement一样的逻辑
  return ReactElement(element.type, key, ref, self, source, owner, props);
}
```

cloneElement 的内部逻辑和 createElement 基本一致，最后也是返回了一个 ReactElement 方法并传入对应的参数。

## createFactory

```js
export function createFactory(type) {
  // 这里绑定了createElement
  const factory = createElement.bind(null, type);
  // Expose the type on the factory and the prototype so that it can be
  // easily accessed on elements. E.g. `<Foo />.type === Foo`.
  // This should not be named `constructor` since this may not be the function
  // that created the element, and it may not even be a constructor.
  // Legacy hook: remove it
  factory.type = type;
  return factory;
}
```

这个方法开发中基本没用过。createFactory 内部还是绑定的 createElement 方法，只是指定了 type 类型不能更改。

## isValidElement

```js
export function isValidElement(object) {
  return (
    typeof object === "object" &&
    object !== null &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
}
```

**isValidElement** 用于判断一个对象是不是合法的 ReactElement。

## 总结

ReactElement 通过 createElement 创建，调用该方法需要传入三个参数：

- type
- config
- children

type 指代这个 ReactElement 的类型

1. 字符串比如 div，p 代表原生 DOM，称为 HostComponent
2. Class 类型是我们继承自 Component 或者 PureComponent 的组件，称为 ClassComponent
3. 方法就是 functional Component
4. 原生提供的 Fragment、AsyncMode 等是 Symbol，会被特殊处理。

从源码可以看出虽然创建的时候都是通过 config 传入的，但是 `key` 和 `ref` 不会跟其他 config 中的变量一起被处理，而是单独作为变量出现在 ReactElement 上。

在最后创建 ReactElement 我们看到了这么一个变量 **\$\$typeof** ，这是个啥呢，在这里可以看出来他是一个常量：REACT_ELEMENT_TYPE。

**ReactElement** 只是一个用来承载信息的容器，他会告诉后续的操作这个节点的以下信息：

- `type` 类型，用于判断如何创建节点。
- `key` 和 `ref` 这些特殊信息
- `props` 新的属性内容
- `$$typeof`用于确定是否属于 ReactElement.

这些信息对于后期构建应用的树结构是非常重要的， **而 React 通过提供这种类型的数据，来脱离平台的限制**
