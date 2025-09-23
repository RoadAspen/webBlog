# nestjs

## 什么是 NestJS?

NestJS 是一个用于构建高效的、可扩展的 Nodejs 服务端应用的框架。它使用渐进式 JavaScript，构建并完全支持 Typescript，并结合了 OOP、FP、FRP 的元素。
在底层，Nest 使用强大的 HTTP 服务器框架，如 Express，也可以选择配置为使用 `Fastify`。
Nestjs 在这些常见的 Nodejs 框架之上提供了一个抽象级别，但也直接向开发者公开了他们的 API。这使得开发者可以自由使用可用于底层平台的无数第三方博客。

## 安装

```sh
npm install -g @nestjs/cli

```

## 开始

设置新项目非常简单

```sh

nest new project-name --strict
```

这会创建一个基于 typescript 的 nestjs 项目

目录

```js
|--src;
|  |-- app.controller.spec.ts;// 控制器的单元测试
|  |-- app.controller.ts; // 具有单一路由的基本控制器
|  |-- app.module.ts; //  应用的根模块
|  |-- app.service.ts;// 具有单一方法的基本服务
|  |-- main.ts; // 使用核心函数 `NestFactory` 创建Nest应用实例的应用入口文件
```

`main.ts` 包含一个异步函数，它将引导我们的应用：

```js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.ts';

async function bootstrapt() {
	const app = await NestFactory.create(AppModule);
	await app.listen(process.env.PORT ?? 3000);
}

bootstrapt();
```

创建 Nest 应用实例，使用了 `NestFactory`类。 create 方法返回一个应用对象，它实现了`INestApplication`接口。在 `main.ts`实例中，我们只是启动了 HTTP 监听器，它让应用等待入站的 HTTP 请求。

## 平台

Nest 旨在成为一个与平台无关的框架。平台独立性使得创建可重用的逻辑部分成为可能。 开箱即用地支持两个 HTTP 平台： `express` 和 `fastify`. 你可以选择最适合你的需要的一种。

## 运行应用

```sh
npm run start
# 使用swc构建器可以将开发过程（构建速度加快20倍）
npm run start -- -b swc
```

## 控制器 Controller

控制器负责处理传入的请求并将响应发送回客户端。

![控制器]('./images/controller.png')

控制器的目的是处理应用的特定请求。路由机制确定哪个控制器将处理每个请求。通常，控制器拥有多个路由，每个路由可以执行不同的操作。

要创建一个基本的控制器，我们使用`类和装饰器`，装饰器将 类与必要的元数据链接起来，允许 Nest 创建将请求连接到相应控制器的路由图。

```sh
# 快速创建一个 CURD 控制器
nest g resource [name]

```

### 路由

在 controller 文件中，我们使用 `@Controller` 装饰器，它是定义基本控制器所必须的，我们将指定 `cats` 的可选路由路径前缀。在装饰器中使用路径前缀有助于我们将相关路由分组在一起并减少重复代码。

cats.controller.ts

```ts
//  要使用 CLI 创建控制器，只需执行 $ nest g controller [name] 命令即可。
import { Controller, Get } from '@nestjs/common';

@Controller('cats')
export class CatsController {
	@Get()
	findAll(): string {
		return 'This action returns all cats';
	}
}
```

放置在 `findAll()`方法之前的 `@Get()` HTTP 请求方法装饰器告诉 Nest ，为 HTTP 请求的特定端点创建处理程序。此端点由 HTTP 请求方法 和 路由路径定义。处理程序的路由路径由控制器声明的前缀（cats） 和 方法装饰器中制定的任何路径相结合来确定。由于我们为每个路由设置了一个前缀（`cats`）,并且没有在方法装饰器中添加任何特定路径，因此 Nest 会将 `GET /cats`请求映射到此处理程序。

如果控制器的前缀是 `cats`， 并且方法装饰器是 `@Get('breed')`,则生成的路由将是 `GET /cats/breed`.
当端点接收到这个路由的时候，将会将请求转发到 `findAll()` 方法中。这个方法名是任意的，必须的，但是 Nest 不会为方法名称附加任何特定意义。

### 响应

Nest 使用两种不同选项来操纵响应的概念：

