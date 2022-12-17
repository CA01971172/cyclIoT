// Remote Example1 - reciever
// for CHIRIMEN with nodejs

import {requestGPIOAccess} from "./node_modules/node-web-gpio/dist/index.js";
const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));
import nodeWebSocketLib from "websocket"; // https://www.npmjs.com/package/websocket
import {RelayServer} from "./RelayServer.js";

let channel;
let alertPort;//警告LED
let isPowerOn = true;//電源が点いているかどうか
let powerPort;//電源LED
let buttonPort;//電源ボタン

async function connect(){
	// GPIOポート0の初期化
	const gpioAccess = await requestGPIOAccess();
	const mbGpioPorts = gpioAccess.ports;
	alertPort = mbGpioPorts.get(26);
	powerPort = mbGpioPorts.get(19);
    buttonPort = mbGpioPorts.get(5);
	await alertPort.export("out"); //port26 out
    await powerPort.export("out"); //port19 out
    await buttonPort.export("in"); //port5 in
	
	// webSocketリレーの初期化
	const relay = RelayServer("chirimentest", "chirimenSocket" , nodeWebSocketLib, "https://chirimen.org");
	channel = await relay.subscribe("cyclIoT");
	console.log("web socketリレーサービスに接続しました");

	alertPort.write(0);
	powerPort.write(1);

	channel.onmessage = controlLED;
    buttonPort.onchange = controlPower;
}

function controlLED(message){
	if(message.data.type !== "sensor") console.log(JSON.stringify(message.data));
    if(isPowerOn === false){
        //電源が入っていないなら、LED点灯処理をしない
        return
    }
	const gottenProcess = message.data.process;
	const gottenType = message.data.type;
	const gottenProperty = message.data.property;
	if((gottenProcess === "in")&&(gottenType === "led")){
		if(gottenProperty === "on"){
			alertPort.write(1);
			//console.log("LED ON");
		}else if(gottenProperty === "off"){
			alertPort.write(0);
			//console.log("LED OFF");
		}else{
		}
	}
}

function controlPower(ev){
	//console.log(!Boolean(ev.value));
    const sendData = {
        process:"in",
        type:"power",
        property:""
    };
    if (ev.value == 0){//ボタンが押されたとき
        if(isPowerOn === true){
            powerPort.write(0);
			alertPort.write(0);
            isPowerOn = false;
			sendData["property"] = "off"
            channel.send(sendData);
			console.log(sendData)
        }else{
            powerPort.write(1);
            isPowerOn = true;
			sendData["property"] = "on"
            channel.send(sendData);
			console.log(sendData)
        }
    } else {//ボタンが離されたとき
    }
}

connect();
