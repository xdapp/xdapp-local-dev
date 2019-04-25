# XDApp Console 静态文件

### 初始化环境

`npm install`

### 启动服务

`bin/Server` 或 `npm run start` (npm run不支持增加额外参数)

`bin/Server` 使用方法：

```
Usage: Server [options]

Options:

  -V, --version        output the version number
  -h, --host <string>  监听IP，默认 0.0.0.0
  -p, --port <n>       监听端口，默认 8060
  --nocompress         研发模式时关闭压缩
  --nocache            禁用缓存
  --dev                研发模式
  --rebuild            启动时重新生成静态页面
  -h, --help           output usage information
```

### 启动研发服务

`bin/Server --dev` 或 `npm run dev`

### 命令行工具

`bin/ToolsAssets` 使用方法：

```
  Usage: ToolsAssets watch|build|deploy [options]

  Options:

    -V, --version          output the version number
    --dev                  研发模式
    --nomap                不输出map
    --nocompress           关闭压缩
    --origin <string>      down|deploy|diff 可用, 发布到服务器, 默认 https://assets.xdapp.com
    -c, --config <string>  down|deploy|diff 可用, 配置文件，默认根目录的 assets-deploy.json 文件
    --clean                build|down|deploy 可用, 清除目录下文件多余文件
    -h, --help             output usage information

  Commands:

    build [dir]            生成指定文件
                           只生成指定文件: ToolsAssets build js/test.js
                           生成指定文件夹: ToolsAssets build [js|css|page|i18n]
                             例: ToolsAssets build js
                             例: ToolsAssets build css/test/
    watch                  监听项目文件修改
    deploy [dir]           部署文件到服务器
                           加 --clean 清除服务器目录下多余文件
                             例: ToolsAssets deploy
                             例: ToolsAssets deploy --dev
                             例: ToolsAssets deploy page/test.vue
    down [dir]             下载远程文件到本地, 参数同deploy
                           加 --clean 清除本地目录下多余文件
                             例: ToolsAssets down
    diff [dir]             检查本地和远程差异的文件, 参数同deploy
```

**目录结构说明**: 根目录 version.txt 设定版本，本地开发可设置为 dev，项目源代码在 `src` 目录中，生成的文件在 `webroot/` 目录中，第三方的库使用 [bower](http://bower.io/) 管理。


### 部署

`deploy.json` 中配置了项目、账号、token等，使用 `npm run deploy` 部署到正式环境， `npm run deploy-dev` 部署到测试环境

### 使用bower安装第三方库

首先安装 bower: `npm install -g bower`，文件 `.bowerrc` 已设定

```json
{
  "directory": "webroot/lib/"
}
```

所有通过 `bower install <package>` 安装的第三方库将安装在 `webroot/lib/` 目录中，例如：`bower install jquery`


### 菜单配置

修改根目录的 `menu.json` 文件

