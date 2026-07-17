package com.takshak.hostel.entity;

import com.takshak.hostel.enums.CheckType;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "check_in_outs")
public class CheckInOut {

    @Id
    private String id;

    private String studentId;

    private String studentName;

    private String studentCode;

    private CheckType type;

    private Instant timestamp = Instant.now();

    private String recordedById;

    private String recordedByName;

    private String notes;

    public CheckInOut() {
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

    public String getStudentCode() {
        return studentCode;
    }

    public void setStudentCode(String studentCode) {
        this.studentCode = studentCode;
    }

    public CheckType getType() {
        return type;
    }

    public void setType(CheckType type) {
        this.type = type;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public String getRecordedById() {
        return recordedById;
    }

    public void setRecordedById(String recordedById) {
        this.recordedById = recordedById;
    }

    public String getRecordedByName() {
        return recordedByName;
    }

    public void setRecordedByName(String recordedByName) {
        this.recordedByName = recordedByName;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
