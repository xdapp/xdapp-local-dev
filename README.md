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
Usage: ToolsAssets watch|build [options]

Options:

  -V, --version  output the version number
  --dev          研发模式
  --nocompress   关闭压缩
  --clean        build 模式下清除对应目录下文件多余文件
  -h, --help     output usage information

Commands:

  build [dir]    生成指定文件
                 只生成指定文件: ToolsAssets build js/test.js
                 生成指定文件夹: ToolsAssets build [js|css|page|i18n]
                     例: ToolsAssets build js
                     例: ToolsAssets build css/test/
  watch          监听项目文件修改
```

**目录结构说明**: 根目录 version.txt 设定版本，本地开发可设置为 dev，项目源代码在 `src` 目录中，生成的文件在 `webroot/` 目录中，第三方的库使用 [bower](http://bower.io/) 管理。


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

