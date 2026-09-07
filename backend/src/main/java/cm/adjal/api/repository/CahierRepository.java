package cm.adjal.api.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;

@Repository
public class CahierRepository {
    private final JdbcTemplate jdbc;

    public CahierRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Review> reviewsForProduct(UUID productId) {
        return jdbc.query("""
            SELECT r.id, r.product_id, r.order_id, r.reviewer_id, a.name AS reviewer_name,
                   r.rating, r.comment, r.status, r.created_at
            FROM reviews r JOIN accounts a ON a.id = r.reviewer_id
            WHERE r.product_id = ? AND r.status = 'published'
            ORDER BY r.created_at DESC
            """, this::mapReview, sqlId(productId));
    }

    public Review createReview(UUID reviewerId, UUID productId, UUID orderId, int rating, String comment) {
        Map<String, Object> order = jdbc.query("""
            SELECT product_id, buyer_id, status FROM orders WHERE id = ?
            """, rs -> rs.next() ? Map.of(
                "productId", UUID.fromString(rs.getString("product_id")),
                "buyerId", UUID.fromString(rs.getString("buyer_id")),
                "status", rs.getString("status")
            ) : null, sqlId(orderId));
        if (order == null) throw new NoSuchElementException("Order not found");
        if (!reviewerId.equals(order.get("buyerId")) || !productId.equals(order.get("productId"))) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN, "You can only review your own completed order");
        }
        if (!"delivered".equals(order.get("status"))) {
            throw new IllegalStateException("A review is available after delivery");
        }
        UUID id = UUID.randomUUID();
        jdbc.update("""
            INSERT INTO reviews(id, product_id, order_id, reviewer_id, rating, comment)
            VALUES (?, ?, ?, ?, ?, ?)
            """, sqlId(id), sqlId(productId), sqlId(orderId), sqlId(reviewerId),
            rating, comment == null ? null : comment.trim());
        return reviewById(id).orElseThrow();
    }

    public List<Review> allReviews() {
        return jdbc.query("""
            SELECT r.id, r.product_id, r.order_id, r.reviewer_id, a.name AS reviewer_name,
                   r.rating, r.comment, r.status, r.created_at
            FROM reviews r JOIN accounts a ON a.id = r.reviewer_id
            ORDER BY r.created_at DESC
            """, this::mapReview);
    }

    public void removeReview(UUID id) {
        if (jdbc.update("UPDATE reviews SET status = 'removed', updated_at = now() WHERE id = ?", sqlId(id)) == 0) {
            throw new NoSuchElementException("Review not found");
        }
    }

    public List<Payment> paymentsFor(UUID accountId, String role) {
        String predicate = "admin".equals(role) ? "1 = 1" : "p.payer_id = ?";
        return jdbc.query("""
            SELECT p.id, p.order_id, p.payer_id, p.amount, p.currency, p.method, p.provider_reference,
                   p.status, p.created_at, p.updated_at, p.paid_at
            FROM payments p
            WHERE %s ORDER BY p.created_at DESC
            """.formatted(predicate), this::mapPayment, "admin".equals(role)
                ? new Object[]{} : new Object[]{sqlId(accountId)});
    }

    public Payment createPayment(UUID payerId, UUID orderId, String method) {
        Map<String, Object> order = jdbc.query("""
            SELECT buyer_id, quantity, unit_price, status FROM orders WHERE id = ?
            """, rs -> rs.next() ? Map.of(
                "buyerId", UUID.fromString(rs.getString("buyer_id")),
                "amount", rs.getBigDecimal("unit_price").multiply(BigDecimal.valueOf(rs.getInt("quantity"))),
                "status", rs.getString("status")
            ) : null, sqlId(orderId));
        if (order == null) throw new NoSuchElementException("Order not found");
        if (!payerId.equals(order.get("buyerId"))) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN, "Only the buyer can pay this order");
        }
        if ("cancelled".equals(order.get("status"))) throw new IllegalStateException("Cancelled orders cannot be paid");
        UUID id = UUID.randomUUID();
        jdbc.update("""
            INSERT INTO payments(id, order_id, payer_id, amount, currency, method, status, paid_at)
            VALUES (?, ?, ?, ?, 'XAF', ?, 'paid', now())
            """, sqlId(id), sqlId(orderId), sqlId(payerId), order.get("amount"),
            method.trim().toUpperCase(Locale.ROOT));
        return paymentById(id).orElseThrow();
    }

    public Payment updatePaymentStatus(UUID id, String status) {
        if (!Set.of("pending", "paid", "failed", "refunded").contains(status)) {
            throw new IllegalArgumentException("Invalid payment status");
        }
        int updated = jdbc.update("""
            UPDATE payments SET status = ?, paid_at = CASE WHEN ? = 'paid' THEN now() ELSE paid_at END,
                   updated_at = now() WHERE id = ?
            """, status, status, sqlId(id));
        if (updated == 0) throw new NoSuchElementException("Payment not found");
        return paymentById(id).orElseThrow();
    }

    public List<MarketPrice> marketPrices(String productName, String city) {
        StringBuilder sql = new StringBuilder("""
            SELECT id, product_name, category, city, region, unit, price, recorded_at
            FROM market_prices WHERE 1 = 1
            """);
        List<Object> args = new ArrayList<>();
        if (productName != null && !productName.isBlank()) {
            sql.append(" AND lower(product_name) LIKE ?");
            args.add("%" + productName.trim().toLowerCase(Locale.ROOT) + "%");
        }
        if (city != null && !city.isBlank()) {
            sql.append(" AND lower(city) = lower(?)");
            args.add(city.trim());
        }
        sql.append(" ORDER BY recorded_at DESC LIMIT 200");
        return jdbc.query(sql.toString(), this::mapMarketPrice, args.toArray());
    }

    public MarketPrice addMarketPrice(UUID recorderId, String productName, String category, String city,
                                      String region, String unit, BigDecimal price) {
        BigDecimal previousPrice = jdbc.query("""
            SELECT price FROM market_prices
            WHERE lower(product_name) = lower(?) AND lower(city) = lower(?)
            ORDER BY recorded_at DESC LIMIT 1
            """, rs -> rs.next() ? rs.getBigDecimal("price") : null, productName, city);
        UUID id = UUID.randomUUID();
        jdbc.update("""
            INSERT INTO market_prices(id, product_name, category, city, region, unit, price, recorded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, sqlId(id), productName.trim(), category, city.trim(), region, unit.trim(), price,
            sqlId(recorderId));
        if (previousPrice != null && previousPrice.signum() > 0) {
            BigDecimal variation = price.subtract(previousPrice)
                .divide(previousPrice, 6, java.math.RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
            if (variation.abs().compareTo(BigDecimal.TEN) >= 0) {
                String direction = variation.signum() > 0 ? "hausse" : "baisse";
                createMarketAlert(null, productName.trim(), city.trim(),
                    "Variation de prix détectée",
                    "Le prix de " + productName.trim() + " a enregistré une " + direction
                        + " de " + variation.abs().setScale(1, java.math.RoundingMode.HALF_UP)
                        + "% à " + city.trim() + ".",
                    variation.setScale(2, java.math.RoundingMode.HALF_UP));
            }
        }
        return marketPriceById(id).orElseThrow();
    }

    public List<MarketAlert> alertsFor(UUID accountId) {
        return jdbc.query("""
            SELECT id, account_id, product_name, city, title, message, variation_percent, active, created_at
            FROM market_alerts
            WHERE active = TRUE AND (account_id IS NULL OR account_id = ?)
            ORDER BY created_at DESC LIMIT 100
            """, this::mapMarketAlert, sqlId(accountId));
    }

    public void createMarketAlert(UUID accountId, String productName, String city,
                                  String title, String message, BigDecimal variationPercent) {
        jdbc.update("""
            INSERT INTO market_alerts(id, account_id, product_name, city, title, message, variation_percent)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, sqlId(UUID.randomUUID()), sqlId(accountId), productName, city, title, message, variationPercent);
    }

    public List<Notification> notifications(UUID accountId) {
        return jdbc.query("""
            SELECT id, account_id, type, title, body, resource_type, resource_id, read_at, created_at
            FROM notifications WHERE account_id = ? ORDER BY created_at DESC LIMIT 100
            """, this::mapNotification, sqlId(accountId));
    }

    public boolean notificationsEnabled(UUID accountId) {
        return jdbc.queryForObject("SELECT notifications_enabled FROM accounts WHERE id = ?", Boolean.class, sqlId(accountId));
    }

    public void updateNotificationsEnabled(UUID accountId, boolean enabled) {
        jdbc.update("UPDATE accounts SET notifications_enabled = ?, updated_at = now() WHERE id = ?", enabled, sqlId(accountId));
    }

    public long unreadNotificationCount(UUID accountId) {
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM notifications WHERE account_id = ? AND read_at IS NULL",
            Long.class, sqlId(accountId));
        return count == null ? 0L : count;
    }

    public Notification createNotification(UUID accountId, String type, String title, String body,
                                           String resourceType, UUID resourceId) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
            INSERT INTO notifications(id, account_id, type, title, body, resource_type, resource_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, sqlId(id), sqlId(accountId), type, title, body, resourceType, sqlId(resourceId));
        return notificationById(id).orElseThrow();
    }

    public void markNotificationRead(UUID accountId, UUID notificationId) {
        if (jdbc.update("UPDATE notifications SET read_at = now() WHERE id = ? AND account_id = ?",
            sqlId(notificationId), sqlId(accountId)) == 0) {
            throw new NoSuchElementException("Notification not found");
        }
    }

    public List<OrderStatus> orderHistory(UUID accountId, String role, UUID orderId) {
        String predicate = "farmer".equals(role)
            ? "p.owner_id = ?" : "o.buyer_id = ?";
        return jdbc.query("""
            SELECT h.id, h.order_id, h.status, h.changed_by, h.created_at
            FROM order_status_history h
            JOIN orders o ON o.id = h.order_id
            JOIN products p ON p.id = o.product_id
            WHERE h.order_id = ? AND %s ORDER BY h.created_at ASC
            """.formatted(predicate), this::mapOrderStatus, sqlId(orderId), sqlId(accountId));
    }

    private Optional<Review> reviewById(UUID id) {
        return jdbc.query("""
            SELECT r.id, r.product_id, r.order_id, r.reviewer_id, a.name AS reviewer_name,
                   r.rating, r.comment, r.status, r.created_at
            FROM reviews r JOIN accounts a ON a.id = r.reviewer_id WHERE r.id = ?
            """, this::mapReview, sqlId(id)).stream().findFirst();
    }

    private Optional<Payment> paymentById(UUID id) {
        return jdbc.query("""
            SELECT id, order_id, payer_id, amount, currency, method, provider_reference,
                   status, created_at, updated_at, paid_at
            FROM payments WHERE id = ?
            """, this::mapPayment, sqlId(id)).stream().findFirst();
    }

    private Optional<MarketPrice> marketPriceById(UUID id) {
        return jdbc.query("""
            SELECT id, product_name, category, city, region, unit, price, recorded_at
            FROM market_prices WHERE id = ?
            """, this::mapMarketPrice, sqlId(id)).stream().findFirst();
    }

    private Optional<Notification> notificationById(UUID id) {
        return jdbc.query("""
            SELECT id, account_id, type, title, body, resource_type, resource_id, read_at, created_at
            FROM notifications WHERE id = ?
            """, this::mapNotification, sqlId(id)).stream().findFirst();
    }

    private static String sqlId(UUID id) {
        return id == null ? null : id.toString();
    }

    private Review mapReview(ResultSet rs, int row) throws SQLException {
        return new Review(UUID.fromString(rs.getString("id")), UUID.fromString(rs.getString("product_id")),
            UUID.fromString(rs.getString("order_id")), UUID.fromString(rs.getString("reviewer_id")),
            rs.getString("reviewer_name"), rs.getInt("rating"), rs.getString("comment"),
            rs.getString("status"), instant(rs, "created_at"));
    }

    private Payment mapPayment(ResultSet rs, int row) throws SQLException {
        return new Payment(UUID.fromString(rs.getString("id")), UUID.fromString(rs.getString("order_id")),
            UUID.fromString(rs.getString("payer_id")), rs.getBigDecimal("amount"), rs.getString("currency"),
            rs.getString("method"), rs.getString("provider_reference"), rs.getString("status"),
            instant(rs, "created_at"), instant(rs, "updated_at"), nullableInstant(rs, "paid_at"));
    }

    private MarketPrice mapMarketPrice(ResultSet rs, int row) throws SQLException {
        return new MarketPrice(UUID.fromString(rs.getString("id")), rs.getString("product_name"),
            rs.getString("category"), rs.getString("city"), rs.getString("region"),
            rs.getString("unit"), rs.getBigDecimal("price"), instant(rs, "recorded_at"));
    }

    private MarketAlert mapMarketAlert(ResultSet rs, int row) throws SQLException {
        String account = rs.getString("account_id");
        return new MarketAlert(UUID.fromString(rs.getString("id")),
            account == null ? null : UUID.fromString(account), rs.getString("product_name"),
            rs.getString("city"), rs.getString("title"), rs.getString("message"),
            rs.getBigDecimal("variation_percent"), rs.getBoolean("active"), instant(rs, "created_at"));
    }

    private Notification mapNotification(ResultSet rs, int row) throws SQLException {
        String resource = rs.getString("resource_id");
        return new Notification(UUID.fromString(rs.getString("id")), UUID.fromString(rs.getString("account_id")),
            rs.getString("type"), rs.getString("title"), rs.getString("body"),
            rs.getString("resource_type"), resource == null ? null : UUID.fromString(resource),
            nullableInstant(rs, "read_at"), instant(rs, "created_at"));
    }

    private OrderStatus mapOrderStatus(ResultSet rs, int row) throws SQLException {
        return new OrderStatus(UUID.fromString(rs.getString("id")), UUID.fromString(rs.getString("order_id")),
            rs.getString("status"), UUID.fromString(rs.getString("changed_by")), instant(rs, "created_at"));
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        return rs.getTimestamp(column).toInstant();
    }

    private static Instant nullableInstant(ResultSet rs, String column) throws SQLException {
        Timestamp timestamp = rs.getTimestamp(column);
        return timestamp == null ? null : timestamp.toInstant();
    }

    public record Review(UUID id, UUID productId, UUID orderId, UUID reviewerId, String reviewerName,
                         int rating, String comment, String status, Instant createdAt) {}
    public record Payment(UUID id, UUID orderId, UUID payerId, BigDecimal amount, String currency,
                          String method, String providerReference, String status, Instant createdAt,
                          Instant updatedAt, Instant paidAt) {}
    public record MarketPrice(UUID id, String productName, String category, String city, String region,
                              String unit, BigDecimal price, Instant recordedAt) {}
    public record MarketAlert(UUID id, UUID accountId, String productName, String city, String title,
                              String message, BigDecimal variationPercent, boolean active, Instant createdAt) {}
    public record Notification(UUID id, UUID accountId, String type, String title, String body,
                               String resourceType, UUID resourceId, Instant readAt, Instant createdAt) {}
    public record OrderStatus(UUID id, UUID orderId, String status, UUID changedBy, Instant createdAt) {}
}