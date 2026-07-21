package com.takshak.hostel.entity;

import org.bson.types.ObjectId;

/**
 * Embedded bed subdocument inside {@link Room}. Has its own String id (ObjectId hex).
 */
public class Bed {

    private String id = new ObjectId().toHexString();

    private String bedLabel;

    private boolean occupied = false;

    private boolean underMaintenance = false;

    public Bed() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getBedLabel() {
        return bedLabel;
    }

    public void setBedLabel(String bedLabel) {
        this.bedLabel = bedLabel;
    }

    public boolean isOccupied() {
        return occupied;
    }

    public void setOccupied(boolean occupied) {
        this.occupied = occupied;
    }

    public boolean isUnderMaintenance() {
        return underMaintenance;
    }

    public void setUnderMaintenance(boolean underMaintenance) {
        this.underMaintenance = underMaintenance;
    }
}
