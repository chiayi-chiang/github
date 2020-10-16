var mysql = require("mysql");
const express = require("express"); // const是ES6的語法，代表常量，準確來說就是指向不發生改變。如果不習慣就用var代替
const app = express(); // express官網就是這麼寫的就是用來建立一個express程式，賦值給app。如果不理解就當公式記住
var server = require("http").createServer(app);
// const server = require('http').Server(app);
const path = require("path"); // 這是node的路徑處理模組，可以格式化路徑
const io = require("socket.io")(server); //將socket的監聽加到app設定的模組裡。

var con = mysql.createConnection({
  host: "mysql",
  user: "root",
  password: "root",
  database: "chat",
});

const REDIS_HOST = "redis";
const REDIS_PORT = 6379;
const REDIS_OPTS = {};
const REDIS_PASS = "nodedocker";

const redis = require("redis");
const client = redis.createClient(REDIS_PORT, REDIS_HOST, REDIS_OPTS);

/* **************************************** */

// client.lpush('tutoriallist1','redis');
// client.lpush('tutoriallist1','mongodb');
// client.lpush('tutoriallist1','mysql');
// client.lpush('tutoriallist1','mysql');

/* **************************************** */

const users = []; //用來儲存所有的使用者資訊
let usersNum = 0;

// server.listen(3000, () => { // ()=>是箭頭函式，ES6語法，如果不習慣可以使用 function() 來代替 ()=>
//     console.log("server running at 127.0.0.1:3000"); // 代表監聽3000埠，然後執行回撥函式在控制檯輸出。
// });

server.listen(9000, function () {
  console.log("Example app listening on port 9000!");
});

/**
 * app.get(): express中的一箇中間件，用於匹配get請求，所謂中介軟體就是在該輪http請求中依次執行的一系列函式。
 * '/': 它匹配get請求的根路由 '/'也就是 127.0.0.1:3000/就匹配到他了
 * (req,res): ES6語法的箭頭函式，你暫時可以理解為function(req,res){}。
 * req帶表瀏覽器的請求物件，res代表伺服器的返回物件
 */
app.get("/", (req, res) => {
  res.redirect("/chat.html"); // express的重定向函式。如果瀏覽器請求了根路由'/',瀏覽器就給他重定向到 '127.0.0.1:3000/chat.html'路由中
});

app.get("/getdata", (req, res) => {
  con.query(
    "SELECT *  FROM ?? WHERE roomID = ? ORDER BY `chatmessage`.`messageID` desc limit 100 ",
    ["chatmessage", 0],
    function (error, results, fields) {
      if (error) throw error;

      var messagedata = JSON.stringify(results);

      res.send(messagedata);
    }
  );
});

/**
 * __dirname表示當前檔案所在的絕對路徑，所以我們使用path.join將app.js的絕對路徑和public加起來就得到了public的絕對路徑。
 * 用path.join是為了避免出現 ././public 這種奇怪的路徑
 * express.static就幫我們託管了public資料夾中的靜態資源。
 * 只要有 127.0.0.1：3000/XXX 的路徑都會去public資料夾下找XXX檔案然後傳送給瀏覽器。
 */
app.use("/", express.static(path.join(__dirname, "./public"))); //一句話就搞定。

