const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

// KOPYALADIĞINIZ API KEY'İ AŞAĞIDAKİ TIRNAK İÇİNE YAPIŞTIRIN
const SCRAPER_API_KEY = '382c4985172c85f5193eec70b25ff887'; 

app.get('/api/get-image', async (req, res) => {
  const searchQuery = req.query.q;
  
  if (!searchQuery) {
    return res.status(400).json({ error: 'Arama kelimesi gerekli' });
  }

  try {
    // Gitmek istediğimiz asıl Trendyol adresi
    const targetUrl = `https://www.trendyol.com/sr?q=${encodeURIComponent(searchQuery)}`;
    
    // İsteği ScraperAPI üzerinden gönderiyoruz (Bot korumasını onlar aşıyor)
    const scraperUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true`;
    
    // Artık Trendyol'a değil, ScraperAPI'ye istek atıyoruz
    const response = await axios.get(scraperUrl);
    
    const $ = cheerio.load(response.data);
    
    // İlk ürün kartını buluyoruz
    const firstProduct = $('.p-card-wrppr').first();
    
    // Görseli alıyoruz
    const imageUrl = firstProduct.find('.p-card-img').attr('src');
    
    // Markayı alıyoruz
    const brand = firstProduct.find('.prdct-desc-cntnr-ttl').text().trim();
    
    // Ürün linkini alıyoruz
    const productUrl = 'https://www.trendyol.com' + firstProduct.find('a').attr('href');

    if (imageUrl) {
      res.json({ 
        imageUrl: imageUrl,
        brand: brand || undefined,
        productUrl: productUrl || undefined
      });
    } else {
      res.status(404).json({ error: 'Görsel bulunamadı' });
    }

  } catch (error) {
    console.error("Hata detayı:", error.message);
    res.status(500).json({ error: 'Sunucu hatası veya engelleme' });
  }
});

app.listen(3001, () => {
  console.log('Scraper API 3001 portunda çalışıyor');
});
