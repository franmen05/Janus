-- V1: Initial schema for Janus (PostgreSQL)

-- ============================================================
-- SEQUENCES
-- ============================================================

create sequence alerts_SEQ start with 1 increment by 50;
create sequence api_keys_SEQ start with 1 increment by 50;
create sequence audit_logs_SEQ start with 1 increment by 50;
create sequence clients_SEQ start with 1 increment by 50;
create sequence compliance_rule_configs_SEQ start with 1 increment by 50;
create sequence crossing_discrepancies_SEQ start with 1 increment by 50;
create sequence crossing_results_SEQ start with 1 increment by 50;
create sequence customer_contacts_SEQ start with 1 increment by 50;
create sequence customers_SEQ start with 1 increment by 50;
create sequence declarations_SEQ start with 1 increment by 50;
create sequence depositos_SEQ start with 1 increment by 50;
create sequence document_type_configs_SEQ start with 1 increment by 50;
create sequence document_versions_SEQ start with 1 increment by 50;
create sequence documents_SEQ start with 1 increment by 50;
create sequence exchange_rate_SEQ start with 1 increment by 50;
create sequence service_configs_SEQ start with 1 increment by 50;
create sequence external_permits_SEQ start with 1 increment by 50;
create sequence inspection_expenses_SEQ start with 1 increment by 50;
create sequence inspection_photos_SEQ start with 1 increment by 50;
create sequence liquidation_lines_SEQ start with 1 increment by 50;
create sequence liquidations_SEQ start with 1 increment by 50;
create sequence notifications_SEQ start with 1 increment by 50;
create sequence operation_comments_SEQ start with 1 increment by 50;
create sequence operations_SEQ start with 1 increment by 50;
create sequence payments_SEQ start with 1 increment by 50;
create sequence ports_SEQ start with 1 increment by 50;
create sequence status_history_SEQ start with 1 increment by 50;
create sequence tariff_lines_SEQ start with 1 increment by 50;
create sequence users_SEQ start with 1 increment by 50;

-- ============================================================
-- TABLES (dependency order: independent tables first)
-- ============================================================

-- Independent tables (no foreign keys)

create table users (
    id BIGINT not null,
    active BOOLEAN not null,
    created_at TIMESTAMP not null,
    customer_id BIGINT,
    updated_at TIMESTAMP,
    email VARCHAR(255) not null,
    full_name VARCHAR(255) not null,
    password VARCHAR(255) not null,
    username VARCHAR(255) not null unique,
    primary key (id)
);

create table user_roles (
    user_id BIGINT not null,
    role VARCHAR(255)
);

create table customers (
    id BIGINT not null,
    active BOOLEAN not null,
    created_at TIMESTAMP not null,
    updated_at TIMESTAMP,
    address VARCHAR(255),
    alternatePhone VARCHAR(255),
    businessName VARCHAR(255),
    country VARCHAR(255),
    customerCode VARCHAR(255),
    email VARCHAR(255) not null,
    name VARCHAR(255) not null,
    notes VARCHAR(255),
    phone VARCHAR(255),
    representative VARCHAR(255),
    tax_id VARCHAR(255) not null unique,
    customerType VARCHAR(50) not null,
    documentType VARCHAR(50),
    primary key (id)
);

create table customer_contacts (
    id BIGINT not null,
    receive_notifications BOOLEAN not null,
    created_at TIMESTAMP not null,
    customer_id BIGINT,
    updated_at TIMESTAMP,
    email VARCHAR(255),
    firstName VARCHAR(255) not null,
    identification VARCHAR(255) not null,
    lastName VARCHAR(255) not null,
    phone VARCHAR(255) not null,
    contact_type VARCHAR(50) not null,
    primary key (id)
);

create table ports (
    id BIGINT not null,
    arrivalPort BOOLEAN DEFAULT TRUE not null,
    country VARCHAR(2),
    originPort BOOLEAN DEFAULT TRUE not null,
    created_at TIMESTAMP not null,
    updated_at TIMESTAMP,
    address TEXT,
    code VARCHAR(255) not null unique,
    description TEXT,
    name VARCHAR(255) not null,
    primary key (id)
);

create table depositos (
    id BIGINT not null,
    created_at TIMESTAMP not null,
    updated_at TIMESTAMP,
    code VARCHAR(255) not null unique,
    description TEXT,
    name VARCHAR(255) not null,
    primary key (id)
);

