package com.takshak.hostel.service;

import com.takshak.hostel.dto.BedDto;
import com.takshak.hostel.dto.CreateRoomRequest;
import com.takshak.hostel.dto.RoomDto;
import com.takshak.hostel.dto.UpdateRoomRequest;
import com.takshak.hostel.entity.Bed;
import com.takshak.hostel.entity.Room;
import com.takshak.hostel.exception.ApiException;
import com.takshak.hostel.repository.RoomRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

@Service
public class RoomService {

    private static final String[] BED_LABELS = {"A", "B", "C", "D", "E", "F", "G", "H"};

    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public List<RoomDto> listRooms() {
        return roomRepository.findAllByOrderByRoomNumberAsc().stream()
                .map(this::toDto)
                .toList();
    }

    public RoomDto createRoom(CreateRoomRequest request) {
        if (roomRepository.existsByRoomNumberIgnoreCase(request.roomNumber())) {
            throw new ApiException("Room number already exists", 409);
        }
        Room room = new Room();
        room.setRoomNumber(request.roomNumber().trim().toUpperCase());
        room.setFloor(request.floor());
        room.setCapacity(request.capacity() > 0 ? request.capacity() : 2);
        room.setActive(true);

        List<Bed> beds = new ArrayList<>();
        for (int i = 0; i < room.getCapacity(); i++) {
            beds.add(newBed(nextBedLabel(beds, i)));
        }
        room.setBeds(beds);
        return toDto(roomRepository.save(room));
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
        return toDto(roomRepository.save(room));
    }

    public void deleteRoom(String id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ApiException("Room not found", 404));
        if (room.getBeds().stream().anyMatch(Bed::isOccupied)) {
            throw new ApiException("Cannot delete room with occupied beds. Deallocate students first.", 409);
        }
        room.setActive(false);
        roomRepository.save(room);
    }

    private void syncBedCapacity(Room room, int newCapacity) {
        if (newCapacity <= 0) {
            throw new ApiException("Capacity must be at least 1", 400);
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

    public RoomDto toDto(Room room) {
        List<BedDto> beds = room.getBeds().stream()
                .sorted(Comparator.comparing(Bed::getBedLabel))
                .map(b -> new BedDto(b.getId(), b.getBedLabel(), b.isOccupied()))
                .toList();
        long occupied = beds.stream().filter(BedDto::occupied).count();
        return new RoomDto(
                room.getId(),
                room.getRoomNumber(),
                room.getFloor(),
                room.getCapacity(),
                room.isActive(),
                beds,
                occupied,
                beds.size() - occupied
        );
    }
}
