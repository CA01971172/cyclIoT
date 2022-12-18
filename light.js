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
	lightUpLed(0);//警告LEDをオフにする
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
	const receivedData = message.data;
	//if(receivedData.type !== "sensor") console.log(JSON.stringify(receivedData));
    if(isPowerOn === false){
        //電源が入っていないなら、LED点灯処理をしない
        return
    }
	const gottenProcess = receivedData.process;
	const gottenType = receivedData.type;
	const gottenProperty = receivedData.property;
	if((gottenProcess === "in")&&(gottenType === "led")){
		lightUpLed(gottenProperty)
	}
}

function lightUpLed(lightUpNumber){//LEDを点灯させる関数(引数に0を受け取ると消灯する)
	const color = {//光らせる色
		red:255,
		green:0,
		blue:0
	}

	const grbArray = new Array;
	for ( let i = 0 ; i < neoPixels ; i++ ){
		if(i < lightUpNumber){
			grbArray.push(color.green);
			grbArray.push(color.red);
			grbArray.push(color.blue);
		}else{
			grbArray.push(0);
			grbArray.push(0);
			grbArray.push(0);
		}
	}
	
	npix.setPixels(grbArray);
}

let isPowerOn = true;//電源が点いているかどうか
function controlPower(ev){//電源状態を操作する関数
	//console.log(!Boolean(ev.value));
    const sendData = {
        process:"in",
        type:"power",
        property:""
    };
    if (ev.value == 0){//ボタンが押されたとき
        if(isPowerOn === true){
            powerPort.write(0);//電源LEDを消灯する
			lightUpLed(0)//警告LEDを消灯する
            isPowerOn = false;
			sendData["property"] = "off"
            channel.send(sendData);
			console.log(JSON.stringify(sendData))
        }else{
            powerPort.write(1);//電源LEDを点灯する
            isPowerOn = true;
			sendData["property"] = "on"
            channel.send(sendData);
			console.log(JSON.stringify(sendData))
        }
    } else {//ボタンが離されたとき
    }
}

connect();