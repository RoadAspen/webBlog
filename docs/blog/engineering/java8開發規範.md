# Java 1.8（JDK 8）开发规范

**Java 1.8（JDK 8）开发规范**。Java 8 是目前企业级开发中最常用的稳定版本（长期支持 LTS 版本），规范核心围绕 **代码可读性、可维护性、性能优化、安全合规**，结合阿里巴巴 Java 开发手册（泰山版）、Oracle 官方最佳实践：

## 一、基础规范（文件/目录结构）

### 1. 项目目录结构（Maven/Gradle 标准结构）

```
src/
├── main/
│   ├── java/                # 源代码目录（按包名分层）
│   │   └── com/
│   │       └── company/
│   │           ├── project/ # 项目根包（公司域名反转+项目名）
│   │               ├── api/ # 接口层（Controller/Feign 接口）
│   │               │   ├── UserController.java
│   │               │   └── OrderFeignClient.java
│   │               ├── service/ # 服务层（业务逻辑）
│   │               │   ├── impl/ # 服务实现类
│   │               │   │   ├── UserServiceImpl.java
│   │               │   │   └── OrderServiceImpl.java
│   │               │   ├── UserService.java
│   │               │   └── OrderService.java
│   │               ├── mapper/ # 数据访问层（MyBatis Mapper 接口）
│   │               │   ├── UserMapper.java
│   │               │   └── OrderMapper.xml
│   │               ├── model/ # 数据模型层
│   │               │   ├── entity/ # 数据库实体（与表一一对应）
│   │               │   │   ├── User.java
│   │               │   │   └── Order.java
│   │               │   ├── dto/ # 数据传输对象（请求/响应）
│   │               │   │   ├── UserQueryDTO.java
│   │               │   │   └── UserResponseDTO.java
│   │               │   └── vo/ # 视图对象（前端展示用）
│   │               │       └── UserVO.java
│   │               ├── util/ # 工具类（通用工具）
│   │               │   ├── DateUtils.java
│   │               │   └── StringUtils.java
│   │               ├── config/ # 配置类（Spring 配置、自定义配置）
│   │               │   ├── MyBatisConfig.java
│   │               │   └── RedisConfig.java
│   │               ├── exception/ # 自定义异常
│   │               │   ├── BusinessException.java
│   │               │   └── GlobalExceptionHandler.java
│   │               └── ProjectApplication.java # 应用入口（SpringBoot 主类）
│   └── resources/           # 资源目录
│       ├── application.yml  # 主配置文件（默认环境）
│       ├── application-dev.yml # 开发环境配置
│       ├── application-prod.yml # 生产环境配置
│       └── mybatis/         # MyBatis 映射文件（可选，也可放 mapper 目录）
└── test/                    # 测试目录（与 main 结构对应）
    └── java/
        └── com/
            └── company/
                └── project/
                    ├── api/ # 接口测试
                    ├── service/ # 服务层测试
                    └── util/ # 工具类测试
```

### 2. 命名规范（强制遵循，阿里手册标准）

| 类型                | 命名规则                         | 示例                                                  |
| ------------------- | -------------------------------- | ----------------------------------------------------- |
| 包名（package）     | 全小写+点分隔（域名反转）        | `com.company.project.api`、`com.company.project.util` |
| 类名（class）       | 大驼峰命名（PascalCase）         | `UserController`、`OrderService`、`DateUtils`         |
| 接口名（interface） | 大驼峰命名，前缀可选 `I`         | `UserService`（推荐）、`IUserService`（兼容旧项目）   |
| 方法名（method）    | 小驼峰命名（camelCase）          | `getUserById()`、`createOrder()`、`validateParam()`   |
| 变量名（variable）  | 小驼峰命名                       | `userId`、`orderList`、`totalAmount`                  |
| 常量（constant）    | 全大写+下划线分隔                | `public static final int MAX_RETRY_COUNT = 3;`        |
| 枚举类（enum）      | 大驼峰命名，枚举项全大写+下划线  | `enum OrderStatus { PENDING, PAID, CANCELLED; }`      |
| 注解（annotation）  | 大驼峰命名，前缀可选 `@`         | `@Log`、`@ValidParam`                                 |
| 配置文件            | 小写+横杠分隔（SpringBoot 推荐） | `application-dev.yml`、`mybatis-config.xml`           |

