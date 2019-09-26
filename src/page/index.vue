<template>
<div>
    <Card title="首页">
        请替换本首页面内容为你的内容或删除本页，本文件路径 <code>src/page/index.vue</code>

        <br><br>
        src/page/ 目录内文件为示例，请删除。

        <br><br><br>

        <el-alert type="warning" show-icon :closable="false">
            <slot slot="title">此开发工具绑定线上环境项目后可读取、保存项目配置， 若你还没有绑定请在 <a href="/dev/">本地开发工具</a> 中绑定</slot>
        </el-alert>
    </Card>
</div>
</template>

<script>
// components 为系统自带的组件
import Card from 'components/card.vue';

export default {
    components: {
        Card,
    },
    data() {
        return {};
    }
}
</script>