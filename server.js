// Remote Example4 - controller
import { RelayServer } from "https://chirimen.org/remote-connection/js/beta/RelayServer.js";
const sensorDiv = document.getElementById("sensorDiv");
const powerDiv = document.getElementById("powerDiv");
const ledDiv = document.getElementById("ledDiv");
const messageDiv = document.getElementById("messageDiv");

let channel;
window.onload = async function () {
    // webSocketリレーの初期化
    let relay = RelayServer("chirimentest", "chirimenSocket");
    channel = await relay.subscribe("cyclIoT");
    messageDiv.innerText = "web socketリレーサービスに接続しました";
    channel.onmessage = getMessage;
};

function getMessage(message) {// メッセージを受信したときに起動する関数
    const receivedData=message.data;

    //受け取ったデータをHTMLで表示する関数
    updateDiv(receivedData);

    //電源を操作する
    controlPower(receivedData);

    //LEDを操作する
    controlLed(receivedData);
}

function reset(){//警告側デバイス接続時の初期化処理
    messageDiv.innerText = "web socketリレーサービスに接続しました";
    powerDiv.innerText = JSON.stringify({process:"in",type:"power",property:"on"});
    ledDiv.innerText = JSON.stringify({process:"in",type:"power",property:0});
    isPowerOn = true;
    isLedOn = true;
}

function updateDiv(objectData){//受け取ったデータをHTMLで表示する関数
    if(objectData.type === "sensor"){
        sensorDiv.innerText = JSON.stringify(objectData);
    }else{
        if(objectData.type === "power"){
            powerDiv.innerText = JSON.stringify(objectData);
        }
        messageDiv.innerText += "\n" + "get: " + JSON.stringify(objectData);
    }
}

let isPowerOn = true;
function controlPower(objectData){//電源を操作する関数
    let gottenProcess = "";
	let gottenType = "";
	let gottenProperty = "";
    try{
        gottenProcess = objectData.process;
        gottenType = objectData.type;
        gottenProperty = objectData.property;
    }catch(e){
    }

    if((gottenProcess === "in")&&(gottenType === "power")){
        if(gottenProperty === "on"){
            isPowerOn = true;
        }else if(gottenProperty === "off"){
            isPowerOn = false;
            isLedOn = false;
        }else{
        }
    }
}

let isLedOn = false;
const threshold = 1000; // この値より下回る値を距離センサーが送信してきたらLEDを全点灯させる
const interval = 100; // この値ごとにLEDを点灯させる数を減少させる
function controlLed(objectData){//LEDを操作する関数
    if(isPowerOn === false){
        //電源が入っていないなら、LED点灯処理をしない
        return
    }
    
    //LEDを操作する
    let gottenProcess = "";
    let gottenType = "";
    let gottenProperty = 0;
    try{
        gottenProcess = objectData.process;
        gottenType = objectData.type;
        gottenProperty = objectData.property;
    }catch(e){
    }

    if((gottenProcess === "out")&&(gottenType === "sensor")){
        if(gottenProperty < threshold){//物体が近づいてきているとき
            if(isLedOn === false) onLed();
        }else{
            if(isLedOn === true) offLed();
        }
    }
}

function onLed() {
    // LED ON
    isLedOn = true;
    const sendData = {
        process:"in",
        type:"led",
        property:"on"
    }
    channel.send(sendData);
    messageDiv.innerText += "\n" + "post: " + JSON.stringify(sendData);
    ledDiv.innerText = JSON.stringify(sendData);
}
function offLed() {
    // LED OFF
    isLedOn = false;
    const sendData = {
        process:"in",
        type:"led",
        property:"off"
    }
    channel.send(sendData);
    messageDiv.innerText += "\n" + "post: " + JSON.stringify(sendData);
    ledDiv.innerText = JSON.stringify(sendData);
}