create table clients (
    id BIGINT not null,
    active BOOLEAN not null,
    created_at TIMESTAMP not null,
    updated_at TIMESTAMP,
    address VARCHAR(255),
    email VARCHAR(255) not null,
    name VARCHAR(255) not null,
    phone VARCHAR(255),
    tax_id VARCHAR(255) not null unique,
    clientType VARCHAR(50) not null,
    primary key (id)
);

create table api_keys (
    id BIGINT not null,
    active BOOLEAN not null,
    created_at TIMESTAMP not null,
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    updated_at TIMESTAMP,
    key_prefix VARCHAR(12) not null,
    key_hash VARCHAR(64) not null unique,
    created_by VARCHAR(255) not null,
    name VARCHAR(255) not null,
    primary key (id)
);

create table compliance_rule_configs (
    id BIGINT not null,
    enabled BOOLEAN not null,
    description TEXT,
    param_key VARCHAR(255) not null,
    param_value TEXT not null,
    rule_code VARCHAR(255) not null,
    primary key (id),
    unique (rule_code, param_key)
);

create table document_type_configs (
    id BIGINT not null,
    allow_multiple BOOLEAN not null,
    created_at TIMESTAMP not null,
    updated_at TIMESTAMP,
    code VARCHAR(255) not null unique,
    primary key (id)
);

create table exchange_rate (
    id BIGINT not null,
    active BOOLEAN not null,
    effective_date DATE not null,
    rate NUMERIC(15,4) not null,
    created_at TIMESTAMP not null,
    updated_at TIMESTAMP,
    source VARCHAR(255) not null,
    source_currency VARCHAR(255) not null,
    target_currency VARCHAR(255) not null,
    primary key (id),
    unique (source_currency, target_currency, effective_date)
);

create table service_configs (
    id BIGINT not null,
    active BOOLEAN not null,
    sort_order INTEGER not null,
    created_at TIMESTAMP not null,
    updated_at TIMESTAMP,
    label_en VARCHAR(255) not null,
    label_es VARCHAR(255) not null,
    name VARCHAR(255) not null unique,
    primary key (id)
);

create table service_config_modules (
    service_config_id BIGINT not null,
    module VARCHAR(255) not null,
    primary key (service_config_id, module),
    foreign key (service_config_id) references service_configs(id)
);

-- Tables with foreign keys to independent tables

create table operations (
    id BIGINT not null,
    declared_value NUMERIC(15,2),
    gross_weight NUMERIC(15,3),
    local_charges_validated BOOLEAN,
    pieces INTEGER,
    volume NUMERIC(15,3),
    volumetric_weight NUMERIC(15,3),
    arrivalPort_id BIGINT,
    arrival_date TIMESTAMP,
    assignedAgent_id BIGINT,
    closed_at TIMESTAMP,
    created_at TIMESTAMP not null,
    customer_id BIGINT,
    deposito_id BIGINT,
    estimated_arrival TIMESTAMP,
    inspection_set_at TIMESTAMP,
    originPort_id BIGINT,
    updated_at TIMESTAMP,
    valuation_finalized_at TIMESTAMP,
    incoterm VARCHAR(10),
    bl_number VARCHAR(255),
    child_bl_number VARCHAR(255),
    container_number VARCHAR(255),
    notes TEXT,
    reference_number VARCHAR(255) not null unique,
    bl_availability VARCHAR(50),
    bl_type VARCHAR(50),
    cargo_type VARCHAR(50),
    inspection_type VARCHAR(50),
    operation_category VARCHAR(50) not null,
    operation_type VARCHAR(50) not null,
    status VARCHAR(50) not null,
    transport_mode VARCHAR(50) not null,
    primary key (id)
);

create table alerts (
    id BIGINT not null,
    operation_id BIGINT,
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP not null,
    updated_at TIMESTAMP,
    acknowledged_by VARCHAR(255),
    message TEXT not null,
    message_params TEXT,
    alert_type VARCHAR(50) not null,
    status VARCHAR(50) not null,
    primary key (id)
);

create table audit_logs (
    id BIGINT not null,
    created_at TIMESTAMP not null,
    entity_id BIGINT,
    operation_id BIGINT,
    details TEXT,
    entity_name VARCHAR(255) not null,
    ip_address VARCHAR(255),
    new_data TEXT,
    previous_data TEXT,
    username VARCHAR(255) not null,
    action VARCHAR(50) not null,
    primary key (id)
);

