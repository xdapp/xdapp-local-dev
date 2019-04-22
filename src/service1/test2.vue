<template>
    <div>
        <div class="card">
            <div class="card-header card-header-icon">
                <el-col :span="20">
                    <div class="card-icon">
                        <i class="fa fa-list-alt"></i>
                    </div>
                    <h4 class="card-title">欢迎使用XDAPP Console UI Agent</h4>
                    <p class="card-category">这是一个副标题</p>
                </el-col>
                <el-col :span="4" style="text-align:right;padding: 15px 0">
                    <el-button class="ripple" type="danger" @click="testFun()">右侧按钮</el-button>
                </el-col>
            </div>
            <div class="card-body">
                <div>Console使用的是 <a href="http://element.eleme.io/" target="_blank">http://element.eleme.io/</a> 组件，你可以直接使用而无需任何部署。</div>


                <div style="padding: 20px 0">{{test}}</div>

                <h3>以下是Button按钮示例</h3>
                <br>
                <br>
                <el-row>
                    <el-button>默认按钮</el-button>
                    <el-button type="primary">主要按钮</el-button>
                    <el-button type="success">成功按钮</el-button>
                    <el-button type="info">信息按钮</el-button>
                    <el-button type="warning">警告按钮</el-button>
                    <el-button type="danger">危险按钮</el-button>
                </el-row>

                <el-row>
                    <el-button plain>朴素按钮</el-button>
                    <el-button type="primary" plain>主要按钮</el-button>
                    <el-button type="success" plain>成功按钮</el-button>
                    <el-button type="info" plain>信息按钮</el-button>
                    <el-button type="warning" plain>警告按钮</el-button>
                    <el-button type="danger" plain>危险按钮</el-button>
                </el-row>

                <el-row>
                    <el-button round>圆角按钮</el-button>
                    <el-button type="primary" round>主要按钮</el-button>
                    <el-button type="success" round>成功按钮</el-button>
                    <el-button type="info" round>信息按钮</el-button>
                    <el-button type="warning" round>警告按钮</el-button>
                    <el-button type="danger" round>危险按钮</el-button>
                </el-row>

                <el-row>
                    <el-button icon="el-icon-search" circle></el-button>
                    <el-button type="primary" icon="el-icon-edit" circle></el-button>
                    <el-button type="success" icon="el-icon-check" circle></el-button>
                    <el-button type="info" icon="el-icon-message" circle></el-button>
                    <el-button type="warning" icon="el-icon-star-off" circle></el-button>
                    <el-button type="danger" icon="el-icon-delete" circle></el-button>
                </el-row>


                <br><br><br>
                <h3>以下是Tag示例</h3>
                <br>
                <el-tag>标签一</el-tag>
                <el-tag type="success">标签二</el-tag>
                <el-tag type="info">标签三</el-tag>
                <el-tag type="warning">标签四</el-tag>
                <el-tag type="danger">标签五</el-tag>


            </div>
        </div>
    </div>
</template>


<script>
    export default {
        data() {
            return {
                test: '变量内容test, time: ' + new Date().getTime(),
            };
        },
        methods: {
            testFun() {
                this.$app.alert('你点击了我');
            }
        }
    }
</script>