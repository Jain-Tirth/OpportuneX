import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

async function debugDevfolio() {
    console.log('--- Debugging Devfolio ---');
    const url = 'https://api.devfolio.co/api/hackathons?filter=application_open&page=1';
    console.log('Fetching:', url);
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        console.log('Devfolio response status:', response.status);
        console.log('Devfolio response data keys:', Object.keys(response.data || {}));
        if (response.data.result) {
            console.log('Devfolio results count:', response.data.result.length);
            console.log('First result sample:', JSON.stringify(response.data.result[0], null, 2));
        } else {
            console.log('No result field in response.data');
            console.log('Full data sample:', JSON.stringify(response.data, null, 2).substring(0, 1000));
        }
    } catch (e) {
        console.error('Devfolio fetch error:', e.message);
        if (e.response) {
            console.error('Devfolio error status:', e.response.status);
            console.error('Devfolio error data:', JSON.stringify(e.response.data).substring(0, 500));
        }
    }
}

async function debugUnstop() {
    console.log('\n--- Debugging Unstop ---');
    const url = 'https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&page=1';
    console.log('Fetching:', url);
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        console.log('Unstop response status:', response.status);
        console.log('Unstop response data keys:', Object.keys(response.data || {}));
        if (response.data.data) {
            console.log('Unstop data keys:', Object.keys(response.data.data));
            const innerData = response.data.data.data;
            if (innerData) {
                console.log('Unstop inner data length/keys:', Object.keys(innerData).length);
                const firstKey = Object.keys(innerData)[0];
                console.log('First Unstop opportunity sample:', JSON.stringify(innerData[firstKey], null, 2).substring(0, 1000));
            } else {
                console.log('No inner data.data field');
            }
        } else {
            console.log('No data field in response');
        }
    } catch (e) {
        console.error('Unstop fetch error:', e.message);
        if (e.response) {
            console.error('Unstop error status:', e.response.status);
            console.error('Unstop error data:', JSON.stringify(e.response.data).substring(0, 500));
        }
    }
}

async function debugDevpost() {
    console.log('\n--- Debugging Devpost ---');
    // The current .env has DEVPOST_API=https://devpost.com/api/hackathons/
    // Let's test DEVPOST_API: https://devpost.com/api/hackathons/
    const url = 'https://devpost.com/api/hackathons';
    console.log('Fetching:', url);
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        console.log('Devpost response status:', response.status);
        console.log('Devpost response data keys:', Object.keys(response.data || {}));
        if (response.data.hackathons) {
            console.log('Devpost hackathons count:', response.data.hackathons.length);
            console.log('First hackathon sample:', JSON.stringify(response.data.hackathons[0], null, 2).substring(0, 500));
        }
    } catch (e) {
        console.error('Devpost fetch error:', e.message);
        if (e.response) {
            console.error('Devpost error status:', e.response.status);
            console.error('Devpost error data:', JSON.stringify(e.response.data).substring(0, 500));
        }
    }
}

async function run() {
    await debugDevfolio();
    await debugUnstop();
    await debugDevpost();
}

run();
