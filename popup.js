document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("overviewBtn").addEventListener("click", showOverview);
    document.getElementById("trackingCodesBtn").addEventListener("click", showTrackingCodes);
    document.getElementById("headingsBtn").addEventListener("click", showHeadings);
    document.getElementById("contentBtn").addEventListener("click", showContent);
    document.getElementById("exportBtn").addEventListener("click", exportToExcel);
    document.getElementById("internalLinksBtn").addEventListener("click", showInternalLinks);
    document.getElementById("exportInternalLinksBtn").addEventListener("click", exportInternalLinks);
    document.getElementById("exportContentBtn").addEventListener("click", exportContent);

    getSeoData();
    checkTrackingCode();

     // Add event listener for tooltips after a slight delay to ensure all elements have been rendered
     setTimeout(() => {
        let tooltips = document.querySelectorAll('.tooltip');
        tooltips.forEach(tooltip => {
            tooltip.addEventListener('mouseover', function() {
                // Ensure the text element exists before trying to access its properties
                let text = this.querySelector('.tooltiptext');
                if (text) {
                    let rect = text.getBoundingClientRect();
                    let tooltipWidth = rect.width;
                    let tooltipParentWidth = tooltip.offsetWidth;
                    text.style.left = (tooltipParentWidth / 2) - (tooltipWidth / 2) + "px";
                }
            });
        });
    }, 500); // This delay ensures that tooltips have been rendered before we attach the mouseover event listeners
   
});

let currentSeoData = null;

function getSeoData() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        var currentTab = tabs[0];
        if (currentTab.url && !currentTab.url.startsWith("chrome://") && currentTab.status === "complete") {
            chrome.scripting.executeScript({
                target: {tabId: currentTab.id},
                files: ['contentScript.js']
            }, () => {
                if(chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    return;
                }
                chrome.tabs.sendMessage(currentTab.id, {message: "clicked_browser_action"}, function(response) {
                    currentSeoData = response;
                    populateSEOData(response);
                });
            });
        }
    });
}

function populateSEOData(seoData) {
    if (!seoData) {
        console.error("No SEO data received");
        return;
    }   
    document.getElementById('urlText').innerText = seoData.url;  

    if(seoData.url){
        let url = new URL(seoData.url);
        let robotsTxtUrl = url.origin + "/robots.txt";
        document.getElementById('robotsTxtLink').href = robotsTxtUrl;
        document.getElementById('robotsTxtLink').textContent = robotsTxtUrl;
    } else {
        document.getElementById('robotsTxtLink').textContent = "Not Available";
        document.getElementById('robotsTxtLink').href = "#";
        document.getElementById('robotsTxtLink').target = "";
    }
    
    //Title Tag
    document.getElementById('titleText').innerText = seoData.title;
    
    // Character count and class assignment for color-coding based on SEO best practices
    let titleCharCount = seoData.titleCharCount;
    document.getElementById('titleCharCount').innerText = titleCharCount;
    let isTitleCountGood = titleCharCount >= 60 && titleCharCount <= 70;
    document.getElementById('titleCharCount').className = isTitleCountGood ? "green" : "red";
    
    // Tooltip text setup
    document.getElementById('titleTooltip').setAttribute("data-tooltip", isTitleCountGood ?
        "Title character count is within the SEO-friendly range (60-70)." :
        "Title character count is outside the SEO-friendly range (60-70).");
    
    document.getElementById('descText').innerText = seoData.metaDesc;
    
    let metaDescCharCount = seoData.metaDescCharCount;
    document.getElementById('metaDescCharCount').innerText = metaDescCharCount;
    let isMetaDescCountGood = metaDescCharCount >= 150 && metaDescCharCount <= 160;
    document.getElementById('metaDescCharCount').className = isMetaDescCountGood ? "green" : "red";
    
    document.getElementById('descTooltip').setAttribute("data-tooltip", isMetaDescCountGood ?
        "Meta description character count is within the SEO-friendly range (150-160)." :
        "Meta description character count is outside the SEO-friendly range (150-160).");
    
    document.getElementById('isIndexed').innerText = (seoData.isIndexed ? "Indexed" : "No-Indexed");
    document.getElementById('h1Count').innerText = seoData.h1Count;
    document.getElementById('h2Count').innerText = seoData.h2Count;
    document.getElementById('h3Count').innerText = seoData.h3Count;
    document.getElementById('h4Count').innerText = seoData.h4Count;

    populateHeadings(seoData.headings, document.getElementById('headingsList'));

    document.getElementById('internalLinksCount').innerText = seoData.internalLinksCount;
    
    populateInternalLinks(seoData.internalLinks, document.getElementById('internalLinksTable').getElementsByTagName('tbody')[0]);
    // New - Populate CMS Info
    if (seoData.cmsInfo.cms) {
        document.getElementById('cmsName').innerText = seoData.cmsInfo.cms;
        document.getElementById('themeName').innerText = seoData.cmsInfo.theme || "Not Found";
    } else {
        document.getElementById('cmsName').innerText = "Not Found";
        document.getElementById('themeName').innerText = "Not Found";
    }

}

