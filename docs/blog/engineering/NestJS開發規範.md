# NestJS 开发规范

NestJS 开发规范的核心是 **遵循框架模块化设计思想、保持代码一致性、提升可维护性**，结合 NestJS 官方最佳实践、TypeScript 类型安全、工程化流程，覆盖目录结构、代码风格、模块化设计、工具链等核心维度。

## 一、基础规范（目录结构 + 命名规则）

### 1. 项目目录结构（Nest CLI 标准扩展）

基于 Nest 模块化设计思想，按「功能模块 + 公共核心」分层，确保模块高内聚、低耦合：

```
src/
├── main.ts                  # 应用入口（初始化 Nest 应用）
├── app.module.ts            # 根模块（聚合所有功能模块）
├── common/                  # 公共核心模块（全局复用）
│   ├── common.module.ts     # 公共模块入口（导出全局依赖）
│   ├── decorators/          # 全局自定义装饰器（如 @CurrentUser）
│   │   ├── current-user.decorator.ts
│   │   └── role.decorator.ts
│   ├── filters/             # 全局异常过滤器
│   │   ├── http-exception.filter.ts
│   │   └── business-exception.filter.ts
│   ├── guards/              # 全局守卫（权限、认证）
│   │   ├── auth.guard.ts
│   │   └── role.guard.ts
│   ├── interceptors/        # 全局拦截器（日志、响应格式化）
│   │   ├── transform.interceptor.ts  # 响应统一格式化
│   │   └── logger.interceptor.ts     # 请求日志
│   ├── pipes/               # 全局管道（参数校验、转换）
│   │   ├── validation.pipe.ts        # 数据校验（基于 class-validator）
│   │   └── parse-int.pipe.ts         # 类型转换
│   ├── exceptions/          # 全局自定义异常
│   │   ├── business.exception.ts     # 业务异常
│   │   └── error-code.enum.ts        # 错误码枚举
│   └── utils/               # 全局工具函数
│       ├── date.util.ts
│       └── crypto.util.ts
├── config/                  # 配置模块（环境变量、第三方配置）
│   ├── config.module.ts
│   ├── config.service.ts    # 配置读取服务
│   └── env/                 # 环境变量校验（基于 joi）
│       └── validation.schema.ts
├── modules/                 # 功能业务模块（按业务域拆分）
│   ├── user/                # 用户模块（独立业务域）
│   │   ├── user.module.ts   # 模块入口
│   │   ├── user.controller.ts  # 控制器（接口层）
│   │   ├── user.service.ts     # 服务层（业务逻辑）
│   │   ├── user.repository.ts  # 数据访问层（可选，复杂项目用）
│   │   ├── entities/           # 数据实体（TypeORM/Mongoose 模型）
│   │   │   └── user.entity.ts
│   │   ├── dto/                # 数据传输对象（请求/响应）
│   │   │   ├── create-user.dto.ts
│   │   │   ├── update-user.dto.ts
│   │   │   └── user-response.dto.ts
│   │   ├── interfaces/         # 模块内部接口（类型定义）
│   │   │   └── user.interface.ts
│   │   └── tests/              # 模块单元测试（可选，复杂模块用）
│   │       ├── user.controller.spec.ts
│   │       └── user.service.spec.ts
│   └── order/               # 订单模块（另一独立业务域）
│       ├── order.module.ts
│       ├── order.controller.ts
│       └── ...（结构同 user 模块）
├── database/                # 数据库配置（全局统一）
│   ├── database.module.ts
│   ├── migrations/          # 数据库迁移脚本（TypeORM）
│   └── seeds/               # 测试数据种子脚本
└── infrastructure/          # 基础设施层（第三方服务集成）
    ├── cache/               # 缓存服务（Redis）
    │   ├── cache.module.ts
    │   └── cache.service.ts
    └── messaging/           # 消息队列（RabbitMQ/Kafka）
        ├── messaging.module.ts
        └── messaging.service.ts
```

### 2. 命名规则（强制统一）

遵循 NestJS 官方约定 + TypeScript 规范，确保可读性和一致性：

