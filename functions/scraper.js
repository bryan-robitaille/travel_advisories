const request = require("request-promise");
const parse = require("cheerio");
const htmlToText = require("html-to-text");
const url = "https://travel.gc.ca/destinations-print/"

const tagTypes = ["p","ul"];
const discardTagTypes = ["section"];

function convertText(element){
    var text = global.cheerioInstance.html(element)
    var tempText = htmlToText.fromString(text, {
        wordwrap: null,
        hideLinkHrefIfSameAsText: true,
        singleNewLineParagraphs: true,
        ignoreHref: true,
        ignoreImage: true,
        unorderedListItemPrefix:"~",
    })
    return tempText;
}

function getChildrenWorker(element, cheerioObject, h3Heading, h4Heading, array, child = false){

    if (cheerioObject(element).children().length > 0 && !tagTypes.includes(element.tagName) && !discardTagTypes.includes(element.tagName)){
        // For each child get it's children
        cheerioObject(element).children().each((i, elem) => {
            // Get the elements children to infinity and store in an array
            var [result, tempH3, tempH4] = getChildrenWorker(elem, cheerioObject, h3Heading, h4Heading, array, true);
            if (result !== null){
                array.push([result, tempH3, tempH4]);
            }
            h3Heading = tempH3;
            h4Heading = tempH4;          
        });
    }
    if( element.tagName === "h3") {
        h3Heading = convertText(element) ;
        h4Heading = null;
        return [null, h3Heading, h4Heading];
    }
    if( element.tagName === "h4") {
        h4Heading = convertText(element);
        return [null, h3Heading, h4Heading];
    }

    if(tagTypes.includes(element.tagName)){
        var result = cheerioObject(element).text();
        if (result !== null && typeof result !== "undefined"){
            if (child){
                return [convertText(element), h3Heading, h4Heading];  
            }      

            array.push([convertText(element), h3Heading, h4Heading]);
        }
    }

    return [null, h3Heading, h4Heading];
    
}
function getChildrenText(element, cheerioObject, h3Heading, h4Heading){
    var array = [];
    
    [result, h3Temp, h4Temp] = getChildrenWorker(element, cheerioObject, h3Heading, h4Heading, array);
        
    array.push([result, h3Temp, h4Temp]);
          
    return array;
}

function isEmpty(obj) {
   
    var empty = true;

    if (typeof obj === "string" || obj instanceof String){
        return empty;
    }
    else{
        const keys = Object.keys(obj);
        keys.map((key) => {
            if (!Number.isInteger(Number(key))){
                empty = false && empty;
            }
            return key;
        });
    }

    return empty;  

}

function flattenArray(array){   

    const keys = Object.keys(array);
    keys.map((key) => {
        if (Number.isInteger(Number(key)) && Array.isArray(array[key])){
            array[key] = [].concat.apply([], array[key]);
            array[key] = array[key].filter(Boolean);
            return array[key];
        }
    });

    return array;
}

function flattenStructure(object){
    for (var key in object){
        if(object.hasOwnProperty(key)){ 
            if (!isEmpty(object[key])){
                flattenStructure(object[key]);
            } 
            
            if (Array.isArray(object[key])){
                if (object[key].length > 0){
                    object[key] = flattenArray(object[key]);
                } else {
                    delete object[key];
                }

            }           
        }
    }

    return object;

}

function getHeadings(html){
    var headingObject = {};
    
    // Set headings
    html("main > h2").each((h2HeadingElem, elem) => {
        var h2Heading = html(elem).contents().text();
        var h3Heading = null;
        var h4Heading = null;

        html(elem).nextUntil("h2").each((subH2HeadingElem, elem)=>{

            var childrenArray = getChildrenText(elem, html, h3Heading, h4Heading);

            childrenArray.forEach((child) => {
                [text, h3Heading, h4Heading] = child;

                if (text === null || text === typeof "undefined"){
                    return;
                }

                if (h2Heading) {
                    if(!headingObject[h2Heading]){
                        headingObject[h2Heading] = {};
                        headingObject[h2Heading].intro = []
                    }
                    if (h3Heading) {
                        if(!headingObject[h2Heading][h3Heading]){
                            headingObject[h2Heading][h3Heading] = [];
                        }
                        if (h4Heading) {
                            if(!headingObject[h2Heading][h3Heading][h4Heading]){
                                headingObject[h2Heading][h3Heading][h4Heading] = [];
                            }
                            headingObject[h2Heading][h3Heading][h4Heading].push(text);
                        } else {
                            headingObject[h2Heading][h3Heading].push(text);
                        }
                    } else {
                        headingObject[h2Heading].intro.push(text);
                    }
                } else {
                    console.log("error - No H2 heading found");
                }
                
            })
        });
    });
    
    return flattenStructure(headingObject);   
}

async function getWebPage(country){
    var urlSafeCountry = country.replace(/\s+/g, '-').toLowerCase();
    travelUrl = url + urlSafeCountry;
    var options = {
        uri: travelUrl,
        transform: async (body)=>{
            return await parse.load(body);
        }
    };

    return await request(options).then(async (html) => {
        global.cheerioInstance = html;
        return getHeadings(html);
    })
}

module.exports = {
    getWebPage
}