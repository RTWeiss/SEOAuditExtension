function detectCMS() {
    let cmsInfo = {
        cms: "Unknown",
        theme: "Unknown"
    };

    // Check for WordPress
    if (document.body.innerHTML.includes("wp-content")) {
        cmsInfo.cms = "WordPress";
        
        // Example of detecting a specific plugin
        if (document.body.innerHTML.includes("woocommerce")) {
            cmsInfo.plugins.push("WooCommerce");
        }

        // Example of detecting theme
        let themePathMatches = document.body.innerHTML.match(/\/themes\/([a-zA-Z0-9_-]+)\//);
        if (themePathMatches) {
            cmsInfo.theme = themePathMatches[1];
        }
    }

    // Shopify Detection
    else if (document.querySelector('script[src*="shopify.com"]') !== null) {
        cmsInfo.cms = 'Shopify';
        // Shopify theme detection logic
        let shopifyMeta = document.querySelector('meta[name="shopify-checkout-api-token"]');
        if (shopifyMeta) {
            cmsInfo.theme = 'Custom Shopify Theme';
        }
    }

    // Wix Detection
    else if (document.querySelector('meta[name="generator"][content="Wix.com Website Builder"]') !== null) {
        cmsInfo.cms = 'Wix';
        // Wix theme detection logic can be complex and might not be reliably implemented
        cmsInfo.theme = 'Custom Wix Theme';
    }

    // Weebly Detection
    else if (document.querySelector('div.wsite-footer') !== null) {
        cmsInfo.cms = 'Weebly';
        // Weebly doesn’t easily expose theme details
        cmsInfo.theme = 'Custom Weebly Theme';
    }

    // Webflow Detection
    else if (document.querySelector('html[data-wf-page]') !== null) {
        cmsInfo.cms = 'Webflow';
        // Webflow theme detection logic
        cmsInfo.theme = 'Custom Webflow Theme';
    }
    return cmsInfo;
}

// When the script is injected into the page, collect SEO data and send it to the background script
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.message === "clicked_browser_action") {
            let seoData = collectSeoData();
            seoData.cmsInfo = detectCMS();  // Add CMS info to the SEO data
            sendResponse(seoData);
        }
    }
);
function getSEOData() {
    try {

    let title = document.title;
    let metaDesc = document.querySelector("meta[name='description']")?.content || '';
    let isIndexed = !document.querySelector("meta[name='robots'][content='noindex']");

    let headings = getHeadings();
    let internalLinks = getInternalLinks();

    return {
        url: window.location.href,  
        title: title,
        titleCharCount: title.length,
        metaDesc: metaDesc,
        metaDescCharCount: metaDesc.length,
        isIndexed: isIndexed,
        h1Count: document.getElementsByTagName('h1').length,
        h2Count: document.getElementsByTagName('h2').length,
        h3Count: document.getElementsByTagName('h3').length,
        h4Count: document.getElementsByTagName('h4').length,
        headings: headings,
        internalLinks: internalLinks,
        internalLinksCount: internalLinks.length,
        cmsInfo: detectCMS()
    };
} catch (error) {
    console.error("Error getting SEO data: ", error);
    // Might want to send an error message to the popup
    chrome.runtime.sendMessage({
        message: "error",
        data: "Error message if you need it."
    });
}  
    
}

function getHeadings() {
    let headings = [];
    document.querySelectorAll('h1, h2, h3, h4').forEach(heading => {
        headings.push({
            tag: heading.tagName.toLowerCase(),
            text: heading.innerText.trim(),
            subHeadings: []
        });
    });
    let hierarchicalHeadings = [];
    let currentHeadingLists = [hierarchicalHeadings];
    
    headings.forEach(heading => {
        let level = parseInt(heading.tag[1]);
        currentHeadingLists.length = level;
        if (!currentHeadingLists[level - 1]) {
            currentHeadingLists[level - 1] = [];
        }
        currentHeadingLists[level - 1].push(heading);
        currentHeadingLists[level] = heading.subHeadings;
        
        // Ensure h3 elements are also included at the top level when h2 elements are not present
        if (heading.tag === 'h3' && !headings.some(h => h.tag === 'h2')) {
            hierarchicalHeadings.push(heading);
        }
    });

    return hierarchicalHeadings;
}


