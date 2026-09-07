ALTER TABLE accounts
    ADD COLUMN latitude DECIMAL(10, 7) NULL,
    ADD COLUMN longitude DECIMAL(10, 7) NULL;

ALTER TABLE products
    ADD COLUMN description TEXT NULL,
    ADD COLUMN image_url VARCHAR(1000) NULL,
    ADD COLUMN latitude DECIMAL(10, 7) NULL,
    ADD COLUMN longitude DECIMAL(10, 7) NULL;

CREATE TABLE IF NOT EXISTS product_images (
    id CHAR(36) NOT NULL PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    image_url VARCHAR(1000) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT product_images_product_fk FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX product_images_product_idx (product_id, sort_order)
);

CREATE TABLE IF NOT EXISTS order_status_history (
    id CHAR(36) NOT NULL PRIMARY KEY,
    order_id CHAR(36) NOT NULL,
    status VARCHAR(30) NOT NULL,
    changed_by CHAR(36) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT order_history_order_fk FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT order_history_account_fk FOREIGN KEY (changed_by) REFERENCES accounts(id) ON DELETE CASCADE,
    INDEX order_history_order_idx (order_id, created_at)
);

CREATE TABLE IF NOT EXISTS reviews (
    id CHAR(36) NOT NULL PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    order_id CHAR(36) NOT NULL,
    reviewer_id CHAR(36) NOT NULL,
    rating TINYINT NOT NULL,
    comment VARCHAR(2000) NULL,
    status ENUM('published', 'removed') NOT NULL DEFAULT 'published',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT reviews_product_fk FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT reviews_order_fk FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT reviews_reviewer_fk FOREIGN KEY (reviewer_id) REFERENCES accounts(id) ON DELETE CASCADE,
    CONSTRAINT reviews_rating_check CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT reviews_reviewer_order_unique UNIQUE (reviewer_id, order_id),
    INDEX reviews_product_status_idx (product_id, status, created_at)
);

CREATE TABLE IF NOT EXISTS payments (
    id CHAR(36) NOT NULL PRIMARY KEY,
    order_id CHAR(36) NOT NULL,
    payer_id CHAR(36) NOT NULL,
    amount DECIMAL(14, 2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'XAF',
    method VARCHAR(40) NOT NULL,
    provider_reference VARCHAR(160) NULL,
    status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    paid_at DATETIME(6) NULL,
    CONSTRAINT payments_order_fk FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT payments_payer_fk FOREIGN KEY (payer_id) REFERENCES accounts(id) ON DELETE CASCADE,
    CONSTRAINT payments_amount_check CHECK (amount > 0),
    CONSTRAINT payments_order_unique UNIQUE (order_id),
    INDEX payments_payer_idx (payer_id, created_at)
);

CREATE TABLE IF NOT EXISTS market_prices (
    id CHAR(36) NOT NULL PRIMARY KEY,
    product_name VARCHAR(180) NOT NULL,
    category VARCHAR(120) NULL,
    city VARCHAR(120) NOT NULL,
    region VARCHAR(120) NULL,
    unit VARCHAR(40) NOT NULL,
    price DECIMAL(14, 2) NOT NULL,
    recorded_by CHAR(36) NULL,
    recorded_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT market_prices_recorder_fk FOREIGN KEY (recorded_by) REFERENCES accounts(id) ON DELETE SET NULL,
    CONSTRAINT market_prices_price_check CHECK (price > 0),
    INDEX market_prices_lookup_idx (product_name, city, recorded_at)
);

CREATE TABLE IF NOT EXISTS market_alerts (
    id CHAR(36) NOT NULL PRIMARY KEY,
    account_id CHAR(36) NULL,
    product_name VARCHAR(180) NOT NULL,
    city VARCHAR(120) NULL,
    title VARCHAR(180) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    variation_percent DECIMAL(8, 2) NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT market_alerts_account_fk FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    INDEX market_alerts_account_idx (account_id, active, created_at)
);

CREATE TABLE IF NOT EXISTS notifications (
    id CHAR(36) NOT NULL PRIMARY KEY,
    account_id CHAR(36) NOT NULL,
    type VARCHAR(40) NOT NULL,
    title VARCHAR(180) NOT NULL,
    body VARCHAR(1000) NOT NULL,
    resource_type VARCHAR(40) NULL,
    resource_id CHAR(36) NULL,
    read_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT notifications_account_fk FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    INDEX notifications_account_idx (account_id, read_at, created_at)
);

CREATE INDEX products_catalog_filter_idx
    ON products (status, city, category, price);
CREATE INDEX orders_buyer_status_idx
    ON orders (buyer_id, status, created_at);
CREATE INDEX interactions_account_created_idx
    ON interactions (account_id, created_at);
