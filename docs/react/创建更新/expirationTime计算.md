# expirationTime 计算

expirationTime 时间的计算和 React 没有任何关联,首先让我们抛开 React 相关东西,单纯的来看 这个计算,在 **/react-reconciler/src/ReactFiberExpirationTime.js** 中我们可以看到相关的 expirationTime 计算 公式,代码如下

```js
// MAX_SIGNED_31_BIT_INT 默认定义为 Math.pow(2, 30) - 1  1073741823
export const Sync = MAX_SIGNED_31_BIT_INT;
export const Batched = Sync - 1; // 1073741822

// 1 个过期时间单位代表 10ms。
const UNIT_SIZE = 10;

// 魔法数字偏移
const MAGIC_NUMBER_OFFSET = Batched - 1; // 1073741821

// 1 unit of expiration time represents 10ms.
// ms 转化为过期时间
export function msToExpirationTime(ms: number): ExpirationTime {
  // Always add an offset so that we don't clash with the magic number for NoWork.
  // 始终添加偏移量，这样我们就不会与 NoWork 的幻数发生冲突。
  return MAGIC_NUMBER_OFFSET - ((ms / UNIT_SIZE) | 0);
}

// 过期时间转化为 ms
export function expirationTimeToMs(expirationTime: ExpirationTime): number {
  return (MAGIC_NUMBER_OFFSET - expirationTime) * UNIT_SIZE;
}
// 计算精度， 使用了 位运算， 时间间隔在 precision 内会被视为同一批。
function ceiling(num: number, precision: number): number {
  return (((num / precision) | 0) + 1) * precision;
}
// 计算过期时间
function computeExpirationBucket(
  currentTime,
  expirationInMs,
  bucketSizeMs
): ExpirationTime {
  return (
    MAGIC_NUMBER_OFFSET -
    ceiling(
      MAGIC_NUMBER_OFFSET - currentTime + expirationInMs / UNIT_SIZE,
      bucketSizeMs / UNIT_SIZE
    )
  );
}
// 低优先级到期时间 5000 ms
export const LOW_PRIORITY_EXPIRATION = 5000;
// 低优先级 批量最大数量 250
export const LOW_PRIORITY_BATCH_SIZE = 250;

// 计算异步过期时间
export function computeAsyncExpiration(
  currentTime: ExpirationTime
): ExpirationTime {
  return computeExpirationBucket(
    currentTime,
    LOW_PRIORITY_EXPIRATION,
    LOW_PRIORITY_BATCH_SIZE
  );
}

// 计算等待的过期时间
export function computeSuspenseExpiration(
  currentTime: ExpirationTime,
  timeoutMs: number
): ExpirationTime {
  // 如果timeoutMs低于正常的pri过期时间，我们是否应该发出警告?
  return computeExpirationBucket(
    currentTime,
    timeoutMs,
    LOW_PRIORITY_BATCH_SIZE
  );
}

// 高优先级过期时间
export const HIGH_PRIORITY_EXPIRATION = __DEV__ ? 500 : 150;
// 高优先级的批量处理数量
export const HIGH_PRIORITY_BATCH_SIZE = 100;

// 计算用户交互过期时间
export function computeInteractiveExpiration(currentTime: ExpirationTime) {
  return computeExpirationBucket(
    currentTime,
    HIGH_PRIORITY_EXPIRATION,
    HIGH_PRIORITY_BATCH_SIZE
  );
}

// 根据过期时间 反推优先级
export function inferPriorityFromExpirationTime(
  currentTime: ExpirationTime,
  expirationTime: ExpirationTime
): ReactPriorityLevel {
  if (expirationTime === Sync) {
    return ImmediatePriority;
  }
  if (expirationTime === Never || expirationTime === Idle) {
    return IdlePriority;
  }
  const msUntil =
    expirationTimeToMs(expirationTime) - expirationTimeToMs(currentTime);
  if (msUntil <= 0) {
    return ImmediatePriority;
  }
  if (msUntil <= HIGH_PRIORITY_EXPIRATION + HIGH_PRIORITY_BATCH_SIZE) {
    return UserBlockingPriority;
  }
  if (msUntil <= LOW_PRIORITY_EXPIRATION + LOW_PRIORITY_BATCH_SIZE) {
    return NormalPriority;
  }

  // TODO: Handle LowPriority

  // Assume anything lower has idle priority
  return IdlePriority;
}
```

React 有两种类型的 **ExpirationTime**, 一个是**Interactive**,另一种是**普通的异步**。Interactive 的比如说是由事件触发的，那么他的响应优先级会比较高因为涉及到快速反馈用户.

拿 **computeAsyncExpiration** 和 **computeInteractiveExpiration** 方法来说,他们分别调用 **computeExpirationBucket** 传入以下:

- currentTime 调用 msToExpirationTime 得到的 ExpirationTime
- expirationInMs 不同优先级任务会传不同的偏移量，把不同优先级的时间拉开差距
- bucketSizeMs 越大，批处理的间隔就越大

```js
// computeAsyncExpiration 公式
computeExpirationBucket(
  currentTime,
  5000,
  250
)(
  // computeExpirationBucket 方法
  1073741821 - ceiling(1073741821 - currentTime + 5000 / 10, 250 / 10)
);
// 代入 ceiling
1073741821 - ((((1073741821 - currentTime + 500) / 25) | 0) + 1) * 25;

// 我们设定currentTime的值为 997到1025得出结果为
// 从997到1021的结果都是496
// 从1022到1025的结果都是521
// 可以得出再间隔25ms内即(1021 - 997 + 1)结果是一致的。
// 也即异步更新的过期时间间隔是25ms
// 边界过期时间也是 25ms
// 高优先级的过期时间是 10ms
```

其他的如 **computeSuspenseExpiration**、**computeInteractiveExpiration** 是同样的道理。

**React 为什么这么设计呢？**

这么做也许是为了让非常相近的两次更新得到相同的 **expirationTime**，然后在一次更新中完成，相当于一个自动的 **batchedUpdates。**

我们知道 setState 可能会批量更新，就是这个原因。内部会把异步更新间隔在 25ms 内的更新合并成一个，可以很大的提高性能。
