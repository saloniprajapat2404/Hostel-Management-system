package com.takshak.hostel.repository;

import com.takshak.hostel.entity.Bed;
import com.takshak.hostel.entity.Room;
import com.takshak.hostel.exception.ApiException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Repository;

/**
 * Bed lookup helpers for beds embedded inside {@link Room} documents.
 */
@Repository
public class BedRepository {

    private final RoomRepository roomRepository;

    public BedRepository(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public record BedWithRoom(Bed bed, Room room) {
    }

    public Optional<BedWithRoom> findByIdWithRoom(String bedId) {
        for (Room room : roomRepository.findAll()) {
            for (Bed bed : room.getBeds()) {
                if (bedId.equals(bed.getId())) {
                    return Optional.of(new BedWithRoom(bed, room));
                }
            }
        }
        return Optional.empty();
    }

    public List<BedWithRoom> findAllWithRoom() {
        List<BedWithRoom> result = new ArrayList<>();
        for (Room room : roomRepository.findAllByOrderByRoomNumberAsc()) {
            for (Bed bed : room.getBeds()) {
                result.add(new BedWithRoom(bed, room));
            }
        }
        result.sort(Comparator
                .comparing((BedWithRoom b) -> b.room().getRoomNumber())
                .thenComparing(b -> b.bed().getBedLabel()));
        return result;
    }

    public Room saveOccupied(BedWithRoom bedWithRoom, boolean occupied) {
        bedWithRoom.bed().setOccupied(occupied);
        return roomRepository.save(bedWithRoom.room());
    }

    public void setOccupied(String bedId, boolean occupied) {
        BedWithRoom found = findByIdWithRoom(bedId)
                .orElseThrow(() -> new ApiException("Bed not found", 404));
        saveOccupied(found, occupied);
    }

    public long count() {
        return roomRepository.findAll().stream()
                .mapToLong(r -> r.getBeds().size())
                .sum();
    }

    public long countByOccupiedTrue() {
        return roomRepository.findAll().stream()
                .flatMap(r -> r.getBeds().stream())
                .filter(Bed::isOccupied)
                .count();
    }

    public long countByOccupiedFalse() {
        return roomRepository.findAll().stream()
                .flatMap(r -> r.getBeds().stream())
                .filter(b -> !b.isOccupied() && !b.isUnderMaintenance())
                .count();
    }

    public List<Object[]> countOccupancyByFloor() {
        Map<Integer, long[]> grouped = new LinkedHashMap<>();
        for (Room room : roomRepository.findByActiveTrueOrderByRoomNumberAsc()) {
            long[] counts = grouped.computeIfAbsent(room.getFloor(), floor -> new long[2]);
            for (Bed bed : room.getBeds()) {
                counts[0]++;
                if (bed.isOccupied()) {
                    counts[1]++;
                }
            }
        }

        List<Object[]> rows = new ArrayList<>();
        grouped.forEach((floor, counts) -> rows.add(new Object[] { floor, counts[0], counts[1] }));
        return rows;
    }
}
