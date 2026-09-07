/**
 * Flyway owns the schema. JDBC projections remain inside repository and are
 * intentionally not JPA entities, preventing provider mappings from changing
 * existing MySQL behaviour.
 */
package cm.adjal.api.entity;