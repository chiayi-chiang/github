$(function(){
    const url = 'http://127.0.0.1';
    const InputName = $("#userName");// 使用者輸入名稱
    const InputPassword = $("#userPassword"); // 使用者輸入的密碼
    const LoginButton = $("#loginbutton");// 登入按鈕
    const ChatInput = $("#chatinput");// 聊天輸入匡
    const ChatInputButton = $("#chatinputbutton");// 登入按鈕
    const ListGroup = $(".list-group");// 在線成員列表
    const ListRoom = $(".list-room");// 聊天室列表
    
    let socket = io.connect(url);
    
    /*登入事件*/
    LoginButton.on('click',function () {    //當點擊“登入按鈕”時，就執行setUsername函式
        setUsername(InputName,InputPassword,socket);
        RestorePublicMassage();
    });
    //監聽輸入框的Enter事件，來登入
    InputName.on('keyup',function (event) {
        if(event.keyCode === 13) {//當點擊“Enter”時，就執行setUsername函式
            setUsername(InputName,InputPassword,socket);
            RestorePublicMassage();
        }
    });
    //監聽輸入框的Enter事件，來登入
    InputPassword.on('keyup',function (event) {
        if(event.keyCode === 13) {//當點擊“Enter”時，就執行setUsername函式
            setUsername(InputName,InputPassword,socket);
            RestorePublicMassage();
        }
    });

    /*聊天事件*/
    ChatInputButton.on('click',function () {    //當點擊“登入按鈕”時，就執行setUsername函式
        sendMessage(ChatInput,socket);
    });

    ChatInput.on('keyup',function (event) {
        if(event.keyCode === 13) {
            sendMessage(ChatInput,socket);
            ChatInput.val('');
        }
    });

    //監聽好友點擊事件
    ListGroup.on('click',function (event) {
        RestorePrivateMassage();
    });

    //監聽大廳點擊事件
    ListRoom.on('click',function (event) {
        RestorePublicMassage();
    });

    socket.on('receiveMessage',(data)=>{
        //監聽到事件發生，就顯示信息
        showMessage(data);
        $("html").scrollTop( $(document).height() );
    });
    
    //flag 1->上限，-1->下線
    //data 存取使用者訊息

    socket.on('loginSuccess',(data)=>{
        LoginSuccess(data,InputName,InputPassword,LoginButton,ListGroup,ListRoom);
    });

    socket.on('usernameErr',()=>{
        $(".login .form-inline .form-group").addClass("has-error");// 給輸入匡外加div，.has-error
        $('<label class="control-label" for="inputError1">使用者名稱重複</label>').insertAfter($('#userName'));// 增加label在輸入匡後
        // 控制顯示的時間為1.5秒
        setTimeout(function() {
            $('.login .form-inline .form-group').removeClass('has-error');
            $(" #userName  + label").remove();
        }, 1500)
    });

    socket.on('oneLeave',(data)=>{
        comAndLeave(-1,data,ListGroup); // 好友下線
    });

    
});