| 类型                 | 命名规则                                        | 示例                                             |
| -------------------- | ----------------------------------------------- | ------------------------------------------------ |
| 模块（Module）       | 大驼峰 + Module 后缀                            | `UserModule`、`ConfigModule`                     |
| 控制器（Controller） | 大驼峰 + Controller 后缀                        | `UserController`、`OrderController`              |
| 服务（Service）      | 大驼峰 + Service 后缀                           | `UserService`、`CacheService`                    |
| 数据实体（Entity）   | 大驼峰 + Entity 后缀（TypeORM）                 | `UserEntity`、`OrderEntity`                      |
| DTO 类               | 小驼峰描述 + 功能后缀（Create/Update/Response） | `create-user.dto.ts`、`user-response.dto.ts`     |
| 装饰器（Decorator）  | 小驼峰 + .decorator.ts 后缀                     | `current-user.decorator.ts`                      |
| 异常（Exception）    | 大驼峰 + Exception 后缀                         | `BusinessException`、`ResourceNotFoundException` |
| 枚举（Enum）         | 大驼峰 + Enum 后缀（或无后缀，语义清晰）        | `ErrorCodeEnum`、`OrderStatus`                   |
| 接口（Interface）    | 大驼峰 + Interface 后缀（或 I 前缀）            | `UserInterface`、`IOrderService`                 |
| 工具函数文件         | 小驼峰 + .util.ts 后缀                          | `date.util.ts`、`crypto.util.ts`                 |

**关键禁忌**：

- 禁止使用拼音命名（如 `YongHuModule` 应改为 `UserModule`）。
- 禁止单字母变量（`i`/`j` 循环变量除外），变量名需见名知义。
- 模块内文件命名需与模块强关联（如 user 模块下的 DTO 均含 `user` 前缀）。

## 二、核心开发规范（模块化 + 代码风格）

### 1. 模块化设计规范（NestJS 核心）

NestJS 的核心是「模块化」，需严格遵循以下原则：

#### （1）模块职责单一

- 每个功能模块（如 `UserModule`、`OrderModule`）仅负责对应业务域的逻辑（用户管理、订单管理），不跨域处理其他业务。
- 公共模块（`CommonModule`）仅存放全局复用的组件（装饰器、过滤器、工具），不包含业务逻辑。

#### （2）模块导入/导出规范

- 模块内的组件（Service、Controller）默认仅模块内可见，需通过 `exports` 显式导出才能被其他模块使用。
- 导入模块时，优先导入「功能模块」而非直接导入组件（如导入 `UserModule` 而非 `UserService`）。
- 全局模块（如 `ConfigModule.forRoot()`、`CommonModule`）需通过 `@Global()` 装饰器声明，避免重复导入。

```typescript
// user.module.ts（正确示例）
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserEntity } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
	imports: [TypeOrmModule.forFeature([UserEntity])], // 导入数据实体
	controllers: [UserController], // 注册控制器
	providers: [UserService], // 注册服务
	exports: [UserService], // 导出服务，供其他模块使用
})
export class UserModule {}

// app.module.ts（根模块聚合）
import { Module } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';
import { OrderModule } from './modules/order/order.module';
import { CommonModule } from './common/common.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';

@Module({
	imports: [
		ConfigModule.forRoot(), // 全局配置模块
		DatabaseModule, // 数据库全局模块
		CommonModule, // 公共全局模块
		UserModule, // 功能模块
		OrderModule, // 功能模块
	],
})
export class AppModule {}
```

#### （3）共享依赖管理

- 第三方依赖（如数据库、缓存、消息队列）应封装为独立模块（如 `DatabaseModule`、`CacheModule`），通过 `exports` 导出服务，其他模块统一导入使用。
- 避免在多个模块中重复配置第三方依赖（如统一在 `DatabaseModule` 配置 TypeORM，其他模块仅导入 `DatabaseModule`）。

### 2. 控制器（Controller）规范

控制器负责处理 HTTP 请求，仅做「请求接收、参数校验、响应返回」，不包含业务逻辑：

#### （1）路由设计规范

- 路由前缀统一使用小写复数名词（如 `/users`、`/orders`），符合 RESTful 风格。
- 子资源路由使用父资源 ID 关联（如 `/users/:userId/orders` 表示用户的订单）。
- HTTP 方法与业务动作对应：
  - `GET`：查询（单个/列表）
  - `POST`：创建
  - `PUT`：全量更新
  - `PATCH`：部分更新
  - `DELETE`：删除

