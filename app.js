const config = require('dotenv').load().parsed;
const dashButton = require('node-dash-button');
const hue = require("node-hue-api");

const HueApi = hue.HueApi;
const hueIp = process.env.HUEIP;
const hueUsername = process.env.HUEUSERNAME;

const lightState = hue.lightState;
const api = new HueApi(hueIp, hueUsername);
const state = lightState.create();

const dashButtonConfig = getDashButtonConfig();
const dashButtonsMacAddresses = getDashButtonMacAddressesForConfig(dashButtonConfig);
const dash = dashButton(dashButtonsMacAddresses);

dash.on("detected", dashId => {
    console.log("Button press detected", dashId);
    const groupName = getGroupForDashButtonMacAddress(dashId);

    api.groups().then(groups => {
        const group = groups.find(group => group.name === groupName);
        const groupLightIds = group.lights;

        groupLightIds.forEach(groupLightId => {
            api.lightStatus(groupLightId).then(lightStatus => {
                const isOn = lightStatus.state.on;

                if (isOn) {
                    api.setLightState(groupLightId, state.off()).done();
                } else {
                    api.setLightState(groupLightId, state.on()).done();
                }
            })
        });
    });
});

function getDashButtonMacAddressesForConfig(dashButtonConfig) {
    return Object.keys(dashButtonConfig).map(key => dashButtonConfig[key]);
}

function getDashButtonConfig() {
    const newObject = {};
    Object.keys(config).filter(key => key.startsWith("DASH_MAC_ADDRESS_")).map(key => newObject[key] = config[key]);
    return newObject;
}

function getGroupForDashButtonMacAddress(dashButtonMacAddress) {
    const name = Object.keys(dashButtonConfig).find(key => dashButtonConfig[key] === dashButtonMacAddress);
    return name.split("_").pop();
}