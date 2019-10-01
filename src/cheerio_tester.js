const {getWebPage} = require("../functions/scraper");
const {getProperKey, searchContent, convertToSpeech, convertToText} = require("../functions/index");
const voicePitch = `pitch="-1st"`;

// Start of application testing

getWebPage("Ecuador")
.then((advisoryObject) => {
    var voiceResponse = `<speak><prosody ${voicePitch}>`;
    var textResponse = ""
    var index = 0
    for (var key in advisoryObject){
        if (advisoryObject.hasOwnProperty(key)){
            if (index < 1){
                for (var item in advisoryObject[key]){
                    if (advisoryObject[key].hasOwnProperty(item)){
                        voiceResponse = voiceResponse + convertToSpeech(advisoryObject[key][item]);
                        // textResponse = textResponse + convertToText(advisoryObject[key][item]);
                    }
                }                
                index++ 
            }
        }
    }

    console.log(voiceResponse + `</prosody></speak>`);
    console.log(textResponse);

    var h2Headings = Object.keys(advisoryObject);
    h2Headings.shift();
    console.log(`Here are some example topics you can ask me about: ${h2Headings}`);



    var categoryObject = advisoryObject[getProperKey(advisoryObject, "entry")];
    var searchResult = searchContent(categoryObject, "visa");
    searchResult.forEach((entry) => {
        console.log(convertToSpeech(categoryObject[entry]));
    })
})
.catch((err) => {
    console.log(err);
})



