let UserName = null;
let TouXiangUrl = null;// 大頭貼

// 設置使用者名稱，當登入時觸發
let setUsername = function (InputName,InputPassword,socket) {
    UserName = InputName.val().trim();  // 取得使用者輸入的名稱
    Userpassword = InputPassword.val().trim();  // 取得使用者輸入的密碼
    TouXiangUrl = touXiang();  // 取得隨機頭貼
    // 判斷使用者名稱和密碼是否存在
    if(UserName,Userpassword) {
        // 如果使用者名稱存在，就代表可以登入了，就觸發登入事件
        socket.emit('login',{username: UserName,userpassword: Userpassword, touXiangUrl: TouXiangUrl});   
    }
};

let LoginSuccess=function (data,InputName,InputPassword,LoginButton,ListGroup,ListRoom){
    /**
     * 如果服务器返回的用户名和刚刚发送的相同的话，就登录
     * 否则说明有地方出问题了，拒绝登录
     */
    if(data.username === UserName) {
        beginChat(data,InputName,InputPassword,LoginButton,ListGroup,ListRoom);
    }else {
        comAndLeave(1,data,ListGroup);// 好友上限
    }
};

//一開始進入聊天室
let beginChat = function (data,InputName,InputPassword,LoginButton,ListGroup,ListRoom) {
    /**
     * 1.隱藏登入框，取消它繫結的事件
     * 2.顯示聊天介面
     */
    
    $("#loginbox").hide('slow');
    InputName.off('keyup');
    InputPassword.off('keyup');
    LoginButton.off('click');

    // 顯示聊天介面頭條
    $(`<div><h2 style="text-align: center " >大廳</h2></div>`).insertBefore($("#content"));
    // $(`<div><h2 style="text-align: center " >${UserName}的聊天室</h2></div>`).insertBefore($("#content"));
    // 顯示聊天室畫面
    $("#publicchatbox").show('slow');

    // $("#publicchatbox").hide('slow');
    // $("#privatechatbox").show('slow');

    /**
     * 使用者固定列表
     * 先添加自己，在从data中找到别人添加进去
     */
    ListGroup.append(`<a href="#" name="${UserName}" class="list-group-item disabled"><svg class="icon" aria-hidden="true" style="font-size: 2em"><use xlink:href="#icon-yonghu"></use></svg>  ${UserName}</a>`);
    ListRoom.append(`<a href="#" name="大廳" class="list-group-item "><svg class="icon" aria-hidden="true" style="font-size: 2em"><use xlink:href="#icon-yonghu"></use></svg> 大廳</a>`);
    //添加别人
    for(let User of data.userGroup) {
        if (User.username !== UserName) {
            ListGroup.append(`<a href="#" name="${User.username}" class="list-group-item"  ><svg class="icon" aria-hidden="true" style="font-size: 2em"><use xlink:href="#${User.touXiangUrl}"></use></svg>  ${User.username}</a>`);
        }
    }
};

let comAndLeave = function (flag,data,ListGroup) {
    if(flag === 1) { // 取得1，代表好友上線
        //在線成員列表，新增成員
        ListGroup.append(`<a href="#" name="${data.username}" class="list-group-item" ><svg class="icon" aria-hidden="true" style="font-size: 2em"><use xlink:href="#${data.touXiangUrl}"></use></svg>${data.username}</a>`);
    } else { // 取得-1，代表好友下線
        //找到該使用者刪除
        ListGroup.find($(`a[name='${data.username}']`)).remove();
    }
};

// 恢復之前的聊天記錄
let RestorePublicMassage = function(){
    // 從app.js取得資料
    fetch('/getdata')
    .then(res => res.json())
    .then(sendmessage =>{
        for (let i =sendmessage.length - 1 ; i>= 0; i--) {
            sendTime = moment.utc(sendmessage[i].sendTime).format('YYYY-MM-DD HH:mm:ss');
            // sendTime=sendmessage[i].sendTime;
            //先判斷這個消息是不是自己發出的，然後再以不同的樣式顯示
            if (sendmessage[i].userName === UserName) {
                $('#innerContent').append(
                    `<div class="receiver">
                        <div>
                            <div>
                                <svg class="icon img-circle" aria-hidden="true" style="font-size: 2em;">
                                    <use xlink:href="#icon-yonghu"></use>
                                </svg>
                                <strong style="font-size: 1.5em; color: white;">
                                    ${sendmessage[i].userName} 
                                </strong>
                            </div>
                            <div>
                                <div class="right_triangle"></div>
                                <span>  ${sendmessage[i].message}</span>
                                
                            </div>
                                <div style="font-size: 0.5em;" >${sendTime}</div>
                        </div>
                    </div>`
                );
            } else {
                $('#innerContent').append(
                    `<div class="sender">
                        <div>
                            <div>
                                <svg class="icon img-circle" aria-hidden="true" style="font-size: 2em;">
                                    <use xlink:href="#${sendmessage[i].touXiangUrl}"></use>
                                </svg>
                                <strong style="font-size: 1.5em; color: white;">
                                    ${sendmessage[i].userName} 
                                </strong>
                            </div>
                            <div>
                                <div class="left_triangle"></div>
                                <span>  ${sendmessage[i].message}</span>
                            </div>
                            <div style="font-size: 0.5em;">${sendTime}</div>
                        </div>
                    </div>`
                );
            }
            $("#content").scrollTop($("#innerContent").height());
        }
    })
}

