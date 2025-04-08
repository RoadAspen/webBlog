# React Input 输入框监听 composition 事件时，在 ie 和 firefox 中无法输入文字

> composition 事件, 监听用户输入文字，利用 input 的 composition start 和 end 事件，来确认用户是否输入文字结束，监听 onchange 事件获取用户输入，更新 的值。

正常的业务逻辑应该是 start -> change -> end -> 请求。
但是 在不同的浏览器中 Composition end 事件和 onchange 事件的触发顺序不同。

safari 、chrome 的顺序是 compositionStart -> onChange -> compositionEnd

Safari 还会在选取文字时会再触发一次 onChange 事件，但是 value 为 compositionStart 之前的 value 值。

IE,firefox 的顺序是 compositionStart ->  compositionEnd -> onChange

## 问题原因：

在 IE11 中有两种情况：

1. 当用户使用 qq 输入法时，无法输入汉字。原因为 当用户在 onCompositionEnd 中执行了 setState 事件导致组件更新，则 change 事件无法被触发。

2. 当用户使用 微软自带输入法时，则 change 可以触发，且执行顺序变为和 chrome 一致。

在 Firefox 中：

在 onCompositionEnd 中 setState 更新时，使用 Mac book 自带输入法也无法触发 onchange 事件。

为了支持非文字输入(如 a,b, c,123)，不会触发 composition 事件，所以在 onChange 中必须 do search， do search 可以是   debounce 函数，也可以不是。

## 解决方法：

1. 当事件的执行顺序为 compositionStart ->compositionEnd ->onChange  时。

在 onCompositionEnd ， composition status 使用 ref 的方式更新，ref 更改不会触发组件更新，onChange 事件可以执行，可以获取到 composition status 最新的值。

在 onChange 事件中 更新 input 的 value 值，然后直接根据 composition status 判断是否 do search。

2. 当事件的执行顺序为 compositionStart —> onChange ->compositionEnd  时。

在 onChange 中时无法获取到正确的 composition  status，所以不会 执行 do search。

在   compositionEnd 中可以拿到 e.target.value 为最新的值，所以在 compositionEnd 中可以在 ref.current 更改之后，执行 doSearch。 由于时间间隔很短，会将 onChange 中的 do search  取消。
