package com.janus.warehouse.application;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.shared.api.dto.CsvImportResponse;
import com.janus.shared.infrastructure.util.CsvUtil;
import com.janus.warehouse.domain.model.Warehouse;
import com.janus.warehouse.domain.repository.WarehouseRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class WarehouseCsvService {

    static final String HEADER = "code,name,description,secuencia,tipoLocalizacion,centroLogistico,ubicacionArea,paisOrigen";

    @Inject
    WarehouseRepository warehouseRepository;

    @Inject
    Event<AuditEvent> auditEvent;

    public String exportCsv(boolean includeInactive) {
        List<Warehouse> warehouses = includeInactive
                ? warehouseRepository.findAllOrdered()
                : warehouseRepository.findAllActive();
        var sb = new StringBuilder(HEADER).append("\r\n");
        for (var w : warehouses) {
            sb.append(CsvUtil.escape(w.code)).append(",")
              .append(CsvUtil.escape(w.name)).append(",")
              .append(CsvUtil.escape(w.description)).append(",")
              .append(w.secuencia != null ? w.secuencia : "").append(",")
              .append(CsvUtil.escape(w.tipoLocalizacion)).append(",")
              .append(CsvUtil.escape(w.centroLogistico)).append(",")
              .append(CsvUtil.escape(w.ubicacionArea)).append(",")
              .append(CsvUtil.escape(w.paisOrigen)).append("\r\n");
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
            if (fields.size() < 2) {
                errors.add("Row " + rowNum + ": insufficient columns");
                skipped++;
                continue;
            }
            String code = fields.get(0).trim();
            String name = fields.get(1).trim();
            if (code.isBlank()) {
                errors.add("Row " + rowNum + ": code is required");
                skipped++;
                continue;
            }
            if (name.isBlank()) {
                errors.add("Row " + rowNum + ": name is required");
                skipped++;
                continue;
            }
            if (warehouseRepository.findByCode(code).isPresent()) {
                errors.add("Row " + rowNum + ": code '" + code + "' already exists");
                skipped++;
                continue;
            }
            Integer secuencia = null;
            if (fields.size() > 3 && !fields.get(3).isBlank()) {
                try {
                    secuencia = Integer.parseInt(fields.get(3).trim());
                } catch (NumberFormatException e) {
                    errors.add("Row " + rowNum + ": secuencia must be an integer");
                    skipped++;
                    continue;
                }
            }
            var warehouse = new Warehouse();
            warehouse.code = code;
            warehouse.name = name;
            warehouse.description = fields.size() > 2 && !fields.get(2).isBlank() ? fields.get(2) : null;
            warehouse.secuencia = secuencia;
            warehouse.tipoLocalizacion = fields.size() > 4 && !fields.get(4).isBlank() ? fields.get(4) : null;
            warehouse.centroLogistico = fields.size() > 5 && !fields.get(5).isBlank() ? fields.get(5) : null;
            warehouse.ubicacionArea = fields.size() > 6 && !fields.get(6).isBlank() ? fields.get(6) : null;
            warehouse.paisOrigen = fields.size() > 7 && !fields.get(7).isBlank() ? fields.get(7) : null;
            warehouse.active = true;
            warehouseRepository.persist(warehouse);
            auditEvent.fire(new AuditEvent(username, AuditAction.CREATE, "Warehouse", warehouse.id, null, null, null,
                    "Warehouse imported via CSV: " + warehouse.name));
            imported++;
        }
        return new CsvImportResponse(imported, skipped, errors);
    }
}
