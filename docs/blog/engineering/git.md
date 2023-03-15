# git

git 是一个免费开源的分布式版本控制系统。基于文件快照的方式，如果更新则保存新的快照，未更新的文件则会保留一个链接，指向前一个版本的文件。每次更新都是向 git 中添加数据。 [Git 安装方法](https://git-scm.com/book/zh/v2/%E8%B5%B7%E6%AD%A5-%E5%AE%89%E8%A3%85-Git)

## 集中式

svn 就是集中式版本控制系统的工具， 代码是放在中央服务器的。在干活的时候，把中央服务器的代码同步到本地，修改完代码之后，将本地代码推送到远程中央服务器。
最大的缺点是：必须联网才能工作。

## 分布式

git 与其他版本控制工具（svn） 的最大区别就是不需要一个中心化的控制系统（除非与多人协作），所有人的本地都是一个完整的代码库，操作最多的也是在本地操作，只有讲代码推向远端，给别人分享时才需要联网。
强大的分支管理系统也是 git 的优点之一。

## git 区域裂解

git 通过划分出几个区域，来管理本地的文件。

- `远程仓库区`： 就是我们代码最终提交的归宿，gitlab 或者 github。
- `本地分支`： 属于你的开发分支，你可以在该分支上 commit 代码，此时会将暂存区的代码修改作为一个提交记录存储到本地（此时还未同步到远端代码库）。
- `暂存区`：执行 git add 之后会将代码存到的区域，用于将工作区的一些修改暂时存起来。
- `工作区`：写代码的地方，可以在此处做工作修改。

### 工作区 work

### 暂存区 stage

### 本地版本库 commit

### 远程仓库 origin

## git 工作流理解

日常工作中，我们可能在 Git 使用上频繁交互的流程大致会是这样的（不同规范下会有一些区别，但是大差不大）：

1. 来一个新的需求，我们从 master 分支 checkout 一个新的 feature 分支出来进行开发。
2. 当开发完某些功能点之后，我们执行 git add ，将代码提交到暂存区。
3. 执行 git commit 将暂存区的代码提交到本地仓库。
4. 执行 git push 将本地仓库的代码同步到远程仓库。
5. 当我们开发完所有的分支的时候，我们就把 feature 分支合并到 dev 分支上发布测试环境测试。
6. 测试完成之后，我们发起一个 merge request，将我们的代码走合并流程到 master 分支。
7. 我们需要先将 master 分支合并到我们的分支之后再提 MR，提前解决代码冲突。

以上就是一般常规的 git flow 流程，当然不同的公司会有不同的流程，这个不再做过多的解释。

## 指令概览

- `git init`
- `git clone`
- `git remote`
- `git branch`
- `git checkout`
- `git switch`
- `git stash`
- `git pull`
- `git add`
- `git rm`
- `git status`
- `git commit`
- `git fetch`
- `git merge`
- `git reset`
- `git log`
- `git reflog`
- `git revert`
- `git cherry-pick`
- `git tag`
- `git rebase`

这些命令基本满足我们全部的日常使用。

### init

init 将当前文件夹内添加一个 .git 文件夹，并将当前文件夹初始化为一个 本地 git 仓库，可以本地管理代码。

```
git init
// 查看.git文件是否存在
ls -al
```

### clone

clone 将远程代码仓库拉到本地。

```
git clone git@github.com:RoadAspen/webBlog.git
```

### remote

查看 git 仓库关联的的远程仓库

```
git remote -v

origin  git@github.com:RoadAspen/webBlog.git (fetch)
origin  git@github.com:RoadAspen/webBlog.git (push)
```

将本地代码仓库和远程仓库绑定

1. 现在本地 init 一个代码仓库。
2. 在 github 上新建一个代码仓库，copy ssh 链接。
3. 执行以下代码关联代码仓库
4. 将你的代码推送到远程仓库。 git push origin master -u 第一次需要加 -u，这会将本地 master 分支和远程的 master 分支关联起来。

```
git remote add origin git@github.com:RoadAspen/xxx.git
git push origin master -u
```

### branch

查看当前 git 分支

### add

将新增文件加入到 git 版本控制中，或者修改文件，并放入到暂存区.
只有暂存区的代码可以被 commit。

```js
git add .
git add xxx.ts  xxx.jpg
```

### restore

> 将暂存区的文件取出放到 工作区

### stash 暂存

将当前更改保存到暂存区

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
git add .

git commit -m 'message'

//  -am 为先执行 add操作，再执行commit操作，不用单独add，此操作会忽略
// 如果是新增文件，则必须使用add命令
git commit -am 'feat: message'
```

### push

> 远程提交代码， 将本地代码推送到远程仓库

```js
// 以当前版本覆盖远程版本
git push -f
```

### branch

> 查看本地分支

### reset

> 切换版本

git reset --hard

### checkout

> 切换分支 或 更新本地

### config

> git 配置

#### 开启大小写敏感

git 默认大小写不敏感

```js
git config core.ignorecase false
```

### remote

在项目文件夹下调用 `git remote -v` 可以查看这个代码库的 git 源。

```js
git remote -v

origin  git@github.com:RoadAspen/webBlog.git (fetch)
origin  git@github.com:RoadAspen/webBlog.git (push)
```
