# NestJS 技术栈

## 技术架构总览

前后端分离架构：

前端：Vue 3 + Vite + TypeScript（推荐使用 Ant Design Vue 或 Naive UI）

后端：NestJS + TypeScript，RESTful 或 GraphQL API

数据库：PostgreSQL / MySQL（推荐 PostgreSQL）

接口文档：Swagger 自动生成

身份认证：JWT + RBAC 权限控制

容器化部署：Docker + Docker Compose + Nginx

持续集成：GitHub Actions / GitLab CI

## 技术选型

| 功能       | 技术选型                            |
| ---------- | ----------------------------------- |
| 框架       | [NestJS](https://nestjs.com/)       |
| 数据库 ORM | Prisma                              |
| 权限控制   | 自定义装饰器 + RBAC 模型            |
| 身份认证   | `@nestjs/passport` + JWT            |
| 配置管理   | `@nestjs/config`                    |
| 日志       | `winston` 或 `nestjs-pino`          |
| 接口文档   | `@nestjs/swagger`                   |
| 文件上传   | `@nestjs/platform-express` + multer |
| 缓存       | Redis（使用 `cache-manager`）       |
| 任务队列   | BullMQ（可选）                      |
| 定时任务   | `@nestjs/schedule`                  |
| 单元测试   | Jest                                |
| 部署       | Docker                              |

## 项目结构

```js
src/
├── auth/ # 认证模块（登录、注册、JWT）
├── users/ # 用户模块
├── roles/ # 角色权限模块
├── permissions/ # 权限资源模块
├── config/ # 应用配置模块
├── common/ # 公共模块（装饰器、拦截器、过滤器等）
├── guards/ # 守卫（权限守卫）
├── interceptors/ # 拦截器
├── middlewares/ # 中间件
├── upload/ # 文件上传模块
├── logger/ # 日志模块
└── app.module.ts
```

## 开发流程

- **需求分析**：与企业相关人员沟通，明确管理后台的功能需求和业务流程。
- **技术选型**：基于需求分析结果，选择合适的前端框架（Vue3）和后端框架（NestJS）。
- **环境搭建**：安装 Node.js、npm/yarn 等开发工具，创建 Vue3 和 NestJS 项目。
- **前端开发**：使用 Vue3 构建前端界面，编写页面组件和样式，实现页面布局和交互逻辑。
- **后端开发**：使用 NestJS 构建后端服务，编写控制器、服务和中间件，处理前端发送的请求。
- **数据库设计**：根据业务需求设计数据库表结构，使用 TypeORM 等 ORM 库与数据库进行交互。
- **API 接口设计**：定义前后端交互的 API 接口，确保数据的一致性和安全性。
- **前后端联调**：通过 API 接口进行前后端联调，确保数据的正确传输和处理。
- **测试与优化**：编写单元测试和集成测试，确保系统的稳定性和功能性；对前端页面和后端服务进行性能优化。
- **部署与运维**：将前端应用和后端服务部署到服务器上，配置数据库和环境参数；进行系统的监控和运维工作。
