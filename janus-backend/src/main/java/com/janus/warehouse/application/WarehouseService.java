package com.janus.warehouse.application;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.warehouse.api.dto.CreateWarehouseRequest;
import com.janus.warehouse.domain.model.Warehouse;
import com.janus.warehouse.domain.repository.WarehouseRepository;
import com.janus.operation.domain.repository.OperationRepository;
import com.janus.shared.infrastructure.exception.BusinessException;
import com.janus.shared.infrastructure.exception.ConflictException;
import com.janus.shared.infrastructure.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class WarehouseService {

    @Inject
    WarehouseRepository warehouseRepository;

    @Inject
    Event<AuditEvent> auditEvent;

    @Inject
    OperationRepository operationRepository;

    public List<Warehouse> listAll(boolean includeInactive) {
        if (includeInactive) {
            return warehouseRepository.findAllOrdered();
        }
        return warehouseRepository.findAllActive();
    }

    public Warehouse findById(Long id) {
        return warehouseRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Warehouse", id));
    }

    @Transactional
    public Warehouse create(CreateWarehouseRequest request, String username) {
        if (warehouseRepository.findByCode(request.code()).isPresent()) {
            throw new BusinessException("WAREHOUSE_CODE_ALREADY_EXISTS", "Warehouse with code already exists: " + request.code());
        }

        var warehouse = new Warehouse();
        warehouse.code = request.code();
        warehouse.name = request.name();
        warehouse.description = request.description();
        warehouse.secuencia = request.secuencia();
        warehouse.tipoLocalizacion = request.tipoLocalizacion();
        warehouse.centroLogistico = request.centroLogistico();
        warehouse.ubicacionArea = request.ubicacionArea();
        warehouse.paisOrigen = request.paisOrigen();
        warehouseRepository.persist(warehouse);
        auditEvent.fire(new AuditEvent(username, AuditAction.CREATE, "Warehouse", warehouse.id, null, null, null, "Warehouse created: " + warehouse.name));
        return warehouse;
    }

    @Transactional
    public Warehouse update(Long id, CreateWarehouseRequest request, String username) {
        var warehouse = findById(id);

        warehouseRepository.findByCode(request.code()).ifPresent(existing -> {
            if (!existing.id.equals(warehouse.id)) {
                throw new BusinessException("WAREHOUSE_CODE_ALREADY_EXISTS", "Warehouse with code already exists: " + request.code());
            }
        });

        warehouse.code = request.code();
        warehouse.name = request.name();
        warehouse.description = request.description();
        warehouse.secuencia = request.secuencia();
        warehouse.tipoLocalizacion = request.tipoLocalizacion();
        warehouse.centroLogistico = request.centroLogistico();
        warehouse.ubicacionArea = request.ubicacionArea();
        warehouse.paisOrigen = request.paisOrigen();
        auditEvent.fire(new AuditEvent(username, AuditAction.UPDATE, "Warehouse", warehouse.id, null, null, null, "Warehouse updated: " + warehouse.name));
        return warehouse;
    }

    @Transactional
    public Warehouse toggleActive(Long id, String username) {
        var warehouse = findById(id);
        warehouse.active = !warehouse.active;
        var action = warehouse.active ? "activated" : "deactivated";
        auditEvent.fire(new AuditEvent(username, AuditAction.UPDATE, "Warehouse", warehouse.id, null, null, null,
                "Warehouse " + action + ": " + warehouse.name));
        return warehouse;
    }

    @Transactional
    public void delete(Long id, String username) {
        var warehouse = findById(id);
        long opCount = operationRepository.countByWarehouseId(id);
        if (opCount > 0) {
            throw new ConflictException("WAREHOUSE_HAS_OPERATIONS",
                    "Cannot delete warehouse with existing operations: " + warehouse.code);
        }
        auditEvent.fire(new AuditEvent(username, AuditAction.DELETE, "Warehouse", warehouse.id, null, null, null,
                "Warehouse deleted: " + warehouse.name));
        warehouseRepository.delete(warehouse);
    }
}