create table declarations (
    id BIGINT not null,
    cif_value NUMERIC(15,2),
    cif_value_usd NUMERIC(15,2),
    exchange_rate NUMERIC(15,4),
    exchange_rate_date DATE,
    fob_value NUMERIC(15,2),
    fob_value_usd NUMERIC(15,2),
    freight_value NUMERIC(15,2),
    freight_value_usd NUMERIC(15,2),
    insurance_value NUMERIC(15,2),
    insurance_value_usd NUMERIC(15,2),
    taxable_base NUMERIC(15,2),
    total_taxes NUMERIC(15,2),
    created_at TIMESTAMP not null,
    final_approved_at TIMESTAMP,
    operation_id BIGINT,
    rejected_at TIMESTAMP,
    submitted_at TIMESTAMP,
    technical_approved_at TIMESTAMP,
    updated_at TIMESTAMP,
    declaration_number VARCHAR(255),
    final_approval_comment TEXT,
    final_approved_by VARCHAR(255),
    notes TEXT,
    rejected_by VARCHAR(255),
    rejection_comment TEXT,
    technical_approval_comment TEXT,
    technical_approved_by VARCHAR(255),
    declaration_type VARCHAR(50) not null,
    primary key (id)
);

create table documents (
    id BIGINT not null,
    active BOOLEAN not null,
    created_at TIMESTAMP not null,
    operation_id BIGINT,
    updated_at TIMESTAMP,
    document_type VARCHAR(50) not null,
    status VARCHAR(50) not null,
    primary key (id)
);

create table document_versions (
    id BIGINT not null,
    active BOOLEAN not null,
    version_number INTEGER not null,
    created_at TIMESTAMP not null,
    document_id BIGINT,
    file_size BIGINT,
    uploadedBy_id BIGINT,
    uploaded_at TIMESTAMP not null,
    updated_at TIMESTAMP,
    change_reason VARCHAR(255),
    file_path VARCHAR(255) not null,
    mime_type VARCHAR(255),
    original_name VARCHAR(255) not null,
    stored_name VARCHAR(255) not null,
    primary key (id)
);

create table external_permits (
    id BIGINT not null,
    expiry_date DATE,
    issued_date DATE,
    created_at TIMESTAMP not null,
    operation_id BIGINT,
    updated_at TIMESTAMP,
    notes TEXT,
    reference_number VARCHAR(255),
    updated_by VARCHAR(255),
    permit_type VARCHAR(50) not null,
    status VARCHAR(50) not null,
    primary key (id)
);

create table inspection_expenses (
    id BIGINT not null,
    active BOOLEAN not null,
    amount NUMERIC(15,2) not null,
    expense_date DATE,
    invoice_date DATE,
    quantity INTEGER DEFAULT 1 NOT NULL,
    rate NUMERIC(15,4),
    reimbursable BOOLEAN not null,
    show_on_documents BOOLEAN DEFAULT TRUE NOT NULL,
    update_related BOOLEAN DEFAULT FALSE NOT NULL,
    billflow_invoice_id BIGINT,
    created_at TIMESTAMP not null,
    operation_id BIGINT,
    registeredBy_id BIGINT,
    updated_at TIMESTAMP,
    ncf_number VARCHAR(50),
    units VARCHAR(50),
    invoice_number VARCHAR(100),
    reference_number_charge VARCHAR(100),
    bill_to_name VARCHAR(255),
    category VARCHAR(255) not null,
    currency VARCHAR(255) not null,
    description TEXT,
    justification TEXT,
    notes TEXT,
    responsable VARCHAR(255),
    bill_to_type VARCHAR(50),
    billing_status VARCHAR(20) DEFAULT 'NONE' NOT NULL,
    charge_type VARCHAR(20) DEFAULT 'EXPENSE' NOT NULL,
    paymentStatus VARCHAR(50),
    payment_type VARCHAR(50),
    primary key (id)
);

create table inspection_photos (
    id BIGINT not null,
    active BOOLEAN not null,
    created_at TIMESTAMP not null,
    file_size BIGINT,
    operation_id BIGINT,
    updated_at TIMESTAMP,
    uploadedBy_id BIGINT,
    caption TEXT,
    file_path VARCHAR(255) not null,
    mime_type VARCHAR(255),
    original_name VARCHAR(255) not null,
    stored_name VARCHAR(255) not null,
    primary key (id)
);

create table crossing_results (
    id BIGINT not null,
    created_at TIMESTAMP not null,
    finalDeclaration_id BIGINT,
    operation_id BIGINT,
    preliminaryDeclaration_id BIGINT,
    resolved_at TIMESTAMP,
    updated_at TIMESTAMP,
    resolution_comment TEXT,
    resolved_by VARCHAR(255),
    status VARCHAR(50) not null,
    primary key (id)
);

