package com.takshak.hostel.entity;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "allocations")
public class Allocation {

    @Id
    private String id;

    private String studentId;
    private String studentName;
    private String studentEmail;
    private String studentCode;

    private String bedId;
    private String roomId;
    private String roomNumber;
    private String bedLabel;
    private Integer floor;

    private Instant allocatedAt = Instant.now();

    private boolean active = true;

    private String allocatedById;
    private String allocatedByName;

    public Allocation() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public void setStudentEmail(String studentEmail) {
        this.studentEmail = studentEmail;
    }

    public String getStudentCode() {
        return studentCode;
    }

    public void setStudentCode(String studentCode) {
        this.studentCode = studentCode;
    }

    public String getBedId() {
        return bedId;
    }

    public void setBedId(String bedId) {
        this.bedId = bedId;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public String getBedLabel() {
        return bedLabel;
    }

    public void setBedLabel(String bedLabel) {
        this.bedLabel = bedLabel;
    }

    public Integer getFloor() {
        return floor;
    }

    public void setFloor(Integer floor) {
        this.floor = floor;
    }

    public Instant getAllocatedAt() {
        return allocatedAt;
    }

    public void setAllocatedAt(Instant allocatedAt) {
        this.allocatedAt = allocatedAt;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getAllocatedById() {
        return allocatedById;
    }

    public void setAllocatedById(String allocatedById) {
        this.allocatedById = allocatedById;
    }

    public String getAllocatedByName() {
        return allocatedByName;
    }

    public void setAllocatedByName(String allocatedByName) {
        this.allocatedByName = allocatedByName;
    }
}
