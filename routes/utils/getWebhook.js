const config = require('../../../config.json');

module.exports = async(type, code) => {
    try {
        const MongoClient = require("mongodb").MongoClient;
        const client = new MongoClient(config.mongo.uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        await client.connect();
        const db = client.db("nachtauthbot");
        console.log(db.collection(type));
        const collection = db.collection(type);
        const result = collection.find({code: code}).project({webhook: 1}).toArray();
        return result[0].webhook;
    } catch (error) {
        return null;
    }
}