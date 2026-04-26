package com.janus.account.application;

import com.janus.account.domain.model.Account;
import com.janus.account.domain.model.AccountType;
import com.janus.account.domain.model.DocumentType;
import com.janus.account.domain.repository.AccountRepository;
import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.shared.api.dto.CsvImportResponse;
import com.janus.shared.infrastructure.util.CsvUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class AccountCsvService {

    static final String HEADER = "name,taxId,email,accountTypes,phone,address,businessName,representative,documentType,alternatePhone,country,accountCode,notes";

    @Inject
    AccountRepository accountRepository;

    @Inject
    Event<AuditEvent> auditEvent;

    @Transactional
    public String exportCsv() {
        List<Account> accounts = accountRepository.find("active = true ORDER BY name").list();
        var sb = new StringBuilder(HEADER).append("\r\n");
        for (var a : accounts) {
            String types = a.accountTypes == null || a.accountTypes.isEmpty()
                    ? ""
                    : a.accountTypes.stream().map(AccountType::name).collect(Collectors.joining(";"));
            sb.append(CsvUtil.escape(a.name)).append(",")
              .append(CsvUtil.escape(a.taxId)).append(",")
              .append(CsvUtil.escape(a.email)).append(",")
              .append(CsvUtil.escape(types)).append(",")
              .append(CsvUtil.escape(a.phone)).append(",")
              .append(CsvUtil.escape(a.address)).append(",")
              .append(CsvUtil.escape(a.businessName)).append(",")
              .append(CsvUtil.escape(a.representative)).append(",")
              .append(CsvUtil.escape(a.documentType != null ? a.documentType.name() : null)).append(",")
              .append(CsvUtil.escape(a.alternatePhone)).append(",")
              .append(CsvUtil.escape(a.country)).append(",")
              .append(CsvUtil.escape(a.accountCode)).append(",")
              .append(CsvUtil.escape(a.notes)).append("\r\n");
        }
        return sb.toString();
    }

    @Transactional
    public CsvImportResponse importCsv(InputStream in, String username) throws IOException {
        List<List<String>> rows = CsvUtil.parseLines(in);
        int imported = 0, updated = 0, duplicates = 0, skipped = 0;
        List<String> errors = new ArrayList<>();
        int rowNum = 1; // 1-based (header is row 0)
        for (var fields : rows) {
            rowNum++;
            String name = fields.size() > 0 ? fields.get(0).trim() : "";
            String taxId = fields.size() > 1 ? fields.get(1).trim() : "";
            String emailRaw = fields.size() > 2 ? fields.get(2).trim() : "";
            String email = emailRaw.isBlank() ? null : emailRaw;

            if (name.isBlank()) {
                errors.add("Row " + rowNum + ": name is required");
                skipped++;
                continue;
            }

            String accountCodeEarly = fields.size() > 11 ? fields.get(11).trim() : "";
            if (taxId.isBlank()) {
                if (accountCodeEarly.isBlank()) {
                    errors.add("Row " + rowNum + ": taxId or accountCode is required");
                    skipped++;
                    continue;
                }
                taxId = accountCodeEarly;
            }

            // Parse accountTypes (semicolon-separated)
            String accountTypesRaw = fields.size() > 3 ? fields.get(3).trim() : "";
            Set<AccountType> accountTypes = new HashSet<>();
            boolean typeError = false;
            if (!accountTypesRaw.isBlank()) {
                for (String typeStr : accountTypesRaw.split(";")) {
                    String t = typeStr.trim();
                    if (t.isBlank()) continue;
                    try {
                        accountTypes.add(AccountType.valueOf(t));
                    } catch (IllegalArgumentException e) {
                        errors.add("Row " + rowNum + ": invalid accountType '" + t + "'");
                        typeError = true;
                        break;
                    }
                }
            }
            if (typeError) {
                skipped++;
                continue;
            }

            // Parse documentType
            String documentTypeRaw = fields.size() > 8 ? fields.get(8).trim() : "";
            DocumentType documentType = null;
            if (!documentTypeRaw.isBlank()) {
                try {
                    documentType = DocumentType.valueOf(documentTypeRaw);
                } catch (IllegalArgumentException e) {
                    errors.add("Row " + rowNum + ": invalid documentType '" + documentTypeRaw + "'");
                    skipped++;
                    continue;
                }
            }

            String phone = fields.size() > 4 && !fields.get(4).isBlank() ? fields.get(4).trim() : null;
            String address = fields.size() > 5 && !fields.get(5).isBlank() ? fields.get(5).trim() : null;
            String businessName = fields.size() > 6 && !fields.get(6).isBlank() ? fields.get(6).trim() : null;
            String representative = fields.size() > 7 && !fields.get(7).isBlank() ? fields.get(7).trim() : null;
            String alternatePhone = fields.size() > 9 && !fields.get(9).isBlank() ? fields.get(9).trim() : null;
            String country = fields.size() > 10 && !fields.get(10).isBlank() ? fields.get(10).trim() : null;
            String accountCode = fields.size() > 11 && !fields.get(11).isBlank() ? fields.get(11).trim() : null;
            String notes = fields.size() > 12 && !fields.get(12).isBlank() ? fields.get(12).trim() : null;

            var existingOpt = accountRepository.findByTaxId(taxId);
            if (existingOpt.isPresent()) {
                var existing = existingOpt.get();
                boolean changed = false;
                if (!stringEquals(existing.name, name)) { existing.name = name; changed = true; }
                if (!stringEquals(existing.email, email)) { existing.email = email; changed = true; }
                if (!stringEquals(existing.phone, phone)) { existing.phone = phone; changed = true; }
                if (!stringEquals(existing.address, address)) { existing.address = address; changed = true; }
                if (!stringEquals(existing.businessName, businessName)) { existing.businessName = businessName; changed = true; }
                if (!stringEquals(existing.representative, representative)) { existing.representative = representative; changed = true; }
                if (existing.documentType != documentType) { existing.documentType = documentType; changed = true; }
                if (!stringEquals(existing.alternatePhone, alternatePhone)) { existing.alternatePhone = alternatePhone; changed = true; }
                if (!stringEquals(existing.country, country)) { existing.country = country; changed = true; }
                if (!stringEquals(existing.accountCode, accountCode)) { existing.accountCode = accountCode; changed = true; }
                if (!stringEquals(existing.notes, notes)) { existing.notes = notes; changed = true; }
                Set<AccountType> existingTypes = existing.accountTypes == null ? new HashSet<>() : new HashSet<>(existing.accountTypes);
                if (!existingTypes.equals(accountTypes)) { existing.accountTypes = accountTypes; changed = true; }

                if (changed) {
                    auditEvent.fire(new AuditEvent(username, AuditAction.UPDATE, "Account", existing.id, null, null, null,
                            "Account updated via CSV: " + existing.name));
                    updated++;
                } else {
                    duplicates++;
                }
                continue;
            }

            var account = new Account();
            account.name = name;
            account.taxId = taxId;
            account.email = email;
            account.accountTypes = accountTypes;
            account.phone = phone;
            account.address = address;
            account.businessName = businessName;
            account.representative = representative;
            account.documentType = documentType;
            account.alternatePhone = alternatePhone;
            account.country = country;
            account.accountCode = accountCode;
            account.notes = notes;
            account.active = true;
            accountRepository.persist(account);
            auditEvent.fire(new AuditEvent(username, AuditAction.CREATE, "Account", account.id, null, null, null,
                    "Account imported via CSV: " + account.name));
            imported++;
        }
        return new CsvImportResponse(imported, updated, duplicates, skipped, errors);
    }

    private static String normalize(String s) {
        if (s == null) return "";
        return s.trim();
    }

    private static boolean stringEquals(String a, String b) {
        return normalize(a).equals(normalize(b));
    }
}