create table crossing_discrepancies (
    id BIGINT not null,
    difference NUMERIC(15,2),
    tariff_line_number INTEGER,
    crossingResult_id BIGINT,
    description TEXT,
    final_value VARCHAR(255),
    preliminary_value VARCHAR(255),
    field VARCHAR(50) not null,
    primary key (id)
);

create table liquidations (
    id BIGINT not null,
    grand_total NUMERIC(15,2),
    total_agency_services NUMERIC(15,2),
    total_customs_taxes NUMERIC(15,2),
    total_third_party NUMERIC(15,2),
    approved_at TIMESTAMP,
    created_at TIMESTAMP not null,
    declaration_id BIGINT,
    operation_id BIGINT,
    updated_at TIMESTAMP,
    approval_comment TEXT,
    approved_by VARCHAR(255),
    dga_payment_code VARCHAR(255),
    status VARCHAR(50) not null,
    primary key (id)
);

create table liquidation_lines (
    id BIGINT not null,
    amount NUMERIC(15,2) not null,
    base_amount NUMERIC(15,2),
    line_order INTEGER,
    rate NUMERIC(8,4),
    reimbursable BOOLEAN not null,
    liquidation_id BIGINT,
    concept VARCHAR(255) not null,
    description TEXT,
    charge_type VARCHAR(50),
    primary key (id)
);

create table notifications (
    id BIGINT not null,
    created_at TIMESTAMP not null,
    operation_id BIGINT,
    sent_at TIMESTAMP,
    body TEXT not null,
    error_message VARCHAR(255),
    recipient_email VARCHAR(255) not null,
    subject VARCHAR(255) not null,
    status VARCHAR(50) not null,
    primary key (id)
);

create table operation_comments (
    id BIGINT not null,
    internal BOOLEAN not null,
    author_id BIGINT,
    created_at TIMESTAMP not null,
    operation_id BIGINT,
    content TEXT not null,
    primary key (id)
);

create table payments (
    id BIGINT not null,
    amount NUMERIC(15,2) not null,
    payment_date DATE not null,
    created_at TIMESTAMP not null,
    liquidation_id BIGINT unique,
    operation_id BIGINT,
    updated_at TIMESTAMP,
    bank_reference VARCHAR(255),
    dga_reference VARCHAR(255),
    notes TEXT,
    registered_by VARCHAR(255),
    payment_method VARCHAR(50) not null,
    primary key (id)
);

create table status_history (
    id BIGINT not null,
    changedBy_id BIGINT,
    changed_at TIMESTAMP not null,
    operation_id BIGINT,
    comment TEXT,
    ip_address VARCHAR(255),
    new_status VARCHAR(50) not null,
    previous_status VARCHAR(50),
    primary key (id)
);

create table tariff_lines (
    id BIGINT not null,
    admin_fee NUMERIC(15,2),
    duty_amount NUMERIC(15,2),
    duty_rate NUMERIC(8,4),
    itbis_amount NUMERIC(15,2),
    itbis_rate NUMERIC(8,4),
    line_number INTEGER not null,
    quantity NUMERIC(15,4),
    selective_amount NUMERIC(15,2),
    selective_rate NUMERIC(8,4),
    surcharge_amount NUMERIC(15,2),
    surcharge_rate NUMERIC(8,4),
    tax_amount NUMERIC(15,2),
    tax_rate NUMERIC(8,4),
    total_value NUMERIC(15,2),
    unit_value NUMERIC(15,2),
    declaration_id BIGINT,
    description TEXT,
    tariff_code VARCHAR(255) not null,
    primary key (id)
);

-- ============================================================
-- FOREIGN KEYS
-- ============================================================

ALTER TABLE alerts ADD CONSTRAINT FK_alerts_operation_id FOREIGN KEY (operation_id) REFERENCES operations (id);

ALTER TABLE crossing_discrepancies ADD CONSTRAINT FK_crossing_discrepancies_crossingResult_id FOREIGN KEY (crossingResult_id) REFERENCES crossing_results (id);