1. 标准（推荐）： 使用此内置方法，当请求处理程序返回 JavaScript 对象或数组时，它将自动序列化为 JSON。然而，当它返回 基本类型（string、number、boolean）时，Nest 将仅发送该值，而不尝试对其进行序列化。这使得响应处理变得简单：只需返回值，Nest 就会处理剩下的事情。默认情况下，响应的状态码始终为 200， 但使用 201 的 POST 请求除外。我们可以通过在处理程序级别添加 `@HttpCode(...)` 装饰器来轻松更改此行为

2. 特定库： 我们可以使用特定于库的（Express）的响应对象，它可以使用方法处理程序签名中的 `@Res` 装饰器注入（例如 `findAll(@Res response)`）。通过这种方法，你可以使用该对象公开的原生响应处理方法。你可以使用 `response.status(200).send()` 等代码构建响应。

### 装饰器

#### 方法

1. `@POST()` 解析 post 方法
2. `@GET()` get 方法
3. `@DELETE()` delete 方法
4. `@PUT()` put 方法

#### 请求解析

1. `@Request()、@Req()` 用于解析 req
2. `@Response()、@Res()` 用于定义 res 返回
3. `@Next` next
4. `@Session` 用于解析 req.session 验证信息
5. `@Param(key?:string)` 用于解析 req.params \ req.params[key] 路由传参
6. `@Body(key?:string)` 用于解析 req.body \ req.body[key] 负载
7. `@Query(key?:string)` 用于解析 req.query \ req.query[key] 参数
8. `@Headers(name?:string)` 用于解析 req.headers \ req.headers[name] 请求头
9. `@Ip()` 用于解析 req.ip 用户请求 ip 地址
10. `@HostParam` 用于解析 req.hosts 主机信息

### 完整资源样本

cats.controller.ts , 这个文件定义了关于 cats 相关的所有可以接受的路由路径及方法

```ts
import {
	Controller,
	Get,
	Query,
	Post,
	Body,
	Put,
	Param,
	Delete,
} from '@nestjs/common';
import { CreateCatDto, UpdateCatDto, ListAllEntities } from './dto';

@Controller('cats')
export class CatsController {
	// @Post 解析 Post方法
	@Post()
	// @Body DTO 用来定义可接受的负载
	create(@Body() createCatDto: CreateCatDto) {
		return 'This action adds a new cat';
	}
	// @Get 解析 get 方法
	@Get()
	// @Query 用来解析查询参数, eg: ?name=roadaspen&age=18 ， 一般只有get方法需要Query解析
	findAll(@Query() query: ListAllEntities) {
		return `This action returns all cats (limit: ${query.limit} items)`;
	}
	// @Get 接收get方法
	@Get(':id')
	// @Param 解析路由传参
	findOne(@Param('id') id: string) {
		return `This action returns a #${id} cat`;
	}
	// @Put 接受put方法
	@Put(':id')
	// @Param 解析路由传参 @Body DTO 解析负载
	update(@Param('id') id: string, @Body() updateCatDto: UpdateCatDto) {
		return `This action updates a #${id} cat`;
	}
	// @Delete 接收 delete方法 :id 路由传参
	@Delete(':id')
	// @Param 解析路由传参
	remove(@Param('id') id: string) {
		return `This action removes a #${id} cat`;
	}
}
```

### 运行

即使 `CatsController` 已经完全定义,Nest 也不知道它，也不会自动创建该类的实例。
控制器必须始终是模块的一部分，，这就是我们在 `@Module()` 装饰器中包含`controllers`数组的原因。由于除了根 `AppModule` 之外，我们没有定义任何其他模块，因此我们将使用它来注册 `CatsController`:
app.module.ts

```ts
import { Module } from '@nestjs/common';
import { CatsController } from './cats/cats.controller';
@Module({
	controllers: [CatsController],
})
export class AppModule {}
```

我们使用 `@Module()` 装饰器将元数据附加到模块类，现在 Nest 可以轻松确定需要安装哪些控制器了。

## 提供器 Provider

当我们创建了一个简单的 `CatsController`之后。控制器应该处理 HTTP 请求并将更复杂的任务委托给提供器。提供程序是 NestJS 模块中生命的 `providers` 的纯 JavaScript 类。

### 服务 Service

我们从创建一个简单的`CatsService`服务类开始。这个服务将用来 `处理数据存储和检索`,并将由`CatsController`使用。由于它在管理应用逻辑中的作用，它是被定义为 `provider 程序的理想候选者`。

可以使用 CLI 快捷创建一个 service

```sh
nest g service cats
```

#### 创建

cats.service.ts

```ts
import { Injectable } from '@nestjs/common';
// cat.interfrace 这个是Cat 接口类型
import { Cat } from './interfaces/cat.interfrace';

