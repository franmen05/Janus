package com.janus.document.infrastructure.storage;

import java.io.InputStream;
import java.nio.file.Path;

public interface StorageService {

    String store(InputStream inputStream, String fileName, String operationRef);

    Path resolve(String filePath);

    void delete(String filePath);
}
