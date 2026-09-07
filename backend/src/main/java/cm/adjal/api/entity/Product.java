package cm.adjal.api.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record Product(UUID id, String name, String category, String city, BigDecimal price, String unit,
                      BigDecimal stock, String status, LocalDate harvestDate, Integer shelfLifeDays,
                      UUID ownerId, String ownerName, String description, String imageUrl,
                      BigDecimal latitude, BigDecimal longitude) {}