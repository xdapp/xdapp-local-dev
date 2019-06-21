<template>
<div>
    <Card title="默认主题">
        <el-alert title="成功提示的文案" type="success">此页面在 /app/service1/test1.vue 中</el-alert>
            <br><br>
        <el-alert title="消息提示的文案" type="info"></el-alert>
            <br><br>
        <el-alert title="警告提示的文案" type="warning"></el-alert>
            <br><br>
        <el-alert title="错误提示的文案" type="error"></el-alert>
    </Card>

    <Card title="Dark主题" category='加 effect="dark"'>
        <el-alert title="成功提示的文案" effect="dark" type="success">此页面在 /app/service1/test1.vue 中</el-alert>
        <br><br>
        <el-alert title="消息提示的文案" effect="dark" type="info"></el-alert>
        <br><br>
        <el-alert title="警告提示的文案" effect="dark" type="warning"></el-alert>
        <br><br>
        <el-alert title="错误提示的文案" effect="dark" type="error"></el-alert>
    </Card>

</div>
</template>


<script>
import Card from 'components/card.vue';
export default {
    components: {
        Card,
    },
    data() {
        return {
        };
    },
}
</script>