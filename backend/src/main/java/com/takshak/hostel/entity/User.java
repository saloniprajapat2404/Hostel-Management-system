package com.takshak.hostel.entity;

import com.takshak.hostel.enums.Role;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users")
public class User {

    @Id
    private String id;

    @Indexed
    private String email;

    private String password;

    private String fullName;

    private Role role;

    @Indexed(sparse = true)
    private String studentId;

    /** Null for SUPER_ADMIN; required for all other roles. */
    private String branchId;

    private String phone;

    /** WhatsApp-enabled mobile number (E.164 preferred, e.g. +919876543210). */
    private String whatsappNumber;

    private String parentPhone;

    private String aadharNumber;

    private String profilePicture;

    private String addressLine;

    private String city;

    private String state;

    private String pincode;

    private boolean active = true;

    /** Per-module screen access; empty = fall back to role defaults. */
    private java.util.Map<String, Boolean> screenPermissions = new java.util.HashMap<>();

    /** Can grant or adjust screen access for other users. */
    private boolean accessGrant = true;

    private Instant createdAt = Instant.now();

    public User() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getWhatsappNumber() {
        return whatsappNumber;
    }

    public void setWhatsappNumber(String whatsappNumber) {
        this.whatsappNumber = whatsappNumber;
    }

    public String getParentPhone() {
        return parentPhone;
    }

    public void setParentPhone(String parentPhone) {
        this.parentPhone = parentPhone;
    }

    public String getAadharNumber() {
        return aadharNumber;
    }

    public void setAadharNumber(String aadharNumber) {
        this.aadharNumber = aadharNumber;
    }

    public String getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
    }

    public String getAddressLine() {
        return addressLine;
    }

    public void setAddressLine(String addressLine) {
        this.addressLine = addressLine;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getBranchId() {
        return branchId;
    }

    public void setBranchId(String branchId) {
        this.branchId = branchId;
    }

    public java.util.Map<String, Boolean> getScreenPermissions() {
        return screenPermissions;
    }

    public void setScreenPermissions(java.util.Map<String, Boolean> screenPermissions) {
        this.screenPermissions = screenPermissions != null ? screenPermissions : new java.util.HashMap<>();
    }

    public boolean isAccessGrant() {
        return accessGrant;
    }

    public void setAccessGrant(boolean accessGrant) {
        this.accessGrant = accessGrant;
    }
}
