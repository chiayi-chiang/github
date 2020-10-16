$(function () {
    const url = 'http://127.0.0.1';
    let _$username = null;
    let _$inputname = $("#name");
    let _$loginButton = $("#loginbutton");
    let _$chatinput = $("#chatinput");
    let _$inputGroup = $("#inputgrop");
    let _$imgButton = $("#imgbutton");
    let _$imgInput = $("#imginput");
    let _$listGroup = $(".list-group");

    let socket = io.connect(url);

    //設定使用者名稱，當用戶登入的時候觸發
    let setUsername = function () {
        _username = _$inputname.val().trim(); //得到輸入框中使用者輸入的使用者名稱

        //判斷使用者名稱是否存在
        if (_username) {
            socket.emit('login', {
                username: _username
            }); //如果使用者名稱存在，就代表可以登入了，我們就觸發登入事件，就相當於告訴伺服器我們要登入了
        }
    };

    let beginChat = function (data) {
        /**
         * 1.隱藏登入框，取消它繫結的事件
         * 2.顯示聊天介面
         */
        $("#loginbox").hide('slow');
        _$inputname.off('keyup');
        _$loginButton.off('click');

        /**
         * 顯示聊天介面，並顯示一行文字，歡迎使用者'
         * 一個2s的談框，顯示歡迎
         * 這裡我使用了ES6的語法``中可以使用${}在裡面寫的變數可以直接被瀏覽器渲染
         */
        $(`<h2 class="bbb">${_username}的聊天室</h2>`).insertBefore($("#chatboxwindow"));


        $("#chatbox").show('slow');

        /**
         * 用戶列表渲染
         * 先添加自己，在從data中找到別人添加進去
         */
        _$listGroup.append(`<a href="#" name="${_username}" class="list-group-item disabled">${_username}</a>`);
        //添加别人
        console.log(data);

        for (let _user of data.userGroup) {
            if (_user.username !== _username) {
                _$listGroup.append(`<a href="#" name="${_user.username}" class="list-group-item">${_user.username}</a>`);

            }
        }

    };

     //监听成员点击事件
     _$listGroup.on('click',function (event) {
        initModal(event);
    });

    initModal = function (event) {
        let _name = $(event.target).attr('name');
       console.log(_name);
       socket.emit('createRoom',{
       username: _username,
       othername: _name
         } );
    };



    /**
     *
     * @param flag 为1代表好友上线，-1代表好友下线
     * @param data 存储用户信息
     */
    let comAndLeave = function (flag, data, messagedata) {
        //上线显示警告框，用户列表添加一个
        if (flag === 1) {


            //用户列表添加该用户
            _$listGroup.append(`<a href="#" name="${data.username}" class="list-group-item">${data.username}</a>`);
        } else {
            //下线显示警告框，用户列表删除一个

            //找到该用户并删除
            _$listGroup.find($(`a[name='${data.username}']`)).remove();
        }
    };

    let sendMessage = function () {
        /**
         * 得到輸入框的聊天資訊，如果不為空，就觸發sendMessage
         * 將資訊和使用者名稱傳送過去
         */
        let _message = _$chatinput.val();

        if (_message) {
            socket.emit('sendMessage', {
                username: _username,
                message: _message
            });
        }
    };
    
    let showMessage = function (data) {
        //先判断这个消息是不是自己发出的，然后再以不同的样式显示
        if (data.username === _username) {
            $('#content').append(`<div class="receiver">
                                    <div>
                                        <strong style="font-size: 1.5em;">
                                            ${data.username}&nbsp;
                                        </strong>
                                    </div>
                                    <div>
                                        <div class="right_triangle"></div>
                                        <span>&nbsp;&nbsp;${data.message}</span>
                                    </div>
                                </div>`);
        } else {
            $('#content').append(`<div class="sender">
                                    <div>
                                        <strong style="font-size: 1.5em;">${data.username}&nbsp;</strong>
                                    </div>
                                    <div>
                                        <div class="left_triangle"></div>
                                        <span>&nbsp;&nbsp;${data.message}</span>
                                    </div>
                                    
                                </div>`);
        }
    };




    let sendImg = function (event) {
        /**
         * 先判斷瀏覽器是否支持FileReader
         */
        if (typeof FileReader === 'undefined') {
            alert('您的瀏覽器不支持，該更新了');
            //使用bootstrap的樣式禁用Button
            _$imgButton.attr('disabled', 'disabled');
        } else {
            let file = event.target.files[0]; //先得到選中的文件
            //判断文件是否是图片
            if (!/image\/\w+/.test(file.type)) { //如果不是圖片
                alert("請選擇圖片");
                return false;
            }
            /**
             * 然後使用FileReader讀取文件
             */
            let reader = new FileReader();
            reader.readAsDataURL(file);
            /**
             * 讀取完自動觸發onload函數,我們觸發sendImg事件給服務器
             */
            reader.onload = function (e) {
                socket.emit('sendImg', {
                    username: _username,
                    dataUrl: this.result
                });
            }
        }
    };
    // let showImg = function (data) {
    //     //先判斷這個訊息是不是自己發出的，然後再以不同的樣式顯示

    //     if(data.username === _username) {
    //         $('#content').append(`<div class="receiver">
    //                                 <div>
    //                                     <svg class="icon img-circle" aria-hidden="true" style="font-size: 2em;">
    //                                         <use xlink:href="#icon-yonghu"></use>
    //                                     </svg>
    //                                     <strong style="font-size: 1.5em;">
    //                                         ${data.username} 
    //                                     </strong>
    //                                 </div>
    //                                 <div>
    //                                     <div class="right_triangle"></div>
    //                                     <span><img class="img-thumbnail" src="${data.dataUrl}" style="max-height: 100px"/></span>
    //                                 </div>
    //                             </div>`);
    //     } else {
    //         $('#content').append(`<div class="sender">
    //                                 <div>
    //                                     <svg class="icon img-circle" aria-hidden="true" style="font-size: 2em;">
    //                                         <use xlink:href="#${data.touXiangUrl}"></use>
    //                                     </svg>
    //                                     <strong style="font-size: 1.5em;">${data.username} </strong>
    //                                 </div>
    //                                 <div>
    //                                     <div class="left_triangle"></div>
    //                                     <span><img class="img-thumbnail" src="${data.dataUrl}" style="max-height: 100px"/></span>
    //                                 </div>

    //                             </div>`);
    //     }

    //     // setInputPosition();
    // };
    //点击图片按钮触发input
    _$imgButton.on('click', function (event) {
        _$imgInput.click();
        return false;
    });

    _$imgInput.change(function (event) {
        sendImg(event);
        //重置一下form元素，否则如果发同一张图片不会触发change事件
        $("#resetform")[0].reset();
    });

    /*聊天事件*/
    _$chatinput.on('keyup', function (event) {
        if (event.keyCode === 13) { //keycode 13 = Enter
            sendMessage();
            _$chatinput.val('');
        }
    });
    /*前端事件*/
    _$loginButton.on('click', function (event) { //監聽按鈕的點選事件，如果點選，就說明使用者要登入，就執行setUsername函式
        setUsername();

        fetch('/getdata')
            .then(res => res.json())
            .then(messagedata =>

                {
                    for (let i = 99; i >= 0; i--) {

                        if (messagedata[i].username === _username) {
                            $("#content").append(`<div class="receiver">
                     
                                                <div>
                                                        <div>${messagedata[i].chattime}</div>
                                                    <strong style="font-size: 1.5em;">
                                                    ${messagedata[i].username} &nbsp;                                    
                                                    </strong>
                                                </div>
                                                <div>
                                                    <div class="right_triangle"></div>
                                                    <span>&nbsp;&nbsp; ${messagedata[i].message}</span>
                                                </div>
                                               
                                            </div>`)
                        } else {
                            $('#content').append(`<div class="sender">
                                                <div>          
                                                    <strong style="font-size: 1.5em;">  
                                                    ${messagedata[i].username}&nbsp;
                                                    </strong>
                                                </div>
                                                <div>
                                                    <div class="left_triangle"></div>
                                                    <span>&nbsp;&nbsp;${messagedata[i].message}</span>
                                                </div>
                                                <div>${messagedata[i].chattime}</div>
                                            </div>`);
                        }



                    }
                }


            )
            .catch(error => console.log(error));

    });

    _$inputname.on('keyup', function (event) { //監聽輸入框的回車事件，這樣使用者回車也能登入。
        if (event.keyCode === 13) { //keycode 13 = Enter
            setUsername();
        }
    });

    socket.on('oneLeave', (data) => {
        comAndLeave(-1, data);

    });

    socket.on('usernameErr', (data) => {

        /**
         * 我們給外部div添加 .has-error
         * 拷貝label插入
         * 控制顯示的時間為1.5s
         */
        $(".login .form-inline .form-group").addClass("has-error");
        $('<label class="control-label" for="inputError1">用户名重复</label>').insertAfter($('#name'));
        setTimeout(function () {
            $('.login .form-inline .form-group').removeClass('has-error');
            $("#name + label").remove();
        }, 500)

    });


    /*socket.io部分邏輯*/
    socket.on('loginSuccess', (data) => {
        /**
         * 如果伺服器返回的使用者名稱和剛剛傳送的相同的話，就登入
         * 否則說明有地方出問題了，拒絕登入
         */
        if (data.username === _username) {
            beginChat(data);

        } else {

            comAndLeave(1, data);

        }
    })
    socket.on('receiveMessage', (data) => {
        /**
         * 監聽到事件發生，就顯示資訊
         */
        showMessage(data);

        $("#chatboxwindow").scrollTop($("#content").height());
    });

    socket.on('receiveImg', (data) => {
        /**
         * 監聽到receiveImg發生，就顯示圖片
         */
        showImg(data);
        $("#chatboxwindow").scrollTop($("#content").height());
    });
});