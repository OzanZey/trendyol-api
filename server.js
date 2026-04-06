const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
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
    
    // render=true kaldırdık (zaman aşımını önlemek için)
    // premium=true ekledik (Trendyol'un engellemelerini daha rahat aşmak için)
    const scraperUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&premium=true`;
    
    // 30 saniye bekleme süresi sınırı koyduk
    const response = await axios.get(scraperUrl, { timeout: 30000 }); 
    
    const $ = cheerio.load(response.data);
    
    // Trendyol'un HTML yapısı için alternatifli aramalar
    let imageUrl = $('.p-card-img').first().attr('src') || $('.image-container img').first().attr('src');
    let brand = $('.prdct-desc-cntnr-ttl').first().text().trim() || $('.brand-name').first().text().trim();
    let productUrl = $('.p-card-wrppr a').first().attr('href') || $('.product-card a').first().attr('href');

    if (productUrl && !productUrl.startsWith('http')) {
        productUrl = 'https://www.trendyol.com' + productUrl;
    }

    if (imageUrl) {
      res.json({ 
        imageUrl: imageUrl,
        brand: brand || undefined,
        productUrl: productUrl || undefined
      });
    } else {
      console.log("Görsel bulunamadı. Sayfa başlığı:", $('title').text());
      res.status(404).json({ error: 'Görsel bulunamadı, Trendyol yapısı değişmiş olabilir.' });
    }

  } catch (error) {
    console.error("Hata detayı:", error.message);
    if (error.response) {
      console.error("ScraperAPI Yanıtı:", error.response.data);
    }
    res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
  }
});

app.listen(3001, () => {
  console.log('Scraper API 3001 portunda çalışıyor');
});