**关键禁忌**：

- 禁止使用拼音命名（如 `ShangPinService` 应改为 `ProductService`），特殊业务名词（如“支付宝”`Alipay`）除外。
- 禁止使用单字母变量（`i`、`j` 循环变量除外），禁止使用关键字（`class`、`int`、`for` 等）作为命名。
- 常量命名需体现语义（如 `MAX_PAGE_SIZE` 而非 `MAX_NUM`）。

## 二、代码规范（Java 8 核心语法+最佳实践）

### 1. 类与方法规范

#### （1）类的职责单一

一个类只负责一个核心功能，代码行数不超过 800 行（超过需拆分），方法行数不超过 50 行（复杂逻辑拆分小方法）。

```java
// 正确示例（职责单一：仅处理用户查询相关逻辑）
@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;

    // 方法职责单一：仅根据 ID 查询用户
    @GetMapping("/{id}")
    public Result<UserVO> getUserById(@PathVariable Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("用户 ID 必须为正整数");
        }
        UserVO userVO = userService.getUserById(id);
        return Result.success(userVO);
    }

    // 方法职责单一：分页查询用户
    @GetMapping("/page")
    public Result<PageInfo<UserVO>> getUserByPage(UserQueryDTO queryDTO) {
        PageInfo<UserVO> pageInfo = userService.getUserByPage(queryDTO);
        return Result.success(pageInfo);
    }
}
```

#### （2）方法规范

- 方法参数不超过 5 个，超过时用 DTO 封装（如 `createOrder(Long userId, String productId, BigDecimal amount, Date time)` 应改为 `createOrder(OrderCreateDTO dto)`）。
- 方法返回值需明确（避免返回 `null`，复杂场景返回 `Optional` 或自定义结果类 `Result`）。
- 工具类方法需设为 `static`，且工具类禁止实例化（私有构造方法）：

  ```java
  public class DateUtils {
      // 禁止实例化工具类
      private DateUtils() {}

      // 静态工具方法
      public static String formatDate(Date date, String pattern) {
          if (date == null || StringUtils.isEmpty(pattern)) {
              return "";
          }
          SimpleDateFormat sdf = new SimpleDateFormat(pattern);
          return sdf.format(date);
      }
  }
  ```

#### （3）Java 8 特性使用规范

Java 8 核心特性（Lambda 表达式、Stream API、Optional、函数式接口）需合理使用，提升代码简洁性，但避免滥用导致可读性下降。

##### ① Lambda 表达式

- 适用场景：简化匿名内部类（如 `Runnable`、`Comparator`、Stream 中间操作）。
- 禁忌：Lambda 体超过 3 行时，改为单独方法（避免可读性差）。

```java
// 正确示例（简化 Comparator）
List<User> userList = new ArrayList<>();
// 按年龄升序排序（Lambda 表达式，简洁）
userList.sort((u1, u2) -> u1.getAge() - u2.getAge());

// 错误示例（Lambda 体过长，应拆分方法）
userList.stream().filter(user -> {
    // 复杂逻辑（超过 3 行）
    if (user.getAge() > 18 && user.getStatus() == 1) {
        return StringUtils.isNotBlank(user.getEmail());
    }
    return false;
}).collect(Collectors.toList());

// 正确改造（拆分方法）
userList.stream()
        .filter(this::isValidUser)
        .collect(Collectors.toList());

// 单独定义方法，提升可读性
private boolean isValidUser(User user) {
    if (user.getAge() > 18 && user.getStatus() == 1) {
        return StringUtils.isNotBlank(user.getEmail());
    }
    return false;
}
```

##### ② Stream API

- 适用场景：集合的过滤、映射、排序、聚合（替代传统 `for` 循环）。
- 禁忌：
  - 避免 Stream 嵌套（如 Stream 内再写 Stream，可读性极差）。
  - 大数据量（10 万+）避免使用 `parallelStream`（线程开销可能超过收益）。
  - 禁止在 Stream 中修改集合元素（如 `forEach(user -> user.setName("xxx"))`，线程不安全且可读性差）。