@Injectable()
export class CatsService {
	private readonly cats: Cat[] = [];

	create(cat: Cat) {
		this.cats.push(cat);
	}

	findAll(): Cat[] {
		return this.cats;
	}
}
```

我们的`CatsService` 是一个具有一个属性和两个方法的基本类。这里的 `@Injectable()`装饰器。这个装饰器将元数据附加到类，表示 `CatsService`是可由 Nest IoC 容器管理的类。

这个示例使用了 `Cat` 接口，它可能看起来像这样：

**cat.interface.ts**

```ts
export interface Cat {
	name: string;
	age: number;
	breed: string;
}
```

#### 使用

我们有了一个检索猫的服务类，我们可以在 `CatsController` 中使用它：

**cats.controller.ts**

```ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { CreateCatDto } from './dto/create-cat.dto';
import { CatsService } from './cats.service';
import { Cat } from './interfaces/cat.interface';

@Controller('cats')
export class CatsController {
	/**
	 * 这种写法等同于
	 * private catsService
	 * this.catsService = catsService
	 */
	constructor(private catsService: CatsService) {}

	@Post()
	async create(@Body() createCatDto: CreateCatDto) {
		this.catsService.create(createCatDto);
	}

	@Get()
	async findAll(): Promise<Cat[]> {
		return this.catsService.findAll();
	}
}
```

`CatsService` 通过类构造函数注入， `private` 关键词是私有属性, 这种简写允许我们在同一行中声明和初始化 `catsService` 成员,从而简化流程.

#### 依賴注入

Nest 是围绕称为 `依賴注入`的强大数据模式构建的.Nest 将通过创建并返回 `CatsService`的实例来解析 `catsService`(或者在单例的情况下,如果已在其他地方请求,则返回现有实例).然后将此依赖注入到控制器的构造函数中(或分配给指定的属性):

```ts
constructor(private catsService:CatsService){}
```

#### 作用域

provider 程序通常与 整体应用的生命周期一致. 当应用启动时,必须解析每个依赖,这意味着每个 provider 都会被实例化. 同样,当应用关闭时,所有 provider 程序都将被销毁. 但是,也可以使 provider 程序具有请求范围,这意味着其生命周期与特定请求而不是应用的生命周期相关联. 你可以在设置 `注入范围`.

#### 可选 provider

你的类可能依赖于配置对象,但如果未提供任何配置对象,则应使用默认值.在这种情况下,依赖被视为可选的,并且缺少配置提供程序不应导致程序错误.

将`provider`标记为可选,使用`@Optional()`装饰器

```ts
import { Injectable, Optional, Inject } from '@nestjs/common';
@Injectable()
export class HttpService<T> {
	constructor(@Optional() @Inject('HTTP_OPTIONS') private httpClient: T) {}
}
```

在这个例子中,我们使用了自定义的 `provider`, 这就是我们包含 `HTTP_OPTIONS`自定义令牌的原因,

#### 基于属性的注入

```ts
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class HttpService<T> {
	@Inject('HTTP_OPTIONS')
	private readonly httpClient: T;
}
```

#### provider 注册

我们定义了 provider(`CatsService`) 和 消费者 (`CatsController`), 我们需要向 Nest 注册服务,以便它可以处理注入.这是通过编辑模块文件(`app.module.ts`)并将服务添加到`@Module`装饰器中的`providers`数组来完成.

```ts
import { Module } from '@nestjs/common';
import { CatsController } from './cats/cats.controller';
import { CatsService } from './cats/cats.service';

