// Remote Example4 - controller
import { RelayServer } from "https://chirimen.org/remote-connection/js/beta/RelayServer.js";
const sensorDiv = document.getElementById("sensorDiv");
const messageDiv = document.getElementById("messageDiv");

let channel;
window.onload = async function () {
    // webSocketリレーの初期化
    let relay = RelayServer("chirimentest", "chirimenSocket");
    channel = await relay.subscribe("cyclIoT");
    messageDiv.innerText = "web socketリレーサービスに接続しました";
    channel.onmessage = getMessage;
};

function getMessage(message) {
    // メッセージを受信したときに起動する関数
    if(message.data.type === "sensor"){
        sensorDiv.innerText = JSON.stringify(message.data);
    }else{
        messageDiv.innerText += "\n" + "get: " + JSON.stringify(message.data);
    }

    //電源を操作する
    controlPower(message.data)

    //LEDを操作する
    controlLed(message.data)
}

let isPowerOn = true;
function controlPower(objectData){
    //電源を操作する
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
            isPowerOn = true
        }else if(gottenProperty === "off"){
            isPowerOn = false
            isLedOn = false;
        }else{
        }
    }
}

let isLedOn = false;
function controlLed(objectData){
    if(isPowerOn === false){
        //電源が入っていないなら、LED点灯処理をしない
        return
    }
    const threshold = 500;//この値より下回る値を距離センサーが送信してきたらLEDを点灯させる
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
            if(isLedOn === false) OnLED()
        }else{
            if(isLedOn === true) OffLED()
        }
    }
}

function OnLED() {
    // LED ON
    isLedOn = true;
    const sendData = {
        process:"in",
        type:"led",
        property:"on"
    }
    channel.send(sendData);
    messageDiv.innerText += "\n" + "post: " + JSON.stringify(sendData);
}
function OffLED() {
    // LED OFF
    isLedOn = false;
    const sendData = {
        process:"in",
        type:"led",
        property:"off"
    }
    channel.send(sendData);
    messageDiv.innerText += "\n" + "post: " + JSON.stringify(sendData);
}
