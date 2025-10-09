const axios = require('axios');

class SearchEngine {
    constructor() {
        this.websites = {
            primary: "https://123.com",
            secondary: "https://abc.com"
        };
    }

    async handleSearch(text, from, userManager) {
        const query = text.replace('.search ', '').trim();
        if (!query) {
            return "❌ Please provide search query\nExample: .search flowers at school";
        }

        userManager.incrementSearches(from);

        try {
            const searchResults = await this.searchWebContent(query);
            return searchResults;
        } catch (error) {
            return "❌ Search failed. Please try again later.";
        }
    }

    async searchWebContent(query) {
        try {
            const encodedQuery = encodeURIComponent(`"${query}" site:123.com OR site:abc.com`);
            const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.SEARCH_ENGINE_ID}&q=${encodedQuery}`;
            
            const response = await axios.get(searchUrl);
            const results = response.data.items.slice(0, 3);

            let searchResults = `🔍 *SEARCH RESULTS: ${query}*\n\n`;
            
            if (results.length === 0) {
                searchResults += `No specific results found.\n\n`;
                searchResults += `🌐 *Browse our websites:*\n`;
                searchResults += `• ${this.websites.primary}\n`;
                searchResults += `• ${this.websites.secondary}\n\n`;
                searchResults += `💡 Try searching directly on our websites.`;
                return searchResults;
            }

            results.forEach((item, index) => {
                searchResults += `${index + 1}. *${item.title}*\n`;
                searchResults += `🔗 ${item.link}\n`;
                searchResults += `📝 ${item.snippet}\n\n`;
            });

            searchResults += `💡 *To Download:* Subscribe with *.subscribe monthly*`;

            return searchResults;
        } catch (error) {
            return `🔍 *SEARCH: ${query}*\n\n` +
                   `🌐 *Browse our websites:*\n` +
                   `• ${this.websites.primary}\n` +
                   `• ${this.websites.secondary}\n\n` +
                   `💡 Use the search feature on our websites to find content.`;
        }
    }
}

module.exports = SearchEngine;