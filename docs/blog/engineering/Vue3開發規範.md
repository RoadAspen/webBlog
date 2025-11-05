# Vue3 項目開發規範

Vue 项目开发规范的核心目标是 **统一代码风格、提升可维护性、降低协作成本**，
以下是结合 Vue 3 最佳实践、ESLint/Prettier 规范、工程化流程的完整规范方案，适用于中大型团队协作项目。

## 一、基础规范（文件/目录结构）

### 1. 项目目录结构（基于 Vue CLI/Vite 标准）

```
src/
├── api/                # 接口请求（按模块拆分）
│   ├── user.js         # 用户相关接口
│   ├── goods.js        # 商品相关接口
│   └── index.js        # 接口请求封装（axios 配置）
├── assets/             # 静态资源（分类存放）
│   ├── icons/          # 图标（svg/png）
│   ├── images/         # 图片资源
│   ├── styles/         # 全局样式
│   │   ├── reset.scss  # 样式重置
│   │   ├── variables.scss  # 全局变量
│   │   └── index.scss  # 样式入口（引入全局样式）
├── components/         # 公共组件（按复用性/业务拆分）
│   ├── common/         # 通用基础组件（如 Button、Input）
│   │   ├── Button/
│   │   │   ├── index.vue
│   │   │   └── Button.scss
│   ├── business/       # 业务组件（如 OrderCard、UserForm）
├── composables/        # Vue 3 组合式函数（Vue 2 对应 mixins）
│   ├── useUser.js      # 用户相关逻辑复用
│   └── useRequest.js   # 请求相关逻辑复用
├── router/             # 路由配置
│   ├── index.js        # 路由入口
│   └── routes.js       # 路由规则（按模块拆分）
├── store/              # 状态管理（Pinia/Vuex）
│   ├── modules/        # 模块拆分（如 user、cart）
│   └── index.js        #  store 入口
├── views/              # 页面组件（路由对应页面）
│   ├── Home/           # 首页（文件夹命名大写开头）
│   │   ├── index.vue   # 页面入口
│   │   ├── components/ # 页面私有组件（仅当前页面使用）
│   │   └── Home.scss   # 页面样式
│   └── User/           # 用户页面
├── utils/              # 工具函数（通用工具）
│   ├── format.js       # 格式化工具（日期、金额）
│   └── valid.js        # 校验工具（手机号、邮箱）
├── App.vue             # 根组件
└── main.js             # 入口文件
```

### 2. 文件命名规范

| 文件类型                  | 命名规则                    | 示例                            |
| ------------------------- | --------------------------- | ------------------------------- |
| 页面组件（views 下）      | 大驼峰命名（PascalCase）    | Home/index.vue、UserDetail.vue  |
| 公共组件（components 下） | 大驼峰命名                  | Button/index.vue、OrderCard.vue |
| 工具函数/接口文件         | 小驼峰命名（camelCase）     | format.js、userApi.js           |
| 样式文件                  | 与组件名一致（ kebab-case） | button.scss、order-card.scss    |
| 路由/状态模块             | 小驼峰命名                  | userRoutes.js、cartStore.js     |

**注意**：

- 组件文件夹与组件名保持一致（如 `Button` 文件夹下是 `index.vue`），便于导入和查找。
- 页面私有组件放在页面文件夹下的 `components` 目录，避免公共组件目录冗余。

## 二、代码规范（Vue 语法/JS/HTML/CSS）

### 1. Vue 组件规范（核心）

#### （1）组件结构顺序（模板 → 脚本 → 样式）

```vue
<!-- 正确顺序：template → script → style -->
<template>
	<!-- 模板内容 -->
</template>

<script setup>
	// Vue 3 组合式 API（推荐）
	// 或 Vue 2 选项式 API
</script>

<style scoped>
	/* 样式内容 */
</style>
```

#### （2）Vue 3 组合式 API（`<script setup>`）规范

- **导入顺序**：外部依赖 → 组件 → 工具函数 → 样式

```javascript
<script setup>
// 1. 外部依赖（Vue 内置 API、第三方库）
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

// 2. 组件导入（公共组件 → 页面私有组件）
import Button from '@/components/common/Button'
import UserCard from './components/UserCard'

// 3. 工具函数/接口导入
import { formatDate } from '@/utils/format'
import { getUserInfo } from '@/api/user'

// 4. 状态定义（响应式数据 → 计算属性 → 方法）
const userId = ref('')
const userInfo = ref({})

// 计算属性（使用 computed 而非手动逻辑）
const isVip = computed(() => userInfo.value.vipLevel > 0)

// 方法（按“业务逻辑优先级”排序，公共方法在前，事件回调在后）
const fetchUserInfo = async () => {
  const res = await getUserInfo(userId.value)
  userInfo.value = res.data
}

const handleEdit = () => {
  // 编辑逻辑
}

// 生命周期钩子（按执行顺序排序：onMounted → onUpdated → onUnmounted）
onMounted(() => {
  fetchUserInfo()
})
</script>
```