//聊天內容傳送
let sendMessage = function (ChatInput,socket) {
    let Message = ChatInput.val();// 得到輸入匡的聊天訊息
    if(Message) {// 如果不為空，就觸發sendMessage
        // 將發話者、訊息和頭像傳送給app.js的socket
        socket.emit('sendMessage',{username: UserName, message: Message, touXiangUrl: TouXiangUrl});
    }
};

let showMessage = function (data) {
    //先判斷這個消息是不是自己發出的，然後再以不同的樣式顯示
    if(data.username === UserName) {
        $('#innerContent').append(
            `<div class="receiver">
                <div>
                    <div>
                        <svg class="icon img-circle" aria-hidden="true" style="font-size: 2em;">
                            <use xlink:href="#icon-yonghu"></use>
                        </svg>
                        <strong style="font-size: 1.5em; color: white;">
                            ${data.username} 
                        </strong>
                    </div>
                    <div>
                        <div class="right_triangle"></div>
                        <span>  ${data.message}</span>
                    </div>
                    <div style="font-size: 0.5em;">${data.sendTime}</div>
                </div>
            </div>`
        );
    } else {
        $('#innerContent').append(
            `<div class="sender">
                <div>
                    <div>
                        <svg class="icon img-circle" aria-hidden="true" style="font-size: 2em;">
                            <use xlink:href="#${data.touXiangUrl}"></use>
                        </svg>
                        <strong style="font-size: 1.5em; color: white;">${data.username} </strong>
                    </div>
                    <div>
                        <div class="left_triangle"></div>
                        <span>  ${data.message}</span>
                    </div>
                    <div style="font-size: 0.5em;">${data.sendTime}</div>
                    
                </div>
            </div>`
        );
    }
    
    $("#content").scrollTop($("#innerContent").height());
};

// 恢復之前的聊天記錄
let RestorePrivateMassage = function(){
    // 從app.js取得資料
    fetch('/getdataprivate')
    .then(res => res.json())
    .then(sendmessage =>{
        for (let i =sendmessage.length - 1 ; i>= 0; i--) {
            sendTime = moment.utc(sendmessage[i].sendTime).format('YYYY-MM-DD HH:mm:ss');
            // sendTime=sendmessage[i].sendTime;
            //先判斷這個消息是不是自己發出的，然後再以不同的樣式顯示
            if (sendmessage[i].userName === UserName) {
                $('#innerContent').append(
                    `<div class="receiver">
                        <div>
                            <div>
                                <svg class="icon img-circle" aria-hidden="true" style="font-size: 2em;">
                                    <use xlink:href="#icon-yonghu"></use>
                                </svg>
                                <strong style="font-size: 1.5em; color: white;">
                                    ${sendmessage[i].userName} 
                                </strong>
                            </div>
                            <div>
                                <div class="right_triangle"></div>
                                <span>  ${sendmessage[i].message}</span>
                                
                            </div>
                                <div style="font-size: 0.5em;" >${sendTime}</div>
                        </div>
                    </div>`
                );
            } else {
                $('#innerContent').append(
                    `<div class="sender">
                        <div>
                            <div>
                                <svg class="icon img-circle" aria-hidden="true" style="font-size: 2em;">
                                    <use xlink:href="#${sendmessage[i].touXiangUrl}"></use>
                                </svg>
                                <strong style="font-size: 1.5em; color: white;">
                                    ${sendmessage[i].userName} 
                                </strong>
                            </div>
                            <div>
                                <div class="left_triangle"></div>
                                <span>  ${sendmessage[i].message}</span>
                            </div>
                            <div style="font-size: 0.5em;">${sendTime}</div>
                        </div>
                    </div>`
                );
            }
            $("#content").scrollTop($("#innerContent").height());
        }
    })
}