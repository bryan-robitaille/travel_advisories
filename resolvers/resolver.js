const { getInfo } = require("../crawler/scraper");

function advisories(_, args, context, info){
return getInfo(args);
}

module.exports = {
    advisories
}