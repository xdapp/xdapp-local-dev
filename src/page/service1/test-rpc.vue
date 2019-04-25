<template>
    <div>
        <div class="card">
            <div class="card-header card-header-icon">
                <div class="card-icon">
                    <i class="fa fa-list-alt"></i>
                </div>
                <h4 class="card-title">和服务器RPC通信</h4>
            </div>
            <div class="card-body">
                <p style="line-height: 2em">
                    服务器使用定制的 <a href="http://hprose.com" target="_blank">Hprose</a> 的RPC服务，
                    在vue里可以使用 <code>this.$xdAppService</code> 可直接获取到XDApp的Service服务对象
                    <br>
                    使用 <code>this.$service.name</code> (其中name为注册的服务名)可直接获取到自己服务的Service服务对象
                </p>


                <br><br>
                <el-button type="success" @click="getTime()">获取服务器时间</el-button>
                <el-button type="warning" @click="getTimeAsync()">获取服务器时间（异步方式）</el-button>
                <el-button type="danger" @click="getTimeCo()">获取服务器时间（协程方式）</el-button>
                <br><br><br><br><br>
                访问自定义"test"服务的abc() RPC方法, 代码如下：
                <el-alert
                    type="info">
<pre>
this.$service.test.abc('hello').then((data) => {
    console.log('get data:', data);
    this.$app.success(data);
});
</pre>
                </el-alert>
                <br>
                <el-button type="danger" @click="customRpc()">请求</el-button>
                <br>使用XDAPP的agent连接到本服务的TCP端口, 注册为 test 服务，并暴露 abc() 方法。
            </div>
        </div>
    </div>
</template>


<script>
//    import './components/test.vue';

    export default {
        data() {
            return {
                test: '变量内容test, time: ' + new Date().getTime(),
            };
        },
        methods: {
            getTime() {
                this.$service.xdapp.time.getTime(3, 'sdf').then((time) => {
                    console.log('get time:', time)
                });

                // 2个同时调用
                const c1 = this.$service.xdapp.time.getTime();
                const c2 = this.$service.xdapp.time.format();

                c1.then((time) => {
                    // c1获取后触发
                    c2.then((date) => {
                        // c2 获取后触发
                        this.$app.alert(`服务器时间：${date}<br>时间戳 ${time}`);
                    });
                });
            },
            async getTimeAsync() {
                // 注意有 async
                const service = this.$service.xdapp;     // 此对象为系统的rpc服务
                let time = service.time.getTime();
                let date = service.time.format('Y-m-d H:i:s.u');
                this.$app.alert(`服务器时间：${await date}<br>时间戳 ${await time}`);
            },
            getTimeCo() {
                // see https://github.com/hprose/hprose-html5/wiki/协程
                // test1
                const co = this.$hprose.co;
                const thunkify = this.$hprose.thunkify;
                const sum = thunkify(function(a, b, callback) {
                    callback(null, a + b);
                });
                co(function*() {
                    let result = sum(1, 2);
                    console.log(yield result);
                    console.log(yield sum(2, 3));
                    console.log(yield result);
                });


                // test for rpc
                // test2
                const service = this.$service.xdapp;     // 此对象为系统的rpc服务
                const app = this.$app;
                co(function*() {
                    // 注意：function后要有*
                    // 里面没有 this 对象, 可以在上层 const _this = this;，然后用 _this 获取
                    let time = service.time.getTime();
                    let date = service.time.format('Y-m-d H:i:s.u');
                    console.log(time, date);
                    app.alert(`服务器时间：${yield date}<br>时间戳 ${yield time}`);
                });
            },
            customRpc() {
                this.$service.test.abc('hello').then((data) => {
                    console.log('get data:', data);
                    this.$app.success(data);
                });
            }
        }
    }
</script>