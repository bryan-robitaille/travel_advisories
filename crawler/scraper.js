const requestPromise = require("request-promise");
const parse = require("cheerio");

async function getInfo(args){
    const urlSafeCountryName = args.countryName.replace(/\s+/g, '-').toLowerCase();
    const url = `https://travel.gc.ca/destinations-print/${urlSafeCountryName}`;
    var responseObject = {
        countryName: args.countryName,
    };

    const html = await requestPromise(url).catch((e) => {console.error(e);})
    
        await Promise.all([
            parser.getRisk(html, responseObject),
            parser.getLastUpdated(html, responseObject),
            parser.getSafety(html, responseObject),
        ])

        return responseObject;

}

module.exports = {
    getInfo,
}

