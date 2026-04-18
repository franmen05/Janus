package com.janus.shared.api.dto;

import java.util.List;

public record CsvImportResponse(int imported, int skipped, List<String> errors) {}