function checkTrackingCode() {
    // Get the tracking codes ul element
    const trackingCodesList = document.getElementById("trackingCodesList");
    trackingCodesList.innerHTML = '';  // Clear previous entries

    // Check Google Analytics (GA4)
    chrome.storage.local.get("ga4Id", function(data) {
        let li = document.createElement('li');
        if (data.ga4Id) {
            li.innerText = "GA4 ID: " + data.ga4Id;
            // Additional UI for found GA4...
        } else {
            li.innerText = "GA4 ID: Not Found";
            // Additional UI for not found GA4...
        }
        trackingCodesList.appendChild(li);
    });

    // Check Google Tag Manager (GTM)
    chrome.storage.local.get("gtmId", function(data) {
        let li = document.createElement('li');
        if (data.gtmId) {
            li.innerText = "GTM ID: " + data.gtmId;
            // Additional UI for found GTM...
        } else {
            li.innerText = "GTM ID: Not Found";
            // Additional UI for not found GTM...
        }
        trackingCodesList.appendChild(li);
    });
    chrome.storage.local.set({"fbPixelDetected": false});
}

function populateHeadings(headings, parentElement) {
    headings.forEach(heading => {
        let li = document.createElement('li');
        li.className = heading.tag;
        li.innerText = `${heading.tag.toUpperCase()}: ${heading.text}`;
        
        // Derive level directly from tag name to ensure accurate hierarchy
        let level = parseInt(heading.tag[1]);
        li.style.marginLeft = `${(level - 1) * 20}px`; // Maintain visual hierarchy
        
        parentElement.appendChild(li);
        
        // Recursive call without incrementing level, since level is derived from tag name
        if (heading.subHeadings.length > 0) {
            populateHeadings(heading.subHeadings, parentElement);
        }
    });
}

function populateInternalLinks(internalLinks, parentElement) {
    parentElement.innerHTML = '';  // Clear existing rows
    
    internalLinks.forEach(link => {
        let newRow = parentElement.insertRow();
        newRow.insertCell().textContent = link.text;
        let cell = newRow.insertCell();
        let anchor = document.createElement('a');
        anchor.href = link.href;
        anchor.textContent = link.href;
        anchor.target = "_blank";  // Open in a new tab/window
        cell.appendChild(anchor);
    });
}


function hideAllSections() {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove("active");
    });
}

function showOverview() {
    document.getElementById('overviewSection').style.display = 'block';
    document.getElementById("trackingCodesSection").style.display = 'none';
    document.getElementById('headingsSection').style.display = 'none';
    document.getElementById("contentSection").style.display = 'none';
    document.getElementById('internalLinksSection').style.display = 'none';
    document.getElementById('sourceSection').style.display = 'none';

}
function showTrackingCodes() {
    document.getElementById('overviewSection').style.display = 'none';
    document.getElementById("trackingCodesSection").style.display = 'block';
    document.getElementById('headingsSection').style.display = 'none';
    document.getElementById("contentSection").style.display = 'none';
    document.getElementById('internalLinksSection').style.display = 'none';
    document.getElementById('sourceSection').style.display = 'none';

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "getTrackingCodes" }, function (response) {
            let trackingCodesList = document.getElementById("trackingCodesList");
            trackingCodesList.innerHTML = '';  // Clear any existing items

            // Populate the list with tracking codes and their details
            response.trackingCodesInfo.forEach(info => {
                let li = document.createElement('li');
                li.innerHTML = `<strong>${info.type}</strong>: ${info.code}` +
                               (info.src ? ` (<a href="${info.src}" target="_blank">script src</a>)` : "");
                trackingCodesList.appendChild(li);
            });
        });
    });
}
function showHeadings() {
    document.getElementById('overviewSection').style.display = 'none';
    document.getElementById("trackingCodesSection").style.display = 'none';
    document.getElementById('headingsSection').style.display = 'block';
    document.getElementById("contentSection").style.display = 'none';
    document.getElementById('internalLinksSection').style.display = 'none';
    document.getElementById('sourceSection').style.display = 'none';
}
function showContent() {
    document.getElementById('overviewSection').style.display = 'none';
    document.getElementById("trackingCodesSection").style.display = 'none';
    document.getElementById('headingsSection').style.display = 'none';
    document.getElementById("contentSection").style.display = 'block';
    document.getElementById('internalLinksSection').style.display = 'none';
    document.getElementById('sourceSection').style.display = 'none';
    
    // Request the page content from the content script
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "getContent" }, function (response) {
            document.getElementById("pageContent").innerHTML = response.content;
        });
    });
}
function showInternalLinks() {
    document.getElementById('overviewSection').style.display = 'none';
    document.getElementById("trackingCodesSection").style.display = 'none';
    document.getElementById('headingsSection').style.display = 'none';
    document.getElementById("contentSection").style.display = 'none';
    document.getElementById('internalLinksSection').style.display = 'block';
    document.getElementById('sourceSection').style.display = 'none';
}
function showSource() {
    document.getElementById('overviewSection').style.display = 'none';
    document.getElementById("trackingCodesSection").style.display = 'none';
    document.getElementById('headingsSection').style.display = 'none';
    document.getElementById("contentSection").style.display = 'none';
    document.getElementById('internalLinksSection').style.display = 'none';
    document.getElementById('sourceSection').style.display = 'block';

    // Request the page source from the content script
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "getSource" }, function (response) {
            document.getElementById("pageSource").textContent = response.source;
        });
    });
}

