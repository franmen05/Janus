package com.janus.compliance.domain.service;

import com.janus.compliance.domain.model.ValidationResult;
import com.janus.document.domain.model.Document;
import com.janus.operation.domain.model.CargoType;
import com.janus.operation.domain.model.InspectionType;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationStatus;
import java.util.List;

public interface ComplianceRule {

    String ruleCode();

    boolean appliesTo(OperationStatus from, OperationStatus to, CargoType cargo, InspectionType inspection);

    ValidationResult validate(Operation operation, List<Document> documents);
}