```java
// 正确示例（Stream 简化集合操作）
List<User> userList = new ArrayList<>();

// 1. 过滤年龄>18的用户，提取用户名列表
List<String> userNameList = userList.stream()
        .filter(user -> user.getAge() > 18)
        .map(User::getName)
        .collect(Collectors.toList());

// 2. 按年龄降序排序，取前5个用户
List<User> top5UserList = userList.stream()
        .sorted(Comparator.comparingInt(User::getAge).reversed())
        .limit(5)
        .collect(Collectors.toList());

// 3. 统计不同状态的用户数量（聚合操作）
Map<Integer, Long> statusCountMap = userList.stream()
        .collect(Collectors.groupingBy(User::getStatus, Collectors.counting()));
```

##### ③ Optional

- 适用场景：避免 `NullPointerException`（NPE），替代 `if (obj != null)` 判断。
- 禁忌：禁止用 `Optional.get()`（无值时抛出异常），需用 `orElse()`/`orElseGet()`/`ifPresent()` 处理无值场景。

```java
// 错误示例（可能抛出 NPE）
Optional<User> userOpt = userService.findUserById(1001);
User user = userOpt.get(); // 无值时抛出 NoSuchElementException

// 正确示例
Optional<User> userOpt = userService.findUserById(1001);

// 1. 无值时返回默认对象
User user = userOpt.orElse(new User());

// 2. 无值时通过函数生成默认对象（延迟执行，更高效）
User user = userOpt.orElseGet(() -> new User(0L, "默认用户"));

// 3. 有值时执行逻辑（无值不执行）
userOpt.ifPresent(user -> System.out.println("用户名：" + user.getName()));

// 4. 有值时映射，无值返回默认值
String userName = userOpt.map(User::getName).orElse("未知用户");
```

##### ④ 日期时间 API（Java 8 `java.time`）

- 替代旧的 `Date`、`SimpleDateFormat`（线程不安全），使用 `LocalDate`、`LocalDateTime`、`DateTimeFormatter`。
- 关键注意：`DateTimeFormatter` 是线程安全的，可定义为静态常量复用。

```java
public class DateUtils {
    private DateUtils() {}

    // 静态常量（线程安全，可复用）
    public static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    public static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // 日期格式化（无 NPE 风险）
    public static String formatLocalDate(LocalDate date) {
        return date == null ? "" : date.format(DATE_FORMATTER);
    }

    // 字符串转 LocalDateTime
    public static LocalDateTime parseDateTime(String dateStr) {
        if (StringUtils.isEmpty(dateStr)) {
            return null;
        }
        try {
            return LocalDateTime.parse(dateStr, DATETIME_FORMATTER);
        } catch (DateTimeParseException e) {
            log.error("日期格式解析失败：{}", dateStr, e);
            return null;
        }
    }
}
```

### 2. 异常处理规范

- 禁止捕获 `Exception` 或 `Throwable`（会吞掉所有异常，难以排查），需捕获具体异常（如 `NullPointerException`、`SQLException`）。
- 自定义异常需继承 `RuntimeException`（非受检异常，避免强制 `try-catch`），分类管理（业务异常、系统异常分离）。
- 异常信息需明确（包含上下文，如“用户 ID=1001 查询失败”），禁止抛出无意义异常（如 `throw new RuntimeException("失败")`）。
- 全局异常处理：用 Spring 的 `@RestControllerAdvice` 统一捕获异常，返回标准化响应。

```java
// 自定义业务异常
public class BusinessException extends RuntimeException {
    private int code; // 错误码
    private String message; // 错误信息

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
        this.message = message;
    }

    // getter/setter
}

// 全局异常处理器
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // 捕获业务异常
    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusinessException(BusinessException e) {
        log.warn("业务异常：code={}, message={}", e.getCode(), e.getMessage());
        return Result.fail(e.getCode(), e.getMessage());
    }

    // 捕获参数校验异常
    @ExceptionHandler(IllegalArgumentException.class)
    public Result<Void> handleIllegalArgumentException(IllegalArgumentException e) {
        log.warn("参数异常：{}", e.getMessage());
        return Result.fail(400, "参数错误：" + e.getMessage());
    }

    // 捕获其他未预期异常（兜底）
    @ExceptionHandler(Exception.class)
    public Result<Void> handleUnexpectedException(Exception e) {
        log.error("系统异常：", e); // 打印堆栈信息，便于排查
        return Result.fail(500, "系统繁忙，请稍后重试");
    }
}
```

