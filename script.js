let selectedLength = "medium";

function setSummaryLengthAndSummarize(length) {
    selectedLength = length;
    summarizeDocument();
}

function copySummary() {
    const text = document.getElementById("summaryText").innerText;
    navigator.clipboard.writeText(text).then(() => {
        alert("Summary copied to clipboard!");
    });
}

async function fetchArticleText(url) {
    try {
        const response = await fetch("https://api.allorigins.win/get?url=" + encodeURIComponent(url));
        const data = await response.json();
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, "text/html");

        // Remove unwanted elements
        doc.querySelectorAll("script, style, noscript, iframe, header, footer, nav, form").forEach(el => el.remove());
        return doc.body.innerText.replace(/\s+/g, ' ').trim();
    } catch (error) {
        return "Error fetching article content.";
    }
}

function splitTextIntoChunks(text, chunkSize = 800) {
    let chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
}

async function summarizeChunk(chunk, minLength, maxLength) {
    try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay to prevent API overload
        const response = await fetch("https://api-inference.huggingface.co/models/facebook/bart-large-cnn", {
            method: "POST",
            headers: {
                "Authorization": "Bearer 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",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: chunk,
                parameters: {
                    min_length: minLength,
                    max_length: maxLength,
                    do_sample: false
                }
            })
        });
        const data = await response.json();
        return data[0]?.summary_text || "";
    } catch (error) {
        return "";
    }
}

async function summarizeDocument() {
    const url = document.getElementById("urlInput").value;
    
    if (!url) {
        alert("Please enter a URL.");
        return;
    }
    
    document.getElementById("summaryText").innerText = "Fetching content...";
    const articleText = await fetchArticleText(url);
    
    document.getElementById("originalText").innerText = articleText;
    document.getElementById("originalWordCount").innerText = articleText.split(" ").length;
    
    if (articleText.startsWith("Error")) {
        document.getElementById("summaryText").innerText = "Failed to retrieve content. Please try another URL.";
        return;
    }
    
    let minLength, maxLength;
    switch (selectedLength) {
        case "short":
            minLength = 20;
            maxLength = 50;
            break;
        case "medium":
            minLength = 50;
            maxLength = 150;
            break;
        case "long":
            minLength = 100;
            maxLength = 300;
            break;
    }
    
    document.getElementById("summaryText").innerText = "Processing summarization...";
    
    let chunks = splitTextIntoChunks(articleText);
    let summaryPromises = chunks.map(chunk => summarizeChunk(chunk, minLength, maxLength));
    let summaries = await Promise.all(summaryPromises);
    
    let finalSummary = summaries.filter(summary => summary !== "").join(" ");
    document.getElementById("summaryText").innerText = finalSummary;
    document.getElementById("summaryWordCount").innerText = finalSummary.split(" ").length;
}
