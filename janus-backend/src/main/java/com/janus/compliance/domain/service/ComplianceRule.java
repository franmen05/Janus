package com.janus.compliance.domain.service;

import com.janus.compliance.domain.model.ValidationResult;
import com.janus.document.domain.model.Document;
import com.janus.operation.domain.model.OperationCategory;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationStatus;
import com.janus.operation.domain.model.TransportMode;
import java.util.List;

public interface ComplianceRule {

    String ruleCode();

    boolean appliesTo(OperationStatus from, OperationStatus to, TransportMode transportMode, OperationCategory category);

    ValidationResult validate(Operation operation, List<Document> documents);
}