```typescript
// user.controller.ts（正确示例）
import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	Query,
	UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RoleGuard, Roles } from '../../common/decorators/role.decorator';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger'; // Swagger 文档

@ApiTags('用户管理') // Swagger 标签
@Controller('users') // 路由前缀：/users
@UseGuards(AuthGuard) // 全局认证守卫（需登录）
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Post()
	@Roles('admin') // 角色权限（仅管理员可创建）
	@UseGuards(RoleGuard)
	@ApiOperation({ summary: '创建用户' })
	async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
		const user = await this.userService.create(createUserDto);
		return this.transformToResponse(user);
	}

	@Get()
	@ApiOperation({ summary: '查询用户列表' })
	async findAll(
		@Query('page') page = 1,
		@Query('limit') limit = 10
	): Promise<UserResponseDto[]> {
		const users = await this.userService.findAll({ page, limit });
		return users.map(this.transformToResponse);
	}

	@Get(':id')
	@ApiOperation({ summary: '查询单个用户' })
	@ApiParam({ name: 'id', description: '用户ID', type: Number })
	async findOne(@Param('id') id: number): Promise<UserResponseDto> {
		const user = await this.userService.findOne(id);
		return this.transformToResponse(user);
	}

	@Put(':id')
	@ApiOperation({ summary: '全量更新用户' })
	async update(
		@Param('id') id: number,
		@Body() updateUserDto: UpdateUserDto
	): Promise<UserResponseDto> {
		const user = await this.userService.update(id, updateUserDto);
		return this.transformToResponse(user);
	}

	@Delete(':id')
	@Roles('admin')
	@UseGuards(RoleGuard)
	@ApiOperation({ summary: '删除用户' })
	async remove(@Param('id') id: number): Promise<void> {
		await this.userService.remove(id);
	}

	// 私有辅助方法：实体转响应DTO（避免重复代码）
	private transformToResponse(user: UserEntity): UserResponseDto {
		return {
			id: user.id,
			username: user.username,
			email: user.email,
			createdAt: user.createdAt,
		};
	}
}
```

#### （2）参数处理规范

- 使用 DTO 类（结合 `class-validator`/`class-transformer`）校验请求参数，禁止在控制器中手动校验。
- 路径参数（`@Param`）、查询参数（`@Query`）、请求体（`@Body`）需显式声明类型，通过管道自动转换（如 `ParseIntPipe` 将字符串 ID 转为数字）。
- 复杂查询参数建议封装为 DTO（如 `UserQueryDto`），避免控制器方法参数过多。

```typescript
// create-user.dto.ts（DTO 校验示例）
import {
	IsString,
	IsEmail,
	MinLength,
	MaxLength,
	IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
	@ApiProperty({ description: '用户名', example: 'zhangsan' })
	@IsString({ message: '用户名必须为字符串' })
	@MinLength(3, { message: '用户名长度不能少于3个字符' })
	@MaxLength(20, { message: '用户名长度不能超过20个字符' })
	username: string;

	@ApiProperty({ description: '邮箱', example: 'zhangsan@example.com' })
	@IsEmail({}, { message: '邮箱格式不正确' })
	email: string;

	@ApiProperty({ description: '密码', example: '123456a' })
	@MinLength(6, { message: '密码长度不能少于6个字符' })
	password: string;

	@ApiProperty({ description: '备注', example: '普通用户', required: false })
	@IsOptional()
	@IsString({ message: '备注必须为字符串' })
	remark?: string;
}
```

#### （3）响应格式化

- 通过全局拦截器统一响应格式（如 `TransformInterceptor`），避免控制器中重复编写响应结构。
- 响应格式建议包含 `code`（状态码）、`message`（描述）、`data`（数据）三部分：

