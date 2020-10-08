var express = require('express');
var router = express.Router();

// home page
router.get('/', function(req, res, next) {

  var db = req.con;//建立 var db 賦予 req.con 連線物件資訊
  var data = "";
  //db.query( ) 為進行資料庫存取，返回結果為 err、rows
  db.query('SELECT * FROM account', function(err, rows) {
      if (err) {
          console.log(err);
      }
      //回傳資料 rows 以陣列格式儲存
      var data = rows;

      //在 render 部分，我們將 rows 指定到 data 變數
      // use index.ejs
      res.render('index', { title: 'Account Information', data: data});
      //data: data，此為給予名稱 data，其內容為 data，將於 ejs 樣板部分使用
  });

});

module.exports = router;
