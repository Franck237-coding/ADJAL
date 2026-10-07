package cm.adjal.api.repository;

import cm.adjal.api.security.AuthenticatedUser;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Repository
public class MarketplaceRepository {
    private final JdbcTemplate jdbc;
    private final NamedParameterJdbcTemplate namedJdbc;

    public MarketplaceRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
        this.namedJdbc = new NamedParameterJdbcTemplate(jdbc);
    }

    public Optional<AuthenticatedUser> findByEmail(String email) {
        return queryUser("SELECT * FROM accounts WHERE lower(email) = lower(?) LIMIT 1", email);
    }

    public Optional<AuthenticatedUser> findById(UUID id) {
        return queryUser("SELECT * FROM accounts WHERE id = ? LIMIT 1", sqlId(id));
    }

    public List<AuthenticatedUser> searchAccounts(UUID excludeId, String search) {
        String pattern = "%" + (search == null ? "" : search.trim().toLowerCase(Locale.ROOT)) + "%";
        return jdbc.query("""
            SELECT * FROM accounts
            WHERE id <> ? AND status = 'active'
              AND (lower(name) LIKE ? OR lower(email) LIKE ?)
            ORDER BY name LIMIT 30
            """, (rs, row) -> mapUser(rs), sqlId(excludeId), pattern, pattern);
    }

    public Optional<AuthenticatedUser> findSession(String tokenHash) {
        return queryUser("""
            SELECT a.* FROM sessions s
            JOIN accounts a ON a.id = s.account_id
            WHERE s.token_hash = ? AND s.expires_at > now()
            LIMIT 1
            """, tokenHash);
    }

    public Optional<Credentials> findCredentials(String email) {
        List<Credentials> rows = jdbc.query("""
            SELECT id, name, email, phone, password_hash, password_salt, role, city,
                   country, status, avatar_url, interests
            FROM accounts
            WHERE lower(email) = lower(?) OR phone = ?
            LIMIT 1
            """, (rs, row) -> new Credentials(
            UUID.fromString(rs.getString("id")), rs.getString("name"), rs.getString("email"),
            rs.getString("phone"), rs.getString("password_hash"), rs.getString("password_salt"),
            rs.getString("role"), rs.getString("city"), rs.getString("country"),
            rs.getString("status"), rs.getString("avatar_url"), readArray(rs.getString("interests"))
        ), email, email);
        return rows.stream().findFirst();
    }

    public AuthenticatedUser insertAccount(String name, String email, String passwordHash, String passwordSalt,
                                           String phone, String city, String role) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
            INSERT INTO accounts(id, name, email, phone, password_hash, password_salt, role, city, country, status, interests)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CM', 'active', '')
            """, sqlId(id), name, email.toLowerCase(Locale.ROOT), phone, passwordHash, passwordSalt, role, city);
        return findById(id).orElseThrow();
    }

    public void createSession(String tokenHash, UUID accountId, Instant expiresAt) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO sessions(id, token_hash, account_id, expires_at) VALUES (?, ?, ?, ?)",
            sqlId(id), tokenHash, sqlId(accountId), java.sql.Timestamp.from(expiresAt));
    }

    public void deleteSession(String tokenHash) {
        jdbc.update("DELETE FROM sessions WHERE token_hash = ?", tokenHash);
    }

    public void deleteAllSessions(UUID accountId) {
        jdbc.update("DELETE FROM sessions WHERE account_id = ?", sqlId(accountId));
    }

    public void createResetToken(UUID accountId, String tokenHash, Instant expiresAt) {
        jdbc.update("DELETE FROM password_reset_tokens WHERE account_id = ?", sqlId(accountId));
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO password_reset_tokens(id, token_hash, account_id, expires_at) VALUES (?, ?, ?, ?)",
            sqlId(id), tokenHash, sqlId(accountId), java.sql.Timestamp.from(expiresAt));
    }

    public Optional<ResetToken> findValidResetToken(String tokenHash) {
        return jdbc.query("""
            SELECT id, account_id, expires_at FROM password_reset_tokens
            WHERE token_hash = ? AND used_at IS NULL AND expires_at > now()
            LIMIT 1
            """, (rs, row) -> new ResetToken(
            UUID.fromString(rs.getString("id")),
            UUID.fromString(rs.getString("account_id")),
            rs.getTimestamp("expires_at").toInstant()
        ), tokenHash).stream().findFirst();
    }

    public void deleteResetToken(String tokenHash) {
        jdbc.update("DELETE FROM password_reset_tokens WHERE token_hash = ?", tokenHash);
    }

    public boolean consumeResetToken(UUID id, UUID accountId, String passwordHash, String passwordSalt) {
        return jdbc.update("""
            UPDATE password_reset_tokens SET used_at = now()
            WHERE id = ? AND account_id = ? AND used_at IS NULL AND expires_at > now()
            """, sqlId(id), sqlId(accountId)) == 1
            && jdbc.update("""
                UPDATE accounts SET password_hash = ?, password_salt = ?, updated_at = now()
                WHERE id = ?
            """, passwordHash, passwordSalt, sqlId(accountId)) == 1;
    }

    public List<Category> activeCategories() {
        return jdbc.query("""
            SELECT id, name, slug, image_url, active, created_at, updated_at
            FROM categories WHERE active = true ORDER BY name
            """, this::mapCategory);
    }

    public List<Category> allCategories() {
        return jdbc.query("""
            SELECT id, name, slug, image_url, active, created_at, updated_at
            FROM categories ORDER BY name
            """, this::mapCategory);
    }

    public List<Product> saleableProducts() {
        return jdbc.query("""
            SELECT p.id, p.name, p.category, p.city, p.price, p.unit, p.stock, p.status,
                   p.harvest_date, p.shelf_life_days, p.owner_id, a.name AS owner_name, a.avatar_url AS owner_avatar_url,
                   p.description, p.image_url, p.latitude, p.longitude
            FROM products p JOIN accounts a ON a.id = p.owner_id
            WHERE p.status = 'published'
              AND p.stock > 0
              AND (p.shelf_life_days IS NULL OR
                   DATE_ADD(p.harvest_date, INTERVAL p.shelf_life_days DAY) >= CURRENT_DATE)
            ORDER BY p.created_at DESC
            """, this::mapProduct);
    }

    public List<Product> productsForFarmer(UUID ownerId) {
        return jdbc.query("""
            SELECT p.id, p.name, p.category, p.city, p.price, p.unit, p.stock, p.status,
                   p.harvest_date, p.shelf_life_days, p.owner_id, a.name AS owner_name, a.avatar_url AS owner_avatar_url,
                   p.description, p.image_url, p.latitude, p.longitude
            FROM products p JOIN accounts a ON a.id = p.owner_id
            WHERE p.owner_id = ? ORDER BY p.created_at DESC
            """, this::mapProduct, sqlId(ownerId));
    }

    public Optional<Product> findProduct(UUID id) {
        return jdbc.query("""
            SELECT p.id, p.name, p.category, p.city, p.price, p.unit, p.stock, p.status,
                   p.harvest_date, p.shelf_life_days, p.owner_id, a.name AS owner_name, a.avatar_url AS owner_avatar_url,
                   p.description, p.image_url, p.latitude, p.longitude
            FROM products p JOIN accounts a ON a.id = p.owner_id WHERE p.id = ?
            """, this::mapProduct, sqlId(id)).stream().findFirst();
    }

    public List<Product> searchProducts(String query, String category, String city,
                                        BigDecimal minPrice, BigDecimal maxPrice) {
        StringBuilder sql = new StringBuilder("""
            SELECT p.id, p.name, p.category, p.city, p.price, p.unit, p.stock, p.status,
                   p.harvest_date, p.shelf_life_days, p.owner_id, a.name AS owner_name, a.avatar_url AS owner_avatar_url,
                   p.description, p.image_url, p.latitude, p.longitude
            FROM products p JOIN accounts a ON a.id = p.owner_id
            WHERE p.status = 'published' AND p.stock > 0
              AND (p.shelf_life_days IS NULL OR
                   DATE_ADD(p.harvest_date, INTERVAL p.shelf_life_days DAY) >= CURRENT_DATE)
            """);
        List<Object> args = new ArrayList<>();
        if (query != null && !query.isBlank()) {
            sql.append(" AND (lower(p.name) LIKE ? OR lower(COALESCE(p.description, '')) LIKE ?)");
            String pattern = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
            args.add(pattern);
            args.add(pattern);
        }
        if (category != null && !category.isBlank()) {
            sql.append(" AND lower(p.category) = lower(?)");
            args.add(category.trim());
        }
        if (city != null && !city.isBlank()) {
            sql.append(" AND lower(p.city) = lower(?)");
            args.add(city.trim());
        }
        if (minPrice != null) {
            sql.append(" AND p.price >= ?");
            args.add(minPrice);
        }
        if (maxPrice != null) {
            sql.append(" AND p.price <= ?");
            args.add(maxPrice);
        }
        sql.append(" ORDER BY p.created_at DESC LIMIT 100");
        return jdbc.query(sql.toString(), this::mapProduct, args.toArray());
    }

    public Product insertProduct(Map<String, Object> body, UUID ownerId) {
        UUID id = UUID.randomUUID();
        Object requestedImage = body.get("imageUrl");
        String imageUrl = requestedImage == null || requestedImage.toString().isBlank()
            ? categoryImage(body.get("category").toString()).orElse(null)
            : requestedImage.toString();
        jdbc.update("""
            INSERT INTO products(id, name, category, city, country, price, unit, stock, status, harvest_date, shelf_life_days,
                                 owner_id, description, image_url, latitude, longitude)
            VALUES (?, ?, ?, ?, 'CM', ?, ?, ?, 'published', ?, ?, ?, ?, ?, ?, ?)
            """, sqlId(id), body.get("name"), body.get("category"), body.get("city"),
            new BigDecimal(body.get("price").toString()), body.get("unit"),
            new BigDecimal(body.get("stock").toString()), LocalDate.parse(body.get("harvestDate").toString()),
            body.get("shelfLifeDays") == null ? null : Integer.valueOf(body.get("shelfLifeDays").toString()), sqlId(ownerId),
            body.getOrDefault("description", body.get("name")),
            imageUrl, body.get("latitude"), body.get("longitude"));
        return findProduct(id).orElseThrow();
    }

    public Product updateProduct(UUID ownerId, UUID productId, Map<String, Object> body) {
        Product current = findProduct(productId).orElseThrow(() -> new NoSuchElementException("Product not found"));
        if (!current.ownerId().equals(ownerId)) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN, "You can only edit your own products");
        }
        List<String> updates = new ArrayList<>();
        List<Object> values = new ArrayList<>();
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("name", "name");
        fields.put("category", "category");
        fields.put("city", "city");
        fields.put("price", "price");
        fields.put("unit", "unit");
        fields.put("stock", "stock");
        fields.put("harvestDate", "harvest_date");
        fields.put("shelfLifeDays", "shelf_life_days");
        fields.put("description", "description");
        fields.put("imageUrl", "image_url");
        fields.put("latitude", "latitude");
        fields.put("longitude", "longitude");
        for (var entry : fields.entrySet()) {
            if (!body.containsKey(entry.getKey()) || body.get(entry.getKey()) == null) continue;
            updates.add(entry.getValue() + " = ?");
            values.add(entry.getValue().equals("harvest_date")
                ? LocalDate.parse(body.get(entry.getKey()).toString())
                : body.get(entry.getKey()));
        }
        if (!updates.isEmpty()) {
            updates.add("updated_at = now()");
            values.add(sqlId(productId));
            jdbc.update("UPDATE products SET " + String.join(", ", updates) + " WHERE id = ?", values.toArray());
        }
        return findProduct(productId).orElseThrow();
    }

    public void deleteProduct(UUID ownerId, UUID productId) {
        Product product = findProduct(productId).orElseThrow(() -> new NoSuchElementException("Product not found"));
        if (!product.ownerId().equals(ownerId)) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN, "You can only remove your own products");
        }
        jdbc.update("UPDATE products SET status = 'removed', stock = 0, updated_at = now() WHERE id = ?", sqlId(productId));
    }

    public List<Order> ordersFor(AuthenticatedUser user) {
        String predicate = "farmer".equals(user.role()) ? "p.owner_id = ?" : "o.buyer_id = ?";
        return jdbc.query("""
            SELECT o.id, o.product_id, p.name AS product_name, o.buyer_id, seller.id AS seller_id, o.quantity,
                   o.unit_price, o.status, o.city, o.created_at,
                   seller.name AS seller_name, seller.city AS seller_city, seller.phone AS seller_phone,
                   seller.latitude AS seller_latitude, seller.longitude AS seller_longitude,
                   buyer.name AS buyer_name, buyer.city AS buyer_city, buyer.phone AS buyer_phone,
                   p.image_url AS product_image_url, p.category AS product_category, p.unit AS product_unit,
                   seller.avatar_url AS seller_avatar_url, buyer.avatar_url AS buyer_avatar_url
             FROM orders o JOIN products p ON p.id = o.product_id
             JOIN accounts seller ON seller.id = p.owner_id
             JOIN accounts buyer ON buyer.id = o.buyer_id
             WHERE %s ORDER BY o.created_at
            """.formatted(predicate), this::mapOrder, sqlId(user.id()));
    }

    public List<Order> allOrders(String status) {
        String normalizedStatus = status == null || status.isBlank() ? "all" : status;
        if (!Set.of("all", "pending", "confirmed", "delivered", "cancelled").contains(normalizedStatus)) normalizedStatus = "all";
        String predicate = "all".equals(normalizedStatus) ? "" : " WHERE o.status = ?";
        String query = """
            SELECT o.id, o.product_id, p.name AS product_name, o.buyer_id, seller.id AS seller_id, o.quantity,
                   o.unit_price, o.status, o.city, o.created_at,
                   seller.name AS seller_name, seller.city AS seller_city, seller.phone AS seller_phone,
                   seller.latitude AS seller_latitude, seller.longitude AS seller_longitude,
                   buyer.name AS buyer_name, buyer.city AS buyer_city, buyer.phone AS buyer_phone,
                   p.image_url AS product_image_url, p.category AS product_category, p.unit AS product_unit,
                   seller.avatar_url AS seller_avatar_url, buyer.avatar_url AS buyer_avatar_url
             FROM orders o JOIN products p ON p.id = o.product_id
             JOIN accounts seller ON seller.id = p.owner_id
             JOIN accounts buyer ON buyer.id = o.buyer_id
             """ + predicate + " ORDER BY o.created_at DESC";
        return "all".equals(normalizedStatus)
            ? jdbc.query(query, this::mapOrder)
            : jdbc.query(query, this::mapOrder, normalizedStatus);
    }

    @Transactional
    public Order createOrder(UUID buyerId, UUID productId, int quantity, String city) {
        Product product = jdbc.query("""
            SELECT p.id, p.name, p.category, p.city, p.price, p.unit, p.stock, p.status,
                   p.harvest_date, p.shelf_life_days, p.owner_id, a.name AS owner_name, a.avatar_url AS owner_avatar_url,
                   p.description, p.image_url, p.latitude, p.longitude
            FROM products p JOIN accounts a ON a.id = p.owner_id
            WHERE p.id = ? FOR UPDATE
            """, this::mapProduct, sqlId(productId)).stream().findFirst()
            .orElseThrow(() -> new NoSuchElementException("Product not found"));
        if (!"published".equals(product.status())) throw new IllegalStateException("Product is not available for purchase");
        if (product.harvestDate() != null && product.shelfLifeDays() != null
            && product.harvestDate().plusDays(product.shelfLifeDays()).isBefore(LocalDate.now())) {
            throw new IllegalStateException("Product is not available for purchase");
        }
        if (product.stock().compareTo(BigDecimal.valueOf(quantity)) < 0) {
            throw new IllegalArgumentException("Insufficient stock for the requested quantity");
        }
        jdbc.update("UPDATE products SET stock = stock - ?, updated_at = now() WHERE id = ?", quantity, sqlId(productId));
        UUID id = UUID.randomUUID();
        jdbc.update("""
            INSERT INTO orders(id, buyer_id, product_id, quantity, unit_price, status, city, country)
            VALUES (?, ?, ?, ?, ?, 'pending', ?, 'CM')
            """, sqlId(id), sqlId(buyerId), sqlId(productId), quantity, product.price(), city);
        jdbc.update("""
            INSERT INTO order_status_history(id, order_id, status, changed_by)
            VALUES (?, ?, 'pending', ?)
            """, sqlId(UUID.randomUUID()), sqlId(id), sqlId(buyerId));
        return orderById(id).orElseThrow();
    }

    @Transactional
    public List<Order> checkout(UUID buyerId, List<CheckoutLine> lines, String city) {
        Map<UUID, Integer> wanted = new LinkedHashMap<>();
        for (CheckoutLine line : lines) wanted.merge(line.productId(), line.quantity(), Integer::sum);
        for (var entry : wanted.entrySet()) {
            Product product = jdbc.query("""
                SELECT p.id, p.name, p.category, p.city, p.price, p.unit, p.stock, p.status,
                       p.harvest_date, p.shelf_life_days, p.owner_id, a.name AS owner_name, a.avatar_url AS owner_avatar_url,
                       p.description, p.image_url, p.latitude, p.longitude
                FROM products p JOIN accounts a ON a.id = p.owner_id WHERE p.id = ? FOR UPDATE
                """, this::mapProduct, sqlId(entry.getKey())).stream().findFirst()
                .orElseThrow(() -> new NoSuchElementException("Product not found"));
            if (!"published".equals(product.status())) throw new IllegalStateException("Product is not available for purchase");
            if (product.stock().compareTo(BigDecimal.valueOf(entry.getValue())) < 0)
                throw new IllegalArgumentException("Insufficient stock for the requested quantity");
        }
        List<Order> orders = new ArrayList<>();
        for (CheckoutLine line : lines) orders.add(createOrder(buyerId, line.productId(), line.quantity(), city));
        return orders;
    }

    public Optional<Order> orderById(UUID id) {
        return jdbc.query("""
            SELECT o.id, o.product_id, p.name AS product_name, o.buyer_id, seller.id AS seller_id, o.quantity,
                   o.unit_price, o.status, o.city, o.created_at,
                   seller.name AS seller_name, seller.city AS seller_city, seller.phone AS seller_phone,
                   seller.latitude AS seller_latitude, seller.longitude AS seller_longitude,
                   buyer.name AS buyer_name, buyer.city AS buyer_city, buyer.phone AS buyer_phone,
                   p.image_url AS product_image_url, p.category AS product_category, p.unit AS product_unit,
                   seller.avatar_url AS seller_avatar_url, buyer.avatar_url AS buyer_avatar_url
             FROM orders o JOIN products p ON p.id = o.product_id
             JOIN accounts seller ON seller.id = p.owner_id
             JOIN accounts buyer ON buyer.id = o.buyer_id WHERE o.id = ?
            """, this::mapOrder, sqlId(id)).stream().findFirst();
    }

    @Transactional
    public Order updateOrderStatus(UUID accountId, String role, UUID orderId, String nextStatus) {
        Order order = orderById(orderId).orElseThrow(() -> new NoSuchElementException("Order not found"));
        Product product = findProduct(order.productId()).orElseThrow();
        boolean buyer = "buyer".equals(role) && order.buyerId().equals(accountId);
        boolean farmer = "farmer".equals(role) && product.ownerId().equals(accountId);
        if (!buyer && !farmer) throw new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.FORBIDDEN, "You cannot change this order");
        if ("cancelled".equals(nextStatus) && ((!buyer && !farmer) || !"pending".equals(order.status()))) throw new IllegalStateException("Invalid order status transition");
        if ("confirmed".equals(nextStatus) && (!farmer || !"pending".equals(order.status()))) throw new IllegalStateException("Invalid order status transition");
        if ("delivered".equals(nextStatus) && (!farmer || !"confirmed".equals(order.status()))) throw new IllegalStateException("Invalid order status transition");
        if ("cancelled".equals(nextStatus)) jdbc.update("UPDATE products SET stock = stock + ?, updated_at = now() WHERE id = ?", order.quantity(), sqlId(order.productId()));
        jdbc.update("UPDATE orders SET status = ?, updated_at = now() WHERE id = ?", nextStatus, sqlId(orderId));
        jdbc.update("""
            INSERT INTO order_status_history(id, order_id, status, changed_by)
            VALUES (?, ?, ?, ?)
            """, sqlId(UUID.randomUUID()), sqlId(orderId), nextStatus, sqlId(accountId));
        return orderById(orderId).orElseThrow();
    }

    @Transactional
    public Order updateOrderStatusAsAdmin(UUID adminId, UUID orderId, String nextStatus) {
        if (!Set.of("pending", "confirmed", "delivered", "cancelled").contains(nextStatus)) {
            throw new IllegalArgumentException("Invalid order status");
        }
        Order order = orderById(orderId).orElseThrow(() -> new NoSuchElementException("Order not found"));
        if (order.status().equals(nextStatus)) return order;
        if ("cancelled".equals(nextStatus) && !"cancelled".equals(order.status())) {
            jdbc.update("UPDATE products SET stock = stock + ?, updated_at = now() WHERE id = ?", order.quantity(), sqlId(order.productId()));
        }
        jdbc.update("UPDATE orders SET status = ?, updated_at = now() WHERE id = ?", nextStatus, sqlId(orderId));
        jdbc.update("""
            INSERT INTO order_status_history(id, order_id, status, changed_by)
            VALUES (?, ?, ?, ?)
            """, sqlId(UUID.randomUUID()), sqlId(orderId), nextStatus, sqlId(adminId));
        return orderById(orderId).orElseThrow();
    }

    public UUID ownerIdForProduct(UUID productId) {
        String ownerId = jdbc.queryForObject("SELECT owner_id FROM products WHERE id = ?", String.class, sqlId(productId));
        return UUID.fromString(ownerId);
    }

    public AdminSummary adminSummary() {
        return new AdminSummary(
            jdbc.queryForObject("SELECT count(*) FROM accounts", Long.class),
            jdbc.queryForObject("SELECT count(*) FROM products", Long.class),
            jdbc.queryForObject("SELECT count(*) FROM orders", Long.class),
            jdbc.queryForObject("SELECT count(*) FROM products WHERE status = 'pending'", Long.class),
            jdbc.queryForObject("SELECT count(*) FROM reports WHERE status = 'pending'", Long.class)
        );
    }

    public boolean isFarmer(UUID id) {
        return jdbc.queryForObject("SELECT count(*) FROM accounts WHERE id = ? AND role = 'farmer'", Integer.class, sqlId(id)) > 0;
    }
    public boolean hasPendingReport(UUID reporterId, UUID farmerId) {
        return jdbc.queryForObject("SELECT count(*) FROM reports WHERE reporter_id = ? AND farmer_id = ? AND status = 'pending'", Integer.class, sqlId(reporterId), sqlId(farmerId)) > 0;
    }
    public Report insertReport(UUID reporterId, UUID farmerId, String reason, String details) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO reports(id, reporter_id, farmer_id, reason, details) VALUES (?, ?, ?, ?, ?)", sqlId(id), sqlId(reporterId), sqlId(farmerId), reason, details);
        return findReport(id).orElseThrow();
    }
    public List<Report> reportsForReporter(UUID reporterId) { return reportsQuery("WHERE r.reporter_id = ?", sqlId(reporterId)); }
    public List<Report> reportsByStatus(String status) {
        if (!Set.of("pending", "dismissed", "warned", "banned").contains(status)) status = "pending";
        return reportsQuery("WHERE r.status = ?", status);
    }
    public Optional<Report> findReport(UUID id) { return reportsQuery("WHERE r.id = ?", sqlId(id)).stream().findFirst(); }
    public Report moderateReport(UUID id, UUID moderatorId, String status, String resolution) {
        jdbc.update("UPDATE reports SET status = ?, resolution = ?, moderator_id = ?, updated_at = now() WHERE id = ?", status, resolution, sqlId(moderatorId), sqlId(id));
        return findReport(id).orElseThrow();
    }
    private List<Report> reportsQuery(String predicate, Object... args) {
        return jdbc.query("""
            SELECT r.id, r.reason, r.details, r.status, r.resolution, r.created_at,
                   reporter.name AS reporter_name, reporter.email AS reporter_email,
                   r.farmer_id, farmer.name AS farmer_name, farmer.email AS farmer_email, farmer.status AS farmer_status
            FROM reports r JOIN accounts reporter ON reporter.id = r.reporter_id
            LEFT JOIN accounts farmer ON farmer.id = r.farmer_id
            """ + predicate + " ORDER BY r.created_at DESC", (rs, row) -> new Report(
            UUID.fromString(rs.getString("id")), rs.getString("reason"), rs.getString("details"), rs.getString("status"),
            rs.getString("resolution"), rs.getTimestamp("created_at").toInstant(), rs.getString("reporter_name"),
            rs.getString("reporter_email"), UUID.fromString(rs.getString("farmer_id")), rs.getString("farmer_name"),
            rs.getString("farmer_email"), rs.getString("farmer_status")), args);
    }

    public List<AuthenticatedUser> allAccounts() {
        return jdbc.query("SELECT * FROM accounts ORDER BY created_at", (rs, row) -> mapUser(rs));
    }

    public AuthenticatedUser updateAccountStatus(UUID id, String status) {
        AuthenticatedUser target = findById(id).orElseThrow(() -> new NoSuchElementException("User not found"));
        if ("admin".equals(target.role()) && "suspended".equals(status))
            throw new IllegalStateException("Administrator accounts cannot be suspended here");
        jdbc.update("UPDATE accounts SET status = ?, updated_at = now() WHERE id = ?", status, sqlId(id));
        return findById(id).orElseThrow();
    }

    public AuthenticatedUser updateAccountRole(UUID id, String role) {
        if (!Set.of("buyer", "farmer", "admin").contains(role)) {
            throw new IllegalArgumentException("Invalid account role");
        }
        AuthenticatedUser target = findById(id).orElseThrow(() -> new NoSuchElementException("User not found"));
        if ("admin".equals(target.role()) && !"admin".equals(role)
            && jdbc.queryForObject("SELECT count(*) FROM accounts WHERE role = 'admin' AND status = 'active'", Long.class) <= 1) {
            throw new IllegalStateException("The last active administrator cannot be demoted");
        }
        jdbc.update("UPDATE accounts SET role = ?, updated_at = now() WHERE id = ?", role, sqlId(id));
        return findById(id).orElseThrow();
    }

    public List<Product> allProducts() {
        return jdbc.query("""
            SELECT p.id, p.name, p.category, p.city, p.price, p.unit, p.stock, p.status,
                   p.harvest_date, p.shelf_life_days, p.owner_id, a.name AS owner_name, a.avatar_url AS owner_avatar_url,
                   p.description, p.image_url, p.latitude, p.longitude
            FROM products p JOIN accounts a ON a.id = p.owner_id ORDER BY p.created_at
            """, this::mapProduct);
    }

    public Product moderateProduct(UUID id, String status) {
        if ("published".equals(status) && findProduct(id).map(product -> "published".equals(product.status())).orElse(false)) {
            return findProduct(id).orElseThrow(() -> new NoSuchElementException("Product not found"));
        }
        jdbc.update("UPDATE products SET status = ?, updated_at = now() WHERE id = ?", status, sqlId(id));
        return findProduct(id).orElseThrow(() -> new NoSuchElementException("Product not found"));
    }

    public Category insertCategory(String name, String slug, boolean active, String imageUrl) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO categories(id, name, slug, image_url, active) VALUES (?, ?, ?, ?, ?)",
            sqlId(id), name, slug, imageUrl, active);
        return jdbc.query("SELECT * FROM categories WHERE id = ?", this::mapCategory, sqlId(id)).stream().findFirst().orElseThrow();
    }

    public Category updateCategory(UUID id, Map<String, Object> body) {
        if (body.containsKey("name")) jdbc.update("UPDATE categories SET name = ?, updated_at = now() WHERE id = ?", body.get("name"), sqlId(id));
        if (body.containsKey("slug")) jdbc.update("UPDATE categories SET slug = ?, updated_at = now() WHERE id = ?", body.get("slug"), sqlId(id));
        if (body.containsKey("active")) jdbc.update("UPDATE categories SET active = ?, updated_at = now() WHERE id = ?", body.get("active"), sqlId(id));
        if (body.containsKey("imageUrl")) jdbc.update("UPDATE categories SET image_url = ?, updated_at = now() WHERE id = ?", body.get("imageUrl"), sqlId(id));
        return jdbc.query("SELECT * FROM categories WHERE id = ?", this::mapCategory, sqlId(id)).stream().findFirst()
            .orElseThrow(() -> new NoSuchElementException("Category not found"));
    }

    public void deleteCategory(UUID id) {
        try {
            if (jdbc.update("DELETE FROM categories WHERE id = ?", sqlId(id)) == 0) throw new NoSuchElementException("Category not found");
        } catch (org.springframework.dao.DataIntegrityViolationException exception) {
            throw new IllegalStateException("Category is referenced by products");
        }
    }

    public void recordInteraction(UUID accountId, UUID productId, String type) {
        jdbc.update("INSERT INTO interactions(account_id, product_id, type) VALUES (?, ?, ?)",
            sqlId(accountId), sqlId(productId), type);
    }

    public List<String> interactionProductIds(UUID accountId) {
        return jdbc.queryForList("SELECT DISTINCT product_id FROM interactions WHERE account_id = ?",
            String.class, sqlId(accountId));
    }

    public Optional<AuthenticatedUser> updateProfile(UUID id, Map<String, Object> body) {
        List<String> updates = new ArrayList<>();
        List<Object> values = new ArrayList<>();
        for (String field : List.of("name", "phone", "city", "avatar_url", "latitude", "longitude")) {
            String inputName = "avatar_url".equals(field) ? "avatarUrl" : field;
            if (body.containsKey(inputName)) {
                updates.add(field + " = ?");
                values.add(body.get(inputName));
            }
        }
        if (!updates.isEmpty()) {
            updates.add("updated_at = now()");
            values.add(sqlId(id));
            jdbc.update("UPDATE accounts SET " + String.join(", ", updates) + " WHERE id = ?", values.toArray());
        }
        return findById(id);
    }

    @Transactional
    public void deleteAccount(UUID id) {
        deleteAllSessions(id);
        jdbc.update("DELETE FROM accounts WHERE id = ?", sqlId(id));
    }

    public List<String> saveInterests(UUID id, List<String> interests) {
        if (interests == null || interests.size() < 1 || interests.size() > 3) {
            throw new IllegalArgumentException("Interests must contain between 1 and 3 values");
        }
        String serialized = String.join(",", interests);
        jdbc.update("""
            UPDATE accounts SET interests = ?, updated_at = now() WHERE id = ?
            """, serialized, sqlId(id));
        return interests;
    }

    public List<Conversation> conversations(UUID accountId) {
        return jdbc.query("""
            SELECT c.id, c.participant_one_id, c.participant_two_id, c.created_at, c.updated_at,
                   CASE WHEN c.participant_one_id = ? THEN a2.name ELSE a1.name END AS other_name,
                   CASE WHEN c.participant_one_id = ? THEN c.participant_two_id ELSE c.participant_one_id END AS other_id,
                   CASE WHEN c.participant_one_id = ? THEN a2.avatar_url ELSE a1.avatar_url END AS other_avatar_url,
                   COALESCE(unread.unread_count, 0) AS unread_count
            FROM conversations c JOIN accounts a1 ON a1.id = c.participant_one_id
            JOIN accounts a2 ON a2.id = c.participant_two_id
            LEFT JOIN (
                SELECT conversation_id, COUNT(*) AS unread_count
                FROM messages
                WHERE read_at IS NULL AND sender_id <> ?
                GROUP BY conversation_id
            ) unread ON unread.conversation_id = c.id
            WHERE c.participant_one_id = ? OR c.participant_two_id = ?
            ORDER BY c.updated_at DESC
            """, (rs, row) -> new Conversation(
            UUID.fromString(rs.getString("id")),
            UUID.fromString(rs.getString("other_id")),
            rs.getString("other_name"),
            rs.getString("other_avatar_url"),
            rs.getLong("unread_count"),
            rs.getTimestamp("created_at").toInstant(),
            rs.getTimestamp("updated_at").toInstant()
        ), sqlId(accountId), sqlId(accountId), sqlId(accountId), sqlId(accountId), sqlId(accountId), sqlId(accountId));
    }

    public Conversation findOrCreateConversation(UUID accountId, UUID otherId) {
        if (accountId.equals(otherId)) throw new IllegalArgumentException("Cannot message yourself");
        List<Conversation> existing = jdbc.query("""
            SELECT c.id, c.participant_one_id, c.participant_two_id, c.created_at, c.updated_at,
             a2.name AS other_name,
             a2.avatar_url AS other_avatar_url
            FROM conversations c JOIN accounts a2 ON a2.id = CASE
              WHEN c.participant_one_id = ? THEN c.participant_two_id ELSE c.participant_one_id END
            WHERE (c.participant_one_id = ? AND c.participant_two_id = ?)
               OR (c.participant_one_id = ? AND c.participant_two_id = ?)
            LIMIT 1
            """, (rs, row) -> new Conversation(
             UUID.fromString(rs.getString("id")), otherId, rs.getString("other_name"), rs.getString("other_avatar_url"),
            0L, rs.getTimestamp("created_at").toInstant(), rs.getTimestamp("updated_at").toInstant()
          ), sqlId(accountId), sqlId(accountId), sqlId(otherId), sqlId(otherId), sqlId(accountId));
        if (!existing.isEmpty()) return existing.get(0);
        UUID id = UUID.randomUUID();
        String firstParticipant = sqlId(accountId);
        String secondParticipant = sqlId(otherId);
        if (firstParticipant.compareTo(secondParticipant) > 0) {
            String temporary = firstParticipant;
            firstParticipant = secondParticipant;
            secondParticipant = temporary;
        }
        jdbc.update("INSERT INTO conversations(id, participant_one_id, participant_two_id) VALUES (?, ?, ?)",
            sqlId(id), firstParticipant, secondParticipant);
        return conversations(accountId).stream().filter(c -> c.id().equals(id)).findFirst().orElseThrow();
    }

    public boolean isConversationParticipant(UUID conversationId, UUID accountId) {
        return jdbc.queryForObject("""
            SELECT COUNT(*) FROM conversations
            WHERE id = ? AND (participant_one_id = ? OR participant_two_id = ?)
            """, Integer.class, sqlId(conversationId), sqlId(accountId), sqlId(accountId)) > 0;
    }

    public UUID otherConversationParticipant(UUID conversationId, UUID accountId) {
        String participantId = jdbc.queryForObject("""
            SELECT CASE WHEN participant_one_id = ? THEN participant_two_id ELSE participant_one_id END
            FROM conversations
            WHERE id = ? AND (participant_one_id = ? OR participant_two_id = ?)
            """, String.class, sqlId(accountId), sqlId(conversationId), sqlId(accountId), sqlId(accountId));
        return UUID.fromString(participantId);
    }

    public List<Message> messages(UUID conversationId) {
        return jdbc.query("""
            SELECT m.id, m.conversation_id, m.sender_id, a.name AS sender_name,
                   m.body, m.created_at, m.read_at
            FROM messages m JOIN accounts a ON a.id = m.sender_id
            WHERE m.conversation_id = ? ORDER BY m.created_at ASC
            """, (rs, row) -> mapMessage(rs), sqlId(conversationId));
    }

    public void markConversationRead(UUID conversationId, UUID accountId) {
        jdbc.update("""
            UPDATE messages m
            JOIN conversations c ON c.id = m.conversation_id
            SET m.read_at = COALESCE(m.read_at, now())
            WHERE m.conversation_id = ? AND m.sender_id <> ? AND (c.participant_one_id = ? OR c.participant_two_id = ?)
            """, sqlId(conversationId), sqlId(accountId), sqlId(accountId), sqlId(accountId));
    }

    public Message insertMessage(UUID conversationId, UUID senderId, String body) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO messages(id, conversation_id, sender_id, body) VALUES (?, ?, ?, ?)",
            sqlId(id), sqlId(conversationId), sqlId(senderId), body.trim());
        jdbc.update("UPDATE conversations SET updated_at = now() WHERE id = ?", sqlId(conversationId));
        return jdbc.query("""
            SELECT m.id, m.conversation_id, m.sender_id, a.name AS sender_name,
                   m.body, m.created_at, m.read_at
            FROM messages m JOIN accounts a ON a.id = m.sender_id WHERE m.id = ?
            """, (rs, row) -> mapMessage(rs), sqlId(id)).stream().findFirst().orElseThrow();
    }

    private Optional<AuthenticatedUser> queryUser(String sql, Object... args) {
        return jdbc.query(sql, (rs, row) -> mapUser(rs), sqlArgs(args)).stream().findFirst();
    }

    private static String sqlId(UUID id) {
        return id == null ? null : id.toString();
    }

    private static Object[] sqlArgs(Object... args) {
        return Arrays.stream(args)
            .map(value -> value instanceof UUID uuid ? uuid.toString() : value)
            .toArray();
    }

    private AuthenticatedUser mapUser(ResultSet rs) throws SQLException {
        return new AuthenticatedUser(
            UUID.fromString(rs.getString("id")), rs.getString("name"), rs.getString("email"),
            rs.getString("phone"), rs.getString("role"), rs.getString("city"), rs.getString("country"),
            rs.getString("status"), rs.getString("avatar_url"), readArray(rs.getString("interests")),
            rs.getTimestamp("created_at").toInstant(), rs.getBigDecimal("latitude"),
            rs.getBigDecimal("longitude")
        );
    }

    private Category mapCategory(ResultSet rs, int row) throws SQLException {
        return new Category(UUID.fromString(rs.getString("id")), rs.getString("name"), rs.getString("slug"),
            rs.getString("image_url"), rs.getBoolean("active"), rs.getTimestamp("created_at").toInstant(), rs.getTimestamp("updated_at").toInstant());
    }

    private Product mapProduct(ResultSet rs, int row) throws SQLException {
        java.sql.Date harvest = rs.getDate("harvest_date");
        String imageUrl = rs.getString("image_url");
        if (imageUrl == null || imageUrl.isBlank()) {
            imageUrl = categoryImage(rs.getString("category")).orElse(null);
        }
        return new Product(UUID.fromString(rs.getString("id")), rs.getString("name"), rs.getString("category"),
            rs.getString("city"), rs.getBigDecimal("price"), rs.getString("unit"), rs.getBigDecimal("stock"),
            rs.getString("status"), harvest == null ? null : harvest.toLocalDate(), (Integer) rs.getObject("shelf_life_days"),
            UUID.fromString(rs.getString("owner_id")), rs.getString("owner_name"),
            rs.getString("description"), imageUrl,
            rs.getBigDecimal("latitude"), rs.getBigDecimal("longitude"), rs.getString("owner_avatar_url"));
    }

    private Optional<String> categoryImage(String slug) {
        return jdbc.query("SELECT image_url FROM categories WHERE lower(slug) = lower(?) LIMIT 1",
            rs -> rs.next() && rs.getString("image_url") != null
                ? Optional.of(rs.getString("image_url")) : Optional.empty(), slug);
    }

    private Message mapMessage(ResultSet rs) throws SQLException {
        return new Message(UUID.fromString(rs.getString("id")), UUID.fromString(rs.getString("conversation_id")),
            UUID.fromString(rs.getString("sender_id")), rs.getString("sender_name"), rs.getString("body"),
            rs.getTimestamp("created_at").toInstant(),
            rs.getTimestamp("read_at") == null ? null : rs.getTimestamp("read_at").toInstant());
    }

    private Order mapOrder(ResultSet rs, int row) throws SQLException {
        return new Order(UUID.fromString(rs.getString("id")), UUID.fromString(rs.getString("product_id")),
            rs.getString("product_name"), UUID.fromString(rs.getString("buyer_id")), UUID.fromString(rs.getString("seller_id")), rs.getInt("quantity"),
            rs.getBigDecimal("unit_price"), rs.getString("status"), rs.getString("city"),
            rs.getTimestamp("created_at").toInstant(), rs.getString("seller_name"), rs.getString("seller_city"),
            rs.getString("seller_phone"), rs.getBigDecimal("seller_latitude"), rs.getBigDecimal("seller_longitude"),
            rs.getString("buyer_name"), rs.getString("buyer_city"), rs.getString("buyer_phone"),
            orderProductImage(rs), rs.getString("product_category"), rs.getString("product_unit"),
            rs.getString("seller_avatar_url"), rs.getString("buyer_avatar_url"));
    }

    /** Même image que la fiche produit : image du produit, sinon image de sa catégorie. */
    private String orderProductImage(ResultSet rs) throws SQLException {
        String imageUrl = rs.getString("product_image_url");
        if (imageUrl != null && !imageUrl.isBlank()) return imageUrl;
        return categoryImage(rs.getString("product_category")).orElse(null);
    }

    private static List<String> readArray(String serialized) {
        if (serialized == null || serialized.isBlank()) return new ArrayList<>();
        return Arrays.stream(serialized.split(","))
            .map(String::trim)
            .filter(value -> !value.isEmpty())
            .toList();
    }

    public record Credentials(UUID id, String name, String email, String phone, String passwordHash, String passwordSalt,
                              String role, String city, String country, String status, String avatarUrl, List<String> interests) {}
    public record ResetToken(UUID id, UUID accountId, Instant expiresAt) {}
    public record Category(UUID id, String name, String slug, String imageUrl, boolean active, Instant createdAt, Instant updatedAt) {}
    public record Product(UUID id, String name, String category, String city, BigDecimal price, String unit,
                          BigDecimal stock, String status, LocalDate harvestDate, Integer shelfLifeDays,
                           UUID ownerId, String ownerName, String description, String imageUrl,
                           BigDecimal latitude, BigDecimal longitude, String ownerAvatarUrl) {}
    public record Conversation(UUID id, UUID otherId, String otherName, String otherAvatarUrl, long unreadCount,
                                Instant createdAt, Instant updatedAt) {}
    public record Message(UUID id, UUID conversationId, UUID senderId, String senderName, String body,
                          Instant createdAt, Instant readAt) {}
    public record Order(UUID id, UUID productId, String productName, UUID buyerId, UUID sellerId, int quantity,
                        BigDecimal unitPrice, String status, String city, Instant createdAt,
                        String sellerName, String sellerCity, String sellerPhone,
                        BigDecimal sellerLatitude, BigDecimal sellerLongitude,
                        String buyerName, String buyerCity, String buyerPhone,
                        String productImageUrl, String productCategory, String productUnit,
                        String sellerAvatarUrl, String buyerAvatarUrl) {}
    public record CheckoutLine(UUID productId, int quantity) {}
    public record Report(UUID id, String reason, String details, String status, String resolution, Instant createdAt,
                         String reporterName, String reporterEmail, UUID farmerId, String farmerName, String farmerEmail,
                         String farmerStatus) {}
    public record AdminSummary(long userCount, long productCount, long transactionCount, long pendingProductCount, long pendingReportCount) {}
}