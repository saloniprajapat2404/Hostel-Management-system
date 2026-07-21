package com.takshak.hostel.util;

import com.takshak.hostel.exception.ApiException;

public final class PhoneUtils {

    private PhoneUtils() {
    }

    public static String digitsOnly(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.replaceAll("\\D", "");
    }

    public static String normalizeMobile10(String value) {
        String digits = digitsOnly(value);
        if (digits == null) {
            return null;
        }
        if (digits.length() == 12 && digits.startsWith("91")) {
            digits = digits.substring(2);
        } else if (digits.length() == 11 && digits.startsWith("0")) {
            digits = digits.substring(1);
        }
        return digits;
    }

    /** Returns normalized 10-digit mobile, or null when blank. */
    public static String requireOptionalMobile10(String value, String fieldLabel) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return validateMobile10(value, fieldLabel);
    }

    /** Returns normalized 10-digit mobile; throws when blank or invalid. */
    public static String requireMobile10(String value, String fieldLabel) {
        if (value == null || value.isBlank()) {
            throw new ApiException(fieldLabel + " is required", 400);
        }
        return validateMobile10(value, fieldLabel);
    }

    private static String validateMobile10(String value, String fieldLabel) {
        String digits = normalizeMobile10(value);
        if (digits == null || digits.length() != 10) {
            throw new ApiException(fieldLabel + " must be exactly 10 digits", 400);
        }
        char first = digits.charAt(0);
        if (first < '6' || first > '9') {
            throw new ApiException(fieldLabel + " must start with 6, 7, 8, or 9", 400);
        }
        return digits;
    }
}
