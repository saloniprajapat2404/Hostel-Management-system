package com.takshak.hostel.entity;

import com.takshak.hostel.enums.AdmissionStatus;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "admission_requests")
public class AdmissionRequest {

    @Id
    private String id;

    private String studentName;

    private String email;

    private String phone;

    private String studentId;

    private AdmissionStatus status = AdmissionStatus.PENDING;

    private String notes;

    private Instant createdAt = Instant.now();

    private String reviewedById;

    private String reviewedByName;

    private Instant reviewedAt;

    private String branchId;

    public AdmissionRequest() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public AdmissionStatus getStatus() {
        return status;
    }

    public void setStatus(AdmissionStatus status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getReviewedById() {
        return reviewedById;
    }

    public void setReviewedById(String reviewedById) {
        this.reviewedById = reviewedById;
    }

    public String getReviewedByName() {
        return reviewedByName;
    }

    public void setReviewedByName(String reviewedByName) {
        this.reviewedByName = reviewedByName;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public String getBranchId() {
        return branchId;
    }

    public void setBranchId(String branchId) {
        this.branchId = branchId;
    }
}