ALTER TABLE crossing_results ADD CONSTRAINT FK_crossing_results_finalDeclaration_id FOREIGN KEY (finalDeclaration_id) REFERENCES declarations (id);
ALTER TABLE crossing_results ADD CONSTRAINT FK_crossing_results_operation_id FOREIGN KEY (operation_id) REFERENCES operations (id);
ALTER TABLE crossing_results ADD CONSTRAINT FK_crossing_results_preliminaryDeclaration_id FOREIGN KEY (preliminaryDeclaration_id) REFERENCES declarations (id);

ALTER TABLE customer_contacts ADD CONSTRAINT FK_customer_contacts_customer_id FOREIGN KEY (customer_id) REFERENCES customers (id);

ALTER TABLE declarations ADD CONSTRAINT FK_declarations_operation_id FOREIGN KEY (operation_id) REFERENCES operations (id);

ALTER TABLE document_versions ADD CONSTRAINT FK_document_versions_document_id FOREIGN KEY (document_id) REFERENCES documents (id);
ALTER TABLE document_versions ADD CONSTRAINT FK_document_versions_uploadedBy_id FOREIGN KEY (uploadedBy_id) REFERENCES users (id);

ALTER TABLE documents ADD CONSTRAINT FK_documents_operation_id FOREIGN KEY (operation_id) REFERENCES operations (id);

ALTER TABLE external_permits ADD CONSTRAINT FK_external_permits_operation_id FOREIGN KEY (operation_id) REFERENCES operations (id);

ALTER TABLE inspection_expenses ADD CONSTRAINT FK_inspection_expenses_operation_id FOREIGN KEY (operation_id) REFERENCES operations (id);
ALTER TABLE inspection_expenses ADD CONSTRAINT FK_inspection_expenses_registeredBy_id FOREIGN KEY (registeredBy_id) REFERENCES users (id);

ALTER TABLE inspection_photos ADD CONSTRAINT FK_inspection_photos_operation_id FOREIGN KEY (operation_id) REFERENCES operations (id);
ALTER TABLE inspection_photos ADD CONSTRAINT FK_inspection_photos_uploadedBy_id FOREIGN KEY (uploadedBy_id) REFERENCES users (id);

ALTER TABLE liquidation_lines ADD CONSTRAINT FK_liquidation_lines_liquidation_id FOREIGN KEY (liquidation_id) REFERENCES liquidations (id);

ALTER TABLE liquidations ADD CONSTRAINT FK_liquidations_declaration_id FOREIGN KEY (declaration_id) REFERENCES declarations (id);
ALTER TABLE liquidations ADD CONSTRAINT FK_liquidations_operation_id FOREIGN KEY (operation_id) REFERENCES operations (id);

ALTER TABLE operation_comments ADD CONSTRAINT FK_operation_comments_author_id FOREIGN KEY (author_id) REFERENCES users (id);
ALTER TABLE operation_comments ADD CONSTRAINT FK_operation_comments_operation_id FOREIGN KEY (operation_id) REFERENCES operations (id);

ALTER TABLE operations ADD CONSTRAINT FK_operations_arrivalPort_id FOREIGN KEY (arrivalPort_id) REFERENCES ports (id);
ALTER TABLE operations ADD CONSTRAINT FK_operations_assignedAgent_id FOREIGN KEY (assignedAgent_id) REFERENCES users (id);
ALTER TABLE operations ADD CONSTRAINT FK_operations_customer_id FOREIGN KEY (customer_id) REFERENCES customers (id);
ALTER TABLE operations ADD CONSTRAINT FK_operations_deposito_id FOREIGN KEY (deposito_id) REFERENCES depositos (id);
ALTER TABLE operations ADD CONSTRAINT FK_operations_originPort_id FOREIGN KEY (originPort_id) REFERENCES ports (id);

ALTER TABLE payments ADD CONSTRAINT FK_payments_liquidation_id FOREIGN KEY (liquidation_id) REFERENCES liquidations (id);
ALTER TABLE payments ADD CONSTRAINT FK_payments_operation_id FOREIGN KEY (operation_id) REFERENCES operations (id);

ALTER TABLE status_history ADD CONSTRAINT FK_status_history_changedBy_id FOREIGN KEY (changedBy_id) REFERENCES users (id);
ALTER TABLE status_history ADD CONSTRAINT FK_status_history_operation_id FOREIGN KEY (operation_id) REFERENCES operations (id);

ALTER TABLE tariff_lines ADD CONSTRAINT FK_tariff_lines_declaration_id FOREIGN KEY (declaration_id) REFERENCES declarations (id);

ALTER TABLE user_roles ADD CONSTRAINT FK_user_roles_user_id FOREIGN KEY (user_id) REFERENCES users (id);
