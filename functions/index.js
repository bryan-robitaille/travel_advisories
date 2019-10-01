
'use strict';

// Use Sugesstions to possibly promt for h3 / h4 headings
const { dialogflow, Suggestions, SimpleResponse, BasicCard } = require('actions-on-google');
const { getWebPage } = require("./scraper");
// Import the firebase-functions package for deployment.
const functions = require('firebase-functions');

// Instantiate the Dialogflow client.
const app = dialogflow({
    debug: true,
    verification:{
        Authorization: ''
    }});

const voicePitch = `pitch="-1st"`;

function randomPick(array){
    return array[Math.floor(Math.random()*array.length)];
}

function convertToSpeech(object){
    var tempText = "";
    if (typeof object === "string" || object instanceof String){
        return `<s>${object}</s>`;
    }
    for (var key in object){
        if(object.hasOwnProperty(key)){
            if(!Number.isInteger(Number(key))){
                if(key !== "intro"){
                    tempText = tempText + `<break strength='strong' />` + key + `<break strength='strong' />`;
                }                
                tempText = tempText + `<p>${convertToSpeech(object[key])}</p>`;
            } else{
                var filteredString = object[key].replace(/~/g, "<break strength='strong'/>")
                filteredString = filteredString.replace(/\n/g, "")
                tempText = tempText + `<s>${filteredString}</s>`;
            }
        }
    }
    return tempText;
}

function convertToText(object){
    var tempText = "";
    if (typeof object === "string" || object instanceof String){
        return object;
    }
    for (var key in object){
        if(object.hasOwnProperty(key)){
            if(!Number.isInteger(Number(key))){
                if(key !== "intro"){
                    tempText = tempText + "  \n " + key + "  \n ";
                }                
                tempText = tempText + "  \n" + `${convertToSpeech(object[key])}`;
            } else{
                tempText = tempText + "  " + `${object[key]}`;
            }
        }
    }
    return tempText;
}

function getProperKey(object, phrase){
    const regex = new RegExp(phrase.toLowerCase());
    for (var key in object){
        if(object.hasOwnProperty(key)){
            if(regex.test(key.toLocaleLowerCase())){
                return key;
            }
        }
    }

    return null;
}

function searchWorker(content, searchFor){

    for (var key in content){
        if(content.hasOwnProperty(key)){
            if(!Number.isInteger(Number(key)) || Array.isArray(content[key])){
                if (searchWorker(content[key], searchFor)){
                    return true;
                }
            } else{
                if( content[key].search(searchFor) > 0){
                    return true;
                }
            }
        }
    }

    return false;
}

function searchContent(contentObject, searchTerm){
    var headings = [];
    var searchFor = new RegExp(searchTerm, "g");
    for (var key in contentObject){
        if(contentObject.hasOwnProperty(key)){
            if (searchWorker(contentObject[key], searchFor)){
                headings.push(key);
            }
        }
    }
    return headings;

}


// Handle the Dialogflow intent named 'Default Welcome Intent'.
app.intent('Default Welcome Intent', (conv) => {
  // Questions for welcome intent
  var questions = [
      "Welcome! What country would you like travel advisories about?",
      "Hello!  What country would you like information about?",
      "Hi!  Where are you thinking of travelling to?",
  ];
  conv.ask(new SimpleResponse({
      speech:`<speak><prosody ${voicePitch}>${randomPick(questions)}</prosody></speak>`,
  }));
});




// Handle the Dialogflow intent named 'country'.
// The intent collects a parameter named 'geo-country'.
app.intent('country', async (conv, parameters) => {

    let countryName = parameters["geo-country"];
    var voiceResponse = `<speak><prosody ${voicePitch}>`;
    var textResponse = ""

    const advisoryObject = await getWebPage(countryName);
    var index = 0
    for (var key in advisoryObject){
        if (advisoryObject.hasOwnProperty(key)){
            if (index < 1){
                for (var item in advisoryObject[key]){
                    if (advisoryObject[key].hasOwnProperty(item)){
                        voiceResponse = voiceResponse + convertToSpeech(advisoryObject[key][item]);
                        textResponse = textResponse + convertToText(advisoryObject[key][item]);
                    }
                }                
                index++ 
            }
        }
    }
    conv.ask(new SimpleResponse({
        speech: voiceResponse + `</prosody></speak>`,
        text: textResponse
    }));
    
    var h2Headings = Object.keys(advisoryObject);
    h2Headings.shift();
    conv.ask(new SimpleResponse({
        speech:`<speak><prosody ${voicePitch}><p><s>If you would like to know more you can ask me about topics referencing: safety and security,` + 
                ` entry/exit requirements, health, laws and culture, and natural disasters for ${countryName}.</s>` +
                `<s>If you would like to hear an advisory for an different country just ask.</s></p></prosody></speak>`
    }));
    conv.ask(new Suggestions(["crime", "vaccines", "terrorism", "passport", "visas"]));
    conv.contexts.set("country_name", 5, {countryName: countryName});
    conv.contexts.set("country_object", 5, {advisoryObject: advisoryObject});

});

app.intent('category', (conv, parameters) => {
    const { advisoryObject } = conv.contexts.get("country_object").parameters;
    const followupContext = conv.contexts.get("country_name").parameters;

    var category = getProperKey(advisoryObject, parameters["categories"]);
    
    var categoryObject = advisoryObject[category];

    const subCategoryArry = searchContent(categoryObject, followupContext["categories.original"]);
    if (subCategoryArry.length > 0){
        var voiceResponse = `<speak><prosody ${voicePitch}>`;
        var textResponse = ""
        subCategoryArry.forEach((entry) =>{
                voiceResponse = voiceResponse + convertToSpeech(categoryObject[entry]);
                textResponse = textResponse + convertToText(categoryObject[entry]);
        });
             

        conv.ask(new SimpleResponse({
                speech: voiceResponse + `</prosody></speak>`,
                text: textResponse
        }));

    } else {
        conv.ask(new SimpleResponse({
            speech:`<speak><prosody ${voicePitch}><p><s>I'm sorry I couldnt' find anything about "${followupContext["categories.original"]}"</s></p></prosody></speak>`
        }));
    }


    

});


// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);

/*
// Needed for testing only
module.exports = {
    searchContent,
    getProperKey,
    convertToSpeech,    
    convertToText,
}
*/