### 3. 注释规范

- 类注释：类上必须加 Javadoc 注释，说明类的功能、作者、创建日期（可选版本、依赖）。
- 方法注释：公共方法（`public`）必须加 Javadoc，说明功能、参数、返回值、异常。
- 字段注释：关键字段（如实体类属性、常量）加注释，说明含义、格式（如日期格式 `yyyy-MM-dd`）。
- 单行注释：复杂逻辑（如算法、特殊业务规则）需加单行注释（`// 说明逻辑目的，而非重复代码`）。

```java
/**
 * 用户控制器（处理用户相关接口请求）
 *
 * @author 张三
 * @date 2024-11-05
 * @version 1.0
 * @see com.company.project.service.UserService
 */
@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;

    /**
     * 根据用户 ID 查询用户详情
     *
     * @param id 用户唯一标识（正整数）
     * @return Result<UserVO> - 成功返回用户详情，失败返回错误信息
     * @throws IllegalArgumentException 当 id 为 null 或非正整数时抛出
     * @throws BusinessException 当用户不存在时抛出（错误码：404）
     */
    @GetMapping("/{id}")
    public Result<UserVO> getUserById(@PathVariable Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("用户 ID 必须为正整数");
        }
        UserVO userVO = userService.getUserById(id);
        if (userVO == null) {
            throw new BusinessException(404, "用户不存在");
        }
        return Result.success(userVO);
    }
}
```

### 4. 集合与泛型规范

- 集合初始化时指定初始容量（如 `new ArrayList<>(10)`），避免频繁扩容（尤其是已知元素数量时）。
- 禁止使用非泛型集合（如 `List` 应改为 `List<User>`），避免类型转换异常。
- 遍历集合优先用增强 `for` 循环或 Stream API，避免用普通 `for` 循环（可读性差）。
- 集合工具类优先使用 `Collections` 或 Guava 工具类，避免手动实现排序、去重等逻辑。

```java
// 正确示例
List<User> userList = new ArrayList<>(20); // 指定初始容量（已知最多20个元素）

// 增强 for 循环遍历
for (User user : userList) {
    System.out.println(user.getName());
}

// 去重（使用 Stream API，简洁高效）
List<User> distinctUserList = userList.stream()
        .distinct() // 基于 equals/hashCode 去重
        .collect(Collectors.toList());

// 排序（使用 Comparator.comparing，避免匿名内部类）
userList.sort(Comparator.comparing(User::getCreateTime).reversed());
```

## 三、工程化规范（Maven/Gradle + 工具链）

### 1. 依赖管理规范

- 依赖版本统一管理（Maven 用 `dependencyManagement`，Gradle 用 `ext` 或 `platform`），避免版本冲突。
- 生产环境依赖仅保留运行时必需的（如 `spring-boot-starter-web`、`mybatis-spring-boot-starter`），排除开发/测试依赖（如 `junit`、`lombok` 需设为 `provided` 或 `test` 范围）。
- 避免依赖冗余（如同时引入 `spring-boot-starter-web` 和 `spring-boot-starter-tomcat`，前者已包含后者）。

Maven 示例（`pom.xml`）：

```xml
<!-- 统一管理依赖版本 -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>2.7.15</version> <!-- 与 Java 8 兼容的 SpringBoot 版本 -->
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>fastjson</artifactId>
            <version>1.2.83</version>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <!-- 核心依赖（运行时必需） -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.mybatis.spring.boot</groupId>
        <artifactId>mybatis-spring-boot-starter</artifactId>
    </dependency>
    <dependency>
        <groupId>com.alibaba</groupId>
        <artifactId>fastjson</artifactId>
    </dependency>

    <!-- 开发/测试依赖（不打包到生产环境） -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <scope>provided</scope> <!-- 编译时生效，运行时不需要 -->
    </dependency>
</dependencies>
```

