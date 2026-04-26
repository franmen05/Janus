package com.janus.shared.api.dto;

import java.util.List;

public record CsvImportResponse(int imported, int updated, int duplicates, int skipped, List<String> errors) {}
