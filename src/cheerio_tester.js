const requestPromise = require("request-promise");
const parse = require("cheerio");
const fs = require("fs");
const url = "https://voyage.gc.ca/destinations-imprimer/emirats-arabes-unis"

const htmlFile = parse.load(fs.readFileSync("./src/result.html"));

function getChildrenText(element, cheerioObject){
    var array = []
    if (cheerioObject(element).children().length > 0){
        cheerioObject(element).children().each((i, elem) => {
            array[i] = getChildrenText(elem, cheerioObject);
        })
    }
    var result = array.length > 0 ? array : cheerioObject(element).text();
    return result;
}

function getHeadings(html){
    var headingObject = {};
    
    // Set headings
    html("main > h2").each((i, elem) => {
        var tempH2Array = [];
        html(elem).nextUntil("h2").each((i, elem) => {
            var tempH3Array = [];
            html(elem).nextUntil("h3").each((i, elem) => {
                tempH3Array.push(getChildrenText(elem, html));
                tempH2Array[html(elem).text()] = tempH3Array.flat(20);
            })
        });
        
        headingObject[html(elem).text()] = tempH2Array;
    });

    return headingObject;
   
}

function testOutput(html){
    return html("main > h2").each((i, elem) => {
        html(elem).nextUntil("h2").each((i, elem)=>{
            if (elem.tagName === "h2") {
                console.log("___________________");
                console.log(html(elem).contents().text());
                console.log("___________________");
                return;
            }
            if( elem.tagName === "h3") {
                    console.log("*******************");
                    console.log(html(elem).contents().text());
                    console.log("*******************");
                    return;
            }
            if( elem.tagName === "h4") {
                console.log("///////////////////");
                console.log(html(elem).contents().text());
                console.log("///////////////////");
                return;
            }
            if( elem.tagName === "h5") {
                console.log("~~~~~~~~~~~~~~~~~~~");
                console.log(html(elem).contents().text());
                console.log("~~~~~~~~~~~~~~~~~~~");
                return;
            }

            if( elem.tagName !== "h2" || elem.tagName !== "h3"){
                console.log(html(elem).text().trim());
            }


        })
    })
}

testOutput(htmlFile);
