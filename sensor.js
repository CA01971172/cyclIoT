import { requestGPIOAccess } from "./node_modules/node-web-gpio/dist/index.js"; // WebGPIO ���g����悤�ɂ��邽�߂̃��C�u�������C���|�[�g
import {RelayServer} from "https://chirimen.org/remote-connection/js/beta/RelayServer.js";// Remote Example4 - controller

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec)); // sleep �֐����`

async function main() {
    const gpioAccess = await requestGPIOAccess();
    console.log("GPIO ready!");
    const dPort = gpioAccess.ports.get(12);
    await dPort.export("in");
    dPort.onchange = function (v) {
    dPort.onchange = sensorPort;

        function sensorPort(ev) {
            console.log(ev.value);
            if (ev.value == 0) {
                console.log(true);
                onLED()
            }
            else {
                console.log(false);
                offLED()
            }
        };
    }
}

let channel;
let relay = RelayServer("chirimentest", "chirimenSocket" );
const channelUrl="chirimenLED_hoge"
channel = await relay.subscribe(channelUrl);

function OnLED(){ // LED ON
    channel.send(true);
}
function OffLED(){ // LED OFF
    channel.send(false);
}

main();