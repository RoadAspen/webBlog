# interface vs type

> 前言： `interface` 倾向于描述 **数据结构** ， `type` 用于描述**类型关系**

## 相同点

### 都可以描述一个对象或者函数

**interface**

```ts
interface User {
  name: sting;
  age: number;
}

interface SerUser {
  (name: string, age: number): void;
}
```

**type**

```ts
type User = {
  name: string;
  age: number;
};

type SetUser = (name: string, age: number) => void;
```

### 都允许扩展

interface 和 type 都可以扩展，并且两者并不是互相独立的， interface 可以 extends type，type 也可以 extends interface。语法不同，但是效果类似， interface 用 extends 扩展， type 用 & 扩展。

**interface extends interface**

```ts
interface Name {
  name: string;
}

interface User extends Name {
  age: number;
}
```

**type extends type**

```ts
type Name = {
  name: string;
};

type User = Name & { age: number };
```

**interface extends type**

```ts
type Name = {
  name: string;
};

interface User extends Name {
  age: number;
}
```

**type extends interface**

```ts
interface Name {
  name: string;
}

type User = Name & {
  age: number;
};
```

## 不同点

### type 可以而 interface 不行

1. type 可以生命基本类型别名、联合类型、元组等。

```ts
// 基本类型
type Name = string;

// 联合类型
type Age = number;
// 属性 是 Name 或者 Age
type Property = Name | Age;

// 元祖, 一种每个位置固定类型及总长度的数组。
type PropList = [Name, Age];
```

2. type 语句中可以使用 typeof 获取实例的类型进行赋值。

```ts
let div = document.getElementById("x");

// 获取已有元素的类型。
type A = typeof div;
```

3. type 还可以支持多种操作

```ts
// 联合类型别名
type StringOrNumber = string | number;
type Text = string | { name: string };
type Callback<T> = (data: T) => void;
// 支持泛型
type Pair<T> = [T, T];
type Coordinates = Partial<number>;
```

### interface 可以而 type 不行

interface 可以声明合并

```ts
interface User {
  name: string;
}

interface User {
  age: number;
}

// 重复声明，会自动合并

const user: User = {
  name: "David",
  age: 30,
};
```

## 总结

在 ts 中，一般来说，不清楚使用哪个，如果能用 interface，就用 interface，否则就用 type。
