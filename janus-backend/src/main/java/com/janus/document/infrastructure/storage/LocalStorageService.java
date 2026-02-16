package com.janus.document.infrastructure.storage;

import jakarta.enterprise.context.ApplicationScoped;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

@ApplicationScoped
public class LocalStorageService implements StorageService {

    private static final Logger LOG = Logger.getLogger(LocalStorageService.class);

    @ConfigProperty(name = "janus.storage.path", defaultValue = "./storage")
    String storagePath;

    @Override
    public String store(InputStream inputStream, String fileName, String operationRef) {
        try {
            var dir = Paths.get(storagePath, operationRef);
            Files.createDirectories(dir);
            var target = dir.resolve(fileName);
            Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            LOG.infof("File stored: %s", target);
            return target.toString();
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + fileName, e);
        }
    }

    @Override
    public Path resolve(String filePath) {
        return Paths.get(filePath);
    }

    @Override
    public void delete(String filePath) {
        try {
            Files.deleteIfExists(Paths.get(filePath));
        } catch (IOException e) {
            LOG.warnf("Failed to delete file: %s", filePath);
        }
    }
}