#### （3）Vue 2 选项式 API 规范（兼容旧项目）

- 选项顺序：`data → props → computed → watch → methods → 生命周期钩子`

```javascript
<script>
export default {
  name: 'UserList', // 组件名（与文件名一致）
  props: {
    // props 定义（见下文 props 规范）
    userId: {
      type: String,
      required: true,
      default: ''
    }
  },
  data() {
    return {
      userList: []
    }
  },
  computed: {
    validUserList() {
      return this.userList.filter(item => item.status === 1)
    }
  },
  watch: {
    userId(newVal) {
      this.fetchUserList(newVal)
    }
  },
  methods: {
    async fetchUserList(id) {
      // 接口请求逻辑
    },
    handleClick(item) {
      // 事件回调
    }
  },
  mounted() {
    this.fetchUserList(this.userId)
  }
}
</script>
```

#### （4）Props 规范

- 必须指定 `type`，必填项需加 `required: true`，非必填项需设 `default`
- 复杂类型（对象/数组）的 `default` 需用函数返回（避免复用组件时共享引用）
- 加 `validator` 校验（必要时）

```javascript
// 正确示例
props: {
  // 基础类型
  pageSize: {
    type: Number,
    required: false,
    default: 10
  },
  // 对象类型（default 用函数）
  userConfig: {
    type: Object,
    required: false,
    default: () => ({
      showAvatar: true,
      showName: true
    }),
    validator: (value) => {
      // 校验是否包含必要字段
      return ['showAvatar', 'showName'].every(key => key in value)
    }
  },
  // 多类型
  id: {
    type: [String, Number],
    required: true
  }
}
```

#### （5）模板（Template）规范

- 根节点唯一（Vue 2 必需，Vue 3 可多根节点但建议统一用单根）
- 指令缩写：`v-bind` 用 `:`，`v-on` 用 `@`，`v-if` 优先于 `v-show`（频繁切换用 `v-show`）
- 循环必须加 `key`（且 `key` 不能是索引，用唯一标识如 `id`）
- 避免模板内复杂逻辑（复杂逻辑抽成计算属性或方法）

```vue
<!-- 正确示例 -->
<template>
	<div class="user-list">
		<!-- 循环加 key（用唯一标识） -->
		<div
			v-for="user in validUserList"
			:key="user.id"
			<!--
			不推荐
			:key="index"
			--
		>
			class="user-item" >
			<!-- 指令缩写 -->
			<img :src="user.avatar" :alt="user.name" />
			<span>{{ user.name }}</span>
			<!-- 复杂逻辑抽计算属性，不写在模板内 -->
			<span class="vip-tag" v-if="user.isVip">VIP</span>

			<!-- 事件绑定 -->
			<button @click="handleEdit(user.id)">编辑</button>
		</div>
	</div>
</template>
```

### 2. JavaScript/TypeScript 规范

- 遵循 **ESLint + Prettier** 规则（强制统一代码风格）
- 变量命名：
  - 响应式数据/普通变量：小驼峰（`userName`、`pageSize`）
  - 常量：全大写+下划线（`const MAX_PAGE_SIZE = 50`）
  - 避免单字母变量（`i` 循环变量除外）
- 函数命名：小驼峰（`fetchUserInfo`、`formatDate`），事件回调前缀 `handle`（`handleClick`、`handleSubmit`）
- 避免 `var`，用 `let/const`（优先 `const`，变量需要重新赋值时用 `let`）
- 箭头函数：单行箭头函数可省略大括号（`res => res.data`），多行必须加大括号和 `return`
- 异步逻辑：用 `async/await` 替代 `Promise.then`（代码更简洁）

```javascript
// 正确示例
const fetchData = async (id) => {
	try {
		const res = await axios.get(`/api/user/${id}`);
		return res.data;
	} catch (error) {
		console.error('请求失败：', error);
		throw error; // 抛出错误让调用方处理
	}
};

// 错误示例（不推荐）
function fetchData(id) {
	return axios
		.get(`/api/user/${id}`)
		.then(function (res) {
			return res.data;
		})
		.catch(function (err) {
			console.log(err);
		});
}
```

