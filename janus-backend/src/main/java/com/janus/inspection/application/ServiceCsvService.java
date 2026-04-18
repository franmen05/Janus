package com.janus.inspection.application;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.inspection.domain.model.ServiceConfig;
import com.janus.inspection.domain.model.ServiceModule;
import com.janus.inspection.domain.repository.ServiceConfigRepository;
import com.janus.shared.api.dto.CsvImportResponse;
import com.janus.shared.infrastructure.util.CsvUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import org.jboss.logging.Logger;

@ApplicationScoped
public class ServiceCsvService {

    private static final Logger LOG = Logger.getLogger(ServiceCsvService.class);
    static final String HEADER = "name,labelEs,labelEn,sortOrder,appliesTo,defaultPrice,defaultCurrency";

    @Inject
    ServiceConfigRepository serviceConfigRepository;

    @Inject
    Event<AuditEvent> auditEvent;

    @Transactional
    public String exportCsv() {
        List<ServiceConfig> services = serviceConfigRepository.findAllOrdered();
        var sb = new StringBuilder(HEADER).append("\r\n");
        for (var s : services) {
            String appliesToValue = s.appliesTo == null || s.appliesTo.isEmpty()
                    ? ""
                    : String.join(";", s.appliesTo.stream().map(Enum::name).sorted().toList());
            String defaultPriceValue = s.defaultPrice == null ? "" : s.defaultPrice.toPlainString();
            String defaultCurrencyValue = s.defaultCurrency == null ? "" : s.defaultCurrency;
            sb.append(CsvUtil.escape(s.name)).append(",")
              .append(CsvUtil.escape(s.labelEs)).append(",")
              .append(CsvUtil.escape(s.labelEn)).append(",")
              .append(s.sortOrder).append(",")
              .append(CsvUtil.escape(appliesToValue)).append(",")
              .append(CsvUtil.escape(defaultPriceValue)).append(",")
              .append(CsvUtil.escape(defaultCurrencyValue)).append("\r\n");
        }
        return sb.toString();
    }

    @Transactional
    public CsvImportResponse importCsv(InputStream in, String username) throws IOException {
        List<List<String>> rows = CsvUtil.parseLines(in);
        int imported = 0, skipped = 0;
        List<String> errors = new ArrayList<>();
        int rowNum = 1; // 1-based (header is row 0)
        for (var fields : rows) {
            rowNum++;
            if (fields.size() < 3) {
                errors.add("Row " + rowNum + ": insufficient columns");
                skipped++;
                continue;
            }
            String name = fields.get(0).trim();
            String labelEs = fields.get(1).trim();
            String labelEn = fields.get(2).trim();
            if (name.isBlank()) {
                errors.add("Row " + rowNum + ": name is required");
                skipped++;
                continue;
            }
            if (labelEs.isBlank()) {
                errors.add("Row " + rowNum + ": labelEs is required");
                skipped++;
                continue;
            }
            if (labelEn.isBlank()) {
                errors.add("Row " + rowNum + ": labelEn is required");
                skipped++;
                continue;
            }
            if (serviceConfigRepository.findByName(name).isPresent()) {
                errors.add("Row " + rowNum + ": duplicate name '" + name + "'");
                skipped++;
                continue;
            }
            int sortOrder = 0;
            if (fields.size() > 3 && !fields.get(3).isBlank()) {
                try {
                    sortOrder = Integer.parseInt(fields.get(3).trim());
                } catch (NumberFormatException e) {
                    errors.add("Row " + rowNum + ": sortOrder must be an integer");
                    skipped++;
                    continue;
                }
            }
            var appliesTo = EnumSet.allOf(ServiceModule.class);
            if (fields.size() > 4 && !fields.get(4).isBlank()) {
                var moduleSet = EnumSet.noneOf(ServiceModule.class);
                boolean invalidModule = false;
                for (String part : fields.get(4).split(";")) {
                    String moduleName = part.trim();
                    if (moduleName.isBlank()) continue;
                    try {
                        moduleSet.add(ServiceModule.valueOf(moduleName));
                    } catch (IllegalArgumentException e) {
                        errors.add("Row " + rowNum + ": invalid module '" + moduleName + "'");
                        invalidModule = true;
                        break;
                    }
                }
                if (invalidModule) {
                    skipped++;
                    continue;
                }
                if (!moduleSet.isEmpty()) {
                    appliesTo = moduleSet;
                }
            }
            BigDecimal defaultPrice = null;
            if (fields.size() > 5 && !fields.get(5).isBlank()) {
                try {
                    defaultPrice = new BigDecimal(fields.get(5).trim());
                } catch (NumberFormatException e) {
                    errors.add("Row " + rowNum + ": defaultPrice must be a number");
                    skipped++;
                    continue;
                }
            }
            String defaultCurrency = null;
            if (fields.size() > 6 && !fields.get(6).isBlank()) {
                defaultCurrency = fields.get(6).trim();
            }
            var config = new ServiceConfig();
            config.name = name;
            config.labelEs = labelEs;
            config.labelEn = labelEn;
            config.sortOrder = sortOrder;
            config.appliesTo = appliesTo;
            config.defaultPrice = defaultPrice;
            config.defaultCurrency = defaultCurrency;
            config.active = true;
            serviceConfigRepository.persist(config);
            auditEvent.fire(new AuditEvent(username, AuditAction.CREATE, "ServiceConfig", config.id, null, null, null,
                    "Service imported via CSV: " + config.name));
            imported++;
        }
        return new CsvImportResponse(imported, skipped, errors);
    }
}
