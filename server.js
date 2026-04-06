const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

// DİKKAT: AŞAĞIDAKİ TIRNAK İÇİNE KENDİ SCRAPER API KEY'İNİZİ YAPIŞTIRMAYI UNUTMAYIN!
const SCRAPER_API_KEY = '382c4985172c85f5193eec70b25ff887'; 

app.get('/api/get-image', async (req, res) => {
  const searchQuery = req.query.q;
  
  if (!searchQuery) {
    return res.status(400).json({ error: 'Arama kelimesi gerekli' });
  }

  if (SCRAPER_API_KEY === 'BURAYA_YAPISTIRIN') {
    return res.status(401).json({ error: 'Lütfen server.js içine ScraperAPI anahtarınızı ekleyin!' });
  }

  try {
    const targetUrl = `https://www.trendyol.com/sr?q=${encodeURIComponent(searchQuery)}`;
    
    // DİKKAT: device_type=desktop ekledik! Trendyol'un bize mobil siteyi değil, masaüstü siteyi vermesini zorunlu kılıyoruz.
    const scraperUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&premium=true&device_type=desktop`;
    
    const response = await axios.get(scraperUrl, { timeout: 25000 }); 
    const html = response.data;
    
    let imageUrl, brand, productUrl;

    // 1. GÖRSELİ BUL (Regex ile gizli JSON verisinden çekiyoruz)
    const imageMatch = html.match(/"imageUrls":\["(https:\/\/cdn\.dsmcdn\.com\/[^"]+)"/);
    if (imageMatch && imageMatch[1]) {
        imageUrl = imageMatch[1];
    } else {
        const altImageMatch = html.match(/"imageUrl":"(https:\/\/cdn\.dsmcdn\.com\/[^"]+)"/);
        if (altImageMatch) imageUrl = altImageMatch[1];
    }

    // 2. MARKAYI BUL
    const brandMatch = html.match(/"brand":\{"id":\d+,"name":"([^"]+)"\}/);
    if (brandMatch && brandMatch[1]) {
        brand = brandMatch[1];
    }

    // 3. ÜRÜN LİNKİNİ BUL
    const urlMatch = html.match(/"url":"(\/[^"]+-p-\d+[^"]*)"/);
    if (urlMatch && urlMatch[1]) {
        productUrl = 'https://www.trendyol.com' + urlMatch[1];
    }

    if (imageUrl) {
      res.json({ 
        imageUrl: imageUrl,
        brand: brand || undefined,
        productUrl: productUrl || undefined
      });
    } else {
      console.log("Masaüstü sitesinde görsel bulunamadı. HTML Boyutu:", html.length);
      res.status(404).json({ error: 'Görsel bulunamadı.' });
    }

  } catch (error) {
    console.error("Hata detayı:", error.message);
    res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
  }
});

app.listen(3001, () => {
  console.log('Scraper API 3001 portunda çalışıyor');
});
