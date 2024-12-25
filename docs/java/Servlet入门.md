使用Java提供的基础能力,我们看到,编写HTTP服务器,其实是非常简单的,只需要先编写基于多线程的TCP服务,然后在一个TCP连接中读取HTTP请求,发送HTTP响应即可;

但是,要编写一个完善的HTTP服务器,以HTTP/1.1为例,需要考虑的包括:

+ 识别正确和错误的HTTP请求;
+ 识别正确和错误的HTTP请求头;
+ 服用TCP连接;
+ 复用线程;
+ IO异常处理.

```java
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream; 
import java.io.OutputStreamWriter;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

public class Server {
    public static void main(String[] args) throws IOException{
        ServerSocket ss = new ServerSocket(8991);// 监听指定端口
        System.out.println("server is running...");
        for(;;){
            Socket sock = ss.accept();
            System.out.println("connected from "+ sock.getRemoteSocketAddress());
            Thread t = new Handler(sock);
            t.start();
        }
    }
}
/** 线程类 */
class Handler extends Thread{
    Socket sock;
    public Handler(Socket sock){
        this.sock = sock;
    }

    @Override
    public void run(){
        // 调用start的时候,内部执行了run方法.
        try (InputStream input = this.sock.getInputStream()){
            try(OutputStream output = this.sock.getOutputStream()){
                // 在run方法内部监听 http请求
                this.handle(input,output);
            }
        } catch (Exception e) {
            // TODO: handle exception
        }
       System.out.println("client disconnected");
    }
    private void handle(InputStream input , OutputStream output) throws IOException{
        System.out.println("Process new http request...");
        BufferedReader reader = new BufferedReader(new InputStreamReader(input));
        BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(output));
        // 读取HTTP请求
        boolean requestOK = false;
        String first = reader.readLine();
        if(first.startsWith("GET / HTTP/1.")){
            requestOK = true;
        }
        // 读取消息头,消息体
        for(;;){
            String header = reader.readLine();
            if(header.isEmpty()){
                // 读取到空行时,HTTP Header读取完毕
                break;
            }
            System.out.println(header);
        }
        System.out.println(requestOK ? "Response OK" :"Response Error");

        if(!requestOK){
            // 发送错误响应;
            writer.write("HTTP/1.0 404 Not Found\r\n");
            writer.write("Content-Length: 0\r\n");
            writer.write("\r\n");
            writer.flush();
        }else{
            // 发送成功响应
            String data = "<html><body><h1>Hello,world!</h1></body></html>";
            int length = data.getBytes(StandardCharsets.UTF_8).length;
            writer.write("HTTP/1.0 200 OK\r\n");
            writer.write("Connection: keep-alive\r\n");
            writer.write("Content-Type: text/html\r\n");
            writer.write("Content-Length:" + length + "\r\n");
            // 空行标识 Header 和 Body的分隔
            writer.write("\r\n");
            writer.write(data);
            writer.flush();
        }
    }
}

```

这些基础工作需要耗费大量的时间.并且经过长期测试才能稳定运行.如果我们只需要输出一个简单的HTML页面,就不得不编写上千行底层代码,那就根本无法做到高效而且可靠的开发.

因此,在JavaEE平台上,处理TCP连接,解析HTTP协议这些底层工作统统扔给现成的Web服务器去做,我们只需要把自己的应用程序跑在Web服务器上, 为了实现这一目的,JavaEE提供了Servlet API,我们使用 Servlet API编写自己的Servlet来处理HTTP请求,Web服务器实现Servlet API接口, 实现底层功能:

```plain
                 ┌───────────┐
                 │My Servlet │
                 ├───────────┤
                 │Servlet API│
┌───────┐  HTTP  ├───────────┤
│Browser│◀─────▶ │Web Server │
└───────┘        └───────────┘
```

我们来实现一个最简单的Servlet:

```java
// WebServlet 注解表示这是一个Servlet,并映射到地址/:
@WebServlet(urlPatterns = "/")
public class HelloServlet extends HttpServlet {
   protected void doGet(HttpServletRequest req,HttpServletResponse resp){
       throws ServletException , IOException{
           // 设置响应类型
           resp.setContentType("text/html");
           // 获取输出流
           PrintWriter pw = resp.getWriter();
           // 写入响应
           pw.write("<h1>Hello,world!</h1>");
           // 最后不要忘记flush强制输出
           pw.flush();
       }
   }
}
```

一个Servlet总是继承自 `HttpServlet`,然后覆写`doGet()`或者 `doPost`方法. 注意到 `doGet()`方法传入了 `HttpServeletRequest` 和 `HttpServletResponse`两个对象,分别代表 HTTP 请求和响应. 我们使用 Servlet API的时候,并不会和底层TCP交互,也不需要解析HTTP协议,因为 `HttpServletRequest`和`HttpServletResponse`就已经封装好了请求和响应.以发送响应为例,我们只需要设置正确的响应类型,然后获取 `PrintWriter`, 写入响应即可.

那么问题来了:Servlet API是谁提供?

Servlet API 是一个jar包,我们需要通过 Maven 来引入它,才能正常编译. 编写 `pom.xml`文件如下:

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.itranswarp.learnjava</groupId>
    <artifactId>web-servlet-hello</artifactId>
    <packaging>war</packaging>
    <version>1.0-SNAPSHOT</version>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>jakarta.servlet</groupId>
            <artifactId>jakarta.servlet-api</artifactId>
            <version>5.0.0</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>

    <build>
        <finalName>hello</finalName>
    </build>
