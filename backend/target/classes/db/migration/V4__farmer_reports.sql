CREATE TABLE IF NOT EXISTS reports (
  id CHAR(36) NOT NULL PRIMARY KEY,
  reporter_id CHAR(36) NOT NULL,
  farmer_id CHAR(36) NOT NULL,
  reason VARCHAR(40) NOT NULL,
  details TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  moderator_id CHAR(36),
  resolution TEXT,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT reports_reason_check CHECK (reason IN ('fraud', 'harassment', 'unsafe_product', 'spam', 'other')),
  CONSTRAINT reports_status_check CHECK (status IN ('pending', 'dismissed', 'warned', 'banned')),
  CONSTRAINT reports_reporter_fk FOREIGN KEY (reporter_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT reports_farmer_fk FOREIGN KEY (farmer_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT reports_moderator_fk FOREIGN KEY (moderator_id) REFERENCES accounts(id) ON DELETE SET NULL,
  INDEX reports_status_created_idx (status, created_at),
  INDEX reports_farmer_idx (farmer_id)
);