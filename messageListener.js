// messageListener.js

chrome.runtime.onMessage.addListener(function (message) {
    if(message.message === "page_info") {
        let outputDiv = document.getElementById('output');

        // Character count and class assignment for color-coding based on SEO best practices
        let titleCharCount = message.title.length;
        let titleTagClass = titleCharCount >= 60 && titleCharCount <= 70 ? "green" : "red";

        let metaDescCharCount = message.metaDesc.length;
        let metaDescClass = metaDescCharCount >= 150 && metaDescCharCount <= 160 ? "green" : "red";

        let indexedStatus = message.isIndexed ? "Yes" : "No";

        // HTML content with dynamic data
        let htmlContent = `
            <h2>SEO Audit Results</h2>
            <p><strong>Title:</strong> ${message.title} 
               <span class="${titleTagClass}" title="Title should be 60-70 characters">(${titleCharCount} chars)</span>
            </p>
            <p><strong>Meta Description:</strong> ${message.metaDesc} 
               <span class="${metaDescClass}" title="Description should be 150-160 characters">(${metaDescCharCount} chars)</span>
            </p>
            <p><strong>Is Indexed:</strong> ${indexedStatus}</p>
            <p><strong>H1 Tags:</strong> ${message.h1Count}</p>
            <p><strong>H2 Tags:</strong> ${message.h2Count}</p>
            <p><strong>H3 Tags:</strong> ${message.h3Count}</p>
            <p><strong>H4 Tags:</strong> ${message.h4Count}</p>
        `;

        // Insert the HTML content into the popup's output div
        outputDiv.innerHTML = htmlContent;
    }
});

