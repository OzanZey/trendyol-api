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
    
    // render=true geri ekledik çünkü Trendyol resimleri JavaScript ile sonradan yüklüyor (Lazy Load)
    const scraperUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true&premium=true`;
    
    const response = await axios.get(scraperUrl, { timeout: 45000 }); 
    
    const $ = cheerio.load(response.data);
    
    // Trendyol'un YENİ HTML yapısı için çok daha geniş kapsamlı aramalar
    let imageUrl = 
      $('.p-card-img').first().attr('src') || 
      $('.image-container img').first().attr('src') || 
      $('.product-image').first().attr('src') ||
      $('.p-card-wrppr img').first().attr('src');
      
    // Eğer resim Lazy Load (sonradan yüklenen) ise data-src içinde saklanır
    if (!imageUrl || imageUrl.includes('data:image/svg+xml') || imageUrl.includes('base64')) {
      imageUrl = 
        $('.p-card-img').first().attr('data-src') || 
        $('.image-container img').first().attr('data-src') ||
        $('.p-card-wrppr img').first().attr('data-src');
    }

    let brand = 
      $('.prdct-desc-cntnr-ttl').first().text().trim() || 
      $('.brand-name').first().text().trim() || 
      $('.product-brand').first().text().trim();

    let productUrl = 
      $('.p-card-wrppr a').first().attr('href') || 
      $('.product-card a').first().attr('href') || 
      $('.p-card-chldrn-cntnr a').first().attr('href');

    if (productUrl && !productUrl.startsWith('http')) {
        productUrl = 'https://www.trendyol.com' + productUrl;
    }

    if (imageUrl && !imageUrl.includes('data:image/svg+xml')) {
      res.json({ 
        imageUrl: imageUrl,
        brand: brand || undefined,
        productUrl: productUrl || undefined
      });
    } else {
      console.log("Görsel bulunamadı. Sayfa HTML'inden bir kesit:", $('body').html().substring(0, 200));
      res.status(404).json({ error: 'Görsel bulunamadı, Trendyol yapısı değişmiş olabilir.' });
    }

  } catch (error) {
    console.error("Hata detayı:", error.message);
    res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
  }
});

app.listen(3001, () => {
  console.log('Scraper API 3001 portunda çalışıyor');
});