function exportToExcel() {
    if (!currentSeoData || !currentSeoData.headings) {
        console.error("No SEO data available for export.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    // Add an empty line so headers start from row 2
    csvContent += "\n";
    // Adding header row
    csvContent += "H1,H2,H3,H4\n"; // Add column headers
    
    let rows = flattenHeadings(currentSeoData.headings, []);
    csvContent += rows.map(e => e.join(",")).join("\n");

    // Add data blob and download it
    let blob = new Blob([csvContent], { type: 'text/csv' });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = 'headings.csv';
    link.click();
}
function flattenHeadings(headings, parentText = [], allRows = []) {
    headings.forEach(heading => {
        let currentText = parentText.slice();  // Create a shallow copy to avoid reference issues
        
        // Determine the position based on the heading level and update the text
        let position = parseInt(heading.tag[1]) - 1;
        currentText[position] = `"${heading.text.replace(/"/g, '""')}"`;

        // Ensure the row has the correct length by filling with empty strings
        while (currentText.length < 6) {  // Adjusted to handle up to h6
            currentText.push('');
        }

        // Add the currentText to allRows
        allRows.push(currentText);

        // If there are subHeadings, process them with a clean slate from the current heading level
        if (heading.subHeadings.length > 0) {
            let nextLevelText = currentText.slice(0, position); 
            while (nextLevelText.length < 6) {  // Ensure it has the correct length
                nextLevelText.push('');
            }
            flattenHeadings(heading.subHeadings, nextLevelText, allRows);
        }
    });
    return allRows;
}
function exportInternalLinks() {
    if (!currentSeoData || !currentSeoData.internalLinks) {
        console.error("No internal link data available for export.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    // Adding an empty row at the start so headers start from row 2
    csvContent += "\n";
    // Adding header row
    csvContent += "Link Text,URL\n";
    
    // Add internal link data
    currentSeoData.internalLinks.forEach(link => {
        csvContent += `"${link.text.replace(/"/g, '""')}",${link.href}\n`;
    });

    // Add data blob and download it
    let blob = new Blob([csvContent], { type: 'text/csv' });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = 'internal_links.csv';
    link.click();
}

function exportSource() {
    let pageSource = document.getElementById("pageSource").textContent;
    
    // Create a Blob with the page source
    let blob = new Blob([pageSource], { type: 'text/html' });
    
    // Create a link element
    let link = document.createElement("a");
    
    // Set the download attribute with a filename
    link.download = "page-source.html";
    
    // Create a URL for the blob and set it as the href attribute
    link.href = URL.createObjectURL(blob);
    
    // Append the link to the body
    document.body.appendChild(link);
    
    // Simulate a click on the link
    link.click();
    
    // Remove the link from the body
    document.body.removeChild(link);
}
function exportContent() {
    // Get the content
    let content = document.getElementById("pageContent").innerHTML;

    // Include CSS styles to preserve styling in Word
    let styles = `
        <style>
            body {
                font-family: Arial, sans-serif;
            }
            h1 {
                color: navy;
            }
            p {
                color: grey;
            }
            a {
                color: blue;
                text-decoration: underline;
            }
            /* Add other styles as needed */
        </style>`;
    let htmlContent = '<!DOCTYPE html><html><head>' + styles + '</head><body>' + content + '</body></html>';

    // Create a Blob with the content, specifying it as HTML
    let blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
    });

    // Create a link element
    let downloadLink = document.createElement("a");

    // Provide a name for the file to be downloaded
    downloadLink.download = 'ExtractedContent.doc';

    // Create a data URI for the Blob and set it as the href attribute
    downloadLink.href = URL.createObjectURL(blob);

    // Append the link to the body
    document.body.appendChild(downloadLink);

    // Programmatically click the link to trigger the download
    downloadLink.click();

    // Remove the link from the document
    document.body.removeChild(downloadLink);
}
