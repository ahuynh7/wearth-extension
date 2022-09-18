//unsustainable clothing retailer filter algorithm
//prone to bugs 
// yeet
const parseUrl = url => {
    url = new URL(url);
    url.pathname = url.pathname.slice(1);       //removes "/" from the beginning of pathname
    var condition = false;      //condition defines if alg finds a match

    //if url contains "shein" and if tab has landed on a catalog item
    if (url.hostname.includes("shein") && url.pathname.includes("cat")) {       //hardcode to shein
        condition = true;
    }

    return condition;
};

//listens for messages sent from contentScripts; debugging purposes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message, sender);

    //final verification if url origin is shein
    if (!parseUrl(sender.url)) {
        sendResponse(false);

        return;
    } else sendResponse(true);

    //distributing scrapped metadata each hard-picked sustainable website, then filters for top 5 results
    const toEverlane = async () => {
        var noneMatch;
        if(message.gender === "men"){
            noneMatch = 'W/^\^12acd5-CyTzFa2Kp+t9gXE4xsyFN4MAiXU^^'
        }else{
            noneMatch = 'W/^\^19274e-3Ku6ZRJVNsoq1z/KFIeIwJJUt4A^^'
        }

        const options = {
            method: 'GET',
            headers: {
              authority: 'www.everlane.com',
              accept: '*/*',
              'accept-language': 'en-US,en;q=0.9,ja-JP;q=0.8,ja;q=0.7',
              'if-none-match': noneMatch,
              referer: 'https://www.everlane.com/collections/'+message.gender+'s-tees',
              'sec-ch-ua': '^\^Chromium^^;v=^\^104^^, ^\^'
            }
          };
        
        // **need to fix the unique ID that rotates every week**
        var result = await fetch('https://www.everlane.com/_next/data/u-QhQF_AIjhdGI6SvI78a/collections/' + message.gender + "s-all.json", options)
              .then(response => response.json())
              .catch(err => console.error(err));
        
        message.color = message.color.split(" ").pop(); // yoink
        var titledColor = message.color.charAt(0).toUpperCase().concat(message.color.slice(1)); // doesn't take full lowercase when filtered

        
        
        if(message.gender === "men"){ //gender picking specific tee-shirt product groupID's
            var res = Object.values(result.pageProps.fallbackData.products) // filters by groupID which are just the tees for now
                .filter(a => (a.productGroupId === 1000)||(a.productGroupId === 1094)||(a.productGroupId === 1227)||(a.productGroupId === 1645)||(a.productGroupId === 1649))
        }else{
            var res = Object.values(result.pageProps.fallbackData.products) // filters by groupID which are just the tees for now
                .filter(a => (a.productGroupId === 1627)||(a.productGroupId === 1732)||(a.productGroupId === 2261)||(a.productGroupId === 2266)||(a.productGroupId === 2351))
        }
        
        res = [].concat(...res)
            .filter(b => b.color.name.includes(titledColor))
            .map(c => ({
            brand: "Everlane",
            name: c.displayName,
            link: "https://everlane.com/products/".concat(c.permalink),
            image: Object.values(c.albums.square)[0].src,
            price: parseInt(c.price) // keeps it clean (no decimal)
            }));

        return res.splice(0,5);
    };

    const toPact = async () => {
        var myHeaders = new Headers();
        var raw = `blockId=product-grid-1593717194951&gender=${message.gender}&category=&style=&styleCode=&processHeading=false&productColumnSize=col-6+col-md-4&container=%23product-grid-1593717194951+.row.product-list&explodeCards=false&displayExplodedSwatch=false&action=get&pagePath=%2Fmen&options%5BexplodedSwatch%5D=false`;

        myHeaders.append("Accept", "application/json, text/javascript, */*; q=0.01");
        myHeaders.append("Accept-Language", "en-US,en;q=0.9");
        myHeaders.append("Connection", "keep-alive");
        myHeaders.append("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
        myHeaders.append("Origin", "https://wearpact.com");
        myHeaders.append("Sec-Fetch-Dest", "empty");
        myHeaders.append("Sec-Fetch-Mode", "cors");
        myHeaders.append("Sec-Fetch-Site", "same-origin");
        myHeaders.append("X-Requested-With", "XMLHttpRequest");

        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw, 
            redirect: 'follow'
        };
        var result = await fetch("https://wearpact.com/controller/product", requestOptions)
            .then(response => response.json())
            .then(result => result.data)
            .catch(error => console.log('error', error));

        //begin filtering alg.
        var category, parent;
        message.color = message.color.split(" ").pop();

        if (!message.type) {
            category = "tops & shirts";
            parent = "apparel";

        } else if (message.type === "pullovers") {
            category = "hoodies & sweatshirts";
            parent = "apparel";

        } else if (message.waist_line) {
            category = "pants & shorts";
            parent = "apparel";

        } else {
            category = "boxers & briefs";
            parent = "underwear";
        }
        
        result = Object.values(result)
            .filter(e => e.category === category)      //narrows to specific clothing category
            .map(e => Object.entries(e.packs[Object.keys(e.packs)[0]].default));
        result = [].concat(...result)      //narrows to each article in a catalog
            .filter(([id, e]) => e.primaryColor.map(e => e.color).includes(message.color))        //narrows to color
            .map(([id, e]) => ({
                brand: "Pact",
                name: e.description,
                link: "https://wearpact.com/"
                    .concat(message.gender + "/")
                    .concat(parent + "/")
                    .concat(category.replace(/\s/g, "%20").replace(/&/g, "%26") + "/")
                    .concat(e.style.replace(/\s/g, "%20") + "/")
                    .concat(e.itemId),
                image: "https://static.wearpact.com/" + e.img.large[0],
                price: e.price.sale
            }));
        
        return result.splice(0, 5);
    };

    const toPatagonia = async () => {
        return [];
    };

    Promise.all([toEverlane(), toPact(), toPatagonia()])        //waits for each async function to finish executing
        .then(values => {
            chrome.storage.local.set({results: [].concat(...values).sort((a, b) => a.price - b.price)});      //stores results
            chrome.action.setPopup({popup: "src/ui/popup.html"});      //executes popup to display results
        });

    /* stardardized result to be stored
    {
        brand: string,
        name: string,
        link: string href,
        image: string href (ie: "https://static.wearpact.com/img/product/men/mcn-wht-1-1659716761_thumb.jpg"),
        price: double
    }
    */
});

//listens for url changes
chrome.tabs.onUpdated.addListener((tabId, {status}, tab) => {
    if (status === "complete") {
        //algorithm to determine if url matches a non-sustainable clothing merchant
        //in this POC, we will hardcode the match to SHEIN
        if (parseUrl(tab.url)) {
            //content scripting for page manipulation/acquisition
            chrome.scripting.executeScript({
                target: {tabId},
                files: ["src/contentScripts.js"]
            });
        }
    }
});

chrome.storage.onChanged.addListener(changes => {
    //console.log(changes);
});