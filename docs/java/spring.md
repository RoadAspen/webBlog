# spring

说起 java Web，就离不开 spring 框架，国内的 java 框架基本上是 spring 一统天下。

## 特性

- **依賴注入**： 依赖的对象不需要手动调用 set 方法或者 new 方法来创建，而是通过配置文件或者注解由 spring 容器来创建和管理。

- **面向切面编程**：面向切面编程（AOP），实际上，AOP 是为了将业务逻辑和其他功能（如 `日志记录`、`权限`、`事务管理`等）分离开而设计的。程序员只需要专注于业务逻辑，而其他功能则由 AOP 来实现。
- **控制反转**：IOC， spring 把对象的创建权交给了 spring 去创建。在使用 spring 之前，对象都是由程序员在代码中使用 new 关键字创建的。而使用 soring 之后，对象的创建都是给了 spring 框架去创建。

- **容器**: spring 是一个容器，因为 spring 包含并且管理着应用对象的生命周期。
- **组件**：spring 实现了使用简单的组件配置组合成一个复杂的应用。在 spring 中可以使用 XML 或者注解来配置和管理对象。

## spring 组成

### spring core container

spring 的核心容器是其他模块建立的基础，由 Beans 模块、Core 核心模块、Context 上下文模块和 SqEl 表达式语言模块组成，没有这些核心容器，也不可能有 AOP、Web 等上层的功能。

- **Beans 模块**： 提供了框架的基础部分，包括控制反转和依赖注入。
- **Core 核心**：封装了 Spring 框架的地层部分，包含资源访问、类型转换及一些常用工具类。
- **Context 上下文模块**： 建立在 Core 和 Beans 模块的基础之上，集成 Beans 模块功能并添加资源绑定、数据验证、国际化、Java EE 支持、容器生命周期、事件传播等。 ApplicationContext 接口是上下文模块的焦点。
- **SpEL 模块**： 提供了抢答的表达式语言支持。支持访问和修改属性值，方法调用，支持访问及修改数组、容器和索引器，逻辑操作，命名变量等。支持从 Spring 容器获取 Bean，支持 Bean 定义的元数据访问。也支持列表投影、选择和聚合等操作。

### Data Access/Integration(数据访问、集成)

数据访问、集成层包括 JDBC、ORM、OXM、JMS 和 Transaction 管理等功能。

- **JDBC 模块**： 提供了一个 JDBC 的样例模板，使用这些模板能消除传统冗长的 JDBC 彪马还有必须的事务控制，而且能享受到 Spring 管理事务的好处。
- **ORM 模块**： 提供与流行的 “对象-关系”映射框架无缝集成的 API，包括 JPA、JDO、Hibernate、MyBatis 等。而且还可以使用 Spring 事务管理，无需额外控制事务。
- **OXM 模块**： 提供了一个支持 Object/XML 映射的抽象层实现，如 JAXB、Castor、XMLBeans、JiBX 和 XStream。将 Aava 对象映射成 XML 数据，或者将 XML 数据映射成 Java 对象。
- **JMS 模块**： 指 Java 消息服务，提供一套 “消息生产者，消息消费者”模板用于更加简单的使用 JMS，JMS 用于在两个应用程序之间或分布式系统中发送消息，进行异步通信。
- **Transaction 模块**： 支持编程和声明式事务管理，这些事务类包括 JDBC、Hibernate、JPA、JDO、LDAP、以及 基于容器的事务如 JTA。

### Web 模块

Spring 的 Web 层包括 Web、Servlet、WebSocket 和 Webflux 组件，具体介绍如下：

- **Web 模块**：提供了基本的 Web 开发集成特性，例如多文件上传功能、使用的 Servlet 监听器的 IOC 容器初始化一级 Web 应用上下文。

### spring context

spring 上下文，它继承了 core 包，提供了更多企业级功能的支持。

### spring aop

spring 的面向切面编程，提供了 AOP 的支持。

### spring mvc

spring 的 web 框架，它实现了 web 层，主要处理 web 请求。

### spring data