/*socket*/
io.on("connection", (socket) => {
  //監聽客戶端的連線事件
  /**
   * 所有有關socket事件的邏輯都在這裡寫
   */

  usersNum++;
  console.log(`當前有${usersNum}個使用者連線上伺服器了`);
  socket.on("login", (data) => {
    /**
     * 先保存在socket中
     * 循環數組判斷用戶名是否重複,如果重複，則觸發usernameErr事件
     * 將用戶名刪除，之後的事件要判斷用戶名是否存在
     */
    // 查詢ID是否存在
    con.query(
      "SELECT *  FROM ?? WHERE username = ?",
      ["chatuser", data.username],
      function (error, results, fields) {
        numRows = results.length;

        //如果不存在 新增使用者
        if (numRows == 0) {
          client.rpush("chatuser", data.username);
          con.query(
            "insert into chatuser SET ?",
            {
              username: data.username,
            },
            function (error, results, fields) {}
          );
        }
      }
    );
    client.set("username", data.username);
    socket.username = data.username;
    for (let user of users) {
      if (user.username === data.username) {
        socket.emit("usernameErr", {
          err: "使用者名稱重複",
        });

        socket.username = null;
        break;
      } else {
      }
    }

    //如果用戶名存在。將該用戶的信息存進數組中
    if (socket.username) {
      users.push({
        username: data.username,
        message: [],
        dataUrl: [],
      });

      //然後觸發loginSuccess事件告訴瀏覽器登陸成功了,廣播形式觸發
      client.SADD("user", data.username);
      data.userGroup = users; //將所有用戶數組傳過去
      console.log(data);
      io.emit("loginSuccess", data); //將data原封不動的再發給該瀏覽器
    }
  });
  socket.on("createRoom", (data) => {
    var post = {
      user1: data.username,
      user2: data.othername,
    };

    if (data.username < data.othername) {
      var usera = data.username;
      var userb = data.othername;
    } else {
      usera = data.othername;
      userb = data.username;
    }

    // 查是房間否存在
    var roomName = usera;
    roomName = roomName.concat(userb);
    client.EXISTS(roomName, function (error, result) {
      if (result == 0) {
        console.log("還沒有聊天室");
      } else {
        console.log("已經開始聊天");
        client.LRANGE(roomName,0,-1, function (error, result) {

          console.log(result);
        });
      }
    });

    con.query(
      "SELECT *  FROM ?? WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)",
      [
        "chatroom",
        data.username,
        data.othername,
        data.othername,
        data.username,
      ],
      function (error, results, fields) {
        roomRows = results.length;

        //如果不存在 新增房間
        if (roomRows == 0) {
          con.query("INSERT INTO chatroom SET ?", post, function (
            error,
            results,
            fields
          ) {});

          //搜尋房間ID
          con.query(
            "SELECT *  FROM ?? WHERE user1 = ? AND user2 = ?",
            ["chatroom", data.username, data.othername],
            function (error, results, fields) {
              roomnumRows = results.length;

              // //將房間訊息傳回前端
              var dataroom = results;
              client.rpush("chatroom", "results");
              socket.emit("dataroom", {
                dataroom: data.othername,
                dataroomID: dataroom[0].roomID,
                dataroomName: roomName,
              });
            }
          );
          //如果存在 搜尋房間
        } else {
          var query2 = con.query(
            "SELECT *  FROM ?? WHERE user1 = ? AND user2 = ?",
            ["chatroom", data.username, data.othername],
            function (error, results, fields) {
              if (error) throw error;
              roomRowNums = results.length;

              var dataroom = results;

              //如果等於0
              if (roomRowNums == 0) {
                //攻守互換 搜尋房間
                con.query(
                  "SELECT *  FROM ?? WHERE user1 = ? AND user2 = ?",
                  ["chatroom", data.othername, data.username],
                  function (error, results, fields) {
                    var dataroom = results;

                    //將房間訊息傳回前端
                    console.log(dataroom);

                    socket.emit("dataroom", {
                      dataroom: data.othername,
                      dataroomID: dataroom[0].roomID,
                      dataroomName: roomName,
                    });

                    //透過房間ID搜尋聊天記錄
                    // var query = con.query(
                    //   "SELECT *  FROM ?? WHERE roomID = ? ORDER BY `chatmessage`.`messageID` desc limit 100 ",
                    //   ["chatmessage", dataroom[0].roomID],
                    //   function (error, results, fields) {
                    //     //計算聊天記錄長度
                    //     messageRowNums = results.length;
                        
                    //     //如果不等於0
                    //     if (messageRowNums != 0) {
                    //       //將聊天記錄傳回前端
                    //       socket.emit("dataroomessage", {
                    //         dataroomMessage: results,
                    //       });
                    //     }
                    //   }
                    // );
                    client.LRANGE(roomName,0,-1, function (error, results) {
                      socket.emit("dataroomessage", {
                        dataroomMessage: results,
                      });
       
                      console.log(results);
                    });
           
                  }
                );
              } else {
                //將房間訊息傳回前端

                socket.emit("dataroom", {
                  dataroom: data.othername,
                  dataroomID: dataroom[0].roomID,
                  dataroomName: roomName,
                });

                // con.query(
                //   "SELECT *  FROM ?? WHERE roomID = ? ORDER BY `chatmessage`.`messageID` desc limit 100 ",
                //   ["chatmessage", dataroom[0].roomID],
                //   function (error, results, fields) {
                //     if (error) throw error;
                //     socket.emit("dataroomessage", {
                //       dataroomMessage: results,
                //     });
                //   }
                // );
                client.LRANGE(roomName,0,-1, function (error, results) {
                  socket.emit("dataroomessage", {
                    dataroomMessage: results,
                  });
                  console.log(results);
                });
              }
            }
          );
        }
      }
    );
  });

  /**
   * 監聽sendMessage,我們得到客戶端傳過來的data裡的message，並存起來。
   * 我使用了ES6的for-of迴圈，和ES5 的for-in類似。
   * for-in是得到每一個key，for-of 是得到每一個value
   */
  socket.on("sendMessage", (data) => {
    for (let _user of users) {
      if (_user.username === data.username) {
        _user.message.push(data.message);

        var moment = require("moment-timezone");
        let time = moment(new Date())
          .tz("Asia/Taipei")
          .format("YYYY/MM/DD HH:mm");

        var post = {
          username: data.username,
          message: data.message,
          chattime: time,
          roomID: data.room,
        };

        //----------------------------------------------

        //把資料儲存在redis
        var post2 = {
          username: data.username,
          message: data.message,
          chattime: time,
          roomname:data.roomname,
        };

        var messagedata2 = JSON.stringify(post2);

        client.rpush(data.roomname, messagedata2);
        //-------------------

        var query = con.query("INSERT INTO chatmessage SET ?", post, function (
          error,
          results,
          fields
        ) {});
        console.log(query.sql);
        //資訊儲存之後觸發receiveMessage將資訊發給所有瀏覽器
        io.emit("receiveMessage", post2);

        break;
      }
    }
  });

  /**
   * 仿照sendMessage監聽sendImg事件
   */
  socket.on("sendImg", (data) => {
    for (let _user of users) {
      if (_user.username === data.username) {
        _user.dataUrl.push(data.dataUrl);
        //存储后将图片广播给所有浏览器
        io.emit("receiveImg", data);
        break;
      }
    }
  });

  //斷開連線後做的事情
  socket.on("disconnect", () => {
    //注意，該事件不需要自定義觸發器，系統會自動呼叫
    usersNum--;
    console.log(`當前有${usersNum}個使用者連線上伺服器了`);

    //觸發用戶離開的監聽
    socket.broadcast.emit("oneLeave", {
      username: socket.username,
    });

    //删除用户
    users.forEach(function (user, index) {
      if (user.username === socket.username) {
        users.splice(index, 1); //找到该用户，删除
        client.SREM("user", socket.username);
      }
    });
  });
});
