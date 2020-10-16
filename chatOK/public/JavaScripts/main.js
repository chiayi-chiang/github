$(function(){
    const url = 'http://127.0.0.1';
    let _username = null;
    let _$inputName = $("#userName");// 使用者輸入名稱
    let _$inputPassword = $("#userPassword"); // 使用者輸入的密碼
    let _$loginButton = $("#loginbutton");// 登入按鈕
    let _$chatinput = $("#chatinput");// 聊天輸入匡
    let _$inputGroup = $("#inputgrop");// 聊天室輸入匡＋選擇圖片button
    let _$imgButton = $("#imgbutton");// 選擇圖片button
    let _$imgInput = $("#imginput");// 對話匡圖片
    let _$listGroup = $(".list-group");// 在線成員列表
    let _touXiangUrl = null;// 大頭貼
    let _to = null;
    
    //監聽成員點擊事件
    _$listGroup.on('click',function (event) {
        initModal(event);
    });
    // 點擊頭像通知對方
    initModal = function (event) {
        _to = $(event.target).attr('name');
        // $("#myModalLabel").text(`發給${_to}`);
    };

    let socket = io.connect(url);
    
    // 隨機設置頭貼路徑
    let touXiang = function (url) {
        let _url = url || (Math.random()*8 | 0);
        switch (_url) {
            case 0 :
                return "icon-river__easyiconnet1";
            case 1 :
                return "icon-river__easyiconnet";
            case 2 :
                return "icon-photo_camera__easyiconnet";
            case 3 :
                return "icon-planet_earth__easyiconnet";
            case 4 :
                return "icon-palace__easyiconnet";
            case 5 :
                return "icon-mountain__easyiconnet";
            case 6 :
                return "icon-parachute__easyiconnet";
            case 7 :
                return "icon-map__easyiconnet";
            case 8 :
                return "icon-mountains__easyiconnet";
            case -1 :
                return "icon-yonghu"
        }
    };
    
    

    /*登入事件*/
    _$loginButton.on('click',function (event) {    //當點擊“登入按鈕”時，就執行setUsername函式
        setUsername();
    });
    //監聽輸入框的Enter事件，來登入
    _$inputName.on('keyup',function (event) {
        if(event.keyCode === 13) {//當點擊“Enter”時，就執行setUsername函式
            setUsername();
        }
    });
    //監聽輸入框的Enter事件，來登入
    _$inputPassword.on('keyup',function (event) {
        if(event.keyCode === 13) {//當點擊“Enter”時，就執行setUsername函式
            setUsername();
        }
    });
 
 
    // 設置使用者名稱，當登入時觸發
    let setUsername = function () {
        _username = _$inputName.val().trim();  // 取得使用者輸入的名稱
        _userpassword = _$inputPassword.val().trim();  // 取得使用者輸入的密碼
        _touXiangUrl = touXiang();  // 取得隨機頭貼
        // 判斷使用者名稱和密碼是否存在
        if(_username,_userpassword) {
            // 如果使用者名稱存在，就代表可以登入了，就觸發登入事件
            socket.emit('login',{username: _username,userpassword: _userpassword, touXiangUrl: _touXiangUrl});   
        }
    };
 
    //一開始進入聊天室
    let beginChat = function (data) {
        /**
         * 1.隱藏登入框，取消它繫結的事件
         * 2.顯示聊天介面
         */
        
        $("#loginbox").hide('slow');
        _$inputName.off('keyup');
        _$inputPassword.off('keyup');
        _$loginButton.off('click');
 
        // 顯示聊天介面，並顯示一行文字，'歡迎使用者'
        $(`<h2 style="text-align: center" >${_username}的聊天室</h2>`).insertBefore($("#content"));
        // 一個3s的談話框，顯示歡迎
        $(`<strong>歡迎你</strong><span>${_username}!</span>`).insertAfter($('#myalert button'));
        $("#myalert1").hide();
        $("#myalert2").hide();
        $('#myalert').alert();
        setTimeout(function () {
            $('#myalert').alert('close');
        },3000);
        $("#chatbox").show('slow');
 
        /**
         * 使用者固定列表
         * 先添加自己，在从data中找到别人添加进去
         */
        _$listGroup.append(`<a href="#" name="${_username}" class="list-group-item disabled"><svg class="icon" aria-hidden="true" style="font-size: 2em"><use xlink:href="#icon-yonghu"></use></svg>  ${_username}</a>`);
        //添加别人
        for(let _user of data.userGroup) {
            if (_user.username !== _username) {
                _$listGroup.append(`<a href="#" name="${_user.username}" class="list-group-item"  data-toggle="modal" data-target="#myModal"><svg class="icon" aria-hidden="true" style="font-size: 2em"><use xlink:href="#${_user.touXiangUrl}"></use></svg>  ${_user.username}</a>`);
            }
        }
    };
    
    //聊天內容傳送
    let sendMessage = function () {
        let _message = _$chatinput.val();// 得到輸入匡的聊天訊息
        if(_message) {// 如果不為空，就觸發sendMessage
            // 將發話者、訊息和頭像傳送給app.js的socket
            socket.emit('sendMessage',{username: _username, message: _message, touXiangUrl: _touXiangUrl});
        }
    };
    
    let setInputPosition = function () {
        let height = $(window).height()>$('#content div:last').offset().top+$('#content div:last').height()*2?$(window).height():$('#content div:last').offset().top+$('#content div:last').height()*2;
        _$inputGroup.css({'top': height});
        
    };
 
    let showMessage = function (data) {
        //先判斷這個消息是不是自己發出的，然後再以不同的樣式顯示
        if(data.username === _username) {
        $('#content').append(`<div class="receiver">
                                    <div>
                                        <div>
                                            <svg class="icon img-circle" aria-hidden="true" style="font-size: 2em;">
                                                <use xlink:href="#icon-yonghu"></use>
                                            </svg>
                                            <strong style="font-size: 1.5em;">
                                                ${data.username} 
                                            </strong>
                                        </div>
                                        <div>
                                            <div class="right_triangle"></div>
                                            <span>  ${data.message}</span>
                                        </div>
                                        ${data.sendTime}
                                    </div>
                                </div>`);
    } else {
        $('#content').append(`<div class="sender">
                                    <div>
                                        <div>
                                            <svg class="icon img-circle" aria-hidden="true" style="font-size: 2em;">
                                                <use xlink:href="#${data.touXiangUrl}"></use>
                                            </svg>
                                            <strong style="font-size: 1.5em;">${data.username} </strong>
                                        </div>
                                        <div>
                                            <div class="left_triangle"></div>
                                            <span>  ${data.message}</span>
                                        </div>
                                        ${data.sendTime}
                                    </div>
                                </div>`);
    }
        setInputPosition();
        
    };
 
    let sendImg = function (event) {
        /**
         * 先判断浏览器是否支持FileReader
         */
        if (typeof FileReader === 'undefined') {
            alert('您的浏览器不支持，该更新了');
            //使用bootstrap的样式禁用Button
            _$imgButton.attr('disabled', 'disabled');
        } else {
            let file = event.target.files[0];  //先得到选中的文件
            //判断文件是否是图片
            if(!/image\/\w+/.test(file.type)){   //如果不是图片
                alert ("请选择图片");
                return false;
            }
            /**
             * 然后使用FileReader读取文件
             */
            let reader = new FileReader();
            reader.readAsDataURL(file);
            /**
             * 读取完自动触发onload函数,我们触发sendImg事件给服务器
             */
            reader.onload = function (e) {
                socket.emit('sendImg',{username: _username, dataUrl: this.result, touXiangUrl: _touXiangUrl});
            }
        }
    };
 
    let showImg = function (data) {
        //先判断这个消息是不是自己发出的，然后再以不同的样式显示
        if(data.username === _username) {
            $('#content').append(`<div class="receiver">
                                    <div>
                                        <svg class="icon img-circle" aria-hidden="true" style="font-size: 2em;">
                                            <use xlink:href="#icon-yonghu"></use>
                                        </svg>
                                        <strong style="font-size: 1.5em;">
                                            ${data.username} 
                                        </strong>
                                    </div>
                                    <div>
                                        <div class="right_triangle"></div>
                                        <span><img class="img-thumbnail" src="${data.dataUrl}" style="max-height: 100px"/></span>
                                    </div>
                                </div>`);
        } else {
            $('#content').append(`<div class="sender">
                                    <div>
                                        <svg class="icon img-circle" aria-hidden="true" style="font-size: 2em;">
                                            <use xlink:href="#${data.touXiangUrl}"></use>
                                        </svg>
                                        <strong style="font-size: 1.5em;">${data.username} </strong>
                                    </div>
                                    <div>
                                        <div class="left_triangle"></div>
                                        <span><img class="img-thumbnail" src="${data.dataUrl}" style="max-height: 100px"/></span>
                                    </div>
                                    
                                </div>`);
        }
        setInputPosition();
    };
 
    /**
     *
     * @param flag 為1代表好友上線，-1代表好友下線
     * @param data 存取使用者訊息
     */
    let comAndLeave = function (flag,data) {
        //上线提示框
        if(flag === 1) {
            $('#myalert1 span').html(`<span>您的好友<strong>${data.username}</strong>上線了!</span>`);
            setTimeout(function() {
                $("#myalert1").hide();
            }, 10000);
            $("#myalert1").show();
            //在線成員列表，新增成員
            _$listGroup.append(`<a href="#" name="${data.username}" class="list-group-item" data-toggle="modal" data-target="#myModal"><svg class="icon" aria-hidden="true" style="font-size: 2em"><use xlink:href="#${data.touXiangUrl}"></use></svg>${data.username}</a>`);
        } else {
            //好友下線顯示匡，列表刪除一個
            $('#myalert2 span').html(`<span>您的好友<strong>${data.username}</strong>下線了!</span>`);
            setTimeout(function() {
                $("#myalert2").hide();
            }, 10000);
            $("#myalert2").show();
            //長到該使用者刪除
            _$listGroup.find($(`a[name='${data.username}']`)).remove();
        }
    };

    /*聊天事件*/
    _$chatinput.on('keyup',function (event) {
        if(event.keyCode === 13) {
            sendMessage();
            _$chatinput.val('');
        }
    });
 
    //點擊圖片按鈕觸發input
    _$imgButton.on('click',function (event) {
        _$imgInput.click();
        return false;
    });
 
    _$imgInput.change(function (event) {
        sendImg(event);
        //重置一下form元素，否則如果發同一張圖片不會觸發change事件
        $("#resetform")[0].reset();
    });
 
    
 
    //監聽私聊按鈕，觸發私聊事件
    $("#sendtoo").on('click',function (event) {
        /**
         * 得到用户输入的消息，如果部位空，就发送，清空内容关闭模态框
         */
        let _text = $("#inputtoone").val();// 取得使用者輸入的訊息，
        if (typeof _text !== 'undefined') {
            socket.emit('sendToOne', {to: _to, text: _text, username: _username});
            $("#inputtoone").val('');
            $("#closesendtoo").click();
        }
    });
 
 
    /*        socket.io部分逻辑        */
    socket.on('loginSuccess',(data)=>{
        /**
         * 如果服务器返回的用户名和刚刚发送的相同的话，就登录
         * 否则说明有地方出问题了，拒绝登录
         */
        if(data.username === _username) {
            beginChat(data);
        }else {
            comAndLeave(1,data);
        }
    });
 
    socket.on('receiveMessage',(data)=>{
        /**
         * 監聽到事件發生，就顯示信息
         */
        showMessage(data);
        $("html").scrollTop( $(document).height() );
    });
 
    socket.on('usernameErr',(data)=>{
        /**
         * 我们给外部div添加 .has-error
         * 拷贝label插入
         * 控制显示的时间为1.5s
         */
        $(".login .form-inline .form-group").addClass("has-error");
        $('<label class="control-label" for="inputError1">使用者名稱重複</label>').insertAfter($('#userName'));
        setTimeout(function() {
            $('.login .form-inline .form-group').removeClass('has-error');
            $(" #userName  + label").remove();
        }, 1500)
    });

   
    socket.on('receiveImg',(data)=>{
        /**
         * 监听到receiveImg发生，就显示图片
         */
        showImg(data);
    });
 
    socket.on('oneLeave',(data)=>{
        comAndLeave(-1,data);
    });

    //被通知者
    socket.on('receiveToOne',(data)=>{
        // $("#myModalLabel1").text(`来自${data.username}`);
        $(".shoudao").text(`${data.text}`);
        $("#showmodal").click();
    });
    
});
