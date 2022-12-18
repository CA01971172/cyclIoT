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

    if(receivedData.type === "reset"){
        //警告側デバイスが起動,接続してきたら一度HTML等を初期化する
        reset();
    }

    //電源を操作する
    controlPower(receivedData);

    //LEDを操作する
    controlLed(receivedData);
}

function reset(){//警告側デバイス接続時の初期化処理
    messageDiv.innerText = "警告デバイスが接続されました";
    powerDiv.innerText = JSON.stringify({process:"in",type:"power",property:"on"});
    ledDiv.innerText = JSON.stringify({process:"in",type:"power",property:0});
    isPowerOn = true;
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
        }else{
        }
    }
}

const neoPixels = 8; // LED個数
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
        let lightUpNumber = 0; // LEDを点ける数
        lightUpNumber = neoPixels - Math.floor((gottenProperty - threshold) / interval) // y=ax+b のような一次関数的に、距離に応じてLEDを点灯させる
        //「0 ~ LEDの最大数」に収まるようにする
        if(lightUpNumber > neoPixels){
            lightUpNumber = neoPixels;
        }else if(lightUpNumber < 0){
            lightUpNumber = 0;
        }else{
        }
        lightUpLed(lightUpNumber)//LEDを点灯させる
    }
}

function lightUpLed(lightUpNumber){//LEDを点灯させる関数(引数に0を受け取ると消灯する)
    const sendData = {
        process:"in",
        type:"led",
        property:lightUpNumber
    }
    channel.send(sendData);
    //messageDiv.innerText += "\n" + "post: " + JSON.stringify(sendData);
    ledDiv.innerText = JSON.stringify(sendData);
}