```typescript
// common/interceptors/transform.interceptor.ts
import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// 统一响应格式接口
export interface Response<T> {
	code: number;
	message: string;
	data: T;
}

@Injectable()
export class TransformInterceptor<T>
	implements NestInterceptor<T, Response<T>>
{
	intercept(
		context: ExecutionContext,
		next: CallHandler
	): Observable<Response<T>> {
		return next.handle().pipe(
			map((data) => ({
				code: 200, // 成功状态码
				message: '操作成功',
				data: data || null, // 无数据时返回 null
			}))
		);
	}
}

// main.ts 注册全局拦截器
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// 全局响应格式化拦截器
	app.useGlobalInterceptors(new TransformInterceptor());

	// 全局参数校验管道
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true, // 过滤掉未装饰的属性
			forbidNonWhitelisted: true, // 非白名单属性报错
			transform: true, // 自动转换参数类型（如字符串ID转数字）
		})
	);

	await app.listen(3000);
}
bootstrap();
```

### 3. 服务（Service）规范

服务负责核心业务逻辑，遵循「单一职责」，控制器通过依赖注入调用服务：

#### （1）业务逻辑封装

- 服务方法仅处理对应业务域的逻辑（如 `UserService` 仅处理用户相关操作），复杂逻辑拆分多个私有方法。
- 禁止在服务中直接处理 HTTP 请求/响应（如读取 `req`/`res` 对象），如需获取用户信息等上下文，通过自定义装饰器+守卫传递。
- 服务方法返回数据实体（Entity）或原始数据，由控制器转换为响应 DTO。

```typescript
// user.service.ts（正确示例）
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CryptoUtil } from '../../common/utils/crypto.util';

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly cryptoUtil: CryptoUtil // 注入工具类
	) {}

	// 创建用户（核心业务逻辑）
	async create(createUserDto: CreateUserDto): Promise<UserEntity> {
		// 1. 密码加密（业务规则：密码不可逆加密）
		const hashedPassword = this.cryptoUtil.bcryptHash(createUserDto.password);

		// 2. 构建实体
		const user = this.userRepository.create({
			...createUserDto,
			password: hashedPassword,
			createdAt: new Date(),
		});

		// 3. 保存数据库
		return this.userRepository.save(user);
	}

	// 查询用户列表（分页）
	async findAll({ page = 1, limit = 10 }): Promise<UserEntity[]> {
		const skip = (page - 1) * limit;
		return this.userRepository.find({
			skip,
			take: limit,
			order: { createdAt: 'DESC' },
		});
	}

	// 查询单个用户（不存在则抛出异常）
	async findOne(id: number): Promise<UserEntity> {
		const user = await this.userRepository.findOneBy({ id });
		if (!user) {
			throw new NotFoundException(`用户ID=${id}不存在`);
		}
		return user;
	}

	// 更新用户（私有方法拆分：校验用户是否存在）
	async update(id: number, updateUserDto: UpdateUserDto): Promise<UserEntity> {
		const user = await this._checkUserExists(id); // 私有方法：校验存在性
		// 密码更新时重新加密
		if (updateUserDto.password) {
			updateUserDto.password = this.cryptoUtil.bcryptHash(
				updateUserDto.password
			);
		}
		const updatedUser = this.userRepository.merge(user, updateUserDto);
		return this.userRepository.save(updatedUser);
	}

	// 删除用户
	async remove(id: number): Promise<void> {
		const user = await this._checkUserExists(id);
		await this.userRepository.remove(user);
	}

	// 私有辅助方法：校验用户是否存在
	private async _checkUserExists(id: number): Promise<UserEntity> {
		const user = await this.userRepository.findOneBy({ id });
		if (!user) {
			throw new NotFoundException(`用户ID=${id}不存在`);
		}
		return user;
	}
}
```

#### （2）依赖注入规范

- 服务通过 `@Injectable()` 装饰器声明为可注入组件，通过构造函数注入依赖（如 Repository、其他 Service、工具类）。
- 优先注入「抽象接口」而非具体实现（如注入 `CacheService` 接口而非 `RedisCacheService`），提升可测试性和扩展性。
- 禁止在服务中使用 `new` 关键字创建依赖实例（如 `new CryptoUtil()`），必须通过依赖注入。

### 4. 数据访问层规范

复杂项目建议引入「Repository 层」封装数据访问逻辑，避免 Service 直接操作数据库：

#### （1）TypeORM Repository 规范

