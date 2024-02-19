# TS 类型体操

在我们日常使用 typescript 的过程中，经常会用到 Omit、Partial、ReturnType 、Pick 、Readonly 这些内置的方法，帮助我们做一些类型转换，非常方便，我们可以使用 ts 基础的写法去实现这些内置的方法，帮助我们去更好的掌握 TS 的用法。

## Partial

将所有属性转为可选

```ts
// 我们有一个 Dog 的接口，它有一些属性和方法
interface Dog {
  name: string;
  run: () => void;
  eat: () => void;
  drink;()=>void;
  warn: () => void;
}

// 我们也可以这样写
type MachineDog = Partial<Dog>

const dog:MachineDog = {};

// 实现一个 MyPartial

type MyPartial<T extends object> = {
 [P in keyof T]?:T[P]
}
```

## Omit

从非联合类型中排除不需要的属性

```ts
// 我们有一个 Dog 的接口，它有一些属性和方法
interface Dog {
  name: string;
  run: () => void;
  eat: () => void;
  drink;()=>void;
  warn: () => void;
}
// 现在有一个 机器 Dog，它有 Dog的name、run、warn，但是不需要喝水和吃东西
type MachineDog  = {
    name: string;
    run: () => void;
    warn: () => void;
}
// 我们也可以这样写
type MachineDog = Omit<Dog,'eat'|'drink'>

// 实现一个 Omit

type MyOmit<T extends object, K extends keyof any> = {
 [P in keyof T as P extends K ? never : P]:T[P]
}
```

## Pick

从非联合类型中取出需要的属性,与**Omit**

```ts
// 我们有一个 Dog 的接口，它有一些属性和方法
interface Dog {
  name: string;
  run: () => void;
  eat: () => void;
  drink;()=>void;
  warn: () => void;
}
// 现在有一个 机器 Dog，它有 Dog的name、run、warn，但是不需要喝水和吃东西
type MachineDog  = {
    name: string;
    run: () => void;
    warn: () => void;
}
// 我们也可以这样写
type MachineDog = Pick<Dog,'name'|'run'|'warn'>

// 实现一个 Pick

type MyPick<T extends object, K extends keyof any> = {
 [P in keyof T as P extends K ? P : never]:T[P]
}
```

## Exclude

从联合类型（union type） 中**排除**掉不需要的类型

```TS

```

## Extract

从联合类型（union type） 中**取出**需要的类型

```TS

```
