//set in local storage product data scraped from webpage
chrome.storage.local.set({
    variables: {        //variables of item to be filtered
        name: document.getElementsByClassName("product-intro__head-name")[0]?.innerText,
        price: document.getElementsByClassName("original")[0]?.innerText,
        ...[...document.getElementsByClassName("product-intro__description-table")[0]?.children]
            //parses SHEIN's product description element
            .reduce((acc, curr) => ({
                ...acc,
                [curr.children[0].innerText.slice(0, -1).toLowerCase()]: curr.children[1].innerText}
            ), {})
    },
    results: {}
});

//gets storage data then sends to service worker
chrome.storage.local.get(
    ["variables"],       //if null argument, then gets all data in storage
    result => {
        chrome.runtime.sendMessage(result);
    }
);