package com.takshak.hostel.entity;

import com.takshak.hostel.enums.RoomGender;
import com.takshak.hostel.enums.RoomStatus;
import com.takshak.hostel.enums.RoomType;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "rooms")
public class Room {

    @Id
    private String id;

    @Indexed
    private String roomNumber;

    private String branchId;

    private int floor;

    private int capacity = 2;

    private boolean active = true;

    /** Block / wing label, e.g. A, B, East. */
    private String wing;

    private RoomGender gender = RoomGender.MIXED;

    private RoomType roomType = RoomType.STANDARD;

    private RoomStatus status = RoomStatus.AVAILABLE;

    private String notes;

    private List<Bed> beds = new ArrayList<>();

    public Room() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public int getFloor() {
        return floor;
    }

    public void setFloor(int floor) {
        this.floor = floor;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getWing() {
        return wing;
    }

    public void setWing(String wing) {
        this.wing = wing;
    }

    public RoomGender getGender() {
        return gender == null ? RoomGender.MIXED : gender;
    }

    public void setGender(RoomGender gender) {
        this.gender = gender;
    }

    public RoomType getRoomType() {
        return roomType == null ? RoomType.STANDARD : roomType;
    }

    public void setRoomType(RoomType roomType) {
        this.roomType = roomType;
    }

    public RoomStatus getStatus() {
        return status == null ? RoomStatus.AVAILABLE : status;
    }

    public void setStatus(RoomStatus status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<Bed> getBeds() {
        return beds;
    }

    public void setBeds(List<Bed> beds) {
        this.beds = beds;
    }

    public String getBranchId() {
        return branchId;
    }

    public void setBranchId(String branchId) {
        this.branchId = branchId;
    }
}
