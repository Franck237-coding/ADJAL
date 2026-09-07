package cm.adjal.api.service;

import cm.adjal.api.repository.CahierRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class MarketService {
    private final CahierRepository repository;

    public MarketService(CahierRepository repository) {
        this.repository = repository;
    }

    public List<CahierRepository.MarketPrice> prices(String productName, String city) {
        return repository.marketPrices(productName, city);
    }

    public CahierRepository.MarketPrice addPrice(UUID recorderId, String productName, String category,
                                                 String city, String region, String unit, BigDecimal price) {
        return repository.addMarketPrice(recorderId, productName, category, city, region, unit, price);
    }

    public List<CahierRepository.MarketAlert> alerts(UUID accountId) {
        return repository.alertsFor(accountId);
    }

    public void createAlert(UUID accountId, String productName, String city, String title,
                            String message, BigDecimal variationPercent) {
        repository.createMarketAlert(accountId, productName, city, title, message, variationPercent);
    }
}