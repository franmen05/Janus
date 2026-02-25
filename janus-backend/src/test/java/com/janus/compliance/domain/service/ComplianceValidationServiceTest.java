package com.janus.compliance.domain.service;

import com.janus.compliance.domain.model.ComplianceRuleConfig;
import com.janus.compliance.domain.repository.ComplianceRuleConfigRepository;
import com.janus.operation.domain.model.OperationCategory;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationStatus;
import com.janus.operation.domain.model.TransportMode;
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
    private Operation createTestOperation(TransportMode transportMode, OperationCategory category, OperationStatus status) {
        var op = new Operation();
        op.transportMode = transportMode;
        op.operationCategory = category;
        op.status = status;
        return op;
    }

    // ---- Enabled rules that fail block the transition ----

    @Test
    @Order(1)
    void testValidationFailsWhenMandatoryDocsAreMissing() {
        // Operation has no documents uploaded — completeness rule should fail
        var operation = createTestOperation(TransportMode.AIR, OperationCategory.CATEGORY_1, OperationStatus.DRAFT);
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
        var operation = createTestOperation(TransportMode.AIR, OperationCategory.CATEGORY_1, OperationStatus.DRAFT);
        operation.id = -999L;

        var result = validationService.validate(operation, OperationStatus.DOCUMENTATION_COMPLETE);

        assertFalse(result.passed());
        // AIR requires BL, COMMERCIAL_INVOICE, PACKING_LIST — errors use MISSING_DOC_* codes
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

        var operation = createTestOperation(TransportMode.AIR, OperationCategory.CATEGORY_1, OperationStatus.DRAFT);
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

        var operation = createTestOperation(TransportMode.AIR, OperationCategory.CATEGORY_1, OperationStatus.DRAFT);
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
        var operation = createTestOperation(TransportMode.AIR, OperationCategory.CATEGORY_1, OperationStatus.PAYMENT_PREPARATION);
        operation.id = -999L;
        operation.blAvailability = com.janus.operation.domain.model.BlAvailability.ORIGINAL;

        var result = validationService.validate(operation, OperationStatus.IN_TRANSIT);

        assertTrue(result.passed(),
                "Validation should pass when no rules apply to this transition, errors: " + result.errors());
    }

    // ---- MARITIME requires more documents than AIR ----

    @Test
    @Order(30)
    void testMARITIMEHasMoreErrors() {
        var airOp = createTestOperation(TransportMode.AIR, OperationCategory.CATEGORY_1, OperationStatus.DRAFT);
        airOp.id = -999L;

        var maritimeOp = createTestOperation(TransportMode.MARITIME, OperationCategory.CATEGORY_1, OperationStatus.DRAFT);
        maritimeOp.id = -998L;

        var airResult = validationService.validate(airOp, OperationStatus.DOCUMENTATION_COMPLETE);
        var maritimeResult = validationService.validate(maritimeOp, OperationStatus.DOCUMENTATION_COMPLETE);

        assertFalse(airResult.passed());
        assertFalse(maritimeResult.passed());

        // MARITIME requires CERTIFICATE in addition to AIR's mandatory docs, so should have >= AIR errors
        assertTrue(maritimeResult.errors().size() >= airResult.errors().size(),
                "MARITIME should have at least as many errors as AIR. MARITIME=" + maritimeResult.errors().size()
                        + " AIR=" + airResult.errors().size());
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

        var operation = createTestOperation(TransportMode.AIR, OperationCategory.CATEGORY_1, OperationStatus.DRAFT);
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
