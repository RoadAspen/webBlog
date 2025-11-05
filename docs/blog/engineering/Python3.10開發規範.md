# Python 3.10 开发规范

Python 3.10 开发规范的核心是 **遵循 PEP 标准、提升代码可读性、确保兼容性与可维护性**，结合 Python 3.10 新特性（如结构模式匹配、类型提示增强），以下是覆盖代码风格、工程结构、类型提示、最佳实践等的完整规范方案，适用于团队协作与生产级项目。

## 一、基础规范（遵循 PEP 核心标准）

Python 官方通过 PEP（Python Enhancement Proposals）定义开发规范，核心需遵循以下 3 个 PEP 标准：

### 1. 代码风格：PEP 8

PEP 8 是 Python 代码风格的黄金标准，需强制遵守（建议用工具自动校验）：

- **缩进**：4 个空格（禁止用制表符 `Tab`），嵌套层级不超过 4 层（超过需拆分函数/类）。
- **行宽**：单行代码不超过 88 字符（PEP 8 推荐，适配大多数终端），字符串过长用括号自动换行（避免反斜杠 `\`）。

  ```python
  # 正确（括号自动换行）
  long_text = (
      "这是一段很长的字符串，通过括号包裹实现自动换行，"
      "无需反斜杠，可读性更强"
  )

  # 错误（不推荐反斜杠）
  long_text = "这是一段很长的字符串，通过反斜杠换行\
  可读性较差"
  ```

- **空行**：
  - 模块级代码（函数/类外）：顶级函数/类之间空 2 行，类内方法之间空 1 行。
  - 函数内：逻辑块之间空 1 行（区分不同功能）。
- **导入规范**：

  - 顺序：标准库 → 第三方库 → 自定义库（每组之间空 1 行）。
  - 禁止导入未使用的模块/变量，禁止通配符导入（`from module import *`）。
  - 复杂导入用括号换行，避免多行导入语句。

    ```python
    # 正确
    import os
    import sys
    from datetime import datetime, timedelta

    import requests
    from flask import Flask, request

    from my_project.utils import format_date
    from my_project.models import User

    # 复杂导入换行
    from my_project.module import (
        func1,
        func2,
        ClassA,
        ClassB
    )
    ```

- **命名规范**：
  | 类型 | 命名规则 | 示例 |
  |--------------------|---------------------------|-------------------------------|
  | 变量/函数/方法 | 蛇形命名（snake*case） | `user_name`、`fetch_user_info()` |
  | 类/异常 | 大驼峰命名（PascalCase） | `UserModel`、`ValidationError` |
  | 常量 | 全大写+下划线（UPPER_SNAKE_CASE） | `MAX_RETRY_COUNT = 3` |
  | 模块 | 小写蛇形（snake_case） | `user_service.py`、`data_utils.py` |
  | 包（文件夹） | 小写（无下划线，简洁为主）| `api`、`models`、`utils` |
  | 私有变量/方法 | 前缀单下划线（*） | `_private_method()`、`_internal_var` |
  | 强私有变量/方法 | 前缀双下划线（**） | `**strong_private_var`（避免滥用，仅需避免子类覆盖时使用） |

### 2. 代码文档：PEP 257（Docstring 规范）

所有公共模块、函数、类、方法必须加 Docstring（文档字符串），推荐用 **Google 风格** 或 **NumPy 风格**（团队统一即可）。

- 模块级 Docstring：放在文件开头，说明模块功能、依赖、作者、版本等。
- 函数/方法 Docstring：说明功能、参数、返回值、异常、示例（复杂逻辑必须加示例）。
- 类 Docstring：说明类的作用、属性、方法概述，类属性需单独说明。

```python
# Google 风格示例（推荐，简洁易读）
"""用户服务模块，处理用户相关的查询、创建、更新逻辑。

依赖：
    - requests>=2.31.0
    - my_project.models.User
"""

