<template>
    <div>
    <el-alert title="成功提示的文案" type="success">此页面在 /app/service1/test1.vue 中</el-alert>
        <br><br>
    <el-alert title="消息提示的文案" type="info"></el-alert>
        <br><br>
    <el-alert title="警告提示的文案" type="warning"></el-alert>
        <br><br>
    <el-alert title="错误提示的文案" type="error"></el-alert>
    </div>
</template>


<script>
    export default {
        data() {
            return {
            };
        },
    }
</script>