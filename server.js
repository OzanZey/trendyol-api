const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors()); // Frontend'in bu API'ye erişebilmesi için CORS'u açıyoruz

app.get('/api/get-image', async (req, res) => {
  const searchQuery = req.query.q; // Frontend'den gelen arama kelimesi
  
  if (!searchQuery) {
    return res.status(400).json({ error: 'Arama kelimesi gerekli' });
  }

  try {
    // Trendyol arama URL'sini oluşturuyoruz
    const url = `https://www.trendyol.com/sr?q=${encodeURIComponent(searchQuery)}`;
    
    // Axios ile sayfanın HTML'ini indiriyoruz (Tarayıcı gibi davranıyoruz)
    const response = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });
    
    // Cheerio ile HTML'i parçalıyoruz
    const $ = cheerio.load(response.data);
    
    // Trendyol'un ürün kartlarındaki görsel sınıfını buluyoruz
    // Not: Trendyol HTML yapısını değiştirirse bu sınıf adını güncellemeniz gerekebilir.
    // Şu anki yapıda genelde 'p-card-img' sınıfı kullanılıyor.
    const firstImage = $('.p-card-img').first().attr('src');

    if (firstImage) {
      res.json({ imageUrl: firstImage });
    } else {
      res.status(404).json({ error: 'Görsel bulunamadı' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

app.listen(3001, () => {
  console.log('Scraper API 3001 portunda çalışıyor');
});