### 3. CSS/SCSS 规范

- 样式作用域：组件内样式加 `scoped`（避免样式污染），全局样式写在 `assets/styles` 下
- 命名规范：采用 **BEM 命名法**（块-元素-修饰符），避免嵌套过深（最多 3 层）
- 样式顺序：布局相关（`display`、`position`）→ 盒模型（`width`、`margin`）→ 样式（`color`、`background`）→ 其他（`transition`）
- 避免 `!important`（特殊场景需加注释说明）

```scss
<!-- 组件内样式（scoped + BEM） -->
<style scoped lang="scss">
// 块（block）：组件名
.user-list {
  display: flex;
  flex-wrap: wrap;
  margin: 20px 0;

  // 元素（element）：块内子元素（__ 连接）
  &__item {
    width: 200px;
    padding: 16px;
    margin-right: 16px;
    background: #fff;
    border-radius: 8px;

    // 修饰符（modifier）：状态/样式变体（-- 连接）
    &--active {
      border: 2px solid #1890ff;
    }
  }

  // 子元素样式（最多 3 层嵌套）
  &__item-title {
    font-size: 16px;
    color: #333;
  }
}
</style>
```

## 三、工程化规范（ESLint/Prettier/提交规范）

### 1. ESLint + Prettier 配置（强制落地）

#### （1）安装依赖

```bash
# Vue 3 项目
npm install eslint eslint-plugin-vue @vue/eslint-config-prettier prettier -D

# Vue 2 项目
npm install eslint eslint-plugin-vue@7 @vue/eslint-config-prettier@6 prettier -D
```

#### （2）根目录创建 `.eslintrc.js`

```javascript
module.exports = {
	root: true,
	env: {
		browser: true,
		node: true,
		es2021: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:vue/vue3-essential', // Vue 3 用这个；Vue 2 用 'plugin:vue/essential'
		'@vue/eslint-config-prettier', // 整合 Prettier（避免规则冲突）
	],
	parserOptions: {
		ecmaVersion: 'latest',
		parser: '@babel/eslint-parser', // Vue 2 需安装 @babel/eslint-parser
	},
	rules: {
		// 自定义规则（覆盖默认）
		'vue/multi-word-component-names': 'off', // 关闭组件名多单词校验（如需强制可设为 'error'）
		'vue/no-unused-vars': 'error', // 未使用的变量报错
		'no-console': ['warn', { allow: ['warn', 'error'] }], // 允许 console.warn/error
		'prettier/prettier': 'error', // Prettier 规则报错
	},
};
```

#### （3）根目录创建 `.prettierrc`（Prettier 规则）

```json
{
	"semi": true, // 句尾加分号
	"singleQuote": true, // 单引号
	"tabWidth": 2, // 缩进 2 空格
	"trailingComma": "es5", // 对象/数组末尾加逗号
	"printWidth": 120, // 换行宽度
	"arrowParens": "avoid" // 箭头函数单参数省略括号
}
```

#### （4）VSCode 配置（自动格式化）

在 `.vscode/settings.json` 中添加：

```json
{
	"editor.formatOnSave": true, // 保存自动格式化
	"editor.defaultFormatter": "esbenp.prettier-vscode", // 默认格式化工具
	"editor.codeActionsOnSave": {
		"source.fixAll.eslint": true // 保存自动修复 ESLint 错误
	}
}
```

### 2. Git 提交规范（Conventional Commits）

#### （1）提交信息格式

```bash
<type>(<scope>): <subject>

<body>

<footer>
```

- `type`：提交类型（必填）
  - `feat`：新功能
  - `fix`：修复 bug
  - `docs`：文档更新
  - `style`：代码风格调整（不影响逻辑）
  - `refactor`：重构（既不是新功能也不是修 bug）
  - `test`：添加/修改测试
  - `chore`：构建/工具配置调整（如依赖更新、脚本修改）
- `scope`：影响范围（可选，如 `user`、`cart`、`router`）
- `subject`：提交描述（简洁明了，不超过 50 字）
- `body`：详细描述（可选，多行文本）
- `footer`：备注（可选，如关闭 issue：`Closes #123`）

#### （2）示例

```bash
# 新功能
feat(user): 新增用户头像上传功能

# 修复 bug
fix(cart): 修复购物车结算时数量计算错误问题

# 文档更新
docs: 更新 README 中的安装步骤

# 重构
refactor(utils): 优化日期格式化函数逻辑
```

