package com.janus.shared.infrastructure.util;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public final class CsvUtil {

    private CsvUtil() {}

    /**
     * Escapes a value for CSV: always wraps in double-quotes,
     * escaping any embedded double-quotes as "".
     * Returns empty string for null.
     */
    public static String escape(String value) {
        if (value == null) return "";
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }

    /**
     * RFC 4180-compliant single-line CSV parser.
     * Handles quoted fields, embedded commas, and escaped double-quotes ("").
     * Strips trailing \r from the last field (Windows line endings).
     */
    public static List<String> parseLine(String line) {
        List<String> fields = new ArrayList<>();
        if (line == null || line.isEmpty()) return fields;
        int i = 0;
        int len = line.length();
        while (i <= len) {
            if (i == len) {
                fields.add("");
                break;
            }
            if (line.charAt(i) == '"') {
                // quoted field
                StringBuilder sb = new StringBuilder();
                i++; // skip opening quote
                while (i < len) {
                    char c = line.charAt(i);
                    if (c == '"') {
                        if (i + 1 < len && line.charAt(i + 1) == '"') {
                            sb.append('"');
                            i += 2;
                        } else {
                            i++; // skip closing quote
                            break;
                        }
                    } else {
                        sb.append(c);
                        i++;
                    }
                }
                fields.add(sb.toString());
                if (i < len && line.charAt(i) == ',') i++; // skip comma
                else break;
            } else {
                // unquoted field
                int start = i;
                while (i < len && line.charAt(i) != ',') i++;
                String field = line.substring(start, i);
                // strip trailing \r on last field
                if (i == len && field.endsWith("\r")) {
                    field = field.substring(0, field.length() - 1);
                }
                fields.add(field);
                if (i < len) i++; // skip comma
                else break;
            }
        }
        return fields;
    }

    /**
     * Reads all data rows from a CSV InputStream (skips header row at index 0).
     * Returns list of field lists, one per data row.
     * Skips blank lines.
     */
    public static List<List<String>> parseLines(InputStream in) throws IOException {
        List<List<String>> rows = new ArrayList<>();
        try (var reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            String line;
            boolean first = true;
            while ((line = reader.readLine()) != null) {
                if (first) { first = false; continue; } // skip header
                if (line.isBlank()) continue;
                rows.add(parseLine(line));
            }
        }
        return rows;
    }
}
