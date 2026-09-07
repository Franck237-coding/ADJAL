package cm.adjal.api.service;

import cm.adjal.api.repository.MarketplaceRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class RecommendationService {
    private final MarketplaceRepository repository;

    public RecommendationService(MarketplaceRepository repository) {
        this.repository = repository;
    }

    public List<Map<String, Object>> recommend(UUID accountId) {
        var user = repository.findById(accountId).orElseThrow();
        Set<String> interacted = new HashSet<>(repository.interactionProductIds(accountId));
        return repository.saleableProducts().stream()
            .map(product -> score(product, user, interacted))
            .sorted(Comparator.comparingDouble(item -> -((Number) item.get("score")).doubleValue()))
            .toList();
    }

    private Map<String, Object> score(MarketplaceRepository.Product product,
                                      cm.adjal.api.security.AuthenticatedUser user,
                                      Set<String> interacted) {
        List<String> reasons = new ArrayList<>();
        String category = product.category().toLowerCase(Locale.ROOT);
        boolean interest = user.interests().stream().map(value -> value.toLowerCase(Locale.ROOT))
            .anyMatch(value -> category.contains(value) || interestMatches(value, category));
        double interestScore = interest ? 40 : 0;
        if (interest) reasons.add("Correspond à vos intérêts");

        double proximityScore = geographicScore(user.latitude(), user.longitude(), product.latitude(), product.longitude());
        if (proximityScore > 0) reasons.add("Proche de votre localisation");
        else if (product.city() != null && user.city() != null && product.city().equalsIgnoreCase(user.city())) {
            proximityScore = 10;
            reasons.add("Disponible à " + product.city());
        }

        double urgencyScore = 0;
        double perishabilityScore = 0;
        if (product.shelfLifeDays() != null && product.harvestDate() != null) {
            long age = ChronoUnit.DAYS.between(product.harvestDate(), LocalDate.now());
            double remainingRatio = Math.max(0, 1 - ((double) age / product.shelfLifeDays()));
            urgencyScore = Math.min(20, Math.max(0, (1 - remainingRatio) * 20));
            perishabilityScore = Math.min(10, Math.max(0, (1 - Math.min(1, product.shelfLifeDays() / 30.0)) * 10));
            if (urgencyScore >= 12) reasons.add("Produit à consommer rapidement");
            if (perishabilityScore >= 6) reasons.add("Produit périssable récemment récolté");
        }

        long daysSinceHarvest = product.harvestDate() == null ? 99 :
            Math.max(0, ChronoUnit.DAYS.between(product.harvestDate(), LocalDate.now()));
        double freshnessScore = Math.max(0, 5 - Math.min(5, daysSinceHarvest));
        if (daysSinceHarvest <= 2) reasons.add("Récolte récente");

        double stockScore = product.stock().doubleValue() > 0 ? 5 : 0;
        if (interacted.contains(product.id().toString())) {
            interestScore = Math.min(40, interestScore + 5);
            reasons.add("Basé sur vos interactions");
        }
        if (reasons.isEmpty()) reasons.add("Disponible sur le marché camerounais");

        double score = interestScore + proximityScore + urgencyScore + perishabilityScore + freshnessScore + stockScore;
        Map<String, Object> productJson = new LinkedHashMap<>();
        productJson.put("id", product.id());
        productJson.put("name", product.name());
        productJson.put("category", product.category());
        productJson.put("city", product.city());
        productJson.put("price", product.price());
        productJson.put("unit", product.unit());
        productJson.put("stock", product.stock());
        productJson.put("status", product.status());
        productJson.put("harvestDate", product.harvestDate());
        productJson.put("shelfLifeDays", product.shelfLifeDays());
        productJson.put("ownerName", product.ownerName());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("product", productJson);
        result.put("score", Math.round(score * 100) / 100.0);
        result.put("reasons", reasons);
        return result;
    }

    private double geographicScore(java.math.BigDecimal userLat, java.math.BigDecimal userLng,
                                   java.math.BigDecimal productLat, java.math.BigDecimal productLng) {
        if (userLat == null || userLng == null || productLat == null || productLng == null) return 0;
        double distanceKm = haversine(userLat.doubleValue(), userLng.doubleValue(), productLat.doubleValue(), productLng.doubleValue());
        if (distanceKm <= 5) return 20;
        if (distanceKm <= 25) return 14;
        if (distanceKm <= 75) return 8;
        if (distanceKm <= 200) return 3;
        return 0;
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        double r = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private boolean interestMatches(String interest, String category) {
        return switch (interest) {
            case "legumes" -> category.contains("légume") || category.contains("legume");
            case "cereales" -> category.contains("céréale") || category.contains("cereale");
            case "daily-offers", "offres-du-jour" -> category.contains("offre");
            case "responsible", "responsable" -> category.contains("bio") || category.contains("respons");
            default -> false;
        };
    }
}