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

// 從DB抓取過去聊天記錄
app.get('/getdata', (req, res) => {
    con.query('SELECT user.userName ,sendMessage.sendTime,sendMessage.message,sendMessage.touXiangUrl FROM user JOIN `sendMessage` ON sendMessage.whosend=user.userID ORDER BY `sendMessage`.`messageID` desc limit 10 ', function (error, results, fields) {
        let sendmessage = JSON.stringify(results);//將SELECT出來的資料字串化
        // console.log(sendmessage);
        res.send(sendmessage);//回傳給mian.js
    });
});
 
const users = [];// 用來存取使用者名稱
let usersNum = 0;// 上線人數     
const _sockets = [];// 將socket與使用者名稱對照

/*有關socket事件邏輯*/
// 'connection'->用來監聽127.0.0.1的連線次數
io.on('connection',(socket)=>{
    usersNum ++;
    console.log(`當前有${usersNum}個用戶連接上伺服器了`);
    socket.on('login',(data)=>{
        //先用socket判斷是否重複上限
        //用sql判斷是否已成為會員，未成為會員者，才將入資料庫
        con.query('SELECT * FROM `user` WHERE userName = ?',[data.username],function(error, results, fields){
            if(results.length == 0){
                con.query('INSERT INTO `user`(`userName`, `userPasswd`) VALUES (?,?)',[data.username,data.userpassword]);
            }
            
        });
        socket.username = data.username;//將使用者輸入的名稱，存在socket中
        //在用socket判斷是否重複上限
        //判斷存在socket中的用戶名是否重複，如果重複，則觸發usernameErr事件
        for (let user of users) {
            if(user.username === data.username){
                socket.emit('usernameErr',{err: '使用者名稱重複'});
                socket.username = null;// 將用戶名刪除，之後事件要判斷用戶名是否存在
                break;
            }
        }

        //將該使用者的資料存入陣列中
        if(socket.username){
            users.push({
                username: data.username,
                message: [],
                dataUrl: [], 
                touXiangUrl: data.touXiangUrl // 頭像
            });
           //然後觸發loginSuccess事件告訴瀏覽器登陸成功了,廣播形式觸發
            data.userGroup = users;         // 將所有使用者資料陣列傳送過去main.js
            io.emit('loginSuccess',data);   // 將data原封不動的再發給該瀏覽器
        }
    });
 
    // 監聽sendMessage,我們得到客戶端(main.js)傳過來的data裡的message，並存起來
    socket.on('sendMessage',(data)=>{
        for(let _user of users) {// for-in是得到每一個key，for-of 是得到每一個value
            if(_user.username === data.username) {
                _user.message.push(data.message);

                let moment = require('moment-timezone');
                let time = moment(new Date()).tz("Asia/Taipei").format('YYYY-MM-DD HH:mm:ss');

            
                con.query('SELECT `userID` FROM `user` WHERE userName = ?',[data.username],function(error, results, fields){
                    
                    let postforDB = {
                        whosend: results[0].userID,
                        sendTime: time,
                        message: data.message,
                        touXiangUrl: data.touXiangUrl
                        
                    };
                    console.log(postforDB);
                    let sendMessage = con.query('INSERT INTO `sendMessage` SET ? ', postforDB);
                });
                let postmessage = {
                    username: data.username,
                    message: data.message,
                    touXiangUrl: data.touXiangUrl,
                    sendTime: time
                    
                };
                console.log(postmessage);
                // //訊息儲存之後觸發receiveMessage將資訊發給所有瀏覽器
                io.emit('receiveMessage',postmessage);
                break;
            }
        }
    });
 
    // 仿照sendMessage監聽sendImg事件
    socket.on("sendImg",(data)=>{
        for(let _user of users) {
            if(_user.username === data.username) {
                _user.dataUrl.push(data.dataUrl);
                // 存儲後將圖片廣播給所有瀏覽器
                io.emit("receiveImg",data);
                break;
            }
        }
    });
 
    socket.on('sendToOne',(data)=>{
        // 判断該使用者是否存在，如果存在就觸發receiveToOne事件
        for (let _user of users) {
            if (_user.username === data.to) {
                _sockets[data.to].emit('receiveToOne',data);
            }
        }
    });
 
    // 斷線後，所做的事件
    socket.on('disconnect',()=>{ // 注意，該事件不需要自定義觸發器，系統會自動呼叫
        usersNum --;
        console.log(`當前有${usersNum}個用戶連接上伺服器了`);
 
        // 觸發使用者離開的監聽
        socket.broadcast.emit("oneLeave",{username: socket.username});
 
        // 删除使用者
        users.forEach(function (user,index) {
            if(user.username === socket.username) {
                users.splice(index,1);       // 找到該使用者，删除
            }
        })
    })
});