class UserService:
    """用户服务类，提供用户管理核心功能。

    属性：
        db_client: DatabaseClient - 数据库连接客户端
        timeout: int - 请求超时时间（默认 5 秒）
    """

    def __init__(self, db_client, timeout: int = 5):
        """初始化 UserService 实例。

        参数：
            db_client: DatabaseClient - 数据库连接客户端（必须传入）
            timeout: int - 请求超时时间，默认 5 秒
        """
        self.db_client = db_client
        self.timeout = timeout

    def get_user_by_id(self, user_id: int) -> dict | None:
        """根据用户 ID 查询用户信息。

        参数：
            user_id: int - 用户唯一标识（正整数）

        返回：
            dict | None - 成功返回用户信息字典（含 id、name、email），无数据返回 None

        异常：
            ValueError - 当 user_id 为非正整数时抛出
            DatabaseError - 数据库查询失败时抛出

        示例：
            >>> service = UserService(db_client)
            >>> service.get_user_by_id(1001)
            {'id': 1001, 'name': '张三', 'email': 'zhangsan@example.com'}
        """
        if not isinstance(user_id, int) or user_id <= 0:
            raise ValueError("user_id 必须是正整数")
        try:
            return self.db_client.query(f"SELECT * FROM user WHERE id = {user_id}")
        except Exception as e:
            raise DatabaseError(f"查询用户失败：{str(e)}") from e
```

### 3. 类型提示：PEP 484 + Python 3.10 增强特性

Python 3.10 对类型提示的支持更完善（如联合类型 `|`、参数默认值类型提示），**公共接口（函数/类）必须添加类型提示**，私有接口建议添加（提升可读性）。

- 基础类型：`int`、`str`、`bool`、`float`、`list`、`dict`、`tuple` 等。
- 复杂类型：从 `typing` 模块导入（Python 3.9+ 可直接用内置集合类型，3.10 推荐兼容写法）。
- 联合类型：用 `|` 替代 `Union`（Python 3.10+ 支持）。
- 可选类型：`Optional[T]` 或 `T | None`（等价，推荐后者更简洁）。
- 类型别名：复杂类型用 `TypeAlias` 定义（提升可读性）。

```python
# Python 3.10 类型提示示例
from typing import List, Dict, TypeAlias, Callable, Optional
from datetime import datetime

# 类型别名（复杂类型简化）
UserDict: TypeAlias = Dict[str, int | str | datetime]  # 用户信息字典类型
ResultCallback: TypeAlias = Callable[[bool, str], None]  # 回调函数类型

def process_user(
    user: UserDict,
    enable_notify: bool = False,
    callback: Optional[ResultCallback] = None
) -> bool | str:
    """处理用户数据。

    参数：
        user: UserDict - 用户信息字典
        enable_notify: bool - 是否启用通知（默认 False）
        callback: ResultCallback | None - 处理完成后的回调函数（可选）

    返回：
        bool | str - 成功返回 True，失败返回错误信息字符串
    """
    if not user.get("id"):
        return "用户 ID 缺失"
    # 处理逻辑...
    if callback:
        callback(True, "处理成功")
    return True