@Module({
	controllers: [CatsController],
	// 提供者
	providers: [CatsService],
})
export class AppModule {}
```

这样,Nest 现在可以解析 `CatsController`类的依赖.

**目录**

```js
src // 源码目录
|
+---cats // 模块文件夹
|  	+--- dto // 定义负载类型文件夹
|	|	create-cat.dto.ts  // 创建请求负载
|  	+--- interface // 接口
|   |   cat.interface.ts // cat 接口
|   cats.controller.ts // controller
|   cats.service.ts // service
|   app.module.ts // app 根模块
|	main.ts 入口文件
```

## 模块 Module

Module 是一个用`@Module()`装饰器装饰的类.此装饰器提供 Nest 用于有效组织和管理应用结构的元数据.
![module]('./images/module.png')

每个 Nest 应用至少有一个`模块`,即 `根模块(Root Module)`, 它是 Nest 构建应用图的起点. 这个图是 Nest 用于解析`module`和`provider`程序之间的的关系和依赖的内部结构.虽然小型应用可能只有一个`root module`,但通常情况并非如此.强烈推荐使用`module`作为组织组件的有效方法.对于大多数应用,你可能有多个模块,每个模块都封装了一组密切相关的功能.
`@Module()`装饰器采用具有描述模块的属性的单个对象:
|模块|描述|
|-----|-----|
|`providers`|将由 Nest 注入器实例化并且至少可以在该模块中共享的 provider 程序|
|`controllers`|此模块中定义的必须实例化的控制器集|
|`imports`|此模块所需的 `provider` 程序的`其他导入模块列表`|
|`exports`|这个模块提供的`providers`的子集应该在导入这个`module`的其他`module`中可用.你可以使用 提供器本身或者只使用其令牌(`provide值`)|.

模块默认封装提供程序,这意味着你只能注入当前模块的一部分或从其他导入模块明确导出的`provider`.从模块导出的 provider 程序本质上充当模块的公共接口或 API.

### 功能模块

在我们的示例中,`CatsController`和`CatsService`紧密相关,并服务于同一个应用域.将它们分组到功能模块中是有意义的.功能模块组织与特定功能相关的代码,有助于保持清晰的边界和更好地组织.随着应用或团队的发展,这一点尤为重要,并且它符合面向对象原则.

我们创建`CatsModule`,演示如何对 `controller` 和 `service`进行分组.

要使用 cli 创建模块

```sh
nest g module cats
```

`cats.module.ts`

```ts
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
	controllers: [CatsController],
	providers: [CatsService],
})
export class CatsModule {}
```

我们在 `cats.module.ts`文件中定义了`CatsModule`,并将与该模块相关的所有内容都移动到了`cats`目录下.我们需要做的最后一件事是将此模块导入到 根模块(`AppModule`,在`app.module.ts`文件中定义.)

`app.module.ts`

```ts
import { Module } from '@nestjs/common';
import { CatsModule } from './cats/cats.module';

@Module({
	// imports 用来导入其他模块
	imports: [CatsModule],
})
export class AppModule {}
```

### 共享模块

在 Nest 中,默认情况下模块是`单例`,因此你可以轻松地在`多个模块之间共享任何 provider 程序的同一实例`.
每个模块自动成为共享模块. 一旦创建,它就可以被任何模块重用. 假设我们想要在其他几个模块之间共享`CatsService` 的一个实例. 为此,我们首先需要将`CatsService` 的`provider`程序添加到模块的`exports`数组中来导出它.

`cats.module.ts`

```ts
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
	controllers: [CatsController],
	providers: [CatsService],
	// 这里导出之后,就可以在其他导入CatsModule的模块中访问 CatsService
	exports: [CatsService],
})
export class CatsModule {}
```

假如我们在 dogs module 中导入并使用 CatsService.
`dogs.module.ts`

```ts
import { Module } from '@nestjs/common';

@Module({
	// 这里导入了 CatsModule
	imports:[CatsModule]
	controllers: [DogsController],
	providers: [DogsService],
})
export class DogsModule {}

```

在 DogsService 中使用 CatsService:
`dogs.service.ts`

```ts
import { Injectable } from '@nestjs/common';
import { CatsService } from '../cats/cats.service';

