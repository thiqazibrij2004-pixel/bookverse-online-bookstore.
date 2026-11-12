package com.bookstore.util;

import java.io.File;
import javax.servlet.ServletContext;

/** Resolves storage outside an expanded WAR when configured by the server. */
public final class StoragePaths {
    private StoragePaths() { }

    public static String dataDirectory(ServletContext context) {
        return directory(context, "bookstore.data.dir", "/WEB-INF/data", "data");
    }

    public static String coverDirectory(ServletContext context) {
        return directory(context, "bookstore.covers.dir", "/WEB-INF/uploads/book-covers",
                "uploads/book-covers");
    }

    private static String directory(ServletContext context, String property,
            String webPath, String fallback) {
        String path = System.getProperty(property);
        if (path == null || path.trim().isEmpty()) {
            path = context == null ? fallback : context.getRealPath(webPath);
        }
        if (path == null) {
            throw new IllegalStateException("Cannot resolve " + webPath
                    + "; configure -D" + property + " to a writable directory");
        }
        File directory = new File(path).getAbsoluteFile();
        if ((!directory.isDirectory() && !directory.mkdirs()) || !directory.canWrite()) {
            throw new IllegalStateException("Storage directory is not writable: " + directory);
        }
        return directory.getPath();
    }
}
