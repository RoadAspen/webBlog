# git

git 是一个免费开源的分布式版本控制系统。基于文件快照的方式，如果更新则保存新的快照，未更新的文件则会保留一个链接，指向前一个版本的文件。每次更新都是向 git 中添加数据。 [Git 安装方法](https://git-scm.com/book/zh/v2/%E8%B5%B7%E6%AD%A5-%E5%AE%89%E8%A3%85-Git)

## 集中式

svn 就是集中式版本控制系统的工具， 代码是放在中央服务器的。在干活的时候，把中央服务器的代码同步到本地，修改完代码之后，将本地代码推送到远程中央服务器。
最大的缺点是：必须联网才能工作。

## 分布式

git 与其他版本控制工具（svn） 的最大区别就是不需要一个中心化的控制系统（除非与多人协作），所有人的本地都是一个完整的代码库，操作最多的也是在本地操作，只有讲代码推向远端，给别人分享时才需要联网。
强大的分支管理系统也是 git 的优点之一。

## git 分区

git 通过划分出几个区域，来管理本地的文件。

### 工作区 work

### 暂存区 stage

### 本地版本库 commit

### 远程仓库 origin

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

### add

> 将新增文件加入到 git 版本控制中，或者修改文件，并放入到暂存区，可以被 commit 选中

### restore

> 将暂存区的文件取出放到 工作区

### stash 暂存

> 将当前更改保存到暂存区

```
git stash
```

#### 使用场景

当你在一个 feature 的分支下，正在开发一个新的功能模块，如 修改了 a.txt 文件， 新增了 b.txt 文件，此时功能开发了一半，忽然来了一个线上紧急 bug 修复，这时候就要切换分支，如果直接创建一个 commit，这个 commit 只包含了一半的的需求没有意义，这时候就需要把修改存储起来。

1. 先把 b.txt 新增文件加入到 stage 中。
2. 将

```
git add b.txt
```

```css
// 将当前所有的更改放入暂存区,
git stash

// 将当前最新的暂存区恢复到当前工作区，且删除暂存列表中的记录
git stash pop

//将当前最新的暂存区恢复到当前工作区，保留暂存列表中的记录
git stash apply

// 删除暂存区
git stash drop
```

### commit

> 本地提交,将暂存区（通过 git add）的 代码

```
git commit -m 'message'

//  -am 为先执行 add操作，再执行commit操作，不用单独add
git commit -am 'message'
```

### push

> 远程提交代码， 将本地代码推送到远程仓库

git push -f 以当前版本覆盖远程版本

### branch

> 查看本地分支

### reset

> 切换版本

git reset --hard

### checkout

> 切换分支 或 更新本地
