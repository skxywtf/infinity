const https = require('https');
const urls = [
    'https://worldtradefactory.ghost.io/ghost/api/content/settings/?key=8e30fdad5458e9c71940434ac4',
    'https://worldtradefactory.ai/ghost/api/content/settings/?key=8e30fdad5458e9c71940434ac4',
    'https://www.worldtradefactory.ai/ghost/api/content/settings/?key=8e30fdad5458e9c71940434ac4'
];

urls.forEach(url => {
    https.get(url, (res) => {
        console.log(`[${res.statusCode}] ${url}`);
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            console.log(`   -> Redirects to: ${res.headers.location}`);
        }
    }).on('error', (e) => console.log(`[ERROR] ${url} : ${e.message}`));
});
