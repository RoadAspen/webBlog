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

## git flow 理解

日常工作中，我们可能在 Git 使用上频繁交互的流程大致会是这样的（不同规范下会有一些区别，但是大差不大）：

1. 来一个新的需求，我们从 master 分支 checkout\branch 一个新的 feature 分支出来进行开发。
2. 当开发完某些功能点之后，我们执行 `git add` ，将代码提交到暂存区。
3. 执行 `git commit` 将暂存区的代码提交到本地仓库。
4. 执行 `git push` 将本地仓库的代码同步到远程仓库。
5. 当我们开发完所有的分支的时候，我们就把 feature 分支合并到 dev 分支上发布测试环境测试。
6. 测试完成之后，我们发起一个 `merge request`，将我们的代码走合并流程到 master 分支。
7. 我们需要先将 master 分支合并到我们的分支之后再提 MR，提前解决代码冲突。

以上就是一般常规的 git flow 流程，当然不同的公司会有不同的流程，这个不再做过多的解释。

## Git 配置

### git config

`--global` 全局配置文件 ~/.gitconfig

`--system` 系统配置文件 /usr/local/git/etc/gitconfig

`--local` 项目仓库配置文件 项目路径/.git/config

```sh
# 用法
 git config [<options>]

# 查看当前生效的配置信息，一般为所有配置文件的并集
 git config -l
 git config --list

# 查看配置文件
 git config --<global ｜system ｜ local> -l

# 编辑配置文件
 git config --<global ｜system ｜ local> -e
 git config --<global ｜system ｜ local> --edit

# 添加配置项
 git config --<global ｜system ｜ local> --add name value

# 删除配置项
 git config --<global ｜system ｜ local> --unset name [value-regex]

# 替换配置项
 git config --<global ｜system ｜ local> --replace-all name value [value-regex]

# 获取配置项
 git config --<global ｜system ｜ local> --get name [value-regex]

# 重命名配置项的section
 git config --<global ｜system ｜ local> --rename-section old-name new-name

# 移除配置项的section
 git config --<global ｜system ｜ local> --remove-section name [value-regex]

```

### 常用配置

```sh
# 配置提交记录中的用户信息
git config --global user.name <用户名>
git config --global user.email <邮箱地址>

# 配置提交信息模版
git config --global commit.template <~/.文件名>

# 更改Git缓存区的大小
# 如果提交的内容较大，默认缓存较小，提交会失败
# 缓存大小单位：B，例如：524288000（500MB）
git config --global http.postBuffer <缓存大小>

# 调用 git status/git diff 命令时以高亮或彩色方式显示改动状态
git config --global color.ui true

# 配置可以缓存密码，默认缓存时间15分钟
git config --global credential.helper cache

# 配置密码的缓存时间
# 缓存时间单位：秒
git config --global credential.helper 'cache --timeout=<缓存时间>'

# 配置长期存储密码
git config --global credential.helper store

```

## git 仓库初始化

### git init

init 将当前文件夹内添加一个 .git 文件夹，并将当前文件夹初始化为一个 本地 git 仓库，可以本地管理代码。

```sh
git init
# 查看.git文件是否存在
ls -al
```

### git clone

克隆远程代码仓库。

```sh
git clone git@github.com:RoadAspen/webBlog.git
```

### git remote

操作远端仓库

```sh
# 查看本地存在的远程仓库
git remote

# 查看本地存在的远程仓库，更详细信息git remote -v
git remote -v

# 添加远程仓库，并指定主机名
git remote add <远程仓库主机名> <远程仓库地址>

# 删除指定的远程仓库
git remote remove <远程仓库主机名>

# 修改远程仓库的主机名
git remote rename <旧的远程仓库主机名> <新的远程仓库主机名># 修改远程仓库的URL
git remote set-url <远程仓库主机名> <新的远程仓库地址>

```

## 分支相关

### git branch

```sh
# 查看本地仓库的所有分支
git branch

# 查看远程仓库的所有分支
git branch -r

# 查看本地仓库和远程仓库的所有分支
git branch -a

# 创建新的本地分支，新分支基于上一次提交建立
git branch <分支名>

# 创建新的本地分支，新分支基于指定的commit
git branch <分支名> <commit>

# 删除指定的本地分支
git branch -d <分支名>

# 强制删除指定的本地分支
git branch -D <分支名>

# 修改分支名，如果不指定原分支名，则默认为当前分支
git branch -m [原分支名] <新分支名>

# 强制修改当前分支名
git branch -M <新分支名>

```

