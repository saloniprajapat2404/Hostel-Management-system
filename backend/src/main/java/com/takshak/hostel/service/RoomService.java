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
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RoomService {

    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @Transactional(readOnly = true)
    public List<RoomDto> listRooms() {
        return roomRepository.findAllWithBeds().stream()
                .sorted(Comparator.comparing(Room::getRoomNumber))
                .map(this::toDto)
                .toList();
    }

    @Transactional
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
        String[] labels = {"A", "B", "C", "D"};
        for (int i = 0; i < room.getCapacity() && i < labels.length; i++) {
            Bed bed = new Bed();
            bed.setRoom(room);
            bed.setBedLabel(labels[i]);
            bed.setOccupied(false);
            beds.add(bed);
        }
        room.setBeds(beds);
        return toDto(roomRepository.save(room));
    }

    @Transactional
    public RoomDto updateRoom(Long id, UpdateRoomRequest request) {
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
            room.setCapacity(request.capacity());
        }
        if (request.active() != null) {
            room.setActive(request.active());
        }
        return toDto(roomRepository.save(room));
    }

    @Transactional
    public void deleteRoom(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ApiException("Room not found", 404));
        room.setActive(false);
        roomRepository.save(room);
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