#### （3）强制校验（用 husky + commitlint）

- 安装依赖：
  ```bash
  npm install husky @commitlint/cli @commitlint/config-conventional -D
  ```
- 根目录创建 `commitlint.config.js`：
  ```javascript
  module.exports = {
  	extends: ['@commitlint/config-conventional'],
  };
  ```
- 启用 husky 钩子：
  ```bash
  npx husky install
  npx husky add .husky/commit-msg 'npx --no -- commitlint --edit $1'
  ```
- 提交不符合规范时，Git 会拒绝提交，强制团队遵循。

## 四、性能与安全规范

### 1. 性能优化

- 组件懒加载（路由级别 + 组件级别）：

  ```javascript
  // 路由懒加载（Vue Router）
  const UserDetail = () => import('@/views/User/UserDetail.vue');

  // 组件懒加载（页面内）
  const OrderModal = defineAsyncComponent(() =>
  	import('./components/OrderModal.vue')
  );
  ```

- 避免不必要的渲染：
  - 用 `v-memo` 缓存列表项（大数据列表优化）
  - 计算属性依赖精准（避免依赖无关数据）
  - 组件 props 避免传递冗余数据
- 图片优化：用 `v-lazy` 懒加载图片，使用 WebP 格式，设置合适尺寸
- 接口请求优化：防抖节流（搜索框输入）、请求缓存（不常变数据）、批量请求合并

### 2. 安全规范

- 防 XSS 攻击：避免直接插入 HTML（如必须用 `v-html`，需先过滤危险标签/属性）
- 接口请求：用 axios 拦截器统一处理 token，避免明文存储敏感信息（如密码）
- 权限控制：前端仅做“显示控制”，核心权限逻辑必须在后端校验（如接口鉴权）
- 避免使用 `eval`、`with` 等危险语法

## 五、协作与发布规范

### 1. 分支管理（Git Flow 简化版）

- `main`：主分支（生产环境代码，禁止直接提交）
- `develop`：开发分支（日常开发，从 `main` 拉出）
- `feature/xxx`：功能分支（从 `develop` 拉出，开发完成后合并回 `develop`）
- `fix/xxx`：bug 修复分支（从 `develop` 拉出，修复后合并回 `develop`）
- `release/xxx`：发布分支（从 `develop` 拉出，测试通过后合并到 `main` 和 `develop`）

### 2. 代码评审（Code Review）

- 功能开发完成后，提交 PR/MR 到 `develop` 分支，需至少 1 名团队成员评审通过
- 评审重点：代码规范、逻辑正确性、性能问题、安全风险

### 3. 发布规范

- 版本号遵循 **语义化版本（SemVer）**：`主版本号.次版本号.修订号`（如 `1.2.3`）
  - 主版本号（X）：不兼容的 API 变更
  - 次版本号（Y）：向后兼容的新功能
  - 修订号（Z）：向后兼容的问题修复
- 发布前生成 CHANGELOG（记录版本变更内容），用 `standard-version` 自动生成：
  ```bash
  npm install standard-version -D
  # package.json 新增脚本："release": "standard-version"
  npm run release # 自动更新版本号、生成 CHANGELOG.md
  ```

## 六、文档规范

- 组件文档：公共组件需写 README.md，说明 props、事件、插槽、使用示例
- 接口文档：用 Swagger/Postman 维护，或在 `api` 目录下写接口说明
- 项目文档：根目录 README.md 包含项目介绍、安装步骤、启动命令、目录说明、贡献规范
- 注释规范：
  - 复杂逻辑加单行注释（`// 处理用户状态变更，因为 xxx`）
  - 工具函数/组件加 JSDoc 注释（说明功能、参数、返回值）
  ```javascript
  /**
   * 格式化日期
   * @param {string|Date} date - 日期对象或字符串
   * @param {string} format - 格式化模板（如 'YYYY-MM-DD'）
   * @returns {string} 格式化后的日期字符串
   */
  const formatDate = (date, format = 'YYYY-MM-DD') => {
  	// 逻辑...
  };
  ```

## 总结

以上规范可根据团队规模和项目特点灵活调整（如小型项目可简化分支管理和文档要求），核心是 **“强制落地”** —— 通过 ESLint/Prettier、husky、commitlint 等工具将规范自动化，减少人工约束成本。

建议项目初始化时就搭建好规范相关配置，团队成员统一 IDE 配置（VSCode + 插件），确保代码风格一致。如果需要，可提供 **Vue 3 + Vite 规范项目模板**，直接集成上述所有配置。