- 使用 NestJS 集成的 TypeORM，通过 `@InjectRepository(UserEntity)` 注入 Repository。
- 复杂查询（多条件、联表、分页）封装在 Repository 层或 Service 的私有方法中，避免控制器直接操作数据库。
- 数据库事务通过 `@Transactional()` 装饰器或 `getManager().transaction()` 实现，确保数据一致性。

```typescript
// user.repository.ts（数据访问层示例）
import { Repository, EntityRepository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { UserQueryDto } from './dto/user-query.dto';

// TypeORM 0.3+ 推荐使用 @EntityRepository 装饰器
@EntityRepository(UserEntity)
export class UserRepository extends Repository<UserEntity> {
	// 复杂查询：按条件分页查询用户
	async findByCondition(
		queryDto: UserQueryDto
	): Promise<[UserEntity[], number]> {
		const { page = 1, limit = 10, username, email, status } = queryDto;
		const skip = (page - 1) * limit;

		const query = this.createQueryBuilder('user')
			.skip(skip)
			.take(limit)
			.orderBy('user.createdAt', 'DESC');

		// 动态拼接查询条件
		if (username) {
			query.andWhere('user.username LIKE :username', {
				username: `%${username}%`,
			});
		}
		if (email) {
			query.andWhere('user.email = :email', { email });
		}
		if (status !== undefined) {
			query.andWhere('user.status = :status', { status });
		}

		return query.getManyAndCount(); // 返回数据+总数（分页用）
	}
}
```

### 5. 异常处理规范

统一异常处理流程，避免散落在代码中的 `try/catch`：

#### （1）自定义异常

- 业务异常继承 `BusinessException`，包含 `code`（错误码）和 `message`（描述）。
- 系统异常（如数据库连接失败、第三方服务超时）使用 NestJS 内置异常（如 `InternalServerErrorException`）或自定义系统异常。
- 禁止抛出无意义异常（如 `throw new Error('失败')`），必须包含明确的错误信息和错误码。

```typescript
// common/exceptions/business.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCodeEnum } from './error-code.enum';

export class BusinessException extends HttpException {
	constructor(
		message: string,
		private readonly errorCode: ErrorCodeEnum = ErrorCodeEnum.BUSINESS_ERROR,
		statusCode: HttpStatus = HttpStatus.BAD_REQUEST
	) {
		super({ message, errorCode, statusCode }, statusCode);
	}

	// 获取错误码
	getErrorCode(): ErrorCodeEnum {
		return this.errorCode;
	}
}

// 错误码枚举
export enum ErrorCodeEnum {
	BUSINESS_ERROR = 10001,
	USER_NOT_FOUND = 10002,
	PERMISSION_DENIED = 10003,
	SYSTEM_ERROR = 50001,
}
```

#### （2）全局异常过滤器

通过全局异常过滤器统一捕获所有异常，格式化响应格式：

```typescript
// common/filters/business-exception.filter.ts
import {
	ExceptionFilter,
	Catch,
	ArgumentsHost,
	HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorCodeEnum } from '../exceptions/error-code.enum';

@Catch(HttpException)
export class BusinessExceptionFilter implements ExceptionFilter {
	catch(exception: HttpException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();
		const status = exception.getStatus();

		// 处理业务异常
		if (exception instanceof BusinessException) {
			return response.status(status).json({
				code: exception.getErrorCode(),
				message: exception.message,
				data: null,
				path: request.url,
				timestamp: new Date().toISOString(),
			});
		}

		// 处理其他 HTTP 异常（如 404、403）
		return response.status(status).json({
			code: status,
			message: exception.message || '请求失败',
			data: null,
			path: request.url,
			timestamp: new Date().toISOString(),
		});
	}
}

// 全局系统异常过滤器（捕获非 HTTP 异常）
@Catch()
export class AllExceptionFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();

		console.error('系统异常：', exception); // 打印堆栈信息

		return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
			code: ErrorCodeEnum.SYSTEM_ERROR,
			message: '系统繁忙，请稍后重试',
			data: null,
			path: request.url,
			timestamp: new Date().toISOString(),
		});
	}
}

// main.ts 注册全局过滤器
app.useGlobalFilters(new AllExceptionFilter(), new BusinessExceptionFilter());
```

## 三、TypeScript 类型规范

