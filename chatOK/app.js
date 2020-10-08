// 創建一個express函式，賦予值給app
const express = require('express');
const app = express();
const http = require('http');// 載入node.js原生模組http
const server = http.createServer(app);// 建立一個 http server,回傳app參數

server.listen(9000,()=>{// 進入http server的監聽port -> localhost:9000 == localhost
    console.log("server running at 127.0.0.1");// 然後執行回調函數，在終端機顯示
});

const path = require('path');// 引入path module，此module用來處理node的路徑，可以格式化路徑
const io = require('socket.io')(server);// 將socket的監聽加到app設置的module

/*
 * __dirname表示當前文件所在的絕對路徑
 * 使用path.join將app.js的绝对路徑和public加起来就得到了public的绝对路徑 -> ././public
 * express.static幫忙管理public文件夾中的資料
 * 只要有127.0.0.1:9000/xxx的路徑都會去public文件夾下找xxx文件然後發送給瀏覽器
*/
app.use('/',express.static(path.join(__dirname,'./public')));

/*
 * app.get() -> express中的一個中介函式，用於取得get請求，在該次http請求中一次執行所有函式
 * '/'-> 取得get的根路由，也就是127.0.0.1:9000
 * req->瀏覽器取得的對象，res->伺服器返回的對象
 * 如果瀏覽器請求了跟路由'/'，瀏覽器就會重定向到'127.0.0.1:9000/chat.html'路由中
 */
app.get('/',(req,res)=>{
    res.redirect('/chat.html');
});

// $ npm install mysql
// 連線docker mysql ->localhost:8080
var mysql = require("mysql");
var con = mysql.createConnection({
    host: "mysql",
    user: "root",
    password: "root",
    database: "chatroom"
});
// 連線成功與否顯示在終端機上
con.connect(function (err) {
    if (err) {
        console.log('connecting error');
        return;
    }
    console.log('connecting success');
});
 
const users = [];// 用來存取使用者名稱
let usersNum = 0;// 上線人數     
const _sockets = [];// 將socket與使用者名稱對照

/*socket*/
// 'connection'->用來監聽127.0.0.1的連線次數
io.on('connection',(socket)=>{
    /**
     * 所有有关socket事件的逻辑都在这里写
     */
    usersNum ++;
    console.log(`当前有${usersNum}个用户连接上服务器了`);
    socket.on('login',(data)=>{
        socket.username = data.username;//先保存在socket中
        let UserTableInDB= [];
        con.query('SELECT * FROM `user`',function(error, results, fields){
            UserTableInDB =results;
            console.log(UserTableInDB);
        });
        // 循环数组判断用户名是否重复,如果重复，则触发usernameErr事件
        // for (let user of UserTableInDB) {
        //     if(user.userName === data.username){
        //         console.log("o");
        //         socket.emit('usernameErr',{err: '用户名重复'});
        //         socket.username = null;//将用户名删除，之后的事件要判断用户名是否存在
        //         break;
        //     }
        // }
        /**
         * 先保存在socket中
         * 循环数组判断用户名是否重复,如果重复，则触发usernameErr事件
         * 将用户名删除，之后的事件要判断用户名是否存在
         */
        socket.username = data.username;
        for (let user of users) {
            if(user.username === data.username){
                socket.emit('usernameErr',{err: '用户名重复'});
                socket.username = null;
                break;
            }
        }

        //如果用户名存在。将该用户的信息存进数组中
        if(socket.username){

            con.query('INSERT INTO `user` (userName) VALUES(?)',[socket.username], function(error, results, fields){

            });

            users.push({
                username: data.username,
                message: [],
                dataUrl: [],
                touXiangUrl: data.touXiangUrl
            });
    
            //保存socket
            // _sockets[socket.username] = socket;
            //然后触发loginSuccess事件告诉浏览器登陆成功了,广播形式触发
            data.userGroup = users;         //将所有用户数组传过去
            io.emit('loginSuccess',data);   //将data原封不动的再发给该浏览器
        }

        //如果用户名存在。将该用户的信息存进数组中
        // if(socket.username){
        //     users.push({
        //         username: data.username,
        //         message: [],
        //         dataUrl: [],
        //         touXiangUrl: data.touXiangUrl
        //     });
 
        //     //保存socket
        //     _sockets[socket.username] = socket;
        //     //然后触发loginSuccess事件告诉浏览器登陆成功了,广播形式触发
        //     data.userGroup = users;         //将所有用户数组传过去
        //     io.emit('loginSuccess',data);   //将data原封不动的再发给该浏览器
        // }
 
 
    });
 
    /**
     * 监听sendMessage,我们得到客户端传过来的data里的message，并存起来。
     * 我使用了ES6的for-of循环，和ES5 的for-in类似。
     * for-in是得到每一个key，for-of 是得到每一个value
     */
    socket.on('sendMessage',(data)=>{
        for(let _user of users) {
            if(_user.username === data.username) {
                _user.message.push(data.message);
                //信息存储之后触发receiveMessage将信息发给所有浏览器
                io.emit('receiveMessage',data);
                break;
            }
        }
    });
 
    /**
     * 仿照sendMessage监听sendImg事件
     */
    socket.on("sendImg",(data)=>{
        for(let _user of users) {
            if(_user.username === data.username) {
                _user.dataUrl.push(data.dataUrl);
                //存储后将图片广播给所有浏览器
                io.emit("receiveImg",data);
                break;
            }
        }
    });
 
    socket.on('sendToOne',(data)=>{
        //判断该用户是否存在，如果存在就触发receiveToOne事件
        for (let _user of users) {
            if (_user.username === data.to) {
                _sockets[data.to].emit('receiveToOne',data);
            }
        }
    });
 
    //断开连接后做的事情
    socket.on('disconnect',()=>{          //注意，该事件不需要自定义触发器，系统会自动调用
        usersNum --;
        console.log(`当前有${usersNum}个用户连接上服务器了`);
 
        //触发用户离开的监听
        socket.broadcast.emit("oneLeave",{username: socket.username});
 
        //删除用户
        users.forEach(function (user,index) {
            if(user.username === socket.username) {
                users.splice(index,1);       //找到该用户，删除
            }
        })
    })
});