# Java 程序基本结构

## 基本函数组成

一个完整的 Java 程序，它的基本结构如下：

```java
/**
 * 这里是可以自动创建文档的注释
*/
public class Hello { // 类名是 Hello
    // 主程序
    public static void main(String[] args){
        // 输出 - 单行注释
        System.out.printLn('Hello World!');
        /*
         * 多行注释
         * 内容
         * 内容
         * 结束
        */
    }
} // class 定义结束
```

因为 Java 是面向对象的语言，一个程序的基本单位就是`class`,`class` 是关键字，这里定义的`class`名字是 `Hello`.

**类名要求：**

- 类名必须以英文字母开头，后接字母、数字、下划线的组合。
- 习惯以大写开头

**好的命名**： `Hello`、`GetHeader`、`Book`、`NoteBook`、`VRPlayer`、`Student`、`Car`

**访问修饰符**  
public 是访问修饰符，表示该`class`是公开的  
不写`public`,也能正常编译，但是这个类无法从命令行执行.

## 总结

- java 程序就是以 class 为基本组成单位
- 有三种注释写法 文档、多行、单行
- 访问修饰符 public private
- 命名方法 采用大驼峰命名法

## Java 程序层级组成
