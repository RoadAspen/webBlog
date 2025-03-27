# Java 介绍及搭建开发环境

## 前言

最近換了工作，从卷的不行的上海互联网回到老家河南，工资瀑布式下降，空闲时间却是螺旋式上升，终于有时间去研究一下平时想要学习的一些知识,正好公司的后端是 java，就先从 java 安装开始吧，拉着后端同事帮我弄，三个小时搞定了。

## Java 简介

首先我们需要知道 java 的一些基本知识。java 是一种广泛使用的高级编程语言，常用来开发大型后端项目，强类型、编译行语言,当我们使用 java 时，经常听到 JDK、JRE、MAVEN、虚拟机 JVM 这些名词，那它们都代表什么意思？

### 什么是 JDK（Java Development Kit）

JDK 是 java 开发工具包，它是 java 开发人员进行 java 程序开发的必备工具集。JDK 包含了一系列的开发工具、java 运行时环境（JRE） 以及 java 的核心类库（即预置的一些包）。

#### 组成部分

由开发工具和 JRE 组成

**开发工具**

以下是 jdk 包含的可执行命令

- 编译器（javac）：它的主要功能是将 java 源代码（.java 文件）编译成字节码文件（以.class 为扩展名的文件）。例如，对一个简单的 HelloWorld.java 文件，通过运行`javac HelloWorld.java`命令，就可以得到 `HelloWorld.class` 字节码文件。
- 调试器（jdb）：用于帮助开发人员调试 java 程序。在程序开发过程中，当程序出现错误或者运行结果不符合预期时，可以使用 jdb 来查找问题所在。例如，可以设置断点，查看变量的值，跟踪程序的执行流程等。
- 文档生成器（javadoc）：根据 java 源代码中的注释生成 API 文档，在团队开发或者开源项目中，这是非常重要的工具，其他开发人员可以通过生成的 API 来了解代码的功能及构造使用方法。
- jar: 将多个 class 文件编译成 jar 包，对外发布

**JRE**

JDK 内部包含了 JRE，这使得开发人员在开发过程中就可以直接在 JDK 内部的 JRE 环境下对开发的 java 程序进行测试和运行。

#### 用途

主要是用于 java 程序的开发，无论是开发桌面应用程序、web 应用程序还是移动应用程序都需要 JDK。例如，开发一个 javaEE 的企业级 Web 应用，需要使用 JDK 中的各种工具来编译代码、调试代码、管理项目依赖等。

### 什么是 JRE（Java Runtime Environment）

从 JDK 的介绍中可以知道，JRE 是在安装 JDK 时一起安装的一个工具，它主要的作用就是 Java 的运行时环境（runtime），它为运行 java 程序提供了必要的运行环境。

#### 组成部分

JRE 包含了 `Java 虚拟机（JVM）`，`java 核心类库`以及`支持文件`。

**Java 虚拟机（JVM）**  
JVM 是 java 程序运行的核心，它负责`执行字节码文件`。不同的操作系统有不同版本的 JVM，这使得 java 程序具有“一次编写，到处运行”的特性。每个平台的代码一样，但是每个平台的 JVM 不一样。

```shell
java -jar HelloWorld.jar
```

虚拟机启动

**JAVA 核心类库**

包含了大量的预定义类和接口，这些类和接口提供了各种各样的功能。例如：java.io 包剔红了输入输出操作的功能，用于读取和写入文件、网络流等。java.net 包提供了网络通信相关的功能，如创建 Socket 连接、发送和接受网络数据等。

#### 用途

用于运行已经开发好的 Java 程序。如果用户只是想要运行 java 应用程序，而不需要进行开发工作，那么只需要安装 JRE 即可。例如，普通用户在电脑上运行一个 Java 编写的小游戏或者一个基于 Java 的办公软件时，**电脑上只需要安装 JRE 就可以正常运行这些程序**。

## java 安装

### 下载安装

我这里是 windows 系统，所以下载的 jdk 版本是 windows 版的，1.8.0_191,一路下一步下一步，安装到了 C 盘。

### 配置环境变量

安装完成了，但是这个时候如果打开命令行工具，执行 java 或者 javac 的时候会报 NOT FOUND，所以还在去配环境变量。使用 `win+R` 打开执行窗口，在输入框中输入`sysdm.cpl`，可以快速打开环境变量的窗口

1. 创建一个叫`JAVA_HOME` 的变量，将 jdk 的安装路径 copy 进去。
2. 在 PATH 中新增一条 `%JAVA_HOME%\bin`,将 java、javac 可执行命令接入环境量。
3. 在 PATH 中新增一条`%JAVA_HOME\jre\bin`,将 jre 中的命令接入环境变量，这个主要用于编辑器 debug 程序时用到。

环境变量添加完成之后，在命令行验证是否成功：

```sh
java -version

C:\Users\H2413453>java -version
java version "1.8.0_191"
Java(TM) SE Runtime Environment (build 1.8.0_191-b12)
Java HotSpot(TM) 64-Bit Server VM (build 25.191-b12, mixed mode)

javac -version
C:\Users\H2413453>javac -version
javac 1.8.0_191
```

windows 版的 java 安装完成。

## 第一个 java 程序

打开编辑器，创建一个`Hello.java`文件：

```java
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, world!");
    }
}
```

**执行第一个 java 程序**

1. 先用 javac 将 java 文件编译成 class 文件 `javac Hello.java`,生成 `Hello.class`
2. 使用 `java Hello` ,执行二进制文件。

## 编辑器

我这里使用 vscode 习惯了，微软官方也出了很多关于 java 的官方插件，所以我们这里的编辑器就是使用 vscode，安装一些 java 相关插件。

1. `Extension Pack for Java` 微软出品,里边有 7 个子插件。
2. `Prettier - Code formatter` 代码格式化
3. `Maven for java` Maven 管理
