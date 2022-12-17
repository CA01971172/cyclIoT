// Remote Example1 - reciever
// for CHIRIMEN with nodejs

import {requestGPIOAccess} from "./node_modules/node-web-gpio/dist/index.js";
import { requestI2CAccess } from "./node_modules/node-web-i2c/index.js";
import NPIX from "@chirimen/neopixel-i2c";
import nodeWebSocketLib from "websocket"; // https://www.npmjs.com/package/websocket
import {RelayServer} from "./RelayServer.js";

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

let channel;
let alertPort;//警告LED
let isPowerOn = true;//電源が点いているかどうか
let powerPort;//電源LED
let buttonPort;//電源ボタン

let npix;
const neoPixels = 8; // LED個数

async function connect(){
	// GPIOポート0の初期化
	const gpioAccess = await requestGPIOAccess();
	const i2cAccess = await requestI2CAccess();
	const mbGpioPorts = gpioAccess.ports;

	alertPort = i2cAccess.ports.get(1);
	powerPort = mbGpioPorts.get(19);
    buttonPort = mbGpioPorts.get(5);

	npix = new NPIX(alertPort, 0x41);
	await npix.init(neoPixels);

    await powerPort.export("out"); //port19 out
    await buttonPort.export("in"); //port5 in
	
	// webSocketリレーの初期化
	const relay = RelayServer("chirimentest", "chirimenSocket" , nodeWebSocketLib, "https://chirimen.org");
	channel = await relay.subscribe("cyclIoT");
	console.log("web socketリレーサービスに接続しました");

	
	powerPort.write(1);//電源LEDをオンにする
	offLed();//警告LEDをオフにする
	const sendData = {
        process:"in",
        type:"reset",
        property:""
    };
	channel.send(sendData);

	channel.onmessage = controlLED;
    buttonPort.onchange = controlPower;
}

function controlLED(message){//LEDを操作する関数
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
			onLed()
		}else if(gottenProperty === "off"){
			offLed()
		}else{
		}
	}
}

function onLed(){//ledをオフにする関数
	npix.setGlobal(255, 0, 0);
}
function offLed(){//ledをオンにする関数
	npix.setGlobal(0, 0, 0);
}

function controlPower(ev){//電源状態を操作する関数
	//console.log(!Boolean(ev.value));
    const sendData = {
        process:"in",
        type:"power",
        property:""
    };
    if (ev.value == 0){//ボタンが押されたとき
        if(isPowerOn === true){
            powerPort.write(0);
			offLed()
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