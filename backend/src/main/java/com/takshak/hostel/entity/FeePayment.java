package com.takshak.hostel.entity;

import com.takshak.hostel.enums.PaymentMethod;
import java.math.BigDecimal;
import java.time.Instant;
import org.bson.types.ObjectId;

/**
 * Embedded payment subdocument inside {@link StudentFee}.
 */
public class FeePayment {

    private String id = new ObjectId().toHexString();

    private BigDecimal amount;

    private PaymentMethod method;

    private Instant paidAt = Instant.now();

    private String referenceNote;

    private String recordedById;

    private String recordedByName;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public PaymentMethod getMethod() {
        return method;
    }

    public void setMethod(PaymentMethod method) {
        this.method = method;
    }

    public Instant getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(Instant paidAt) {
        this.paidAt = paidAt;
    }

    public String getReferenceNote() {
        return referenceNote;
    }

    public void setReferenceNote(String referenceNote) {
        this.referenceNote = referenceNote;
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
}
