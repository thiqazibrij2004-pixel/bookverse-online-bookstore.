package com.bookstore.util;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

/**
 * Utility class for password operations
 */
public class PasswordUtil {
    private static final String PREFIX = "pbkdf2-sha256$";

    public static String hashForStorage(char[] password) {
        byte[] salt = new byte[16];
        new SecureRandom().nextBytes(salt);
        byte[] hash = derive(password, salt, 600000);
        return PREFIX + "600000$" + Base64.getEncoder().encodeToString(salt)
                + "$" + Base64.getEncoder().encodeToString(hash);
    }

    /** Recognized hashes fail closed; legacy records remain unchanged. */
    public static boolean verifyStoredPassword(String input, String stored) {
        if (input == null || stored == null) return false;
        if (!stored.startsWith(PREFIX)) {
            return MessageDigest.isEqual(input.getBytes(StandardCharsets.UTF_8),
                    stored.getBytes(StandardCharsets.UTF_8));
        }
        char[] chars = input.toCharArray();
        try {
            String[] parts = stored.split("\\$", -1);
            if (parts.length != 4) return false;
            int iterations = Integer.parseInt(parts[1]);
            if (iterations < 100000 || iterations > 2000000) return false;
            byte[] salt = Base64.getDecoder().decode(parts[2]);
            byte[] expected = Base64.getDecoder().decode(parts[3]);
            if (salt.length != 16 || expected.length != 32) return false;
            return MessageDigest.isEqual(expected, derive(chars, salt, iterations));
        } catch (IllegalArgumentException e) {
            return false;
        } finally {
            Arrays.fill(chars, '\0');
        }
    }

    private static byte[] derive(char[] password, byte[] salt, int iterations) {
        PBEKeySpec spec = new PBEKeySpec(password, salt, iterations, 256);
        try {
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
                    .generateSecret(spec).getEncoded();
        } catch (java.security.GeneralSecurityException e) {
            throw new IllegalStateException("PBKDF2 password hashing unavailable", e);
        } finally {
            spec.clearPassword();
        }
    }

    /**
     * Generate a secure random password
     * @param length The length of the password
     * @return A random password
     */
    public static String generateRandomPassword(int length) {
        if (length < 8) {
            length = 8; // Minimum password length
        }

        // Characters to use in password
        String upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        String lowerChars = "abcdefghijklmnopqrstuvwxyz";
        String numberChars = "0123456789";
        String specialChars = "!@#$%^&*()-_=+[]{}|;:,.<>?";
        String allChars = upperChars + lowerChars + numberChars + specialChars;

        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder();

        // Ensure password has at least one of each character type
        password.append(upperChars.charAt(random.nextInt(upperChars.length())));
        password.append(lowerChars.charAt(random.nextInt(lowerChars.length())));
        password.append(numberChars.charAt(random.nextInt(numberChars.length())));
        password.append(specialChars.charAt(random.nextInt(specialChars.length())));

        // Fill rest of password with random characters
        for (int i = 4; i < length; i++) {
            password.append(allChars.charAt(random.nextInt(allChars.length())));
        }

        // Shuffle the password
        char[] passwordArray = password.toString().toCharArray();
        for (int i = 0; i < passwordArray.length; i++) {
            int j = random.nextInt(passwordArray.length);
            char temp = passwordArray[i];
            passwordArray[i] = passwordArray[j];
            passwordArray[j] = temp;
        }

        return new String(passwordArray);
    }

    /**
     * Hash a password using SHA-256
     * Note: In a production environment, you'd want to use a more secure method like bcrypt
     * @param password The password to hash
     * @return The hashed password
     */
    public static String hashPassword(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hashedPassword = md.digest(password.getBytes());
            return Base64.getEncoder().encodeToString(hashedPassword);
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Verify if a password matches a hash
     * @param password The password to check
     * @param hash The hash to check against
     * @return True if the password matches the hash
     */
    public static boolean verifyPassword(String password, String hash) {
        String hashedPassword = hashPassword(password);
        return hashedPassword != null && hashedPassword.equals(hash);
    }
}
