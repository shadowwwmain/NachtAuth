const config = require('../../config.json');

module.exports = async(req, res) => {
    res.redirect(`https://login.live.com/oauth20_authorize.srf?client_id=${config.azure.client_id}&response_type=code&redirect_uri=${config.azure.redirect_uri}&scope=XboxLive.signin+offline_access&state=${req.query.callback}`);
}