NestJS 基于 TypeScript 开发，需严格遵循类型安全规范：

### 1. 类型定义规范

- 优先使用 `interface` 定义数据结构（如 DTO、接口返回类型），使用 `type` 定义复杂类型组合（如联合类型、交叉类型）。
- 禁止使用 `any` 类型（除非特殊场景且加注释说明），不确定类型时使用 `unknown` 并通过类型守卫缩小范围。
- 数组类型优先使用 `T[]` 而非 `Array<T>`（如 `UserEntity[]` 而非 `Array<UserEntity>`）。
- 可选属性使用 `?` 而非 `| undefined`（如 `remark?: string` 而非 `remark: string | undefined`）。

```typescript
// 正确示例
interface UserResponse {
	id: number;
	username: string;
	email: string;
	createdAt: Date;
	remark?: string; // 可选属性
}

// 复杂类型组合（用 type）
type PageResult<T> = {
	list: T[];
	total: number;
	page: number;
	limit: number;
};

// 联合类型（用 type）
type OrderStatus = 'pending' | 'paid' | 'cancelled';

// 禁止 any（错误示例）
function getUser(id: any): any {
	// 错误！
	return fetch(`/users/${id}`);
}

// 正确替代方案（用 unknown + 类型守卫）
function getUser(id: number): Promise<unknown> {
	return fetch(`/users/${id}`).then((res) => res.json());
}

// 类型守卫
function isUser(data: unknown): data is UserResponse {
	return (
		typeof data === 'object' &&
		data !== null &&
		'id' in data &&
		'username' in data
	);
}
```

### 2. DTO 类型规范

- DTO 类必须使用 `class-validator` 装饰器做参数校验（如 `@IsString()`、`@IsEmail()`）。
- DTO 类使用 `class-transformer` 装饰器做类型转换（如 `@Type(() => Number)` 将字符串转为数字）。
- 请求 DTO 与响应 DTO 分离（如 `CreateUserDto` 用于请求，`UserResponseDto` 用于响应），避免暴露敏感字段（如密码）。

```typescript
// update-user.dto.ts（请求 DTO 示例）
import {
	IsString,
	IsEmail,
	MinLength,
	IsOptional,
	Type,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
	@ApiPropertyOptional({ description: '用户名', example: 'lisi' })
	@IsOptional()
	@IsString({ message: '用户名必须为字符串' })
	@MinLength(3, { message: '用户名长度不能少于3个字符' })
	username?: string;

	@ApiPropertyOptional({ description: '邮箱', example: 'lisi@example.com' })
	@IsOptional()
	@IsEmail({}, { message: '邮箱格式不正确' })
	email?: string;

	@ApiPropertyOptional({ description: '年龄', example: 25 })
	@IsOptional()
	@Type(() => Number) // 自动将字符串转为数字
	age?: number;
}
```

## 四、工程化规范（工具链 + 流程）

### 1. 工具链配置

通过工具链强制落地代码风格和类型安全，推荐以下组合：

#### （1）ESLint + Prettier（代码格式化与校验）

- 安装依赖：
  ```bash
  npm install eslint prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-config-prettier eslint-plugin-prettier -D
  ```
- 配置文件 `.eslintrc.js`：
  ```javascript
  module.exports = {
  	parser: '@typescript-eslint/parser',
  	parserOptions: {
  		project: 'tsconfig.json',
  		tsconfigRootDir: __dirname,
  		sourceType: 'module',
  	},
  	plugins: ['@typescript-eslint', 'prettier'],
  	extends: [
  		'eslint:recommended',
  		'plugin:@typescript-eslint/recommended',
  		'plugin:@typescript-eslint/recommended-requiring-type-checking',
  		'plugin:prettier/recommended',
  	],
  	root: true,
  	env: {
  		node: true,
  		jest: true,
  	},
  	rules: {
  		'prettier/prettier': 'error',
  		'@typescript-eslint/no-explicit-any': [
  			'error',
  			{ allowTypedFunctionExpressions: true },
  		],
  		'@typescript-eslint/explicit-module-boundary-types': 'off',
  		'@typescript-eslint/no-unused-vars': [
  			'error',
  			{ argsIgnorePattern: '^_' },
  		],
  		'@typescript-eslint/interface-name-prefix': 'off',
  		'no-console': ['warn', { allow: ['warn', 'error'] }],
  	},
  };
  ```
