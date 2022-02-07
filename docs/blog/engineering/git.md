# git

git 是一个免费开源的分布式版本控制系统。基于文件快照的方式，如果更新则保存新的快照，未更新的文件则会保留一个链接，指向前一个版本的文件。每次更新都是向 git 中添加数据。 [Git 安装方法](https://git-scm.com/book/zh/v2/%E8%B5%B7%E6%AD%A5-%E5%AE%89%E8%A3%85-Git)

## 集中式

svn 就是集中式版本控制系统的工具， 代码是放在中央服务器的。在干活的时候，把中央服务器的代码同步到本地，修改完代码之后，将本地代码推送到远程中央服务器。
最大的缺点是：必须联网才能工作。

## 分布式

git 与其他版本控制工具（svn） 的最大区别就是不需要一个中心化的控制系统（除非与多人协作），所有人的本地都是一个完整的代码库，操作最多的也是在本地操作，只有讲代码推向远端，给别人分享时才需要联网。
强大的分支管理系统也是 git 的优点之一。

## 指令

### init

> init 将当前文件夹内添加一个 .git 文件夹，并将当前文件夹初始化为一个 本地 git 仓库，可以本地管理代码。

```
git init
// 查看.git文件是否存在
ls -al
```

### remote

> 查看 git 仓库

```
MacBook-Pro webBlog % git remote -v

origin  git@github.com:RoadAspen/webBlog.git (fetch)
origin  git@github.com:RoadAspen/webBlog.git (push)
```

### stash

> 暂存

### commit

>

### push

> 提交代码， 将本地代码推送到远程仓库