### 2. 工具链规范（强制落地规范）

#### （1）Lombok 简化代码

- 用 `@Data`、`@Getter`、`@Setter`、`@NoArgsConstructor` 等注解替代手动编写 `getter/setter`、`toString`、`构造方法`，减少模板代码。
- 注意：`@Data` 包含 `@Getter`、`@Setter`、`@ToString`、`@EqualsAndHashCode`、`@RequiredArgsConstructor`，实体类推荐使用；工具类禁止使用（避免生成不必要的方法）。

```java
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 用户实体类（与数据库 user 表一一对应）
 */
@Data // 生成 getter/setter/toString/equalsAndHashCode
@NoArgsConstructor // 无参构造
@AllArgsConstructor // 全参构造
public class User {
    private Long id; // 用户 ID（主键）
    private String name; // 用户名（非空）
    private Integer age; // 年龄（1-120）
    private String email; // 邮箱（可选）
    private LocalDateTime createTime; // 创建时间
}
```

#### （2）代码格式化工具

- 统一使用 IDEA 格式化配置（导入阿里 Java 开发手册的代码格式化模板），避免因 IDE 配置不同导致代码风格不一致。
- IDEA 配置步骤：`File → Settings → Editor → Code Style → Java → 导入阿里模板 → 应用`。

#### （3）静态代码检查工具（SonarQube/CheckStyle）

- 集成 SonarQube 到 CI/CD 流程，强制检查代码质量（如重复代码、未使用变量、潜在 bug），未达标则阻止提交/合并。
- 关键检查项：
  - 重复代码率 < 5%。
  - 无高危 bug（如 NPE、SQL 注入、线程安全问题）。
  - 代码复杂度（Cyclomatic Complexity）< 15。

#### （4）单元测试规范

- 核心业务逻辑（Service 层、工具类）必须编写单元测试，测试覆盖率 ≥ 70%。
- 使用 JUnit 4/JUnit 5 + Mockito 进行测试，避免依赖真实数据库/第三方服务（通过 Mock 模拟）。

```java
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;
import static org.mockito.Mockito.when;
import static org.junit.Assert.assertEquals;

@RunWith(MockitoJUnitRunner.class)
public class UserServiceTest {
    @Mock // 模拟 Mapper 依赖
    private UserMapper userMapper;

    @InjectMocks // 注入被测试对象
    private UserServiceImpl userService;

    @Test
    public void testGetUserById_Success() {
        // 1. 准备测试数据
        Long userId = 1001L;
        User user = new User(userId, "张三", 25, "zhangsan@example.com", LocalDateTime.now());
        UserVO expectedVO = new UserVO(userId, "张三", 25, "zhangsan@example.com");

        // 2. Mock Mapper 方法返回
        when(userMapper.selectById(userId)).thenReturn(user);

        // 3. 执行测试方法
        UserVO actualVO = userService.getUserById(userId);

        // 4. 断言结果
        assertEquals(expectedVO.getId(), actualVO.getId());
        assertEquals(expectedVO.getName(), actualVO.getName());
    }

    @Test
    public void testGetUserById_UserNotFound() {
        // 1. 准备测试数据
        Long userId = 1002L;

        // 2. Mock Mapper 方法返回 null（用户不存在）
        when(userMapper.selectById(userId)).thenReturn(null);

        // 3. 执行测试方法（预期抛出 BusinessException）
        try {
            userService.getUserById(userId);
        } catch (BusinessException e) {
            // 4. 断言异常信息
            assertEquals(404, e.getCode());
            assertEquals("用户不存在", e.getMessage());
        }
    }
}
```

## 四、安全与性能规范

### 1. 安全规范

- 防 SQL 注入：使用 MyBatis 的参数绑定（`#{}`），禁止字符串拼接 SQL（`${}`），特殊场景需用 `${}` 时必须做参数校验。

  ```java
  // 正确（参数绑定，防 SQL 注入）
  <select id="getUserById" resultType="com.company.project.model.entity.User">
      SELECT id, name, age FROM user WHERE id = #{id}
  </select>

  // 错误（字符串拼接，存在 SQL 注入风险）
  <select id="getUserByName" resultType="com.company.project.model.entity.User">
      SELECT id, name, age FROM user WHERE name = '${name}' <!-- 危险！ -->
  </select>
  ```