</project>
```

注意到这个 `pom.xml`与前面我们讲到的普通Java程序有个区别,打包类型不是`jar`,而是`war`,表示java Web Application Archive:

```xml
<packaging>war</packaging>
```

引入的Servlet API 如下:

```xml
<dependency>
    <groupId>jakarta.servlet</groupId>
    <artifactId>jakarta.servlet-api</artifactId>
    <version>5.0.0</version>
    <scope>provided</scope>
</dependency>
```

**注意到**`**<scope>**`**指定为**`**provided**`**,表示编译时使用,但不会打包到**`**.war**`**文件中,因为运行期Web服务器本身已经提供了Servlet API相关的jar包**.

整个工程结构如下:

```java
web-servlet-hello/
├── pom.xml
└── src/
    └── main/
        ├── java/
        │   └── com/
        │       └── itranswarp/
        │           └── learnjava/
        │               └── servlet/
        │                   └── HelloServlet.java
        ├── resources/
        └── webapp/
```

目录webapp 目前为空,如果我们需要存放一些资源文件,则需要放入该目录.有的同学可能会问,`webapp`目录下是否需要一个 配置文件,这个配置文件在低版本的Servlet上是必须的,高版本的Servlet已经不再需要了.

运行 Maven 命令`mvn clean package`,在 `target`目录下得到一个 `hello.war`文件,这个文件就是我们编译打包后的Web应用程序.

普通的Java程序时通过启动JVM,然后执行 `main()`方法开始执行.但是Web应用程序有所不同,我们无法直接运行`war`文件,必须先启动Web服务器,再由Web服务器加载我们编写的 `HelloServlet`,这样就可以让 `HelloServlet`处理浏览器发送的请求.

因此,我们首先要找一个支持 Servlet API 的Web服务器.常用的服务器有:

+ <font style="color:#C75C00;">Tomcat</font>: 由 Apache 开发的开源免费服务器.
+ <font style="color:#C75C00;">Jetty</font>: 由Eclipse开发的开源免费服务器
+ <font style="color:#C75C00;">GlasFish</font>: 一个开源的全功能JavaEE服务器

无论使用哪个服务器,只要它支持 Servlet API 5.0 ,我们的war包就都可以在上面运行.**这里我们选择使用最广泛的开源免费的Tomcat服务器.**



**要运行我们的 **`**hello.war**`**,首先要 下载 Tomcat服务器,解压后,把**`**hellow.war**`**复制到 Tomcat 的 **`**webapps**`**目录下,然后切换到 **`**bin**`**目录,执行**`**startup.sh**`**或 **`**startup.bat**`**启动Tomcat服务器.**

```shell
sh startup.sh
```

在浏览器输入 `http://localhost:8080/hello/`即可看到 `HelloServlet`的输出.

**细心的童鞋可能会问,为啥路径是 **`**/hello/**`**而不是**`**/**`**?因为一个Web服务器允许同事运行多个Web App,而我们的Web App 叫**`**hello**`**,因此,第一级的目录**`**/hello**`**表示Web App 的名字,后面的**`**/**`**才是我们在 **`**HelloServlet**`**中映射的路径.**

<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">那能不能直接使用</font>`/`<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">而不是</font>`/hello/`<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">？毕竟</font>`/`<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">比较简洁。</font>

<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">先关闭Tomcat（执行</font>`shutdown.sh`<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">或</font>`shutdown.bat`<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">），然后删除Tomcat的webapps目录下的所有文件夹和文件，最后把我们的</font>`hello.war`<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">复制过来，改名为</font>`ROOT.war`<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">，文件名为</font>`ROOT`<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">的应用程序将作为默认应用，启动后直接访问</font>`http://localhost:8080/`<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">即可。</font>

<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">实际上，类似Tomcat这样的服务器也是Java编写的，启动Tomcat服务器实际上是启动Java虚拟机，执行Tomcat的</font>`main()`<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">方法，然后由Tomcat负责加载我们的</font>`.war`<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">文件，并创建一个</font>`HelloServlet`<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">实例，最后以多线程的模式来处理HTTP请求。如果Tomcat服务器收到的请求路径是</font>`/`<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">（假定部署文件为ROOT.war），就转发到</font>`HelloServlet`<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">并传入</font>`HttpServletRequest`<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">和</font>`HttpServletResponse`<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">两个对象。</font>

**<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">因为我们编写的Servlet并不是直接运行，而是由Web服务器加载后创建实例运行，所以，类似Tomcat这样的Web服务器也称为Servlet容器。</font>**

### <font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">Tomcat</font>
<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">由于Servlet版本分为<=4.0和>=5.0两种，所以，要根据使用的Servlet版本选择正确的Tomcat版本。从</font>[<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">Tomcat版本页</font>](https://tomcat.apache.org/whichversion.html)<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">可知：</font>

+ <font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">使用Servlet<=4.0时，选择Tomcat 9.x或更低版本；</font>
+ <font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">使用Servlet>=5.0时，选择Tomcat 10.x或更高版本。</font>

<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">在Servlet容器中运行的Servlet具有如下特点：</font>

+ <font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">无法在代码中直接通过new创建Servlet实例，必须由Servlet容器自动创建Servlet实例；</font>
+ <font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">Servlet容器只会给每个Servlet类创建唯一实例；</font>
+ <font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">Servlet容器会使用多线程执行</font>`doGet()`<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">或</font>`doPost()`<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">方法。</font>

## <font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">结论</font>
<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">编写Web应用程序就是编写Servlet处理HTTP请求；</font>

<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">Servlet API提供了</font>`HttpServletRequest`<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">和</font>`HttpServletResponse`<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">两个高级接口来封装HTTP请求和响应；</font>

<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">Web应用程序必须按固定结构组织并打包为</font>`.war`<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">文件；</font>

<font style="color:rgb(31, 41, 55);background-color:rgb(249, 250, 251);">需要启动Web服务器来加载我们的war包来运行Servlet。</font>

