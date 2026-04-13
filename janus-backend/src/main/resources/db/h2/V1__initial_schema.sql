-- V1: Initial schema for Janus (H2)

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

create table alerts (
    acknowledged_at timestamp(6),
    created_at timestamp(6) not null,
    id bigint not null,
    operation_id bigint,
    updated_at timestamp(6),
    acknowledged_by varchar(255),
    message TEXT not null,
    message_params TEXT,
    alert_type VARCHAR(50) not null,
    status enum ('ACKNOWLEDGED','ACTIVE','RESOLVED') not null,
    primary key (id)
);

create table api_keys (
    active boolean not null,
    created_at timestamp(6) not null,
    expires_at timestamp(6),
    id bigint not null,
    last_used_at timestamp(6),
    updated_at timestamp(6),
    key_prefix varchar(12) not null,
    key_hash varchar(64) not null unique,
    created_by varchar(255) not null,
    name varchar(255) not null,
    primary key (id)
);

create table audit_logs (
    created_at timestamp(6) not null,
    entity_id bigint,
    id bigint not null,
    operation_id bigint,
    details TEXT,
    entity_name varchar(255) not null,
    ip_address varchar(255),
    new_data TEXT,
    previous_data TEXT,
    username varchar(255) not null,
    action enum ('ALERT_GENERATED','APPROVAL','COMMENT_ADDED','CREATE','DELETE','DOCUMENT_REPLACED','DOWNLOAD','LOGIN','LOGOUT','REJECTION','STATUS_CHANGE','UPDATE','UPLOAD') not null,
    primary key (id)
);

create table clients (
    active boolean not null,
    created_at timestamp(6) not null,
    id bigint not null,
    updated_at timestamp(6),
    address varchar(255),
    email varchar(255) not null,
    name varchar(255) not null,
    phone varchar(255),
    tax_id varchar(255) not null unique,
    clientType enum ('CARRIER','COMPANY','CONSIGNEE','INDIVIDUAL','SHIPPER') not null,
    primary key (id)
);

create table compliance_rule_configs (
    enabled boolean not null,
    id bigint not null,
    description TEXT,
    param_key varchar(255) not null,
    param_value TEXT not null,
    rule_code varchar(255) not null,
    primary key (id),
    unique (rule_code, param_key)
);

create table crossing_discrepancies (
    difference numeric(15,2),
    tariff_line_number integer,
    crossingResult_id bigint,
    id bigint not null,
    description TEXT,
    final_value varchar(255),
    preliminary_value varchar(255),
    field enum ('CIF_VALUE','FOB_VALUE','FREIGHT_VALUE','INSURANCE_VALUE','TARIFF_LINE_MISSING','TARIFF_LINE_QUANTITY','TARIFF_LINE_TAX','TARIFF_LINE_VALUE','TAXABLE_BASE','TOTAL_TAXES') not null,
    primary key (id)
);

create table crossing_results (
    created_at timestamp(6) not null,
    finalDeclaration_id bigint,
    id bigint not null,
    operation_id bigint,
    preliminaryDeclaration_id bigint,
    resolved_at timestamp(6),
    updated_at timestamp(6),
    resolution_comment TEXT,
    resolved_by varchar(255),
    status enum ('DISCREPANCY','MATCH','PENDING','RESOLVED') not null,
    primary key (id)
);

create table customer_contacts (
    receive_notifications boolean not null,
    created_at timestamp(6) not null,
    customer_id bigint,
    id bigint not null,
    updated_at timestamp(6),
    email varchar(255),
    firstName varchar(255) not null,
    identification varchar(255) not null,
    lastName varchar(255) not null,
    phone varchar(255) not null,
    contact_type enum ('ALTERNATE','PRIMARY') not null,
    primary key (id)
);

create table customers (
    active boolean not null,
    created_at timestamp(6) not null,
    id bigint not null,
    updated_at timestamp(6),
    address varchar(255),
    alternatePhone varchar(255),
    businessName varchar(255),
    country varchar(255),
    customerCode varchar(255),
    email varchar(255) not null,
    name varchar(255) not null,
    notes varchar(255),
    phone varchar(255),
    representative varchar(255),
    tax_id varchar(255) not null unique,
    customerType enum ('CARRIER','COMPANY','CONSIGNEE','INDIVIDUAL','SHIPPER') not null,
    documentType enum ('CEDULA','PASSPORT','RNC'),
    primary key (id)
);