- 防 XSS 攻击：前端传入的字符串参数需过滤 HTML 标签，可使用 `HtmlUtils.htmlEscape()` 或自定义过滤器。
- 敏感信息加密：密码存储需用 BCrypt 等算法加密（禁止明文存储），传输时用 HTTPS。
- 接口权限校验：关键接口（如用户修改、订单支付）需加权限校验（如 Spring Security、Shiro），避免未授权访问。

### 2. 性能规范

- 数据库查询优化：
  - 避免 `SELECT *`，只查询需要的字段。
  - 高频查询字段加索引（如 `user.id`、`order.user_id`）。
  - 分页查询必须加 `LIMIT`，避免返回大量数据。
- 缓存优化：热点数据（如配置信息、高频查询结果）用 Redis 缓存，避免频繁查询数据库。
- 线程安全：
  - 禁止在多线程环境下使用非线程安全的类（如 `SimpleDateFormat`、`ArrayList`），替代为线程安全类（`DateTimeFormatter`、`CopyOnWriteArrayList`）。
  - 共享变量需加锁（`synchronized` 或 `Lock`），避免并发问题。
- 资源释放：
  - 数据库连接、IO 流、Socket 等资源必须在 `finally` 中关闭，或使用 try-with-resources（Java 7+ 支持）自动关闭。
  ```java
  // try-with-resources 自动关闭流（推荐）
  try (InputStream is = new FileInputStream("file.txt");
       OutputStream os = new FileOutputStream("output.txt")) {
       // 读写逻辑
  } catch (IOException e) {
       log.error("文件操作失败", e);
  }
  ```

## 五、Git 提交与版本规范

### 1. 提交信息规范（Conventional Commits）

与 Vue/Python 规范一致，格式：`type(scope): subject`

- `type`：`feat`（新功能）、`fix`（修复 bug）、`docs`（文档）、`style`（代码风格）、`refactor`（重构）、`test`（测试）、`chore`（工具配置）。
- 示例：
  ```bash
  feat(user): 新增用户邮箱验证功能
  fix(order): 修复订单结算时金额计算错误
  docs: 更新 README 中的接口文档
  refactor(utils): 优化日期格式化工具类（替换 SimpleDateFormat 为 LocalDateTime）
  ```

### 2. 版本规范（语义化版本 SemVer）

版本号格式：`主版本号.次版本号.修订号`（如 `1.2.3`）

- 主版本号（X）：不兼容的 API 变更（如删除核心接口、修改数据结构）。
- 次版本号（Y）：向后兼容的新功能（如新增接口、优化逻辑）。
- 修订号（Z）：向后兼容的 bug 修复（如修复计算错误、安全漏洞）。

### 3. 分支管理（Git Flow 简化版）

- `main`：主分支（生产环境代码，禁止直接提交）。
- `develop`：开发分支（日常开发，从 `main` 拉出）。
- `feature/xxx`：功能分支（从 `develop` 拉出，开发完成后合并回 `develop`）。
- `fix/xxx`：bug 修复分支（从 `develop` 拉出，修复后合并回 `develop`）。
- `release/xxx`：发布分支（从 `develop` 拉出，测试通过后合并到 `main` 和 `develop`）。

## 总结

Java 8 开发规范的核心是 **“遵循阿里手册标准、利用 Java 8 新特性提升效率、通过工具链强制落地”**：

1. 基础命名、目录结构严格遵循阿里 Java 开发手册，确保团队协作无认知成本。
2. 合理使用 Lambda、Stream、Optional、`java.time` 等 Java 8 特性，简化代码但不滥用。
3. 通过 Lombok、IDEA 格式化、SonarQube 等工具提升开发效率，强制规范落地。
4. 重视异常处理、安全防护、性能优化，确保代码可维护、可扩展、无安全隐患。

可根据项目规模调整规范（如小型项目可简化分支管理和测试覆盖率要求），关键是团队统一认知并严格执行。如果需要，可提供 **Java 8 + SpringBoot 规范项目模板**（含完整配置文件、目录结构、示例代码）。