### git checkout

切换分支 、 放弃本地更改

```sh
# 切换分支
git checkout <分支名>

# 创建并切换到新的分支，保留所有的提交记录
git checkout -b <分支名>

# 创建并切换到新的分支，删除所有的提交记录
git checkout --orphan <分支名>

# 替换掉本地的改动，新增的文件和已经添加到暂存区的内容不受影响
git checkout <文件路径>

```

### git switch

**用于替换 checkout 中的分支操作功能**

```sh
# 切换到已有分支
git switch <分支名>

# 创建并切换到新分支
git switch -c <分支名>

```

### git restore

**用于替换 checkout 中的放弃改动的一部分功能**

```sh
git restore <文件名>
```

### git status

**查看当前分支状态**

```sh
# 查看所有文件的状态
git status
# 查看某个文件的状态
git status <文件名>
```

## 本地代码提交

### git add

将当前更改提交到暂存区

```sh
# 将 指定文件 添加到暂存区
git add <文件路径>

# 将所有 修改和新增 的文件添加到暂存区
git add .

# 将所有 修改和删除 的文件添加到暂存区，不包括 新增 的文件
git add -u .
git add -update .

# 将 所有改动的文件 添加到暂存区
git add -A .
git add -all .

```

### git reset

还原提交记录，可以回退到某个版本。主要用于本地 commit 操作。

`--mixed` 不删除工作空间改动代码，撤销 commit，撤销 git add .操作。默认参数

`--soft` 不删除工作空间改动代码，撤销 commit，不撤销 git add .操作

`--hard` 删除工作空间改动代码，撤销 commit，撤销 git add .操作，并恢复到上一次的提交状态

```sh
# HEAD 是当前版本  HEAD^ 是上个commit  HEAD2 或者 HEAD^^ 是撤回两次提交
# 撤销最近一次的提交
git reset HEAD~
git reset --mixed HEAD~

# 重置暂存区，默认保留文件的变更
# 相当于将用 "git add" 命令更新到暂存区的内容撤出暂存区，可以指定文件
git reset [文件路径]
git reset --mixed [文件路径]

# 改变 HEAD 指向，撤销到指定的commit id，并在本地保留文件的变更
git reset <提交ID>
git reset --mixed <提交ID>

# 改变 HEAD 指向，撤销到指定的提交记录，并在本地保留文件的变更
# 相当于调用 "git reset --mixed" 命令后又做了一次 "git add"
git reset --soft <提交ID>

# 改变 HEAD 指向，撤销到指定的提交记录，并丢弃所有的历史记录
git reset --hard <提交ID>
```

### git revert

创建一个新的 commit， 但是这个提交是指定 commit id 之后的所有更改的反向操作。 通常用于对已经推送到远端仓库的提交，可以让别的程序员知道你做了哪些 git 操作，为什么要撤销操作。

```sh
# 保留之前的commit，回到之前的提交 并创建新的commit
git revert <commit hash>
```

### git commit

将暂存区的文件提交到本地仓库

```sh
# 将 暂存区所有的文件 提交到本地仓库，调用文本编辑器输入该次提交的描述信息
git commit

# 将 暂存区所有的文件 提交到本地仓库
git commit -m <提交信息>

# 将 暂存区指定的文件 提交到本地仓库
git commit [文件1] [文件2] -m <提交信息>

# 将 "git add" 命令添加的所有文件 提交到本地仓库
git commit -a

# 将 工作区的内容 直接提交到本地仓库
# 不包括未被版本库跟踪的文件，等同于先调用了 "git add -u"
git commit -am <提交信息>

# 修改上次提交记录的描述信息
git commit --amend

```

### git stash

**将本地更改临时保存， 通常用于 需求开发一半，切换分支的情况**

```sh
# 临时保存所有修改的文件，message为备注信息, 不包含新增的文件
git stash
git stash save <备注信息>

# 恢复最近一次的stash，保留stash记录
git stash apply

# 恢复指定的stash，保留stash记录
git stash apply <stash 序号>

# 恢复最近一次贮藏，并删除stash 记录
git stash pop

# 恢复指定的stash，并删除stash记录
git stash pop <stash 序号>


# 显示所有的贮藏
git stash list

# 丢弃最近一次贮藏
git stash drop
# 丢弃id 为 1 的 stash
git stash drop 1
```