create table declarations (
    cif_value numeric(15,2),
    cif_value_usd numeric(15,2),
    exchange_rate numeric(15,4),
    exchange_rate_date date,
    fob_value numeric(15,2),
    fob_value_usd numeric(15,2),
    freight_value numeric(15,2),
    freight_value_usd numeric(15,2),
    insurance_value numeric(15,2),
    insurance_value_usd numeric(15,2),
    taxable_base numeric(15,2),
    total_taxes numeric(15,2),
    created_at timestamp(6) not null,
    final_approved_at timestamp(6),
    id bigint not null,
    operation_id bigint,
    rejected_at timestamp(6),
    submitted_at timestamp(6),
    technical_approved_at timestamp(6),
    updated_at timestamp(6),
    declaration_number varchar(255),
    final_approval_comment TEXT,
    final_approved_by varchar(255),
    notes TEXT,
    rejected_by varchar(255),
    rejection_comment TEXT,
    technical_approval_comment TEXT,
    technical_approved_by varchar(255),
    declaration_type enum ('FINAL','PRELIMINARY') not null,
    primary key (id)
);

create table depositos (
    created_at timestamp(6) not null,
    id bigint not null,
    updated_at timestamp(6),
    code varchar(255) not null unique,
    description TEXT,
    name varchar(255) not null,
    primary key (id)
);

create table document_type_configs (
    allow_multiple boolean not null,
    created_at timestamp(6) not null,
    id bigint not null,
    updated_at timestamp(6),
    code varchar(255) not null unique,
    primary key (id)
);

create table document_versions (
    active boolean not null,
    version_number integer not null,
    created_at timestamp(6) not null,
    document_id bigint,
    file_size bigint,
    id bigint not null,
    updated_at timestamp(6),
    uploadedBy_id bigint,
    uploaded_at timestamp(6) not null,
    change_reason varchar(255),
    file_path varchar(255) not null,
    mime_type varchar(255),
    original_name varchar(255) not null,
    stored_name varchar(255) not null,
    primary key (id)
);

create table documents (
    active boolean not null,
    created_at timestamp(6) not null,
    id bigint not null,
    operation_id bigint,
    updated_at timestamp(6),
    document_type enum ('AGENCY_INVOICE','BL','CERTIFICATE','COMMERCIAL_INVOICE','FINAL_DECLARATION','INITIAL_DECLARATION','LIQUIDATION_DOCUMENT','LOCAL_CHARGES_RECEIPT','OTHER','PACKING_LIST','PAYMENT_RECEIPT','PERMIT_CERTIFICATE','RECEPTION_RECEIPT') not null,
    status enum ('OBSERVED','PENDING','REQUIRES_REPLACEMENT','VALIDATED') not null,
    primary key (id)
);

create table exchange_rate (
    active boolean not null,
    effective_date date not null,
    rate numeric(15,4) not null,
    created_at timestamp(6) not null,
    id bigint not null,
    updated_at timestamp(6),
    source varchar(255) not null,
    source_currency varchar(255) not null,
    target_currency varchar(255) not null,
    primary key (id),
    unique (source_currency, target_currency, effective_date)
);

create table service_configs (
    active boolean not null,
    sort_order integer not null,
    created_at timestamp(6) not null,
    id bigint not null,
    updated_at timestamp(6),
    label_en varchar(255) not null,
    label_es varchar(255) not null,
    name varchar(255) not null unique,
    primary key (id)
);

create table service_config_modules (
    service_config_id bigint not null,
    module varchar(255) not null,
    primary key (service_config_id, module),
    foreign key (service_config_id) references service_configs(id)
);

create table external_permits (
    expiry_date date,
    issued_date date,
    created_at timestamp(6) not null,
    id bigint not null,
    operation_id bigint,
    updated_at timestamp(6),
    notes TEXT,
    reference_number varchar(255),
    updated_by varchar(255),
    permit_type enum ('DPH','DPW','FDA','PORTCOLLECT','VUCE') not null,
    status enum ('APROBADO','EN_TRAMITE','PENDIENTE','RECHAZADO') not null,
    primary key (id)
);