@Injectable()
export class DogsService {
	constructor(private catsService: CatsService);
}
```

这样就可以在 DogsService 中使用 this.catsService.

如果我们直接在每个需要它的`Module`中注册`CatsService`,它确实可以工作,但这会导致每个模块都获得自己单独的`CatsService`实例.由于创建了同一服务的多个实例,这可能导致更多可预测的行为,因为所有`Module`共享同一个实例,从而更容易管理共享状态或资源.这是 NestNestHS 等框架中模块化和依賴注入的主要优势之一 `允许在整个应用中有效共享服务` .
这里的注册是指将`CatsService`作为 每个`Module` 的`providers`传入,而不是 通过 `imports:[CatsModule]`这种方式导入的. 通过 `imports`形式导入的就可以在 Module 中共享实例.

### 模块重新导出

模块可以导出 内部`provider`程序.此外,他们可以重新导出他们导入的`Module`.

```ts
@Module({
	imports: [CommonModule],
	exports: [CommonModule],
})
export class CoreModule {}
```

### 依賴注入

模块类也可以注入`provider`(例如,出于配置的目的):
cats.module.ts

```ts
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';
@Module({
	controllers: [CatsController],
	providers: [CatsService],
})
export class CatsModule {
	constructor(private catsService: CatsService) {}
}
```

### 全局模块

如果你必须在所有地方导入相同的模块集,它会变得乏味.与 Nest 不同, Angular providers 是在全局作用域内注册的.一旦定义,他们随处可用.然而,Nest 将 `provider`程序封装在模块作用域内. 如果不首先导入封装模块,则无法在其他地方使用模块的 provider 程序
当你想要提供一组开箱即用的`provider`程序(例如辅助程序,数据库连接等)时,请使用`@Global()`装饰器时模块全局化.

```ts
import { Module, Global } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Global()
@Module({
	controllers: [CatsController],
	providers: [CatsService],
	exports: [CatsService],
})
export class CatsModule {}
```

`@Global()` 装饰器使模块具有全局作用域。全局模块应该只注册一次，通常由根模块或核心模块注册。在上面的示例中，`CatsService`的`provider`程序将无处不在，希望注入服务的模块将不需要在其导入数组中导入 ,即不再需要`imports:[CatsModule]`。

## 中间件

中间件是在路由处理程序之前调用的函数.中间件函数可以访问 `request` 和 `response`对象,以及处理应用请求-响应周期中的`next()`中间件函数. 下一个中间件函数通常名为`nest`的变量表示.

中间件的功能:

1. 执行任何代码
2. 更改请求和响应对象
3. 结束请求-响应循环
4. 调用对战中的下一个中间件函数
5. 如果当前中间件没有结束请求响应循环,那么它就必须执行 `next()`方法 去将控制权传递给下一个中间件程序,否则,请求就会被阻塞在结束之前.

你可以在函数中或在具有`Injectable()`装饰器的类中实现自定义 Nest 中间件.类应实现`NestMiddleware`接口,功能无特殊要求.让我们从使用类方法实现一个简单的中间件函数开始. 默认中间件是`express`的中间件.

`logger.middleware.ts`

```ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export class LoggerMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: NextFunction) {
		console.log('Request....');
		// 这里是下个中间件
		next();
	}
}
```

Nest 中间件完全支持依賴注入. 就像`provider`和`controller`一样,他们能够注入统一模块中可用的依赖.像往常一样,这是通过`constructor`完成的.

### 应用中间件

**我们如何在应用中使用中间件呢?**

`@Module()`装饰器中没有中间件的位置.所以,我们使用模块类的`configure()`方法设置它们.包含中间件的模块必须实现`NestModule`接口.让我们在`AppModule`级别设置`LoggerMiddleware`

在`app.module.ts`中

```ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
	// 这里注册了CatsModule
	imports: [CatsModule],
})
// 如果使用中间件,这里必须实现 NestModule 的类型接口
export class AppModule implements NestModule {
	// 实现 configure 方法,在这个方法中进行件的配置
	configure(consumer: MiddlewareConsumer) {
		// 这里应用了 LoggerMiddleware.并监听了 cats 路由
		consumer.apply(LoggerMiddleware).forRoutes('cats');
	}
}
```

在这个示例中,我们为之前在`CatsController`中定义的`/cats`路由处理程序设置了 `LoggerMiddleware`. 我们还可以通过在配置中间件时将包含路由`path`和请求`method`的对象传递给`forRoutes()`方法,进一步将中间件限制为特定的请求方法. 在下边的示例中,请注意我们导入了`RequestMethod` 枚举以引用所需的请求方法类型:

`app.module.ts`:

```ts
import {
	Module,
	NestModule,
	RequestMethod,
	MiddlewareConsumer,
} from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
	imports: [CatsModule],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(LoggerMiddleware)
			// 这里将中间件限制在路由 path为 cats,方法为 GET的情境下.这个中间件才会执行
			.forRoutes({ path: 'cats', method: RequestMethod.GET });
	}
}
```

**express**默认将 `body-parser`中间件应用到全局了.

**中间件路由通配符**:

```ts
// (*splat) 是命名通配符,用来匹配 路由中的任意字符组合.下面这个会匹配到任何以 abcd/开头的路由,都会执行这个中间件, 如果路径以 abcd/ 结尾,则不会执行
forRoutes({
	path: 'abcd/*splat',
	method: RequestMethod.ALL,
});

