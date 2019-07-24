const parse = require("cheerio");

async function getRisk(html, responseObject){
    responseObject.risk = await parse("div.AdvisoryContainer", html).find("p").text();

    if (!responseObject.risk){
        responseObject.risk = null;
    } 
    return responseObject;
};

async function getLastUpdated(html, responseObject){
    responseObject.lastUpdated = await parse("#wb-cont", html).next("p").find("time").text();
    if (!responseObject.lastUpdated){
        responseObject.lastUpdated = null;
    } 
    return responseObject;
    
}

async function getSafety(html, responseObject){
    responseObject.safety = await parse("html > body > main").text();
    if (!responseObject.safety){
        responseObject.safety = null;
    } 
    return responseObject
}

module.exports = {
    getLastUpdated,
    getRisk,
    getSafety,
}