create table inspection_expenses (
    active boolean not null,
    amount numeric(15,2) not null,
    expense_date date,
    invoice_date date,
    quantity INT DEFAULT 1 NOT NULL,
    rate numeric(15,4),
    reimbursable boolean not null,
    show_on_documents BOOLEAN DEFAULT TRUE NOT NULL,
    update_related BOOLEAN DEFAULT FALSE NOT NULL,
    billflow_invoice_id bigint,
    created_at timestamp(6) not null,
    id bigint not null,
    operation_id bigint,
    registeredBy_id bigint,
    updated_at timestamp(6),
    ncf_number varchar(50),
    units varchar(50),
    invoice_number varchar(100),
    reference_number_charge varchar(100),
    bill_to_name varchar(255),
    category varchar(255) not null,
    currency varchar(255) not null,
    description TEXT,
    justification TEXT,
    notes TEXT,
    responsable varchar(255),
    bill_to_type enum ('COMPANY','CONSIGNEE','INDIVIDUAL'),
    billing_status VARCHAR(20) DEFAULT 'NONE' NOT NULL,
    charge_type VARCHAR(20) DEFAULT 'EXPENSE' NOT NULL,
    paymentStatus enum ('PAID','PENDING'),
    payment_type enum ('COLLECT','PREPAID'),
    primary key (id)
);

create table inspection_photos (
    active boolean not null,
    created_at timestamp(6) not null,
    file_size bigint,
    id bigint not null,
    operation_id bigint,
    updated_at timestamp(6),
    uploadedBy_id bigint,
    caption TEXT,
    file_path varchar(255) not null,
    mime_type varchar(255),
    original_name varchar(255) not null,
    stored_name varchar(255) not null,
    primary key (id)
);

create table liquidation_lines (
    amount numeric(15,2) not null,
    base_amount numeric(15,2),
    line_order integer,
    rate numeric(8,4),
    reimbursable boolean not null,
    id bigint not null,
    liquidation_id bigint,
    concept varchar(255) not null,
    description TEXT,
    charge_type enum ('EXPENSE','INCOME'),
    primary key (id)
);

create table liquidations (
    grand_total numeric(15,2),
    total_agency_services numeric(15,2),
    total_customs_taxes numeric(15,2),
    total_third_party numeric(15,2),
    approved_at timestamp(6),
    created_at timestamp(6) not null,
    declaration_id bigint,
    id bigint not null,
    operation_id bigint,
    updated_at timestamp(6),
    approval_comment TEXT,
    approved_by varchar(255),
    dga_payment_code varchar(255),
    status enum ('APPROVED','DEFINITIVE','PAID','PRELIMINARY') not null,
    primary key (id)
);

create table notifications (
    created_at timestamp(6) not null,
    id bigint not null,
    operation_id bigint,
    sent_at timestamp(6),
    body TEXT not null,
    error_message varchar(255),
    recipient_email varchar(255) not null,
    subject varchar(255) not null,
    status enum ('FAILED','PENDING','SENT') not null,
    primary key (id)
);

create table operation_comments (
    internal boolean not null,
    author_id bigint,
    created_at timestamp(6) not null,
    id bigint not null,
    operation_id bigint,
    content TEXT not null,
    primary key (id)
);