- 配置文件 `.prettierrc`：
  ```json
  {
  	"semi": true,
  	"singleQuote": true,
  	"tabWidth": 2,
  	"trailingComma": "es5",
  	"printWidth": 120,
  	"arrowParens": "avoid"
  }
  ```

#### （2）TypeScript 配置（tsconfig.json）

```json
{
	"compilerOptions": {
		"module": "commonjs",
		"declaration": true,
		"removeComments": true,
		"emitDecoratorMetadata": true,
		"experimentalDecorators": true,
		"target": "ES2020",
		"sourceMap": true,
		"outDir": "./dist",
		"baseUrl": "./",
		"incremental": true,
		"skipLibCheck": true,
		"strictNullChecks": true, // 严格空值检查（避免 NPE）
		"noImplicitAny": true, // 禁止隐式 any
		"strictBindCallApply": true,
		"forceConsistentCasingInFileNames": true,
		"noFallthroughCasesInSwitch": true,
		"paths": {
			"@/*": ["src/*"] // 路径别名（需配合 webpack 或 ts-node 配置）
		}
	},
	"include": ["src/**/*"],
	"exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

#### （3）测试工具（Jest + Supertest）

- NestJS 内置 Jest 支持，用于单元测试和集成测试。
- 核心业务模块（Service、Controller）必须编写测试用例，测试覆盖率 ≥ 70%。
- 控制器测试使用 `Supertest` 模拟 HTTP 请求，服务测试通过 `jest.mock` 模拟依赖。

```typescript
// user.service.spec.ts（单元测试示例）
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { NotFoundException } from '@nestjs/common';

describe('UserService', () => {
	let service: UserService;
	let repository: MockType<Repository<UserEntity>>;
	let cryptoUtil: MockType<CryptoUtil>;

	// 模拟 Repository 和 CryptoUtil
	const mockRepository = () => ({
		create: jest.fn(),
		save: jest.fn(),
		findOneBy: jest.fn(),
		merge: jest.fn(),
		remove: jest.fn(),
	});

	const mockCryptoUtil = () => ({
		bcryptHash: jest.fn(),
	});

	type MockType<T> = {
		[P in keyof T]: jest.Mock<{}>;
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UserService,
				{ provide: getRepositoryToken(UserEntity), useFactory: mockRepository },
				{ provide: CryptoUtil, useFactory: mockCryptoUtil },
			],
		}).compile();

		service = module.get<UserService>(UserService);
		repository = module.get(getRepositoryToken(UserEntity));
		cryptoUtil = module.get(CryptoUtil);
	});

	describe('create', () => {
		it('should create a user successfully', async () => {
			// 准备测试数据
			const createDto: CreateUserDto = {
				username: 'test',
				email: 'test@example.com',
				password: '123456',
			};
			const hashedPassword = 'hashed123';
			const userEntity = {
				id: 1,
				...createDto,
				password: hashedPassword,
				createdAt: new Date(),
			};

			// 模拟依赖方法返回
			cryptoUtil.bcryptHash.mockReturnValue(hashedPassword);
			repository.create.mockReturnValue(userEntity);
			repository.save.mockResolvedValue(userEntity);

			// 执行测试
			const result = await service.create(createDto);

			// 断言
			expect(cryptoUtil.bcryptHash).toHaveBeenCalledWith(createDto.password);
			expect(repository.create).toHaveBeenCalledWith({
				...createDto,
				password: hashedPassword,
				createdAt: expect.any(Date),
			});
			expect(repository.save).toHaveBeenCalled();
			expect(result).toEqual(userEntity);
		});
	});

	describe('findOne', () => {
		it('should throw NotFoundException if user not found', async () => {
			// 模拟查询返回 null
			repository.findOneBy.mockResolvedValue(null);

			// 断言抛出异常
			await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
			expect(repository.findOneBy).toHaveBeenCalledWith({ id: 999 });
		});
	});
});
```

#### （4）API 文档（Swagger）

- 使用 `@nestjs/swagger` 自动生成 API 文档，便于前后端协作。
- 控制器、DTO 类必须添加 Swagger 装饰器（`@ApiTags`、`@ApiOperation`、`@ApiProperty`）。
- 启动应用后访问 `http://localhost:3000/api` 查看文档。

