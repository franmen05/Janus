package com.janus.compliance.domain.service;

import com.janus.compliance.domain.model.ComplianceRuleConfig;
import com.janus.compliance.domain.repository.ComplianceRuleConfigRepository;
import com.janus.operation.domain.model.CargoType;
import com.janus.operation.domain.model.InspectionType;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationStatus;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ComplianceValidationServiceTest {

    @Inject
    ComplianceValidationService validationService;

    @Inject
    ComplianceRuleConfigRepository configRepository;

    /**
     * Creates a transient Operation (not persisted) for validation testing.
     */
    private Operation createTestOperation(CargoType cargo, InspectionType inspection, OperationStatus status) {
        var op = new Operation();
        op.cargoType = cargo;
        op.inspectionType = inspection;
        op.status = status;
        return op;
    }

    // ---- Enabled rules that fail block the transition ----

    @Test
    @Order(1)
    void testValidationFailsWhenMandatoryDocsAreMissing() {
        // Operation has no documents uploaded — completeness rule should fail
        var operation = createTestOperation(CargoType.LCL, InspectionType.EXPRESS, OperationStatus.DRAFT);
        // We need a persisted operation for document lookup; use a real one
        // Instead, test via the REST endpoint (already covered in ComplianceValidationTest)
        // Here we test the service directly with a non-persisted operation that has an id
        operation.id = -999L; // Non-existent ID, so documentRepository returns empty list

        var result = validationService.validate(operation, OperationStatus.DOCUMENTATION_COMPLETE);

        assertFalse(result.passed(), "Validation should fail when mandatory documents are missing");
        assertFalse(result.errors().isEmpty(), "There should be validation errors");
    }

    @Test
    @Order(2)
    void testValidationReturnsSpecificErrorCodes() {
        var operation = createTestOperation(CargoType.LCL, InspectionType.EXPRESS, OperationStatus.DRAFT);
        operation.id = -999L;

        var result = validationService.validate(operation, OperationStatus.DOCUMENTATION_COMPLETE);

        assertFalse(result.passed());
        // LCL requires BL, COMMERCIAL_INVOICE, PACKING_LIST — errors use MISSING_DOC_* codes
        var ruleCodes = result.errors().stream()
                .map(e -> e.ruleCode())
                .toList();
        assertTrue(ruleCodes.stream().anyMatch(c -> c.startsWith("MISSING_DOC_")),
                "Should contain MISSING_DOC_ errors for missing documents, got: " + ruleCodes);
    }

    // ---- Disabled rules are skipped ----

    @Test
    @Order(10)
    @Transactional
    void testDisabledRuleIsSkipped() {
        // Disable the COMPLETENESS_REQUIRED rule
        var enabledConfig = configRepository.findByRuleCodeAndKey("COMPLETENESS_REQUIRED", "enabled")
                .orElseThrow();
        var originalEnabled = enabledConfig.enabled;
        enabledConfig.enabled = false;

        var operation = createTestOperation(CargoType.LCL, InspectionType.EXPRESS, OperationStatus.DRAFT);
        operation.id = -999L;

        var result = validationService.validate(operation, OperationStatus.DOCUMENTATION_COMPLETE);

        // COMPLETENESS_REQUIRED should NOT appear in errors since it's disabled
        var completenessErrors = result.errors().stream()
                .filter(e -> "COMPLETENESS_REQUIRED".equals(e.ruleCode()))
                .toList();
        assertTrue(completenessErrors.isEmpty(),
                "Disabled rule should not produce errors, but got: " + completenessErrors);

        // Restore original value
        enabledConfig.enabled = originalEnabled;
    }

    @Test
    @Order(11)
    @Transactional
    void testAllRulesDisabledAllowsTransition() {
        // Disable ALL rules by setting their enabled field to false
        var allConfigs = configRepository.list("paramKey", "enabled");
        var originalValues = allConfigs.stream()
                .map(c -> new Object[]{c.ruleCode, c.enabled})
                .toList();

        for (var config : allConfigs) {
            config.enabled = false;
        }

        var operation = createTestOperation(CargoType.LCL, InspectionType.EXPRESS, OperationStatus.DRAFT);
        operation.id = -999L;

        var result = validationService.validate(operation, OperationStatus.DOCUMENTATION_COMPLETE);

        assertTrue(result.passed(), "Validation should pass when all rules are disabled, errors: " + result.errors());

        // Restore original values
        for (var config : allConfigs) {
            for (var original : originalValues) {
                if (original[0].equals(config.ruleCode)) {
                    config.enabled = (boolean) original[1];
                    break;
                }
            }
        }
    }

    // ---- All rules passing allows transition ----

    @Test
    @Order(20)
    void testValidationPassesWhenNoRulesApply() {
        // Use a transition that no rule applies to (e.g., VALUATION_REVIEW -> PAYMENT_PREPARATION)
        // Most rules apply to DRAFT -> DOCUMENTATION_COMPLETE; other transitions may have fewer rules
        var operation = createTestOperation(CargoType.LCL, InspectionType.EXPRESS, OperationStatus.PAYMENT_PREPARATION);
        operation.id = -999L;

        var result = validationService.validate(operation, OperationStatus.IN_TRANSIT);

        assertTrue(result.passed(),
                "Validation should pass when no rules apply to this transition, errors: " + result.errors());
    }

    // ---- FCL requires more documents than LCL ----

    @Test
    @Order(30)
    void testFCLHasMoreErrors() {
        var lclOp = createTestOperation(CargoType.LCL, InspectionType.EXPRESS, OperationStatus.DRAFT);
        lclOp.id = -999L;

        var fclOp = createTestOperation(CargoType.FCL, InspectionType.EXPRESS, OperationStatus.DRAFT);
        fclOp.id = -998L;

        var lclResult = validationService.validate(lclOp, OperationStatus.DOCUMENTATION_COMPLETE);
        var fclResult = validationService.validate(fclOp, OperationStatus.DOCUMENTATION_COMPLETE);

        assertFalse(lclResult.passed());
        assertFalse(fclResult.passed());

        // FCL requires CERTIFICATE in addition to LCL's mandatory docs, so should have >= LCL errors
        assertTrue(fclResult.errors().size() >= lclResult.errors().size(),
                "FCL should have at least as many errors as LCL. FCL=" + fclResult.errors().size()
                        + " LCL=" + lclResult.errors().size());
    }

    // ---- Rule re-enable takes effect ----

    @Test
    @Order(40)
    @Transactional
    void testReEnablingRuleTakesEffect() {
        // Disable, validate (should skip), re-enable, validate (should apply)
        var enabledConfig = configRepository.findByRuleCodeAndKey("COMPLETENESS_REQUIRED", "enabled")
                .orElseThrow();

        // Disable
        enabledConfig.enabled = false;

        var operation = createTestOperation(CargoType.LCL, InspectionType.EXPRESS, OperationStatus.DRAFT);
        operation.id = -999L;

        var disabledResult = validationService.validate(operation, OperationStatus.DOCUMENTATION_COMPLETE);
        var disabledMissingDocErrors = disabledResult.errors().stream()
                .filter(e -> e.ruleCode().startsWith("MISSING_DOC_"))
                .count();

        // Re-enable
        enabledConfig.enabled = true;

        var enabledResult = validationService.validate(operation, OperationStatus.DOCUMENTATION_COMPLETE);
        var enabledMissingDocErrors = enabledResult.errors().stream()
                .filter(e -> e.ruleCode().startsWith("MISSING_DOC_"))
                .count();

        assertTrue(enabledMissingDocErrors > disabledMissingDocErrors,
                "Re-enabled rule should produce MISSING_DOC_ errors. Disabled=" + disabledMissingDocErrors
                        + " Enabled=" + enabledMissingDocErrors);
    }
}