create table operations (
    declared_value numeric(15,2),
    gross_weight numeric(15,3),
    local_charges_validated boolean,
    pieces integer,
    volume numeric(15,3),
    volumetric_weight numeric(15,3),
    arrivalPort_id bigint,
    arrival_date timestamp(6),
    assignedAgent_id bigint,
    closed_at timestamp(6),
    created_at timestamp(6) not null,
    customer_id bigint,
    deposito_id bigint,
    estimated_arrival timestamp(6),
    id bigint not null,
    inspection_set_at timestamp(6),
    originPort_id bigint,
    updated_at timestamp(6),
    valuation_finalized_at timestamp(6),
    incoterm varchar(10),
    bl_number varchar(255),
    child_bl_number varchar(255),
    container_number varchar(255),
    notes TEXT,
    reference_number varchar(255) not null unique,
    bl_availability enum ('ENDORSED','NOT_AVAILABLE','ORIGINAL'),
    bl_type enum ('CONSOLIDATED','SIMPLE'),
    cargo_type enum ('FCL','LCL'),
    inspection_type enum ('EXPRESO','FISICA','VISUAL'),
    operation_category enum ('CATEGORY_1','CATEGORY_2','CATEGORY_3') not null,
    operation_type enum ('EXPORT','IMPORT') not null,
    status enum ('ANALYST_ASSIGNED','CANCELLED','CLOSED','DECLARATION_IN_PROGRESS','DOCUMENTATION_COMPLETE','DRAFT','IN_REVIEW','IN_TRANSIT','PAYMENT_PREPARATION','PENDING_CORRECTION','PENDING_EXTERNAL_APPROVAL','PRELIQUIDATION_REVIEW','SUBMITTED_TO_CUSTOMS','VALUATION_REVIEW') not null,
    transport_mode enum ('AIR','MARITIME') not null,
    primary key (id)
);

create table payments (
    amount numeric(15,2) not null,
    payment_date date not null,
    created_at timestamp(6) not null,
    id bigint not null,
    liquidation_id bigint unique,
    operation_id bigint,
    updated_at timestamp(6),
    bank_reference varchar(255),
    dga_reference varchar(255),
    notes TEXT,
    registered_by varchar(255),
    payment_method enum ('BANK_TRANSFER','CASH','CHECK','ELECTRONIC') not null,
    primary key (id)
);

create table ports (
    arrivalPort BOOLEAN DEFAULT TRUE not null,
    country varchar(2),
    originPort BOOLEAN DEFAULT TRUE not null,
    created_at timestamp(6) not null,
    id bigint not null,
    updated_at timestamp(6),
    address TEXT,
    code varchar(255) not null unique,
    description TEXT,
    name varchar(255) not null,
    primary key (id)
);

create table status_history (
    changedBy_id bigint,
    changed_at timestamp(6) not null,
    id bigint not null,
    operation_id bigint,
    comment TEXT,
    ip_address varchar(255),
    new_status enum ('ANALYST_ASSIGNED','CANCELLED','CLOSED','DECLARATION_IN_PROGRESS','DOCUMENTATION_COMPLETE','DRAFT','IN_REVIEW','IN_TRANSIT','PAYMENT_PREPARATION','PENDING_CORRECTION','PENDING_EXTERNAL_APPROVAL','PRELIQUIDATION_REVIEW','SUBMITTED_TO_CUSTOMS','VALUATION_REVIEW') not null,
    previous_status enum ('ANALYST_ASSIGNED','CANCELLED','CLOSED','DECLARATION_IN_PROGRESS','DOCUMENTATION_COMPLETE','DRAFT','IN_REVIEW','IN_TRANSIT','PAYMENT_PREPARATION','PENDING_CORRECTION','PENDING_EXTERNAL_APPROVAL','PRELIQUIDATION_REVIEW','SUBMITTED_TO_CUSTOMS','VALUATION_REVIEW'),
    primary key (id)
);

create table tariff_lines (
    admin_fee numeric(15,2),
    duty_amount numeric(15,2),
    duty_rate numeric(8,4),
    itbis_amount numeric(15,2),
    itbis_rate numeric(8,4),
    line_number integer not null,
    quantity numeric(15,4),
    selective_amount numeric(15,2),
    selective_rate numeric(8,4),
    surcharge_amount numeric(15,2),
    surcharge_rate numeric(8,4),
    tax_amount numeric(15,2),
    tax_rate numeric(8,4),
    total_value numeric(15,2),
    unit_value numeric(15,2),
    declaration_id bigint,
    id bigint not null,
    description TEXT,
    tariff_code varchar(255) not null,
    primary key (id)
);

create table user_roles (
    user_id bigint not null,
    role varchar(255)
);

create table users (
    active boolean not null,
    created_at timestamp(6) not null,
    customer_id bigint,
    id bigint not null,
    updated_at timestamp(6),
    email varchar(255) not null,
    full_name varchar(255) not null,
    password varchar(255) not null,
    username varchar(255) not null unique,
    primary key (id)
);