// 这种大括号可以将 abcd/ 后面的字符设置为可选,这样就可以匹配到以 abcd/结尾的路由了
forRoutes({
	path: 'abcd/{*splat}',
	method: RequestMethod.ALL,
});
```

**splat** 只是用来代表这是一个通配符参数,没有其他意义,我们可以设置任何其他的字符串用来表示这是一个通配符, 比如 `*abcdsesf`, 也可以达到通配符的效果.

### 中间件消费者

`MiddlewareConsumer`是一个辅助类. 它提供了集中内置的方法来管理中间件. 所有这些都可以简单地链接在`流畅的风格`中.`forRoutes()`方法可以接受单个字符串,多个字符串, 一个`RouteInfo`对象,一个控制器类甚至多个控制器类. 在大多数情况下,你可能只会传递以逗号分隔的控制器列表.

```ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';
import { CatsController } from './cats/cats.controller';

@Module({
	imports: [CatsModule],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(LoggerMiddleware).forRoutes(CatsController);
	}
}
```

### 排除路由

我们可以排除路由来使用中间件. 可以使用`exclude()`方法轻松实现.`exclude()`方法接受单个字符串,多个字符串或`RouteInfo`对象来标识要派出的路由.

```ts
consumer
	.apply(LoggerMiddleware)
	// 这里使用exclude来排除某些路由不会应用这个中间件
	.exclude(
		{ path: 'cats', method: RequestMethod.GET },
		{ path: 'cats', method: RequestMethod.POST },
		'cats/{*splat}'
	)
	.forRoutes(CatsController);
```

### 函数式中间件

```ts
import { Request, Response, NextFunction } from 'express';

export function logger(req: Request, res: Response, next: NextFunction) {
	console.log(`Request...`);
	next();
}
```

### 多个中间件

为了绑定顺序执行的多个中间件,只需要在`apply()`方法中提供一个逗号分隔的列表:

```ts
consumer.apply(cors(), helmet(), logger).forRoutes(CatsController);
```

### 全局中间件

如果我们想一次将中间件绑定到每个已注册的路由,我们可以使用 `INestApplication`实例提供的`use()`方法:

```ts
// main.ts