### git rm

删除本地文件并直接存入暂存区

```sh
# 删除工作目录中的文件夹，并将删除动作添加到暂存区（stage）
git rm -r <文件夹路径>

# 删除工作目录中的文件，并将删除动作添加到暂存区（stage）
git rm <文件路径>

# 删除暂存区的文件
git rm --cached <文件路径>

# 删除工作目录中的文件，并删除所有暂存区的文件,
git rm -rf .

```

### git cherry-pick

将指定的 commit 提交到当前分支

```sh
git checkout master
# 069dd85是在branchA分支的提交的commit id， 合并到 master分支， commit id 会改变
git cherry-pick 069dd85

```

主要用于 commit 在 分支间的转移， **如果存在冲突**，可以执行以下命令：

```sh
# 解决冲突后，将修改的文件重新加入暂存区,然后执行这个命令
git cherry-pick --continue

# 跳过当前提交，继续进行队列中其余的命令
git cherry-pick --skip

# 中断提交，不恢复工作区
git cherry-pick --quit

# 放弃合并，会推到命令操作之前的样子
git cherry-pick --abort

```

### git push

将本地分支推送到远程仓库

```sh
# 将本地分支推送到指定远程主机名下的远程分支
git push <远程主机名> <本地分支名>:<远程分支名>
git push origin master:master

# 将本地分支推送到与之存在"追踪关系"的远程分支
# 省略远程分支名，如果该远程分支不存在，则会被新建
git push <远程主机名> <本地分支名>
git push origin master

# 如果当前分支与远程分支之间存在"追踪关系"，则本地分支和远程分支都可以省略
git push <远程主机名>
git push origin

# 如果当前分支只有一个追踪分支，那么主机名都可以省略
git push

# 当前分支推送到远程分支，并覆盖 commit 记录。
git push -f

# 如果当前分支与多个远程主机存在"追踪关系"，则可以使用 -u 指定一个默认主机，这样以后就可以不加任何参数使用git push
git push -u <远程主机名> <本地分支名>
git push -u origin master

# 删除指定远程主机名下的远程分支
# 省略本地分支名，等同于推送一个空的本地分支到远程分支
git push <远程主机名> :<远程分支名>
git push <远程主机名> --delete <远程分支名>

# 强制推送,不推荐使用
git push --force

# 更安全的强制推送
git push --force-with-lease

```

## 远程代码同步

### git fetch

获取远程仓库的最新版本代码, 用于查看最新的更新，决定是否合并代码。

```sh
# 抓取远程仓库所有分支的最新版本
git fetch -all

# 抓取远程仓库指定分支的最新版本
git fetch <远程主机名> <远程分支名>

```

取回更新后，会返回一个 `FETCH_HEAD` ，指的是某个 branch 在服务器上的最新状态,
使用 git log 查看

```sh
git log -p FETCH_HEAD
```

### git merge

合并分支， 会创建一个新的 commit,在公共分支使用

```sh
# 将指定的分支合并到当前分支
git merge <分支名>

# 当合并分支后出现冲突，撤回合并分支
git merge --quit

```

如果冲突了，就解决冲突，然后重新创建 commit

### git pull

`git pull` = `git fetch` + `git merge` 操作

```sh
# 拉取远程服务器上的变更，并合并到你的工作目录
git pull [远程仓库的地址]

# 如果本地分支和远端分支同步，则可以省略仓库地址
git pull

# 不执行merge操作，转而执行rebase操作， git fetch + git rebase
git pull --rebase
```

### git rebase

**合并分支， 但是不会创建新的 commit，没有多余的合并记录。更适合在私人分支使用**

```sh
# 将指定的分支合并到当前分支
git rebase <分支名>

# 如果冲突了，就解决完冲突之后再执行这个操作
git rebase --continue

# 取消本次rebase
git rebase --abort

# 对当前分支最近的6次提交进行操作，打开vim ，可以使用 squash 将 6次提交合并为一次提交。
git rebase -i HEAD~6

```

可以通过 rebase 来合并最近几次的 commit。
优点： 可以是提交历史变为一条线。
缺点： rebase 以后我就不知道我的当前分支最早是从哪个分支拉出来的了，因为基底变了。

commit 记录

- `git log`
- `git reflog`
- `git tag`

这些命令基本满足我们全部的日常使用。
