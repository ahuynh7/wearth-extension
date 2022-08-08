chrome.storage.local.get(
    ["results"],
    ({results}) => {
        let list = document.getElementById("resultsGallery");
        
        //appends a child to the result gallery for each result item
        results.forEach((result, i) => {
            let item = document.createElement("div");console.dir(item);
            let thumbnail = document.createElement("img");
            let brand = document.createElement("h4");
            let name = document.createElement("label");
            let price = document.createElement("p");
            
            //makes the item a link to its respective store item
            item.addEventListener("click", event => {
                chrome.tabs.create({url: result.link});
            });

            item.key = i;
            item.id = list.id + i;
            item.className = "resultsGalleryItem";
            thumbnail.src = "";
            brand.innerHTML = result.brand;
            name.innerText = result.name;
            price.innerText = result.price;

            item.appendChild(thumbnail);
            item.appendChild(brand);
            item.appendChild(name);
            item.appendChild(price);
            list.appendChild(item);
        });
    }
);