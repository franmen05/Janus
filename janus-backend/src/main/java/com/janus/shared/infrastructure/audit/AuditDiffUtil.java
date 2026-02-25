package com.janus.shared.infrastructure.audit;

import com.janus.shared.infrastructure.util.JsonUtil;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

public final class AuditDiffUtil {

    private AuditDiffUtil() {}

    /**
     * Builds a diff between two maps, returning only changed fields.
     * Returns a two-element array: [previousDataJson, newDataJson].
     * If no changes, returns [null, null].
     */
    public static String[] buildDiff(Map<String, Object> before, Map<String, Object> after) {
        var previousData = new LinkedHashMap<String, Object>();
        var newData = new LinkedHashMap<String, Object>();

        for (var key : after.keySet()) {
            var oldVal = before.get(key);
            var newVal = after.get(key);
            if (!Objects.equals(oldVal, newVal)) {
                previousData.put(key, oldVal);
                newData.put(key, newVal);
            }
        }

        if (previousData.isEmpty()) {
            return new String[]{null, null};
        }
        return new String[]{JsonUtil.toJson(previousData), JsonUtil.toJson(newData)};
    }

    /**
     * Builds newData-only JSON for create operations.
     */
    public static String buildCreateData(Map<String, Object> data) {
        return JsonUtil.toJson(data);
    }
}
