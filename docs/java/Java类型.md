在 java 中，变量是程序中最基本的元素，变量分为` 基本类型`和`引用类型`的变量。

## 存储
计算机种内存的最小存储单元是字节（byte），一个字节就是一个 8 位的二进制数，即 8 个 bit。它的二进制表示范围从 `00000000`~`11111111`,十进制就是 `0~256`,换算成十六进制就是` 00~FF``。  
内存单元从 0 开始编号，称为内存地址。每个内存单元可以看做一间房间，内存地址就是门牌号。  
一个字节是 1 B，1024 字节就是 1KB，1024Kb 就是 1MB，1024MB 是 1GB，1024GB 是 1TB。一个拥有 4TB 内存的计算机的字节数量就是 4T = 4x1024GB.

## 基本数据类型
基本数据类型是 CPU 可以直接进行运算的类型。java 中的基本类型有：

+ 整型 `byte`、`short`、`int`，`long`
+ 浮点类型 `float`、`double`
+ 字符类型 `char`
+ 布尔类型 `boolean`

不同的数据类型分配的内存大小不同

+ byte ： 1 个字节，范围 -128~127
+ short： 2 个字节， 范围 -32768~32767
+ int： 4 个字节 ，范围 -2137483648~2147483647
+ long: 8 个字节，范围 -9223372036854775808 ~ 9223372036854775807
+ float: 4 个字节
+ double：8 个字节
+ char ： 2 个字节

### 整数类型
对于整数类型，java 只定义了带符号的整型，因此，最高位的 bit 表示符号位（0 表示正数，1 表示负数）各种整型能表示的最大范围如下：

在 java 中定义一个整型

```java
public class Main{
    public static void main(String[] args){
        int i = 2147483647;
        int i2 = -2147483648;
        int i3 = 2_000_000_000; // 加下划线更容易识别
        int i4 = 0xff0000; // 十六进制表示的16711680
        int i5 = 0b1000000000; // 二进制表示的512

        long n1 = 9000000000000000000L; // long型的结尾需要加L
        long n2 = 900; // 没有加L，此处900为int，但int类型可以赋值给long
        int i6 = 900L; // 错误：不能把long型赋值给int
    }
}
```

特别注意：同一个数的不同进制的表示是完全相同的，例如 15=0xf ＝ 0b1111。

### 浮点类型
浮点类型的数是小数，因为小数用科学技术法表示的时候，小数点是可以浮动的，如 1234.5 可以表示成 12.345 x 10<sup>2</sup>,也可以表示为 1.2345x10<sup>3</sup>,所以称为浮点数。

下面是定义浮点数的例子：

```java
public class Float{
    public static void main(String[] args){
        // 单精度
        float f1 = 3.14f;
        float f2 = 3.14e38f; // 科学计数法表示的 3.14x10^38
        float f3=1.0; // 错误：不带f结尾的是double类型，不能赋值给float
        // 双精度
        double d=1.79e308;
        double d2 = -1.79e308;
        double d3 = 4.9e-324; // 科学计数法表示的4.9x10^-324;
    }
}
```

对于 `float`类型，需要加上 `f` 后缀；  
浮点数可表示的范围非常大，`float`类型可最大表示 `3.4x10<sup>38</sup>`, 而`double`类型可最大表示 `1.79x10<sup>308</sup>`。

### 布尔类型
布尔类型`boolean`只有`true`和`false` 两个值，布尔类型总是关系运算的结果。

```java
bollean b1=true;
boolean b2=false;
boolean isGreater = 5 > 3;// 计算结果为true
int age = 12;
boolean isAdult = age >= 18; // 计算结果为false
```

Java语言对布尔类型的存储并没有做规定，因为理论上存储布尔类型只需要1 个字节，但是通常JVM内部会把 `boolean`表示为 4字节的整数。

### 字符类型
字符类型`char`表示一个字符。java的`char`类型除了可表示标准的ASCII外，还可以表示一个Unicode字符：

```java
// 字符类型
public class Main{
    public static void main(String[] args){
        char a = 'A';
        char zh = '中';
        System.out.printLn(a);
        System.out.printLn(zh)
        
    }
}
```

注意`char`类型使用单引号`'`,且仅有一个字符，要和双引号`"`的字符串类型区分开。