```

## 二、工程结构规范（生产级项目）

推荐采用模块化、分层的目录结构，便于扩展和维护：

```
my_project/                  # 项目根目录（Git 仓库根目录）
├── .gitignore               # Git 忽略文件（Python 模板 + 环境文件）
├── pyproject.toml           # 项目配置（依赖、工具链、规范校验）
├── README.md                # 项目文档（安装、启动、目录说明）
├── CHANGELOG.md             # 版本变更日志
├── requirements/            # 依赖分组（按环境拆分）
│   ├── base.txt             # 基础依赖（生产/开发共用）
│   ├── dev.txt              # 开发依赖（pytest、flake8 等）
│   └── prod.txt             # 生产依赖（仅运行时必需）
├── src/                     # 源代码目录（Python 3.7+ 推荐，避免模块名冲突）
│   ├── my_project/          # 项目核心模块（与项目名一致）
│   │   ├── __init__.py      # 模块入口（暴露公共 API）
│   │   ├── api/             # 接口层（对外提供的 API 接口）
│   │   │   ├── __init__.py
│   │   │   ├── user_api.py  # 用户相关接口
│   │   │   └── order_api.py # 订单相关接口
│   │   ├── core/            # 核心层（业务逻辑、配置）
│   │   │   ├── __init__.py
│   │   │   ├── config.py    # 配置管理（环境变量、配置文件）
│   │   │   └── user_service.py # 核心业务逻辑
│   │   ├── models/          # 数据模型层（数据库模型、DTO）
│   │   │   ├── __init__.py
│   │   │   ├── user_model.py # 数据库模型（如 SQLAlchemy 模型）
│   │   │   └── dto.py       # 数据传输对象（请求/响应格式）
│   │   ├── utils/           # 工具层（通用工具函数）
│   │   │   ├── __init__.py
│   │   │   ├── format_utils.py # 格式化工具（日期、字符串）
│   │   │   └── valid_utils.py # 校验工具（参数校验）
│   │   └── exceptions/      # 异常定义层（自定义异常）
│   │       ├── __init__.py
│   │       ├── base_exception.py # 基础异常类
│   │       └── business_exception.py # 业务异常类
├── tests/                   # 测试目录（与 src 结构对应）
│   ├── __init__.py
│   ├── conftest.py          # 测试夹具（pytest 配置）
│   ├── test_api/            # 接口测试
│   ├── test_core/           # 核心逻辑测试
│   └── test_utils/          # 工具函数测试
└── scripts/                 # 脚本目录（部署、数据迁移等）
    ├── deploy.py            # 部署脚本
    └── migrate_data.py      # 数据迁移脚本
```

### 关键目录说明：

- `src/`：源代码目录，通过 `pip install -e .` 可将项目安装为可编辑包，避免导入路径问题。
- `requirements/`：依赖分组，避免生产环境安装开发依赖（如 `pytest`、`flake8`）。
- `tests/`：测试代码与源代码分离，结构一一对应，便于维护测试用例。
- `scripts/`：存放非业务脚本（部署、迁移、定时任务等），避免污染核心代码。

## 三、Python 3.10 新特性使用规范

Python 3.10 新增特性需合理使用，避免滥用导致兼容性或可读性问题：

### 1. 结构模式匹配（match-case）

替代复杂的 `if-elif-else`，适用于“值匹配”场景（如状态判断、类型判断），**禁止用于简单逻辑**（反而降低可读性）。

```python
# 正确（复杂状态匹配，推荐）
def handle_order_status(status: str) -> str:
    match status:
        case "pending":
            return "订单待支付"
        case "paid" | "completed":  # 多值匹配
            return "订单已完成"
        case "cancelled" | "refunded":
            return "订单已取消"
        case _:  # 默认匹配（等价于 else）
            raise ValueError(f"未知订单状态：{status}")

# 错误（简单逻辑，无需 match-case）
def is_positive(num: int) -> bool:
    match num > 0:  # 冗余，不如直接 return num > 0
        case True:
            return True
        case False:
            return False
