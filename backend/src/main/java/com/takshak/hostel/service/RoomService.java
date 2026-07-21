package com.takshak.hostel.service;

import com.takshak.hostel.dto.BedDto;
import com.takshak.hostel.dto.BulkCreateRoomsRequest;
import com.takshak.hostel.dto.CreateRoomRequest;
import com.takshak.hostel.dto.RoomDto;
import com.takshak.hostel.dto.UpdateBedRequest;
import com.takshak.hostel.dto.UpdateRoomRequest;
import com.takshak.hostel.entity.Allocation;
import com.takshak.hostel.entity.Bed;
import com.takshak.hostel.entity.Room;
import com.takshak.hostel.enums.RoomGender;
import com.takshak.hostel.enums.RoomStatus;
import com.takshak.hostel.enums.RoomType;
import com.takshak.hostel.exception.ApiException;
import com.takshak.hostel.repository.AllocationRepository;
import com.takshak.hostel.repository.RoomRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

@Service
public class RoomService {

    private static final String[] BED_LABELS = {"A", "B", "C", "D", "E", "F", "G", "H"};

    private final RoomRepository roomRepository;
    private final AllocationRepository allocationRepository;

    public RoomService(RoomRepository roomRepository, AllocationRepository allocationRepository) {
        this.roomRepository = roomRepository;
        this.allocationRepository = allocationRepository;
    }

    public List<RoomDto> listRooms() {
        Map<String, Allocation> byBed = activeAllocationsByBed();
        return roomRepository.findAllByOrderByRoomNumberAsc().stream()
                .map(room -> toDto(room, byBed))
                .toList();
    }