## 引用类型
除了上述基本类型的变量，剩下的都是引用类型。例如：引用类型最常用的就是`String`字符串：

```java
String s="hello";
```

引用类型的变量类似于C语言的指针，它内部存储一个地址，指向某个对象在内存的位置。

## 常量
在Java中定义一个变量的时候，如果加上`final`修饰符，那么这个变量就变成了常量：

```java
final double PI = 3.14; // PI就是一个常量
double r = 5.0;
double area = PI * r * r;
PI = 300; // compile error
```

常量在定义时进行初始化后就不可再次赋值，再次赋值会导致编译报错。

常量的作用是用有意义的变量名来避免魔术数字，例如，不要在代码中到处写`3.14`,而是定义一个常量。如果将来需要提高计算精度，我们只需要在常量的定义处修改，例如，改成`3.1415`，而不必再所有地方替换 `3.14`；

为了和变量区分开，根据约定习惯，常量名通常使用大写。

## var关键字
有些时候，类型的名字太长，写起来比较麻烦。例如：

```java
StringBuilder sb = new StringBuilder();
```

这个时候，如果想省略变量类型，可以使用`var`关键字：

```java
var sb = new StringBuilder();
```

编译器会根据赋值语句自动推断出变量`sb`的类型是`StringBuilder`。对于编译器来说，语句实际会自动变成：

```java
StringBuilder sb = new StringBuilder();
```

因此，使用`var`定义变量，仅仅是少写了变量类型而已。

## 变量的作用范围
在java中，多行语句`{ ... }`括起来。很多控制语句，例如条件判断和循环，都以`{ ... }`作为他们自身的范围，例如：

```java
if(...){// if 开始
    ...
    while(...){ // while开始
        ...
        if(...){// if开始
            ...
            
        }// if结束
        ...
    } // while结束
    ...
} // if结束
```

只要正确地嵌套这些 `{...}`，编译器就能识别出语句块的开始和结束。而在语句块中定义的变量，它有一个作用于，就是从定义处开始，到语句块结束。超出了作用域之外引用这些变量，编译器会报错。

```java
{
    ...
    int i = 0; // 变量i从这里开始定义
    ...
    {
        ...
        int x = 1; // 变量x从这里开始定义
        ...
        {
            ...
            String s = "hello"; // 变量s从这里开始定义
            ...
        } // 变量s作用域到此结束
        ...
        // 注意，这是一个新的变量s，它和上面的变量同名，
        // 但是因为作用域不同，它们是两个不同的变量:
        String s = "hi";
        ...
    } // 变量x和s作用域到此结束
    ...
} // 变量i作用域到此结束
```

<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">定义变量时，要遵循作用域最小化原则，尽量将变量定义在尽可能小的作用域，并且，不要重复使用变量名。</font>

## 小练习
```java
import java.util.Scanner;
import java.text.DecimalFormat;
public class Pring {
    public static void main(String[] args) {
        // 創建一個Scanner對象
        Scanner sc = new Scanner(System.in);
        System.out.print("輸入上次考試成績：");
        int prevCount = sc.nextInt();
        System.out.print("輸入這次考試成績：");
        int nextCount = sc.nextInt();
        int crossCount = nextCount - prevCount;
        double increase = ((double) crossCount / prevCount) * 100;
        DecimalFormat df = new DecimalFormat("#.00");
        String formattedValue = df.format(increase);
        System.out.print("你好,你的上次成績是"+prevCount+",本次成績是"+nextCount+",提高了"+crossCount+"分，成績提高的百分比是"+ formattedValue + "%");
    }
}
```

## <font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">小结</font>
java提供了两种变量类型： 基本类型和引用类型。

基本类型包括整型、浮点型、布尔型、字符型。

变量可重新赋值，等号是赋值语句，不是数学意义的符号。

常量在初始化后不可重新赋值，使用常量便于理解程序意图。