function getInternalLinks() {
    let links = document.querySelectorAll('a[href]');
    let internalLinks = [];
    
    links.forEach(link => {
        // Check if the link is internal
        if (link.href.startsWith(window.location.origin)) {
            internalLinks.push({
                text: link.innerText.trim() || link.href,
                href: link.href
            });
        }
    });

    return internalLinks;
}
function getTrackingCodes() {
    let trackingCodesInfo = [];

    // Store found codes to avoid duplicates
    let foundCodes = { ga4: new Set(), fbPixel: new Set() };

    // Detect GTM
    document.querySelectorAll("script").forEach(script => {
        // Google Tag Manager
        if (script.innerHTML.includes("googletagmanager.com")) {
            let codeMatch = script.innerHTML.match(/['"](GTM-\w+)['"]/);
            if (codeMatch) {
                trackingCodesInfo.push({ type: "Google Tag Manager", code: codeMatch[1] });
            } else {
                trackingCodesInfo.push({ type: "Google Tag Manager", code: "Not found" });
            }
        }
    });
    // Google Analytics 4 (GA4)
    document.querySelectorAll("script").forEach(script => {
        // When the script src contains googletagmanager.com/gtag/js
        if (script.src.includes("googletagmanager.com/gtag/js")) {
            let codeMatch = script.src.match(/id=(G-\w+)/);
            if (codeMatch && !foundCodes.ga4.has(codeMatch[1])) {
                trackingCodesInfo.push({ type: "Google Analytics 4", code: codeMatch[1], src: script.src });
                foundCodes.ga4.add(codeMatch[1]);  // Add to found codes to avoid duplicates
            }
        } 
        // When the script contains gtag('config', 'G-XXXX')
        else if (script.innerHTML.includes("gtag('config',")) {
            let codeMatch = script.innerHTML.match(/gtag\('config', ['"](G-\w+)['"]\)/);
            if (codeMatch && !foundCodes.ga4.has(codeMatch[1])) {
                trackingCodesInfo.push({ type: "Google Analytics 4", code: codeMatch[1] });
                foundCodes.ga4.add(codeMatch[1]);  // Add to found codes to avoid duplicates
            }
        }
    });

    return trackingCodesInfo;
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.message === "clicked_browser_action") {
            sendResponse(getSeoData());
        } else if(request.action == "getContent") {
            sendResponse({ content: getPageContent() });
        } else if(request.action == "getSource") {
            sendResponse({ source: document.documentElement.outerHTML });
        } else if(request.action == "getTrackingCodes") {
            sendResponse({ trackingCodesInfo: getTrackingCodes() });
        }
    }
);

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.message === "clicked_browser_action") {
            sendResponse(getSEOData());
        }
    }
);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action == "getSource") {
        sendResponse({ source: document.documentElement.outerHTML });
    }
});
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        // ... potentially other code ...
        if(request.action == "getContent") {
            // Create an element to store the cloned content
            let clonedContent = document.createElement('div');

            // Get all relevant elements not in header/footer
            let relevantElements = document.body.querySelectorAll('h1, h2, h3, h4, h5, h6, p');
            relevantElements = Array.from(relevantElements).filter(el => 
                !el.closest('header') && !el.closest('footer')
            );
            
            relevantElements.forEach(el => {
                // Clone the element
                let clonedEl = el.cloneNode(true);

                // If the element is a paragraph, keep links and spans, otherwise remove them
                if(el.tagName.toLowerCase() === 'p') {
                    // Keep the links and spans, remove other elements
                    clonedEl.querySelectorAll('*').forEach(child => {
                        if(child.tagName.toLowerCase() !== 'a' && child.tagName.toLowerCase() !== 'span') {
                            child.remove();
                        }
                    });
                } else {
                    // If it's a heading, remove all child elements to keep only text
                    clonedEl.innerHTML = clonedEl.textContent;
                }

                // Append the cloned element to the clonedContent
                clonedContent.appendChild(clonedEl);
            });

            // Extract and send the HTML content of the clonedContent
            sendResponse({ content: clonedContent.innerHTML });
        }
    }
);


