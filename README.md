# XDApp Console 静态文件开发框架

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

### 更多命令

`npm run diff` 相当于执行 `./bin/ToolsAssets diff --origin=https://dev-assets.xdapp.com`，可编辑 package.json 更改

```
"start": "./bin/Server",
"dev": "./bin/Server --dev",
"deploy": "./bin/ToolsAssets deploy",
"deploy-dev": "./bin/ToolsAssets deploy --origin=https://dev-assets.xdapp.com",
"diff": "./bin/ToolsAssets diff",
"diff-dev": "./bin/ToolsAssets diff --origin=https://dev-assets.xdapp.com",
"down": "./bin/ToolsAssets down",
"down-dev": "./bin/ToolsAssets down --origin=https://dev-assets.xdapp.com",
"build": "./bin/ToolsAssets build"
```

### UI特性以及注意事项

系统已经自动 import 饿了么组件以及vue、vuex，可以直接使用无需再手动 import。
饿了么组件使用见 [https://element.eleme.io/#/zh-CN/component/button](https://element.eleme.io/#/zh-CN/component/button)

在 vue 文件中支持 import 相对路径，但是.vue文件需要有后缀，例如 `import myTest from '../test.vue'`， 
而 js 文件不需要后缀，例如 `import myTest from '../test'`，
可以直接导入我们已经开发好的前端组件，API见 https://www.xdapp.com/docs/guide/components/ 导入方法在每个组件文档中都有，例：`import Card from 'components/card.vue'`。

src目录结构：

```
src/page/    - 存放页面的目录支持子文件夹
                例 src/page/test.vue ，浏览器访问路径就是 /test
                   src/page/abc/index.vue ，浏览器访问路径就是 /abc/ 或 /abc/index
src/js/      - 存放自己js的目录
src/store/   - 存放vuex文件的目录，使用方法见下面vuex部分（可支持双向绑定）
src/i18n/    - 存放自己语言包的目录
```

本服务器并不像webpack那样将项目整个打包发布，而是每个文件单独编译成一个独立的文件在使用时自动加载，为了便于项目长期稳定运行，不建议自己添加第三方库或者组件，如有需要可以联系我们评估后加入到公共库里使用。

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


### 发布和部署

`deploy.json` 中配置了项目、账号、token等，使用 `npm run deploy` 部署到正式环境， `npm run deploy-dev` 部署到测试环境

### 菜单配置

修改根目录的 `menu.json` 文件




## Vuex 使用

XDApp系统Vuex的store模块并不一次性加载，而是按需模块化加载，Vuex通常情况下使用单例模式（即整个页面就1个实例化的），以下是一个简单的例子。

首先在 `src/store` 目录下创建一个模块，例 `myModule.js`，常见的写法如下：

```js
import {storeRegister, storeHelper} from 'util';

// 多实例避免相互数据污染可以像data一样定义一个 function
export const state = {
    test: 123
};

// 同步方法
export const mutations = {
};

// 可以异步的方法
export const actions = {
    // loadData() {
    //     const app = require('app');
    //     app.service.xdapp.get().then(() => {})
    // }
};

export const getters = {
};

// 结构体
const structure = {
    namespaced: true,   // 启用命名空间
    state,
    mutations,
    actions,
    getters,
};

// 导出配置结构体
export default structure;

// 注册模块并返回实例化 $app.store 实例化对象
export const store = storeRegister(module, structure);

// 导出助手对象, 除了包含了 mapState, mapActions, mapGetter，还附有一个 mapTwoWay，可以像 mapState 一样放在 vue 的 computed 里
export const helper = storeHelper(module);

// helper.withNamespace() 方法将会返回一个带命名空间的方法名，例: myModule/loadData
// store.dispatch(helper.withNamespace('loadData'));
```

然后在vue文件中引入即可

```js
// store文件路径，可以是相对目录
import {store, helper} from 'store/test';

export default {
    store,  // 加入store对象，这其实就是 app.store 对象
    data() {
        return {}
    },
    computed: {
        ...helper.mapTwoWay([
            'test'  // 将会绑定一个双向更改
        ]),
    },
    methods: {
      ...helper.mapActions([
        'foo', // -> this.foo() , 将触发 actions 里同名方法
        'bar' // -> this.bar()
      ])
    },
    //...
}
```

详细用法见 https://vuex.vuejs.org/zh/guide/modules.html