    public RoomDto getRoom(String id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ApiException("Room not found", 404));
        return toDto(room, activeAllocationsByBed());
    }

    public RoomDto createRoom(CreateRoomRequest request) {
        if (roomRepository.existsByRoomNumberIgnoreCase(request.roomNumber())) {
            throw new ApiException("Room number already exists", 409);
        }
        Room room = new Room();
        applyCreateFields(room, request.roomNumber(), request.floor(), request.capacity(),
                request.wing(), request.gender(), request.roomType(), request.status(), request.notes());
        return toDto(roomRepository.save(room), Map.of());
    }

    public List<RoomDto> bulkCreateRooms(BulkCreateRoomsRequest request) {
        int pad = Math.max(1, request.padDigits());
        List<Room> created = new ArrayList<>();
        for (int i = 0; i < request.count(); i++) {
            int num = request.startNumber() + i;
            String roomNumber = (request.prefix() == null ? "" : request.prefix().trim().toUpperCase())
                    + String.format("%0" + pad + "d", num);
            if (roomRepository.existsByRoomNumberIgnoreCase(roomNumber)) {
                throw new ApiException("Room number already exists: " + roomNumber, 409);
            }
            Room room = new Room();
            applyCreateFields(room, roomNumber, request.floor(), request.capacity(),
                    request.wing(), request.gender(), request.roomType(), request.status(), null);
            created.add(roomRepository.save(room));
        }
        return created.stream().map(room -> toDto(room, Map.of())).toList();
    }

    public RoomDto updateRoom(String id, UpdateRoomRequest request) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ApiException("Room not found", 404));
        if (request.roomNumber() != null && !request.roomNumber().isBlank()) {
            roomRepository.findByRoomNumberIgnoreCase(request.roomNumber())
                    .filter(r -> !r.getId().equals(id))
                    .ifPresent(r -> {
                        throw new ApiException("Room number already exists", 409);
                    });
            room.setRoomNumber(request.roomNumber().trim().toUpperCase());
        }
        if (request.floor() != null) {
            if (request.floor() < 1 || request.floor() > 10) {
                throw new ApiException("Floor must be between 1 and 10", 400);
            }
            room.setFloor(request.floor());
        }
        if (request.capacity() != null) {
            syncBedCapacity(room, request.capacity());
        }
        if (request.active() != null) {
            if (!request.active() && room.getBeds().stream().anyMatch(Bed::isOccupied)) {
                throw new ApiException("Cannot deactivate room with occupied beds", 409);
            }
            room.setActive(request.active());
        }
        if (request.wing() != null) {
            room.setWing(blankToNull(request.wing()));
        }
        if (request.gender() != null) {
            room.setGender(request.gender());
        }
        if (request.roomType() != null) {
            room.setRoomType(request.roomType());
        }
        if (request.status() != null) {
            if (request.status() == RoomStatus.MAINTENANCE
                    && room.getBeds().stream().anyMatch(Bed::isOccupied)) {
                throw new ApiException("Cannot set maintenance while beds are occupied. Deallocate first.", 409);
            }
            room.setStatus(request.status());
        }
        if (request.notes() != null) {
            room.setNotes(blankToNull(request.notes()));
        }
        refreshDerivedStatus(room);
        return toDto(roomRepository.save(room), activeAllocationsByBed());
    }

    public RoomDto updateBed(String roomId, String bedId, UpdateBedRequest request) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ApiException("Room not found", 404));
        Bed bed = room.getBeds().stream()
                .filter(b -> bedId.equals(b.getId()))
                .findFirst()
                .orElseThrow(() -> new ApiException("Bed not found", 404));
        if (request.bedLabel() != null && !request.bedLabel().isBlank()) {
            String label = request.bedLabel().trim().toUpperCase();
            boolean duplicate = room.getBeds().stream()
                    .anyMatch(b -> !b.getId().equals(bedId) && label.equalsIgnoreCase(b.getBedLabel()));
            if (duplicate) {
                throw new ApiException("Bed label already exists in this room", 409);
            }
            bed.setBedLabel(label);
        }
        if (request.underMaintenance() != null) {
            if (request.underMaintenance() && bed.isOccupied()) {
                throw new ApiException("Cannot mark occupied bed as under maintenance", 409);
            }
            bed.setUnderMaintenance(request.underMaintenance());
        }
        refreshDerivedStatus(room);
        return toDto(roomRepository.save(room), activeAllocationsByBed());
    }

    public void deleteRoom(String id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ApiException("Room not found", 404));
        if (room.getBeds().stream().anyMatch(Bed::isOccupied)) {
            throw new ApiException("Cannot delete room with occupied beds. Deallocate students first.", 409);
        }
        room.setActive(false);
        room.setStatus(RoomStatus.MAINTENANCE);
        roomRepository.save(room);
    }

    private void applyCreateFields(
            Room room,
            String roomNumber,
            int floor,
            int capacity,
            String wing,
            RoomGender gender,
            RoomType roomType,
            RoomStatus status,
            String notes) {
        room.setRoomNumber(roomNumber.trim().toUpperCase());
        room.setFloor(floor);
        room.setCapacity(capacity > 0 ? capacity : 2);
        room.setActive(true);
        room.setWing(blankToNull(wing));
        room.setGender(gender != null ? gender : RoomGender.MIXED);
        room.setRoomType(roomType != null ? roomType : RoomType.STANDARD);
        room.setStatus(status != null ? status : RoomStatus.AVAILABLE);
        room.setNotes(blankToNull(notes));

        List<Bed> beds = new ArrayList<>();
        for (int i = 0; i < room.getCapacity(); i++) {
            beds.add(newBed(nextBedLabel(beds, i)));
        }
        room.setBeds(beds);
        refreshDerivedStatus(room);
    }

    private void refreshDerivedStatus(Room room) {
        if (!room.isActive()) {
            return;
        }
        if (room.getStatus() == RoomStatus.MAINTENANCE) {
            return;
        }
        long availableBeds = room.getBeds().stream()
                .filter(b -> !b.isOccupied() && !b.isUnderMaintenance())
                .count();
        room.setStatus(availableBeds == 0 ? RoomStatus.FULL : RoomStatus.AVAILABLE);
    }

    private void syncBedCapacity(Room room, int newCapacity) {
        if (newCapacity <= 0 || newCapacity > 12) {
            throw new ApiException("Capacity must be between 1 and 12", 400);
        }

        List<Bed> beds = room.getBeds();
        int currentSize = beds.size();

        if (newCapacity < currentSize) {
            long occupiedCount = beds.stream().filter(Bed::isOccupied).count();
            if (occupiedCount > newCapacity) {
                throw new ApiException("Cannot reduce capacity below occupied bed count", 400);
            }
            int toRemove = currentSize - newCapacity;
            List<Bed> vacantBeds = beds.stream()
                    .filter(b -> !b.isOccupied())
                    .sorted(Comparator.comparing(Bed::getBedLabel).reversed())
                    .limit(toRemove)
                    .toList();
            if (vacantBeds.size() < toRemove) {
                throw new ApiException("Cannot reduce capacity — not enough vacant beds to remove", 400);
            }
            beds.removeAll(vacantBeds);
        } else if (newCapacity > currentSize) {
            for (int i = currentSize; i < newCapacity; i++) {
                beds.add(newBed(nextBedLabel(beds, i)));
            }
        }
        room.setCapacity(newCapacity);
    }

    private Bed newBed(String label) {
        Bed bed = new Bed();
        bed.setId(new ObjectId().toHexString());
        bed.setBedLabel(label);
        bed.setOccupied(false);
        bed.setUnderMaintenance(false);
        return bed;
    }

    private String nextBedLabel(List<Bed> beds, int index) {
        Set<String> used = new HashSet<>();
        for (Bed bed : beds) {
            used.add(bed.getBedLabel());
        }
        if (index < BED_LABELS.length && !used.contains(BED_LABELS[index])) {
            return BED_LABELS[index];
        }
        for (String label : BED_LABELS) {
            if (!used.contains(label)) {
                return label;
            }
        }
        int n = beds.size() + 1;
        while (used.contains(String.valueOf(n))) {
            n++;
        }
        return String.valueOf(n);
    }

    private Map<String, Allocation> activeAllocationsByBed() {
        Map<String, Allocation> map = new HashMap<>();
        for (Allocation allocation : allocationRepository.findByActiveTrue()) {
            if (allocation.getBedId() != null) {
                map.put(allocation.getBedId(), allocation);
            }
        }
        return map;
    }

    private RoomDto toDto(Room room, Map<String, Allocation> byBed) {
        List<BedDto> beds = room.getBeds().stream()
                .sorted(Comparator.comparing(Bed::getBedLabel))
                .map(b -> {
                    Allocation allocation = byBed.get(b.getId());
                    return new BedDto(
                            b.getId(),
                            b.getBedLabel(),
                            b.isOccupied(),
                            b.isUnderMaintenance(),
                            allocation != null ? allocation.getStudentName() : null,
                            allocation != null ? allocation.getStudentCode() : null,
                            allocation != null ? allocation.getId() : null
                    );
                })
                .toList();
        long occupied = beds.stream().filter(BedDto::occupied).count();
        long maintenance = beds.stream().filter(BedDto::underMaintenance).count();
        long vacant = beds.stream()
                .filter(b -> !b.occupied() && !b.underMaintenance())
                .count();
        return new RoomDto(
                room.getId(),
                room.getRoomNumber(),
                room.getFloor(),
                room.getCapacity(),
                room.isActive(),
                room.getWing(),
                room.getGender(),
                room.getRoomType(),
                room.getStatus(),
                room.getNotes(),
                beds,
                occupied,
                vacant,
                maintenance
        );
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
