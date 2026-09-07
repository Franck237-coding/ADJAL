CREATE TABLE IF NOT EXISTS accounts (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  password_salt VARCHAR(255) NOT NULL,
  role ENUM('buyer', 'farmer', 'admin') NOT NULL DEFAULT 'buyer',
  city VARCHAR(120) NOT NULL,
  country CHAR(2) NOT NULL DEFAULT 'CM',
  status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  avatar_url TEXT,
  interests VARCHAR(2000) NOT NULL DEFAULT '',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);

CREATE TABLE IF NOT EXISTS products (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(120) NOT NULL,
  city VARCHAR(120) NOT NULL,
  country CHAR(2) NOT NULL DEFAULT 'CM',
  price DECIMAL(12,2) NOT NULL,
  unit VARCHAR(64) NOT NULL,
  stock DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('pending', 'published', 'removed') NOT NULL DEFAULT 'pending',
  harvest_date DATE NOT NULL,
  shelf_life_days INT,
  owner_id CHAR(36) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT products_owner_fk FOREIGN KEY (owner_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS interactions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  type ENUM('view', 'search', 'purchase') NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT interactions_account_fk FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT interactions_product_fk FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  account_id CHAR(36) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT sessions_account_fk FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id CHAR(36) NOT NULL PRIMARY KEY,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  account_id CHAR(36) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  used_at DATETIME(6),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT reset_tokens_account_fk FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);

CREATE TABLE IF NOT EXISTS orders (
  id CHAR(36) NOT NULL PRIMARY KEY,
  buyer_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  status ENUM('pending', 'confirmed', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  city VARCHAR(120) NOT NULL,
  country CHAR(2) NOT NULL DEFAULT 'CM',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT orders_buyer_fk FOREIGN KEY (buyer_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT orders_product_fk FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conversations (
  id CHAR(36) NOT NULL PRIMARY KEY,
  participant_one_id CHAR(36) NOT NULL,
  participant_two_id CHAR(36) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT conversations_distinct_participants CHECK (participant_one_id <> participant_two_id),
  CONSTRAINT conversations_participants_unique UNIQUE (participant_one_id, participant_two_id),
  CONSTRAINT conversations_participant_one_fk FOREIGN KEY (participant_one_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT conversations_participant_two_fk FOREIGN KEY (participant_two_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id CHAR(36) NOT NULL PRIMARY KEY,
  conversation_id CHAR(36) NOT NULL,
  sender_id CHAR(36) NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  read_at DATETIME(6),
  CONSTRAINT messages_conversation_fk FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT messages_sender_fk FOREIGN KEY (sender_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT messages_body_length CHECK (CHAR_LENGTH(TRIM(body)) BETWEEN 1 AND 4000),
  INDEX messages_conversation_created_idx (conversation_id, created_at)
);