-- Foreign keys
alter table if exists alerts add constraint FKti7ic8wbhwg5myklx8gyudmdu foreign key (operation_id) references operations;
alter table if exists crossing_discrepancies add constraint FKsx2aoj7rq7odyv4pmpku51c3f foreign key (crossingResult_id) references crossing_results;
alter table if exists crossing_results add constraint FK6hav65ol0th9ftsc4hevvx765 foreign key (finalDeclaration_id) references declarations;
alter table if exists crossing_results add constraint FK8kdcktj2e5xcwdr8snag6jy07 foreign key (operation_id) references operations;
alter table if exists crossing_results add constraint FKn66h6j96kremu817w4en98m74 foreign key (preliminaryDeclaration_id) references declarations;
alter table if exists customer_contacts add constraint FK729j9cwisdda2ecw8hq5b9vy4 foreign key (customer_id) references customers;
alter table if exists declarations add constraint FKd5u7kua4xn837muqe49maavhm foreign key (operation_id) references operations;
alter table if exists document_versions add constraint FKi6p7dgv96b8s8ivf84hqo9pt foreign key (document_id) references documents;
alter table if exists document_versions add constraint FK45vb1rpdln7ak28mh3vcfp2l6 foreign key (uploadedBy_id) references users;
alter table if exists documents add constraint FKo1332uikbn9n4pp69hrcaagxs foreign key (operation_id) references operations;
alter table if exists external_permits add constraint FKgywuqssefmam144x9c3c6lv2w foreign key (operation_id) references operations;
alter table if exists inspection_expenses add constraint FKj238vdi25wqfjv3xkrh995yko foreign key (operation_id) references operations;
alter table if exists inspection_expenses add constraint FK5u2icga11p16al657ibdhx788 foreign key (registeredBy_id) references users;
alter table if exists inspection_photos add constraint FKbf0m5julh1hgenq53nsetlnkg foreign key (operation_id) references operations;
alter table if exists inspection_photos add constraint FKfh9287s8olfrni0egl0ohgnxo foreign key (uploadedBy_id) references users;
alter table if exists liquidation_lines add constraint FKt5kcbpl0invfjvi0n4ld6kqv0 foreign key (liquidation_id) references liquidations;
alter table if exists liquidations add constraint FKnj6s3nrw8gpcxn08lju21cced foreign key (declaration_id) references declarations;
alter table if exists liquidations add constraint FK16d3ku4j6l98yju621gug19vh foreign key (operation_id) references operations;
alter table if exists operation_comments add constraint FK6m976k7d0mso8qwhc6qyaxpno foreign key (author_id) references users;
alter table if exists operation_comments add constraint FKgvs8waillmsaaif2rhiglo2f7 foreign key (operation_id) references operations;
alter table if exists operations add constraint FKaeqmfjxl3ykc1erys1jufwi86 foreign key (arrivalPort_id) references ports;
alter table if exists operations add constraint FKjfwwqvlnjjdmf7v1b0rm3clwc foreign key (assignedAgent_id) references users;
alter table if exists operations add constraint FKay1h9lvf5jbch3mbwnohsshuy foreign key (customer_id) references customers;
alter table if exists operations add constraint FK3s1my4vddcmdie5mp5kfapd9q foreign key (deposito_id) references depositos;
alter table if exists operations add constraint FKmu5wxioks49hfxbdr4qutf75a foreign key (originPort_id) references ports;
alter table if exists payments add constraint FKo5c8q0f1pm48xdfwgi4eyql1l foreign key (liquidation_id) references liquidations;
alter table if exists payments add constraint FKt7jghbw32qd81enwq2bg856eo foreign key (operation_id) references operations;
alter table if exists status_history add constraint FKky5buxg776t9wa865bs31blw1 foreign key (changedBy_id) references users;
alter table if exists status_history add constraint FKas92y0cgcogid0br0yinnj8q6 foreign key (operation_id) references operations;
alter table if exists tariff_lines add constraint FK2w3vy6j1c05hogmjrxh1cmhd2 foreign key (declaration_id) references declarations;
alter table if exists user_roles add constraint FKhfh9dx7w3ubf1co1vdev94g3f foreign key (user_id) references users;
