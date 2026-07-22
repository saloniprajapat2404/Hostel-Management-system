package com.takshak.hostel.entity;

import com.takshak.hostel.enums.NoticeCategory;
import com.takshak.hostel.enums.NoticeStatus;
import com.takshak.hostel.enums.NoticeTargetAudience;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "notices")
public class Notice {

    @Id
    private String id;

    private String title;

    /** Primary content field for new notices. */
    private String description;

    /** Legacy field — kept for documents created before description migration. */
    @Field("body")
    private String legacyBody;

    private NoticeCategory category = NoticeCategory.GENERAL;

    private NoticeTargetAudience targetAudience = NoticeTargetAudience.ALL_STUDENTS;

    private String roomNumber;

    /** User id or student code for SPECIFIC_STUDENT audience. */
    private String studentId;

    private String createdById;

    private String createdByName;

    private Instant createdAt = Instant.now();

    private NoticeStatus status = NoticeStatus.ACTIVE;

    /** Legacy active flag — mapped for older MongoDB documents. */
    private Boolean active;

    private Instant whatsappSentAt;

    private String branchId;

    public Notice() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        if (description != null && !description.isBlank()) {
            return description;
        }
        return legacyBody;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLegacyBody() {
        return legacyBody;
    }

    public void setLegacyBody(String legacyBody) {
        this.legacyBody = legacyBody;
    }

    public NoticeCategory getCategory() {
        return category;
    }

    public void setCategory(NoticeCategory category) {
        this.category = category;
    }

    public NoticeTargetAudience getTargetAudience() {
        return targetAudience;
    }

    public void setTargetAudience(NoticeTargetAudience targetAudience) {
        this.targetAudience = targetAudience;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getCreatedById() {
        return createdById;
    }

    public void setCreatedById(String createdById) {
        this.createdById = createdById;
    }

    public String getCreatedByName() {
        return createdByName;
    }

    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public NoticeStatus getStatus() {
        if (status != null) {
            return status;
        }
        if (active != null && !active) {
            return NoticeStatus.EXPIRED;
        }
        return NoticeStatus.ACTIVE;
    }

    public void setStatus(NoticeStatus status) {
        this.status = status;
        this.active = status == NoticeStatus.ACTIVE;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
        this.status = active ? NoticeStatus.ACTIVE : NoticeStatus.EXPIRED;
    }

    public Instant getWhatsappSentAt() {
        return whatsappSentAt;
    }

    public void setWhatsappSentAt(Instant whatsappSentAt) {
        this.whatsappSentAt = whatsappSentAt;
    }

    public String getBranchId() {
        return branchId;
    }

    public void setBranchId(String branchId) {
        this.branchId = branchId;
    }
}