### 2. Git 提交与版本规范

与 Vue/Java/Python 规范一致，确保协作一致性：

#### （1）提交信息规范（Conventional Commits）

格式：`type(scope): subject`

- `type`：`feat`（新功能）、`fix`（修复 bug）、`docs`（文档）、`style`（代码风格）、`refactor`（重构）、`test`（测试）、`chore`（工具配置）。
- 示例：
  ```bash
  feat(user): 新增用户注册接口
  fix(order): 修复订单支付状态更新失败问题
  docs: 补充 Swagger 接口文档注释
  refactor(common): 重构全局响应拦截器
  ```

#### （2）分支管理（Git Flow 简化版）

- `main`：主分支（生产环境代码，禁止直接提交）。
- `develop`：开发分支（日常开发，从 `main` 拉出）。
- `feature/xxx`：功能分支（从 `develop` 拉出，开发完成后合并回 `develop`）。
- `fix/xxx`：bug 修复分支（从 `develop` 拉出，修复后合并回 `develop`）。
- `release/xxx`：发布分支（从 `develop` 拉出，测试通过后合并到 `main` 和 `develop`）。

#### （3）版本规范（语义化版本 SemVer）

版本号格式：`主版本号.次版本号.修订号`（如 `1.2.3`）

- 主版本号（X）：不兼容的 API 变更（如删除接口、修改参数结构）。
- 次版本号（Y）：向后兼容的新功能（如新增接口、优化逻辑）。
- 修订号（Z）：向后兼容的 bug 修复（如修复计算错误、安全漏洞）。

## 五、性能与安全规范

### 1. 性能优化

- **数据库优化**：
  - 高频查询字段加索引（如 `user.id`、`order.user_id`）。
  - 分页查询必须加 `limit` 和 `offset`，避免返回大量数据。
  - 联表查询尽量使用 `leftJoinAndSelect` 而非多次单表查询。
- **缓存优化**：
  - 热点数据（如配置信息、高频查询结果）用 Redis 缓存，通过 `CacheModule` 封装。
  - 使用 NestJS 内置的 `@Cacheable()` 装饰器简化缓存逻辑。
- **请求优化**：
  - 接口响应时间控制在 300ms 内，复杂逻辑异步处理（如使用 `@InjectQueue` 结合 Bull 实现任务队列）。
  - 避免重复请求（如通过 `CacheInterceptor` 缓存 GET 请求结果）。

### 2. 安全规范

- **防 SQL 注入**：使用 TypeORM 的参数绑定（如 `findOneBy({ id })`），禁止直接拼接 SQL。
- **防 XSS 攻击**：通过 `class-validator` 过滤危险字符，响应时对 HTML 标签转义。
- **身份认证**：使用 JWT 或 OAuth2.0 实现身份认证，通过 `AuthGuard` 全局拦截未登录请求。
- **权限控制**：通过 `RoleGuard` 实现基于角色的权限控制（如 `admin` 才能删除用户）。
- **敏感信息保护**：密码使用 BCrypt 加密存储，传输时用 HTTPS，响应中隐藏敏感字段（如密码、手机号）。
- **请求限流**：使用 `rate-limiter-flexible` 或 NestJS 内置限流机制，防止接口被恶意刷取。

## 总结

NestJS 开发规范的核心是 **“模块化设计 + 类型安全 + 工程化落地”**：

1. 严格遵循 NestJS 模块化思想，确保模块高内聚、低耦合，提升可维护性。
2. 利用 TypeScript 类型系统，避免 `any` 类型，通过 DTO 校验和类型守卫确保代码安全。
3. 通过 ESLint、Prettier、Jest、Swagger 等工具链，强制规范落地，提升开发效率和协作体验。
4. 重视异常处理、性能优化和安全防护，确保项目稳定可靠。

可根据项目规模调整规范（如小型项目可简化 Repository 层和测试要求），关键是团队统一认知并严格执行。如果需要，可提供 **NestJS 规范项目模板**（含完整配置文件、目录结构、示例代码）。