```

### 2. 联合类型简化（`T | U`）

用 `int | str` 替代 `Union[int, str]`，更简洁，但需注意：

- 仅 Python 3.10+ 支持，若项目需兼容低版本（如 3.9），需用 `from __future__ import annotations` 或保留 `Union`。
- 可选类型推荐 `T | None`，而非 `Optional[T]`（两者等价，前者更简洁）。

### 3. 其他新特性使用建议

- **类型提示增强**：`list[str]`、`dict[int, str]` 等内置集合类型提示（Python 3.9+ 支持），推荐替代 `List[str]`、`Dict[int, str]`（需确保项目 Python 版本 ≥ 3.9）。
- **`zip` 可选严格模式**：`zip(a, b, strict=True)`，当两个可迭代对象长度不一致时抛出 `ValueError`，推荐在需严格长度匹配的场景使用（如成对数据处理）。
- **`match` 中类模式匹配**：适用于多子类判断，需确保类结构清晰，避免过度嵌套。

## 四、工具链规范（自动化校验与格式化）

通过工具链强制落地规范，减少人工约束成本，推荐以下工具组合：

### 1. 配置文件：`pyproject.toml`（统一配置入口）

Python 3.10 推荐用 `pyproject.toml` 管理工具配置（替代 `setup.cfg`、`.flake8` 等分散文件）：

```toml
[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

# 格式化工具：black
[tool.black]
line-length = 88  # 行宽
target-version = ["py310"]  # 目标 Python 版本
include = '\.pyi?$'
exclude = '''
/(
    \.git
  | \.mypy_cache
  | \.venv
  | tests/
)/
'''

# 代码校验：flake8（PEP 8 校验）
[tool.flake8]
max-line-length = 88
extend-ignore = ["E203"]  # 与 black 兼容（black 允许逗号后换行）
exclude = [".venv", "tests/", "scripts/"]

# 类型检查：mypy
[tool.mypy]
target_version = "3.10"
strict = true  # 严格模式（推荐，强制类型校验）
exclude = [".venv", "tests/", "scripts/"]
plugins = ["mypy-extensions"]

# 导入排序：isort
[tool.isort]
profile = "black"  # 与 black 兼容
line_length = 88
multi_line_output = 3
```

### 2. 核心工具说明

| 工具     | 作用                             | 常用命令                       |
| -------- | -------------------------------- | ------------------------------ |
| `black`  | 代码自动格式化（强制遵循 PEP 8） | `black src/`（格式化目录）     |
| `flake8` | 代码风格校验（PEP 8 合规性）     | `flake8 src/`（校验目录）      |
| `mypy`   | 静态类型检查（类型提示校验）     | `mypy src/`（检查目录）        |
| `isort`  | 导入语句自动排序（遵循 PEP 8）   | `isort src/`（排序目录导入）   |
| `pytest` | 单元测试框架（执行测试用例）     | `pytest tests/ -v`（执行测试） |

### 3. 开发流程集成

- **本地开发**：提交代码前执行 `black src/ && isort src/ && flake8 src/ && mypy src/`，确保格式化和校验通过。
- **IDE 配置**：VS Code 安装 `Python`、`Black`、`Flake8`、`isort` 插件，开启“保存自动格式化”和“实时校验”。
- **CI/CD 集成**：在 GitHub Actions/GitLab CI 中添加步骤，执行上述工具校验，失败则阻止合并（强制规范落地）。

## 五、代码最佳实践（避坑指南）

### 1. 变量与函数

- 禁止使用单字母变量（`i`、`j` 循环变量除外），变量名需见名知义。
- 函数职责单一：一个函数只做一件事，代码行数不超过 50 行（超过需拆分）。
- 避免函数参数过多（不超过 5 个），过多参数用数据类（`dataclasses`）或字典封装。
- 循环优化：优先用列表推导式/生成器表达式替代 `for` 循环（简洁高效），大数据量用生成器（`(x for x in iterable)`）避免内存占用。

```python
# 正确（列表推导式）
user_ids = [user["id"] for user in users if user["status"] == "active"]

# 正确（生成器表达式，大数据量推荐）
user_ids_generator = (user["id"] for user in users if user["status"] == "active")

# 错误（冗余 for 循环）
user_ids = []
for user in users:
    if user["status"] == "active":
        user_ids.append(user["id"])
```

### 2. 类与面向对象

- 类的属性和方法需控制访问权限（公共用普通命名，私有用 `_` 前缀）。
- 避免深层继承（不超过 3 层），优先用组合替代继承（降低耦合）。
- 用 `dataclasses` 简化数据类（避免手动写 `__init__`、`__repr__`）：

  ```python
  from dataclasses import dataclass

  @dataclass(frozen=True)  # frozen=True 表示不可变对象
  class UserDTO:
      """用户数据传输对象"""
      id: int
      name: str
      email: str | None = None  # 可选字段，默认 None

  # 使用
  user = UserDTO(id=1001, name="张三", email="zhangsan@example.com")
  print(user.name)  # 张三
  ```

- 自定义异常需继承 `Exception`（而非 `BaseException`），并分类管理（业务异常、系统异常分离）。

### 3. 错误处理

- 捕获异常需明确异常类型（禁止 `except Exception:` 捕获所有异常），避免吞掉未知错误。
- 异常处理需包含具体错误信息（如 `str(e)`），便于调试。
- 用 `raise ... from e` 保留异常链（追溯原始错误原因）：
  ```python
  try:
      db_client.query(sql)
  except DatabaseConnectionError as e:
      # 保留原始异常链，便于调试
      raise BusinessException(f"数据库连接失败：{str(e)}") from e
  ```

### 4. 性能与兼容性

- 避免频繁创建对象（如在循环内创建列表/字典），可提前初始化。
- 大数据量处理优先用 `pandas`（批量操作）或 `itertools`（高效迭代）。
- 兼容性：若项目需兼容 Python < 3.10，需避免使用 3.10 独有特性（如 `match-case`、`T | U`），或通过 `__future__` 模块兼容。

## 六、Git 提交与版本规范

### 1. 提交信息规范（遵循 Conventional Commits）

与 Vue 项目一致，提交信息格式：`type(scope): subject`

- `type`：`feat`（新功能）、`fix`（修复 bug）、`docs`（文档）、`style`（代码风格）、`refactor`（重构）、`test`（测试）、`chore`（工具配置）。
- 示例：
  ```bash
  feat(user): 新增用户邮箱验证功能
  fix(order): 修复订单结算时金额计算错误
  docs: 更新 README 中的安装步骤
  refactor(utils): 优化日期格式化函数（提升性能）
  ```

### 2. 版本规范（语义化版本 SemVer）

版本号格式：`主版本号.次版本号.修订号`（如 `1.2.3`）

- 主版本号（X）：不兼容的 API 变更（如删除核心函数、修改参数结构）。
- 次版本号（Y）：向后兼容的新功能（如新增接口、优化逻辑）。
- 修订号（Z）：向后兼容的 bug 修复（如修复计算错误、兼容性问题）。

### 3. 分支管理（Git Flow 简化版）

- `main`：主分支（生产环境代码，禁止直接提交）。
- `develop`：开发分支（日常开发，从 `main` 拉出）。
- `feature/xxx`：功能分支（从 `develop` 拉出，开发完成后合并回 `develop`）。
- `fix/xxx`：bug 修复分支（从 `develop` 拉出，修复后合并回 `develop`）。
- `release/xxx`：发布分支（从 `develop` 拉出，测试通过后合并到 `main` 和 `develop`）。

## 七、文档规范

- **项目文档**：`README.md` 必须包含：项目介绍、安装步骤、启动命令、目录结构、贡献规范、版本说明。
- **API 文档**：公共接口用 `sphinx` 或 `pdoc` 生成 HTML 文档（自动提取 Docstring），便于团队查阅。
- **注释规范**：
  - 复杂逻辑（如算法、特殊业务规则）需加单行注释（`# 说明逻辑目的，而非重复代码`）。
  - 避免无用注释（如 `# 定义变量 a`，注释需解释“为什么”，而非“是什么”）。
  - 临时注释需标注 `TODO`/`FIXME`，并说明责任人与截止时间（如 `# TODO: 优化查询性能（张三，2024-12-31）`）。

## 总结

Python 3.10 开发规范的核心是 **“遵循标准、工具自动化、可读性优先”**：

1. 基础规范严格遵循 PEP 8/257/484，确保代码风格统一。
2. 利用 `black`、`flake8`、`mypy` 等工具强制落地规范，减少人工成本。
3. 合理使用 Python 3.10 新特性（如 `match-case`、`T | U`），提升开发效率但不滥用。
4. 工程结构分层清晰，代码职责单一，便于维护和协作。

可根据团队规模和项目特点调整规范（如小型项目可简化分支管理和文档要求），关键是确保团队成员统一认知并通过工具强制执行。如果需要，可提供 **Python 3.10 规范项目模板**（含完整配置文件和目录结构）。