const app = await NestFactory.create(AppModule);
app.use(Logger);
await app.listen(process.env.PORT ?? 3000);
```

## 异常过滤器

Nest 带有一个内置的异常层,负责处理应用中所有未处理的异常.当你的应用代码未处理异常时,该层会捕获该异常,然后自动发送适当的用户友好响应.

### 抛出异常

```ts
@Get()
async findAll() {
	// 在这里抛出异常
  throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
}
// 客户端返回
// {
//   "statusCode": 403,
//   "message": "Forbidden"
// }
```

## 管道

管道是用 `@Injectable()` 装饰器注释的类,它实现了 `PipeTransform`接口

1. **转型**: 将输入数据转换为所需的形式(例如: 从字符串到整数)
2. **验证**: 评估输入数据,如果有效,只需将其原样传递,否则抛出异常

### 内置管道

- `ValidationPipe` 校验
- `ParseIntPipe` 转换整数
- `ParseFloatPipe` 转换浮点数
- `ParseBoolPipe` 转换布尔值
- `ParseArrayPipe` 转换数据
- `ParseUUIDPipe` 转换 uuid
- `ParseEnumPipe`
- `DefaultValuePipe` 默认值
- `ParseFilePipe` 解析文件
- `ParseDatePipe` 解析日期

### 绑定管道

```ts
@Get(':id')
async findOne(@Param('id',ParseIntPipe) id:number){
	return this.catsService.findOne(id)
}
```

### 自定义管道

我们可以构建自己的自定义管道.虽然 Nest 提供了强大的内置 `ParseIntPipe` 和 `ValidationPipe`,但让我们从头开始构建每个的简单自定义版本,以了解如何构建自定义管道.
我们从一个简单的 `ValidationPipe`开始. 最初,我们让它简单地接受一个输入值并立即返回相同的值.表现得像一个恒等函数.

```ts
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class ValidationPipe implements PipeTramsform {
	transform(value: any, metadata: ArgumentMetadata) {
		return value;
	}
}
```

> `PipeTrasform<T,R>`是一个通用接口,任何管道都必须实现.泛型接口用 `T`标识输入`value`的类型,用`R` 表示`transform()`方法的返回类型.

每个管道都必须实现`transform()`方法来履行`PipeTransform`接口契约.这个方法有两个参数:

- value 是当前处理的方法参数(在被路由处理方法接收之前)
- metadata 是当前处理的方法参数的元数据.

**元数据具有以下属性**:

```ts
export interface ArgumentMetadata {
	type: 'body' | 'query' | 'param' | 'custom'; // 指示参数是主体`@Body()`、查詢 `@Query()` 、`@Param()` 还是自定义了参数
	metatype?: Type<unknown>; // 提供参数的元类型,例如 String
	data?: string; // 传递给装饰器的字符串.例如 @Body('string'),如果将装饰器括号留空,则为 undefined
}
```

这些属性描述了当前处理的参数

## 守卫

守卫是一个用 `@Injectable()` 装饰器注释的类，它实现了 `CanActivate` 接口。守卫有单一的原则.它们根据运行时存在的某些条件(权限,角色,ACL 等)确定给定请求是否将由路由处理程序处理. 这通常称为授权. 授权(及其通常与之合作的身份验证)通常由传统 Express 应用中的`中间件`处理. 中间件是身份验证的不错选择,因为诸如令牌验证和将属性附加到`request`对象之类的事情与特定路由上下文没有紧密联系.

中间件,就其本质而言,是愚蠢的.它并不知道调用`next()`函数后将执行哪个处理程序,而 Guards(守卫) 可以访问 `ExectionContext`实例,因此确切地知道接下来要执行什么. 它们的设计与 异常过滤器、管道、拦截器非常相似,可以让你在请求/响应周期的正确位置插入处理逻辑,并以声明方式进行. 这有助于使你的代码保持干爽和声明式.

> 守卫 是在所有中间件之后、任何连接器或管道之前执行

**权限守卫**

```ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
	canActivate(
		context: ExecutionContext
	): boolean | Promise<boolean> | Observable<boolean> {
		const request = context.switchToHttp().getRequest();
		return validateRequest(request);
	}
}
```

这是一个权限验证守卫

**角色守卫**
让我们构建一个功能更强大的守卫,只允许具有特定角色的用户访问.我们将从一个基本的守卫模板开始,并在接下来的部分中构建它.

```ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
	canActivate(
		context: ExecutionContext
	): boolean | Promise<boolean> | Observable<boolean> {
		// 这里任何情况都返回了true
		return true;
	}
}
```

### 绑定守卫

与管道和异常过滤器一样,防护可以是控制器方位,方法范围或全局作用域. 下面,我们使用`@UseGuards()`装饰器设置了一个控制器作用域的守卫.这个装饰器可以接受一个参数,或者一个逗号分隔的参数列表

```ts
import { UseGuards } from '@nestjs/common';

@Controller('cats')
@UseGuards(RolesGuard)
export class CatsController {}
```

## 拦截器

拦截器是用 `@Injectable()` 装饰器注释并实现 `NestInterceptor` 接口的类。

拦截器具有一组有用的功能，这些功能的灵感来自 **面向切面编程 (AOP)** 技术。它们可以：

- 在方法执行之前/之后绑定额外的逻辑

- 转换函数返回的结果

- 转换函数抛出的异常

- 扩展基本功能行为

- 根据特定条件完全覆盖函数（例如，出于缓存目的）
