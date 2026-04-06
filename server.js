const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/api/get-image', async (req, res) => {
  const searchQuery = req.query.q;
  
  if (!searchQuery) {
    return res.status(400).json({ error: 'Arama kelimesi gerekli' });
  }

  try {
    const url = `https://www.trendyol.com/sr?q=${encodeURIComponent(searchQuery)}`;
    
    // Trendyol'un bot korumasını aşmak için daha gerçekçi tarayıcı başlıkları ekliyoruz
    const response = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'none',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1'
        }
    });
    
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
        // Not: Kumaş ve Beden bilgisi Trendyol arama sayfasında yazmadığı için, 
        // onları yapay zekanın tavsiyesinden kullanmaya devam edeceğiz.
      });
    } else {
      res.status(404).json({ error: 'Görsel bulunamadı' });
    }

  } catch (error) {
    console.error("Hata detayı:", error.message);
    res.status(500).json({ error: 'Sunucu hatası veya Trendyol engellemesi' });
  }
});

app.listen(3001, () => {
  console.log('Scraper API 3001 portunda çalışıyor');
});
