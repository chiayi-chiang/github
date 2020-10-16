const express = require('express');
const app = express();
app.listen(3000,function(){//監聽3000端口
    console.log("server running at 127.0.0.1.3000");//執行呼叫函式在控制台輸出
});

// -> app.get(): express中的一個，用于匹配get请求，所谓中间件就是在該輪http请求中依次执行的一系列函数。
// -> '/': 它匹配get请求的根路由 '/'也就是 127.0.0.1:3000/就匹配到他了
// -> (req,res): req带表浏览器的请求对象，res代表服务器的返回对象 
app.get('/',function(req,res){
    res.redirect('/chat.html');
});

 